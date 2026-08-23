import { Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";
import PageMeta from "../../../components/common/PageMeta";

type Props = { description: string; section: string; title: string };

export default function ModulePlaceholder({ description, section, title }: Props) {
  return (
    <>
      <PageMeta description={description} title={`${title} | Mobee Suite`} />
      <Card><CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Chip color="primary" label={section} size="small" />
        <Typography sx={{ mt: 2 }} variant="h4">{title}</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 720 }}>{description}</Typography>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {["Summary", "Recent activity", "Quick actions"].map((label) => (
            <Grid key={label} size={{ xs: 12, sm: 6, lg: 4 }}><Card variant="outlined"><CardContent><Stack spacing={1}><Typography fontWeight={600}>{label}</Typography><Typography color="text.secondary" variant="body2">Content will be added when this module is implemented.</Typography></Stack></CardContent></Card></Grid>
          ))}
        </Grid>
      </CardContent></Card>
    </>
  );
}
