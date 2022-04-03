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
    const { time, startPlaceId, endPlaceId } = req.query;

    // we would only take those places which are within a radius of the current coordinates
    // make sure that the current start point and start place id coordinates are within 5 miles

    try {
        const { rows: test } = await pool.query(`SELECT count(*) from pool`);
        // console.log(test);

        const { rows: currentStartPlaceRows } = await pool.query(`SELECT * from place WHERE place_id = $1`, [startPlaceId]);
        // console.log(currentStartPlaceRows);
        let currentStartPlace: Place = currentStartPlaceRows[0];

        // TODO: if start place doesn't exist in the database, we would have call the google api to get the coordinates
        // query for the cloest places to the current start place
        const { x, y } = currentStartPlace.coordinates;
        const { rows: nearbyPlaces } = await pool.query(`SELECT pool.*,
        closest.coordinates,
        ( SELECT place_name from place WHERE place_id = pool.start_place_id) as start_place_name,
        ( SELECT place_name from place WHERE place_id = pool.end_place_id) as end_place_name
        FROM pool
        INNER JOIN (
        SELECT * FROM place ORDER BY coordinates <-> point '${x + ',' + y}' LIMIT 12) as closest
        ON closest.place_id = pool.start_place_id`);
        // console.log(nearbyPlaces);
        nearbyPlaces.sort((a, b) => {
            const { x: aLat, y: aLng } = a.coordinates;
            const { x: bLat, y: bLng } = b.coordinates;

            const dist = Math.hypot(aLat - bLat, aLng - bLng);

            return dist + 0.5 * Math.abs(a.time.getTime() - b.time.getTime());
        });

        // query again for pools. 


        const finalPlaces = nearbyPlaces.map(place => ({
            ...place,
            time: moment(place.time).calendar()
        }))
        
        return res.status(200).json(finalPlaces);
    } catch (error) {
        console.error(error);
        return res.status(500).send('Something went wrong.');
    }
});

router.post('/', async (req, res) => {

});

function parseCoordinates(coords:string): number[] {
    const [lat, lng] = coords.split(',');
    return [parseFloat(lat), parseFloat(lng)];
}

export default router;