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
        
        const ownRequests = await prisma.poolRequest.findMany({
            where: {
                userId: user.uid,
                // departTime: { gte: new Date(), }
            },
            include: {
                season: true,
                from: true,
                to: true,
            }
        });
        
        const sortedOnId = ownRequests[0]?.requestId || -1;

        const otherRequests = await prisma.poolRequest.findMany({
            where: {
                userId: { not: user.uid, },
                departTime: { gte: new Date() },
            },
            include: {
                season: true,
                from: true,
                to: true,
                user: true,
            }
        });

        const [
            ownFromIds,
            ownToIds,
            otherFromIds,
            otherToIds,
        ] = await Promise.all([
            getLatLngs(ownRequests.map(r => r.fromId)),
            getLatLngs(ownRequests.map(r => r.toId)),
            getLatLngs(otherRequests.map(r => r.fromId)),
            getLatLngs(otherRequests.map(r => r.toId)),
        ])

        return res.json({
            ownRequests: ownRequests.map<PoolRequestData>((r, idx) => {
                return {
                    requestId: r.requestId,
                    seasonName: r.season.name,
                    seasonId: r.seasonId,
                    statusMessage: "",
                    departTime: r.departTime.getTime(),
                    createdAt: r.createdAt.getTime(),
                    updatedAt: r.updatedAt.getTime(),
                    from: {
                        id: r.fromId,
                        name: r.from.name,
                        coords: {
                            latitude: ownFromIds[idx].latitude,
                            longitude: ownFromIds[idx].longitude,
                        }
                    },
                    to: {
                        id: r.toId,
                        name: r.to.name,
                        coords: {
                            latitude: ownToIds[idx].latitude,
                            longitude: ownToIds[idx].longitude,
                        }
                    },
                    destinations: [],
                    description: r.description || undefined,
                }
            }),
            otherRequests: otherRequests.map<HomeOtherRequest>((r, idx) => {
                return {
                    requestId: r.requestId,
                    seasonName: r.season.name,
                    seasonId: r.seasonId,
                    statusMessage: "",
                    departTime: r.departTime.getTime(),
                    createdAt: r.createdAt.getTime(),
                    updatedAt: r.updatedAt.getTime(),
                    from: {
                        id: r.fromId,
                        name: r.from.name,
                        coords: {
                            latitude: otherFromIds[idx].latitude,
                            longitude: otherFromIds[idx].longitude,
                        }
                    },
                    to: {
                        id: r.toId,
                        name: r.to.name,
                        coords: {
                            latitude: otherToIds[idx].latitude,
                            longitude: otherToIds[idx].longitude,
                        }
                    },
                    destinations: [],
                    posterName: r.user.displayName,
                    posterId: r.userId,
                    description: r.description || undefined,
                }
            }),
            sortedByRequestId: sortedOnId,
        } as HomeFeedData)
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