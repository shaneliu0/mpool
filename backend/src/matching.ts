
import { PoolRequest, Prisma } from "@prisma/client";
import { getCorrectDate } from "./formatHelpers";
import { getLatLngs, placeCatEnum } from "./placeAccess";
import { PoolRequestData } from "./types/dataAccess/poolData";
import { pushAndEmailPersistent } from "./notify";
import ms from 'ms';
import { logError } from "./logging";

// the two user ids, sorted then joined.
const duplicateCheck = new Set<string>();

const refreshIntervalCallback = () => {
    refreshAndPotentiallyMatchAll();
    console.log('refreshed and matched all');
}
console.log('refreshed and matched all');
refreshAndPotentiallyMatchAll();
setInterval(refreshIntervalCallback, ms('30m'));

export async function refreshAndPotentiallyMatchAll() {
    // requests still need matching if they are not either:
    // 1. already have a pool
    // 2. have a potential match
    duplicateCheck.clear();
    const unfulfilledRequests = await prisma.poolRequest.findMany({
        where: {
            season: {
                active: true,
            },
            poolId: null,
            user: {
                PotentialMatch: {
                    none: { // there are no potential matches that have a derivedpool that i
                        AND: [
                            { declined: false },
                            {
                                OR: [ // if one of these are true, the pool request does not need fulfilling.
                                    { derivedPoolId: null },
                                    { derivedPool: { disabled: false } },
                                ],
                            }
                        ]
                    }
                }
            }
        }
    });

    for (const req of unfulfilledRequests) {
        let strengthFloor = 0.5;
        const daysFromDepart = (req.departTime.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
        strengthFloor *= daysFromDepart / 7;
        await onRequestMatchAttempt(req.requestId, strengthFloor);
    }
}

async function onRequestMatchAttempt(requestId: number, curStrengthFloor: number = 0.5) {
    try {
        const req = await prisma.poolRequest.findFirstOrThrow({
            where: { requestId: requestId },
            include: { season: true },
        })
        const prelimMatches = await getPotentialUserMatches(req.requestId);
        if (prelimMatches.length === 0) return;
        const orderedMatches = getOrderedMatchesByStrength(req, prelimMatches);
        if (orderedMatches[0].strength < curStrengthFloor) return;
        const matchHash = [req.userId, orderedMatches[0].userId].sort().join('-');
        if (duplicateCheck.has(matchHash)) return;
        duplicateCheck.add(matchHash);
        const newPotentialMatch = await prisma.potentialMatch.create({
            data: {
                users: {
                    connect: [
                        { userId: req.userId },
                        { userId: orderedMatches[0].userId },
                    ]
                },
                seasonId: req.seasonId,
            }
        });

        const ntitle = `We have a potential pool for ${req.season.name}`;
        const nbody = `Match strength: ${orderedMatches[0].strength * 100}%. Decide if you want to join.`;
        console.log("Matched " + req.userId + " with " + orderedMatches[0].userId);
        pushAndEmailPersistent(
            req.userId,
            ntitle,
            nbody,
            "poolmatched",
            { matchId: newPotentialMatch.potentialMatchId }
        );

        pushAndEmailPersistent(
            orderedMatches[0].userId,
            ntitle,
            nbody,
            "poolmatched",
            { matchId: newPotentialMatch.potentialMatchId }
        );
    } catch (error) {
        logError(error);
    }
}
// sample-user-1
// pushNotification(
//     "sample-user-1",
//     "We have a potential pool for you.",
//     "Decide if you want to join.",
//     "poolmatched",
//     { }
// );

type PoolReqWithDist = PoolRequest & { dist: number };

const hourOffset = 2;
const distWeight = 0.50;
const timeWeight = 0.50;

export function getOrderedMatchesByStrength(curReq: PoolRequest, matchedReqs: PoolReqWithDist[]) {
    const strengths = getMatchStrengths(curReq, matchedReqs);
    const sorted = matchedReqs.map((r, i) => ({ ...r, strength: strengths[i] })).sort((a, b) => b.strength - a.strength);
    return sorted;
}

// as this score is larger, the more likely it is to be a match
function getMatchStrengths(curReq: PoolRequest, matchedReqs: PoolReqWithDist[]): number[] {
    try {
        const { departTime } = curReq;

        const distComponent = matchedReqs.map((r) => r.dist);
        for (let i = 0; i < distComponent.length; i++) {
            if (distComponent[i] < 0.001) {
                distComponent[i] = 0.001;
            }
            distComponent[i] = (1 / distComponent[i]) / 1000;
        }
        const twoHours = hourOffset * 60 * 60 * 1000;
        const timeComponent = matchedReqs.map((r) => {
            const diff = Math.abs(r.departTime.getTime() - departTime.getTime());
            return 1 - (diff / twoHours);
        });

        const totalComponent = distComponent.map((d, i) => d * distWeight + timeComponent[i] * timeWeight);

        return totalComponent;

    } catch (error) {
        logError(error);
        return [];
    }
}

// searches from poolrequests
async function getPotentialUserMatches(requestId: number, limit: number = 10, offset = 0): Promise<PoolReqWithDist[]> {
    try {
        const poolReq = await prisma.poolRequest.findFirstOrThrow({
            where: { requestId: requestId },
            include: {
                from: true,
                to: true,
            }
        })

        const airportTerminalCat = placeCatEnum.airport_terminal;

        const fromIsAirportTerminal = poolReq.from.category === airportTerminalCat;


        const correctDate = getCorrectDate(poolReq.departTime);

        const leftLim = new Date(correctDate);
        leftLim.setHours(leftLim.getHours() - hourOffset);
        const rightLim = new Date(correctDate);
        rightLim.setHours(rightLim.getHours() + hourOffset);
        const fromCoords = (await getLatLngs([poolReq.from.placeId]))[0];
        const toCoords = (await getLatLngs([poolReq.to.placeId]))[0];

        let rawResp: { requestId: number, dist: number }[] = [];

        if (fromIsAirportTerminal) {
            const asEWKT = `SRID=3857;POINT(${toCoords.longitude} ${toCoords.latitude})`;

            rawResp = await prisma.$queryRaw`
            SELECT "requestId",
                "Place"."coords" <-> ${asEWKT} AS dist
            FROM "PoolRequest"
            INNER JOIN "Place" ON "PoolRequest"."toId" = "Place"."placeId"
            AND "fromId" = ${poolReq.from.placeId}
            AND "departTime" BETWEEN ${leftLim} AND ${rightLim}
            AND "requestId" != ${requestId}
            ORDER BY dist
            LIMIT ${limit}
            OFFSET ${offset}
        `;
        } else {
            const asEWKT = `SRID=3857;POINT(${fromCoords.longitude} ${fromCoords.latitude})`;
            rawResp = await prisma.$queryRaw`
            SELECT "requestId",
                "Place"."coords" <-> ${asEWKT} AS dist
            FROM "PoolRequest"
            INNER JOIN "Place" ON "PoolRequest"."fromId" = "Place"."placeId"
            AND "toId" = ${poolReq.to.placeId}
            AND "departTime" BETWEEN ${leftLim} AND ${rightLim}
            AND "requestId" != ${requestId}
            ORDER BY dist
            LIMIT ${limit}
            OFFSET ${offset}
        `;
        }

        let orderedReqs = await Promise.all(rawResp.map(r => {
            return prisma.poolRequest.findFirst({
                where: {
                    requestId: r.requestId,
                    poolId: null,
                },
            }).then(foundR => {
                if (!foundR) return null;
                return { ...foundR, dist: r.dist };
            });
        }));

        let notNullOrderedReqs = orderedReqs.filter(r => r !== null) as PoolReqWithDist[];

        if (notNullOrderedReqs.length < limit && rawResp.length == limit) {
            const nextReqs = await getPotentialUserMatches(requestId, limit, offset + limit);
            notNullOrderedReqs = notNullOrderedReqs.concat(nextReqs);
        }

        return notNullOrderedReqs;
    } catch (error) {
        logError(error);
        return [];
    }
}

// searches from pools
async function getPotentialPoolMatches(requestId: number, limit: number = 10, offset = 0): Promise<PoolReqWithDist[]> {
    return new Promise<PoolReqWithDist[]>(async (resolve, reject) => { });
}