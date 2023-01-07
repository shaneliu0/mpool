import express from 'express';
import { resError } from '../logging';
import { BlockedUser, PostReportData } from '../types/dataAccess/safety';

const router = express.Router();

router.post('/report', async (req, res) => {
    const { user } = req;
    const { reason, messageId, userId } = req.body as PostReportData;

    try {
        const mid = parseInt(messageId as unknown as string || "1");
        await prisma.reports.create({
            data: {
                reason: reason,
                createdBy: { connect: { userId: user.userId } },
                message: messageId ? { connect: { messageId: mid } } : undefined,
                user: userId ? { connect: { userId: userId } } : undefined
            }
        });

        res.sendStatus(200);
    } catch (error) {
        resError(res, error);
    }
});

router.get('/block', async (req:any, res) => {
    const { user } = req;

    try {
        const bresp = await prisma.blockedUser.findMany({
            where: {
                blockedById: user.userId
            },
            include: {
                user: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return res.json(bresp.map((d, idx) => {
            return {
                blockedAt: d.createdAt.getTime(),
                blockId: d.blockId,
                photoURL: d.user.photoUrl,
                userId: d.user.userId,
                displayName: d.user.displayName.split(' ')[0],
            }
        }) as BlockedUser[]);
    } catch (error) {
        resError(res, error);
    }
});

router.post('/block/:userId', async (req, res) => {
    const { user } = req;
    const { userId } = req.params;

    try {
        await prisma.blockedUser.create({
            data: {
                blockedById: user.userId,
                userId: userId
            }
        });

        return res.sendStatus(200);
    } catch (error) {
        resError(res, error);
    }
});

router.delete('/block/:blockId', async (req, res) => {
    const { user } = req;
    const { blockId } = req.params;

    try {
        const bid = parseInt(blockId);
        if (isNaN(bid)) {
            return res.sendStatus(400);
        }
        const access = await prisma.blockedUser.findUnique({
            where: {
                blockId: bid,
            },
        });

        if (!access || access.blockedById !== user.userId) {
            return res.sendStatus(403);
        }
        
        await prisma.blockedUser.delete({
            where: {
                blockId: bid,
            },
        });

        return res.sendStatus(200);
    } catch (error) {
        resError(res, error);
    }
});

export default router;