"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const OrderTrackingMap = dynamic(
  () => import("@/app/components/OrderTrackingMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[450px] items-center justify-center rounded-2xl bg-slate-100">
        <div className="text-center">
          <div className="text-4xl">🗺️</div>
          <p className="mt-2 font-semibold text-slate-600">
            Loading map...
          </p>
        </div>
      </div>
    ),
  }
);

type Order = {
  id: number;
  userId: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
  deliveryAddress: string | null;
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
  currentLatitude: number | null;
  currentLongitude: number | null;
};

export default function TrackOrderPage() {
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrder = useCallback(async () => {
    if (!id) {
      return;
    }

    try {
      const response = await fetch(
        `/api/orders/${id}/tracking`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load order."
        );
      }

      setOrder(data.order);
      setError("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load order."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();

    const interval = window.setInterval(
      loadOrder,
      30000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [loadOrder]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-5xl text-center">
          <div className="text-5xl">📦</div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Loading order tracking...
          </h1>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-lg rounded-3xl bg-white p-8 text-center shadow-lg">
          <div className="text-5xl">⚠️</div>

          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Unable to load tracking
          </h1>

          <p className="mt-3 text-slate-600">
            {error || "Order not found."}
          </p>

          <Link
            href="/orders"
            className="mt-6 inline-flex rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
          >
            Back to Orders
          </Link>
        </div>
      </main>
    );
  }

  const hasDestination =
    typeof order.deliveryLatitude === "number" &&
    typeof order.deliveryLongitude === "number";

  const hasCurrentLocation =
    typeof order.currentLatitude === "number" &&
    typeof order.currentLongitude === "number";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/orders"
              className="text-sm font-semibold text-green-600 hover:text-green-700"
            >
              ← Back to Orders
            </Link>

            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
              Track Order #{order.id}
            </h1>

            <p className="mt-1 text-slate-500">
              Your order location updates automatically.
            </p>
          </div>

          <div className="rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700">
            {order.status}
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Order Total
            </p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              KSh {order.total.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Payment
            </p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {order.paymentStatus}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Delivery
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {order.deliveryAddress ||
                "Address not provided"}
            </p>
          </div>
        </div>

        {!hasDestination ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <div className="text-6xl">📍</div>

            <h2 className="mt-4 text-2xl font-bold text-slate-900">
              Delivery location not set yet
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-slate-500">
              Your delivery location will appear here once
              the order has been assigned a destination.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl bg-white p-3 shadow-xl ring-1 ring-slate-200">
            <OrderTrackingMap
              deliveryLatitude={
                order.deliveryLatitude!
              }
              deliveryLongitude={
                order.deliveryLongitude!
              }
              currentLatitude={
                order.currentLatitude
              }
              currentLongitude={
                order.currentLongitude
              }
            />
          </div>
        )}

        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                Tracking Status
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {hasCurrentLocation
                  ? "Your order currently has a tracking location."
                  : "Waiting for the order's current location."}
              </p>
            </div>

            <span className="text-sm text-slate-400">
              Updates every 30 seconds
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
