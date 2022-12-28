import express from "express";
import moment from "moment";
import { removeTextInParenthesis } from "../../formatHelpers";
import { resError } from "../../logging";
import { checkCanAccessRequest } from "../../permissions/poolPerms";
import { getSeasonDestinations, getLatLngs, updatePlace, placeCatEnum } from "../../placeAccess";
import { PoolRequestData, UpdatePoolRequestData, ValidateUpdatePoolRequestResp } from "../../types/dataAccess/poolData";

const router = express.Router();

router.get('/:requestId', async (req, res) => {
    const { user } = req;
    const { requestId } = req.params;

    try {
        const rid = parseInt(requestId);
        if (!(await checkCanAccessRequest(user.uid, rid))) {
            return res.sendStatus(403);
        }
        const request = await prisma.poolRequest.findFirst({
            where: {
                requestId: rid,
            },
            include: {
                from: true,
                to: true,
                season: true,
                user: true,
            }
        });
        if (!request) return res.status(403).json({ error: "Request does not exist." });

        let statusMessage = "You created a pool request ";
        if (Date.now() - request.createdAt.getTime() < 5 * 60 * 1000) {
            statusMessage += "just now.";
        } else {
            statusMessage += moment(request.createdAt).fromNow() + ".";
        }

        const dests = await getSeasonDestinations(request.seasonId);

        const [fromLoc, toLoc] = await getLatLngs([request.from.placeId, request.to.placeId]);

        return res.json({
            requestId: request.requestId,
            seasonName: request.season.name,
            seasonId: request.season.id,
            statusMessage,
            createdAt: request.createdAt.getTime(),
            updatedAt: request.updatedAt.getTime(),
            departTime: request.departTime.getTime(),
            from: {
                name: removeTextInParenthesis(request.from.name),
                id: request.from.placeId,
                coords: { latitude: fromLoc.latitude, longitude: fromLoc.longitude }
            },
            to: {
                name: removeTextInParenthesis(request.to.name),
                id: request.to.placeId,
                coords: { latitude: toLoc.latitude, longitude: toLoc.longitude }
            },
            destinations: dests,
        } as PoolRequestData)
    } catch (e) {
        return resError(res, e);
    }
});

router.put('/:requestId', async (req, res) => {
    const { user } = req;
    const { requestId } = req.params;
    const { departDate, fromId, toId } = (req.body as UpdatePoolRequestData)

    try {
        const rid = parseInt(requestId);
        if (!(await checkCanAccessRequest(user.uid, rid))) {
            return res.sendStatus(403);
        }
        if (fromId) await updatePlace(fromId);
        if (toId) await updatePlace(toId);

        await prisma.poolRequest.update({
            where: { requestId: rid },
            data: {
                departTime: departDate ? new Date(departDate) : undefined,
                from: fromId ? { connect: { placeId: fromId } } : undefined,
                to: toId ? { connect: { placeId: toId } } : undefined,
            },
        });

        return res.sendStatus(200);
    } catch (e) {
        resError(res, e);
    }
});

router.delete('/:requestId', async (req, res) => {
    const { user } = req;
    const { requestId } = req.params;

    try {
        const rid = parseInt(requestId);
        if (!(await checkCanAccessRequest(user.uid, rid))) {
            return res.sendStatus(403);
        }
        await prisma.poolRequest.delete({
            where: { requestId: rid },
        });

        return res.sendStatus(200);
    } catch (error) {
        resError(res, error);
    }
});

router.post('/:requestId/validate', async (req, res) => {
    const { user } = req;
    const { requestId } = req.params;
    const { departDate, fromId, toId } = (req.body as UpdatePoolRequestData)

    try {
        const rid = parseInt(requestId);

        if (fromId) await updatePlace(fromId);
        if (toId) await updatePlace(toId);

        let newFrom;
        if (fromId) {
            newFrom = await prisma.place.findFirst({
                where: {
                    placeId: fromId,
                }
            });
        }
        let newTo;
        if (toId) {
            newTo = await prisma.place.findFirst({
                where: {
                    placeId: toId,
                }
            });
        }

        const originalRequest = await prisma.poolRequest.findFirstOrThrow({
            where: { requestId: rid },
            include: {
                from: true,
                to: true,
            }
        });

        const newFromCategory = newFrom?.category || originalRequest.from.category;
        const newToCategory = newTo?.category || originalRequest.to.category;

        if (![newFromCategory, newToCategory].includes(placeCatEnum.airport_terminal)) {
            return res.json({
                errorMsg: "Couldn't save: Either pickup or destination location must be an airport terminal. Change the other location and it will save."
            } as ValidateUpdatePoolRequestResp);
        }
        return res.json({} as ValidateUpdatePoolRequestResp);
    } catch (error) {
        resError(res, error);
    }
});

export default router;