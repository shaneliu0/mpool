import axios from 'axios';

export type NotificationType = "poolmatched";

export interface Notification {
    notificationId: number;
    createdAt: number;
    title: string;
    body: string;
    type: NotificationType;
    payload: any;
}
export const getNotifications = async (offset?: number): Promise<Notification[]> => {
    let path = '/notifications';
    if (offset) path += "?offset=" + offset;
    const resp = await axios.get(path);

    return (resp.data as Notification[]);
};