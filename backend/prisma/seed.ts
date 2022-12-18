import { PrismaClient } from "@prisma/client";
// import { placeCatEnum } from "../src/placeAccess";

export const placeCatEnum = {
    airport_terminal: "airport_terminal",
    dorm: "dorm",
    apartment_complex: "apartment_complex",
    "": "",
};

const prisma = new PrismaClient();

async function universities() {
    await prisma.university.create({
        data: {
            name: "University of Michigan--Ann Arbor",
            universityId: 1,
            emailDomain: "umich.edu",
        }
    })
}

async function seasons() {
    await prisma.poolSeason.createMany({
        data: [
            {
                id: 1,
                name: "Thanksgiving Break 2022",
                active: true,
                endsAt: new Date(2022, 11, 25),
                universityId: 1,
            },
            {
                id: 2,
                name: "Winter Break 2022",
                active: true,
                endsAt: new Date(2023, 1, 7),
                universityId: 1,
            },
            {
                id: 3,
                name: "Spring Break 2023",
                active: true,
                endsAt: new Date(2023, 3, 14),
                universityId: 1,
            },
        ]
    })
}
// allicelloyd, baits II, betsy barbour, bursley, couzens, east quadrangle, fletcher hall, helennewberry, henderson house, martha cook, markley, mojo, northquad, oxford, southquad, stockwell, westquad
async function places() {
    await prisma.$executeRaw`
    INSERT INTO "Place" ("placeId", "name", "coords", "universityId", "updatedAt", "category") VALUES
    ('mcnamara', 'McNamara Terminal (AirFrance/Delta)', ST_GeomFromText('POINT(-83.348700 42.225809)', 3857), 1, ${new Date()}, ${placeCatEnum["airport_terminal"]}),
    ('north', 'North Terminal (all other airlines)', ST_GeomFromText('POINT(-83.355737 42.208432)', 3857), 1, ${new Date()}, ${placeCatEnum["airport_terminal"]}),
    ('alicelloyd', 'Alice Lloyd Hall', ST_GeomFromText('POINT(-83.743 42.278)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('baits', 'Baits II', ST_GeomFromText('POINT(-83.743 42.278)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('betsybarbour', 'Betsy Barbour House', ST_GeomFromText('POINT(-83.743 42.278)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('bursley', 'Bursley Hall', ST_GeomFromText('POINT(-83.743 42.278)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('couzens', 'Couzens Hall', ST_GeomFromText('POINT(-83.743 42.278)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('eastquad', 'East Quad', ST_GeomFromText('POINT(-83.743 42.278)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('fletcherhall', 'Fletcher Hall', ST_GeomFromText('POINT(-83.743 42.278)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('helennewberry', 'Helen Newberry Residence Hall', ST_GeomFromText('POINT(-83.743 42.278)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('hendersonhouse', 'Henderson House', ST_GeomFromText('POINT(-83.743 42.278)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('marthacook', 'Martha Cook Building', ST_GeomFromText('POINT(-83.743 42.278)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('markley', 'Markley Hall', ST_GeomFromText('POINT(-83.743 42.278)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('mojo', 'Mosher-Jordan', ST_GeomFromText('POINT(-83.743 42.278)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('oxford', 'Oxford Houses', ST_GeomFromText('POINT(-83.743 42.278)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('southquad', 'South Quad', ST_GeomFromText('POINT(-83.743 42.278)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('stockwell', 'Stockwell Hall', ST_GeomFromText('POINT(-83.743 42.278)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('westquad', 'West Quad', ST_GeomFromText('POINT(-83.743 42.278)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('universitytowersannarbor', 'University Towers', ST_GeomFromText('POINT(-83.743 42.278)', 3857), 1, ${new Date()}, ${placeCatEnum["apartment_complex"]}),
    ('landmarkannarbor', 'Landmark', ST_GeomFromText('POINT(-83.743 42.278)', 3857), 1, ${new Date()}, ${placeCatEnum["apartment_complex"]}),
    ('sagaannarbor', 'Saga/Younion', ST_GeomFromText('POINT(-83.743 42.278)', 3857), 1, ${new Date()}, ${placeCatEnum["apartment_complex"]}),
    ('courtyards', 'Courtyards', ST_GeomFromText('POINT(-83.743 42.278)', 3857), 1, ${new Date()}, ${placeCatEnum["apartment_complex"]})
    ON CONFLICT DO NOTHING
   `;
}

async function prompt() {
    await prisma.prompt.createMany({
        data: [
            { name: "My Interests" },
            { name: "What I'm studying" },
            { name: `"What are you deeply curious about?"` },
            { name: `"What's the best piece of advice you've ever been given?"` },
            { name: `"If you could choose any two famous people to have dinner with who would they be?"` },
        ]
    });
}

async function connectUniversityDefaultPlaces() {
    await prisma.university.update({
        where: { universityId: 1 },
        data: {
            defaultPlaces: {
                connect: [
                    { placeId: "mcnamara" },
                    { placeId: "north" },
                ]
            }
        }
    })
}

async function main() {
    // await universities();
    // await places();
    // await connectUniversityDefaultPlaces();
    // await seasons();
    // await prompt();
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });