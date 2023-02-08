import { secureGetEmailDomain } from "../formatHelpers";

const allowAll = Boolean(process.env.ALLOW_ALL);
// maps university domain to university id
type EmailMap = { [key: string]: number };
let allowedEmailEndings: EmailMap = {};
export const checkUserAllowed = async (userId: string): Promise<number | boolean> => {
    if (allowAll) return 1;
    const user = await prisma.user.findFirst({
        where: {
            userId: userId,
            deleted: false,
        }
    });
    if (!user) return false;
    const email = user.email;
    if (!email) return false;
    const emailEnding = secureGetEmailDomain(email);
    return allowedEmailEndings[emailEnding] || false;
}

export async function checkUserApplyUniversityMiddleware(req: any, res: any, next: any) {
    try {
        const allowed = await checkUserAllowed(req.user.uid);
        if (allowed) {
            req.user.universityId = allowed;
            return next();
        };
        return res.sendStatus(403);
    } catch (error) {
        return res.sendStatus(500);
    }
}

export const refreshUniversityCache = async () => {
    let newEndings = await prisma.university.findMany();
    let newEmailMap: EmailMap = {};
    newEndings.forEach((e) => {
        newEmailMap[e.emailDomain] = e.universityId;
    });
    allowedEmailEndings = { ...newEmailMap };
    console.log("Refreshed allowed email endings: ", allowedEmailEndings);
}

refreshUniversityCache();