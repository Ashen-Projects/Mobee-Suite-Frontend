import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LocalAtmRoundedIcon from "@mui/icons-material/LocalAtmRounded";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import { Box, Button, ButtonBase, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Skeleton, Stack, TextField, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router";
import { toast } from "react-toastify";
import PageMeta from "../../../components/common/PageMeta";
import { closeDrawer, getCurrentDrawer, openDrawer, type CloseDrawerResult, type PosDrawer } from "../../../redux/slices/posRedux/drawerRedux";
import { PATH_DASHBOARD } from "../../../routes/paths";
import { fCurrency } from "../../../utils/formatNumber";
import { printDrawerSummaryReceipt } from "../../../utils/printDrawerSummaryReceipt";

const amount = (value: string) => Number(value.replace(/[^\d.]/g, "")) || 0;
const dateTime = (value: number) => new Date(value).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });

type ActionCardProps = {
  description: string;
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  to?: string;
};

function ActionCard({ description, disabled, icon, label, onClick, to }: ActionCardProps) {
  const content = <Stack alignItems="center" direction="row" gap={1.5}>
    <Box sx={{ alignItems: "center", bgcolor: "primary.main", borderRadius: 2, color: "primary.contrastText", display: "flex", height: 42, justifyContent: "center", width: 42 }}>{icon}</Box>
    <Box>
      <Typography fontWeight={800}>{label}</Typography>
      <Typography color="text.secondary" variant="body2">{description}</Typography>
    </Box>
  </Stack>;
  return <ButtonBase
    component={to && !disabled ? RouterLink : "button"}
    disabled={disabled}
    onClick={onClick}
    sx={{
      borderRadius: 3,
      color: "text.primary",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.55 : 1,
      textAlign: "left",
      textDecoration: "none",
      transition: "160ms ease",
      width: "100%",
      "&:hover": disabled ? {} : { transform: "translateY(-1px)" },
    }}
    to={to}
  >
    <Card sx={{ border: 1, borderColor: "divider", height: "100%", p: 2, width: "100%", "&:hover": disabled ? {} : { borderColor: "primary.main" } }}>{content}</Card>
  </ButtonBase>;
}

