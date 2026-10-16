"use client";

import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  FolderOpen,
  Loader2,
  LogOut,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AdminStatus } from "@/lib/types";
import {
  adminFetch,
  clearSessionToken,
  setSessionToken,
} from "@/lib/session";

import { ManageMaterials } from "./manage-materials";
import { UploadMaterialForm } from "./upload-material-form";

interface AdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: AdminStatus | undefined;
  statusLoading: boolean;
  onStatusRefresh: () => void;
}

function AdminModalSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const body = (await res.json().catch(() => null)) as
        | { error?: string; token?: string; email?: string }
        | null;
      if (!res.ok) {
        setError(body?.error ?? "Invalid email or password.");
        return;
      }
      // Store the token (works even where cookies are dropped) and unlock the
      // dashboard immediately — no waiting for a refetch.
      if (body?.token) setSessionToken(body.token);
      queryClient.setQueryData<AdminStatus>(["admin-status"], {
        authenticated: true,
        email: body?.email,
        needsSetup: false,
        requiresCode: false,
      });
      toast.success("Signed in successfully.");
      setPassword("");
      onSuccess();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="admin-email">Email</Label>
        <Input
          id="admin-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@studyshelf.edu"
          className="h-11"
          disabled={pending}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-password">Password</Label>
        <Input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Your password"
          className="h-11"
          disabled={pending}
          required
        />
      </div>
      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Sign in
      </Button>
    </form>
  );
}

function SetupForm({
  requiresCode,
  onSuccess,
}: {
  requiresCode: boolean;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;

    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const res = await adminFetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          confirmPassword,
          ...(requiresCode ? { setupCode: setupCode.trim() } : {}),
        }),
      });
      const body = (await res.json().catch(() => null)) as
        | { error?: string; token?: string; email?: string }
        | null;
      if (!res.ok) {
        setError(body?.error ?? "Setup failed. Please try again.");
        return;
      }
      // The setup endpoint signs us in — store the token and go straight to
      // the dashboard.
      if (body?.token) setSessionToken(body.token);
      queryClient.setQueryData<AdminStatus>(["admin-status"], {
        authenticated: true,
        email: body?.email,
        needsSetup: false,
        requiresCode: false,
      });
      toast.success("Administrator account created.");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setSetupCode("");
      onSuccess();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-slate-600">
        One-time setup: create the administrator account for StudyShelf.
      </p>
      {error && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="setup-email">Email</Label>
        <Input
          id="setup-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@studyshelf.edu"
          className="h-11"
          disabled={pending}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="setup-password">Password</Label>
        <Input
          id="setup-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
          className="h-11"
          disabled={pending}
          required
          minLength={8}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="setup-confirm-password">Confirm password</Label>
        <Input
          id="setup-confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Repeat the password"
          className="h-11"
          disabled={pending}
          required
        />
      </div>
      {requiresCode && (
        <div className="space-y-2">
          <Label htmlFor="setup-code">Setup code</Label>
          <Input
            id="setup-code"
            type="password"
            value={setupCode}
            onChange={(event) => setSetupCode(event.target.value)}
            placeholder="ADMIN_SETUP_CODE"
            className="h-11"
            disabled={pending}
            required
          />
          <p className="text-xs text-slate-500">
            Found in your hosting environment variables.
          </p>
        </div>
      )}
      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Create administrator account
      </Button>
    </form>
  );
}

function AdminDashboard({
  email,
  onSignOut,
}: {
  email: string;
  onSignOut: () => void;
}) {
  const queryClient = useQueryClient();
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    if (signingOut) return;

    setSigningOut(true);
    try {
      const res = await adminFetch("/api/admin/logout", { method: "POST" });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        toast.error(body?.error ?? "Sign out failed.");
        return;
      }
      // Drop the token and lock the panel immediately.
      clearSessionToken();
      queryClient.setQueryData<AdminStatus>(["admin-status"], {
        authenticated: false,
        needsSetup: false,
        requiresCode: false,
      });
      toast.success("Signed out.");
      onSignOut();
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="upload">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="h-4 w-4" aria-hidden />
            Upload
          </TabsTrigger>
          <TabsTrigger value="manage" className="gap-2">
            <FolderOpen className="h-4 w-4" aria-hidden />
            Manage
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="mt-3">
          <UploadMaterialForm />
        </TabsContent>
        <TabsContent value="manage" className="mt-3">
          <ManageMaterials />
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
        <p className="min-w-0 truncate text-xs text-slate-500">
          Signed in as{" "}
          <span className="font-medium text-slate-700">{email}</span>
        </p>
        <Button
          variant="outline"
          size="sm"
          className="h-9 shrink-0 gap-2"
          onClick={() => void handleLogout()}
          disabled={signingOut}
        >
          {signingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <LogOut className="h-4 w-4" aria-hidden />
          )}
          Log out
        </Button>
      </div>
    </div>
  );
}

function StatusErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="space-y-3">
      <Alert variant="destructive">
        <AlertCircle aria-hidden />
        <AlertDescription>
          Couldn&apos;t verify admin status. Check your connection and try again.
        </AlertDescription>
      </Alert>
      <Button variant="outline" className="h-11 w-full" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

export function AdminModal({
  open,
  onOpenChange,
  status,
  statusLoading,
  onStatusRefresh,
}: AdminModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] w-[calc(100vw-2rem)] overflow-y-auto rounded-xl sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 text-left">
              <DialogTitle>StudyShelf Admin</DialogTitle>
              <DialogDescription>
                Upload and manage the library&apos;s study materials.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {statusLoading ? (
          <AdminModalSkeleton />
        ) : !status ? (
          <StatusErrorState onRetry={onStatusRefresh} />
        ) : status.authenticated ? (
          <AdminDashboard email={status.email ?? "admin"} onSignOut={onStatusRefresh} />
        ) : status.needsSetup ? (
          <SetupForm requiresCode={status.requiresCode} onSuccess={onStatusRefresh} />
        ) : (
          <LoginForm onSuccess={onStatusRefresh} />
        )}
      </DialogContent>
    </Dialog>
  );
}
