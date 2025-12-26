import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Search, Trash2, Pencil, RefreshCw, FolderOpen, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { adminFetch } from "@/lib/adminFetch";
import { format } from "date-fns";

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

interface LinkedProject {
  id: string;
  project_token: string;
  business_name: string;
  status: string;
  contact_email: string | null;
  contact_phone: string | null;
}

interface AccountWithProjects {
  user: AuthUser;
  projects: LinkedProject[];
}

async function fetchAccounts(): Promise<AccountWithProjects[]> {
  const res = await adminFetch("/admin/accounts");
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to fetch accounts" }));
    throw new Error(err.error || "Failed to fetch accounts");
  }
  return res.json();
}

async function updateAccount(userId: string, data: { email?: string }): Promise<void> {
  const res = await adminFetch(`/admin/accounts/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to update account" }));
    throw new Error(err.error || "Failed to update account");
  }
}

async function deleteAccount(userId: string): Promise<void> {
  const res = await adminFetch(`/admin/accounts/${userId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to delete account" }));
    throw new Error(err.error || "Failed to delete account");
  }
}

export function AccountsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingAccount, setEditingAccount] = useState<AccountWithProjects | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [deletingAccount, setDeletingAccount] = useState<AccountWithProjects | null>(null);

  const { data: accounts, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-accounts"],
    queryFn: fetchAccounts,
    staleTime: 30_000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: { email?: string } }) =>
      updateAccount(userId, data),
    onSuccess: () => {
      toast.success("Account updated");
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
      setEditingAccount(null);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteAccount(userId),
    onSuccess: () => {
      toast.success("Account deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
      setDeletingAccount(null);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const filteredAccounts = accounts?.filter((acc) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      acc.user.email.toLowerCase().includes(q) ||
      acc.projects.some((p) => p.business_name.toLowerCase().includes(q))
    );
  });

  const handleEditClick = (account: AccountWithProjects) => {
    setEditingAccount(account);
    setEditEmail(account.user.email);
  };

  const handleSaveEdit = () => {
    if (!editingAccount) return;
    if (!editEmail.trim() || !editEmail.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    updateMutation.mutate({ userId: editingAccount.user.id, data: { email: editEmail.trim() } });
  };

  const handleDeleteClick = (account: AccountWithProjects) => {
    setDeletingAccount(account);
  };

  const handleConfirmDelete = () => {
    if (!deletingAccount) return;
    deleteMutation.mutate(deletingAccount.user.id);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Client Accounts
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or business name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Badge variant="secondary">
            {filteredAccounts?.length ?? 0} account{(filteredAccounts?.length ?? 0) !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-destructive text-sm py-4">
            Failed to load accounts: {(error as Error).message}
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {!isLoading && !error && filteredAccounts && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Sign In</TableHead>
                  <TableHead>Linked Projects</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No accounts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((account) => (
                    <TableRow key={account.user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{account.user.email}</span>
                          {account.user.email_confirmed_at && (
                            <Badge variant="outline" className="text-xs">Verified</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(account.user.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {account.user.last_sign_in_at
                          ? format(new Date(account.user.last_sign_in_at), "MMM d, yyyy h:mm a")
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        {account.projects.length === 0 ? (
                          <span className="text-muted-foreground text-sm">No projects</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {account.projects.map((project) => (
                              <Badge
                                key={project.id}
                                variant="secondary"
                                className="text-xs flex items-center gap-1"
                              >
                                <FolderOpen className="h-3 w-3" />
                                {project.business_name}
                                <span className="text-muted-foreground">({project.status})</span>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(account)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(account)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingAccount} onOpenChange={(open) => !open && setEditingAccount(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Account</DialogTitle>
              <DialogDescription>
                Update account information for {editingAccount?.user.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              {editingAccount && editingAccount.projects.length > 0 && (
                <div className="space-y-2">
                  <Label>Linked Projects</Label>
                  <div className="space-y-2">
                    {editingAccount.projects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-md"
                      >
                        <div>
                          <div className="font-medium">{project.business_name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-3">
                            {project.contact_email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {project.contact_email}
                              </span>
                            )}
                            {project.contact_phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {project.contact_phone}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge>{project.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingAccount(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingAccount} onOpenChange={(open) => !open && setDeletingAccount(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the account for{" "}
                <strong>{deletingAccount?.user.email}</strong>?
                {deletingAccount && deletingAccount.projects.length > 0 && (
                  <>
                    <br /><br />
                    This account is linked to {deletingAccount.projects.length} project(s). The projects
                    will remain but will no longer be linked to this user.
                  </>
                )}
                <br /><br />
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
