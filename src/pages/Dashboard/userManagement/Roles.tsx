import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  Accordion, AccordionDetails, AccordionSummary, Box, Button, Card, Checkbox, Chip,
  Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel,
  IconButton, InputAdornment, ListItemButton, ListItemText, Stack, Tab, Tabs,
  TextField, Tooltip, Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import PageMeta from "../../../components/common/PageMeta";
import useAuth from "../../../hooks/useAuth";
import { USER_PERMISSIONS } from "../../../utils/constants";
import {
  createPermission, createRole, deletePermission, deleteRole, getPermissions, getRoles,
  replaceRolePermissions, updatePermission, updateRole, type Permission, type PermissionInput,
  type Role,
} from "../../../redux/slices/userManagementRedux/rolePermissionRedux";

type TabName = "roles" | "permissions";
type PermissionForm = Omit<PermissionInput, "description"> & { description: string };
const emptyPermission: PermissionForm = { category: "", description: "", key: "", mainCategory: "", module: "", priority: 100, title: "" };
const friendly = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function Roles() {
  const { can } = useAuth();
  const [activeTab, setActiveTab] = useState<TabName>("roles");
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [roleSearch, setRoleSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [roleDialog, setRoleDialog] = useState<"create" | "edit" | null>(null);
  const [roleLabel, setRoleLabel] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [permissionDialog, setPermissionDialog] = useState<"create" | "edit" | null>(null);
  const [editingPermissionId, setEditingPermissionId] = useState<number | null>(null);
  const [permissionForm, setPermissionForm] = useState<PermissionForm>(emptyPermission);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [roleRows, permissionRows] = await Promise.all([getRoles(), getPermissions()]);
      setRoles(roleRows);
      setPermissions(permissionRows);
      setSelectedRoleId((current) => current && roleRows.some(({ id }) => id === current) ? current : roleRows[0]?.id ?? null);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load roles and permissions."); }
  }, []);
  useEffect(() => { void loadData(); }, [loadData]);

  const selectedRole = useMemo(() => roles.find(({ id }) => id === selectedRoleId) ?? null, [roles, selectedRoleId]);
  useEffect(() => { setSelectedPermissionIds(selectedRole?.permissionIds ?? []); }, [selectedRole]);
  const visibleRoles = useMemo(() => {
    const term = roleSearch.trim().toLowerCase();
    return [...roles].sort((a, b) => a.label.localeCompare(b.label)).filter((role) => !term || [role.label, role.name, role.description].some((value) => value?.toLowerCase().includes(term)));
  }, [roleSearch, roles]);
  const visiblePermissions = useMemo(() => {
    const term = permissionSearch.trim().toLowerCase();
    return [...permissions].sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title)).filter((permission) => !term || [permission.key, permission.title, permission.category, permission.mainCategory, permission.description].some((value) => value?.toLowerCase().includes(term)));
  }, [permissionSearch, permissions]);
  const groupedPermissions = useMemo(() => visiblePermissions.reduce<Record<string, Record<string, Permission[]>>>((groups, permission) => {
    const main = permission.mainCategory || friendly(permission.module) || "General";
    const category = permission.category || friendly(permission.module) || "General";
    groups[main] ??= {}; groups[main][category] ??= []; groups[main][category].push(permission); return groups;
  }, {}), [visiblePermissions]);

  const togglePermission = (id: number) => setSelectedPermissionIds((current) => current.includes(id) ? current.filter((permissionId) => permissionId !== id) : [...current, id]);
  const toggleCategory = (items: Permission[]) => {
    const ids = items.map(({ id }) => id); const allSelected = ids.every((id) => selectedPermissionIds.includes(id));
    setSelectedPermissionIds((current) => allSelected ? current.filter((id) => !ids.includes(id)) : [...new Set([...current, ...ids])]);
  };
  const saveRolePermissions = async () => {
    if (!selectedRole || selectedRole.isSystem) return; setSubmitting(true);
    try { await replaceRolePermissions(selectedRole.id, selectedPermissionIds); toast.success("Role permissions updated successfully."); await loadData(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update role permissions."); }
    finally { setSubmitting(false); }
  };
  const openRoleDialog = (mode: "create" | "edit") => { setRoleLabel(mode === "edit" ? selectedRole?.label ?? "" : ""); setRoleDescription(mode === "edit" ? selectedRole?.description ?? "" : ""); setRoleDialog(mode); };
  const submitRole = async (event: FormEvent) => {
    event.preventDefault(); if (roleLabel.trim().length < 2) return toast.error("Role name must contain at least 2 characters."); setSubmitting(true);
    try {
      if (roleDialog === "create") await createRole({ description: roleDescription.trim() || null, label: roleLabel.trim(), permissionIds: [], permissionKeys: [] });
      else if (selectedRole) await updateRole(selectedRole.id, { description: roleDescription.trim() || null, label: roleLabel.trim() });
      toast.success(`Role ${roleDialog === "create" ? "created" : "updated"} successfully.`); setRoleDialog(null); await loadData();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save role."); } finally { setSubmitting(false); }
  };
  const removeRole = async () => {
    if (!selectedRole || selectedRole.isSystem || !window.confirm(`Delete “${selectedRole.label}”?`)) return;
    try { await deleteRole(selectedRole.id); toast.success("Role deleted successfully."); setSelectedRoleId(null); await loadData(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to delete role."); }
  };
  const openPermissionDialog = (mode: "create" | "edit", permission?: Permission) => {
    setEditingPermissionId(permission?.id ?? null);
    setPermissionForm(permission ? { category: permission.category, description: permission.description ?? "", key: permission.key, mainCategory: permission.mainCategory, module: permission.module, priority: permission.priority, title: permission.title } : emptyPermission);
    setPermissionDialog(mode);
  };
  const submitPermission = async (event: FormEvent) => {
    event.preventDefault(); const input: PermissionInput = { ...permissionForm, description: permissionForm.description.trim() || null }; setSubmitting(true);
    try { if (permissionDialog === "create") await createPermission(input); else if (editingPermissionId) await updatePermission(editingPermissionId, input); toast.success(`Permission ${permissionDialog === "create" ? "created" : "updated"} successfully.`); setPermissionDialog(null); await loadData(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save permission."); } finally { setSubmitting(false); }
  };
  const removePermission = async (permission: Permission) => {
    if (permission.isSystem || !window.confirm(`Delete “${permission.key}”? It will be removed from every role.`)) return;
    try { await deletePermission(permission.id); toast.success("Permission deleted successfully."); await loadData(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to delete permission."); }
  };

  return <>
    <PageMeta description="Manage Mobee roles and permissions." title="Roles & Permissions | Mobee Suite" />
    <Stack spacing={2.5}>
      <Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
        <Box><Stack alignItems="center" direction="row" spacing={1}><AdminPanelSettingsOutlinedIcon color="primary" /><Typography variant="h4">Roles & Permissions</Typography></Stack><Typography color="text.secondary" mt={0.5} variant="body2">Create roles, organize permissions, and control access.</Typography></Box>
        <Stack direction="row" gap={1}>{can(USER_PERMISSIONS.PERMISSIONS_CREATE) && <Button onClick={() => openPermissionDialog("create")} variant="outlined">New Permission</Button>}{can(USER_PERMISSIONS.ROLES_CREATE) && <Button onClick={() => openRoleDialog("create")} startIcon={<AddRoundedIcon />} variant="contained">New Role</Button>}</Stack>
      </Stack>
      <Card variant="outlined" sx={{ overflow: "hidden" }}>
        <Tabs onChange={(_event, value: TabName) => setActiveTab(value)} scrollButtons="auto" value={activeTab} variant="scrollable" sx={{ borderBottom: 1, borderColor: "divider", px: 1 }}><Tab label="Roles & Access" value="roles" /><Tab label="Permissions & Priority" value="permissions" /></Tabs>
        {activeTab === "roles" && <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", md: "minmax(240px, 0.32fr) minmax(0, 1fr)" }, p: { xs: 2, sm: 2.5 } }}>
          <Card variant="outlined" sx={{ alignSelf: "start" }}><Box p={2}><Stack alignItems="center" direction="row" justifyContent="space-between"><Typography fontWeight={700}>Roles</Typography><Chip label={roles.length} size="small" /></Stack><TextField fullWidth margin="normal" onChange={(event) => setRoleSearch(event.target.value)} placeholder="Search roles" size="small" value={roleSearch} /><Divider /><Box sx={{ maxHeight: 520, overflowY: "auto", pt: 1 }}>{visibleRoles.map((role) => <ListItemButton key={role.id} onClick={() => setSelectedRoleId(role.id)} selected={role.id === selectedRoleId} sx={{ borderRadius: 1.5, mb: 0.5 }}><ListItemText primary={role.label} secondary={`${role.permissionIds.length} permissions${role.isSystem ? " • System" : ""}`} /></ListItemButton>)}</Box></Box></Card>
          <Box><Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1.5} mb={2}><Box><Typography variant="h6">{selectedRole?.label ?? "Select a role"}</Typography><Typography color="text.secondary" variant="body2">{selectedRole?.isSystem ? "System roles are protected from changes." : "Select the permissions this role should receive."}</Typography></Box>{selectedRole && !selectedRole.isSystem && <Stack direction="row" gap={1}>{can(USER_PERMISSIONS.ROLES_UPDATE) && <Tooltip title="Edit role"><IconButton onClick={() => openRoleDialog("edit")}><EditOutlinedIcon /></IconButton></Tooltip>}{can(USER_PERMISSIONS.ROLES_DELETE) && <Tooltip title="Delete role"><IconButton color="error" onClick={() => void removeRole()}><DeleteOutlineRoundedIcon /></IconButton></Tooltip>}{can(USER_PERMISSIONS.ROLES_ASSIGN_PERMISSIONS) && <Button disabled={submitting} onClick={() => void saveRolePermissions()} startIcon={<SaveRoundedIcon />} variant="contained">Save access</Button>}</Stack>}</Stack>
            <TextField fullWidth onChange={(event) => setPermissionSearch(event.target.value)} placeholder="Search permission name, key, or category" size="small" slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> } }} value={permissionSearch} sx={{ mb: 2 }} />
            {Object.entries(groupedPermissions).map(([main, categories]) => <Accordion defaultExpanded key={main} variant="outlined"><AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}><Typography fontWeight={700}>{main}</Typography></AccordionSummary><AccordionDetails><Stack spacing={2}>{Object.entries(categories).map(([category, items]) => { const checked = items.every(({ id }) => selectedPermissionIds.includes(id)); return <Box key={category}><FormControlLabel control={<Checkbox checked={checked} disabled={!selectedRole || selectedRole.isSystem} indeterminate={!checked && items.some(({ id }) => selectedPermissionIds.includes(id))} onChange={() => toggleCategory(items)} />} label={<Typography fontWeight={600} variant="body2">{category}</Typography>} /><Stack direction="row" flexWrap="wrap" gap={1} ml={{ sm: 4 }}>{items.map((permission) => <Chip clickable={!selectedRole?.isSystem} color={selectedPermissionIds.includes(permission.id) ? "primary" : "default"} key={permission.id} label={permission.title || permission.key} onClick={() => !selectedRole?.isSystem && togglePermission(permission.id)} variant={selectedPermissionIds.includes(permission.id) ? "filled" : "outlined"} />)}</Stack></Box>; })}</Stack></AccordionDetails></Accordion>)}
          </Box>
        </Box>}
        {activeTab === "permissions" && <Box p={{ xs: 2, sm: 2.5 }}><TextField fullWidth onChange={(event) => setPermissionSearch(event.target.value)} placeholder="Search permissions" size="small" value={permissionSearch} sx={{ mb: 2 }} />{Object.entries(groupedPermissions).map(([main, categories]) => <Accordion defaultExpanded key={main} variant="outlined"><AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}><Stack alignItems="center" direction="row" gap={1}><Typography fontWeight={700}>{main}</Typography><Chip label={Object.values(categories).flat().length} size="small" /></Stack></AccordionSummary><AccordionDetails><Stack divider={<Divider flexItem />} spacing={0}>{Object.entries(categories).map(([category, items]) => <Box key={category} py={1.5}><Typography color="text.secondary" fontWeight={700} mb={1} variant="overline">{category}</Typography>{items.map((permission) => <Stack alignItems="center" direction="row" justifyContent="space-between" key={permission.id} py={1} gap={2}><Box minWidth={0}><Stack alignItems="center" direction="row" flexWrap="wrap" gap={1}><Typography fontWeight={600}>{permission.title || permission.key}</Typography><Chip label={permission.key} size="small" variant="outlined" />{permission.isSystem && <Chip color="primary" label="System" size="small" />}</Stack><Typography color="text.secondary" variant="body2">{permission.description || "No description"} · Priority {permission.priority}</Typography></Box>{!permission.isSystem && <Stack direction="row">{can(USER_PERMISSIONS.PERMISSIONS_UPDATE) && <IconButton onClick={() => openPermissionDialog("edit", permission)} size="small"><EditOutlinedIcon fontSize="small" /></IconButton>}{can(USER_PERMISSIONS.PERMISSIONS_DELETE) && <IconButton color="error" onClick={() => void removePermission(permission)} size="small"><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>}</Stack>}</Stack>)}</Box>)}</Stack></AccordionDetails></Accordion>)}</Box>}
      </Card>
    </Stack>
    <Dialog component="form" fullWidth maxWidth="sm" onClose={() => !submitting && setRoleDialog(null)} onSubmit={submitRole} open={roleDialog !== null}><DialogTitle>{roleDialog === "create" ? "Create Role" : "Edit Role"}</DialogTitle><DialogContent dividers><Stack spacing={2.5}><TextField autoFocus label="Role name" onChange={(event) => setRoleLabel(event.target.value)} required value={roleLabel} /><TextField label="Description" minRows={3} multiline onChange={(event) => setRoleDescription(event.target.value)} value={roleDescription} /></Stack></DialogContent><DialogActions><Button color="inherit" onClick={() => setRoleDialog(null)}>Cancel</Button><Button disabled={submitting} type="submit" variant="contained">Save</Button></DialogActions></Dialog>
    <Dialog component="form" fullWidth maxWidth="sm" onClose={() => !submitting && setPermissionDialog(null)} onSubmit={submitPermission} open={permissionDialog !== null}><DialogTitle>{permissionDialog === "create" ? "Create Permission" : "Edit Permission"}</DialogTitle><DialogContent dividers><Stack spacing={2}><TextField autoFocus label="Permission key" onChange={(event) => setPermissionForm((current) => ({ ...current, key: event.target.value.toLowerCase() }))} placeholder="customers.create" required value={permissionForm.key} /><TextField label="Title" onChange={(event) => setPermissionForm((current) => ({ ...current, title: event.target.value }))} required value={permissionForm.title} /><Stack direction={{ xs: "column", sm: "row" }} spacing={2}><TextField fullWidth label="Module" onChange={(event) => setPermissionForm((current) => ({ ...current, module: event.target.value.toLowerCase() }))} required value={permissionForm.module} /><TextField fullWidth label="Priority" onChange={(event) => setPermissionForm((current) => ({ ...current, priority: Number(event.target.value) }))} type="number" value={permissionForm.priority} /></Stack><Stack direction={{ xs: "column", sm: "row" }} spacing={2}><TextField fullWidth label="Main category" onChange={(event) => setPermissionForm((current) => ({ ...current, mainCategory: event.target.value }))} required value={permissionForm.mainCategory} /><TextField fullWidth label="Category" onChange={(event) => setPermissionForm((current) => ({ ...current, category: event.target.value }))} required value={permissionForm.category} /></Stack><TextField label="Description" minRows={3} multiline onChange={(event) => setPermissionForm((current) => ({ ...current, description: event.target.value }))} value={permissionForm.description} /></Stack></DialogContent><DialogActions><Button color="inherit" onClick={() => setPermissionDialog(null)}>Cancel</Button><Button disabled={submitting} type="submit" variant="contained">Save</Button></DialogActions></Dialog>
  </>;
}
