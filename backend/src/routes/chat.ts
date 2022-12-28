import express from 'express';
import { Pool } from 'pg';
import format from 'pg-format';
import admin from 'firebase-admin';
import { UserRecord } from 'firebase-admin/lib/auth/user-record';
import { AvailableChat } from '../types';
import moment from 'moment';
import { User } from '@prisma/client';
import { logError, resError } from '../logging';
import { batchSendPushNotifications, pushAndEmailPersistent } from '../notify';
import { getAllPoolMembers } from './pool/pool';
import { checkUserMiddleware } from '../permissions/userPerms';

const auth = admin.auth();
const db = admin.database();

const prisma = global.prisma;

const router = express.Router();

router.use(checkUserMiddleware);


const MESSAGE_PAGE_SIZE = 20;

async function pushRealTimeUpdate(userId: string, type: string, chatId: string, data: any) {
    // using firebase realtime database:
    // db -> type -> userId -> data
    const ref = db.ref(`${userId}/${type}/${chatId}`);
    await ref.set(data);
}

// truncate a message to a certain length and add ellipsis
function truncateMessage(message: string | undefined, length: number) {
    if (!message) message = "";
    if (message && message.length > length) {
        return message.substring(0, length) + '...';
    }
    return message;
}

// get the chats that the user has available to them, including the most recent sent message.
router.get('/', async (req: any, res) => {
    const { user } = req;
    const { offset } = req.query;

    try {
        const availablePools = await prisma.pool.findMany({
            where: {
                PoolRequest: {
                    some: {
                        userId: user.userId
                    }
                },
                disabled: false,
            },
            include: {
                PoolRequest: {
                    include: { user: true }
                },
                PotentialMatch: {
                    where: { declined: false },
                    include: { users: true }
                },
                DerivedFromMatch: {
                    where: { declined: false },
                    include: { users: true }
                },
                message: {
                    take: 1,
                    orderBy: {
                        createdAt: "desc"
                    }
                },
                season: true,
            },
        });

        availablePools.sort((a, b) => {
            if (!a.message[0] && !b.message[0]) return 0;
            if (!a.message[0]) return -1;
            if (!b.message[0]) return 1;
            return b.message[0].createdAt.getTime() - a.message[0].createdAt.getTime();
        });

        const formatPools = (achats: typeof availablePools) => achats.map((pool, idx) => {
            const photoRes: string[] = [];
            const includedUids = new Set<string>();
            for (const pr of pool.PoolRequest) {
                includedUids.add(pr.userId);
                photoRes.push(pr.user.photoUrl);
            }
        
            for (const match of pool.DerivedFromMatch) {
                for (const user of match.users) {
                    if (includedUids.has(user.userId)) continue;
                    includedUids.add(user.userId);
                    photoRes.push(user.photoUrl);
                }
            }
        
            for (const match of pool.PotentialMatch) {
                for (const user of match.users) {
                    if (includedUids.has(user.userId)) continue;
                    includedUids.add(user.userId);
                    photoRes.push(user.photoUrl);
                }
            }
            return {
                id: pool.poolId,
                name: pool.season.name,
                lastMessage: truncateMessage(pool.message[0]?.content, 24) || "No messages yet.",
                lastMessageTime: pool.message[0]?.createdAt && moment(pool.message[0]?.createdAt).calendar(),
                avatars: photoRes,
            }
        });
        return res.json(formatPools(availablePools));
    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong.');
    }
});

