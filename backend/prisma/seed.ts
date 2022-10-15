import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // await prisma.user.update({
    //     where: {
    //         userId: "sample-user-1",
    //     },
    //     data: {
    //         pools: {
    //             connect: {
    //                 poolId: 1,
    //             }
    //         }
    //     }
    // });
    // await prisma.user.create({
    //     data: {
    //         displayName: "Shane Liu",
    //         email: "contact@example.com",
    //         userId: "sample-user-1",
    //     }
    // });

    // await prisma.user.create({
    //     data: {
    //         displayName: "Sample User",
    //         email: "user@example.com",
    //         userId: "sample-user-2",
    //     },
    // });
    await prisma.pool.create({
        data: {
            name: "Pool 2",
            users: {
                connect: [
                    { userId: "sample-user-2" },
                    { userId: "sample-user-1" }
                ]
            }
        }
    });

    // await prisma.poolSeason.create({
    //     data: {
    //         name: "Thanksgiving Break 2022"
    //     }
    // });
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