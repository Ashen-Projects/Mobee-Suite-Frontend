import { Box, Typography } from "@mui/material";

interface PageTitleProps { pageTitle: string; }

// Kept as a compatibility page-title component for retained demo pages. Mobee does not render breadcrumbs.
export default function PageBreadCrumb({ pageTitle }: PageTitleProps) {
  return <Box mb={3}><Typography variant="h4">{pageTitle}</Typography></Box>;
}
