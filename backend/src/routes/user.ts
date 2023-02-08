import express from 'express';
import { resError } from '../logging';
import { CheckedInResp, defaultProfile, Profile, ProfileContentBlock, ProfileContentPrompt, UniversityDataResp } from '../types/dataAccess/users';
import admin from 'firebase-admin';
import { checkSharedPool } from '../permissions/poolPerms';
import { checkUserAllowed } from '../permissions/userPerms';
import { getUserBlockedMessage } from '../permissions/safetyPerms';
import { MPOOL_USERID } from './pool/mPoolBot';
import { newLineNameIfNeeded, secureGetEmailDomain } from '../formatHelpers';

const auth = admin.auth();

const router = express.Router();

const prisma = global.prisma;

router.get('/updatevalidate', async (req, res) => {
    const { user } = req;

    try {
        const {
            name,
            // picture,
            email,
            uid
        } = user;
        const picture = `https://avatars.dicebear.com/api/bottts/${uid}.png`;
        // const picture = `https://source.boringavatars.com/marble/256/${uid}`; // this is an svg
        const potentialProfileId = await prisma.profile.findFirst({
            where: {
                User: { some: { userId: user.uid } }
            }
        });
        await prisma.user.upsert({
            where: { userId: user.uid },
            create: {
                displayName: name || "",
                email: email || "",
                photoUrl: picture || "",
                userId: uid,
                Profile: {
                    connectOrCreate: {
                        where: { profileId: potentialProfileId?.profileId || -1 },
                        create: {
                            description: "",
                            initialized: false,
                            userId: user.uid,
                        }
                    }
                }
            },
            update: {
                photoUrl: picture || "",
                userId: uid,
                Profile: {
                    connectOrCreate: {
                        where: { profileId: potentialProfileId?.profileId || -1 },
                        create: {
                            description: "",
                            initialized: false,
                            userId: user.uid,
                        }
                    }
                }
            }
        });

        return res.sendStatus(200);
    } catch (error) {
        resError(res, error);
    }
});

router.get('/:userId/profile', async (req, res) => {
    const { user } = req;
    const { userId } = req.params;

    try {
        if (userId === MPOOL_USERID) {
            return res.json({
                ...defaultProfile,
                errorMsg: "This bot does not have a profile."
            } as Profile);
        }
        const blockMsg = await getUserBlockedMessage(user.uid, userId);
        if (blockMsg) {
            return res.json({
                ...defaultProfile,
                errorMsg: blockMsg,
            } as Profile);
        }
        const resp = await getProfile(user.uid, userId);
        return res.json(resp);
    } catch (e) {
        resError(res, e);
    }
});

router.get('/profile', async (req, res) => {
    const { user } = req;

    try {
        const resp = await getProfile(user.uid);
        return res.json(resp);
    } catch (e) {
        resError(res, e);
    }
});

router.post('/profile', async (req: any, res) => {
    const { user } = req;
    const profile: Profile = req.body;

    try {
        if (JSON.stringify(profile).length > 10000) return res.sendStatus(400);

        // create new profile
        const newProfile = await prisma.profile.create({
            data: {
                User: { connect: { userId: user.uid } },
                description: profile.description,
                content: {
                    createMany: {
                        data: profile.content.map(c => {
                            return {
                                promptId: c.promptId,
                                text: c.text ? c.text : null,
                            }
                        })
                    }
                },
                initialized: true,
                userId: user.uid,
            },
            include: {
                content: true,
            }
        });

        const ptiles: { content: string, profileContentId: number }[] = [];
        profile.content.forEach((c, idx) => {
            if (!c.tiles) return;
            c.tiles.forEach(t => {
                ptiles.push({
                    content: t,
                    profileContentId: newProfile.content[idx].profileContentId,
                })
            })
        })

        await prisma.contentTile.createMany({
            data: ptiles.map(t => {
                return {
                    content: t.content,
                    profileContentProfileContentId: t.profileContentId,
                }
            })
        });

        const updatedProfile = await getProfile(user.uid);

        return res.json(updatedProfile);
    } catch (error) {
        resError(res, error);
    }
});

router.get('/profile/edit/prompts', async (req, res) => {
    const { user } = req;

    try {
        const prompts = await prisma.prompt.findMany();
        return res.json(prompts.map(p => {
            return {
                title: p.name,
                promptId: p.promptId
            }
        }));
    } catch (e) {
        resError(res, e);
    }
});