// query params: offset: start @message id
// returns up to 20 most recent chat messsages in this conversation.
router.get('/:poolId', async (req: any, res) => {
    const { user } = req;
    const { offset } = req.query;
    const { poolId } = req.params;

    if (!user) return res.status(403).send('Unauthorized.');

    try {
        const verifyPermission = await prisma.pool.findUnique({
            where: {
                poolId: parseInt(poolId),
            },
            include: {
                PoolRequest: {
                    where: {
                        userId: user.userId
                    }
                }
            }
        });
        if (!verifyPermission) return res.status(403).send('Unauthorized.');

        const messages = await prisma.message.findMany({
            skip: parseInt(offset as string) || 0,
            take: MESSAGE_PAGE_SIZE,
            where: {
                poolId: parseInt(poolId)
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                sender: true,
            }
        });

        // map it to IMessage
        return res.json(messages.map((message) => {
            return {
                _id: message.messageId,
                text: message.content,
                createdAt: message.createdAt,
                user: {
                    _id: message.sender.userId,
                    name: message.sender.displayName,
                    avatar: message.sender.photoUrl
                },
            }
        }));
    } catch (e) {
        console.error(e);
        res.status(500).send('Something went wrong.');
    }
});

router.post('/:poolId', async (req: any, res) => {
    const { user } = req;
    const { text } = req.body;
    const { poolId } = req.params;

    if (!user) return res.status(403).send('Unauthorized.');

    try {
        const verifyPermission = await prisma.pool.findUnique({
            where: {
                poolId: parseInt(poolId),
            },
            include: {
                PoolRequest: {
                    where: {
                        userId: user.uid
                    }
                }
            }
        });
        if (!verifyPermission) return res.status(403).send('Unauthorized.');
        const pid = parseInt(poolId);
        const rmessage = await sendRealtimeMessage(pid, user.uid, text);
        return res.json(rmessage);
    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong.');
    }
});

router.post('/:poolId/markread', async (req, res) => {
    const { user } = req;
    const { poolId } = req.params;

    try {
        const verifyPermission = await prisma.pool.findUnique({
            where: {
                poolId: parseInt(poolId),
            },
            include: {
                PoolRequest: {
                    where: {
                        userId: user.userId
                    }
                }
            }
        });
        if (!verifyPermission) return res.status(403).send('Unauthorized.');

        const pid = parseInt(poolId);

        await prisma.unreadMessage.deleteMany({
            where: {
                userId: user.uid,
                poolId: pid,
            }
        });

        return res.sendStatus(200);
    } catch (error) {
        resError(res, error);
    }
});

export async function sendRealtimeMessage(poolId: number, fromId: string, content: string) {
    const message = await prisma.message.create({
        data: {
            content: content,
            senderId: fromId,
            poolId: poolId
        },
        include: {
            sender: true,
        }
    });

    const poolMembers = await getAllPoolMembers(poolId);

    const allUids: string[] = poolMembers.map(m => m.userId);


    await Promise.all(allUids.map(async (userId) => {
        if (userId === fromId) return;
        await prisma.unreadMessage.upsert({
            where: {
                userId_poolId: {
                    userId: userId,
                    poolId: poolId,
                }
            },
            update: {},
            create: {
                userId: userId,
                poolId: poolId,
            }
        })
    }));

    // remove the sender's id from the realtime update recipients
    allUids.forEach((userId) => {
        // push realtime update to firebase realtime
        pushRealTimeUpdate(userId, 'message', poolId.toString(), {
            _id: message.messageId,
            text: content,
            createdAt: message.createdAt.toISOString(),
            user: {
                _id: message.sender.userId,
                name: message.sender.displayName,
                avatar: message.sender.photoUrl,
            }
        });
    });

    // if there is no read ping from the user within 3 seconds, send a push notification
    const READ_PING_TIMEOUT = 3000;
    setTimeout(async () => {
        try {
            const unread = await prisma.unreadMessage.findMany({
                where: {
                    poolId: poolId,
                }
            });
            const unreadUsers = unread.map(({ userId }) => userId);
            await batchSendPushNotifications(unreadUsers, `MPool`, `[${message.sender.displayName}]: ${content}`);
        } catch (error) {
            logError(error);
        }
    }, READ_PING_TIMEOUT);

    return {
        _id: message.messageId,
        text: message.content,
        createdAt: message.createdAt,
        user: {
            _id: message.sender.userId,
            name: message.sender.displayName,
            avatar: message.sender.photoUrl
        }
    }
}

export default router;