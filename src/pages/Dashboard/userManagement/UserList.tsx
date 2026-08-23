import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Box, Card, CardContent, Chip, FormControl, InputAdornment, InputLabel, MenuItem, Select, Stack, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import PageMeta from "../../../components/common/PageMeta";
import { get } from "../../../inteceptor";

type UserRole = { label: string; name: string };
type UserListItem = {
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
type Response = { items: UserListItem[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } };
type StatusFilter = "active" | "all" | "inactive";
const PAGE_SIZE = 10;

export default function UserList() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const requestId = useRef(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(0); }, 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const loadUsers = useCallback(async () => {
    const currentRequest = ++requestId.current;
    try {
      const response = await get<Response>("users", { page: page + 1, pageSize: PAGE_SIZE, search: debouncedSearch, status });
      if (currentRequest !== requestId.current) return;
      setUsers(response.data.items);
      setTotal(response.data.pagination.total);
    } catch (error) {
      if (currentRequest !== requestId.current) return;
      setUsers([]);
      setTotal(0);
      toast.error(error instanceof Error ? error.message : "Unable to load users.");
    }
  }, [debouncedSearch, page, status]);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const columns = useMemo<GridColDef<UserListItem>[]>(() => [
    { field: "id", headerName: "User ID", minWidth: 90 },
    { field: "isActive", headerName: "Status", minWidth: 110, renderCell: ({ value }) => <Chip color={value ? "success" : "error"} label={value ? "Active" : "Inactive"} size="small" /> },
    { field: "name", headerName: "Name", flex: 1, minWidth: 180 },
    { field: "email", headerName: "Email", flex: 1, minWidth: 220, valueFormatter: (value) => value || "—" },
    { field: "phone", headerName: "Phone number", minWidth: 150, valueFormatter: (value) => value || "—" },
    { field: "roles", headerName: "User role", minWidth: 180, valueGetter: (_value, row) => row.roles.map(({ label }) => label).join(", ") || "Not assigned" },
    { field: "location", headerName: "Location", minWidth: 170, valueGetter: (_value, row) => row.location?.name || "Not assigned" },
    { field: "actions", headerName: "Actions", minWidth: 160, sortable: false, renderCell: () => <Typography color="text.secondary" variant="caption">Available next</Typography> },
  ], []);

  return (
    <>
      <PageMeta description="View and manage Mobee Suite users." title="User List | Mobee Suite" />
      <Stack spacing={{ xs: 2, sm: 2.5 }}>
        <Box>
          <Typography sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" }, fontWeight: 700, lineHeight: 1.25 }}>User List</Typography>
          <Typography color="text.secondary" mt={0.5} variant="body2">{total} {total === 1 ? "user" : "users"} registered</Typography>
        </Box>
        <Card sx={{ border: 1, borderColor: "divider", overflow: "hidden" }}>
          <CardContent sx={{ p: { xs: 2, sm: 2.5 }, "&:last-child": { pb: { xs: 2, sm: 2.5 } } }}>
            <Stack alignItems={{ sm: "center" }} direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField fullWidth label="Search users" onChange={(event) => setSearch(event.target.value)} placeholder="Name, email or phone" slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon color="action" fontSize="small" /></InputAdornment> } }} value={search} />
              <FormControl fullWidth sx={{ maxWidth: { sm: 200 } }}><InputLabel>Status</InputLabel><Select label="Status" onChange={(event) => { setStatus(event.target.value as StatusFilter); setPage(0); }} value={status}><MenuItem value="all">All statuses</MenuItem><MenuItem value="active">Active</MenuItem><MenuItem value="inactive">Inactive</MenuItem></Select></FormControl>
            </Stack>
          </CardContent>
          <Box sx={{ borderTop: 1, borderColor: "divider", overflowX: "auto", width: "100%" }}>
            <DataGrid
              autoHeight
              columns={columns}
              disableRowSelectionOnClick
              onPaginationModelChange={(model) => setPage(model.page)}
              pageSizeOptions={[PAGE_SIZE]}
              paginationMode="server"
              paginationModel={{ page, pageSize: PAGE_SIZE }}
              rowCount={total}
              rows={users}
              columnVisibilityModel={isMobile ? { id: false, location: false, phone: false, roles: false } : undefined}
              sx={{ border: 0, minWidth: isMobile ? 680 : 980, "& .MuiDataGrid-columnHeaders": { bgcolor: "action.hover" }, "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 600 }, "& .MuiDataGrid-cell": { alignItems: "center" }, "& .MuiDataGrid-footerContainer": { minHeight: 52 }, "& .MuiDataGrid-row": { minHeight: "56px !important" } }}
            />
          </Box>
        </Card>
      </Stack>
    </>
  );
}
