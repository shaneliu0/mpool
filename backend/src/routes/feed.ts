import express from 'express';
import { checkUserApplyUniversityMiddleware } from '../permissions/userPerms';
import { resError } from '../logging';
import { HomeFeedData, HomeOtherRequest, PoolRequestData, ReplyToRequest } from '../types/dataAccess/poolData';
import { getLatLngs } from '../placeAccess';
import sgMail from '@sendgrid/mail';
import moment from 'moment';

const router = express.Router();

router.use(checkUserApplyUniversityMiddleware);

router.get('/', async (req, res) => {
    const { user } = req;
    const { sortedById } = req.query;

    try {
        
    } catch (error) {
        resError(res, error);
    }
});

router.post('/request/:requestId', async (req, res) => {
    const { user } = req;
    const { requestId } = req.params;
    const { message } = req.body as ReplyToRequest;
    
    try {
        const sender = await prisma.user.findFirstOrThrow({ where: { userId: user.uid }});
        const request = await prisma.poolRequest.findFirstOrThrow({ where: { requestId: parseInt(requestId) }, include: { user: true, from: true, to: true }});

        const leavingTimeDisplay = moment(request.departTime).format("MMMM Do YYYY, h:mm a");

        const msg: sgMail.MailDataRequired = {
            to: request.user.email,
            cc: sender.email,
            from: 'noreply@example.com',
            subject: `Reply to your pool request leaving on ${leavingTimeDisplay} from ${sender.displayName}`,
            text: message,
            html: `<h4>You received a reply to your pool request which is leaving on ${leavingTimeDisplay}</h4><p>${message}</p>`,
        }

        await sgMail.send(msg);

        const msgToSender: sgMail.MailDataRequired = {
            to: sender.email,
            from: 'noreply@example.com',
            subject: "Reply sent!",
            text: `Your reply to ${request.user.displayName} has been sent!`,
            html: `<h4>Your reply to ${request.user.displayName} has been sent!</h4><p>${message}</p><p>We have CC'ed you on the email.</p>`,
        }

        await sgMail.send(msgToSender);

        return res.sendStatus(200);
    } catch (error) {
        resError(res, error);
    }
})

export default router;