import axios from 'axios';

export const markPoolAsRead = async (poolId: number): Promise<void> => {
    await axios.post(`/chat/${poolId}/markread`);
}

export interface ChatStatusResp {
    text1?: string;
    text2?: string;
}
export const getChatStatus = async (chatId: number): Promise<ChatStatusResp> => {
    const resp = await axios.get<ChatStatusResp>(`/chat/${chatId}/status`);
    return resp.data;
}