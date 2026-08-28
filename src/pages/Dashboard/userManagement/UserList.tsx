import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import { Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Select, Stack, TextField, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import PageMeta from "../../../components/common/PageMeta";
import useAuth from "../../../hooks/useAuth";
import { USER_PERMISSIONS } from "../../../utils/constants";
import { getPermissions, getRoles, type Permission, type Role } from "../../../redux/slices/userManagementRedux/rolePermissionRedux";
import { createUser, getAssignableLocations, getUserRoleAssignments, getUsers, setUserRole, updateUser, updateUserLocation, updateUserStatus, type CreatedUser, type UserListItem } from "../../../redux/slices/userManagementRedux/userManagementRedux";
type StatusFilter = "active" | "all" | "inactive";
const PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 15, 25, 50];

export default function UserList() {
  const { can } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const requestId = useRef(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | "">("");
  const [assignmentLocation, setAssignmentLocation] = useState<{ id: number; name: string } | null>(null);
  const [locations, setLocations] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | "">("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(0); }, 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const loadUsers = useCallback(async () => {
    const currentRequest = ++requestId.current;
    try {
      const response = await getUsers({ page: page + 1, pageSize, search: debouncedSearch, status });
      if (currentRequest !== requestId.current) return;
      setUsers(response.items);
      setTotal(response.pagination.total);
    } catch (error) {
      if (currentRequest !== requestId.current) return;
      setUsers([]);
      setTotal(0);
      toast.error(error instanceof Error ? error.message : "Unable to load users.");
    }
  }, [debouncedSearch, page, pageSize, status]);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const closeCreateDialog = () => {
    if (isCreating) return;
    setCreateDialogOpen(false);
    setFirstName("");
    setLastName("");
    setEmail("");
  };

  const handleCreateUser = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedFirstName || !normalizedLastName || !normalizedEmail) return;
    setIsCreating(true);
    try {
      const result = await createUser({ email: normalizedEmail, firstName: normalizedFirstName, lastName: normalizedLastName });
      setCreatedUser(result);
      setCreateDialogOpen(false);
      setFirstName("");
      setLastName("");
      setEmail("");
      setCredentialsDialogOpen(true);
      toast.success("User created with Pending User access.");
      setPage(0);
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create user.");
    } finally { setIsCreating(false); }
  };

  const copyCredentials = async () => {
    if (!createdUser) return;
    try {
      await navigator.clipboard.writeText(`Email: ${createdUser.credentials.email}\nPassword: ${createdUser.credentials.password}`);
      toast.success("Credentials copied securely.");
    } catch { toast.error("Unable to copy credentials."); }
  };

  const openEditUser = (user: UserListItem) => {
    setSelectedUser(user);
    setPhone(user.phone ?? "");
    setAddress(user.address ?? "");
    setEditDialogOpen(true);
  };

  const saveUser = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      await updateUser(selectedUser.id, { address: address.trim() || null, phone: phone.trim() || null });
      toast.success("User details updated successfully.");
      setEditDialogOpen(false);
      await loadUsers();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update user."); }
    finally { setIsSaving(false); }
  };

  const openRoleDialog = async (user: UserListItem) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
    setSelectedRoleId("");
    setAssignmentLocation(null);
    try {
      const [roleRows, permissionRows, assignments] = await Promise.all([getRoles(), getPermissions(), getUserRoleAssignments(user.id)]);
      setRoles(roleRows);
      setPermissions(permissionRows);
      setSelectedRoleId(assignments[0]?.role.id ?? "");
      setAssignmentLocation(assignments[0]?.location ?? null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load role assignments.");
      setRoleDialogOpen(false);
    }
  };

  const selectedRole = useMemo(() => roles.find(({ id }) => id === selectedRoleId) ?? null, [roles, selectedRoleId]);
  const selectedRolePermissions = useMemo(() => selectedRole
    ? permissions.filter(({ id }) => selectedRole.permissionIds.includes(id))
    : [], [permissions, selectedRole]);

  const saveRole = async () => {
    if (!selectedUser || !selectedRoleId) return;
    setIsSaving(true);
    try {
      await setUserRole(selectedUser.id, selectedRoleId, assignmentLocation?.id ?? null);
      toast.success("User role and inherited permissions updated successfully.");
      setRoleDialogOpen(false);
      await loadUsers();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to assign role."); }
    finally { setIsSaving(false); }
  };

  const changeStatus = async (user: UserListItem) => {
    const nextStatus = !user.isActive;
    const action = nextStatus ? "activate" : "deactivate";
    if (!window.confirm(`Are you sure you want to ${action} ${user.name}?`)) return;
    try {
      await updateUserStatus(user.id, nextStatus);
      toast.success(`User ${nextStatus ? "activated" : "deactivated"} successfully.`);
      await loadUsers();
    } catch (error) { toast.error(error instanceof Error ? error.message : `Unable to ${action} user.`); }
  };

  const openLocationDialog = async (user: UserListItem) => {
    setSelectedUser(user);
    setLocationDialogOpen(true);
    try {
      const [locationRows, assignments] = await Promise.all([getAssignableLocations(), getUserRoleAssignments(user.id)]);
      setLocations(locationRows);
      setSelectedLocationId(user.location?.id ?? assignments[0]?.location?.id ?? locationRows[0]?.id ?? "");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load locations.");
      setLocationDialogOpen(false);
    }
  };

  const saveLocation = async () => {
    if (!selectedUser || !selectedLocationId) return;
    setIsSaving(true);
    try {
      await updateUserLocation(selectedUser.id, selectedLocationId);
      toast.success("User location updated successfully.");
      setLocationDialogOpen(false);
      await loadUsers();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update location."); }
    finally { setIsSaving(false); }
  };

  const columns = useMemo<GridColDef<UserListItem>[]>(() => [
    { field: "id", headerName: "User ID", minWidth: 90 },
    { field: "isActive", headerName: "Status", minWidth: 110, renderCell: ({ value }) => <Chip color={value ? "success" : "error"} label={value ? "Active" : "Inactive"} size="small" /> },
    { field: "name", headerName: "Name", flex: 1, minWidth: 180 },
    { field: "email", headerName: "Email", flex: 1, minWidth: 220, valueFormatter: (value) => value || "—" },
    { field: "phone", headerName: "Phone number", minWidth: 150, valueFormatter: (value) => value || "—" },
    { field: "roles", headerName: "User role", minWidth: 180, valueGetter: (_value, row) => row.roles.map(({ label }) => label).join(", ") || "Not assigned" },
    { field: "location", headerName: "Location", minWidth: 170, valueGetter: (_value, row) => row.location?.name || "Not assigned" },
    { field: "actions", headerName: "Actions", minWidth: 210, align: "center", sortable: false, filterable: false, cellClassName: "actions-cell", headerClassName: "actions-header", renderCell: ({ row }) => <Stack alignItems="center" direction="row" justifyContent="center" spacing={0.5} sx={{ height: "100%", width: "100%" }}>{can(USER_PERMISSIONS.USERS_UPDATE) && <Tooltip title="Edit user"><IconButton onClick={() => openEditUser(row)} size="small"><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>}{can(USER_PERMISSIONS.USERS_ASSIGN_ROLES) && <Tooltip title="Set role & permissions"><IconButton color="primary" onClick={() => void openRoleDialog(row)} size="small"><ManageAccountsOutlinedIcon fontSize="small" /></IconButton></Tooltip>}{can(USER_PERMISSIONS.USERS_UPDATE) && <Tooltip title="Set location"><IconButton onClick={() => void openLocationDialog(row)} size="small"><LocationOnOutlinedIcon fontSize="small" /></IconButton></Tooltip>}{can(USER_PERMISSIONS.USERS_UPDATE) && <Tooltip title={row.isActive ? "Deactivate user" : "Activate user"}><IconButton color={row.isActive ? "error" : "success"} onClick={() => void changeStatus(row)} size="small">{row.isActive ? <BlockOutlinedIcon fontSize="small" /> : <CheckCircleOutlineRoundedIcon fontSize="small" />}</IconButton></Tooltip>}</Stack> },
  ], [can]);

  return (
    <>
      <PageMeta description="View and manage Mobee Suite users." title="User List | Mobee Suite" />
      <Stack spacing={{ xs: 2, sm: 2.5 }}>
        <Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
          <Box><Typography sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" }, fontWeight: 700, lineHeight: 1.25 }}>User List</Typography><Typography color="text.secondary" mt={0.5} variant="body2">{total} {total === 1 ? "user" : "users"} registered</Typography></Box>
          {can(USER_PERMISSIONS.USERS_CREATE) && <Button onClick={() => setCreateDialogOpen(true)} startIcon={<AddRoundedIcon />} variant="contained">Create User</Button>}
        </Stack>
        <Card sx={{ border: 1, borderColor: "divider", overflow: "hidden" }}>
          <CardContent sx={{ p: { xs: 2, sm: 2.5 }, "&:last-child": { pb: { xs: 2, sm: 2.5 } } }}>
            <Stack alignItems={{ sm: "center" }} direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField fullWidth label="Search users" onChange={(event) => setSearch(event.target.value)} placeholder="Name, email or phone" slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon color="action" fontSize="small" /></InputAdornment> } }} value={search} />
              <FormControl fullWidth sx={{ maxWidth: { sm: 200 } }}><InputLabel>Status</InputLabel><Select label="Status" onChange={(event) => { setStatus(event.target.value as StatusFilter); setPage(0); }} value={status}><MenuItem value="all">All statuses</MenuItem><MenuItem value="active">Active</MenuItem><MenuItem value="inactive">Inactive</MenuItem></Select></FormControl>
            </Stack>
          </CardContent>
          <Box sx={{ borderTop: 1, borderColor: "divider", overflowX: "auto", width: "100%" }}>
            <DataGrid
              autoHeight
              columns={columns}
              disableRowSelectionOnClick
              onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              paginationMode="server"
              paginationModel={{ page, pageSize }}
              rowCount={total}
              rows={users}
              columnVisibilityModel={isMobile ? { id: false, location: false, phone: false, roles: false } : undefined}
              sx={{ border: 0, minWidth: isMobile ? 680 : 980, "& .actions-cell": { alignItems: "center", display: "flex", justifyContent: "center", px: 1 } }}
            />
          </Box>
        </Card>
      </Stack>

      <Dialog component="form" fullWidth maxWidth="sm" onClose={closeCreateDialog} onSubmit={handleCreateUser} open={createDialogOpen}>
        <DialogTitle>Create User</DialogTitle>
        <DialogContent dividers><Stack spacing={2.5}><Typography color="text.secondary" variant="body2">Enter the user&apos;s basic identity. Mobee will generate a secure password and assign Pending User access automatically.</Typography><Stack direction={{ xs: "column", sm: "row" }} spacing={2}><TextField autoFocus fullWidth inputProps={{ maxLength: 100 }} label="First name" onChange={(event) => setFirstName(event.target.value)} required value={firstName} /><TextField fullWidth inputProps={{ maxLength: 100 }} label="Last name" onChange={(event) => setLastName(event.target.value)} required value={lastName} /></Stack><TextField autoComplete="off" fullWidth inputProps={{ maxLength: 255 }} label="Email address" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></Stack></DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}><Button color="inherit" disabled={isCreating} onClick={closeCreateDialog}>Cancel</Button><Button disabled={isCreating || !firstName.trim() || !lastName.trim() || !email.trim()} type="submit" variant="contained">{isCreating ? "Creating..." : "Generate Password & Create User"}</Button></DialogActions>
      </Dialog>

      <Dialog fullWidth maxWidth="sm" onClose={() => setCredentialsDialogOpen(false)} open={credentialsDialogOpen}>
        <DialogTitle>User Created</DialogTitle>
        <DialogContent dividers><Stack spacing={2.5}><Alert severity="warning">This generated password is shown only now. Copy it and send it to the user securely.</Alert><Box><Typography color="text.secondary" variant="caption">User</Typography><Typography fontWeight={600}>{createdUser?.user.firstName} {createdUser?.user.lastName}</Typography></Box><TextField fullWidth label="Email" slotProps={{ input: { readOnly: true } }} value={createdUser?.credentials.email ?? ""} /><TextField fullWidth label="Generated password" slotProps={{ input: { readOnly: true } }} value={createdUser?.credentials.password ?? ""} /><Chip color="warning" label="Pending User — no module access" sx={{ alignSelf: "flex-start" }} variant="outlined" /></Stack></DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}><Button color="inherit" onClick={() => setCredentialsDialogOpen(false)}>Close</Button><Button onClick={() => void copyCredentials()} startIcon={<ContentCopyRoundedIcon />} variant="contained">Copy Credentials</Button></DialogActions>
      </Dialog>

      <Dialog component="form" fullWidth maxWidth="sm" onClose={() => !isSaving && setEditDialogOpen(false)} onSubmit={saveUser} open={editDialogOpen}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent dividers><Stack spacing={2.5}><Alert severity="info">First name, last name and email are protected and cannot be edited.</Alert><TextField disabled fullWidth label="User" value={selectedUser?.name ?? ""} /><TextField disabled fullWidth label="Email" value={selectedUser?.email ?? ""} /><TextField fullWidth inputProps={{ maxLength: 30 }} label="Phone number" onChange={(event) => setPhone(event.target.value)} value={phone} /><TextField fullWidth inputProps={{ maxLength: 1000 }} label="Address" minRows={3} multiline onChange={(event) => setAddress(event.target.value)} value={address} /></Stack></DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}><Button color="inherit" disabled={isSaving} onClick={() => setEditDialogOpen(false)}>Cancel</Button><Button disabled={isSaving} type="submit" variant="contained">{isSaving ? "Saving..." : "Save Changes"}</Button></DialogActions>
      </Dialog>

      <Dialog fullWidth maxWidth="sm" onClose={() => !isSaving && setRoleDialogOpen(false)} open={roleDialogOpen}>
        <DialogTitle>Set Role & Permissions</DialogTitle>
        <DialogContent dividers><Stack spacing={2.5}><Box><Typography fontWeight={700}>{selectedUser?.name}</Typography><Typography color="text.secondary" variant="body2">{selectedUser?.email}</Typography></Box><FormControl fullWidth><InputLabel>Role</InputLabel><Select label="Role" onChange={(event) => setSelectedRoleId(Number(event.target.value))} value={selectedRoleId}>{roles.map((role) => <MenuItem key={role.id} value={role.id}>{role.label}{role.isSystem ? " (System)" : ""}</MenuItem>)}</Select></FormControl><Box><Typography fontWeight={600} mb={1} variant="body2">Inherited permissions</Typography><Stack direction="row" flexWrap="wrap" gap={1}>{selectedRolePermissions.length ? selectedRolePermissions.map((permission) => <Chip key={permission.id} label={permission.title || permission.key} size="small" variant="outlined" />) : <Typography color="text.secondary" variant="body2">This role has no permissions.</Typography>}</Stack></Box>{assignmentLocation && <Alert severity="info">The existing location remains {assignmentLocation.name}. Use the separate location action to change it.</Alert>}</Stack></DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}><Button color="inherit" disabled={isSaving} onClick={() => setRoleDialogOpen(false)}>Cancel</Button><Button disabled={isSaving || !selectedRoleId} onClick={() => void saveRole()} variant="contained">{isSaving ? "Saving..." : "Assign Role"}</Button></DialogActions>
      </Dialog>

      <Dialog fullWidth maxWidth="xs" onClose={() => !isSaving && setLocationDialogOpen(false)} open={locationDialogOpen}>
        <DialogTitle>Set User Location</DialogTitle>
        <DialogContent dividers><Stack spacing={2.5}><Box><Typography fontWeight={700}>{selectedUser?.name}</Typography><Typography color="text.secondary" variant="body2">{selectedUser?.email}</Typography></Box><FormControl fullWidth><InputLabel>Location</InputLabel><Select label="Location" onChange={(event) => setSelectedLocationId(Number(event.target.value))} value={selectedLocationId}>{locations.map((location) => <MenuItem key={location.id} value={location.id}>{location.name}</MenuItem>)}</Select></FormControl><Alert severity="info">Changing this value updates the user&apos;s default location and their current role assignment location.</Alert></Stack></DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}><Button color="inherit" disabled={isSaving} onClick={() => setLocationDialogOpen(false)}>Cancel</Button><Button disabled={isSaving || !selectedLocationId} onClick={() => void saveLocation()} variant="contained">{isSaving ? "Saving..." : "Save Location"}</Button></DialogActions>
      </Dialog>
    </>
  );
}
