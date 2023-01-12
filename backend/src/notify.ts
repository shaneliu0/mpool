
import { NotificationType } from "./types/dataAccess/notifications";
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { logError } from "./logging";
import sgMail from '@sendgrid/mail';
import ms from "ms";

const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

const tokenProcessingQueue: ExpoPushTicket[] = [];
const ticketIdToPushToken = new Map<string, string>();

// async function processTokenQueue() {
//     if (tokenProcessingQueue.length === 0) return;

//     const tickets = tokenProcessingQueue.splice(0, tokenProcessingQueue.length);
//     // @ts-ignore
//     const receiptIds = tickets.map(t => t.id);

//     try {
//         const receipts = await expo.getPushNotificationReceiptsAsync(receiptIds);
//         let ticketIdx = 0;
//         for (const receiptId in receipts) {
//             const { status, details } = receipts[receiptId];
//             if (status === 'error') {
//                 if (details?.error === 'DeviceNotRegistered') {
//                     await prisma.notificationTokens.updateMany({
//                         where: { expoPushToken: details.expoPushToken },
//                         data: { disabled: true }
//                     });
//                 }
//             }
//             ticketIdx++;
//         }
//     } catch (error) {
//         logError(error);
//     }
// }

// setTimeout(() => {
//     processTokenQueue();
// }, ms('15m'))

export async function pushAndEmailPersistent(recipientId: string, title: string, body: string, type: NotificationType, payload?: any) {
    try {
        await prisma.notification.create({
            data: {
                recipient: { connect: { userId: recipientId } },
                title,
                body,
                type,
                payload,
            }
        });

        const pushToken = await prisma.notificationTokens.findFirst({
            where: { userId: recipientId, disabled: false },
            include: {
                User: true,
            }
        });

        if (!pushToken) return logError("Couldn't find push token for user " + recipientId);
        if (!Expo.isExpoPushToken(pushToken.expoPushToken)) return logError("Invalid push token for user " + recipientId);

        await batchAndHandleNotifications([{
            to: pushToken.expoPushToken,
            title: title,
            body: body,
            data: payload,
            sound: "default",
        }]);

        await handleEmailNotifications([{
            to: pushToken.User.email,
            title: title,
            content: body,
        }]);
    } catch (error) {
        logError(error);
    }
}

export async function batchSendPushNotifications(recipientIds: string[], title: string, body: string, payload?: any) {
    try {
        const pushTokens = await prisma.notificationTokens.findMany({
            where: { userId: { in: recipientIds } },
            include: {
                User: true,
            }
        });

        const messages: ExpoPushMessage[] = [];
        for (const pushToken of pushTokens) {
            if (!Expo.isExpoPushToken(pushToken.expoPushToken)) {
                logError("Invalid push token for user " + pushToken.userId);
                continue;
            }

            messages.push({
                to: pushToken.expoPushToken,
                title: title,
                body: body,
                data: payload,
                sound: "default",
            });
        }

        await batchAndHandleNotifications(messages);
    } catch (error) {
        logError(error);
    }
}

async function batchAndHandleNotifications(messages: ExpoPushMessage[]) {
    let chunks = expo.chunkPushNotifications(messages);
    let tickets: ExpoPushTicket[] = [];
    for (let chunk of chunks) {
        try {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            console.log(ticketChunk);
            tickets.push(...ticketChunk);

            let ticketIdx = 0;
            for (let ticket of tickets) {
                if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
                    await prisma.notificationTokens
                        .updateMany({
                            // @ts-ignore
                            where: { expoPushToken: Array.isArray(messages[ticketIdx].to) ? messages[ticketIdx].to[0] : messages[ticketIdx].to },
                            data: { disabled: true }
                        });
                }
                ticketIdx++;
            }
        } catch (error) {
            logError(error);
        }
    }
}

interface StandardEmailMessage {
    to: string;
    title: string;
    content: string;
}
const MPOOL_EMAIL = "mpool@example.com";
async function handleEmailNotifications(messages: StandardEmailMessage[]) {
    return;
    messages.forEach((msg) => {
        sgMail.send({
            to: msg.to, // Change to your recipient
            from: MPOOL_EMAIL, // Change to your verified sender
            subject: msg.title,
            text: msg.content,
            html: `<strong>${msg.content}</strong>`,
        }).then(() => {
            console.log("Sent email to " + msg.to);
        }).catch(e => logError(e));
    });
}