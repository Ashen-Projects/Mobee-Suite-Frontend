import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import { ApexOptions } from "apexcharts";
import { Box, Card, CardContent, Chip, Divider, IconButton, Menu, MenuItem, Stack, Typography, useTheme } from "@mui/material";
import { MouseEvent, useState } from "react";
import Chart from "react-apexcharts";

const stats = [{ label: "Target", value: "$20K", up: false }, { label: "Revenue", value: "$20K", up: true }, { label: "Today", value: "$20K", up: true }];

export default function MonthlyTarget() {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const closeMenu = () => setAnchorEl(null);
  const options: ApexOptions = { colors: [theme.palette.primary.main], chart: { fontFamily: "Poppins, sans-serif", sparkline: { enabled: true } }, fill: { colors: [theme.palette.primary.main], type: "solid" }, labels: ["Progress"], plotOptions: { radialBar: { endAngle: 85, hollow: { size: "78%" }, startAngle: -85, track: { background: theme.palette.action.hover }, dataLabels: { name: { show: false }, value: { color: theme.palette.text.primary, fontFamily: "Poppins, sans-serif", fontSize: "32px", fontWeight: 600, offsetY: -35, formatter: (value) => `${value}%` } } } }, stroke: { lineCap: "round" } };
  return <Card sx={{ height: "100%" }}><CardContent sx={{ p: 3, "&:last-child": { pb: 2 } }}><Stack alignItems="flex-start" direction="row" justifyContent="space-between"><Box><Typography variant="h6">Monthly Target</Typography><Typography color="text.secondary" variant="body2">Target you’ve set for this month</Typography></Box><IconButton aria-label="Monthly target options" onClick={openMenu} size="small"><MoreHorizRoundedIcon /></IconButton></Stack><Menu anchorEl={anchorEl} onClose={closeMenu} open={Boolean(anchorEl)}><MenuItem onClick={closeMenu}>View details</MenuItem><MenuItem onClick={closeMenu}>Export</MenuItem></Menu><Box sx={{ height: 180, position: "relative" }}><Chart height={215} options={options} series={[75.55]} type="radialBar" /><Chip color="success" label="+10%" size="small" sx={{ bottom: 0, left: "50%", position: "absolute", transform: "translateX(-50%)" }} /></Box><Typography color="text.secondary" sx={{ display: { xs: "block", lg: "-webkit-box" }, overflow: "hidden", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }} textAlign="center" variant="body2">You earned $3,287 today, which is higher than last month. Keep up the good work!</Typography></CardContent><Divider /><Stack alignItems="center" direction="row" divider={<Divider flexItem orientation="vertical" />} justifyContent="space-around" px={1.5} py={1.5}>{stats.map((stat) => <Box key={stat.label} textAlign="center"><Typography color="text.secondary" variant="caption">{stat.label}</Typography><Stack alignItems="center" direction="row" spacing={0.25}><Typography fontSize={14} fontWeight={700}>{stat.value}</Typography>{stat.up ? <TrendingUpRoundedIcon color="success" sx={{ fontSize: 16 }} /> : <TrendingDownRoundedIcon color="error" sx={{ fontSize: 16 }} />}</Stack></Box>)}</Stack></Card>;
}
