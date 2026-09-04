import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import EastRoundedIcon from "@mui/icons-material/EastRounded";
import { alpha } from "@mui/material/styles";
import { Box, Button, Chip, IconButton, Popover, Stack, Typography } from "@mui/material";
import type { MouseEvent } from "react";
import { useMemo, useState } from "react";

type Props = {
  fromDate: string;
  onChange: (fromDate: string, toDate: string) => void;
  toDate: string;
};

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

const toDateInput = (date: Date) => {
  const value = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return value.toISOString().slice(0, 10);
};
const today = () => toDateInput(new Date());
const shiftDays = (days: number) => {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return toDateInput(value);
};
const startOfMonth = (offset = 0) => {
  const value = new Date();
  value.setMonth(value.getMonth() + offset, 1);
  return toDateInput(value);
};
const endOfMonth = (offset = 0) => {
  const value = new Date();
  value.setMonth(value.getMonth() + offset + 1, 0);
  return toDateInput(value);
};
const asDate = (value: string) => new Date(`${value}T00:00:00`);
const formatShortDate = (value: string) => new Intl.DateTimeFormat("en-LK", { day: "2-digit", month: "short", year: "numeric" }).format(asDate(value));
const daysBetween = (fromDate: string, toDate: string) => Math.max(1, Math.round((asDate(toDate).getTime() - asDate(fromDate).getTime()) / 86400000) + 1);

const presets = [
  { key: "today", label: "Today", range: () => ({ fromDate: today(), toDate: today() }) },
  { key: "last7", label: "Last 7 Days", range: () => ({ fromDate: shiftDays(-6), toDate: today() }) },
  { key: "last30", label: "Last 30 Days", range: () => ({ fromDate: shiftDays(-29), toDate: today() }) },
  { key: "thisMonth", label: "This Month", range: () => ({ fromDate: startOfMonth(), toDate: endOfMonth() }) },
  { key: "lastMonth", label: "Last Month", range: () => ({ fromDate: startOfMonth(-1), toDate: endOfMonth(-1) }) },
];

const buildMonthDays = (monthDate: Date) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => toDateInput(new Date(year, month, index + 1))),
  ];
};

