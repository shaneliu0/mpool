import express from 'express';
import { Pool } from 'pg';
import format from 'pg-format';
import admin from 'firebase-admin';
import { UserRecord } from 'firebase-admin/lib/auth/user-record';
import { AvailableChat } from '../types';
import moment from 'moment';

const auth = admin.auth();
const db = admin.database();

// @ts-ignore;
const pool: Pool = global.pool;

const router = express.Router();

async function retrieveMostRecentMessageFromChat(chatId: string) {
    const query = format(
        'SELECT * FROM message WHERE chat_id = %L ORDER BY created_at DESC LIMIT 1',
        chatId
    );
    const result = await pool.query(query);
    return result.rows[0];
}

async function retrieveUsersFromChatId(chatId: number) {
    const { rows: chatUsers } = await pool.query(`SELECT * from chat_user
                                                    WHERE chat_id = $1`, [chatId]);
    const users = await Promise.all([...chatUsers].map((sender: any) => {
        return auth.getUser(sender.user_id);
    }));
    return users;
}

async function pushRealTimeUpdate(userId: string, type: string, chatId: string, data: any) {
    // using firebase realtime database:
    // db -> type -> userId -> data
    const ref = db.ref(`${userId}/${type}/${chatId}`);
    await ref.set(data);
}

// truncate a message to a certain length and add ellipsis
function truncateMessage(message: string, length: number) {
    if (message && message.length > length) {
        return message.substring(0, length) + '...';
    }
    return message;
}

// get the chats that the user has available to them, including the most recent sent message.
router.get('/', async (req, res) => {
    const { user } = req;
    const { offset } = req.query;

    if (!user) return res.status(403).send('Unauthorized.');

    try {
        const { rows: availableChats } = await pool.query(`SELECT * from chat_user
                                                            INNER JOIN chat
                                                            ON chat_user.chat_id = chat.chat_id
                                                            AND chat_user.user_id = $1`, [user.uid]);

        // retrieve the most recent message for each chat
        const linedUpRecentMessage = await Promise.all(availableChats.map((chat) => {
            return retrieveMostRecentMessageFromChat(chat.chat_id);
        }));
        const linedUpChatPhotoURLs = await Promise.all(availableChats.map(async (chat) => {
            const users = (await retrieveUsersFromChatId(chat.chat_id)).filter((u) => u.uid !== user.uid);
            return users.map((user: UserRecord) => user.photoURL);
        }));

        const formatChats = (achats: any[]) => achats.map((chat, idx) => {
            return {
                id: chat.chat_id,
                name: chat.name,
                lastMessage: truncateMessage(linedUpRecentMessage[idx]?.text, 24),
                lastMessageTime: linedUpRecentMessage[idx]?.created_at && moment(linedUpRecentMessage[idx].created_at).calendar(),
                avatars: linedUpChatPhotoURLs[idx]
            }
        });

        return res.json(formatChats(availableChats));
    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong.');
    }
});

// query params: offset: start @message id
// returns up to 20 most recent chat messsages in this conversation.
router.get('/:chatId', async (req, res) => {
    const { user } = req;
    const { offset } = req.query;
    const { chatId } = req.params;

    if (!user) return res.status(403).send('Unauthorized.');

    try {
        // verify that the user belongs to the requested chat
        const { rows: verifyInChat } = await pool.query(`SELECT 1 from chat_user WHERE user_id = $1 AND chat_id = $2`, [user.uid, chatId]);
        if (verifyInChat.length === 0) {
            return res.status(403).send('User isn\'t in the chat. Forbidden.');
        }
        const { rows: messages } = await pool.query(`SELECT * from message 
                                                    WHERE chat_id = $1
                                                    ORDER BY created_at DESC
                                                    LIMIT 20
                                                    OFFSET $2`, [chatId, offset ?? 0]);

        const senders = new Set();
        messages.forEach(row => {
            senders.add(row.sender_id);
        });
        const users = await Promise.all([...senders].map((sender: any) => {
            return auth.getUser(sender);
        }));

        // map it to IMessage
        return res.json(messages.map((chatRow: any, idx: any) => {
            const foundUser = users.find(e => e.uid === chatRow.sender_id);

            return {
                _id: chatRow.message_id,
                text: chatRow.text,
                createdAt: chatRow.created_at,
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

router.post('/:chat_id', async (req, res) => {
    const { user } = req;
    const { text } = req.body;
    const { chat_id } = req.params;

    if (!user) return res.status(403).send('Unauthorized.');

    try {
        // verify that the user belongs to the requested chat
        const { rows: verifyInChat } = await pool.query(`SELECT 1 from chat_user WHERE user_id = $1 AND chat_id = $2`, [user.uid, chat_id]);
        if (verifyInChat.length === 0) {
            return res.status(403).send('User isn\'t in the chat. Forbidden.');
        }

        const { rows: sendResp } = await pool.query(`INSERT INTO message
                                                        (chat_id, text, sender_id)
                                                        VALUES ($1, $2, $3)
                                                        RETURNING message_id, created_at`, [chat_id, text, user.uid]);

        const userRecord = await auth.getUser(user.uid);

        // TODO: send a push notification to all users in the chat.
        const { rows: chatUsers } = await pool.query(`SELECT * from chat_user
                                                        WHERE chat_id = $1`, [chat_id]);
        // remove the sender's id from the realtime update recipients
        chatUsers.forEach(({ user_id }) => {
            pushRealTimeUpdate(user_id, 'message', chat_id, {
                _id: sendResp[0].message_id,
                text,
                createdAt: sendResp[0].created_at.toISOString(),
                user: {
                    _id: user.uid,
                    name: userRecord.displayName,
                    avatar: userRecord.photoURL
                }
            });
        })

        // returns a copy of the message obj.
        return res.json({
            _id: sendResp[0].message_id,
            text: text,
            createdAt: sendResp[0].created_at,
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