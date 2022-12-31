// const allowAll = Boolean(process.env.ALLOW_ALL);
const allowAll = true;
const allowedEmailEndings = [ "umich.edu" ];
export const checkUserAllowed = async (userId: string) => {
    if (allowAll) return true;
    const user = await prisma.user.findFirst({
        where: {
            userId: userId,
        }
    });
    if (!user) return false;
    const email = user.email;
    if (!email) return false;
    const emailEnding = email.split("@")[1];
    return allowedEmailEndings.includes(emailEnding);
}

export async function checkUserMiddleware(req: any, res: any, next: any) {
    try {
        const allowed = await checkUserAllowed(req.user.uid);
        if (allowed) return next();
        return res.sendStatus(403);
    } catch (error) {
        return res.sendStatus(500);
    }
}