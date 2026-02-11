"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, FileText, Download, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CartItemsList, type CartItemDisplay } from "@/components/admin/cart-items-list";
import { CartDetailModal } from "@/components/admin/cart-detail-modal";

type WeekPlanDetail = {
  _id: string;
  weekStartDate: string;
  assignedCookId: string;
  days: Array<{
    date: string;
    dayType: string;
    headcount: number;
    menuItems: string[];
    assignedCookId: string | null;
  }>;
  notes?: string;
  createdAt: string;
};

type CartSummary = {
  _id: string;
  weekPlanId: string;
  cookId: string;
  cookName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const dayTypeLabel: Record<string, string> = {
  no_thali: "No thali",
  thali: "Thali",
  jamaat_wide_thali: "Jamaat wide thali",
  miqaat: "Miqaat",
};

export default function AdminWeekPlanDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [plan, setPlan] = useState<WeekPlanDetail | null>(null);
  const [carts, setCarts] = useState<CartSummary[]>([]);
  const [combinedItems, setCombinedItems] = useState<CartItemDisplay[] | null>(null);
  const [cartItemsByCartId, setCartItemsByCartId] = useState<Record<string, CartItemDisplay[]>>({});
  const [loadingCartId, setLoadingCartId] = useState<string | null>(null);
  const [cartTabValue, setCartTabValue] = useState<string>("combined");
  const [viewMoreOpen, setViewMoreOpen] = useState(false);
  const [stores, setStores] = useState<{ _id: string; name: string }[]>([]);
  const [combinedItemsRaw, setCombinedItemsRaw] = useState<Array<{ nameSnapshot: string; quantityRequested: number; unit: string; categorySnapshot?: string; storeIdSnapshot?: string | null }>>([]);
  const [selectedCartId, setSelectedCartId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/week-plans/${id}`);
        if (!res.ok) throw new Error("Failed to fetch week plan");
        const data = await res.json();
        setPlan(data.weekPlan);
      } catch (err) {
        console.error(err);
        setError("Failed to load week plan.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlan();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchCarts = async () => {
      try {
        const res = await fetch(`/api/week-plans/${id}/carts`);
        if (res.ok) {
          const data = await res.json();
          setCarts(data.carts ?? []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCarts();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchCombined = async () => {
      try {
        const res = await fetch(`/api/week-plans/${id}/combined-cart`);
        if (!res.ok) throw new Error("Failed to fetch combined cart");
        const data = await res.json();
        const raw = data.items ?? [];
        setCombinedItemsRaw(
          raw.map((it: { nameSnapshot: string; quantityRequested: number; unit: string; categorySnapshot?: string; storeIdSnapshot?: string | null }) => ({
            nameSnapshot: it.nameSnapshot,
            quantityRequested: it.quantityRequested,
            unit: it.unit,
            categorySnapshot: it.categorySnapshot ?? undefined,
            storeIdSnapshot: it.storeIdSnapshot ?? undefined,
          }))
        );
        setCombinedItems(
          raw.map((it: { nameSnapshot: string; quantityRequested: number; unit: string; categorySnapshot?: string }) => ({
            nameSnapshot: it.nameSnapshot,
            quantityRequested: it.quantityRequested,
            unit: it.unit,
            categorySnapshot: it.categorySnapshot ?? undefined,
          }))
        );
      } catch (err) {
        console.error(err);
        setCombinedItems([]);
        setCombinedItemsRaw([]);
      }
    };
    fetchCombined();
  }, [id]);

  useEffect(() => {
    if (viewMoreOpen && stores.length === 0) {
      fetch("/api/admin/stores")
        .then((res) => (res.ok ? res.json() : { stores: [] }))
        .then((data) => setStores(data.stores ?? []))
        .catch(() => setStores([]));
    }
  }, [viewMoreOpen, stores.length]);

  const requestedCartIdsRef = useRef<Set<string>>(new Set());
  const fetchCartItems = useCallback(async (cartId: string) => {
    if (requestedCartIdsRef.current.has(cartId)) return;
    requestedCartIdsRef.current.add(cartId);
    setLoadingCartId(cartId);
    try {
      const res = await fetch(`/api/carts/${cartId}`);
      if (!res.ok) throw new Error("Failed to fetch cart");
      const data = await res.json();
      const raw = data.items ?? [];
      const items: CartItemDisplay[] = raw.map(
        (it: { nameSnapshot: string; quantityRequested: number; unit: string; categorySnapshot?: string }) => ({
          nameSnapshot: it.nameSnapshot,
          quantityRequested: it.quantityRequested,
          unit: it.unit,
          categorySnapshot: it.categorySnapshot ?? undefined,
        })
      );
      setCartItemsByCartId((prev) => ({ ...prev, [cartId]: items }));
    } catch (err) {
      console.error(err);
      setCartItemsByCartId((prev) => ({ ...prev, [cartId]: [] }));
    } finally {
      setLoadingCartId(null);
    }
  }, []);

  useEffect(() => {
    if (cartTabValue && cartTabValue !== "combined") {
      fetchCartItems(cartTabValue);
    }
  }, [cartTabValue, fetchCartItems]);

  const formatDate = (d: string) =>
    new Date(d).toISOString().slice(0, 10);

  const storeNameById = new Map(stores.map((s) => [s._id, s.name]));
  const downloadCombinedCsv = () => {
    const header = "Name,Category,Store,Quantity,Unit";
    const rows = combinedItemsRaw.map((item) => {
      const storeName = item.storeIdSnapshot ? storeNameById.get(item.storeIdSnapshot) ?? "" : "";
      const name = `"${(item.nameSnapshot ?? "").replace(/"/g, '""')}"`;
      const category = `"${(item.categorySnapshot ?? "").replace(/"/g, '""')}"`;
      const store = `"${storeName.replace(/"/g, '""')}"`;
      return [name, category, store, item.quantityRequested, item.unit].join(",");
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `combined-cart-${id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner className="h-8 w-8" />
      </main>
    );
  }

  if (error || !plan) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <p className="text-red-600">{error ?? "Week plan not found."}</p>
          <Button asChild className="mt-4 h-12">
            <Link href="/admin/week-plans">Back to week plans</Link>
          </Button>
        </div>
      </main>
    );
  }

  const isSingleDay = plan.days.length === 1;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/week-plans" className="h-12 w-12">
              <ChevronLeft className="h-6 w-6" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isSingleDay ? "Single-day plan" : "Week plan"}
            </h1>
            <p className="text-sm text-slate-600">
              {plan.days[0]?.date
                ? new Date(plan.days[0].date + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : formatDate(plan.weekStartDate)}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Days</CardTitle>
              <CardDescription>Day type, headcount, menu, assigned cook</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {plan.days.map((day, i) => (
                  <li
                    key={day.date}
                    className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <span className="font-medium text-slate-900">
                        {new Date(day.date + "T12:00:00").toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <Badge variant="secondary" className="ml-2">
                        {dayTypeLabel[day.dayType] ?? day.dayType}
                      </Badge>
                    </div>
                    {day.dayType !== "no_thali" && (
                      <div className="text-sm text-slate-600">
                        Headcount: {day.headcount}
                        {day.menuItems.length > 0 && (
                          <span className="ml-2">
                            · {day.menuItems.join(", ")}
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Carts</CardTitle>
              <CardDescription>
                One cart per cook; combined view and per-cook tabs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {carts.length === 0 && combinedItems !== null && combinedItems.length === 0 ? (
                <p className="text-sm text-slate-600">No carts created yet. Cooks will create carts when they open &quot;Build cart&quot;.</p>
              ) : (
                <Tabs value={cartTabValue} onValueChange={setCartTabValue} className="w-full">
                  <TabsList className="mb-4 flex w-full flex-wrap gap-1">
                    <TabsTrigger value="combined">Combined cart</TabsTrigger>
                    {carts.map((cart) => (
                      <TabsTrigger key={cart._id} value={cart._id}>
                        {cart.cookName}&apos;s cart
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsContent value="combined" className="mt-0">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <h3 className="mb-3 font-semibold text-slate-900">Combined shopping list</h3>
                      {combinedItems === null ? (
                        <p className="text-sm text-slate-600">Loading…</p>
                      ) : (
                        <CartItemsList
                          items={combinedItems}
                          emptyMessage="No items in any cart yet."
                          itemKeyPrefix="combined"
                        />
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => setViewMoreOpen((v) => !v)}
                      >
                        {viewMoreOpen ? (
                          <>
                            <ChevronUp className="mr-2 h-4 w-4" />
                            View less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-2 h-4 w-4" />
                            View More
                          </>
                        )}
                      </Button>
                      {viewMoreOpen && (
                        <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={downloadCombinedCsv}
                              disabled={combinedItemsRaw.length === 0}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download as CSV
                            </Button>
                            <Button variant="secondary" size="sm" asChild>
                              <Link href={`/admin/week-plans/${id}/combined-pdf?groupBy=category`} target="_blank" rel="noopener noreferrer">
                                <FileText className="mr-2 h-4 w-4" />
                                Download PDF (by category)
                              </Link>
                            </Button>
                            <Button variant="secondary" size="sm" asChild>
                              <Link href={`/admin/week-plans/${id}/combined-pdf?groupBy=store`} target="_blank" rel="noopener noreferrer">
                                <FileText className="mr-2 h-4 w-4" />
                                Download PDF (by store)
                              </Link>
                            </Button>
                          </div>
                          {carts.length > 0 && (
                            <div>
                              <p className="mb-2 text-xs font-medium text-slate-500">Per-cook carts</p>
                              <div className="flex flex-wrap gap-2">
                                {carts.map((cart) => (
                                  <Button
                                    key={cart._id}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedCartId(cart._id);
                                      setModalOpen(true);
                                    }}
                                  >
                                    View {cart.cookName}&apos;s cart
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  {carts.map((cart) => (
                    <TabsContent key={cart._id} value={cart._id} className="mt-0">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="font-semibold text-slate-900">{cart.cookName}&apos;s cart</h3>
                          <Badge
                            variant={
                              cart.status === "submitted"
                                ? "default"
                                : cart.status === "finalized"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {cart.status}
                          </Badge>
                        </div>
                        {loadingCartId === cart._id ? (
                          <p className="text-sm text-slate-600">Loading…</p>
                        ) : (
                          <>
                            <CartItemsList
                              items={cartItemsByCartId[cart._id] ?? []}
                              emptyMessage="No items in this cart yet."
                              itemKeyPrefix={cart._id}
                            />
                            <Link
                              href={`/admin/carts/${cart._id}`}
                              className="mt-3 inline-block text-sm text-primary underline"
                            >
                              View full cart
                            </Link>
                          </>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
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
      </div>
    </main>
  );
}
