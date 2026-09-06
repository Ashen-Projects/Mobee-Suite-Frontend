import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Box, Card, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography, type SxProps, type TableCellProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";

export type MobeeTableColumn<T> = {
  align?: TableCellProps["align"];
  header: ReactNode;
  key: string;
  minWidth?: number;
  render: (row: T) => ReactNode;
  sx?: SxProps<Theme>;
  width?: number | string;
};

type MobeeTableProps<T> = {
  actions?: ReactNode;
  columns: MobeeTableColumn<T>[];
  count?: number;
  emptyDescription?: ReactNode;
  emptyTitle?: ReactNode;
  filters?: ReactNode;
  getRowKey: (row: T) => string | number;
  loading?: boolean;
  minWidth?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
  onRowsPerPageChange?: (pageSize: number) => void;
  page?: number;
  rows: T[];
  rowsPerPage?: number;
  rowsPerPageOptions?: number[];
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
};

export default function MobeeTable<T>({
  actions,
  columns,
  count,
  emptyDescription,
  emptyTitle = "No records found",
  filters,
  getRowKey,
  loading = false,
  minWidth = 980,
  onPageChange,
  onRowClick,
  onRowsPerPageChange,
  onSearchChange,
  page = 0,
  rows,
  rowsPerPage = 10,
  rowsPerPageOptions = [10, 25, 50, 100],
  searchPlaceholder,
  searchValue = "",
}: MobeeTableProps<T>) {
  const showPagination = typeof count === "number" && onPageChange && onRowsPerPageChange;

  return <Card sx={{ overflow: "hidden" }}>
    {(searchPlaceholder || filters || actions) ? <Stack
      alignItems={{ xs: "stretch", md: "center" }}
      direction={{ xs: "column", md: "row" }}
      gap={1.5}
      sx={{ p: 1.5 }}
    >
      {searchPlaceholder ? <TextField
        fullWidth
        onChange={(event) => onSearchChange?.(event.target.value)}
        placeholder={searchPlaceholder}
        slotProps={{ input: { startAdornment: <SearchRoundedIcon color="action" sx={{ mr: 1 }} /> } }}
        value={searchValue}
      /> : null}
      {filters}
      {actions}
    </Stack> : null}
    <TableContainer sx={{ borderTop: searchPlaceholder || filters || actions ? 1 : 0, borderColor: "divider", overflowX: "auto" }}>
      <Table sx={{
        minWidth,
        "& th": {
          bgcolor: "action.hover",
          borderColor: "divider",
          color: "text.primary",
          fontSize: 13,
          fontWeight: 900,
          lineHeight: 1.3,
          py: 1.45,
          whiteSpace: "nowrap",
        },
        "& td": {
          borderColor: "rgba(255,255,255,0.08)",
          py: 1.2,
          verticalAlign: "middle",
        },
      }}>
        <TableHead>
          <TableRow>
            {columns.map((column) => <TableCell align={column.align} key={column.key} sx={{ minWidth: column.minWidth, width: column.width, ...column.sx }}>
              {column.header}
            </TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => <TableRow
            hover={Boolean(onRowClick)}
            key={getRowKey(row)}
            onClick={() => onRowClick?.(row)}
            sx={{
              cursor: onRowClick ? "pointer" : "default",
              transition: "background-color 120ms ease",
              "&:last-of-type td": { borderBottom: 0 },
            }}
          >
            {columns.map((column) => <TableCell align={column.align} key={column.key} sx={column.sx}>{column.render(row)}</TableCell>)}
          </TableRow>)}
          {!rows.length ? <TableRow>
            <TableCell colSpan={columns.length} sx={{ borderBottom: 0, py: 8 }}>
              <Stack alignItems="center" spacing={1}>
                <SearchRoundedIcon color="disabled" sx={{ fontSize: 42 }} />
                <Typography fontWeight={900}>{loading ? "Loading…" : emptyTitle}</Typography>
                {emptyDescription ? <Typography color="text.secondary" textAlign="center" variant="body2">{emptyDescription}</Typography> : null}
              </Stack>
            </TableCell>
          </TableRow> : null}
        </TableBody>
      </Table>
    </TableContainer>
    {showPagination ? <Box sx={{ borderTop: rows.length ? 1 : 0, borderColor: "divider" }}>
      <TablePagination
        component="div"
        count={count}
        onPageChange={(_, nextPage) => onPageChange(nextPage)}
        onRowsPerPageChange={(event) => onRowsPerPageChange(Number(event.target.value))}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={rowsPerPageOptions}
      />
    </Box> : null}
  </Card>;
}
