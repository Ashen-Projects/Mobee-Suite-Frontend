import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import { Box, Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";

const metrics = [
  { label: "Customers", value: "3,782", change: "11.01%", positive: true, icon: <PeopleAltOutlinedIcon /> },
  { label: "Orders", value: "5,359", change: "9.05%", positive: false, icon: <Inventory2OutlinedIcon /> },
];

export default function EcommerceMetrics() {
  return <Grid container spacing={2}>{metrics.map((metric) => (
    <Grid key={metric.label} size={{ xs: 12, sm: 6 }}><Card sx={{ height: "100%" }}><CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
      <Stack alignItems="center" direction="row" justifyContent="space-between" spacing={2}><Box><Typography color="text.secondary" variant="body2">{metric.label}</Typography><Typography mt={0.5} variant="h4">{metric.value}</Typography></Box><Box sx={{ alignItems: "center", bgcolor: "action.hover", borderRadius: 2.5, display: "flex", height: 48, justifyContent: "center", width: 48 }}>{metric.icon}</Box></Stack>
      <Chip color={metric.positive ? "success" : "error"} icon={metric.positive ? <TrendingUpRoundedIcon /> : <TrendingDownRoundedIcon />} label={`${metric.change} from last month`} size="small" sx={{ mt: 2 }} variant="outlined" />
    </CardContent></Card></Grid>
  ))}</Grid>;
}
