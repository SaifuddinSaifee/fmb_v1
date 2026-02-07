"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { UserTable } from "@/components/ui/user-table";
import type { UserRecord } from "@/lib/interfaces/user";

type SortBy = "name" | "its" | "createdAt";
type SortOrder = "asc" | "desc";

function UsersListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, admins: 0, cooks: 0, volunteers: 0 });

  // Filters
  const [role, setRole] = useState<string>("all");
  const [isActive, setIsActive] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Check for success message from URL
  useEffect(() => {
    const success = searchParams.get("success");
    if (success === "created") {
      setSuccessMessage("User created successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } else if (success === "updated") {
      setSuccessMessage("User updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  }, [searchParams]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (role !== "all") params.append("role", role);
        if (isActive !== "all") params.append("isActive", isActive);
        params.append("sortBy", sortBy);
        params.append("sortOrder", sortOrder);

        const response = await fetch(`/api/admin/users?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await response.json();
        setUsers(data.users || []);

        // Calculate stats
        const allUsersResponse = await fetch("/api/admin/users");
        if (allUsersResponse.ok) {
          const allData = await allUsersResponse.json();
          const allUsers = allData.users || [];
          setStats({
            total: allUsers.length,
            admins: allUsers.filter((u: UserRecord) => u.role === "admin").length,
            cooks: allUsers.filter((u: UserRecord) => u.role === "cook").length,
            volunteers: allUsers.filter((u: UserRecord) => u.role === "volunteer").length,
          });
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [role, isActive, sortBy, sortOrder]);

  // Filter by search on client side
  const filteredUsers = users.filter((user) => {
    const searchLower = search.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.its.toString().includes(searchLower)
    );
  });

  const handleDelete = async (userId: string, userName: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      setUsers(users.filter((u) => u._id?.toString() !== userId));
      setSuccessMessage(`${userName} has been deleted.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Failed to delete user. Please try again.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleToggleActive = async (
    userId: string,
    userName: string,
    makeActive: boolean
  ) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/activate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: makeActive }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user status");
      }

      setUsers(
        users.map((u) =>
          u._id?.toString() === userId ? { ...u, isActive: makeActive } : u
        )
      );

      const action = makeActive ? "activated" : "deactivated";
      setSuccessMessage(`${userName} has been ${action}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error updating user status:", err);
      setError("Failed to update user status. Please try again.");
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin" className="text-slate-600 hover:text-slate-900">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">Users</h1>
          </div>
          <p className="text-base text-slate-600">
            Manage system users and their roles
          </p>
        </div>
        <Link href="/admin/users/new">
          <Button size="lg" className="h-12 text-base">
            + New User
          </Button>
        </Link>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">
                {stats.total}
              </div>
              <p className="text-sm text-slate-600 mt-2">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {stats.admins}
              </div>
              <p className="text-sm text-slate-600 mt-2">Admins</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {stats.cooks}
              </div>
              <p className="text-sm text-slate-600 mt-2">Cooks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {stats.volunteers}
              </div>
              <p className="text-sm text-slate-600 mt-2">Volunteers</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {/* Search */}
            <div>
              <Label htmlFor="search" className="text-sm font-medium">
                Search by Name or ITS
              </Label>
              <Input
                id="search"
                type="text"
                placeholder="John or 12345"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mt-2 h-10"
              />
            </div>

            {/* Role Filter */}
            <div>
              <Label htmlFor="role" className="text-sm font-medium">
                Role
              </Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role" className="mt-2 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="cook">Cook</SelectItem>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Status Filter */}
            <div>
              <Label htmlFor="isActive" className="text-sm font-medium">
                Status
              </Label>
              <Select value={isActive} onValueChange={setIsActive}>
                <SelectTrigger id="isActive" className="mt-2 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div>
              <Label htmlFor="sort" className="text-sm font-medium">
                Sort By
              </Label>
              <div className="flex gap-2 mt-2">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                  <SelectTrigger className="h-10 flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="its">ITS</SelectItem>
                    <SelectItem value="createdAt">Created</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
                  <SelectTrigger className="h-10 w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">↑ Asc</SelectItem>
                    <SelectItem value="desc">↓ Desc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <UserTable
          users={filteredUsers}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          isLoading={isLoading}
        />
      )}
    </>
  );
}

export default function UsersListPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto w-full max-w-6xl">
        <Suspense fallback={<div className="flex justify-center items-center py-12"><Spinner className="h-8 w-8" /></div>}>
          <UsersListContent />
        </Suspense>
      </div>
    </main>
  );
}
