import { Card, CardContent, CardHeader, Divider } from "@mui/material";
import { ReactNode } from "react";

interface ComponentCardProps {
  children: ReactNode;
  className?: string;
  desc?: string;
  title: string;
}

export default function ComponentCard({ children, desc, title }: ComponentCardProps) {
  return <Card><CardHeader subheader={desc || undefined} title={title} titleTypographyProps={{ variant: "h6" }} /><Divider /><CardContent sx={{ p: { xs: 2.5, sm: 3 }, "& > * + *": { mt: 3 } }}>{children}</CardContent></Card>;
}
