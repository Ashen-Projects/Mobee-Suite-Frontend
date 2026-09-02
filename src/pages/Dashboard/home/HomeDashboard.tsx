import {Box, Card, Grid, Stack, Typography} from "@mui/material";
import DemographicCard from "../../../components/ecommerce/DemographicCard";
import EcommerceMetrics from "../../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../../components/ecommerce/MonthlySalesChart";
import MonthlyTarget from "../../../components/ecommerce/MonthlyTarget";
import RecentOrders from "../../../components/ecommerce/RecentOrders";
import StatisticsChart from "../../../components/ecommerce/StatisticsChart";
import PageMeta from "../../../components/common/PageMeta";
import comingSoonIllustration from "../../../assets/illustrations/undraw_coming-soon_7lvi.svg";

const isDevelop = true;

export default function HomeDashboard() {
    if (isDevelop) {
        return <>
            <PageMeta description="Mobee Suite dashboard is under development." title="Dashboard | Mobee Suite"/>
            <Card
                sx={{
                    alignItems: "center",
                    display: "flex",
                    justifyContent: "center",
                    minHeight: {xs: 420, md: 560},
                    overflow: "hidden",
                    px: {xs: 3, md: 6},
                    py: {xs: 4, md: 6},
                    textAlign: "center",
                }}
            >
                <Stack alignItems="center" spacing={2.5} width="100%">
                    <Box
                        alt="Dashboard coming soon"
                        component="img"
                        src={comingSoonIllustration}
                        sx={{
                            height: "auto",
                            maxWidth: 380,
                            width: "min(100%, 380px)",
                        }}
                    />
                    <Box>
                        <Typography variant="h4">Dashboard is coming soon</Typography>
                        <Typography color="text.secondary" mt={0.75} variant="body1">
                            We are preparing the Mobee Suite business overview. Core modules are available from the main menu.
                        </Typography>
                    </Box>
                </Stack>
            </Card>
        </>;
    }

    return <>
        <PageMeta description="Mobee Suite business overview." title="Dashboard | Mobee Suite"/>
        <Stack spacing={3}>
            <Box>
                <Typography variant="h4">Dashboard</Typography>
            </Box><Grid container spacing={3}><Grid
            size={12}><EcommerceMetrics/></Grid><Grid size={{xs: 12, lg: 8}}><MonthlySalesChart/></Grid><Grid
            size={{xs: 12, lg: 4}}><MonthlyTarget/></Grid><Grid size={12}><StatisticsChart/></Grid><Grid
            size={{xs: 12, lg: 5}}><DemographicCard/></Grid><Grid
            size={{xs: 12, lg: 7}}><RecentOrders/></Grid></Grid>
        </Stack>
    </>;
}
