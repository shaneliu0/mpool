import express from 'express';
import { checkUserApplyUniversityMiddleware } from '../permissions/userPerms';
import { ContactBlurbResp } from '../types/dataAccess/static';

const router = express.Router();

router.use(checkUserApplyUniversityMiddleware);

router.get('/contactblurb', async (req, res) => {
    return res.json({
        blurb: `If you have any questions or comments feel free to contact me at contact@example.com.`
    } as ContactBlurbResp)
});

export default router;
