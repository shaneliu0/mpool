import axios from 'axios';

export interface PostReportData {
    messageId?: number;
    userId?: string;
    reason: string;
}
export const postReport = async (data: PostReportData) => {
    const response = await axios.post('/safety/report', data);
    return response;
};

export interface BlockUserData {
    userId: string;
}
export const blockUser = async (data: BlockUserData) => {
    await axios.post(`/safety/block/${data.userId}`);
}


export interface BlockedUser {
    blockId: number;
    userId: string;
    displayName: string;
    photoURL: string;
    blockedAt: number;
}
export const getBlockedUsers = async () => {
    const response = await axios.get<BlockedUser[]>('/safety/block');
    return response.data;
}

export interface UnblockUserData {
    blockId: number;
}
export const unblockUser = async (data: UnblockUserData) => {
    await axios.delete(`/safety/block/${data.blockId}`);
}