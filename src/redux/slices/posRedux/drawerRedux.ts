import { get, post } from "../../../inteceptor";

export type PosDrawer = {
  cashExpenseAmount: string | null;
  closedAt: number | null;
  closeNote: string | null;
  countedBankTransferTotal: string | null;
  countedCardTotal: string | null;
  countedCash: string | null;
  id: number;
  locationId: number;
  locationName: string;
  openedAt: number;
  openNote: string | null;
  openingCash: string;
  status: "open" | "closed";
  userId: number;
  userName: string;
};

export type CloseDrawerResult = {
  difference: number;
  drawerId: number;
  summary: {
    bankTransferSales: number;
    cardSales: number;
    cashSales: number;
    discountAmount: number;
    expectedCash: number;
    salesCount: number;
    totalAmount: number;
  };
};

export const getCurrentDrawer = async () =>
  (await get<{ drawer: PosDrawer | null }>("pos-drawers/current", undefined, undefined, undefined, { trackLoading: false })).data.drawer;

export const openDrawer = async (input: { openingCash: number; note?: string }) =>
  (await post<PosDrawer, typeof input>("pos-drawers/open", input, undefined, false)).data;

export const closeDrawer = async (input: {
  cashExpenseAmount: number;
  countedBankTransferTotal: number;
  countedCardTotal: number;
  countedCash: number;
  note?: string;
}) => (await post<CloseDrawerResult, typeof input>("pos-drawers/close", input, undefined, false)).data;
