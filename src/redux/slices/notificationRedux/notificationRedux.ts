import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AppNotification = {
  entityId: number | null;
  entityType: string | null;
  id: number;
  isRead: boolean;
  locationId: number | null;
  message: string;
  module: string;
  severity: "info" | "success" | "warning" | "critical";
  timestamp: number;
  title: string;
};

export type NotificationListResponse = {
  items: AppNotification[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

type State = {
  error: string | null;
  items: AppNotification[];
  pagination: NotificationListResponse["pagination"];
  unreadCount: number;
};

const initialState: State = {
  error: null,
  items: [],
  pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
  unreadCount: 0,
};

const slice = createSlice({
  initialState,
  name: "notifications",
  reducers: {
    failed(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    readAll(state) {
      state.items = state.items.map((item) => ({ ...item, isRead: true }));
      state.unreadCount = 0;
    },
    readOne(state, action: PayloadAction<number>) {
      state.items = state.items.map((item) => item.id === action.payload ? { ...item, isRead: true } : item);
      state.unreadCount = Math.max(0, state.items.filter((item) => !item.isRead).length);
    },
    received(state, action: PayloadAction<NotificationListResponse>) {
      state.items = action.payload.items;
      state.pagination = action.payload.pagination;
      state.error = null;
    },
    unreadCountReceived(state, action: PayloadAction<number>) {
      state.unreadCount = action.payload;
    },
  },
});

export default slice.reducer;
export const notificationActions = slice.actions;
