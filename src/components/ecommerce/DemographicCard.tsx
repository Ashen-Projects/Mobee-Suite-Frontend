import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import { Avatar, Box, Card, CardContent, IconButton, LinearProgress, Menu, MenuItem, Stack, Typography } from "@mui/material";
import { MouseEvent, useState } from "react";
import CountryMap from "./CountryMap";

const countries = [{ name: "USA", customers: "2,379 Customers", value: 79, flag: "/images/country/country-01.svg" }, { name: "France", customers: "589 Customers", value: 23, flag: "/images/country/country-02.svg" }];

export default function DemographicCard() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const closeMenu = () => setAnchorEl(null);
  return <Card sx={{ height: "100%" }}><CardContent sx={{ p: { xs: 2.5, md: 3 } }}><Stack alignItems="flex-start" direction="row" justifyContent="space-between"><Box><Typography variant="h6">Customer Demographics</Typography><Typography color="text.secondary" variant="body2">Customers by country</Typography></Box><IconButton aria-label="Demographic options" onClick={openMenu}><MoreHorizRoundedIcon /></IconButton></Stack><Menu anchorEl={anchorEl} onClose={closeMenu} open={Boolean(anchorEl)}><MenuItem onClick={closeMenu}>View details</MenuItem><MenuItem onClick={closeMenu}>Export</MenuItem></Menu><Box sx={{ border: 1, borderColor: "divider", borderRadius: 2.5, height: 235, my: 2.5, overflow: "hidden", width: "100%" }}><CountryMap /></Box><Stack spacing={2.25}>{countries.map((country) => <Stack alignItems="center" direction="row" justifyContent="space-between" key={country.name} spacing={2}><Stack alignItems="center" direction="row" spacing={1.5}><Avatar alt={country.name} src={country.flag} sx={{ height: 32, width: 32 }} /><Box><Typography fontWeight={600} variant="body2">{country.name}</Typography><Typography color="text.secondary" variant="caption">{country.customers}</Typography></Box></Stack><Stack alignItems="center" direction="row" spacing={1} sx={{ minWidth: 135 }}><LinearProgress sx={{ borderRadius: 1, flex: 1, height: 7 }} value={country.value} variant="determinate" /><Typography fontWeight={600} variant="body2">{country.value}%</Typography></Stack></Stack>)}</Stack></CardContent></Card>;
}
