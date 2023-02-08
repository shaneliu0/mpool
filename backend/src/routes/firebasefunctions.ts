import { PrismaClientRustPanicError } from '@prisma/client/runtime';
import express from 'express';
import { getProfileImageUrl } from '../formatHelpers';
import { resError } from '../logging';

const router = express.Router();

router.post('/createuser', async (req, res) => {
    try {
        if (req.headers['server_recipient_key'] !== process.env.FIREBASE_FUNCTIONS_RECIPIENT) return res.sendStatus(200);
        
        const { uid, email, displayName, photoURL } = req.body;
        console.log("perma setting for user " + displayName + " with uid " + uid);
        
        const processedPhotoUrl = getProfileImageUrl(photoURL, uid);
        const userPotentialProfile = await prisma.profile.findFirst({
            where: {
                User: { some: { userId: uid } }
            }
        })
        await prisma.user.upsert({
            where: {
                userId: uid,
            },
            update: {
                email: email,
                displayName: displayName,
                photoUrl: processedPhotoUrl,
            },
            create: {
                email: email,
                displayName: displayName,
                photoUrl: processedPhotoUrl,
                userId: uid,
                Profile: {
                    connectOrCreate: {
                        where: { profileId: userPotentialProfile?.profileId || -1 },
                        create: {
                            description: "",
                            initialized: false,
                            userId: uid,
                        }
                    }
                }
            }
        });

        return res.sendStatus(200);
    } catch (error) {
        resError(res, error);
    }
})

export default router;