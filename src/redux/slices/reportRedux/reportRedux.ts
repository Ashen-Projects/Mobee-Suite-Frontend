import { get } from "../../../inteceptor";

export type ReportKind = "sales" | "inventory" | "purchasing" | "repairs";

export type ReportResponse = {
  rows: Array<Record<string, string | number | null>>;
  summary: Record<string, unknown>;
};

export const getReport = async (kind: ReportKind, query: Record<string, unknown>): Promise<ReportResponse> =>
  (await get<ReportResponse>(`reports/${kind}`, query, undefined, undefined, { trackLoading: false })).data;
