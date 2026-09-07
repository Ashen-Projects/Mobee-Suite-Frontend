import { get, patch } from "../../../inteceptor";
import type { NotificationListResponse } from "./notificationRedux";

const notificationRequestOptions = { trackLoading: false } as const;

export const getNotifications = async (
  query: Record<string, unknown> = {},
): Promise<NotificationListResponse> => {
  const response = await get<NotificationListResponse>(
    "notifications",
    query,
    undefined,
    undefined,
    notificationRequestOptions,
  );

  return response.data;
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  const response = await get<{ count: number }>(
    "notifications/unread-count",
    undefined,
    undefined,
    undefined,
    notificationRequestOptions,
  );

  return response.data.count;
};

export const markNotificationRead = async (id: number): Promise<void> => {
  await patch<{ id: number }, Record<string, never>>(
    `notifications/${id}/read`,
    {},
    undefined,
    false,
    notificationRequestOptions,
  );
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await patch<{ updated: number }, Record<string, never>>(
    "notifications/read-all",
    {},
    undefined,
    false,
    notificationRequestOptions,
  );
};
