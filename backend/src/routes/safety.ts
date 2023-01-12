import express from 'express';
import { resError } from '../logging';
import { getUserBlockedMessage } from '../permissions/safetyPerms';
import { BlockedUser, BlockUserResp, PostReportData } from '../types/dataAccess/safety';
import { MPOOL_USERID } from './pool/mPoolBot';

const router = express.Router();

router.post('/report', async (req, res) => {
    const { user } = req;
    const { reason, messageId, userId } = req.body as PostReportData;

    try {
        const mid = parseInt(messageId as unknown as string || "1");
        await prisma.reports.create({
            data: {
                reason: reason,
                createdBy: { connect: { userId: user.uid } },
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
                blockedById: user.uid
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
        if (user.uid === userId) {
            return res.json({
                msg: "You can't block yourself."
            } as BlockUserResp);
        };
        if (userId === MPOOL_USERID) {
            return res.json({
                msg: "You can't block this bot."
            } as BlockUserResp);
        }
        const checkExists = await prisma.blockedUser.findFirst({
            where: {
                blockedById: user.uid,
                userId: userId
            }
        })
        if (checkExists) {
            return res.json({
                msg: "You already blocked this user. You can view your blocked users in settings."
            } as BlockUserResp);
        }

        await prisma.blockedUser.create({
            data: {
                blockedBy: { connect: { userId: user.uid }},
                user: { connect: { userId }}
            },
        });

        return res.json({} as BlockUserResp);
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
        
        if (!access || access.blockedById !== user.uid) {
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