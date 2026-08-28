import {Box, Grid, Stack, Typography} from "@mui/material";
import DemographicCard from "../../../components/ecommerce/DemographicCard";
import EcommerceMetrics from "../../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../../components/ecommerce/MonthlySalesChart";
import MonthlyTarget from "../../../components/ecommerce/MonthlyTarget";
import RecentOrders from "../../../components/ecommerce/RecentOrders";
import StatisticsChart from "../../../components/ecommerce/StatisticsChart";
import PageMeta from "../../../components/common/PageMeta";

export default function HomeDashboard() {
    return <>
        <PageMeta description="Mobee Suite business overview." title="Dashboard | Mobee Suite"/>
        <Stack spacing={3}>
            <Box>
                <Typography variant="h4">Dashboard</Typography>
                <Typography color="text.secondary" mt={0.5} variant="body2">Monitor your business performance and recent
                    activity.</Typography></Box><Grid container spacing={3}><Grid
            size={12}><EcommerceMetrics/></Grid><Grid size={{xs: 12, lg: 8}}><MonthlySalesChart/></Grid><Grid
            size={{xs: 12, lg: 4}}><MonthlyTarget/></Grid><Grid size={12}><StatisticsChart/></Grid><Grid
            size={{xs: 12, lg: 5}}><DemographicCard/></Grid><Grid
            size={{xs: 12, lg: 7}}><RecentOrders/></Grid></Grid>
        </Stack>
    </>;
}
