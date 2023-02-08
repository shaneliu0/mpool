import { Client } from "@googlemaps/google-maps-services-js";
import moment from "moment";
import { databaseReadyCurrentTime } from "./formatHelpers";
import { PoolPlace, PoolPlaceCategory } from "./types/dataAccess/poolData";
import { roundCoordinatesTo3Decimals } from "./formatHelpers";

const mapsClient = new Client({});

/*
    Schema:
    model Place {
    placeId      String                               @id
    name         String
    coords       Unsupported("geometry(Point, 3857)")
    fromPools    PoolRequest[]                        @relation("from")
    toPools      PoolRequest[]                        @relation("to")
    University   University?                          @relation(fields: [universityId], references: [universityId])
    universityId Int?
    }
*/

export async function getLatLngs(placeIds: string[]) {
    return Promise.all(placeIds.map(p => {
        return prisma.$queryRaw`SELECT ST_X(coords), ST_Y(coords) from "Place" WHERE "placeId" = ${p}`
            .then((r: any) => r[0])
            .then((r: any) => ({ latitude: r.st_y, longitude: r.st_x }));
    }));
}

export async function updatePlace(placeId: string): Promise<string> {
    const found = await prisma.place.findFirst({ where: { placeId } });
    if (found) return "";

    const place = await mapsClient.placeDetails({
        params: {
            place_id: placeId,
            fields: ["name", "geometry", "place_id"],
            key: process.env.GOOGLE_MAPS_API_KEY || "",
        }
    });

    const { name, geometry, place_id } = place.data.result;
    if (!geometry) throw new Error("Place wasn't found");
    const { lat, lng } = geometry.location;
    // 2022-12-16 12:01:08.079
    const updatedTime = databaseReadyCurrentTime();
    const dbname = name?.replace(/'/g, "''");

    await prisma.$executeRawUnsafe(`
        INSERT INTO "Place" ("placeId", "name", "coords", "updatedAt")
        VALUES ('${place_id}', '${dbname}', ST_GeomFromText('POINT(${lng} ${lat})', 3857), '${updatedTime}')
        ON CONFLICT ("placeId") DO UPDATE SET "name" = '${dbname}', "coords" = ST_GeomFromText('POINT(${lng} ${lat})', 3857), "updatedAt" = '${updatedTime}'
    `);

    return place_id || "";
}

export type placeCategory = "airport_terminal" | "dorm" | "apartment_complex" | "";

export const categoryOrder: placeCategory[] = [
    "airport_terminal",
    "dorm",
    "apartment_complex",
    "",
];

export const placeCatEnum = {
    airport_terminal: "airport_terminal",
    dorm: "dorm",
    apartment_complex: "apartment_complex",
    "": "",
};

export const catToTitle = {
    airport_terminal: "Airport Terminals",
    dorm: "Dorms",
    apartment_complex: "Popular Apartments",
    "": "Other",
}

export async function getSeasonDestinations(seasonId: number): Promise<PoolPlaceCategory[]> {
    const sdata = await prisma.poolSeason.findFirstOrThrow({
        where: {
            id: seasonId,
        },
        include: {
            university: {
                select: {
                    defaultPlaces: {
                        orderBy: {
                            placeId: "asc"
                        }
                    },
                }
            }
        }
    });

    const latlng = await getLatLngs(sdata.university.defaultPlaces.map(p => p.placeId));
    const placeWithCat: PoolPlaceCategory[] = sdata.university.defaultPlaces.map((p, idx) => {
        return {
            category: p.category || "",
            category_id: p.category || "",
            places: [{
                name: p.name,
                id: p.placeId,
                coords: {
                    latitude: latlng[idx].latitude,
                    longitude: latlng[idx].longitude,
                },
            }]
        }
    });

    const catToPlaces: { [key: string]: PoolPlace[] } = {};
    placeWithCat.forEach(p => {
        if (!catToPlaces[p.category]) catToPlaces[p.category] = [];
        catToPlaces[p.category].push(...p.places);
    });

    const filteredCat = categoryOrder.filter(c => catToPlaces[c]);

    return filteredCat.map(c => {
        return {
            category: catToTitle[c],
            category_id: c,
            places: catToPlaces[c] || [],
        }
    });
}

export function getCenterOfCoordinates(coords: { latitude: number, longitude: number }[], round?: boolean) {
    const x = coords.map(c => c.latitude).reduce((a, b) => a + b) / coords.length;
    const y = coords.map(c => c.longitude).reduce((a, b) => a + b) / coords.length;
    if (round) return roundCoordinatesTo3Decimals({ latitude: x, longitude: y });
    return { latitude: x, longitude: y };
}

async function _reverseGeocodeToAddress(lat: number, lng: number) {
    const res = await mapsClient.reverseGeocode({
        params: {
            latlng: `${lat},${lng}`,
            key: process.env.GOOGLE_MAPS_API_KEY || "",
        }
    });
    await updatePlace(res.data.results[0].place_id);
    return res.data.results[0];
}
export async function reverseGeocodeToAddress(coords: { latitude: number, longitude: number }) {
    return await _reverseGeocodeToAddress(coords.latitude, coords.longitude);
}
