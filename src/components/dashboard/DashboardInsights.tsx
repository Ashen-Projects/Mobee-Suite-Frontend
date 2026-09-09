import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { alpha, type Theme } from "@mui/material/styles";
import type { ReactElement, ReactNode } from "react";
import type { DashboardInsight } from "../../redux/slices/dashboardRedux/dashboardApi";
import { fCurrency } from "../../utils/formatNumber";

const domainConfig: Record<DashboardInsight["domain"], { icon: ReactNode; label: string }> = {
  inventory: { icon: <Inventory2OutlinedIcon sx={{ fontSize: 17 }} />, label: "Inventory" },
  purchasing: { icon: <LocalShippingOutlinedIcon sx={{ fontSize: 17 }} />, label: "Purchasing" },
  repairs: { icon: <BuildRoundedIcon sx={{ fontSize: 17 }} />, label: "Repairs" },
  sales: { icon: <PointOfSaleRoundedIcon sx={{ fontSize: 17 }} />, label: "Sales" },
};

const severityConfig: Record<DashboardInsight["severity"], {
  color: "error" | "warning" | "info" | "success";
  icon: ReactNode;
  label: string;
}> = {
  critical: { color: "error", icon: <WarningAmberRoundedIcon sx={{ fontSize: 16 }} />, label: "Critical" },
  opportunity: { color: "info", icon: <AutoAwesomeRoundedIcon sx={{ fontSize: 16 }} />, label: "Opportunity" },
  positive: { color: "success", icon: <CheckCircleRoundedIcon sx={{ fontSize: 16 }} />, label: "On track" },
  warning: { color: "warning", icon: <WarningAmberRoundedIcon sx={{ fontSize: 16 }} />, label: "Attention" },
};

const metricValue = ({ format, value }: DashboardInsight["metric"]) => {
  if (format === "currency") return fCurrency(value);
  if (format === "percent") return `${value.toFixed(1)}%`;
  return value.toLocaleString("en-LK", { maximumFractionDigits: 1 });
};

const toneBackground = (theme: Theme, severity: DashboardInsight["severity"]) => (
  alpha(theme.palette[severityConfig[severity].color].main, theme.palette.mode === "dark" ? 0.09 : 0.045)
);

function InsightCard({ insight, onAction }: { insight: DashboardInsight; onAction?: (insight: DashboardInsight, state: "resolved" | "dismissed", note: string) => Promise<void> }) {
  const domain = domainConfig[insight.domain];
  const severity = severityConfig[insight.severity];
  return <Card
    sx={(theme) => ({
      backgroundColor: toneBackground(theme, insight.severity),
      border: 1,
      borderColor: alpha(theme.palette[severity.color].main, 0.26),
      boxShadow: "none",
      height: "100%",
    })}
  >
    <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%", p: { xs: 1.5, sm: 1.75 }, "&:last-child": { pb: { xs: 1.5, sm: 1.75 } } }}>
      <Stack alignItems="center" direction="row" justifyContent="space-between" spacing={1}>
        <Chip color={severity.color} icon={severity.icon as ReactElement} label={severity.label} size="small" variant="outlined" />
        <Stack alignItems="center" color="text.secondary" direction="row" spacing={0.5}>{domain.icon}<Typography fontSize={10.75} fontWeight={800}>{domain.label}</Typography></Stack>
      </Stack>

      <Stack alignItems="flex-start" direction="row" justifyContent="space-between" mt={1.35} spacing={1.5}>
        <Typography fontSize={13.25} fontWeight={900} lineHeight={1.35}>{insight.title}</Typography>
        <Box flexShrink={0} textAlign="right"><Typography color={`${severity.color}.main`} fontSize={16} fontWeight={900} lineHeight={1.2}>{metricValue(insight.metric)}</Typography><Typography color="text.secondary" fontSize={9.5}>{insight.metric.label}</Typography></Box>
      </Stack>
      <Typography color="text.secondary" fontSize={11.25} lineHeight={1.65} mt={0.8}>{insight.message}</Typography>

      <Box flexGrow={1} />
      <Divider sx={{ my: 1.2 }} />
      <Typography color="text.secondary" fontSize={9.75} fontWeight={800} letterSpacing={0.3} textTransform="uppercase">Recommended action</Typography>
      <Typography fontSize={10.75} lineHeight={1.55} mt={0.35}>{insight.action}</Typography>
      {insight.actionState ? <Stack alignItems="flex-start" mt={1} spacing={0.35}><Chip color={insight.actionState === "resolved" ? "success" : "default"} label={insight.actionState === "resolved" ? "Resolved" : "Dismissed"} size="small" />{insight.actionNote ? <Typography color="text.secondary" fontSize={9.75}>Note: {insight.actionNote}</Typography> : null}</Stack> : null}
      {onAction && !insight.actionState ? <Stack direction="row" gap={0.65} mt={1.1}><Button onClick={() => void onAction(insight, "resolved", "")} size="small" variant="outlined">Resolve</Button><Button color="inherit" onClick={() => void onAction(insight, "dismissed", "")} size="small">Dismiss</Button></Stack> : null}
      <Stack alignItems="center" direction="row" flexWrap="wrap" gap={0.6} mt={1.1}>
        <Chip label={`${insight.confidence === "rule" ? "Rule-based" : `${insight.confidence} confidence`}`} size="small" sx={{ height: 21, fontSize: 9.5 }} />
        <Typography color="text.secondary" fontSize={9.5}>{insight.period}</Typography>
      </Stack>
    </CardContent>
  </Card>;
}

