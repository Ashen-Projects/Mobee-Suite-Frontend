import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Box, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, Stack, Typography, Button } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { getStockUnits, type StockProductSummary, type StockUnit } from "../../redux/slices/inventoryRedux/stockRedux";
import { fCurrency } from "../../utils/formatNumber";

type Props = { stockProduct: StockProductSummary | null; onClose: () => void };
const pageSizes = [10, 15, 25, 50];

export default function StockProductUnitsDialog({ stockProduct, onClose }: Props) {
  const [rows, setRows] = useState<StockUnit[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [total, setTotal] = useState(0);
  const loadUnits = useCallback(async () => {
    if (!stockProduct?.productId) return;
    try {
      const response = await getStockUnits(stockProduct.productId, {
        locationId: stockProduct.locationId ?? "all",
        page: page + 1,
        pageSize,
        search: "",
        statusId: stockProduct.statusId ?? "all",
      });
      setRows(response.items);
      setTotal(response.pagination.total);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load stock units.");
    }
  }, [page, pageSize, stockProduct]);
  useEffect(() => { setPage(0); }, [stockProduct?.productId, stockProduct?.locationId, stockProduct?.statusId]);
  useEffect(() => { if (stockProduct) void loadUnits(); }, [loadUnits, stockProduct]);

  const renderIdentifier = (row: StockUnit) => {
    const identifiers = [
      row.barcode ? { label: row.barcode, type: "Barcode" } : null,
      ...row.identifiers.map((identifier) => ({ label: identifier.value, type: identifier.type.toUpperCase() })),
    ].filter((identifier): identifier is { label: string; type: string } => Boolean(identifier));
    if (!identifiers.length) return <Typography color="text.secondary" variant="body2">-</Typography>;
    return <Stack alignItems="center" direction="row" flexWrap="wrap" gap={0.5}>
      {identifiers.map((identifier) => <Chip key={`${identifier.type}-${identifier.label}`} label={`${identifier.type} ${identifier.label}`} size="small" variant="outlined" />)}
    </Stack>;
  };

  const columns = useMemo<GridColDef<StockUnit>[]>(() => [
    { field: "identifier", headerName: "Identifier", flex: 1, minWidth: 290, sortable: false, renderCell: ({ row }) => renderIdentifier(row) },
    { field: "productSku", headerName: "Product code", minWidth: 145, renderCell: ({ row }) => <Typography color={row.productSku ? "text.primary" : "text.secondary"} noWrap variant="body2">{row.productSku || `Product #${row.productId ?? "-"}`}</Typography> },
    { field: "costPrice", headerName: "Cost", minWidth: 145, renderCell: ({ row }) => <Typography color="text.secondary" variant="body2">{fCurrency(Number(row.costPrice))}</Typography> },
    { field: "productMrpPrice", headerName: "MRP", minWidth: 145, sortable: false, renderCell: () => <Typography fontWeight={600} variant="body2">{fCurrency(Number(stockProduct?.productMrpPrice ?? 0))}</Typography> },
    { field: "grnNumber", headerName: "GRN", minWidth: 180, renderCell: ({ row }) => <Typography noWrap variant="body2">{row.grnNumber ?? "-"}</Typography> },
    { field: "timestamp", headerName: "Added", minWidth: 185, renderCell: ({ row }) => <Typography noWrap variant="body2">{new Date(Number(row.timestamp)).toLocaleString("en-LK")}</Typography> },
  ], [stockProduct?.productMrpPrice]);

  return <Dialog fullWidth maxWidth="lg" onClose={onClose} open={Boolean(stockProduct)} PaperProps={{ sx: { borderRadius: 3, height: { xs: "100%", md: "min(680px, calc(100% - 64px))" }, outline: "none !important" } }}>
    <DialogTitle component="div" sx={{ pr: 7 }}><Typography variant="h5">{stockProduct?.productName ?? "Stock units"}</Typography><Typography color="text.secondary" variant="body2">{stockProduct?.locationName ?? "Unassigned location"} • {stockProduct?.statusLabel ?? "Unassigned status"} • {stockProduct?.quantity ?? 0} unit{stockProduct?.quantity === 1 ? "" : "s"}</Typography><IconButton aria-label="Close" onClick={onClose} sx={{ position: "absolute", right: 12, top: 12 }}><CloseRoundedIcon /></IconButton></DialogTitle>
    <Divider />
    <DialogContent sx={{ p: 0 }}><Box sx={{ height: "100%", minHeight: 420 }}><DataGrid<StockUnit> columns={columns} disableColumnMenu disableRowSelectionOnClick getRowHeight={() => 52} getRowId={(row) => row.id} onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }} pageSizeOptions={pageSizes} paginationMode="server" paginationModel={{ page, pageSize }} rowCount={total} rows={rows} sx={{ border: 0 }} /></Box></DialogContent>
    <DialogActions sx={{ borderTop: 1, borderColor: "divider", p: 2 }}><Button color="inherit" onClick={onClose}>Close</Button></DialogActions>
  </Dialog>;
}
