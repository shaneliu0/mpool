import express from 'express';
import { Pool } from 'pg';
import format from 'pg-format';
import admin from 'firebase-admin';
import { UserRecord } from 'firebase-admin/lib/auth/user-record';
import { AvailableChat } from '../types';
import moment from 'moment';
import { User } from '@prisma/client';

const auth = admin.auth();
const db = admin.database();

const prisma = global.prisma;

const router = express.Router();

function verifyUser(req: any, res: any, next: any) {
    if (!req.user) return res.status(403).json({ error: "Unauthorized" });
    next();
}

router.use(verifyUser);

const MESSAGE_PAGE_SIZE = 20;

async function retrieveMostRecentMessageFromChat(poolId: number) {
    const message = await prisma.message.findFirst({
        where: {
            pool: {
                poolId: poolId
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
    return message;
}

async function retrieveUserPhotoURLs(poolId: number) {
    const users = await prisma.pool.findUniqueOrThrow({
        where: { poolId: poolId },
        include: {
            users: true,
        }
    }).then(pool => pool.users);
    const photoUrls = await Promise.all(users.map(u => auth.getUser(u.userId)));
    return photoUrls;
}

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
router.get('/', async (req, res) => {
    const { user } = req;
    const { offset } = req.query;

    try {
        const availablePools = await prisma.pool.findMany({
            include: {
                users: {
                    where: {
                        userId: user.uid
                    }
                },
                message: {
                    take: 1,
                    orderBy: {
                        createdAt: "desc"
                    }
                }
            },
        });
        console.log(availablePools);
        const linedUpRecentMessage = await Promise.all(availablePools.map((pool) => {
            return retrieveMostRecentMessageFromChat(pool.poolId);
        }));

        const linedUpChatPhotoURLs = await Promise.all(availablePools.map(async (pool) => {
            const photoURLs = (await retrieveUserPhotoURLs(pool.poolId)).filter((u) => u.uid !== user.uid).map(u => u.photoURL);
            return photoURLs;
        }));

        const formatPools = (achats: typeof availablePools) => achats.map((pool, idx) => {
            return {
                id: pool.poolId,
                name: pool.name,
                lastMessage: truncateMessage(linedUpRecentMessage[idx]?.content, 24),
                lastMessageTime: linedUpRecentMessage[idx]?.createdAt && moment(linedUpRecentMessage[idx]?.createdAt).calendar(),
                avatars: linedUpChatPhotoURLs[idx]
            }
        });
        console.log(formatPools(availablePools));
        return res.json(formatPools(availablePools));
    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong.');
    }
});

// query params: offset: start @message id
// returns up to 20 most recent chat messsages in this conversation.
router.get('/:poolId', async (req, res) => {
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
                users: {
                    where: {
                        userId: user.uid
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
        });

        const senders = new Set();
        messages.forEach(m => {
            senders.add(m.senderId);
        });

        const users = await Promise.all([...senders].map((sender: any) => {
            return auth.getUser(sender);
        }));

        // map it to IMessage
        return res.json(messages.map((message) => {
            const foundUser = users.find(e => e.uid === message.senderId);

            return {
                _id: message.messageId,
                text: message.content,
                createdAt: message.createdAt,
                user: {
                    _id: foundUser?.uid,
                    name: foundUser?.displayName,
                    avatar: foundUser?.photoURL
                },
            }
        }));
    } catch (e) {
        console.error(e);
        res.status(500).send('Something went wrong.');
    }
});

router.post('/:poolId', async (req, res) => {
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
                users: {
                    where: {
                        userId: user.uid
                    }
                }
            }
        });
        if (!verifyPermission) return res.status(403).send('Unauthorized.');

        const message = await prisma.message.create({
            data: {
                content: text,
                senderId: user.uid,
                poolId: parseInt(poolId)
            },
        });

        const userRecord = await auth.getUser(user.uid);

        // TODO: send a push notification to all users in the chat.
        // translate to prisma
        const poolWithUsers = await prisma.pool.findUniqueOrThrow({
            where: {
                poolId: parseInt(poolId),
            },
            include: {
                users: true
            }
        });
        const poolUsers = poolWithUsers.users;

        // remove the sender's id from the realtime update recipients
        poolUsers.forEach(({ userId }) => {
            pushRealTimeUpdate(userId, 'message', poolId, {
                _id: message.messageId,
                text,
                createdAt: message.createdAt.toISOString(),
                user: {
                    _id: user.uid,
                    name: userRecord.displayName,
                    avatar: userRecord.photoURL
                }
            });
        })

        // returns a copy of the message obj.
        return res.json({
            _id: message.messageId,
            text: text,
            createdAt: message.createdAt,
            user: {
                _id: userRecord.uid,
                name: userRecord.displayName,
                avatar: userRecord.photoURL
            }
        })

    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong.');
    }
});

export default router;