import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { get, patch, post } from "../../../inteceptor";
import { dispatch } from "../../store";

export type Location = { address: string | null; code: string; id: number; isActive: boolean; name: string; phone: string | null; timestamp: number; type: "shop" | "warehouse" | "repairCentre"; assignedUsers?: number; roleAssignments?: number };
export type LocationInput = Omit<Location, "id" | "timestamp" | "assignedUsers" | "roleAssignments">;
export type LocationList = { items: Location[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } };
export type DocumentSequence = { documentType: string; id: number; lastNumber: number; locationCode?: string | null; locationId: number; locationName?: string | null; prefix: string; year: number };
export type DocumentSequenceInput = { documentType: string; locationId: number; prefix: string; startingNumber: number; year: number };

type State = { documentSequences: DocumentSequence[]; error: string | null; locations: Location[]; locationPagination: LocationList["pagination"] };
const initialState: State = { documentSequences: [], error: null, locations: [], locationPagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } };
const slice = createSlice({ name: "businessSettings", initialState, reducers: {
  failed(state, action: PayloadAction<string>) { state.error = action.payload; },
  locationsReceived(state, action: PayloadAction<LocationList>) { state.locations = action.payload.items; state.locationPagination = action.payload.pagination; state.error = null; },
  sequencesReceived(state, action: PayloadAction<DocumentSequence[]>) { state.documentSequences = action.payload; state.error = null; },
} });
export default slice.reducer;
const fail = (error: unknown) => { dispatch(slice.actions.failed(error instanceof Error ? error.message : "Settings request failed.")); throw error; };
export const getLocations = async (query: Record<string, unknown>): Promise<LocationList> => { try { const value = (await get<LocationList>("locations", query)).data; dispatch(slice.actions.locationsReceived(value)); return value; } catch (error) { return fail(error); } };
export const getLocation = async (id: number) => (await get<Location>(`locations/${id}`)).data;
export const createLocation = async (input: LocationInput) => (await post<Location, LocationInput>("locations", input, undefined, false)).data;
export const updateLocation = async (id: number, input: Omit<LocationInput, "isActive">) => (await patch<Location>(`locations/${id}`, input, undefined, false)).data;
export const updateLocationStatus = async (id: number, isActive: boolean) => (await patch<Location>(`locations/${id}/status`, { isActive }, undefined, false)).data;
export const getDocumentSequences = async (query: Record<string, unknown> = {}): Promise<DocumentSequence[]> => { try { const value = (await get<DocumentSequence[]>("document-sequences", query)).data; dispatch(slice.actions.sequencesReceived(value)); return value; } catch (error) { return fail(error); } };
export const createDocumentSequence = async (input: DocumentSequenceInput) => (await post<DocumentSequence, DocumentSequenceInput>("document-sequences", input, undefined, false)).data;
export const updateDocumentSequence = async (id: number, prefix: string) => (await patch<DocumentSequence>(`document-sequences/${id}`, { prefix }, undefined, false)).data;
