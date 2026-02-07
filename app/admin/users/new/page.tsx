"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { UserForm } from "@/components/ui/user-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import type { UserFormData } from "@/components/ui/user-form";

export default function CreateUserPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: UserFormData) => {
    try {
      setError(null);
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          throw new Error("ITS number already exists");
        }
        throw new Error(errorData.error || "Failed to create user");
      }

      router.push("/admin/users?success=created");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create user";
      setError(message);
      throw err; // Re-throw to let the form handle it
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-2">
          <Link href="/admin/users" className="text-slate-600 hover:text-slate-900">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Create New User</h1>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <UserForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isEdit={false}
        />
      </div>
    </main>
  );
}
