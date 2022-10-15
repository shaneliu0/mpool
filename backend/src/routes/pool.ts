import express from 'express';
import moment from 'moment';
import { Pool } from 'pg';

// @ts-ignore;
const pool: Pool = global.pool;

const router = express.Router();

const MAX_STARTING_DIST = 10;

interface Place {
    place_id: string;
    place_name: string;
    coordinates: {
        x: number;
        y: number;
    };
}

router.get('/search', async (req, res) => {

});

router.post('/', async (req, res) => {

});


/** Function to put a user into the pool that they selected.
 *  @param No parameters
 *  @returns Nothing
 */
router.post('/:poolId/join', async (req, res) => {
    await pool.query(`INSERT INTO chat_user VALUES (${req.params.poolId}, '${req.user.uid}')`);
    return res.json({ status: "OK" });
});




function parseCoordinates(coords: string): number[] {
    const [lat, lng] = coords.split(',');
    return [parseFloat(lat), parseFloat(lng)];
}

export default router;