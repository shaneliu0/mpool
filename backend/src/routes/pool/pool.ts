import express from 'express';
import seasonRouter from './season';
import requestRouter from './request';

import { resError } from '../../logging';
import { defaultPoolData, GetPoolStatusResp, MatchedPoolId, PoolData, PoolMember, PoolPlace, postPoolRequest } from '../../types/dataAccess/poolData';
import { getCenterOfCoordinates, getLatLngs, reverseGeocodeToAddress } from '../../placeAccess';
import { Pool, PoolRequest } from '@prisma/client';
import { pushAndEmailPersistent } from '../../notify';
import * as MPoolBot from './mPoolBot';
import { checkCanAccessMatch, checkCanAccessPool } from '../../permissions/poolPerms';
import { checkUserApplyUniversityMiddleware } from '../../permissions/userPerms';

const prisma = global.prisma;

const router = express.Router();

const MAX_STARTING_DIST = 10;

/* 
    if time diff is more than 4 hours apart, then don't match
    destination less than 2 miles apart
    starting is less than 2 miles apart

    now match on interest:
*/
const LOC_WEIGHT = 0.60;
const TIME_WEIGHT = 0.20;
const INTERESTS_WEIGHT = 0.20;

router.use(checkUserApplyUniversityMiddleware);

router.use('/season', seasonRouter);
router.use('/request', requestRouter);

// search for a pool
// router.get('/search', async (req, res) => {

// });

router.get('/potential/:matchId', async (req: any, res) => {
    const { user } = req;
    const { matchId } = req.params;

    try {
        const mid = parseInt(matchId);
        if (!(await checkCanAccessMatch(user.uid, mid))) {
            return res.sendStatus(403);
        }
        const match = await prisma.potentialMatch.findFirstOrThrow({
            where: { potentialMatchId: mid },
            include: {
                users: true,
                derivedPool: {
                    include: {
                        PoolRequest: true,
                    },
                }
            }
        });

        if (match.declined) {
            return res.json({
                ...defaultPoolData,
                error: "This match was declined by a user. We're back on finding a match for you."
            })
        }
        if (match.derivedPool?.disabled) {
            return res.json({
                ...defaultPoolData,
                error: "This pool no longer exists."
            } as PoolData);
        }
        let joined = match.derivedPool && match.derivedPool.PoolRequest.some(r => r.userId == user.uid);
        if (match.users.length) {
            const partnerId = match.users[0].userId === user.uid ? match.users[1].userId : match.users[0].userId;
            const pr = await getSimulatedPoolFromPartner(match.seasonId, user.uid, partnerId);
            return res.json({
                ...pr,
                statusMessage: joined ? 'You already joined this pool.' : pr.statusMessage,
                status: joined ? 'confirmed' : 'potential',
            } as PoolData);
        } else if (match.poolId) {
            const pr = await getMatchedPool(match.poolId, user.uid);
            if (!pr) throw new Error();
            return res.json({
                ...pr,
                statusMessage: joined ? 'You already joined this pool.' : pr.statusMessage,
                status: joined ? 'confirmed' : 'potential',
            } as PoolData);
        } else {
            throw new Error("Couldn't locate match.")
        }
    } catch (error) {
        console.log(error);
        const mid = parseInt(matchId);
        if (mid) {
            await prisma.potentialMatch.delete({
                where: { potentialMatchId: mid }
            });
        }
        return res.json({
            ...defaultPoolData,
            error: "This match is no longer available.",
        });
    }
});

router.post('/potential/:matchId/accept', async (req, res) => {
    const { user } = req;
    const { matchId } = req.params;

    try {
        const mid = parseInt(matchId);
        await acceptMatchRequest(mid, user.uid);

        return res.sendStatus(200);
    } catch (error) {
        resError(res, error);
    }
});

export async function acceptMatchRequest(matchId: number, requesterId: string) {
    const mid = Number(matchId);
    if (!(await checkCanAccessMatch(requesterId, mid))) {
        throw new Error("Unauthorized");
    }
    const match = await prisma.potentialMatch.findFirstOrThrow({
        where: { potentialMatchId: mid },
        include: { users: true }
    });
    let describedPool;
    if (match.users.length) {
        const partnerId = match.users[0].userId === requesterId ? match.users[1].userId : match.users[0].userId;
        describedPool = await getSimulatedPoolFromPartner(match.seasonId, requesterId, partnerId);
    } else if (match.poolId) {
        describedPool = await getMatchedPool(match.poolId, requesterId);
    }
    if (!describedPool) throw new Error("Couldn't locate match.");

    const poolRequest = await prisma.poolRequest.findFirstOrThrow({
        where: {
            userId: requesterId,
            seasonId: match.seasonId,
        }
    });

    if (match.derivedPoolId) {
        await prisma.pool.update({
            where: { poolId: match.derivedPoolId },
            data: {
                PoolRequest: {
                    connect: { requestId: poolRequest.requestId }
                }
            }
        });
        await MPoolBot.sendMemberJoinedMessage(match.derivedPoolId, requesterId);
    } else {
        const createdPool = await prisma.pool.create({
            data: {
                season: { connect: { id: match.seasonId } },
                departTime: new Date(describedPool.departTime),
                from: { connect: { placeId: describedPool.from.id } },
                to: { connect: { placeId: describedPool.to.id } },
                DerivedFromMatch: { connect: { potentialMatchId: match.potentialMatchId } },
                PoolRequest: { connect: { requestId: poolRequest.requestId } }
            }
        });
        await MPoolBot.sendPoolWelcomeMessage(createdPool.poolId);
        await MPoolBot.sendMemberJoinedMessage(createdPool.poolId, requesterId);
    }
}

