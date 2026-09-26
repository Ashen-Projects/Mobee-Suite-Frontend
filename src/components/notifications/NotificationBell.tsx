import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import { Badge, Box, Button, Chip, Divider, IconButton, ListItemText, Menu, MenuItem, Stack, Tooltip, Typography } from "@mui/material";
import { MouseEvent, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "react-toastify";
import notificationSound from "../../assets/sounds/notification.wav";
import IncomingNotificationToast from "./IncomingNotificationToast";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../redux/slices/notificationRedux/notificationApi";
import {
  notificationActions,
  type AppNotification,
} from "../../redux/slices/notificationRedux/notificationRedux";
import { useAppDispatch, useAppSelector } from "../../redux/store";
import { PATH_DASHBOARD } from "../../routes/paths";
import { formatDateTime } from "../../utils/formatDateTime";
import { playSound } from "../../utils/playSound";

const severityColor = (severity: AppNotification["severity"]) => {
  if (severity === "critical") return "error";
  if (severity === "warning") return "warning";
  if (severity === "success") return "success";
  return "info";
};

export default function NotificationBell() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const knownNotificationIds = useRef(new Set<number>());
  const notificationSessionStartedAt = useRef(Date.now());
  const dispatch = useAppDispatch();
  const { unreadCount, unreadItems } = useAppSelector((state) => state.notifications);

  const showArrivalToast = useCallback((item: AppNotification) => {
    toast(<IncomingNotificationToast notification={item} />, {
      autoClose: 8_000,
      className: "notification-arrival-toast",
      closeButton: false,
      closeOnClick: true,
      draggable: false,
      hideProgressBar: true,
      pauseOnHover: true,
      position: "top-right",
      toastId: `notification-arrival-${item.id}`,
    });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [count, list] = await Promise.all([
        getUnreadNotificationCount(),
        getNotifications({ page: 1, pageSize: 50, status: "unread" }),
      ]);
      const incoming = list.items.filter((item) => (
        item.timestamp >= notificationSessionStartedAt.current
        && !knownNotificationIds.current.has(item.id)
      )).reverse();
      list.items.forEach((item) => knownNotificationIds.current.add(item.id));
      while (knownNotificationIds.current.size > 500) {
        const oldestId = knownNotificationIds.current.values().next().value;
        if (oldestId === undefined) break;
        knownNotificationIds.current.delete(oldestId);
      }
      dispatch(notificationActions.unreadCountReceived(count));
      dispatch(notificationActions.unreadReceived(list));
      if (incoming.length) {
        playSound(notificationSound, 0.48);
        incoming.forEach(showArrivalToast);
      }
    } catch {
      // Polling must stay silent when a temporary network error occurs.
    }
  }, [dispatch, showArrivalToast]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const open = (event: MouseEvent<HTMLElement>) => setAnchor(event.currentTarget);
  const close = () => setAnchor(null);
  const readOne = async (id: number) => {
    try {
      await markNotificationRead(id);
      dispatch(notificationActions.readOne(id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to mark this notification as read.");
    }
  };
  const readAll = async () => {
    try {
      await markAllNotificationsRead();
      dispatch(notificationActions.readAll());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to mark notifications as read.");
    }
  };

  return <>
    <Tooltip title="Notifications">
      <IconButton aria-label="Notifications" onClick={open} size="small" sx={{ display: "inline-flex", height: { xs: 30, sm: 36 }, width: { xs: 30, sm: 36 } }}>
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsNoneOutlinedIcon fontSize="small" />
        </Badge>
      </IconButton>
    </Tooltip>
    <Menu
      anchorEl={anchor}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      onClose={close}
      open={Boolean(anchor)}
      slotProps={{ paper: { sx: { border: 1, borderColor: "divider", borderRadius: 3, maxWidth: 390, mt: 1, overflow: "hidden", width: "min(390px, calc(100vw - 20px))" } } }}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
    >
      <Stack alignItems="center" direction="row" justifyContent="space-between" sx={{ px: 2, py: 1.5 }}>
        <Box>
          <Typography fontWeight={900}>Notifications</Typography>
          <Typography color="text.secondary" fontSize={12}>{unreadCount} unread</Typography>
        </Box>
        <Button disabled={!unreadCount} onClick={() => void readAll()} size="small" startIcon={<DoneAllRoundedIcon />}>Read all</Button>
      </Stack>
      <Divider />
      {unreadItems.length ? unreadItems.slice(0, 6).map((item) => (
        <MenuItem
          key={item.id}
          onClick={() => void readOne(item.id)}
          sx={{ alignItems: "flex-start", gap: 1.25, py: 1.25, whiteSpace: "normal" }}
        >
          <Box sx={{ bgcolor: "primary.main", borderRadius: 999, height: 9, mt: 1, width: 9 }} />
          <ListItemText
            primary={<Stack alignItems="center" direction="row" spacing={1}><Typography fontSize={13} fontWeight={800}>{item.title}</Typography><Chip color={severityColor(item.severity)} label={item.module} size="small" sx={{ height: 20, textTransform: "capitalize" }} /></Stack>}
            secondary={<><Typography color="text.secondary" component="span" display="block" fontSize={12}>{item.message}</Typography><Typography color="text.disabled" component="span" display="block" fontSize={11} mt={0.5}>{formatDateTime(item.timestamp)}</Typography></>}
          />
        </MenuItem>
      )) : <Box sx={{ px: 2, py: 4, textAlign: "center" }}><Typography color="text.secondary">You are all caught up.</Typography></Box>}
      <Divider />
      <Button component={Link} endIcon={<OpenInNewRoundedIcon />} fullWidth onClick={close} sx={{ borderRadius: 0, py: 1.25 }} to={PATH_DASHBOARD.notifications}>View all notifications</Button>
    </Menu>
  </>;
}
