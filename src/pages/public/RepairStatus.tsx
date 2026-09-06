import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import { Box, Button, Card, Chip, Divider, Stack, Step, StepLabel, Stepper, TextField, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "react-toastify";
import PageMeta from "../../components/common/PageMeta";
import { getPublicRepairStatus, type PublicRepairStatus as PublicRepairStatusType } from "../../redux/slices/repairRedux/repairRedux";
import { fCurrency } from "../../utils/formatNumber";

const dateTime = (value: number | null) => value ? new Date(value).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" }) : "";

export default function RepairStatus() {
  const [params] = useSearchParams();
  const [jobNo, setJobNo] = useState(params.get("jobNo") ?? params.get("job") ?? "");
  const [token, setToken] = useState(params.get("token") ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublicRepairStatusType | null>(null);
  const activeStep = useMemo(() => Math.max(0, result?.timeline.findIndex((item) => item.active) ?? 0), [result]);

  const search = async () => {
    if (!jobNo.trim() || !token.trim()) {
      toast.error("Enter job ID and access code from your receipt.");
      return;
    }
    setLoading(true);
    try {
      setResult(await getPublicRepairStatus({ jobNo: jobNo.trim(), token: token.trim() }));
    } catch (error) {
      setResult(null);
      toast.error(error instanceof Error ? error.message : "Repair job not found.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobNo && token) void search();
  }, []);

  return <>
    <PageMeta description="Check repair status securely using your repair job receipt." title="Repair Status | MoBee.lk" />
    <Box sx={{
      alignItems: "center",
      bgcolor: "background.default",
      display: "flex",
      minHeight: "100vh",
      p: 2,
    }}>
      <Card sx={{ mx: "auto", p: { xs: 2.5, sm: 4 }, width: "min(760px, 100%)" }}>
        <Stack spacing={2.5}>
          <Stack alignItems="center" spacing={1}>
            <BuildRoundedIcon color="primary" sx={{ fontSize: 44 }} />
            <Typography textAlign="center" variant="h4">Repair Status</Typography>
            <Typography color="text.secondary" textAlign="center">Enter the Job ID and access code printed on your repair receipt.</Typography>
          </Stack>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr auto" } }}>
            <TextField label="Job ID" onChange={(event) => setJobNo(event.target.value.toUpperCase())} value={jobNo} />
            <TextField label="Access code" onChange={(event) => setToken(event.target.value.trim())} value={token} />
            <Button disabled={loading} onClick={() => void search()} startIcon={<SearchRoundedIcon />} variant="contained">Search</Button>
          </Box>
          {result ? <>
            <Divider />
            <Stack alignItems={{ xs: "flex-start", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
              <Box>
                <Typography variant="h5">{result.deviceName}</Typography>
                <Typography color="text.secondary" variant="body2">Job {result.jobNo} • {result.locationName}</Typography>
              </Box>
              <Chip color={result.status === "cancelled" ? "error" : result.status === "delivered" ? "success" : "primary"} icon={<VerifiedUserRoundedIcon />} label={result.statusLabel} />
            </Stack>
            <Box sx={{ bgcolor: "action.hover", borderRadius: 2, display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, p: 2 }}>
              <Typography><strong>IMEI / Serial:</strong> {result.serialImei || "—"}</Typography>
              <Typography><strong>Estimated cost:</strong> {fCurrency(Number(result.estimatedCost))}</Typography>
              <Typography><strong>Received:</strong> {dateTime(result.timestamp)}</Typography>
            </Box>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ display: { xs: "none", sm: "flex" } }}>
              {result.timeline.map((item) => <Step completed={item.completed} key={item.status}><StepLabel>{item.label}</StepLabel></Step>)}
            </Stepper>
            <Stack spacing={1} sx={{ display: { xs: "flex", sm: "none" } }}>
              {result.timeline.map((item) => <Card key={item.status} sx={{ border: 1, borderColor: item.active ? "primary.main" : "divider", p: 1.5 }}>
                <Typography fontWeight={800}>{item.label}</Typography>
                <Typography color="text.secondary" variant="body2">{dateTime(item.timestamp) || (item.completed ? "Completed" : "Pending")}</Typography>
              </Card>)}
            </Stack>
          </> : null}
        </Stack>
      </Card>
    </Box>
  </>;
}
