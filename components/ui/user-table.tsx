"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Trash2, Edit2, Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserRecord } from "@/lib/interfaces/user";
import { useState } from "react";

interface UserTableProps {
  users: UserRecord[];
  onDelete?: (userId: string, userName: string) => Promise<void>;
  onToggleActive?: (userId: string, userName: string, isActive: boolean) => Promise<void>;
  isLoading?: boolean;
}

const roleColors = {
  admin: "bg-red-100 text-red-800",
  cook: "bg-blue-100 text-blue-800",
  volunteer: "bg-green-100 text-green-800",
};

export function UserTable({
  users,
  onDelete,
  onToggleActive,
  isLoading,
}: UserTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<{
    id: string;
    name: string;
    isActive: boolean;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);

  const handleDeleteClick = (userId: string, userName: string) => {
    setDeleteTarget({ id: userId, name: userName });
    setDeleteDialogOpen(true);
  };

  const handleToggleActiveClick = (
    userId: string,
    userName: string,
    isActive: boolean
  ) => {
    setToggleTarget({ id: userId, name: userName, isActive });
    setToggleDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteTarget.id, deleteTarget.name);
      setDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmToggleActive = async () => {
    if (!toggleTarget || !onToggleActive) return;
    setIsTogglingActive(true);
    try {
      await onToggleActive(toggleTarget.id, toggleTarget.name, toggleTarget.isActive);
      setToggleDialogOpen(false);
    } finally {
      setIsTogglingActive(false);
    }
  };

  if (!users.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">No users found</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold text-slate-700">Name</TableHead>
              <TableHead className="font-semibold text-slate-700">ITS</TableHead>
              <TableHead className="font-semibold text-slate-700">Role</TableHead>
              <TableHead className="font-semibold text-slate-700">Email/Phone</TableHead>
              <TableHead className="font-semibold text-slate-700">Status</TableHead>
              <TableHead className="font-semibold text-slate-700">Created</TableHead>
              <TableHead className="w-12 font-semibold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id?.toString()} className="hover:bg-slate-50">
                <TableCell className="font-medium text-slate-900">
                  {user.name}
                </TableCell>
                <TableCell className="text-slate-600">{user.its}</TableCell>
                <TableCell>
                  <Badge
                    className={roleColors[user.role as keyof typeof roleColors]}
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-600 text-sm">
                  {user.phoneOrEmail || "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={user.isActive ? "default" : "secondary"}
                    className={
                      user.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-600 text-sm">
                  {user.createdAt
                    ? format(new Date(user.createdAt), "MMM dd, yyyy")
                    : "—"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={isLoading}
                      >
                        <span className="sr-only">Open menu</span>
                        <span className="text-lg">⋮</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/admin/users/${user._id?.toString()}/edit`}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit User
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleToggleActiveClick(
                            user._id?.toString() || "",
                            user.name,
                            !user.isActive
                          )
                        }
                        className="flex items-center gap-2"
                      >
                        <Power className="h-4 w-4" />
                        {user.isActive ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleDeleteClick(user._id?.toString() || "", user.name)
                        }
                        className="flex items-center gap-2 text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold">{deleteTarget?.name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
            ⚠️ This will permanently delete the user account.
          </div>
          <div className="flex gap-2">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle Active Confirmation Dialog */}
      <AlertDialog open={toggleDialogOpen} onOpenChange={setToggleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.isActive ? "Deactivate" : "Activate"} User
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.isActive
                ? `Are you sure you want to deactivate ${toggleTarget?.name}? They won't be able to log in.`
                : `Are you sure you want to activate ${toggleTarget?.name}? They will be able to log in.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel disabled={isTogglingActive}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggleActive}
              disabled={isTogglingActive}
            >
              {isTogglingActive ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
