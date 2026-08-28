import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { get, patch, post, put } from "../../../inteceptor";
import { dispatch } from "../../store";

export type UserRole = { label: string; name: string };
export type UserListItem = {
  address: string | null;
  email: string | null;
  firstName: string | null;
  id: number;
  isActive: boolean;
  lastName: string | null;
  location: { id: number; name: string } | null;
  name: string;
  phone: string | null;
  roles: UserRole[];
};
export type UserRoleAssignment = {
  location: { id: number; name: string } | null;
  role: { id: number; label: string; name: string };
};
export type UserListResponse = {
  items: UserListItem[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};
export type CreateUserInput = { email: string; firstName: string; lastName: string };
export type CreatedUser = {
  credentials: { email: string; password: string };
  user: { email: string; firstName: string; id: number; isActive: boolean; lastName: string };
};
export type OwnProfile = {
  address: string | null;
  displayName: string;
  email: string | null;
  firstName: string | null;
  id: number;
  lastName: string | null;
  phone: string | null;
};

type UserState = { error: string | null; items: UserListItem[]; pagination: UserListResponse["pagination"]; profile: OwnProfile | null };
const initialState: UserState = { error: null, items: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 }, profile: null };
const userSlice = createSlice({
  name: "userManagement",
  initialState,
  reducers: {
    failed(state, action: PayloadAction<string>) { state.error = action.payload; },
    profileReceived(state, action: PayloadAction<OwnProfile>) { state.profile = action.payload; state.error = null; },
    usersReceived(state, action: PayloadAction<UserListResponse>) { state.items = action.payload.items; state.pagination = action.payload.pagination; state.error = null; },
  },
});
export default userSlice.reducer;
const report = (error: unknown) => dispatch(userSlice.actions.failed(error instanceof Error ? error.message : "User request failed."));

export const getUsers = async (query: Record<string, unknown>): Promise<UserListResponse> => {
  try { const response = await get<UserListResponse>("users", query); dispatch(userSlice.actions.usersReceived(response.data)); return response.data; }
  catch (error) { report(error); throw error; }
};

export const createUser = async (input: CreateUserInput): Promise<CreatedUser> => {
  const response = await post<CreatedUser, CreateUserInput>("users", input, undefined, false);
  return response.data;
};

export const updateUser = async (id: number, input: { address: string | null; phone: string | null }): Promise<void> => {
  await patch(`users/${id}`, input, undefined, false);
};

export const getOwnProfile = async (): Promise<OwnProfile> => {
  try { const response = await get<OwnProfile>("users/me"); dispatch(userSlice.actions.profileReceived(response.data)); return response.data; }
  catch (error) { report(error); throw error; }
};

export const updateOwnProfile = async (input: { address: string | null; phone: string | null }): Promise<OwnProfile> => {
  const response = await patch<OwnProfile>("users/me", input, undefined, false);
  dispatch(userSlice.actions.profileReceived(response.data));
  return response.data;
};

export const getUserRoleAssignments = async (id: number): Promise<UserRoleAssignment[]> => {
  const response = await get<{ assignments: UserRoleAssignment[]; userId: number }>(`users/${id}/roles`);
  return response.data.assignments;
};

export const setUserRole = async (userId: number, roleId: number, locationId: number | null): Promise<void> => {
  await put(`users/${userId}/roles`, { assignments: [{ locationId, roleId }] }, undefined, false);
};

export const getAssignableLocations = async (): Promise<Array<{ id: number; name: string }>> => {
  const response = await get<Array<{ id: number; name: string }>>("roles/assignment-locations");
  return response.data;
};

export const updateUserStatus = async (id: number, isActive: boolean): Promise<void> => {
  await patch(`users/${id}/status`, { isActive }, undefined, false);
};

export const updateUserLocation = async (id: number, locationId: number): Promise<void> => {
  await patch(`users/${id}/location`, { locationId }, undefined, false);
};
