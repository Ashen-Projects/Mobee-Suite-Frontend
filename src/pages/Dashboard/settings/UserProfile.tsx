import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import {
  Avatar, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, Stack, TextField, Typography,
} from "@mui/material";
import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import PageMeta from "../../../components/common/PageMeta";
import useAuth from "../../../hooks/useAuth";
import { getOwnProfile, updateOwnProfile, type OwnProfile } from "../../../redux/slices/userManagementRedux/userManagementRedux";

type DetailProps = { icon: ReactNode; label: string; value: ReactNode };

function Detail({ icon, label, value }: DetailProps) {
  return <Stack alignItems="flex-start" direction="row" spacing={1.5}><Box color="text.secondary" display="flex" mt={0.25}>{icon}</Box><Box minWidth={0}><Typography color="text.secondary" variant="caption">{label}</Typography><Typography fontWeight={600} sx={{ overflowWrap: "anywhere" }} variant="body2">{value || "Not available"}</Typography></Box></Stack>;
}

export default function UserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<OwnProfile | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const initial = (profile?.displayName || user?.displayName || user?.email || "U").charAt(0).toUpperCase();

  const loadProfile = useCallback(async () => {
    try { setProfile(await getOwnProfile()); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load your profile."); }
  }, []);

  useEffect(() => { void loadProfile(); }, [loadProfile]);

  const openEdit = () => {
    setPhone(profile?.phone ?? "");
    setAddress(profile?.address ?? "");
    setEditOpen(true);
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await updateOwnProfile({ address: address.trim() || null, phone: phone.trim() || null });
      setProfile(updated);
      setEditOpen(false);
      toast.success("Your profile was updated successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update your profile.");
    } finally { setSaving(false); }
  };

  return <>
    <PageMeta description="View and update your Mobee Suite profile." title="My Profile | Mobee Suite" />
    <Stack spacing={3}>
      <Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
        <Box><Typography variant="h4">My Profile</Typography><Typography color="text.secondary">Your account, assigned access, and location information.</Typography></Box>
        <Button disabled={!profile} onClick={openEdit} startIcon={<EditOutlinedIcon />} variant="contained">Edit Profile</Button>
      </Stack>
      <Card><CardContent sx={{ p: { xs: 2.5, sm: 4 } }}><Stack alignItems={{ xs: "flex-start", sm: "center" }} direction={{ xs: "column", sm: "row" }} spacing={2.5}><Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontSize: 30, height: 80, width: 80 }}>{initial}</Avatar><Box flex={1}><Typography variant="h5">{profile?.displayName || user?.displayName || "Mobee user"}</Typography><Typography color="text.secondary">{profile?.email || user?.email || "Email not available"}</Typography><Stack direction="row" flexWrap="wrap" gap={1} mt={1.5}><Chip color="success" label="Active account" size="small" variant="outlined" />{user?.roles.map((role) => <Chip color="primary" key={role.id} label={role.label || role.name} size="small" />)}</Stack></Box></Stack></CardContent></Card>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}><Card sx={{ height: "100%" }}><CardContent sx={{ p: { xs: 2.5, sm: 3 } }}><Typography variant="h6">Personal Information</Typography><Typography color="text.secondary" mb={3} variant="body2">Your identity fields are protected. You can update only phone and address.</Typography><Grid container spacing={3}><Grid size={{ xs: 12, sm: 6 }}><Detail icon={<PersonOutlineRoundedIcon fontSize="small" />} label="Full name" value={profile?.displayName || user?.displayName} /></Grid><Grid size={{ xs: 12, sm: 6 }}><Detail icon={<EmailOutlinedIcon fontSize="small" />} label="Email address" value={profile?.email || user?.email} /></Grid><Grid size={{ xs: 12, sm: 6 }}><Detail icon={<BadgeOutlinedIcon fontSize="small" />} label="Phone number" value={profile?.phone} /></Grid><Grid size={{ xs: 12, sm: 6 }}><Detail icon={<LocationOnOutlinedIcon fontSize="small" />} label="Address" value={profile?.address} /></Grid></Grid></CardContent></Card></Grid>
        <Grid size={{ xs: 12, md: 5 }}><Card sx={{ height: "100%" }}><CardContent sx={{ p: { xs: 2.5, sm: 3 } }}><Typography variant="h6">Location</Typography><Typography color="text.secondary" mb={3} variant="body2">Default business location assigned to your account.</Typography><Detail icon={<LocationOnOutlinedIcon fontSize="small" />} label="Default location ID" value={user?.defaultLocationId ?? "Not assigned"} /></CardContent></Card></Grid>
      </Grid>
    </Stack>
    <Dialog component="form" fullWidth maxWidth="sm" onClose={() => !saving && setEditOpen(false)} onSubmit={saveProfile} open={editOpen}>
      <DialogTitle>Edit My Profile</DialogTitle>
      <DialogContent dividers><Stack spacing={2.5}><Typography color="text.secondary" variant="body2">Email, first name and last name cannot be changed here.</Typography><TextField fullWidth inputProps={{ maxLength: 30 }} label="Phone number" onChange={(event) => setPhone(event.target.value)} value={phone} /><TextField fullWidth inputProps={{ maxLength: 1000 }} label="Address" minRows={3} multiline onChange={(event) => setAddress(event.target.value)} value={address} /></Stack></DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}><Button color="inherit" disabled={saving} onClick={() => setEditOpen(false)}>Cancel</Button><Button disabled={saving} type="submit" variant="contained">{saving ? "Saving..." : "Save Changes"}</Button></DialogActions>
    </Dialog>
  </>;
}
