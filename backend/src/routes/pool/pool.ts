import express from 'express';
import seasonRouter from './season';

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