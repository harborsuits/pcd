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
import { Users, Search, Trash2, Pencil, RefreshCw, FolderOpen, Mail, Phone, AlertTriangle, CheckCircle2, XCircle, Clock, Send } from "lucide-react";
import { toast } from "sonner";
import { adminFetch, AdminAuthError } from "@/lib/adminFetch";
import { format, differenceInDays } from "date-fns";

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

async function clearTestAccounts(): Promise<{ deleted: number; total: number; errors?: string[] }> {
  const res = await adminFetch("/admin/accounts/clear-test", {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to clear test accounts" }));
    throw new Error(err.error || "Failed to clear test accounts");
  }
  return res.json();
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function resendOtp(email: string, businessName?: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-verification-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      project_token: null,
      business_name: businessName ?? "Pleasant Cove",
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Failed to send code");
  }
}

export function AccountsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingAccount, setEditingAccount] = useState<AccountWithProjects | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [deletingAccount, setDeletingAccount] = useState<AccountWithProjects | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const { data: accounts, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-accounts"],
    queryFn: fetchAccounts,
    staleTime: 30_000,
    retry: (failureCount, err) => {
      // Don't retry auth errors
      if (err instanceof AdminAuthError) return false;
      return failureCount < 2;
    },
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

  const clearTestMutation = useMutation({
    mutationFn: clearTestAccounts,
    onSuccess: (data) => {
      toast.success(`Cleared ${data.deleted} of ${data.total} test accounts`);
      if (data.errors && data.errors.length > 0) {
        console.warn("Some accounts failed to delete:", data.errors);
      }
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
      setShowClearConfirm(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const [resendingUserId, setResendingUserId] = useState<string | null>(null);

  const resendOtpMutation = useMutation({
    mutationFn: ({ email, businessName }: { email: string; businessName?: string }) =>
      resendOtp(email, businessName),
    onMutate: (variables) => {
      // We'll track which user is being resent via state
    },
    onSuccess: () => {
      toast.success("If that email can receive mail, a code was sent.");
      setResendingUserId(null);
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setResendingUserId(null);
    },
  });

  const handleResendOtp = (account: AccountWithProjects) => {
    setResendingUserId(account.user.id);
    const businessName = account.projects[0]?.business_name ?? "Pleasant Cove";
    resendOtpMutation.mutate({ email: account.user.email, businessName });
  };

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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/50 hover:bg-destructive/10"
              onClick={() => setShowClearConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Test Accounts
            </Button>
          </div>
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
        {/* Error state */}
        {error && !isLoading && (
          <div className="text-destructive text-sm py-4 flex flex-col gap-2">
            <span>Failed to load accounts: {(error as Error).message}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="w-fit">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && !error && (
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
                  filteredAccounts.map((account) => {
                    const isVerified = !!account.user.email_confirmed_at;
                    const lastSignIn = account.user.last_sign_in_at;
                    const daysSinceSignIn = lastSignIn 
                      ? differenceInDays(new Date(), new Date(lastSignIn))
                      : null;
                    const activityStatus = daysSinceSignIn === null 
                      ? "never" 
                      : daysSinceSignIn <= 7 
                        ? "active" 
                        : "stale";
                    
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case "client":
                        case "completed":
                          return "bg-green-500/10 text-green-600 border-green-500/20";
                        case "interested":
                        case "contacted":
                          return "bg-blue-500/10 text-blue-600 border-blue-500/20";
                        case "lead":
                          return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
                        case "archived":
                          return "bg-muted text-muted-foreground border-border";
                        default:
                          return "";
                      }
                    };

                    return (
                    <TableRow key={account.user.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{account.user.email}</span>
                          </div>
                          <div className="flex items-center gap-2 ml-6">
                            {isVerified ? (
                              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-600 border-orange-500/20">
                                <XCircle className="h-3 w-3 mr-1" />
                                Unverified
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(account.user.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground text-sm">
                            {lastSignIn
                              ? format(new Date(lastSignIn), "MMM d, yyyy")
                              : "Never"}
                          </span>
                          {activityStatus === "active" && (
                            <Badge variant="outline" className="text-xs w-fit bg-green-500/10 text-green-600 border-green-500/20">
                              <Clock className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                          {activityStatus === "stale" && (
                            <Badge variant="outline" className="text-xs w-fit bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                              <Clock className="h-3 w-3 mr-1" />
                              {daysSinceSignIn}d ago
                            </Badge>
                          )}
                          {activityStatus === "never" && (
                            <Badge variant="outline" className="text-xs w-fit bg-muted text-muted-foreground border-border">
                              <Clock className="h-3 w-3 mr-1" />
                              Never
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="secondary" className="text-xs w-fit">
                            {account.projects.length} Project{account.projects.length !== 1 ? "s" : ""}
                          </Badge>
                          {account.projects.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {account.projects.map((project) => (
                                <Badge
                                  key={project.id}
                                  variant="outline"
                                  className={`text-xs flex items-center gap-1 ${getStatusColor(project.status)}`}
                                >
                                  <FolderOpen className="h-3 w-3" />
                                  {project.business_name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Resend OTP: only show when unverified OR never signed in */}
                          {(!isVerified || activityStatus === "never") ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResendOtp(account)}
                              disabled={resendingUserId === account.user.id}
                              title="Send login code"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled
                              title="User is verified & active"
                              className="opacity-30 cursor-not-allowed"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
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
                  )})
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

        {/* Clear Test Accounts Confirmation */}
        <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Clear All Test Accounts
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <strong>all client accounts</strong> except operator accounts
                (pleasantcovedesign@gmail.com).
                <br /><br />
                Projects will remain but will be unlinked from their users.
                <br /><br />
                <strong>This action cannot be undone.</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={clearTestMutation.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => clearTestMutation.mutate()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={clearTestMutation.isPending}
              >
                {clearTestMutation.isPending ? "Clearing..." : "Clear All Test Accounts"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
