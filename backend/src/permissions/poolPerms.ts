

const prism = global.prisma;

export async function checkSharedPool(requesterId: string, requestedId: string): Promise<boolean> {
    const requester = await prism.user.findFirstOrThrow({
        where: { userId: requesterId },
        include: {
            requests: {
                where: {
                    Pool: {
                        PoolRequest: {
                            some: {
                                userId: requestedId
                            }
                        }
                    }
                }
            }
        }
    });
    return requester?.requests.length > 0;
}

export async function checkCanAccessPool(rid: string, pid: number): Promise<boolean> {
    const pool = await prism.pool.findFirstOrThrow({
        where: {
            poolId: pid,
            PoolRequest: {
                some: {
                    userId: rid
                }
            }
        }
    });
    return pool !== null;
}