router.post('/potential/:matchId/decline', async (req, res) => {
    const { user } = req;
    const { matchId } = req.params;

    try {
        // if it was a one person match onto an existing pool, then just mark the match as declined
        // if it was a multi person match together, mark the match as declined, then notify the other person
        // if the pool still only had one person, then also delete the pool.

        const mid = parseInt(matchId);
        if (!(await checkCanAccessMatch(user.uid, mid))) {
            return res.sendStatus(403);
        }
        const match = await prisma.potentialMatch.findFirstOrThrow({
            where: { potentialMatchId: mid },
            include: { users: true }
        });
        if (match.users.length > 1) {
            if (match.derivedPoolId) {
                const pool = await prisma.pool.findFirstOrThrow({
                    where: { poolId: match.derivedPoolId },
                    include: { PoolRequest: true }
                });
                if (pool.PoolRequest.length < 2) {
                    await disableAndNotifyPool(match.derivedPoolId);
                }
            }

            await prisma.potentialMatch.update({
                where: { potentialMatchId: mid },
                data: { declined: true }
            });
        } else {
            await prisma.potentialMatch.update({
                where: { potentialMatchId: mid },
                data: { declined: true }
            });
        }
        return res.sendStatus(200);
    } catch (error) {
        resError(res, error);
    }
});

router.get('/potential/:matchId/pool', async (req, res) => {
    const { user } = req;
    const { matchId } = req.params;

    try {
        const mid = parseInt(matchId);
        if (!(await checkCanAccessMatch(user.uid, mid))) {
            return res.sendStatus(403);
        }
        const match = await prisma.potentialMatch.findFirstOrThrow({
            where: { potentialMatchId: mid },
            include: { users: true }
        });

        if (!match.derivedPoolId) {
            return res.json({
                poolId: -1,
                error: "Couldn't locate pool!"
            } as MatchedPoolId)
        }

        return res.json({
            poolId: match.derivedPoolId
        } as MatchedPoolId);
    } catch (error) {
        resError(res, error);
    }
});

export async function getMatchedPool(pid: number, requesterId: string): Promise<PoolData | null> {
    const pool = await prisma.pool.findFirstOrThrow({
        where: { poolId: pid },
        include: {
            season: true,
            from: true,
            to: true,
            PoolRequest: {
                include: {
                    from: true,
                    to: true,
                    user: true
                }
            },
            PotentialMatch: {
                where: { declined: false },
                include: { users: true }
            },
            DerivedFromMatch: {
                where: { declined: false },
                include: { users: true }
            }
        }
    });
    if (!pool.PoolRequest.length) return null;
    let statusMessage = "";
    statusMessage = "You joined a pool with " + (pool.PoolRequest.length - 1) + " other ";
    if (pool.PoolRequest.length - 1 === 0) {
        statusMessage = "You're the first one in this pool.\n\nInvited users are shown below and they will receive messages you send in the chat."
    }
    else if (pool.PoolRequest.length - 1 === 1) {
        statusMessage += "person";
    }
    else {
        statusMessage += "people";
    }

    let departStr: number;
    let fromObj: PoolPlace;
    let toObj: PoolPlace;

    // update pool if there is no departTime or from/to
    if (!pool.departTime || !pool.fromId || !pool.toId) {
        const fromLatLngs = await getLatLngs(pool.PoolRequest.map((pr) => pr.from.placeId));
        const toLatLngs = await getLatLngs(pool.PoolRequest.map((pr) => pr.to.placeId));
        const averageTime = pool.PoolRequest.reduce((acc, pr) => acc + pr.departTime.getTime(), 0) / pool.PoolRequest.length;
        const averageFromCoords = getCenterOfCoordinates(fromLatLngs, true);
        const averageToCoords = getCenterOfCoordinates(toLatLngs, true);
        const reverseGeocodeFrom = await reverseGeocodeToAddress(averageFromCoords);
        const reverseGeocodeTo = await reverseGeocodeToAddress(averageToCoords);

        departStr = new Date(averageTime).getTime();
        fromObj = {
            name: reverseGeocodeFrom.formatted_address,
            id: reverseGeocodeFrom.place_id,
            coords: averageFromCoords
        };
        toObj = {
            name: reverseGeocodeTo.formatted_address,
            id: reverseGeocodeTo.place_id,
            coords: averageToCoords
        };
    } else {
        const fromLatLngs = await getLatLngs([pool.fromId]);
        const toLatLngs = await getLatLngs([pool.toId]);

        departStr = pool.departTime.getTime();
        fromObj = {
            name: pool.from?.name || "",
            id: pool.fromId,
            coords: fromLatLngs[0]
        };
        toObj = {
            name: pool.to?.name || "",
            id: pool.toId,
            coords: toLatLngs[0]
        };
    }
    const memberRes: PoolMember[] = [];
    const includedUids = new Set<string>();
    let inPool = false;
    for (const pr of pool.PoolRequest) {
        includedUids.add(pr.userId);
        if (pr.userId === requesterId) {
            inPool = true;
        }
        memberRes.push({
            userId: pr.user.userId,
            name: pr.user.displayName,
            photoUrl: pr.user.photoUrl,
        });
    }

    for (const match of pool.DerivedFromMatch) {
        for (const user of match.users) {
            if (includedUids.has(user.userId)) continue;
            includedUids.add(user.userId);
            memberRes.push({
                userId: user.userId,
                name: user.displayName,
                photoUrl: user.photoUrl,
                status: "potential"
            });
        }
    }

    for (const match of pool.PotentialMatch) {
        for (const user of match.users) {
            if (includedUids.has(user.userId)) continue;
            includedUids.add(user.userId);
            memberRes.push({
                userId: user.userId,
                name: user.displayName,
                photoUrl: user.photoUrl,
                status: "potential"
            });
        }
    }

    return ({
        poolId: 1,
        seasonName: pool.season.name,
        status: inPool ? "confirmed" : "potential",
        statusMessage,
        departTime: departStr,
        from: fromObj,
        to: toObj,
        members: memberRes,
    } as PoolData)
}

async function getSimulatedPoolFromPartner(seasonId: number, curUserId: string, partnerId: string): Promise<PoolData> {
    const partnerRequest = await prisma.poolRequest.findFirstOrThrow({
        where: {
            seasonId,
            userId: partnerId,
        },
        include: {
            from: true,
            to: true,
            user: true,
        }
    });
    const curUserRequest = await prisma.poolRequest.findFirstOrThrow({
        where: {
            seasonId,
            userId: curUserId,
        },
        include: {
            from: true,
            to: true,
            user: true,
            season: true,
        }
    })

    const fromLatLngs = await getLatLngs([partnerRequest.from.placeId, curUserRequest.from.placeId]);
    const toLatLngs = await getLatLngs([partnerRequest.to.placeId, curUserRequest.to.placeId]);
    const averageTime = (curUserRequest.departTime.getTime() + partnerRequest.departTime.getTime()) / 2;
    const averageFromCoords = getCenterOfCoordinates(fromLatLngs, true);
    const averageToCoords = getCenterOfCoordinates(toLatLngs, true);
    const reverseGeocodeFrom = await reverseGeocodeToAddress(averageFromCoords);
    const reverseGeocodeTo = await reverseGeocodeToAddress(averageToCoords);

    return {
        poolId: -1,
        seasonName: curUserRequest.season.name,
        status: "potential",
        statusMessage: "We found a potential match.\n\nDisplayed times and locations aren't final.\n\nCheck them off to confirm the tentative time and location.",
        departTime: averageTime,
        from: {
            name: reverseGeocodeFrom.formatted_address,
            id: reverseGeocodeFrom.place_id,
            coords: averageFromCoords
        },
        to: {
            name: reverseGeocodeTo.formatted_address,
            id: reverseGeocodeTo.place_id,
            coords: averageToCoords
        },
        members: [
            {
                userId: partnerRequest.user.userId,
                name: partnerRequest.user.displayName.split(' ')[0],
                photoUrl: partnerRequest.user.photoUrl,
                status: partnerRequest.poolId ? undefined : "potential",
            },
            {
                userId: curUserRequest.user.userId,
                name: curUserRequest.user.displayName,
                photoUrl: curUserRequest.user.photoUrl,
                status: curUserRequest.poolId ? undefined : "potential",
            }
        ]
    } as PoolData;
}

router.get('/:poolId', async (req: any, res) => {
    const { user } = req;
    const { poolId } = req.params;

    try {
        const pid = parseInt(poolId);
        if (!(await checkCanAccessPool(user.uid, pid))) {
            return res.sendStatus(403);
        }
        const poolD = await getMatchedPool(pid, user.uid);
        if (!poolD) throw new Error("Something went wrong.");
        return res.json(poolD);
    } catch (error) {
        resError(res, error);
    }
});

