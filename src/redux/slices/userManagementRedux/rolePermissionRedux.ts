import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { deleteMethod, get, patch, post, put } from "../../../inteceptor";
import { dispatch } from "../../store";

export type Permission = {
  description: string | null;
  id: number;
  isSystem: boolean;
  key: string;
  module: string;
  priority: number;
  mainCategory: string;
  category: string;
  title: string;
};

export type Role = {
  description: string | null;
  id: number;
  isSystem: boolean;
  label: string;
  name: string;
  permissionIds: number[];
};

type RolePermissionState = { error: string | null; permissions: Permission[]; roles: Role[] };
const initialState: RolePermissionState = { error: null, permissions: [], roles: [] };
const rolePermissionSlice = createSlice({
  name: "rolePermission",
  initialState,
  reducers: {
    failed(state, action: PayloadAction<string>) { state.error = action.payload; },
    permissionsReceived(state, action: PayloadAction<Permission[]>) { state.permissions = action.payload; state.error = null; },
    rolesReceived(state, action: PayloadAction<Role[]>) { state.roles = action.payload; state.error = null; },
  },
});
export default rolePermissionSlice.reducer;
const report = (error: unknown) => dispatch(rolePermissionSlice.actions.failed(error instanceof Error ? error.message : "Role request failed."));

export const getPermissions = async (): Promise<Permission[]> => {
  try { const response = await get<Permission[]>("roles/permissions"); dispatch(rolePermissionSlice.actions.permissionsReceived(response.data)); return response.data; }
  catch (error) { report(error); throw error; }
};

export type PermissionInput = Pick<Permission, "category" | "key" | "mainCategory" | "module" | "priority" | "title"> & { description: string | null };

export const createPermission = async (input: PermissionInput): Promise<Permission> => {
  const response = await post<Permission, PermissionInput>("roles/permissions", input, undefined, false);
  return response.data;
};

export const updatePermission = async (id: number, input: Partial<PermissionInput>): Promise<Permission> => {
  const response = await patch<Permission, Partial<PermissionInput>>(`roles/permissions/${id}`, input, undefined, false);
  return response.data;
};

export const deletePermission = async (id: number): Promise<void> => {
  await deleteMethod(`roles/permissions/${id}`, {}, undefined, false);
};

export const getRoles = async (): Promise<Role[]> => {
  try { const response = await get<Role[]>("roles"); dispatch(rolePermissionSlice.actions.rolesReceived(response.data)); return response.data; }
  catch (error) { report(error); throw error; }
};

export type CreateRoleInput = {
  description: string | null;
  label: string;
  permissionIds: number[];
  permissionKeys: string[];
};

export const createRole = async (input: CreateRoleInput): Promise<void> => {
  await post("roles", input, undefined, false);
};

export const updateRole = async (id: number, input: { description: string | null; label: string }): Promise<void> => {
  await patch(`roles/${id}`, input, undefined, false);
};

export const replaceRolePermissions = async (id: number, permissionIds: number[]): Promise<void> => {
  await put(`roles/${id}/permissions`, { permissionIds }, undefined, false);
};

export const deleteRole = async (id: number): Promise<void> => {
  await deleteMethod(`roles/${id}`, {}, undefined, false);
};
