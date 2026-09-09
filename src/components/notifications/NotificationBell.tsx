import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import { Badge, Box, Button, Chip, Divider, IconButton, ListItemText, Menu, MenuItem, Stack, Tooltip, Typography } from "@mui/material";
import { MouseEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import notificationSound from "../../assets/sounds/notification.wav";
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
  const previousUnreadCount = useRef<number | null>(null);
  const dispatch = useAppDispatch();
  const { items, unreadCount } = useAppSelector((state) => state.notifications);

  const refresh = async () => {
    const [count, list] = await Promise.all([
      getUnreadNotificationCount(),
      getNotifications({ page: 1, pageSize: 6, status: "all" }),
    ]);
    dispatch(notificationActions.unreadCountReceived(count));
    dispatch(notificationActions.received(list));
  };

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (previousUnreadCount.current !== null && unreadCount > previousUnreadCount.current) {
      playSound(notificationSound, 0.48);
    }
    previousUnreadCount.current = unreadCount;
  }, [unreadCount]);

  const open = (event: MouseEvent<HTMLElement>) => setAnchor(event.currentTarget);
  const close = () => setAnchor(null);
  const readOne = async (id: number) => {
    await markNotificationRead(id);
    dispatch(notificationActions.readOne(id));
  };
  const readAll = async () => {
    await markAllNotificationsRead();
    dispatch(notificationActions.readAll());
  };

  return <>
    <Tooltip title="Notifications">
      <IconButton aria-label="Notifications" onClick={open} size="small" sx={{ display: { xs: "none", sm: "inline-flex" }, height: 36, width: 36 }}>
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsNoneOutlinedIcon fontSize="small" />
        </Badge>
      </IconButton>
    </Tooltip>
    <Menu
      anchorEl={anchor}
      onClose={close}
      open={Boolean(anchor)}
      slotProps={{ paper: { sx: { border: 1, borderColor: "divider", borderRadius: 3, maxWidth: 390, mt: 1, overflow: "hidden", width: 390 } } }}
    >
      <Stack alignItems="center" direction="row" justifyContent="space-between" sx={{ px: 2, py: 1.5 }}>
        <Box>
          <Typography fontWeight={900}>Notifications</Typography>
          <Typography color="text.secondary" fontSize={12}>{unreadCount} unread</Typography>
        </Box>
        <Button disabled={!unreadCount} onClick={() => void readAll()} size="small" startIcon={<DoneAllRoundedIcon />}>Read all</Button>
      </Stack>
      <Divider />
      {items.length ? items.map((item) => (
        <MenuItem
          key={item.id}
          onClick={() => void readOne(item.id)}
          sx={{ alignItems: "flex-start", gap: 1.25, py: 1.25, whiteSpace: "normal" }}
        >
          <Box sx={{ bgcolor: item.isRead ? "action.hover" : "primary.main", borderRadius: 999, height: 9, mt: 1, width: 9 }} />
          <ListItemText
            primary={<Stack alignItems="center" direction="row" spacing={1}><Typography fontSize={13} fontWeight={800}>{item.title}</Typography><Chip color={severityColor(item.severity)} label={item.module} size="small" sx={{ height: 20, textTransform: "capitalize" }} /></Stack>}
            secondary={<><Typography color="text.secondary" component="span" display="block" fontSize={12}>{item.message}</Typography><Typography color="text.disabled" component="span" display="block" fontSize={11} mt={0.5}>{formatDateTime(item.timestamp)}</Typography></>}
          />
        </MenuItem>
      )) : <Box sx={{ px: 2, py: 4, textAlign: "center" }}><Typography color="text.secondary">No notifications yet.</Typography></Box>}
      <Divider />
      <Button component={Link} endIcon={<OpenInNewRoundedIcon />} fullWidth onClick={close} sx={{ borderRadius: 0, py: 1.25 }} to={PATH_DASHBOARD.notifications}>View all notifications</Button>
    </Menu>
  </>;
}
