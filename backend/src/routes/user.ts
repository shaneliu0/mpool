import express from 'express';
import { resError } from '../logging';
import { Profile } from '../types/dataAccess/users';

const router = express.Router();

const prisma = global.prisma;

router.get('/:userId/profile', async (req, res) => {
    const { user } = req;
    const { userId } = req.params;

    try {
        const resp = await getProfile(userId);
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


router.get('/profile/edit/options', async (req, res) => {
    const { user } = req;

    try {
        
    } catch (e) {
        resError(res, e);
    }
})

async function getProfile(userId: string): Promise<Profile> {
    return {
        photoUrl: "https://example.com/avatar.png",
        name: "Shane",
        description: "I'm Shane, a second-year CS student.",
        content: [
            {
                heading: "My Interests",
                tiles: ["🏓 Table Tennis", "🍣 Sashimi", "🏋️ Gym"],
            },
            {
                heading: "What I'm studying",
                text: "Major: Computer Science",
                tiles: ["EECS 376", "ASIAN 104", "STATS 250", "ASIAN 230"],
            },
            {
                heading: "\"What's the best piece of advice you've ever been given?\"",
                text: "It's harder to be nice than to be right",
            },
            {
                heading: "\"If you could choose any two famous people to have dinner with who would they be?\"",
                text: "Steve Jobs and Elon Musk",
            }
        ],
    }
}

export default router;