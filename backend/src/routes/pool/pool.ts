import express from 'express';
import seasonRouter from './season';
import requestRouter from './request';

import { resError } from '../../logging';
import { PoolData, PoolPlace } from '../../types/dataAccess/poolData';
import { getCenterOfCoordinates, getLatLngs, reverseGeocodeToAddress } from '../../placeAccess';
import { Pool } from '@prisma/client';

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

router.get('/:poolId', async (req: any, res) => {
    const { user } = req;
    const { poolId } = req.params;

    try {
        const pid = parseInt(poolId);

        const pool = await prisma.pool.findFirstOrThrow({
            where: { poolId: pid },
            include: {
                users: true,
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

        const isPotential = !pool.PoolRequest.some((pr) => pr.userId === user.userId);

        if (isPotential) {
            const fromLatLngs = await getLatLngs(pool.PoolRequest.map((pr) => pr.from.name));
            const toLatLngs = await getLatLngs(pool.PoolRequest.map((pr) => pr.to.name));
            const averageTime = pool.PoolRequest.reduce((acc, pr) => acc + pr.departTime.getTime(), 0) / pool.PoolRequest.length;
            const averageFromCoords = getCenterOfCoordinates(fromLatLngs, true);
            const averageToCoords = getCenterOfCoordinates(toLatLngs, true);
            const reverseGeocodeFrom = await reverseGeocodeToAddress(averageFromCoords);
            const reverseGeocodeTo = await reverseGeocodeToAddress(averageToCoords);

            return res.json({
                poolId: 1,
                seasonName: pool.season.name,
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
                members: pool.PoolRequest.map((pr) => ({
                    userId: pr.userId,
                    name: pr.user.displayName,
                    photoUrl: pr.user.photoUrl
                }))
            } as PoolData)
        } else {
            let statusMessage = "";
            statusMessage = "You joined a pool with " + (pool.users.length - 1) + " other ";
            if (pool.users.length - 1 === 1) {
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
                const fromLatLngs = await getLatLngs(pool.PoolRequest.map((pr) => pr.from.name));
                const toLatLngs = await getLatLngs(pool.PoolRequest.map((pr) => pr.to.name));
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

            return res.json({
                poolId: 1,
                seasonName: pool.season.name,
                status: pool.PoolRequest.length > 0 ? "confirmed" : "potential",
                statusMessage,
                departTime: departStr,
                from: fromObj,
                to: toObj,
                members: pool.users.map((user) => ({
                    userId: user.userId,
                    name: user.displayName,
                    photoUrl: user.photoUrl
                }))
            } as PoolData)
        }
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