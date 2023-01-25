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
                name: "Spring Break to DTW",
                active: true,
                enforceToAirport: true,
                endsAt: new Date(2023, 3, 13),
                universityId: 1,
            },
            {
                id: 2,
                name: "Spring Break to Ann Arbor",
                enforceFromAirport: true,
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
    ('alicelloyd', 'Alice Lloyd Hall', ST_GeomFromText('POINT(-83.7318 42.281241)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('baits', 'Baits II', ST_GeomFromText('POINT(-83.724069 42.293758)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('betsybarbour', 'Betsy Barbour House', ST_GeomFromText('POINT(-83.741836 42.277324)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('bursley', 'Bursley Hall', ST_GeomFromText('POINT(-83.720951 42.293735)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('couzens', 'Couzens Hall', ST_GeomFromText('POINT(-83.732699 42.282036)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('eastquad', 'East Quad', ST_GeomFromText('POINT(-83.735488 42.272732)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('fletcherhall', 'Fletcher Hall', ST_GeomFromText('POINT(-83.742965 42.270175)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('helennewberry', 'Helen Newberry Residence Hall', ST_GeomFromText('POINT(-83.741674 42.276918)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('hendersonhouse', 'Henderson House', ST_GeomFromText('POINT(-83.73182 42.27183)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('marthacook', 'Martha Cook Building', ST_GeomFromText('POINT(-83.737963 42.2745)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('markley', 'Markley Hall', ST_GeomFromText('POINT(-83.728877 42.280884)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('mojo', 'Mosher-Jordan', ST_GeomFromText('POINT(-83.731395 42.280053)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('northquad', 'North Quad', ST_GeomFromText('POINT(-83.740170 42.280488)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('oxford', 'Oxford Houses', ST_GeomFromText('POINT(-83.725634 42.27438)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('southquad', 'South Quad', ST_GeomFromText('POINT(-83.741796 42.274028)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('stockwell', 'Stockwell Hall', ST_GeomFromText('POINT(-83.731316 42.278662)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('westquad', 'West Quad', ST_GeomFromText('POINT(-83.742564 42.274854)', 3857), 1, ${new Date()}, ${placeCatEnum["dorm"]}),
    ('arborbluaa', 'Arbor Blu', ST_GeomFromText('POINT(-83.734816 42.273939)', 3857), 1, ${new Date()}, ${placeCatEnum["apartment_complex"]}),
    ('foundryaa', 'Foundry Lofts', ST_GeomFromText('POINT(-83.743229 42.28154)', 3857), 1, ${new Date()}, ${placeCatEnum["apartment_complex"]}),
    ('hubaa', 'Hub Ann Arbor', ST_GeomFromText('POINT(-83.741949 42.281366)', 3857), 1, ${new Date()}, ${placeCatEnum["apartment_complex"]}),
    ('landmarkaa', 'Landmark', ST_GeomFromText('POINT(-83.732977 42.274569)', 3857), 1, ${new Date()}, ${placeCatEnum["apartment_complex"]}),
    ('sagaaa', 'Saga Ann Arbor', ST_GeomFromText('POINT(-83.743568 42.280461)', 3857), 1, ${new Date()}, ${placeCatEnum["apartment_complex"]}),
    ('six11aa', 'Six11', ST_GeomFromText('POINT(-83.735606 42.274571)', 3857), 1, ${new Date()}, ${placeCatEnum["apartment_complex"]}),
    ('courtyardsaa', 'The Courtyards', ST_GeomFromText('POINT(-83.721222 42.295293)', 3857), 1, ${new Date()}, ${placeCatEnum["apartment_complex"]}),
    ('thestandardaa', 'The Standard', ST_GeomFromText('POINT(-83.748139 42.277312)', 3857), 1, ${new Date()}, ${placeCatEnum["apartment_complex"]}),
    ('utowersaa', 'University Towers', ST_GeomFromText('POINT(-83.73334 42.275241)', 3857), 1, ${new Date()}, ${placeCatEnum["apartment_complex"]}),
    ('varsityaa', 'Varsity', ST_GeomFromText('POINT(-83.742965 42.280419)', 3857), 1, ${new Date()}, ${placeCatEnum["apartment_complex"]}),
    ('vicvillageaa', 'Vic Village', ST_GeomFromText('POINT(-83.735494 42.275159)', 3857), 1, ${new Date()}, ${placeCatEnum["apartment_complex"]}),
    ('zplaceaa', 'Z Place', ST_GeomFromText('POINT(-83.735598 42.274213)', 3857), 1, ${new Date()}, ${placeCatEnum["apartment_complex"]}),
    ('zwestaa', 'Z West', ST_GeomFromText('POINT(-83.743057 42.277533)', 3857), 1, ${new Date()}, ${placeCatEnum["apartment_complex"]})
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

async function sampleMatch() {
    await prisma.potentialMatch.create({
        data: {
            potentialMatchId: 1,
            seasonId: 2,
            users: {
                connect: [
                    { userId: "sample-user-1" }, // sample user 1
                    { userId: "sample-user-2" }, // sample user 2
                ]
            }
        }
    });
}

async function MPoolChatUser() {
    await prisma.user.create({
        data: {
            displayName: "MPool",
            email: "mpool@example.com",
            photoUrl: "https://example.com/mpool-icon.png",
            userId: "mpool",
            Profile: {
                create: {
                    userId: "mpool",
                    initialized: true,
                    description: ""
                }
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
    // await MPoolChatUser();

    // await sampleMatch();
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