import express from 'express';
import { resError } from '../../logging';
import { PoolRequestData, PoolSeasonData, PoolSeasonDetails, SubmitPoolRequestResp, ValidatePoolRequestResp } from '../../types/dataAccess/poolData';
import moment from 'moment';
import { getSeasonDestinations, placeCatEnum, updatePlace } from '../../placeAccess';
import { removeTextInParenthesis } from '../../formatHelpers';
import { onRequestMatchAttempt } from '../../matching';

const prisma = global.prisma;

const router = express.Router();

/**
 * Get the home page of seasons
 */
router.get('/', async (req:any, res) => {
    const { user } = req;

    try {
        const activePools = await prisma.poolSeason.findMany({
            where: {
                active: true,
                universityId: user.universityId,
            },
            include: {
                PoolRequest: {
                    where: {
                        userId: user.uid,
                    },
                    include: {
                        from: true,
                        to: true,
                    }
                },
                university: true,
            },
            orderBy: { endsAt: 'asc' }
        });

        return res.json(activePools.map(p => {
            let collapsedBodyText = "";
            let expandedBodyText = "";
            let poolId;
            let requestId;
            
            if (p.PoolRequest.length) {
                const poolReq = p.PoolRequest[0];
                poolReq.departTime.setHours(poolReq.departTime.getHours() + p.university.timeZoneOffsetFromEST)
                const departDate = moment(poolReq.departTime).format("MMM Do");

                if (poolReq.poolId) {
                    poolId = poolReq.poolId;
                    collapsedBodyText = `Your request for ${departDate} has been fulfilled...`;
                    expandedBodyText = `Fulfilled request to arrive at ${removeTextInParenthesis(poolReq.to.name)} on ${departDate} at ${moment(poolReq.departTime).format("h:mm a")} ${p.university.shortTimeZoneName}.`;
                } else {
                    requestId = poolReq.requestId;
                    collapsedBodyText = `You have an outgoing request for ${departDate}...`;
                    expandedBodyText = `Outgoing request to arrive at ${removeTextInParenthesis(poolReq.to.name)} on ${departDate} at ${moment(poolReq.departTime).format("h:mm a")} ${p.university.shortTimeZoneName}.`;
                }
            } else {
                collapsedBodyText = `You haven't created a request for this yet...`;
                expandedBodyText = `You haven't created a request for this season yet. Create a request and this will update.`;
            }

            return {
                id: p.id,
                name: p.name,
                collapsedBodyText,
                expandedBodyText,
                poolId,
                requestId
            };
        }) as PoolSeasonData[]);
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Something went wrong" });
    }
});

router.get('/:seasonId', async (req, res) => {
    const { user } = req;
    const { seasonId } = req.params;
    
    try {
        const sid = parseInt(seasonId);
        if (isNaN(sid)) return res.status(403).json({ error: "Bad season id formatting" });
        const sdata = await prisma.poolSeason.findFirstOrThrow({
            where: {
                id: sid,
            },
        });

        const profile = await prisma.profile.findFirst({
            where: {
                userId: user.uid,
                initialized: true,
            }
        });

        let info;

        if (!profile) {
            info = "We recommend setting up your profile before creating a request. Tap account on the bottom navigation, then edit profile to set up your profile.";
        }

        const dests = await getSeasonDestinations(sid);

        return res.json({
            id: sdata.id,
            displayTitle: sdata.name,
            destinations: dests,
            infoAlert: info,
            enforceFromAirport: sdata.enforceFromAirport,
            enforceToAirport: sdata.enforceToAirport,
            defaultTime: sdata.defaultTime.getTime(),
        } as PoolSeasonDetails)
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Something went wrong!" });
    }
});

router.post('/:seasonId', async (req, res) => {
    const { user } = req;
    const { seasonId } = req.params;
    const { departDate, fromId, toId, description } = req.body;
    
    try {
        const sid = parseInt(seasonId);
        if (isNaN(sid)) return res.status(403).json({ error: "Bad season id formatting" });
        const checkSeasonExists = await prisma.poolSeason.findFirst({ where: { id: sid, active: true } });
        if (!checkSeasonExists && sid) return res.status(403).json({ error: "Season does not exists or is not active."});
        const checkDup = await prisma.poolRequest.findFirst({
            where: {
                userId: user.uid,
                seasonId: sid,
            }
        });
        if (checkDup && sid) return res.status(403).json({ error: "Duplicate request!" });

        const valFrom = await updatePlace(fromId);
        const valTo = await updatePlace(toId);

        const newRequest = await prisma.poolRequest.create({
            data: {
                departTime: new Date(departDate),
                season: { connect: { id: sid } },
                user: { connect: { userId: user.uid }},
                from: { connect: { placeId: valFrom || fromId }},
                to: { connect: { placeId: valTo || toId }},
                description: description,
            }
        });
        await onRequestMatchAttempt(newRequest.requestId);
        return res.json({
            requestId: newRequest.requestId
        } as SubmitPoolRequestResp);
    } catch (e) {
        return resError(res, e);
    }
});

router.post('/:seasonId/validate', async (req, res) => {
    const { user } = req;
    const { seasonId } = req.params;
    const { fromId, toId } = req.body;

    try {
        const sid = parseInt(seasonId);

        const season = await prisma.poolSeason.findFirst({
            where: {
                id: sid,
            }
        });

        if (!season) return res.sendStatus(404);

        const airport_terminal = placeCatEnum.airport_terminal;

        if (season?.enforceFromAirport) {
            const from = await prisma.place.findFirst({
                where: {
                    placeId: fromId,
                    category: airport_terminal,
                }
            });

            if (!from) return res.json({ errorMsg: "You must select an airport terminal as your starting location for this season." } as ValidatePoolRequestResp);
        }

        if (season?.enforceToAirport) {
            const to = await prisma.place.findFirst({
                where: {
                    placeId: toId,
                    category: airport_terminal,
                }
            });

            if (!to) return res.json({ errorMsg: "You must select an airport terminal as your destination for this season." } as ValidatePoolRequestResp);
        }

        if (fromId === toId) return res.json({ errorMsg: "You cannot select the same location for both your starting and destination." } as ValidatePoolRequestResp);

        return res.json({} as ValidatePoolRequestResp);
    } catch (error) {
        resError(res, error);
    }
});

/**
 * Update a pool request for a season.
 */
router.patch('/:seasonId/request/:requestId', async (req, res) => {
    const { user } = req;
    const { seasonId, requestId } = req.params;
    const { fromId, toId, } = req.body;

    try {
        const sid = parseInt(seasonId);
        const rid = parseInt(requestId);
        if (isNaN(sid)) return res.status(403).json({ error: "Bad season id formatting" });
        const checkSeasonExists = await prisma.poolSeason.findFirst({ where: { id: sid, active: true }});
        if (!checkSeasonExists) return res.status(403).json({ error: "Season does not exist or is not active." });
        const alreadyExists = await prisma.poolRequest.findFirst({
            where: {
                userId: user.uid,
                seasonId: sid,
            }
        });
        if (!alreadyExists) return res.status(403).json({ error: "Invalid season id" });

        const updated = await prisma.poolRequest.update({
            data: {
                ...req.body,
            },
            where: {
                requestId: rid,
            }
        });

        return res.status(200).json(updated);
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Something went wrong" });
    }
});

export default router;