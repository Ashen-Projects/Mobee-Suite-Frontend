import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { ReactNode } from "react";

type Props = {
  caption?: string;
  icon: ReactNode;
  label: string;
  tone?: "primary" | "success" | "warning" | "error" | "info";
  trend?: number | null;
  value: string;
};

export default function DashboardMetricCard({ caption, icon, label, tone = "primary", trend, value }: Props) {
  return <Card sx={{ border: 1, borderColor: "divider", height: "100%", overflow: "hidden", position: "relative" }}>
    <Box sx={(theme) => ({ bgcolor: alpha(theme.palette[tone].main, 0.85), height: 3, left: 0, position: "absolute", right: 0, top: 0 })} />
    <CardContent sx={{ p: { xs: 1.75, sm: 2 }, "&:last-child": { pb: { xs: 1.75, sm: 2 } } }}>
      <Stack alignItems="flex-start" direction="row" justifyContent="space-between" spacing={1.5}>
        <Box minWidth={0}>
          <Typography color="text.secondary" fontSize={12.5} fontWeight={750}>{label}</Typography>
          <Typography fontSize={{ xs: 20, sm: 23 }} fontWeight={900} letterSpacing={-0.5} mt={0.5} noWrap>{value}</Typography>
        </Box>
        <Box sx={(theme) => ({ alignItems: "center", bgcolor: alpha(theme.palette[tone].main, 0.13), borderRadius: 2, color: `${tone}.main`, display: "flex", flexShrink: 0, height: 38, justifyContent: "center", width: 38 })}>{icon}</Box>
      </Stack>
      <Stack alignItems="center" direction="row" mt={1.25} spacing={0.75}>
        {trend !== undefined ? <Chip
          color={trend === null ? "default" : trend >= 0 ? "success" : "error"}
          icon={trend === null ? undefined : trend >= 0 ? <ArrowUpwardRoundedIcon /> : <ArrowDownwardRoundedIcon />}
          label={trend === null ? "New activity" : `${Math.abs(trend).toFixed(1)}%`}
          size="small"
          sx={{ fontSize: 10.5, fontWeight: 850, height: 22, "& .MuiChip-icon": { fontSize: 13 } }}
          variant="outlined"
        /> : null}
        {caption ? <Typography color="text.secondary" fontSize={10.75} noWrap>{caption}</Typography> : null}
      </Stack>
    </CardContent>
  </Card>;
}
