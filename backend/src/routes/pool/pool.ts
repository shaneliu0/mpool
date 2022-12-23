import express from 'express';
import seasonRouter from './season';
import requestRouter from './request';

import { resError } from '../../logging';
import { PoolData, PoolPlace, postPoolRequest } from '../../types/dataAccess/poolData';
import { getCenterOfCoordinates, getLatLngs, reverseGeocodeToAddress } from '../../placeAccess';
import { Pool, PoolRequest } from '@prisma/client';

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

router.use('/season', seasonRouter);
router.use('/request', requestRouter);

// search for a pool
router.get('/search', async (req, res) => {

});

router.get('/potential/:matchId', async (req:any, res) => {
    const { user } = req;
    const { matchId } = req.params;

    try {
        const mid = parseInt(matchId);
        const match = await prisma.potentialMatch.findFirstOrThrow({
            where: { potentialMatchId: mid }
        });
        if (match.userId) {
            const pr = await getSimulatedPoolFromPartner(match.seasonId, user.uid, match.userId);
            return res.json(pr as PoolData);
        } else if (match.poolId) {
            const pr = await getMatchedPool(match.poolId);
            return res.json(pr as PoolData);
        } else {
            throw new Error("Couldn't locate match.")
        }
    } catch (error) {
        resError(res, error);
    }
});

async function getMatchedPool(pid: number): Promise<PoolData | null> {
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
            }
        }
    });
    if (!pool.PoolRequest.length) return null;
    let statusMessage = "";
    statusMessage = "You joined a pool with " + (pool.PoolRequest.length - 1) + " other ";
    if (pool.PoolRequest.length - 1 === 1) {
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
            name: reverseGeocodeFrom,
            id: "",
            coords: averageFromCoords
        };
        toObj = {
            name: reverseGeocodeTo,
            id: "",
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

    return ({
        poolId: 1,
        seasonName: pool.season.name,
        status: pool.PoolRequest.length > 0 ? "confirmed" : "potential",
        statusMessage,
        departTime: departStr,
        from: fromObj,
        to: toObj,
        members: pool.PoolRequest.map(({ user }) => ({
            userId: user.userId,
            name: user.displayName,
            photoUrl: user.photoUrl
        }))
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
        poolId: 1,
        seasonName: curUserRequest.season.name,
        status: "potential",
        statusMessage: "We found a potential match.\n\nDisplayed times and locations aren't final.\n\nCheck them off to confirm the tentative time and location.",
        departTime: averageTime,
        from: {
            name: reverseGeocodeFrom,
            coords: averageFromCoords
        },
        to: {
            name: reverseGeocodeTo,
            coords: averageToCoords
        },
        members: [
            {
                userId: partnerRequest.user.userId,
                name: partnerRequest.user.displayName.split(' ')[0],
                photoUrl: partnerRequest.user.photoUrl,
            },
            {
                userId: curUserRequest.user.userId,
                name: curUserRequest.user.displayName,
                photoUrl: curUserRequest.user.photoUrl,
            }
        ]
    } as PoolData;
}


router.get('/:poolId', async (req: any, res) => {
    const { user } = req;
    const { poolId } = req.params;

    try {
        const pid = parseInt(poolId);
        const poolD = await getMatchedPool(pid);
        if (!poolD) throw new Error("Something went wrong.");
        return res.json(poolD);
    } catch (error) {
        resError(res, error);
    }
});

/** Function to put a user into the pool that they selected.
 *  @param No parameters
 *  @returns Nothing
 */
router.post('/:poolId/join', async (req, res) => {

    return res.json({ status: "OK" });
});

function parseCoordinates(coords: string): number[] {
    const [lat, lng] = coords.split(',');
    return [parseFloat(lat), parseFloat(lng)];
}

export default router;