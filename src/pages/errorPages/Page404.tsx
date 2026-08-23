import { Box, Button, Container, Typography } from "@mui/material";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { PATH_DASHBOARD } from "../../routes/paths";

export default function Page404() {
  return (
    <>
      <PageMeta description="The requested Mobee Suite page was not found." title="Page Not Found | Mobee Suite" />
      <Container maxWidth="sm" sx={{ alignItems: "center", display: "flex", minHeight: "100dvh", py: 5 }}>
        <Box textAlign="center" width="100%">
          <Typography color="primary" fontWeight={700} variant="h1">404</Typography>
          <Typography sx={{ mt: 2 }} variant="h4">Page not found</Typography>
          <Typography color="text.secondary" sx={{ mt: 1.5 }}>We can&apos;t find the page you are looking for.</Typography>
          <Button component={Link} sx={{ mt: 4 }} to={PATH_DASHBOARD.dashboard.root} variant="contained">Back to dashboard</Button>
        </Box>
      </Container>
    </>
  );
}
