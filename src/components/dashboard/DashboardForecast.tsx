import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import { Box, Card, CardContent, Chip, Divider, LinearProgress, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";
import type { DashboardForecast, DashboardForecastAccuracy, DashboardForecastSeasonality } from "../../redux/slices/dashboardRedux/dashboardApi";
import { fCurrency } from "../../utils/formatNumber";

const shortDate = (value: string) => new Intl.DateTimeFormat("en-LK", { day: "2-digit", month: "short" }).format(new Date(`${value}T00:00:00`));

function ForecastAccuracy({ accuracy }: { accuracy: DashboardForecastAccuracy }) {
  if (accuracy.unavailable || accuracy.accuracy === null) {
    return <Box>
      <Typography color="text.secondary" fontSize={11.5} fontWeight={700}>{accuracy.horizonDays}-day accuracy</Typography>
      <Typography color="text.secondary" fontSize={12} mt={0.55}>{accuracy.reason ?? "Not enough history yet."}</Typography>
    </Box>;
  }
  const value = Math.round(accuracy.accuracy);
  return <Box>
    <Stack alignItems="baseline" direction="row" justifyContent="space-between" spacing={1}>
      <Typography color="text.secondary" fontSize={11.5} fontWeight={700}>{accuracy.horizonDays}-day accuracy</Typography>
      <Typography color={value >= 85 ? "success.main" : value >= 70 ? "warning.main" : "error.main"} fontSize={19} fontWeight={900}>{value}%</Typography>
    </Stack>
    <LinearProgress color={value >= 85 ? "success" : value >= 70 ? "warning" : "error"} sx={{ borderRadius: 999, height: 6, mt: 0.65 }} value={value} variant="determinate" />
    <Typography color="text.secondary" fontSize={10.5} mt={0.65}>{accuracy.evaluationWindows} prior outcome{accuracy.evaluationWindows === 1 ? "" : "s"} compared</Typography>
  </Box>;
}

function DemandPattern({ seasonality }: { seasonality: DashboardForecastSeasonality }) {
  const theme = useTheme();
  if (seasonality.reason || !seasonality.weekdays.length) {
    return <Stack height={166} justifyContent="center"><Typography color="text.secondary" fontSize={12}>{seasonality.reason ?? "No demand pattern is available yet."}</Typography></Stack>;
  }
  const options: ApexOptions = {
    chart: { fontFamily: "Poppins, sans-serif", sparkline: { enabled: true }, toolbar: { show: false } },
    colors: [theme.palette.primary.main],
    dataLabels: { enabled: false },
    grid: { padding: { bottom: 0, left: 0, right: 0, top: 0 } },
    plotOptions: { bar: { borderRadius: 4, columnWidth: "52%" } },
    tooltip: { theme: theme.palette.mode, y: { formatter: (value) => fCurrency(value) } },
    xaxis: { categories: seasonality.weekdays.map(({ dayName }) => dayName.slice(0, 3)), labels: { style: { colors: theme.palette.text.secondary, fontSize: "10px" } } },
    yaxis: { labels: { show: false } },
  };
  return <Box>
    <Chart height={152} options={options} series={[{ data: seasonality.weekdays.map(({ averageAmount }) => averageAmount), name: "Average sales" }]} type="bar" />
    <Typography color="text.secondary" fontSize={10.5} mt={-0.35}>
      {seasonality.strongestDay?.dayName} is strongest; {seasonality.quietestDay?.dayName} is quietest. {seasonality.annualPatternAvailable && seasonality.strongestMonth ? `${seasonality.strongestMonth.monthName} is the strongest annual period.` : "Annual seasonality needs 12 months of completed sales."}
    </Typography>
  </Box>;
}

function LockedForecastDetails() {
  return <Card sx={{ border: 1, borderColor: "divider", overflow: "hidden", position: "relative" }}>
    <Box aria-hidden sx={{ filter: "blur(3px)", opacity: 0.32, p: 2.25, pointerEvents: "none", userSelect: "none" }}>
      <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        {[0, 1, 2].map((index) => <Box key={index} sx={{ bgcolor: index === 1 ? "primary.main" : "action.selected", borderRadius: 1.5, height: 60 }} />)}
      </Box>
      <Box sx={{ bgcolor: "action.selected", borderRadius: 1.5, height: 100, mt: 1.5 }} />
    </Box>
    <Stack alignItems="center" justifyContent="center" position="absolute" px={2.5} sx={{ inset: 0 }} textAlign="center">
      <Box sx={(theme) => ({ alignItems: "center", bgcolor: alpha(theme.palette.primary.main, 0.16), borderRadius: "50%", color: "primary.main", display: "flex", height: 44, justifyContent: "center", mb: 1, width: 44 })}><LockOutlinedIcon fontSize="small" /></Box>
      <Typography fontSize={14} fontWeight={900}>Detailed forecast is protected</Typography>
      <Typography color="text.secondary" fontSize={11.5} mt={0.3}>Ask an administrator for the Forecast view permission to see patterns, accuracy and management recommendations.</Typography>
    </Stack>
  </Card>;
}

export default function DashboardForecastPanel({ forecast, canViewDetails }: { forecast: DashboardForecast; canViewDetails: boolean }) {
  const theme = useTheme();
  const { sevenDay } = forecast;
  const trendIsPositive = (sevenDay.changeFromLastPeriod ?? 0) >= 0;
  const outlookOptions: ApexOptions = {
    chart: { animations: { enabled: true, speed: 350 }, fontFamily: "Poppins, sans-serif", toolbar: { show: false }, zoom: { enabled: false } },
    colors: [theme.palette.primary.main],
    dataLabels: { enabled: false },
    fill: { gradient: { opacityFrom: 0.32, opacityTo: 0.03, stops: [0, 100] }, type: "gradient" },
    grid: { borderColor: theme.palette.divider, strokeDashArray: 4 },
    markers: { size: 3 },
    stroke: { curve: "smooth", width: 3 },
    tooltip: { theme: theme.palette.mode, y: { formatter: (value) => fCurrency(value) } },
    xaxis: { axisBorder: { show: false }, axisTicks: { show: false }, categories: sevenDay.points.map(({ date }) => shortDate(date)), labels: { style: { colors: theme.palette.text.secondary, fontSize: "10px" } } },
    yaxis: { labels: { formatter: (value) => value >= 1_000 ? `${(value / 1_000).toFixed(0)}K` : String(Math.round(value)), style: { colors: theme.palette.text.secondary, fontSize: "10px" } } },
  };

  return <Stack spacing={1.5}>
    <Card sx={{ border: 1, borderColor: "divider" }}>
      <CardContent sx={{ p: { xs: 1.75, sm: 2.25 }, "&:last-child": { pb: { xs: 1.75, sm: 2.25 } } }}>
        <Stack alignItems={{ xs: "flex-start", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
          <Box>
            <Stack alignItems="center" direction="row" spacing={0.8}><AutoGraphRoundedIcon color="primary" fontSize="small" /><Typography fontWeight={900}>Sales outlook</Typography></Stack>
            <Typography color="text.secondary" fontSize={11.5} mt={0.25}>Forward-looking estimate from completed sales through {shortDate(forecast.dataThrough)}.</Typography>
          </Box>
          <Chip color={forecast.confidence === "high" ? "success" : forecast.confidence === "medium" ? "warning" : "default"} label={`${forecast.confidence === "limited" ? "Limited" : forecast.confidence[0].toUpperCase() + forecast.confidence.slice(1)} confidence · ${forecast.historyDays} days`} size="small" variant="outlined" />
        </Stack>
        {sevenDay.unavailable ? <Stack alignItems="center" height={190} justifyContent="center" textAlign="center"><Typography fontWeight={800}>Forecast preparing</Typography><Typography color="text.secondary" fontSize={12} mt={0.35}>{sevenDay.reason}</Typography></Stack> : <Box sx={{ display: "grid", gap: { xs: 1.5, md: 2.25 }, gridTemplateColumns: { xs: "1fr", md: "minmax(190px, .7fr) minmax(0, 1.5fr)" }, mt: 1.5 }}>
          <Stack justifyContent="center" spacing={0.8}>
            <Typography color="text.secondary" fontSize={11.5} fontWeight={700}>NEXT 7 DAYS</Typography>
            <Typography fontSize={{ xs: 25, sm: 30 }} fontWeight={950} lineHeight={1.05}>{fCurrency(sevenDay.forecastAmount)}</Typography>
            <Typography color="text.secondary" fontSize={11.5}>Average {fCurrency(sevenDay.averageDailyAmount)} per day</Typography>
            {sevenDay.changeFromLastPeriod !== null ? <Stack alignItems="center" color={trendIsPositive ? "success.main" : "warning.main"} direction="row" spacing={0.45}>{trendIsPositive ? <TrendingUpRoundedIcon sx={{ fontSize: 16 }} /> : <TrendingDownRoundedIcon sx={{ fontSize: 16 }} />}<Typography fontSize={11.5} fontWeight={800}>{Math.abs(sevenDay.changeFromLastPeriod).toFixed(1)}% {trendIsPositive ? "above" : "below"} last 7 days</Typography></Stack> : null}
          </Stack>
          <Box sx={{ minWidth: 0 }}><Chart height={190} options={outlookOptions} series={[{ data: sevenDay.points.map(({ forecastAmount }) => forecastAmount), name: "Forecast sales" }]} type="area" /></Box>
        </Box>}
      </CardContent>
    </Card>

    {canViewDetails && forecast.details ? <>
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.08fr) minmax(0, .92fr)" } }}>
        <Card sx={{ border: 1, borderColor: "divider" }}><CardContent sx={{ p: { xs: 1.75, sm: 2.25 }, "&:last-child": { pb: { xs: 1.75, sm: 2.25 } } }}>
          <Stack alignItems="center" direction="row" justifyContent="space-between" mb={1.5}><Box><Typography fontWeight={900}>Forecast reliability</Typography><Typography color="text.secondary" fontSize={11.5}>Back-tested against completed past outcomes</Typography></Box><Chip label="Management" size="small" variant="outlined" /></Stack>
          <Box sx={{ display: "grid", gap: 1.75, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
            <ForecastAccuracy accuracy={forecast.details.accuracy.sevenDay} />
            <ForecastAccuracy accuracy={forecast.details.accuracy.thirtyDay} />
          </Box>
          <Divider sx={{ my: 1.6 }} />
          <Stack alignItems="baseline" direction="row" justifyContent="space-between" spacing={1}><Box><Typography color="text.secondary" fontSize={11.5} fontWeight={700}>NEXT 30 DAYS</Typography><Typography fontSize={21} fontWeight={900}>{forecast.details.thirtyDay.unavailable ? "Preparing" : fCurrency(forecast.details.thirtyDay.forecastAmount)}</Typography></Box>{!forecast.details.thirtyDay.unavailable ? <Typography color="text.secondary" fontSize={11.5}>{fCurrency(forecast.details.thirtyDay.averageDailyAmount)} / day</Typography> : null}</Stack>
          {forecast.details.thirtyDay.unavailable ? <Typography color="text.secondary" fontSize={11.5} mt={0.45}>{forecast.details.thirtyDay.reason}</Typography> : null}
        </CardContent></Card>

        <Card sx={{ border: 1, borderColor: "divider" }}><CardContent sx={{ p: { xs: 1.75, sm: 2.25 }, "&:last-child": { pb: { xs: 1.75, sm: 2.25 } } }}>
          <Stack alignItems="center" direction="row" spacing={0.8}><InsightsRoundedIcon color="primary" fontSize="small" /><Typography fontWeight={900}>Weekly demand pattern</Typography></Stack>
          <Typography color="text.secondary" fontSize={11.5} mt={0.25}>Recent weekday sales behaviour, not an annual claim.</Typography>
          <DemandPattern seasonality={forecast.details.seasonality} />
        </CardContent></Card>
      </Box>

      {forecast.details.recommendations.length ? <Card sx={{ border: 1, borderColor: "divider" }}><CardContent sx={{ p: { xs: 1.75, sm: 2.25 }, "&:last-child": { pb: { xs: 1.75, sm: 2.25 } } }}>
        <Typography fontWeight={900}>Planning recommendations</Typography>
        <Typography color="text.secondary" fontSize={11.5} mt={0.25}>Rule-based actions linked to sales outlook, demand patterns and measured accuracy.</Typography>
        <Stack mt={1.35} spacing={0.9}>{forecast.details.recommendations.map((recommendation) => {
          const color = recommendation.severity === "warning" ? "warning.main" : recommendation.severity === "positive" ? "success.main" : recommendation.severity === "opportunity" ? "primary.main" : "info.main";
          return <Box key={recommendation.id} sx={{ borderLeft: 3, borderColor: color, borderRadius: 1, bgcolor: "action.hover", px: 1.25, py: 1 }}><Typography fontSize={12.25} fontWeight={850}>{recommendation.title}</Typography><Typography color="text.secondary" fontSize={11.25} mt={0.18}>{recommendation.message}</Typography><Typography color={color} fontSize={11} fontWeight={750} mt={0.55}>{recommendation.action}</Typography></Box>;
        })}</Stack>
      </CardContent></Card> : null}
    </> : <LockedForecastDetails />}
  </Stack>;
}
