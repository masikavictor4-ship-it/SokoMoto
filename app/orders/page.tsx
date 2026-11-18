"use client";

import { useEffect, useState } from "react";

type OrderItem = {
  id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
    image: string | null;
  };
};

type Order = {
  id: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  transactionId: string | null;
  phoneNumber: string | null;
  total: number;
  createdAt: string;
  items: OrderItem[];
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/orders", {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load orders.");
        }

        return data;
      })
      .then((data) => {
        setOrders(data);
      })
      .catch((error) => {
        setMessage(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-2xl font-bold text-green-600">
            MarketPlace
          </h1>

          <div className="flex flex-wrap gap-3">
            <a
              href="/"
              className="rounded-lg border px-4 py-2 transition hover:bg-gray-50"
            >
              Home
            </a>

            <a
              href="/products"
              className="rounded-lg border px-4 py-2 transition hover:bg-gray-50"
            >
              Products
            </a>

            <a
              href="/cart"
              className="rounded-lg border px-4 py-2 transition hover:bg-gray-50"
            >
              Cart
            </a>

            <a
              href="/dashboard"
              className="rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
            >
              Dashboard
            </a>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="text-3xl font-bold">
          My Orders
        </h2>

        <p className="mt-2 text-gray-600">
          View your marketplace orders, payment status, and delivery
          tracking.
        </p>

        {message && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-600">
            {message}
          </div>
        )}

        {loading ? (
          <p className="mt-8">Loading orders...</p>
        ) : orders.length === 0 ? (
          <div className="mt-8 rounded-xl bg-white p-10 text-center shadow">
            <h3 className="text-xl font-semibold">
              No orders yet
            </h3>

            <p className="mt-2 text-gray-600">
              Your completed checkout orders will appear here.
            </p>

            <a
              href="/products"
              className="mt-6 inline-block rounded-lg bg-green-600 px-6 py-3 text-white transition hover:bg-green-700"
            >
              Browse Products
            </a>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl bg-white p-6 shadow"
              >
                <div className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row">
                  <div>
                    <h3 className="text-xl font-bold">
                      Order #{order.id}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {new Date(
                        order.createdAt
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        order.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-700"
                          : order.status === "PROCESSING"
                          ? "bg-green-100 text-green-700"
                          : order.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {order.status}
                    </span>

                    <p className="mt-2 text-xl font-bold text-green-600">
                      KSh {order.total.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Track Order */}
                <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <h4 className="font-bold text-blue-900">
                        Delivery Tracking
                      </h4>

                      <p className="mt-1 text-sm text-blue-700">
                        Track the delivery location of this order on the
                        map.
                      </p>
                    </div>

                    <a
                      href={`/orders/${order.id}/track`}
                      className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                    >
                      📍 Track Order
                    </a>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="mt-5 rounded-lg border bg-gray-50 p-4">
                  <h4 className="font-semibold">
                    Payment Information
                  </h4>

                  <div className="mt-3 space-y-2 text-sm">
                    <p>
                      <span className="font-semibold">
                        Payment Method:
                      </span>{" "}
                      {order.paymentMethod}
                    </p>

                    <p>
                      <span className="font-semibold">
                        Payment Status:
                      </span>{" "}
                      <span
                        className={
                          order.paymentStatus === "PAID"
                            ? "font-semibold text-green-600"
                            : "font-semibold text-yellow-600"
                        }
                      >
                        {order.paymentStatus}
                      </span>
                    </p>

                    {order.phoneNumber && (
                      <p>
                        <span className="font-semibold">
                          M-Pesa Number:
                        </span>{" "}
                        {order.phoneNumber}
                      </p>
                    )}

                    {order.transactionId && (
                      <p>
                        <span className="font-semibold">
                          Transaction ID:
                        </span>{" "}
                        {order.transactionId}
                      </p>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="mt-5 space-y-4">
                  <h4 className="font-semibold">
                    Order Items
                  </h4>

                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between border-b pb-4 last:border-b-0 last:pb-0"
                    >
                      <div>
                        <h4 className="font-semibold">
                          {item.product.name}
                        </h4>

                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity}
                        </p>
                      </div>

                      <p className="font-semibold">
                        KSh{" "}
                        {(
                          item.price * item.quantity
                        ).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
