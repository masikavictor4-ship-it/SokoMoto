import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerifiedAt: true,
    },
  });

  if (!account) {
    redirect("/login");
  }

  const emailVerified = Boolean(account.emailVerifiedAt);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50">
      {/* Main navigation is already provided by the global layout.
          Do NOT add SiteNav here or it will appear twice. */}

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 px-6 py-10 text-white shadow-xl sm:px-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-white/10" />

          <div className="relative z-10 max-w-3xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-green-100">
              SokoMtaani Account
            </p>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Welcome back, {account.name || "Customer"} 👋
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-green-50 sm:text-lg">
              Manage your account, explore products, check your orders, and
              continue shopping from your SokoMtaani dashboard.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="rounded-xl bg-white px-5 py-3 font-bold text-green-700 shadow-md transition hover:bg-green-50"
              >
                🛍️ Shop Products
              </Link>

              <Link
                href="/orders"
                className="rounded-xl border border-white/40 bg-white/10 px-5 py-3 font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                📦 My Orders
              </Link>
            </div>
          </div>
        </div>

        {/* Verification */}
        <div className="mt-8">
          <div
            className={`rounded-2xl border p-6 shadow-sm ${
              emailVerified
                ? "border-green-200 bg-green-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl ${
                    emailVerified ? "bg-green-100" : "bg-amber-100"
                  }`}
                >
                  {emailVerified ? "✓" : "✉️"}
                </div>

                <div>
                  <h2
                    className={`text-lg font-bold ${
                      emailVerified
                        ? "text-green-900"
                        : "text-amber-900"
                    }`}
                  >
                    {emailVerified
                      ? "Email Verified"
                      : "Email Verification"}
                  </h2>

                  <p
                    className={`mt-1 text-sm ${
                      emailVerified
                        ? "text-green-700"
                        : "text-amber-700"
                    }`}
                  >
                    {emailVerified
                      ? "Your email address has been successfully verified."
                      : "Verification is optional. You can continue shopping and checkout without verifying your email."}
                  </p>

                  <p className="mt-2 text-sm font-medium text-slate-600">
                    {account.email}
                  </p>
                </div>
              </div>

              {!emailVerified && (
                <Link
                  href="/verify-email"
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-amber-500 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-amber-600"
                >
                  Verify Email →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Quick Actions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Everything you need is just one click away.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/products"
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl transition group-hover:scale-110">
                🛍️
              </div>

              <h3 className="font-bold text-slate-900">Browse Products</h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Discover products available on SokoMtaani.
              </p>

              <span className="mt-4 inline-block text-sm font-bold text-green-600">
                Shop now →
              </span>
            </Link>

            <Link
              href="/cart"
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl transition group-hover:scale-110">
                🛒
              </div>

              <h3 className="font-bold text-slate-900">Shopping Cart</h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                View products you have added to your cart.
              </p>

              <span className="mt-4 inline-block text-sm font-bold text-blue-600">
                Open cart →
              </span>
            </Link>

            <Link
              href="/orders"
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-2xl transition group-hover:scale-110">
                📦
              </div>

              <h3 className="font-bold text-slate-900">My Orders</h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Track and review your previous orders.
              </p>

              <span className="mt-4 inline-block text-sm font-bold text-purple-600">
                View orders →
              </span>
            </Link>

            <Link
              href="/account"
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-2xl transition group-hover:scale-110">
                👤
              </div>

              <h3 className="font-bold text-slate-900">My Account</h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Manage your personal account information.
              </p>

              <span className="mt-4 inline-block text-sm font-bold text-orange-600">
                Account settings →
              </span>
            </Link>
          </div>
        </section>

        {/* Account Information */}
        <section className="mt-10">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  Account Information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your current SokoMtaani account details.
                </p>
              </div>

              <div
                className={`rounded-full px-4 py-2 text-xs font-bold ${
                  account.status === "ACTIVE"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {account.status}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Name
                </p>

                <p className="mt-2 font-bold text-slate-900">
                  {account.name || "Not provided"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Email
                </p>

                <p className="mt-2 break-all font-bold text-slate-900">
                  {account.email}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Account Type
                </p>

                <p className="mt-2 font-bold capitalize text-slate-900">
                  {account.role.toLowerCase()}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Email Status
                </p>

                <p
                  className={`mt-2 font-bold ${
                    emailVerified
                      ? "text-green-600"
                      : "text-amber-600"
                  }`}
                >
                  {emailVerified ? "Verified" : "Not Verified"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom message */}
        <div className="mt-8 rounded-2xl border border-green-100 bg-green-50 p-5 text-center">
          <p className="text-sm font-medium text-green-800">
            Thank you for using SokoMtaani. Happy shopping! 🛒
          </p>
        </div>
      </section>
    </main>
  );
}
