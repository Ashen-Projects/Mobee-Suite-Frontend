import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { Box, Chip, Stack, Typography } from "@mui/material";
import type { AppNotification } from "../../redux/slices/notificationRedux/notificationRedux";
import { formatDateTime } from "../../utils/formatDateTime";

type Props = { notification: AppNotification };

const presentation = (severity: AppNotification["severity"]) => {
  if (severity === "critical") return { color: "error.main", icon: <ErrorOutlineRoundedIcon fontSize="small" /> };
  if (severity === "warning") return { color: "warning.main", icon: <WarningAmberRoundedIcon fontSize="small" /> };
  if (severity === "success") return { color: "success.main", icon: <TaskAltRoundedIcon fontSize="small" /> };
  return { color: "info.main", icon: <NotificationsRoundedIcon fontSize="small" /> };
};

// Deliberately compact: this is an arrival alert, while the notification page
// remains the durable full history and the bell remains the unread inbox.
export default function IncomingNotificationToast({ notification }: Props) {
  const { color, icon } = presentation(notification.severity);
  return <Stack alignItems="flex-start" direction="row" spacing={1.25} sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderLeft: 4, borderLeftColor: color, borderRadius: 2.5, boxShadow: "0 18px 44px rgba(0,0,0,0.28)", minWidth: 0, p: 1.5 }}>
    <Box sx={{ alignItems: "center", bgcolor: "action.hover", borderRadius: 1.5, color, display: "flex", flex: "0 0 auto", height: 34, justifyContent: "center", width: 34 }}>{icon}</Box>
    <Box sx={{ minWidth: 0, pr: 0.5 }}>
      <Stack alignItems="center" direction="row" spacing={0.75} sx={{ mb: 0.35 }}>
        <Typography fontSize={13} fontWeight={900} noWrap>{notification.title}</Typography>
        <Chip label={notification.module} size="small" sx={{ height: 18, maxWidth: 78, textTransform: "capitalize", "& .MuiChip-label": { fontSize: 10, overflow: "hidden", textOverflow: "ellipsis" } }} />
      </Stack>
      <Typography color="text.secondary" fontSize={12} sx={{ display: "-webkit-box", overflow: "hidden", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}>{notification.message}</Typography>
      <Typography color="text.disabled" display="block" fontSize={10.5} mt={0.6}>{formatDateTime(notification.timestamp)}</Typography>
    </Box>
  </Stack>;
}
