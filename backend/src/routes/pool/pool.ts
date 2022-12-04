import express from 'express';
import seasonRouter from './season';

import { resError } from '../../logging';
import { PoolData } from '../../types/dataAccess/poolData';

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

// search for a pool
router.get('/search', async (req, res) => {

});

router.get('/:poolId', async (req, res) => {
    const { user } = req;
    const { poolId } = req.params;

    if (poolId === "1") {
        return res.json({
            poolId: 1,
            seasonName: "Winter Break 2022",
            status: "potential",
            statusMessage: "We found a potential match",
            departTime: new Date().getTime(),
            from: {
                name: "University Towers",
                coords: { latitude: 42.27524219999999, longitude: -83.73333939999999 }
            },
            to: {
                name: "McNamara Terminal",
                coords: { latitude: 42.225809, longitude: -83.3487 }
            },
            members: [
                {
                    userId: "sample-user-1",
                    name: "Shane",
                    photoUrl: "https://example.com/avatar.png",
                },
                {
                    userId: "sample-user-1",
                    name: "Shane",
                    photoUrl: "https://example.com/avatar.png"
                },
            ]
        } as PoolData);
    } else {
        return res.json({
            poolId: 1,
            seasonName: "Winter Break 2022",
            status: "confirmed",
            statusMessage: "You joined a pool with 1 other person",
            departTime: new Date().getTime(),
            from: {
                name: "Landmark Apartments",
                coords: { latitude: 42.27524219999999, longitude: -83.73333939999999 }
            },
            to: {
                name: "McNamara Terminal",
                coords: { latitude: 42.225809, longitude: -83.3487 }
            },
            members: [
                {
                    userId: "sample-user-1",
                    name: "Shane",
                    photoUrl: "https://example.com/avatar.png",
                },
                {
                    userId: "sample-user-1",
                    name: "Shane",
                    photoUrl: "https://example.com/avatar.png"
                },
            ]
        } as PoolData);
    }

    try {

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