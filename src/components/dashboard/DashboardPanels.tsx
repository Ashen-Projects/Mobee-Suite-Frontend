import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { Box, Button, Card, CardContent, Chip, Divider, LinearProgress, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Link } from "react-router";
import type { DashboardOverview } from "../../redux/slices/dashboardRedux/dashboardApi";
import { PATH_DASHBOARD } from "../../routes/paths";
import { fCurrency } from "../../utils/formatNumber";

const statusLabel = (value: string) => value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (letter) => letter.toUpperCase());
const formatDate = (value: number) => new Intl.DateTimeFormat("en-LK", { day: "2-digit", month: "short" }).format(new Date(value));

function PanelHeader({ action, title }: { action?: React.ReactNode; title: string }) {
  return <Stack alignItems="center" direction="row" justifyContent="space-between" spacing={1.5}>
    <Typography fontWeight={900}>{title}</Typography>{action}
  </Stack>;
}

export function TopProductsPanel({ products }: { products: NonNullable<DashboardOverview["sales"]>["topProducts"] }) {
  const maximum = Math.max(...products.map(({ totalAmount }) => totalAmount), 1);
  return <Card sx={{ border: 1, borderColor: "divider", height: "100%" }}><CardContent sx={{ p: { xs: 1.75, sm: 2.25 } }}>
    <PanelHeader action={<Button component={Link} endIcon={<ArrowForwardRoundedIcon />} size="small" to={PATH_DASHBOARD.reports.sales}>Report</Button>} title="Top products" />
    <Typography color="text.secondary" fontSize={12} mb={2}>Ranked by sales value in this period</Typography>
    <Stack divider={<Divider flexItem />} spacing={0}>
      {products.map((product, index) => <Box key={product.productId} py={1.15}>
        <Stack alignItems="center" direction="row" justifyContent="space-between" spacing={2}>
          <Stack alignItems="center" direction="row" minWidth={0} spacing={1}>
            <Box sx={{ alignItems: "center", bgcolor: "action.hover", borderRadius: 1.5, color: "text.secondary", display: "flex", flexShrink: 0, fontSize: 11, fontWeight: 900, height: 28, justifyContent: "center", width: 28 }}>{index + 1}</Box>
            <Box minWidth={0}><Typography fontSize={12.75} fontWeight={800} noWrap>{product.productName}</Typography><Typography color="text.secondary" fontSize={10.75}>{product.quantity} units</Typography></Box>
          </Stack>
          <Typography fontSize={12.25} fontWeight={850} whiteSpace="nowrap">{fCurrency(product.totalAmount)}</Typography>
        </Stack>
        <LinearProgress sx={{ borderRadius: 99, height: 4, mt: 1 }} value={(product.totalAmount / maximum) * 100} variant="determinate" />
      </Box>)}
      {!products.length ? <Typography color="text.secondary" fontSize={13} py={6} textAlign="center">No products sold in this period</Typography> : null}
    </Stack>
  </CardContent></Card>;
}

export function StockAlertsPanel({ inventory }: { inventory: NonNullable<DashboardOverview["inventory"]> }) {
  return <Card sx={{ border: 1, borderColor: "divider", height: "100%" }}><CardContent sx={{ p: { xs: 1.75, sm: 2.25 } }}>
    <PanelHeader action={<Button component={Link} endIcon={<ArrowForwardRoundedIcon />} size="small" to={PATH_DASHBOARD.inventory.stocks}>Stock</Button>} title="Stock attention" />
    <Stack direction="row" mt={0.75} spacing={0.75}><Chip color="error" label={`${inventory.outOfStockCount} out`} size="small" variant="outlined" /><Chip color="warning" label={`${inventory.lowStockCount} low`} size="small" variant="outlined" /></Stack>
    <Stack divider={<Divider flexItem />} mt={1.25}>
      {inventory.stockAlerts.map((alert) => <Stack alignItems="center" direction="row" key={`${alert.productId}-${alert.locationId}`} py={1.15} spacing={1.25}>
        <Box sx={(theme) => ({ alignItems: "center", bgcolor: alpha(theme.palette[alert.availableUnits === 0 ? "error" : "warning"].main, 0.12), borderRadius: 1.5, color: alert.availableUnits === 0 ? "error.main" : "warning.main", display: "flex", flexShrink: 0, height: 34, justifyContent: "center", width: 34 })}><Inventory2OutlinedIcon sx={{ fontSize: 18 }} /></Box>
        <Box flex={1} minWidth={0}><Typography fontSize={12.5} fontWeight={800} noWrap>{alert.productName}</Typography><Typography color="text.secondary" fontSize={10.75} noWrap>{alert.locationName}{alert.sku ? ` • ${alert.sku}` : ""}</Typography></Box>
        <Box textAlign="right"><Typography color={alert.availableUnits === 0 ? "error.main" : "warning.main"} fontSize={12.5} fontWeight={900}>{alert.availableUnits}</Typography><Typography color="text.secondary" fontSize={10}>min {alert.minimumStockLevel}</Typography></Box>
      </Stack>)}
      {!inventory.stockAlerts.length ? <Typography color="text.secondary" fontSize={13} py={6} textAlign="center">All configured stock levels are healthy</Typography> : null}
    </Stack>
  </CardContent></Card>;
}

