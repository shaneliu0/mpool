import express from 'express';
import { resError } from '../logging';

import { Notification } from '../types/dataAccess/notifications';

const prisma = global.prisma;
const router = express.Router();

router.get('/', async (req, res) => {
    const { user } = req;
    const { offset } = req.query;

    return res.json([
        {
            notificationId: 1,
            title: "We matched you with a pool",
            body: "Decide if you want to join.",
            type: 'poolmatched',
            createdAt: new Date().getTime(),
            payload: { poolId: 1 }
        }
    ] as Notification[]);

    try {
        const resp = await prisma.notification.findMany({
            skip: offset ? parseInt(offset as string) : undefined,
            where: { recipientId: user.uid },
        });

        return res.json(resp);
    } catch (e) {
        resError(res, e);
    }
});

export default router;