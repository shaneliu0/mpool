

// rid: requesterId
// tid: user who the requester is attempting to interact with
export async function getUserBlockedMessage(rid: string, tid: string): Promise<string | boolean> {
    const blockedUser = await prisma.blockedUser.findFirst({
        where: {
            OR: [
                {
                    blockedById: rid,
                    userId: tid
                },
                {
                    blockedById: tid,
                    userId: rid
                }
            ]
        }
    });

    if (blockedUser && blockedUser.blockedById === rid) {
        return "You have blocked this user, so you can't view this. You can unblock them in settings.";
    }
    if (blockedUser) {
        return "You can't view this."
    }

    return false;
}