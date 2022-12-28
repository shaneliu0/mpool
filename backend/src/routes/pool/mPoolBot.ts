import * as Logging from '../../logging';
import { sendRealtimeMessage } from '../chat';

const MPOOL_USERID = "mpool";
export async function sendPoolWelcomeMessage(poolId: number) {
    try {
        await sendRealtimeMessage(poolId, MPOOL_USERID, `Welcome to your pool!\n\nSome members might not have joined yet. I'll notify you when members join or leave.\n\nUse this chat to coordinate with your pool members.\n\nDecide on a final time and location to meet up. We also recommend the following:\n\n- Plan for your luggage\n- Exchanging phone numbers\n-Use Uber's share fare feature to split your fare.\n`)
    } catch (error) {
        Logging.logError(error);
    }
}

export async function sendMemberJoinedMessage(poolId: number, userId: string) {
    try {
        const user = await prisma.user.findFirstOrThrow({
            where: { userId: userId },
        });
        await sendRealtimeMessage(poolId, MPOOL_USERID, `${user.displayName} has joined your pool!`)
    } catch (error) {
        Logging.logError(error);
    }
}

export async function sendMemberLeftMessage(poolId: number, userId: string) {
    try {
        const user = await prisma.user.findFirstOrThrow({
            where: { userId: userId },
        });
        await sendRealtimeMessage(poolId, MPOOL_USERID, `${user.displayName} has left your pool.`)
    } catch (error) {
        Logging.logError(error);
    }
}

