import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import { ApexOptions } from "apexcharts";
import { Box, Card, CardContent, IconButton, Menu, MenuItem, Stack, Typography, useTheme } from "@mui/material";
import { MouseEvent, useState } from "react";
import Chart from "react-apexcharts";

const series = [{ name: "Sales", data: [168, 385, 201, 298, 187, 195, 291, 110, 215, 390, 280, 112] }];

export default function MonthlySalesChart() {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const closeMenu = () => setAnchorEl(null);
  const options: ApexOptions = {
    colors: [theme.palette.primary.main], chart: { fontFamily: "Poppins, sans-serif", toolbar: { show: false } }, dataLabels: { enabled: false }, grid: { borderColor: theme.palette.divider }, legend: { show: false },
    plotOptions: { bar: { borderRadius: 5, borderRadiusApplication: "end", columnWidth: "39%" } }, stroke: { colors: ["transparent"], show: true, width: 4 }, tooltip: { theme: theme.palette.mode },
    xaxis: { axisBorder: { show: false }, axisTicks: { show: false }, categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], labels: { style: { colors: theme.palette.text.secondary } } }, yaxis: { labels: { style: { colors: theme.palette.text.secondary } } },
  };
  return <Card sx={{ height: "100%" }}><CardContent sx={{ p: 3, "&:last-child": { pb: 2 } }}><Stack alignItems="center" direction="row" justifyContent="space-between"><Box><Typography variant="h6">Monthly Sales</Typography><Typography color="text.secondary" variant="body2">Sales performance across the year</Typography></Box><IconButton aria-label="Monthly sales options" onClick={openMenu} size="small"><MoreHorizRoundedIcon /></IconButton></Stack><Menu anchorEl={anchorEl} onClose={closeMenu} open={Boolean(anchorEl)}><MenuItem onClick={closeMenu}>View details</MenuItem><MenuItem onClick={closeMenu}>Export</MenuItem></Menu><Box sx={{ mt: 1.5, overflowX: "auto" }}><Box sx={{ minWidth: { xs: 620, lg: 0 } }}><Chart height={245} options={options} series={series} type="bar" /></Box></Box></CardContent></Card>;
}
