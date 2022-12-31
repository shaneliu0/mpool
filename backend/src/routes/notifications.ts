import express from 'express';
import { resError } from '../logging';
import { checkUserMiddleware } from '../permissions/userPerms';

import { Notification, RegisterNotificationData } from '../types/dataAccess/notifications';

const prisma = global.prisma;
const router = express.Router();

router.use(checkUserMiddleware);

router.get('/', async (req, res) => {
    const { user } = req;
    const { offset } = req.query;

    // return res.json([
    //     {
    //         notificationId: 1,
    //         title: "We matched you with a pool",
    //         body: "Decide if you want to join.",
    //         type: 'poolmatched',
    //         createdAt: (() => { let d =  new Date(); d.setDate(d.getDate() - 2); return d.getTime() })(),
    //         payload: { matchId: 1, }
    //     }
    // ] as Notification[]);

    try {
        const resp = await prisma.notification.findMany({
            skip: offset ? parseInt(offset as string) : undefined,
            where: { recipientId: user.uid },
            orderBy: { createdAt: 'desc' },
        });

        return res.json(resp.map(e => {
            return {
                notificationId: e.notificationId,
                title: e.title,
                body: e.body,
                type: e.type,
                createdAt: e.createdAt.getTime(),
                payload: e.payload,
            } as Notification;
        }));
    } catch (e) {
        resError(res, e);
    }
});

router.post('/register', async (req, res) => {
    const { user } = req;
    const { expoPushToken } = req.body as RegisterNotificationData;

    try {
        await prisma.notificationTokens.upsert({
            where: { userId: user.uid },
            update: { expoPushToken, disabled: false },
            create: { User: { connect: { userId: user.uid } }, expoPushToken, disabled: false }
        });
        res.sendStatus(200);
    } catch (e) {
        resError(res, e);
    }
});

export default router;