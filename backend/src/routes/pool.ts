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
        /**const { rows: nearbyPlaces } = await pool.query(`SELECT *
        FROM pool
        INNER JOIN (
        SELECT * FROM place ORDER BY coordinates <-> point '${currentStartPlace.coordinates}' LIMIT 12) as closest
        ON closest.place_id = pool.start_place_id`);*/

        const { rows: nearbyPlaces } = await pool.query(`SELECT * 
        FROM pool
        WHERE time > NOW() 
        ORDER BY ${time} - time DESC
        LIMIT 25`
        );
        


        /**The following code ensures that no duplicates exist.
        */
        var unique = [];
        for (var i = 0; i < nearbyPlaces.length; i++) {
            var inUnique = false;
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

        unique.sort((a, b) => {
            const [aLat, aLng] = parseCoordinates(a.coordinates);
            const [bLat, bLng] = parseCoordinates(b.coordinates);
            const [currLat, currLong] = parseCoordinates(currentStartPlace.coordinates); 
            
            const distA = Math.sqrt(Math.pow(aLat - currLat, 2) + Math.pow(aLng - currLong, 2)); 
            const distB = Math.sqrt(Math.pow(bLat - currLat, 2) + Math.pow(bLng - currLong, 2)); 
            //previous heuristic: + 0.5 * Math.abs(a.time.getTime() - b.time.getTime());
            return distA - distB;
        });

        // query again for pools

        
        return res.status(200).json(unique);
    } catch (error) {
        console.error(error);
        return res.status(500).send('Something went wrong.')
    }
});

router.post('/', async (req, res) => {

});


/** Function to put a user into the pool that they selected.
 *  @param No parameters
 *  @returns Nothing
 */
router.post('/:poolId/join', async (req, res) => 
    {   
        await pool.query(`INSERT INTO chat_user VALUES (${req.params.poolId}, '${req.user.uid}')`);
        return res.json({status: "OK"});
    });




function parseCoordinates(coords:string): number[] {
    const [lat, lng] = coords.split(',');
    return [parseFloat(lat), parseFloat(lng)];
}

export default router;