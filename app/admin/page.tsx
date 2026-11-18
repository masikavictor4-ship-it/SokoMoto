import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [
    totalUsers,
    totalProducts,
    totalOrders,
    pendingOrders,
    paidOrders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.count({
      where: {
        status: "PENDING",
      },
    }),
    prisma.order.count({
      where: {
        paymentStatus: "PAID",
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10">
          <p className="text-sm font-semibold text-violet-600">
            MARKETPLACE ADMINISTRATION
          </p>

          <h1 className="mt-2 text-4xl font-bold text-gray-900">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-gray-600">
            Welcome, {user.name}. Manage your marketplace from here.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard title="Users" value={totalUsers} />
          <StatCard title="Products" value={totalProducts} />
          <StatCard title="Orders" value={totalOrders} />
          <StatCard title="Pending" value={pendingOrders} />
          <StatCard title="Paid Orders" value={paidOrders} />
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <AdminCard
            title="Users"
            description="View users, change roles and manage customer accounts."
            href="/admin/users"
            button="Manage Users"
          />

          <AdminCard
            title="Products"
            description="Add, edit and manage marketplace products."
            href="/admin/products"
            button="Manage Products"
          />

          <AdminCard
            title="Orders"
            description="View customer orders and update order status."
            href="/admin/orders"
            button="Manage Orders"
          />

          <AdminCard
            title="Store"
            description="Open the customer-facing marketplace."
            href="/products"
            button="View Store"
          />
        </div>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <p className="text-sm font-medium text-gray-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function AdminCard({
  title,
  description,
  href,
  button,
}: {
  title: string;
  description: string;
  href: string;
  button: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <h2 className="text-xl font-bold text-gray-900">
        {title}
      </h2>

      <p className="mt-2 min-h-12 text-sm text-gray-600">
        {description}
      </p>

      <Link
        href={href}
        className="mt-5 inline-block rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700"
      >
        {button}
      </Link>
    </div>
  );
}
