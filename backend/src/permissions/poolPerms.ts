

const prism = global.prisma;

export async function checkSharedPool(requesterId: string, requestedId: string): Promise<boolean> {
    const requester = await prism.user.findFirst({
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
    if (!requester) return false;
    return requester?.requests.length > 0;
}

export async function checkCanAccessPool(rid: string, pid: number): Promise<boolean> {
    const pool = await prism.pool.findFirst({
        where: {
            poolId: pid,
            OR: [
                {
                    PoolRequest: {
                        some: {
                            userId: rid
                        }
                    }
                },
                {
                    PotentialMatch: {
                        some: {
                            users: {
                                some: {
                                    userId: rid
                                }
                            },
                            declined: false,
                        },
                    }
                },
                {
                    DerivedFromMatch: {
                        some: {
                            users: {
                                some: {
                                    userId: rid
                                }
                            },
                            declined: false,
                        }
                    }
                }
            ]
        }
    });
    return pool !== null;
}

export async function checkCanAccessMatch(rid: string, mid: number): Promise<boolean> {
    const match = await prism.potentialMatch.findFirst({
        where: {
            potentialMatchId: mid,
            users: {
                some: {
                    userId: rid
                }
            }
        }
    });
    return match !== null;
}

export async function checkCanAccessRequest(rid: string, requestId: number) {
    const request = await prism.poolRequest.findFirst({
        where: {
            requestId,
            userId: rid
        }
    });
    return request !== null;
}