const TOS_URL = "https://www.katoritech.com/mpool/legal/end-user-license-agreement";
router.get('/checkedin', async (req, res) => {
    const { user } = req;

    try {
        const valid = await checkUserAllowed(user.uid);
        if (!valid) {
            const valUniversities = await prisma.university.findMany();
            const domains = valUniversities.map(u => u.emailDomain).join(", ");
            return res.json({
                checkedIn: true,
                tosUrl: TOS_URL,
                welcomeData: [],
                errorSignOutMsg: `You need to sign in with a Google account from the following to access this app: ${domains}`
            } as CheckedInResp);
        }

        const checkedIn = await prisma.checkedIn.findFirst({
            where: {
                userId: user.uid,
            }
        });
        // if found, then the user has checked in already.
        if (!checkedIn) {
            await prisma.checkedIn.upsert({
                where: { userId: user.uid },
                create: { userId: user.uid },
                update: { userId: user.uid },
            });
            return res.json({
                checkedIn: false,
                tosUrl: TOS_URL,
                welcomeData: [
                    {
                        heading: "Pools",
                        content: [
                            "You can create a pool request in a season.",
                            "After a request is created, we will attempt to find a match for you.",
                            "We try to match you with other people traveling in the same direction to the same airport terminal who are leaving at the closest time and location to you.",
                            "As we get closer to your departure date, we loosen up the matching criteria so it's more likely that you find a match.",
                            "We'll send a notification when we find a match.",
                            "When a match is found, you will see the location and time that is closest to everyone. You can accept the match or decline and wait for a new match.",
                            "You can view your match by tapping the notification bell.",
                            "When you join a pool, your name is shared with your pool members.",
                        ]
                    },
                    {
                        heading: "Profiles",
                        content: [
                            "Create your profile in the account screen.",
                            "You can add a description to your profile",
                            "You can also add content to your profile, such as your interests and what you're studying.",
                        ]
                    }
                ],
            } as CheckedInResp);
        } else {
            return res.json({
                checkedIn: true,
                tosUrl: TOS_URL,
                welcomeData: [
                    {
                        heading: "Pools",
                        content: [
                            "You can create a pool request in a season.",
                            "After a request is created, we will attempt to find a match for you.",
                            "We try to match you with other people traveling in the same direction to the same airport terminal who are leaving at the closest time and location to you.",
                            "As we get closer to your departure date, we loosen up the matching criteria so it's more likely that you find a match.",
                            "We'll send a notification when we find a match.",
                            "When a match is found, you will see the location and time that is closest to everyone. You can accept the match or decline and wait for a new match.",
                            "You can view your match by tapping the notification bell.",
                            "When you join a pool, your name is shared with your pool members.",
                        ]
                    },
                    {
                        heading: "Profiles",
                        content: [
                            "Create your profile in the account screen.",
                            "You can add a description to your profile",
                            "You can also add content to your profile, such as your interests and what you're studying.",
                        ]
                    }
                ],
            } as CheckedInResp);
        }
    } catch (error) {
        resError(res, error);
    }
});

router.post('/accepttos', async (req, res) => {
    const { user } = req;

    try {
        await prisma.checkedIn.upsert({
            where: { userId: user.uid },
            create: { userId: user.uid },
            update: { userId: user.uid },
        });

        return res.sendStatus(200);
    } catch (error) {
        return resError(res, error);
    }
});

router.delete('/', async (req, res) => {
    const { user } = req;

    try {
        await prisma.user.update({
            where: {
                userId: user.uid,
            },
            data: {
                deleted: true,
            }
        });

        await auth.deleteUser(user.uid);

        return res.sendStatus(200);
    } catch (error) {
        resError(res, error);
    }
});

router.get('/university', async (req, res) => {
    const { user } = req;

    try {
        if (!user.uid) return res.sendStatus(403);
        const vuser = await prisma.user.findUniqueOrThrow({
            where: {
                userId: user.uid,
            }
        });

        const userEmailEnding = secureGetEmailDomain(vuser.email);

        const university = await prisma.university.findFirst({
            where: {
                emailDomain: userEmailEnding,
            }
        });

        if (!university) return res.json({} as UniversityDataResp);

        return res.json({
            universityName: university.name,
            universityColors: university.colorsObject,
        } as UniversityDataResp)
    } catch (error) {
        resError(res, error);
    }
});

async function getProfile(requesterId: string, requestedId?: string): Promise<Profile> {
    const targetId = requestedId || requesterId;
    const user = await prisma.user.findFirstOrThrow({
        where: { userId: targetId },
        include: {
            Profile: {
                include: {
                    content: {
                        include: {
                            tiles: true,
                            prompt: true,
                        }
                    },
                }
            }
        }
    });
    const sharedPool = targetId === requesterId ? true : await checkSharedPool(requesterId, targetId);
    // if shared pool then display full name. otherwise, only display first name.
    const name = newLineNameIfNeeded(sharedPool ? user.displayName : user.displayName?.split(' ')[0]);
    return {
        photoUrl: user.photoUrl ?? "",
        name: name ?? "",
        description: user.Profile.description,
        content: user.Profile.content.map(c => {
            return {
                heading: c.prompt.name,
                promptId: c.promptId,
                text: c.text ?? undefined,
                tiles: c.tiles.map(t => t.content ?? "")
            }
        })
    }
}

const defaultContent: ProfileContentBlock[] = [
    {
        heading: "My Interests",
        promptId: 1,
        tiles: ["🏓 Table Tennis", "🍣 Sashimi", "🏋️ Gym"],
    },
    {
        heading: "What I'm studying",
        promptId: 2,
        text: "Major: Computer Science",
        tiles: ["EECS 376", "ASIAN 104", "STATS 250", "ASIAN 230"],
    },
    {
        heading: "\"What's the best piece of advice you've ever been given?\"",
        promptId: 3,
        text: "It's harder to be nice than to be right",
    },
    {
        heading: "\"If you could choose any two famous people to have dinner with who would they be?\"",
        promptId: 4,
        text: "Steve Jobs and Elon Musk",
    }
];

const defaultPrompts: ProfileContentPrompt[] = [
    { title: "Clubs I'm in", promptId: 1 },
    { title: "Where I'm from", promptId: 2 },
    { title: `"If there was one problem in the world you could solve, what would it be?"`, promptId: 3 },
    { title: `"If you could choose any two famous people to have dinner with who would they be?"`, promptId: 4 },
]

export default router;