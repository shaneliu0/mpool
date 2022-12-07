
import { NotificationType } from "./types/dataAccess/notifications";

export function pushNotification(recipientId: string, title: string, body: string, type: NotificationType, payload: any) {
    // send mobile push, email, and add to database.
}