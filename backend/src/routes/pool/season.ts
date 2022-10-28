import express from 'express';
import { PoolSeasonData } from '../../types/dataAccess/poolData';

const prisma = global.prisma;

const router = express.Router();

/**
 * Get the home page of seasons
 */
router.get('/', async (req, res) => {
    const { user } = req;

    return res.json([
        {
            id: 1,
            name: "Thanksgiving Break 2022",
            collapsedBodyText: "You have an outgoing request for Nov 24th...",
            expandedBodyText: "Outgoing request to arrive at McNamara terminal on Wednesday, November 24th at 7pm.",
            requestId: 1,
        },
        {
            id: 2,
            name: "Winter Break 2022",
            collapsedBodyText: "Your request for Dec 24th has been fulfilled...",
            expandedBodyText: "Fulfilled request to arrive at McNamara terminal on Wednesday, November 24th at 7pm.",
            poolId: 1,
        },
        {
            id: 3,
            name: "Spring Break 2023",
            collapsedBodyText: "You haven't created a request for this yet...",
            expandedBodyText: "You haven't created a request for this season yet. Create a request and this will update.",
        },
    ] as PoolSeasonData[]);

    try {
        const activePools = await prisma.poolSeason.findMany({
            where: {
                active: true,
            },
            include: {
                PoolRequest: {
                    where: {
                        userId: user.uid,
                    }
                }
            }
        });



        return res.json(activePools);
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Something went wrong" });
    }
});

/**
 * Set pool request for a season.
 */
router.post('/:seasonId', async (req, res) => {
    const { user } = req;
    const { seasonId } = req.params;
    const { fromId, toId } = req.body;

    try {
        const sid = parseInt(seasonId);
        if (isNaN(sid)) return res.status(403).json({ error: "Bad season id formatting" });
        const checkSeasonExists = await prisma.poolSeason.findFirst({ where: { id: sid, active: true } });
        if (!checkSeasonExists) return res.status(403).json({ error: "Season does not exists or is not active."});
        const checkDup = await prisma.poolRequest.findFirst({
            where: {
                userId: user.uid,
                seasonId: sid,
            }
        });
        if (checkDup) return res.status(403).json({ error: "Invalid season id" });
        

        await prisma.poolRequest.create({
            data: {
                season: { connect: { id: sid } },
                user: { connect: { userId: user.uid }},
                from: { connect: { placeId: fromId }},
                to: { connect: { placeId: toId }},
            }
        });

        return res.status(200).json({ status: "OK" });        
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Something went wrong" })
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