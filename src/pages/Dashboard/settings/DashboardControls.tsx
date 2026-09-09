import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import { Alert, Box, Button, Card, CardContent, Chip, Divider, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import PageMeta from "../../../components/common/PageMeta";
import useAuth from "../../../hooks/useAuth";
import { getLocations, type Location } from "../../../redux/slices/settingsRedux/businessSettingsRedux";
import { getDashboardControls, saveDashboardInsightSettings, saveDashboardTarget, type DashboardControls, type DashboardInsightSettings } from "../../../redux/slices/dashboardRedux/dashboardApi";
import { USER_PERMISSIONS } from "../../../utils";
import { fCurrency } from "../../../utils/formatNumber";

const today = () => {
  const parts = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", timeZone: "Asia/Colombo", year: "numeric" }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return `${value.year}-${value.month}-${value.day}`;
};
const dateTime = (value: number) => {
  const date = new Date(Number(value));
  return Number.isNaN(date.getTime()) ? "Unknown time" : date.toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
};
const editableSettings = (value: DashboardInsightSettings) => Object.fromEntries(
  Object.entries(value).filter(([key]) => key !== "updatedAt"),
) as Omit<DashboardInsightSettings, "updatedAt">;
const targetState = ({ effectiveFrom, effectiveTo, isActive }: DashboardControls["targets"][number]) => {
  const currentDay = today();
  if (!isActive) return { color: "default" as const, label: "Inactive" };
  if (effectiveFrom > currentDay) return { color: "info" as const, label: "Scheduled" };
  if (effectiveTo && effectiveTo < currentDay) return { color: "default" as const, label: "Ended" };
  return { color: "success" as const, label: "Active" };
};
const fieldLabels: Array<{ key: keyof Omit<DashboardInsightSettings, "updatedAt">; label: string; helper: string }> = [
  { key: "salesDeclinePercent", label: "Sales decline alert (%)", helper: "Shows an alert when the latest 7-day sales amount falls by this percentage." },
  { key: "suggestedTargetGrowthPercent", label: "Suggested target growth (%)", helper: "Used only when no official weekly target is available." },
  { key: "deadStockDays", label: "Dead-stock days", helper: "No completed sale for this many days." },
  { key: "slowStockDays", label: "Slow-stock days", helper: "Recent sales activity window." },
  { key: "excessStockCoverDays", label: "Excess stock cover days", helper: "Flags products that have more than this many days of estimated cover." },
  { key: "stockoutCoverDays", label: "Stockout cover days", helper: "Flags products estimated to run out within this period." },
  { key: "overdueSupplierDays", label: "Supplier overdue days", helper: "Invoice must be overdue by at least this many days." },
  { key: "repairIntakeDays", label: "Repair intake days", helper: "Maximum time for Received or Inspection stages." },
  { key: "repairWaitingPartsDays", label: "Waiting-parts days", helper: "Maximum time before a parts delay is highlighted." },
  { key: "repairInProgressDays", label: "In-progress days", helper: "Maximum time before an active repair is highlighted." },
];

export default function DashboardControls() {
  const { can } = useAuth();
  const canUpdate = can(USER_PERMISSIONS.DASHBOARD_CONTROLS_UPDATE);
  const [controls, setControls] = useState<DashboardControls | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [settings, setSettings] = useState<Omit<DashboardInsightSettings, "updatedAt"> | null>(null);
  const [target, setTarget] = useState({ effectiveFrom: today(), locationId: 0, period: "weekly" as "weekly" | "monthly", targetAmount: "" });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingTarget, setSavingTarget] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextControls, nextLocations] = await Promise.all([
        getDashboardControls(),
        getLocations({ isActive: "true", page: 1, pageSize: 100, search: "", type: "all" }),
      ]);
      setControls(nextControls);
      setSettings(editableSettings(nextControls.settings));
      setLocations(nextLocations.items);
      setTarget((current) => ({ ...current, locationId: current.locationId || nextLocations.items[0]?.id || 0 }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load dashboard controls.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const activeTargets = useMemo(() => controls?.targets.filter((item) => targetState(item).label === "Active") ?? [], [controls]);
  const saveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    try {
      const saved = await saveDashboardInsightSettings(settings);
      setSettings(editableSettings(saved));
      setControls((current) => current ? { ...current, settings: saved } : current);
      toast.success("Insight thresholds updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update insight thresholds.");
    } finally { setSavingSettings(false); }
  };
  const saveTarget = async () => {
    const amount = Number(target.targetAmount.replace(/,/g, ""));
    if (!target.locationId || !Number.isFinite(amount) || amount <= 0) { toast.error("Choose a location and enter a valid target amount."); return; }
    setSavingTarget(true);
    try {
      await saveDashboardTarget({ effectiveFrom: target.effectiveFrom, locationId: target.locationId, period: target.period, targetAmount: amount });
      toast.success("Official target saved. The previous active target is preserved in history.");
      setTarget((current) => ({ ...current, targetAmount: "" }));
      await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save target."); }
    finally { setSavingTarget(false); }
  };

  return <><PageMeta description="Set official sales targets and dashboard insight thresholds." title="Dashboard Controls | Mobee Suite" />
    <Stack spacing={2.25}>
      <Stack alignItems={{ xs: "flex-start", md: "center" }} direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1.25}>
        <Box><Stack alignItems="center" direction="row" spacing={1}><AutoGraphRoundedIcon color="primary" sx={{ fontSize: 23 }} /><Typography variant="h4">Dashboard Controls</Typography></Stack><Typography color="text.secondary" fontSize={12.5} mt={0.35}>Official targets and transparent action rules. Changes are recorded in the audit log.</Typography></Box>
        <Button onClick={() => void load()} size="small" startIcon={<RestartAltRoundedIcon />} variant="outlined">Refresh</Button>
      </Stack>
      {!canUpdate ? <Alert severity="info">You can view these business controls, but only roles with dashboard controls update permission can change them.</Alert> : null}
      <Card><CardContent sx={{ p: { xs: 1.5, sm: 2.25 } }}><Stack alignItems={{ xs: "flex-start", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" mb={1.75} spacing={1}><Box><Stack alignItems="center" direction="row" spacing={0.75}><FlagRoundedIcon color="primary" fontSize="small" /><Typography fontWeight={900}>Official sales targets</Typography></Stack><Typography color="text.secondary" fontSize={11.5} mt={0.35}>Targets are location-based and effective-dated. They do not change historical sales records.</Typography></Box><Chip label={`${activeTargets.length} active`} size="small" /></Stack>
        <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "1.1fr .8fr .75fr 1fr auto" } }}><TextField disabled={!canUpdate || loading} label="Location" onChange={(event) => setTarget((value) => ({ ...value, locationId: Number(event.target.value) }))} select size="small" value={target.locationId}>{locations.map((location) => <MenuItem key={location.id} value={location.id}>{location.name}</MenuItem>)}</TextField><TextField disabled={!canUpdate || loading} label="Target period" onChange={(event) => setTarget((value) => ({ ...value, period: event.target.value as "weekly" | "monthly" }))} select size="small" value={target.period}><MenuItem value="weekly">Weekly</MenuItem><MenuItem value="monthly">Monthly</MenuItem></TextField><TextField disabled={!canUpdate || loading} label="Effective from" onChange={(event) => setTarget((value) => ({ ...value, effectiveFrom: event.target.value }))} size="small" type="date" value={target.effectiveFrom} /><TextField disabled={!canUpdate || loading} inputMode="decimal" label="Target amount (LKR)" onChange={(event) => setTarget((value) => ({ ...value, targetAmount: event.target.value.replace(/[^0-9.]/g, "") }))} size="small" value={target.targetAmount} /><Button disabled={!canUpdate || loading || savingTarget} onClick={() => void saveTarget()} startIcon={<SaveRoundedIcon />} variant="contained">Save target</Button></Box>
        <Stack divider={<Divider flexItem />} mt={2} spacing={0}>{controls?.targets.length ? controls.targets.map((item) => {
          const state = targetState(item);
          return <Stack alignItems={{ xs: "flex-start", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" key={item.id} py={1} spacing={0.75}><Stack alignItems="center" direction="row" flexWrap="wrap" gap={0.75}><Chip color="primary" label={item.period} size="small" variant="outlined" /><Typography fontSize={12.5} fontWeight={800}>{item.locationName}</Typography><Chip color={state.color} label={state.label} size="small" /></Stack><Stack alignItems={{ xs: "flex-start", sm: "center" }} direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.25, sm: 1.5 }}><Typography fontSize={12.5} fontWeight={900}>{fCurrency(item.targetAmount)}</Typography><Typography color="text.secondary" fontSize={10.75}>{item.effectiveFrom}{item.effectiveTo ? ` to ${item.effectiveTo}` : " onward"} • set by {item.createdBy}</Typography></Stack></Stack>;
        }) : <Typography color="text.secondary" fontSize={12} py={1.5}>No official targets have been set. The dashboard will use a clearly labelled suggested weekly target until you add one.</Typography>}</Stack>
      </CardContent></Card>
      <Card><CardContent sx={{ p: { xs: 1.5, sm: 2.25 } }}><Stack alignItems={{ xs: "flex-start", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" mb={1.75} spacing={1}><Box><Stack alignItems="center" direction="row" spacing={0.75}><EditRoundedIcon color="primary" fontSize="small" /><Typography fontWeight={900}>Insight thresholds</Typography></Stack><Typography color="text.secondary" fontSize={11.5} mt={0.35}>These rules decide when the Action Centre asks your team to review an exception.</Typography></Box><Button disabled={!canUpdate || loading || savingSettings || !settings} onClick={() => void saveSettings()} startIcon={<SaveRoundedIcon />} variant="contained">Save thresholds</Button></Stack>
        <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" } }}>{settings ? fieldLabels.map((field) => <TextField disabled={!canUpdate || loading} helperText={field.helper} inputMode="numeric" key={field.key} label={field.label} onChange={(event) => setSettings((current) => current ? { ...current, [field.key]: Number(event.target.value.replace(/[^0-9.]/g, "")) || 0 } : current)} size="small" value={settings[field.key]} />) : null}</Box>
      </CardContent></Card>
      <Card><CardContent sx={{ p: { xs: 1.5, sm: 2.25 } }}><Stack alignItems="center" direction="row" mb={1.5} spacing={0.75}><HistoryRoundedIcon color="primary" fontSize="small" /><Box><Typography fontWeight={900}>Insight action history</Typography><Typography color="text.secondary" fontSize={11.5} mt={0.25}>Most recent resolved and dismissed actions. Each action is retained for review.</Typography></Box></Stack>
        <Stack divider={<Divider flexItem />} spacing={0}>{controls?.insightActions.length ? controls.insightActions.map((item) => <Stack alignItems={{ xs: "flex-start", sm: "center" }} direction={{ xs: "column", sm: "row" }} gap={0.75} justifyContent="space-between" key={item.id} py={1.1}><Box minWidth={0}><Stack alignItems="center" direction="row" flexWrap="wrap" gap={0.6}><Chip color={item.state === "resolved" ? "success" : "default"} label={item.state === "resolved" ? "Resolved" : "Dismissed"} size="small" /><Typography fontSize={12.25} fontWeight={800}>{item.insightId.replace(/-/g, " ")}</Typography></Stack><Typography color="text.secondary" fontSize={10.75} mt={0.45}>{item.note || "No note recorded."}</Typography></Box><Box flexShrink={0} textAlign={{ xs: "left", sm: "right" }}><Typography fontSize={11.5} fontWeight={700}>{item.locationName || "All locations"}</Typography><Typography color="text.secondary" fontSize={10.25}>{item.actedBy} • {dateTime(item.timestamp)}</Typography></Box></Stack>) : <Typography color="text.secondary" fontSize={12} py={1.5}>No insight actions have been recorded yet.</Typography>}</Stack>
      </CardContent></Card>
    </Stack>
  </>;
}