export default function PosLanding() {
  const navigate = useNavigate();
  const [drawer, setDrawer] = useState<PosDrawer | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openingCash, setOpeningCash] = useState("");
  const [openNote, setOpenNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [closeForm, setCloseForm] = useState({ bank: "", card: "", cash: "", expense: "", note: "" });
  const [lastClose, setLastClose] = useState<CloseDrawerResult | null>(null);
  const countedCash = amount(closeForm.cash);
  const countedCardTotal = amount(closeForm.card);
  const countedBankTransferTotal = amount(closeForm.bank);
  const cashExpenseAmount = amount(closeForm.expense);

  const load = async () => {
    setLoading(true);
    try {
      setDrawer(await getCurrentDrawer());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load POS drawer.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const submitOpen = async () => {
    if (amount(openingCash) < 0) return;
    setSaving(true);
    try {
      const opened = await openDrawer({ note: openNote.trim() || undefined, openingCash: amount(openingCash) });
      setDrawer(opened);
      setLastClose(null);
      setOpenDialog(false);
      toast.success("POS drawer opened.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to open POS drawer.");
    } finally {
      setSaving(false);
    }
  };

  const submitClose = async () => {
    if (!drawer) return;
    setSaving(true);
    try {
      const closeInputs = {
        cashExpenseAmount,
        countedBankTransferTotal,
        countedCardTotal,
        countedCash,
        note: closeForm.note.trim() || undefined,
      };
      const closed = await closeDrawer({
        cashExpenseAmount: closeInputs.cashExpenseAmount,
        countedBankTransferTotal: closeInputs.countedBankTransferTotal,
        countedCardTotal: closeInputs.countedCardTotal,
        countedCash: closeInputs.countedCash,
        note: closeInputs.note,
      });
      setLastClose(closed);
      printDrawerSummaryReceipt(drawer, closed, closeInputs);
      setDrawer(null);
      setCloseOpen(false);
      setCloseForm({ bank: "", card: "", cash: "", expense: "", note: "" });
      toast.success(`Drawer closed. Difference ${fCurrency(closed.difference)}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to close POS drawer.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!loading && !drawer) setOpenDialog(true);
  }, [drawer, loading]);

  return <>
    <PageMeta description="Open POS drawer and choose cashier actions." title="POS | Mobee Suite" />
    <Box sx={{
      bgcolor: "background.default",
      inset: 0,
      overflow: "auto",
      p: { xs: 2, md: 3 },
      position: "fixed",
      zIndex: (theme) => theme.zIndex.modal - 1,
    }}>
      <Stack spacing={2.5} sx={{ mx: "auto", width: "min(1440px, 100%)" }}>
        <Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
          <Stack alignItems="center" direction="row" spacing={1}>
            <PointOfSaleRoundedIcon color="primary" />
            <Typography variant="h4">POS</Typography>
          </Stack>
          <Stack alignItems="center" direction="row" gap={1} flexWrap="wrap">
            {drawer ? <Chip color="success" label={`Drawer open • ${drawer.locationName}`} /> : null}
            <Button color="inherit" onClick={() => navigate(PATH_DASHBOARD.dashboard.root)} variant="outlined">Back to panel</Button>
          </Stack>
        </Stack>

        {lastClose ? <Card sx={{ border: 1, borderColor: lastClose.difference === 0 ? "success.main" : "warning.main", p: 2 }}>
          <Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
            <Box>
              <Typography fontWeight={900}>Last drawer closed</Typography>
              <Typography color="text.secondary" variant="body2">{lastClose.summary.salesCount} sales • Total {fCurrency(lastClose.summary.totalAmount)}</Typography>
            </Box>
            <Chip color={lastClose.difference === 0 ? "success" : "warning"} label={`Cash difference ${fCurrency(lastClose.difference)}`} />
          </Stack>
        </Card> : null}

        {loading ? <Card sx={{ p: 3 }}><Skeleton height={44} /><Skeleton height={140} /></Card> : drawer ? (
          <Stack spacing={2.5}>
            <Card sx={{ p: 2.5 }}>
            <Stack alignItems={{ xs: "stretch", md: "center" }} direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
              <Box>
                <Typography fontWeight={900} variant="h5">Drawer is open</Typography>
                <Typography color="text.secondary" variant="body2">{drawer.userName} • {drawer.locationName} • Opened {dateTime(drawer.openedAt)}</Typography>
              </Box>
              <Stack direction="row" gap={1} flexWrap="wrap">
                <Chip icon={<LocalAtmRoundedIcon />} label={`Start cash ${fCurrency(Number(drawer.openingCash))}`} />
                <Button color="error" onClick={() => setCloseOpen(true)} startIcon={<CloseRoundedIcon />} variant="outlined">Close Drawer</Button>
              </Stack>
            </Stack>
          </Card>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" } }}>
            <ActionCard description="Scan item, choose customer, collect payment." icon={<PointOfSaleRoundedIcon />} label="Create Sale" to={`${PATH_DASHBOARD.pos.newSale}?mode=pos`} />
            <ActionCard description="Review and re-print invoices." icon={<ReceiptLongRoundedIcon />} label="Sales List" to={`${PATH_DASHBOARD.pos.sales}?mode=pos`} />
            <ActionCard description="Receive customer devices and print job receipt." icon={<BuildRoundedIcon />} label="Create Repair Job" to={`${PATH_DASHBOARD.repairs.jobs}?mode=pos&create=1`} />
            <ActionCard description="Future warranty workflow." disabled icon={<ShieldRoundedIcon />} label="Warranty Claim" />
          </Box>
          </Stack>
        ) : <Card sx={{ alignItems: "center", display: "flex", justifyContent: "center", minHeight: "calc(100vh - 120px)", p: 3 }}>
          <Stack alignItems="center" spacing={1.5}>
            <StorefrontRoundedIcon color="primary" sx={{ fontSize: 48 }} />
            <Typography variant="h5">Drawer not open</Typography>
            <Typography color="text.secondary" textAlign="center">Open your drawer to start POS actions.</Typography>
            {lastClose ? <Typography color="text.secondary" textAlign="center" variant="body2">Last difference {fCurrency(lastClose.difference)}</Typography> : null}
            <Button onClick={() => setOpenDialog(true)} variant="contained">Open Drawer</Button>
          </Stack>
        </Card>}
      </Stack>
    </Box>

    <Dialog fullWidth maxWidth="xs" onClose={() => navigate(PATH_DASHBOARD.dashboard.root)} open={openDialog && !drawer}>
      <DialogTitle sx={{ textAlign: "center" }}>
        <Box sx={{ alignItems: "center", bgcolor: "primary.main", borderRadius: "50%", color: "primary.contrastText", display: "flex", height: 58, justifyContent: "center", mx: "auto", mb: 1, width: 58 }}><StorefrontRoundedIcon /></Box>
        Open Drawer
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} pt={1}>
          <Typography color="text.secondary" textAlign="center" variant="body2">Enter the starting cash before creating sales.</Typography>
          <TextField autoFocus inputProps={{ inputMode: "decimal" }} label="Start cash amount" onChange={(event) => setOpeningCash(event.target.value)} value={openingCash} />
          <TextField label="Optional note" minRows={3} multiline onChange={(event) => setOpenNote(event.target.value)} value={openNote} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button color="inherit" onClick={() => navigate(PATH_DASHBOARD.dashboard.root)}>Back to panel</Button>
        <Button disabled={saving} onClick={() => void submitOpen()} startIcon={<LocalAtmRoundedIcon />} variant="contained">Open Drawer</Button>
      </DialogActions>
    </Dialog>

    <Dialog fullWidth maxWidth="sm" onClose={() => !saving && setCloseOpen(false)} open={closeOpen}>
      <DialogTitle>Close Drawer</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography color="text.secondary" variant="body2">Enter actual counted totals from the cash drawer and payment devices.</Typography>
          <Box sx={{ bgcolor: "action.hover", borderRadius: 2, display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, p: 1.5 }}>
            <Box><Typography color="text.secondary" variant="caption">Opening cash</Typography><Typography fontWeight={800}>{fCurrency(Number(drawer?.openingCash ?? 0))}</Typography></Box>
            <Box><Typography color="text.secondary" variant="caption">Cashier</Typography><Typography fontWeight={800}>{drawer?.userName ?? "—"}</Typography></Box>
            <Box><Typography color="text.secondary" variant="caption">Location</Typography><Typography fontWeight={800}>{drawer?.locationName ?? "—"}</Typography></Box>
            <Box><Typography color="text.secondary" variant="caption">Opened</Typography><Typography fontWeight={800}>{drawer ? dateTime(drawer.openedAt) : "—"}</Typography></Box>
          </Box>
          <TextField autoFocus inputProps={{ inputMode: "decimal" }} label="Counted cash amount" onChange={(event) => setCloseForm((current) => ({ ...current, cash: event.target.value }))} value={closeForm.cash} />
          <TextField inputProps={{ inputMode: "decimal" }} label="Card total from card machine" onChange={(event) => setCloseForm((current) => ({ ...current, card: event.target.value }))} value={closeForm.card} />
          <TextField inputProps={{ inputMode: "decimal" }} label="Bank transfer total" onChange={(event) => setCloseForm((current) => ({ ...current, bank: event.target.value }))} value={closeForm.bank} />
          <TextField inputProps={{ inputMode: "decimal" }} label="Cash expense / petty cash" onChange={(event) => setCloseForm((current) => ({ ...current, expense: event.target.value }))} value={closeForm.expense} />
          <Divider />
          <TextField label="Note / mismatch reason" minRows={3} multiline onChange={(event) => setCloseForm((current) => ({ ...current, note: event.target.value }))} value={closeForm.note} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" disabled={saving} onClick={() => setCloseOpen(false)}>Cancel</Button>
        <Button color="error" disabled={saving || !closeForm.cash.trim()} onClick={() => void submitClose()} variant="contained">Close Drawer</Button>
      </DialogActions>
    </Dialog>
  </>;
}
