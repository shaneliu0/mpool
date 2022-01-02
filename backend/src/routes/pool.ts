import express from 'express';
import { Pool } from 'pg';

// @ts-ignore;
const pool: Pool = global.pool;

const router = express.Router();

const MAX_STARTING_DIST = 10;

interface Place {
    place_id: string;
    place_name: string;
    coordinates: string;
}

router.get('/search', async (req, res) => {
    const { time, startPlaceId, endPlaceId } = req.query;

    // we would only take those places which are within a radius of the current coordinates
    // make sure that the current start point and start place id coordinates are within 5 miles

    try {
        const { rows: currentStartPlaceRows } = await pool.query(`SELECT * from place WHERE place_id = $1`, [startPlaceId]);
        const currentStartPlace: Place = currentStartPlaceRows[0];
        // TODO: if start place doesn't exist in the database, we would have call the google api to get the coordinates

        // query for the cloest places to the current start place
        const { rows: nearbyPlaces } = await pool.query(`SELECT *
        FROM pool
        INNER JOIN (
        SELECT * FROM place ORDER BY coordinates <-> point '${currentStartPlace.coordinates}' LIMIT 12) as closest
        ON closest.place_id = pool.start_place_id`);

        const unique = [];
	for (var i = 0; i < nearbyPlaces.length; i++) {
  	//looping through unique to check if element is already present
  		var inUnique = false;
  		console.log(nearbyPlaces[i]);
  		for (var j = 0; j < unique.length; j++) {
    			if (nearbyPlaces[i].pool_id === unique[j].pool_id) {
      				inUnique = true;
      				break;
    			}
  		}
  		if (!inUnique) {
    			unique.push(nearbyPlaces[i]);
  		}
	}
        nearbyPlaces.sort((a, b) => {
            const [aLat, aLng] = parseCoordinates(a.coordinates);
            const [bLat, bLng] = parseCoordinates(b.coordinates);

            const dist = Math.hypot(aLat - bLat, aLng - bLng);

            return dist + 0.5 * Math.abs(a.time.getTime() - b.time.getTime());
        });

        // query again for pools

        
        return res.status(200).json(nearbyPlaces);
    } catch (error) {
        console.error(error);
        return res.status(500).send('Something went wrong.')
    }
});

router.post('/', async (req, res) => {

});

function parseCoordinates(coords:string): number[] {
    const [lat, lng] = coords.split(',');
    return [parseFloat(lat), parseFloat(lng)];
}

export default router;