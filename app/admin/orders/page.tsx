import OrderStatus from "./OrderStatus";
import TrackingLocationForm from "./TrackingLocationForm";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminOrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const orders = await prisma.order.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-2xl font-bold text-green-600">
            SokoMtaani Admin
          </h1>

          <div className="flex flex-wrap gap-3">
            <a
              href="/admin/products"
              className="rounded-lg border px-4 py-2 transition hover:bg-gray-50"
            >
              Products
            </a>

            <a
              href="/admin/users"
              className="rounded-lg border px-4 py-2 transition hover:bg-gray-50"
            >
              Users
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

      <section className="mx-auto max-w-7xl px-6 py-10">
        <h2 className="text-3xl font-bold">
          Customer Orders
        </h2>

        <p className="mt-2 text-gray-600">
          Manage customer orders, payment information, delivery
          status, and delivery tracking.
        </p>

        {orders.length === 0 ? (
          <div className="mt-8 rounded-xl bg-white p-10 text-center shadow">
            <p className="text-gray-600">
              No orders have been placed yet.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl bg-white p-6 shadow"
              >
                <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row">
                  <div>
                    <h3 className="text-xl font-bold">
                      Order #{order.id}
                    </h3>

                    <p className="mt-2 text-gray-700">
                      Customer: {order.user.name}
                    </p>

                    <p className="text-sm text-gray-500">
                      {order.user.email}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {new Date(
                        order.createdAt
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div className="md:text-right">
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">
                      {order.status}
                    </span>

                    <p className="mt-3 text-xl font-bold text-green-600">
                      KSh {order.total.toLocaleString()}
                    </p>

                    <div className="mt-3">
                      <OrderStatus
                        orderId={order.id}
                        currentStatus={order.status}
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="mt-5 rounded-xl border bg-gray-50 p-5">
                  <h4 className="font-semibold">
                    Payment Information
                  </h4>

                  <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                    <p>
                      <span className="font-semibold">
                        Method:
                      </span>{" "}
                      {order.paymentMethod}
                    </p>

                    <p>
                      <span className="font-semibold">
                        Status:
                      </span>{" "}
                      {order.paymentStatus}
                    </p>

                    {order.phoneNumber && (
                      <p>
                        <span className="font-semibold">
                          Phone:
                        </span>{" "}
                        {order.phoneNumber}
                      </p>
                    )}

                    {order.transactionId && (
                      <p>
                        <span className="font-semibold">
                          Transaction:
                        </span>{" "}
                        {order.transactionId}
                      </p>
                    )}
                  </div>
                </div>

                {/* Products */}
                <div className="mt-5">
                  <h4 className="font-semibold">
                    Products
                  </h4>

                  <div className="mt-3 space-y-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
                      >
                        <div>
                          <p className="font-semibold">
                            {item.product.name}
                          </p>

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

                {/* Tracking */}
                <TrackingLocationForm
                  orderId={order.id}
                  initialDeliveryAddress={
                    order.deliveryAddress
                  }
                  initialDeliveryLatitude={
                    order.deliveryLatitude
                  }
                  initialDeliveryLongitude={
                    order.deliveryLongitude
                  }
                  initialCurrentLatitude={
                    order.currentLatitude
                  }
                  initialCurrentLongitude={
                    order.currentLongitude
                  }
                />

                {/* Customer Tracking Link */}
                <div className="mt-5 rounded-lg border border-green-100 bg-green-50 p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-semibold text-green-900">
                        Customer Tracking
                      </p>

                      <p className="text-sm text-green-700">
                        Once coordinates are saved, the customer can
                        track this order on the map.
                      </p>
                    </div>

                    <a
                      href={`/orders/${order.id}/track`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-green-600 px-4 py-2 text-center font-semibold text-white transition hover:bg-green-700"
                    >
                      📍 View Map
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
