import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { ApexOptions } from "apexcharts";
import { Box, Button, ButtonGroup, Card, CardContent, Stack, Typography, useTheme } from "@mui/material";
import { useState } from "react";
import Chart from "react-apexcharts";

const series = [{ name: "Sales", data: [180, 190, 170, 160, 175, 165, 170, 205, 230, 210, 240, 235] }, { name: "Revenue", data: [40, 30, 50, 40, 55, 40, 70, 100, 110, 120, 150, 140] }];

export default function StatisticsChart() {
  const theme = useTheme();
  const [period, setPeriod] = useState("Monthly");
  const options: ApexOptions = { chart: { fontFamily: "Poppins, sans-serif", toolbar: { show: false } }, colors: [theme.palette.primary.main, theme.palette.primary.light], dataLabels: { enabled: false }, fill: { type: "gradient", gradient: { opacityFrom: 0.5, opacityTo: 0.05 } }, grid: { borderColor: theme.palette.divider }, legend: { horizontalAlign: "left", position: "top" }, markers: { size: 0, hover: { size: 6 } }, stroke: { curve: "smooth", width: 2 }, tooltip: { theme: theme.palette.mode }, xaxis: { axisBorder: { show: false }, axisTicks: { show: false }, categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], labels: { style: { colors: theme.palette.text.secondary } } }, yaxis: { labels: { style: { colors: theme.palette.text.secondary } } } };
  return <Card><CardContent sx={{ p: { xs: 2.5, md: 3 } }}><Stack alignItems={{ xs: "stretch", md: "center" }} direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}><Box><Typography variant="h6">Statistics</Typography><Typography color="text.secondary" variant="body2">Sales and revenue performance</Typography></Box><Stack direction={{ xs: "column", sm: "row" }} spacing={1}><ButtonGroup size="small">{["Monthly", "Quarterly", "Annually"].map((value) => <Button key={value} onClick={() => setPeriod(value)} variant={period === value ? "contained" : "outlined"}>{value}</Button>)}</ButtonGroup><Button color="inherit" startIcon={<CalendarMonthOutlinedIcon />} variant="outlined">Jan 01 – Dec 31</Button></Stack></Stack><Box sx={{ mt: 2, overflowX: "auto" }}><Box sx={{ minWidth: { xs: 760, lg: 0 } }}><Chart height={320} options={options} series={series} type="area" /></Box></Box></CardContent></Card>;
}