export function RepairQueuePanel({ repairs }: { repairs: NonNullable<DashboardOverview["repairs"]> }) {
  return <Card sx={{ border: 1, borderColor: "divider", height: "100%" }}><CardContent sx={{ p: { xs: 1.75, sm: 2.25 } }}>
    <PanelHeader action={<Button component={Link} endIcon={<ArrowForwardRoundedIcon />} size="small" to={PATH_DASHBOARD.repairs.jobs}>Jobs</Button>} title="Repair queue" />
    <Typography color="text.secondary" fontSize={12} mb={1.25}>{repairs.activeJobs} jobs currently active</Typography>
    <Stack divider={<Divider flexItem />}>
      {repairs.oldestActiveJobs.map((job) => <Stack alignItems="center" direction="row" key={job.jobNo} py={1.15} spacing={1.25}>
        <Box sx={(theme) => ({ alignItems: "center", bgcolor: alpha(theme.palette.primary.main, 0.12), borderRadius: 1.5, color: "primary.main", display: "flex", flexShrink: 0, height: 34, justifyContent: "center", width: 34 })}><BuildRoundedIcon sx={{ fontSize: 18 }} /></Box>
        <Box flex={1} minWidth={0}><Typography fontSize={12.5} fontWeight={850} noWrap>{job.deviceName}</Typography><Typography color="text.secondary" fontSize={10.75} noWrap>{job.jobNo} • {job.customerName}</Typography></Box>
        <Box textAlign="right"><Chip color="primary" label={statusLabel(job.status)} size="small" variant="outlined" /><Typography color="text.secondary" fontSize={9.75} mt={0.35}>{formatDate(job.timestamp)}</Typography></Box>
      </Stack>)}
      {!repairs.oldestActiveJobs.length ? <Typography color="text.secondary" fontSize={13} py={6} textAlign="center">No active repair jobs</Typography> : null}
    </Stack>
  </CardContent></Card>;
}

export function StatusBreakdownPanel({ title, rows }: { rows: Array<{ status: string; total: number }>; title: string }) {
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  return <Card sx={{ border: 1, borderColor: "divider", height: "100%" }}><CardContent sx={{ p: { xs: 1.75, sm: 2.25 } }}>
    <PanelHeader title={title} />
    <Typography color="text.secondary" fontSize={12} mb={2}>{total} records in the selected view</Typography>
    <Stack spacing={1.35}>{rows.map((row) => <Box key={row.status}>
      <Stack direction="row" justifyContent="space-between" mb={0.6}><Typography fontSize={12.25} fontWeight={750}>{statusLabel(row.status)}</Typography><Typography fontSize={12.25} fontWeight={900}>{row.total}</Typography></Stack>
      <LinearProgress color="primary" sx={{ bgcolor: "action.hover", borderRadius: 99, height: 6 }} value={total ? (row.total / total) * 100 : 0} variant="determinate" />
    </Box>)}{!rows.length ? <Typography color="text.secondary" fontSize={13} py={5} textAlign="center">No activity in this period</Typography> : null}</Stack>
  </CardContent></Card>;
}
