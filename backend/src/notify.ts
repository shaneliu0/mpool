
import { NotificationType } from "./types/dataAccess/notifications";
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { logError } from "./logging";

const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

export async function pushNotification(recipientId: string, title: string, body: string, type: NotificationType, payload: any) {
    try {
        const newNotification = await prisma.notification.create({
            data: {
                recipient: { connect: { userId: recipientId } },
                title,
                body,
                type,
                payload,
            }
        });

        const pushToken = await prisma.notificationTokens.findFirst({
            where: { userId: recipientId },
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
        }]);

        await handleEmailNotifications([{
            to: pushToken.User.email,
            title: title,
            body: body,
        }]);
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
        } catch (error) {
            logError(error);
        }
    }

    return tickets;
}

interface EmailMessage {
    to: string;
    title: string;
    body: string;
}

async function handleEmailNotifications(messages: EmailMessage[]) {

}