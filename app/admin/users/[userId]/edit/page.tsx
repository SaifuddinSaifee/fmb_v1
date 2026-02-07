"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { UserForm } from "@/components/ui/user-form";
import type { UserFormData } from "@/components/ui/user-form";
import type { UserRecord } from "@/lib/interfaces/user";

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [user, setUser] = useState<UserRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/admin/users/${userId}`);
        if (!response.ok) {
          throw new Error("Failed to load user");
        }
        const data = await response.json();
        setUser(data.user);
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Failed to load user information. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const handleFormSubmit = async (data: UserFormData) => {
    try {
      setError(null);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          phoneOrEmail: data.phoneOrEmail,
          role: data.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update user");
      }

      router.push("/admin/users?success=updated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update user";
      setError(message);
      throw err;
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      // Redirect to users list
      router.push("/admin/users?success=deleted");
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Failed to delete user. Please try again.");
      setIsDeleting(false);
    }
  };

  const handleResetPassword = async () => {
    setPasswordError("");

    // Validate password
    if (!newPassword) {
      setPasswordError("Password is required");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError("Password must contain at least one uppercase letter");
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      setPasswordError("Password must contain at least one lowercase letter");
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setPasswordError("Password must contain at least one number");
      return;
    }

    try {
      setIsResettingPassword(true);
      const response = await fetch(`/api/admin/users/${userId}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) {
        throw new Error("Failed to reset password");
      }

      setPasswordDialogOpen(false);
      setNewPassword("");
    } catch (err) {
      console.error("Error resetting password:", err);
      setPasswordError("Failed to reset password. Please try again.");
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6">
        <div className="mx-auto w-full max-w-2xl">
          <div className="flex items-center gap-2 mb-8">
            <Link href="/admin/users" className="text-slate-600 hover:text-slate-900">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">User Not Found</h1>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-slate-600">The user you're looking for doesn't exist.</p>
              <Link href="/admin/users">
                <Button className="mt-4">Back to Users</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const formInitialData = {
    name: user.name,
    its: user.its,
    phoneOrEmail: user.phoneOrEmail,
    role: user.role as "admin" | "cook" | "volunteer",
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-2">
          <Link href="/admin/users" className="text-slate-600 hover:text-slate-900">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Edit User</h1>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* User Info Card */}
        <Card className="mb-6 bg-slate-100">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Name</p>
                <p className="text-lg font-semibold text-slate-900">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">ITS Number</p>
                <p className="text-lg font-semibold text-slate-900">{user.its}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Role</p>
                <p className="text-lg font-semibold text-slate-900 capitalize">
                  {user.role}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Status</p>
                <p className={`text-lg font-semibold ${user.isActive ? "text-green-600" : "text-red-600"}`}>
                  {user.isActive ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <UserForm
          initialData={formInitialData}
          onSubmit={handleFormSubmit}
          onCancel={() => router.back()}
          isEdit={true}
        />

        {/* Additional Actions */}
        <div className="mt-6 space-y-4">
          {/* Reset Password */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Password Management</CardTitle>
              <CardDescription>Reset the user's password</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg" className="h-12">
                    Reset Password
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reset Password for {user.name}</DialogTitle>
                    <DialogDescription>
                      Enter a new password for this user. They will need to use this to log in.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="newPassword" className="text-base font-medium">
                        New Password <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="mt-2 h-12 text-base"
                        disabled={isResettingPassword}
                      />
                      {passwordError && (
                        <p className="mt-1 text-sm text-red-600">{passwordError}</p>
                      )}
                      <p className="mt-2 text-sm text-slate-600">
                        Min 8 chars, 1 uppercase, 1 lowercase, 1 number
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPasswordDialogOpen(false)}
                      disabled={isResettingPassword}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={isResettingPassword}
                    >
                      {isResettingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Delete User */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-lg text-red-900">Danger Zone</CardTitle>
              <CardDescription className="text-red-800">
                Permanently delete this user account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <Button
                  variant="destructive"
                  size="lg"
                  className="h-12"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete User
                </Button>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to permanently delete{" "}
                      <span className="font-semibold">{user.name}</span>? This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
                    ⚠️ This will permanently delete the user account and all associated data.
                  </div>
                  <div className="flex gap-2">
                    <AlertDialogCancel disabled={isDeleting}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
