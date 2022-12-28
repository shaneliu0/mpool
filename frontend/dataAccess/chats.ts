import axios from 'axios';

export const markPoolAsRead = async (poolId: number): Promise<void> => {
    await axios.post(`/chat/${poolId}/markread`);
}