export default function AdvancedDateRangeFilter({ fromDate, onChange, toDate }: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [draftFrom, setDraftFrom] = useState(fromDate);
  const [draftTo, setDraftTo] = useState(toDate);
  const [monthDate, setMonthDate] = useState(() => asDate(fromDate));
  const [pendingStart, setPendingStart] = useState<string | null>(null);
  const open = Boolean(anchorEl);
  const label = useMemo(() => `${formatShortDate(fromDate)} - ${formatShortDate(toDate)}`, [fromDate, toDate]);
  const monthDays = useMemo(() => buildMonthDays(monthDate), [monthDate]);

  const openPicker = (event: MouseEvent<HTMLElement>) => {
    setDraftFrom(fromDate);
    setDraftTo(toDate);
    setPendingStart(null);
    setMonthDate(asDate(fromDate));
    setAnchorEl(event.currentTarget);
  };

  const applyRange = (nextFrom: string, nextTo: string) => {
    const from = nextFrom <= nextTo ? nextFrom : nextTo;
    const to = nextFrom <= nextTo ? nextTo : nextFrom;
    setDraftFrom(from);
    setDraftTo(to);
    onChange(from, to);
  };

  const selectDay = (value: string) => {
    if (!pendingStart) {
      setPendingStart(value);
      setDraftFrom(value);
      setDraftTo(value);
      return;
    }
    applyRange(pendingStart, value);
    setPendingStart(null);
    setAnchorEl(null);
  };

  const moveMonth = (change: number) => {
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + change, 1));
  };

  return <>
    <Button
      onClick={openPicker}
      startIcon={<CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />}
      endIcon={<Chip label={`${daysBetween(fromDate, toDate)}d`} size="small" sx={(theme) => ({ bgcolor: alpha(theme.palette.primary.main, 0.12), height: 24, "& .MuiChip-label": { fontSize: 11.5, fontWeight: 800, px: 0.8 } })} />}
      sx={(theme) => ({
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        boxShadow: `0 6px 16px ${alpha(theme.palette.common.black, 0.06)}`,
        color: "text.primary",
        justifyContent: "space-between",
        minHeight: 40,
        minWidth: { xs: "100%", sm: 245 },
        px: 1.1,
        textTransform: "none",
        "&:hover": { bgcolor: "background.paper", borderColor: alpha(theme.palette.primary.main, 0.35) },
      })}
      variant="outlined"
    >
      <Stack alignItems="flex-start" spacing={0.1} sx={{ minWidth: 0 }}>
        <Typography color="text.secondary" sx={{ fontSize: 10.5, fontWeight: 800, lineHeight: 1 }} variant="caption">Date range</Typography>
        <Typography fontWeight={850} noWrap sx={{ fontSize: 13.25, letterSpacing: 0.05, lineHeight: 1.2 }}>{label}</Typography>
      </Stack>
    </Button>
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      onClose={() => setAnchorEl(null)}
      open={open}
      PaperProps={{ sx: { bgcolor: "background.default", borderRadius: 2.5, mt: 0.75, p: 1, width: { xs: 292, sm: 318 } }, variant: "outlined" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
    >
      <Stack spacing={1}>
        <Box sx={(theme) => ({ bgcolor: alpha(theme.palette.primary.main, 0.06), border: 1, borderColor: "divider", borderRadius: 2, p: 1 })}>
          <Typography color="text.secondary" fontWeight={900} letterSpacing={0.5} sx={{ fontSize: 9.75 }} variant="overline">Selected range</Typography>
          <Stack alignItems="center" direction="row" justifyContent="space-between" spacing={1}>
            <Stack alignItems="center" direction="row" minWidth={0} spacing={0.75}>
              <Typography fontWeight={850} noWrap sx={{ fontSize: 13.25 }}>{formatShortDate(draftFrom)}</Typography>
              <EastRoundedIcon color="action" sx={{ fontSize: 16 }} />
              <Typography fontWeight={850} noWrap sx={{ fontSize: 13.25 }}>{formatShortDate(draftTo)}</Typography>
            </Stack>
            <Chip label={`${daysBetween(draftFrom, draftTo)}d`} size="small" sx={{ bgcolor: "background.paper", fontSize: 11, fontWeight: 800, height: 24 }} />
          </Stack>
        </Box>
        <Stack alignItems="center" direction="row" spacing={0.75}>
          <IconButton size="small" sx={{ border: 1, borderColor: "divider" }}><ChevronLeftRoundedIcon /></IconButton>
          <Box sx={{ display: "flex", flex: 1, gap: 0.75, overflowX: "auto", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
            {presets.map((preset) => <Chip clickable key={preset.key} label={preset.label} onClick={() => { const range = preset.range(); applyRange(range.fromDate, range.toDate); setAnchorEl(null); }} sx={{ bgcolor: "background.paper", borderRadius: 999, flex: "0 0 auto", fontSize: 11.5, fontWeight: 800, height: 28 }} variant="outlined" />)}
          </Box>
          <IconButton size="small" sx={{ border: 1, borderColor: "divider" }}><ChevronRightRoundedIcon /></IconButton>
        </Stack>
        <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 2, p: 1 }}>
          <Stack alignItems="center" direction="row" justifyContent="space-between" mb={0.75}>
            <Typography fontWeight={850} sx={{ fontSize: 14.5 }}>{monthNames[monthDate.getMonth()]} {monthDate.getFullYear()}</Typography>
            <Stack direction="row" spacing={0.5}>
              <IconButton onClick={() => moveMonth(-1)} size="small"><ChevronLeftRoundedIcon /></IconButton>
              <IconButton onClick={() => moveMonth(1)} size="small"><ChevronRightRoundedIcon /></IconButton>
            </Stack>
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", mb: 0.5 }}>
            {weekdays.map((day) => <Typography color="text.secondary" fontSize={11.5} fontWeight={800} key={day} py={0.25} textAlign="center">{day}</Typography>)}
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: 0.25 }}>
            {monthDays.map((day, index) => {
              const selected = Boolean(day && day >= draftFrom && day <= draftTo);
              const edge = Boolean(day && (day === draftFrom || day === draftTo));
              return <Box key={day ?? `empty-${index}`} sx={{ minHeight: 30 }}>
                {day ? <Button
                  color={edge ? "primary" : "inherit"}
                  onClick={() => selectDay(day)}
                  sx={(theme) => ({
                    bgcolor: edge ? "primary.main" : selected ? alpha(theme.palette.primary.main, 0.12) : "transparent",
                    borderRadius: edge ? 1.8 : 0,
                    color: edge ? "primary.contrastText" : "text.primary",
                    fontSize: 13,
                    fontWeight: 800,
                    height: 30,
                    minWidth: 0,
                    p: 0,
                    width: "100%",
                    "&:hover": { bgcolor: edge ? "primary.dark" : alpha(theme.palette.primary.main, 0.16) },
                  })}
                >{asDate(day).getDate()}</Button> : null}
              </Box>;
            })}
          </Box>
        </Box>
        <Stack alignItems="center" direction="row" justifyContent="space-between">
          <Typography color="text.secondary" fontWeight={700} maxWidth={220} variant="caption">{pendingStart ? "Choose an end date." : "Choose a start date, then choose an end date."}</Typography>
          <Button color="inherit" onClick={() => setAnchorEl(null)} size="small" sx={{ fontWeight: 850 }}>Close</Button>
        </Stack>
      </Stack>
    </Popover>
  </>;
}
