"use client";

import { useEffect, useState, Fragment } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { CartDetailModal } from "@/components/admin/cart-detail-modal";

type CartRow = {
  _id: string;
  weekPlanId: string;
  cookId: string;
  cookName: string;
  status: string;
  weekStartDate: string | null;
  weekLabel: string | null;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export default function AdminCartsPage() {
  const [carts, setCarts] = useState<CartRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCartId, setSelectedCartId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchCarts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/carts");
        if (!res.ok) throw new Error("Failed to fetch carts");
        const data = await res.json();
        setCarts(data.carts ?? []);
      } catch (err) {
        console.error(err);
        setError("Failed to load carts.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCarts();
  }, []);

  // Group by week; sort groups by most recent cart in that week
  const groupsByWeek = carts.reduce<Record<string, CartRow[]>>((acc, cart) => {
    const key = cart.weekPlanId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(cart);
    return acc;
  }, {});
  const weekIds = Object.keys(groupsByWeek).sort((a, b) => {
    const aMax = Math.max(...groupsByWeek[a].map((c) => new Date(c.updatedAt).getTime()));
    const bMax = Math.max(...groupsByWeek[b].map((c) => new Date(c.updatedAt).getTime()));
    return bMax - aMax;
  });

  function combinedCartNote(cooks: CartRow[]): string {
    if (cooks.length <= 1) return "";
    const names = cooks.map((c) => c.cookName);
    if (names.length === 2) return `Combined cart of ${names[0]} and ${names[1]}`;
    return `Combined cart of ${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner className="h-8 w-8" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <p className="text-red-600">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Carts</h1>
          <p className="mt-1 text-sm text-slate-600">
            Current and historical carts from all cooks
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All carts</CardTitle>
            <CardDescription>
              Click a row to view cart details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {carts.length === 0 ? (
              <p className="text-sm text-slate-600">No carts yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="pb-2 pr-4 font-medium">Week</th>
                      <th className="pb-2 pr-4 font-medium">Cook</th>
                      <th className="pb-2 pr-4 font-medium">Items</th>
                      <th className="pb-2 font-medium">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weekIds.map((weekPlanId) => {
                      const weekCarts = groupsByWeek[weekPlanId];
                      const note = combinedCartNote(weekCarts);
                      const hasMultipleCooks = weekCarts.length > 1;
                      return (
                        <Fragment key={weekPlanId}>
                          {hasMultipleCooks && (
                            <tr key={`note-${weekPlanId}`} className="border-b border-slate-100 bg-slate-50/80">
                              <td colSpan={4} className="py-2 pr-4 text-slate-700">
                                <span className="font-medium">{note}.</span>{" "}
                                <Link
                                  href={`/admin/week-plans/${weekPlanId}`}
                                  className="text-primary underline hover:no-underline"
                                >
                                  View combined cart &amp; per-cook tabs
                                </Link>
                              </td>
                            </tr>
                          )}
                          {weekCarts.map((cart) => (
                            <tr
                              key={cart._id}
                              role="button"
                              tabIndex={0}
                              className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50"
                              onClick={() => {
                                setSelectedCartId(cart._id);
                                setModalOpen(true);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setSelectedCartId(cart._id);
                                  setModalOpen(true);
                                }
                              }}
                            >
                              <td className="py-3 pr-4 text-slate-800">
                                {cart.weekLabel ?? cart.weekStartDate ?? "—"}
                              </td>
                              <td className="py-3 pr-4 font-medium text-slate-900">
                                {cart.cookName}
                              </td>
                              <td className="py-3 pr-4 text-slate-600">{cart.itemCount}</td>
                              <td className="py-3 text-slate-600">
                                {new Date(cart.updatedAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </td>
                            </tr>
                          ))}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <CartDetailModal
          open={modalOpen}
          onOpenChange={(open) => {
            setModalOpen(open);
            if (!open) setSelectedCartId(null);
          }}
          cartId={selectedCartId}
        />
      </div>
    </main>
  );
}
