import { Box, Card, CardContent, Stack, ToggleButton, ToggleButtonGroup, Typography, useTheme } from "@mui/material";
import type { ApexOptions } from "apexcharts";
import { useState } from "react";
import Chart from "react-apexcharts";
import type { DashboardOverview } from "../../redux/slices/dashboardRedux/dashboardApi";
import { fCurrency } from "../../utils/formatNumber";

const shortDate = (value: string) => new Intl.DateTimeFormat("en-LK", { day: "2-digit", month: "short" }).format(new Date(`${value}T00:00:00`));

export function SalesTrendChart({ sales }: { sales: NonNullable<DashboardOverview["sales"]> }) {
  const theme = useTheme();
  const [metric, setMetric] = useState<"revenue" | "transactions">("revenue");
  const isRevenue = metric === "revenue";
  const chartData = sales.trend.map((row) => isRevenue ? row.totalAmount : row.saleCount);
  const options: ApexOptions = {
    chart: { animations: { enabled: true, speed: 350 }, fontFamily: "Poppins, sans-serif", toolbar: { show: false }, zoom: { enabled: false } },
    colors: [theme.palette.primary.main],
    dataLabels: { enabled: false },
    fill: { gradient: { opacityFrom: 0.3, opacityTo: 0.02, stops: [0, 95, 100] }, type: "gradient" },
    grid: { borderColor: theme.palette.divider, strokeDashArray: 4 },
    markers: { hover: { sizeOffset: 3 }, size: sales.trend.length <= 7 ? 4 : 0 },
    stroke: { curve: "smooth", width: 3 },
    tooltip: { theme: theme.palette.mode, y: { formatter: (value) => isRevenue ? fCurrency(value) : `${Math.round(value)} sales` } },
    xaxis: {
      axisBorder: { show: false }, axisTicks: { show: false }, categories: sales.trend.map(({ date }) => shortDate(date)),
      labels: { hideOverlappingLabels: true, style: { colors: theme.palette.text.secondary, fontSize: "11px" } },
    },
    yaxis: { forceNiceScale: true, labels: { formatter: (value) => isRevenue && value >= 1_000 ? `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K` : String(Math.round(value)), style: { colors: theme.palette.text.secondary, fontSize: "11px" } } },
  };
  return <Card sx={{ border: 1, borderColor: "divider", height: "100%" }}>
    <CardContent sx={{ p: { xs: 1.75, sm: 2.25 }, "&:last-child": { pb: 1.5 } }}>
      <Stack alignItems={{ xs: "stretch", sm: "flex-start" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" mb={1} spacing={1.25}>
        <Box><Typography fontWeight={900}>Sales trend</Typography><Typography color="text.secondary" fontSize={12}>Completed sales across the selected period</Typography></Box>
        <ToggleButtonGroup
          exclusive
          onChange={(_, value: "revenue" | "transactions" | null) => value && setMetric(value)}
          size="small"
          value={metric}
          sx={{ alignSelf: { sm: "flex-start" }, "& .MuiToggleButton-root": { fontSize: 11, fontWeight: 800, px: 1.25, py: 0.45, textTransform: "none" } }}
        >
          <ToggleButton value="revenue">Revenue</ToggleButton>
          <ToggleButton value="transactions">Transactions</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <Box sx={{ mx: { xs: -1, sm: 0 } }}><Chart height={285} options={options} series={[{ data: chartData, name: isRevenue ? "Revenue" : "Transactions" }]} type="area" /></Box>
    </CardContent>
  </Card>;
}

export function PaymentMixChart({ payments }: { payments: Record<string, number> }) {
  const theme = useTheme();
  const labels = ["Cash", "Card", "Bank transfer"];
  const values = [payments.cash ?? 0, payments.card ?? 0, payments.bankTransfer ?? 0];
  const total = values.reduce((sum, value) => sum + value, 0);
  const options: ApexOptions = {
    chart: { fontFamily: "Poppins, sans-serif" },
    colors: [theme.palette.primary.main, theme.palette.info.main, theme.palette.success.main],
    dataLabels: { enabled: false },
    labels,
    legend: { fontSize: "12px", labels: { colors: theme.palette.text.secondary }, position: "bottom" },
    plotOptions: { pie: { donut: { labels: { show: true, total: { formatter: () => fCurrency(total), label: "Collected", show: true }, value: { formatter: (value) => fCurrency(Number(value)), show: true } }, size: "68%" } } },
    responsive: [{ breakpoint: 480, options: { chart: { height: 245 }, legend: { position: "bottom" } } }],
    stroke: { colors: [theme.palette.background.paper], width: 3 },
    tooltip: { theme: theme.palette.mode, y: { formatter: (value) => fCurrency(value) } },
  };
  return <Card sx={{ border: 1, borderColor: "divider", height: "100%" }}>
    <CardContent sx={{ p: { xs: 1.75, sm: 2.25 }, "&:last-child": { pb: 1.5 } }}>
      <Typography fontWeight={900}>Payment mix</Typography>
      <Typography color="text.secondary" fontSize={12}>Collected by payment method</Typography>
      {total > 0 ? <Chart height={285} options={options} series={values} type="donut" /> : <Stack alignItems="center" height={285} justifyContent="center"><Typography color="text.secondary" fontSize={13}>No payments in this period</Typography></Stack>}
    </CardContent>
  </Card>;
}