router.get('/:poolId/status', async (req: any, res) => {
    const { user } = req;
    const { poolId } = req.params;

    try {
        const pid = parseInt(poolId);
        if (!(await checkCanAccessPool(user.uid, pid))) {
            return res.sendStatus(403);
        }
        const pool = await prisma.pool.findFirstOrThrow({
            where: { poolId: pid },
            include: {
                PoolRequest: {
                    where: {
                        userId: user.uid,
                    }
                },
                DerivedFromMatch: {
                    where: {
                        users: {
                            some: {
                                userId: user.uid,
                            }
                        },
                        declined: false,
                    }
                },
                PotentialMatch: {
                    where: {
                        users: {
                            some: {
                                userId: user.uid,
                            }
                        },
                        declined: false,
                    }
                },
            }
        });
        const inPool = pool.PoolRequest.length > 0;
        if (inPool) {
            return res.json({});
        }

        let matchId;

        if (pool.DerivedFromMatch.length > 0) {
            matchId = pool.DerivedFromMatch[0].potentialMatchId;
        } else if (pool.PotentialMatch.length > 0) {
            matchId = pool.PotentialMatch[0].potentialMatchId;
        } else {
            throw new Error("Something went wrong.");
        }

        return res.json({
            matchId,
        } as GetPoolStatusResp);
    } catch (error) {
        resError(res, error);
    }
});

router.delete('/:poolId', async (req, res) => {
    const { user } = req;
    const { poolId } = req.params;

    try {
        const pid = parseInt(poolId);
        if (!(await checkCanAccessPool(user.uid, pid))) {
            return res.sendStatus(403);
        }
        const poolRequest = await prisma.poolRequest.findFirstOrThrow({
            where: {
                userId: user.uid,
                poolId: pid,
            }
        })
        await prisma.poolRequest.update({
            where: { requestId: poolRequest.requestId },
            data: {
                poolId: null,
            }
        });

        const updatedPool = await prisma.pool.findFirstOrThrow({
            where: { poolId: pid },
            include: {
                PoolRequest: true
            }
        });
        if (updatedPool?.PoolRequest.length < 2) {
            await disableAndNotifyPool(updatedPool.poolId);
        } else {
            await MPoolBot.sendMemberLeftMessage(updatedPool.poolId, user.uid)
        }
        return res.sendStatus(200);
    } catch (error) {
        resError(res, error);
    }
});

async function disableAndNotifyPool(poolId: number) {
    const pool = await prisma.pool.update({
        where: { poolId },
        data: {
            disabled: true,
        },
        include: { season: true }
    });
    const remainingRequests = await prisma.poolRequest.findMany({
        where: {
            poolId,
        },
        include: {
            user: true,
        }
    });

    await Promise.all(remainingRequests.map(async ({ user, ...request }) => {
        await pushAndEmailPersistent(
            user.userId,
            `Your pool ${pool.season.name} has been disabled`,
            "Your pool has been disabled because there are not enough members to form a pool. We're looking for a new match for you.",
            "info",
            {}
        );
        await prisma.poolRequest.update({
            where: {
                requestId: request.requestId,
            },
            data: {
                poolId: null,
            }
        });
    }))
}

export async function getAllPoolMembers(poolId: number): Promise<PoolMember[]> {
    const pool = await prisma.pool.findFirstOrThrow({
        where: { poolId: poolId },
        include: {
            PoolRequest: {
                include: { user: true }
            },
            DerivedFromMatch: {
                where: {
                    declined: false,
                },
                include: { users: true }
            },
            PotentialMatch: {
                where: {
                    declined: false,
                },
                include: { users: true }
            },
        }
    });

    const memberRes: PoolMember[] = [];
    const includedUids = new Set<string>();

    for (const pr of pool.PoolRequest) {
        includedUids.add(pr.userId);
        memberRes.push({
            userId: pr.user.userId,
            name: pr.user.displayName,
            photoUrl: pr.user.photoUrl,
        });
    }

    for (const match of pool.DerivedFromMatch) {
        for (const user of match.users) {
            if (includedUids.has(user.userId)) continue;
            includedUids.add(user.userId);
            memberRes.push({
                userId: user.userId,
                name: user.displayName,
                photoUrl: user.photoUrl,
                status: "potential"
            });
        }
    }

    for (const match of pool.PotentialMatch) {
        for (const user of match.users) {
            if (includedUids.has(user.userId)) continue;
            includedUids.add(user.userId);
            memberRes.push({
                userId: user.userId,
                name: user.displayName,
                photoUrl: user.photoUrl,
                status: "potential"
            });
        }
    }
    return memberRes;
}

export default router;