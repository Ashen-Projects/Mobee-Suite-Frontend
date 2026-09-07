import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import { Box, Button, Chip, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../../redux/slices/notificationRedux/notificationApi";
import {
  notificationActions,
  type AppNotification,
} from "../../../redux/slices/notificationRedux/notificationRedux";
import { useAppDispatch, useAppSelector } from "../../../redux/store";
import { formatDateTime } from "../../../utils/formatDateTime";

const severityColor = (severity: AppNotification["severity"]) => {
  if (severity === "critical") return "error";
  if (severity === "warning") return "warning";
  if (severity === "success") return "success";
  return "info";
};

export default function NotificationsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState<"all" | "read" | "unread">("all");
  const dispatch = useAppDispatch();
  const { items, pagination, unreadCount } = useAppSelector((state) => state.notifications);

  useEffect(() => {
    void getNotifications({ page: page + 1, pageSize, status }).then((value) => dispatch(notificationActions.received(value)));
  }, [dispatch, page, pageSize, status]);

  const readOne = async (id: number) => {
    await markNotificationRead(id);
    dispatch(notificationActions.readOne(id));
  };

  const readAll = async () => {
    await markAllNotificationsRead();
    dispatch(notificationActions.readAll());
  };

  const columns = useMemo<GridColDef<AppNotification>[]>(() => [
    {
      field: "title",
      flex: 1.2,
      headerName: "Notification",
      minWidth: 300,
      renderCell: ({ row }) => (
        <Stack justifyContent="center" sx={{ minHeight: "100%" }}>
          <Typography fontWeight={row.isRead ? 700 : 950} noWrap>{row.title}</Typography>
          <Typography color="text.secondary" fontSize={12} noWrap>{row.message}</Typography>
        </Stack>
      ),
    },
    {
      field: "module",
      flex: 0.45,
      headerName: "Module",
      minWidth: 130,
      renderCell: ({ row }) => <Chip label={row.module} size="small" sx={{ textTransform: "capitalize" }} />,
    },
    {
      field: "severity",
      flex: 0.45,
      headerName: "Level",
      minWidth: 120,
      renderCell: ({ row }) => <Chip color={severityColor(row.severity)} label={row.severity} size="small" sx={{ textTransform: "capitalize" }} />,
    },
    { field: "timestamp", flex: 0.65, headerName: "Time", minWidth: 180, valueFormatter: (value) => formatDateTime(value) },
    {
      field: "isRead",
      flex: 0.35,
      headerName: "Status",
      minWidth: 120,
      renderCell: ({ row }) => <Chip color={row.isRead ? "default" : "primary"} label={row.isRead ? "Read" : "Unread"} size="small" />,
    },
  ], []);

  return <Box>
    <PageBreadcrumb pageTitle="Notifications" />
    <Stack alignItems={{ xs: "stretch", md: "center" }} direction={{ xs: "column", md: "row" }} justifyContent="space-between" mb={2} spacing={1.5}>
      <Typography color="text.secondary">Important system activity based on your role and location.</Typography>
      <Button disabled={!unreadCount} onClick={() => void readAll()} startIcon={<DoneAllRoundedIcon />} variant="contained">Mark all read</Button>
    </Stack>
    <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ p: 2 }}>
        <TextField label="Status" onChange={(event) => { setPage(0); setStatus(event.target.value as "all" | "read" | "unread"); }} select size="small" value={status} sx={{ minWidth: 190 }}>
          <MenuItem value="all">All notifications</MenuItem>
          <MenuItem value="unread">Unread only</MenuItem>
          <MenuItem value="read">Read only</MenuItem>
        </TextField>
      </Stack>
      <DataGrid
        autoHeight
        columns={columns}
        disableRowSelectionOnClick
        getRowClassName={({ row }) => row.isRead ? "" : "notification-unread-row"}
        onPaginationModelChange={({ page: nextPage, pageSize: nextPageSize }) => { setPage(nextPage); setPageSize(nextPageSize); }}
        onRowClick={({ row }) => void readOne(row.id)}
        pageSizeOptions={[10, 25, 50]}
        paginationMode="server"
        paginationModel={{ page, pageSize }}
        rowCount={pagination.total}
        rowHeight={64}
        rows={items}
        sx={{
          border: 0,
          minHeight: 520,
          "& .notification-unread-row": { bgcolor: "action.hover" },
          "& .MuiDataGrid-columnHeaders": { bgcolor: "action.hover" },
        }}
      />
    </Paper>
  </Box>;
}