export default function DashboardInsights({ insights = [], onAction }: { insights?: DashboardInsight[]; onAction?: (insight: DashboardInsight, state: "resolved" | "dismissed", note: string) => Promise<void> }) {
  const [selected, setSelected] = useState<{ insight: DashboardInsight; state: "resolved" | "dismissed" } | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const requestAction = async (insight: DashboardInsight, state: "resolved" | "dismissed", value: string) => {
    if (!value) { setNote(""); setSelected({ insight, state }); return; }
    await onAction?.(insight, state, value);
  };
  const confirmAction = async () => {
    if (!selected || !onAction) return;
    setSaving(true);
    try { await onAction(selected.insight, selected.state, note); setSelected(null); }
    finally { setSaving(false); }
  };
  return <Card sx={{ border: 1, borderColor: "divider" }}>
    <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
      <Stack alignItems={{ xs: "flex-start", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={0.75} mb={1.5}>
        <Stack alignItems="center" direction="row" spacing={1}>
          <Box sx={(theme) => ({ alignItems: "center", bgcolor: alpha(theme.palette.primary.main, 0.12), borderRadius: 1.5, color: "primary.main", display: "flex", height: 34, justifyContent: "center", width: 34 })}><AutoAwesomeRoundedIcon sx={{ fontSize: 19 }} /></Box>
          <Box><Typography fontSize={14.5} fontWeight={900}>Action centre</Typography><Typography color="text.secondary" fontSize={10.75}>Prioritized, explainable insights from current business data</Typography></Box>
        </Stack>
        <Chip color={insights.some(({ severity }) => severity === "critical") ? "error" : "default"} label={`${insights.length} insight${insights.length === 1 ? "" : "s"}`} size="small" />
      </Stack>

      {insights.length ? <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" } }}>
        {insights.map((insight) => <InsightCard insight={insight} key={insight.id} onAction={onAction ? requestAction : undefined} />)}
      </Box> : <Stack alignItems="center" bgcolor="action.hover" borderRadius={2} py={3} spacing={0.75} textAlign="center"><CheckCircleRoundedIcon color="success" /><Typography fontSize={13} fontWeight={850}>No immediate action detected</Typography><Typography color="text.secondary" fontSize={10.75}>The current rule-based checks found no significant exceptions.</Typography></Stack>}
    </CardContent>
    <Dialog fullWidth maxWidth="xs" onClose={() => !saving && setSelected(null)} open={Boolean(selected)}><DialogTitle>{selected?.state === "resolved" ? "Resolve insight" : "Dismiss insight"}</DialogTitle><DialogContent><Typography color="text.secondary" fontSize={12} mb={1.5}>Add a short note so managers can understand what action was taken later.</Typography><TextField autoFocus fullWidth label="Note (optional)" multiline minRows={3} onChange={(event) => setNote(event.target.value)} value={note} /></DialogContent><DialogActions><Button color="inherit" disabled={saving} onClick={() => setSelected(null)}>Cancel</Button><Button color={selected?.state === "resolved" ? "success" : "inherit"} disabled={saving} onClick={() => void confirmAction()} variant="contained">{selected?.state === "resolved" ? "Mark resolved" : "Dismiss insight"}</Button></DialogActions></Dialog>
  </Card>;
}
