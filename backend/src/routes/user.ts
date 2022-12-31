import express from 'express';
import { resError } from '../logging';
import { CheckedInResp, Profile, ProfileContentBlock, ProfileContentPrompt } from '../types/dataAccess/users';
import admin from 'firebase-admin';
import { checkSharedPool } from '../permissions/poolPerms';
import { checkUserAllowed } from '../permissions/userPerms';

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
        const potentialProfileId = await prisma.profile.findFirst({
            where: {
                User: { some: { userId: user.uid }}
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

router.post('/profile', async (req:any, res) => {
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

router.get('/checkedin', async (req, res) => {
    const { user } = req;

    try {
        const valid = await checkUserAllowed(user.uid);
        if (!valid) {
            return res.json({
                checkedIn: true,
                errorSignOutMsg: "You need to sign in with a umich.edu Google account to access this app."
            } as CheckedInResp);
        }

        const checkedIn = await prisma.checkedIn.findFirst({
            where: {
                userId: user.uid,
            }
        });
        // if found, then the user has checked in already.
        if (!checkedIn) {
            await prisma.checkedIn.create({
                data: {
                    userId: user.uid,
                }
            })
            return res.json({
                checkedIn: false
            } as CheckedInResp);
        } else {
            return res.json({
                checkedIn: true
            } as CheckedInResp);
        }
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
    const firebaseUser = await auth.getUser(targetId);
    const sharedPool = targetId === requesterId ? true : await checkSharedPool(requesterId, targetId);
    // if shared pool then display full name. otherwise, only display first name.
    const name = sharedPool ? firebaseUser.displayName : firebaseUser.displayName?.split(' ')[0];
    return {
        photoUrl: user.photoUrl ?? firebaseUser.photoURL ?? "",
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