"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
const DeliveryLocationPicker =
  dynamic(
    () =>
      import(
        "@/app/components/DeliveryLocationPicker"
      ),
    {
      ssr: false,
    }
  );

type CartItem = {
  id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    image: string | null;
  };
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [deliveryLocation, setDeliveryLocation] =
    useState<{
      address: string;
      latitude: number | null;
      longitude: number | null;
    }>({
      address: "",
      latitude: null,
      longitude: null,
    });

  async function loadCart() {
    try {
      setLoading(true);

      const response = await fetch("/api/cart", {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load cart.");
      }

      setItems(data.items || data);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load cart."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCart();
  }, []);

  async function updateQuantity(
    itemId: number,
    quantity: number
  ) {
    if (quantity < 1) {
      await removeItem(itemId);
      return;
    }

    try {
      setMessage("");

      const response = await fetch("/api/cart", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: itemId,
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not update quantity."
        );
      }

      await loadCart();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not update quantity."
      );
    }
  }

  async function removeItem(itemId: number) {
    try {
      setMessage("");

      const response = await fetch("/api/cart", {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: itemId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not remove item."
        );
      }

      await loadCart();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not remove item."
      );
    }
  }

  async function checkout() {
    if (!deliveryLocation.address.trim()) {
      setMessage(
        "Please enter your delivery address."
      );
      return;
    }

    if (
      typeof deliveryLocation.latitude !== "number" ||
      typeof deliveryLocation.longitude !== "number"
    ) {
      setMessage(
        "Please select your delivery location on the map."
      );
      return;
    }

    if (!phone.trim()) {
      setMessage("Please enter your M-Pesa phone number.");
      return;
    }

    const validPhone = /^(\+254|254|0)(7|1)\d{8}$/;

    if (!validPhone.test(phone.trim())) {
      setMessage(
        "Enter a valid Kenyan phone number, e.g. 0712345678."
      );
      return;
    }

    if (items.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }

    try {
      setCheckoutLoading(true);
      setMessage("");

      const response = await fetch("/api/checkout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: phone.trim(),
          deliveryAddress:
            deliveryLocation.address.trim(),
          deliveryLatitude:
            deliveryLocation.latitude,
          deliveryLongitude:
            deliveryLocation.longitude,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Checkout could not be completed."
        );
      }

      setMessage(
        data.message ||
          "Checkout started successfully. Check your phone for the M-Pesa prompt."
      );

      await loadCart();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Checkout could not be completed."
      );
    } finally {
      setCheckoutLoading(false);
    }
  }

  const total = items.reduce(
    (sum, item) =>
      sum + item.product.price * item.quantity,
    0
  );

  const totalItems = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-violet-400" />
            <p className="mt-5 text-slate-300">
              Loading your cart...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-lg font-black text-white shadow-lg shadow-fuchsia-500/20">
              M
            </div>

            <div>
              <div className="text-xl font-black tracking-tight text-white">
                Market<span className="text-cyan-400">Place</span>
              </div>

              <p className="hidden text-xs text-slate-400 sm:block">
                Shop smarter. Live better.
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white sm:block"
            >
              Home
            </Link>

            <Link
              href="/products"
              className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white sm:px-4"
            >
              Products
            </Link>

            <Link
              href="/orders"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white sm:block"
            >
              Orders
            </Link>

            <Link
              href="/cart"
              className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/20"
            >
              🛒 Cart
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-slate-950 via-violet-950/60 to-slate-950">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-6">
          <p className="font-bold uppercase tracking-[0.25em] text-cyan-400">
            Shopping cart
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Your cart,
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              {" "}your choice.
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Review your products, adjust quantities and
            checkout securely using M-Pesa.
          </p>
        </div>
      </section>

      <section className="bg-slate-100">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:py-14">
          {message && (
            <div className="mb-8 rounded-2xl border border-violet-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                  !
                </div>

                <p className="pt-1 text-sm font-semibold text-slate-700">
                  {message}
                </p>
              </div>
            </div>
          )}

          {items.length === 0 ? (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
              <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 px-6 py-16 text-center text-white">
                <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-cyan-400/20 blur-2xl" />

                <div className="relative">
                  <div className="text-7xl">🛒</div>

                  <h2 className="mt-6 text-3xl font-black">
                    Your cart is empty
                  </h2>

                  <p className="mx-auto mt-3 max-w-md text-white/80">
                    Discover something you love and add it
                    to your cart.
                  </p>

                  <Link
                    href="/products"
                    className="mt-8 inline-flex rounded-2xl bg-white px-7 py-3.5 font-bold text-violet-700 shadow-xl transition hover:-translate-y-0.5"
                  >
                    Explore Products →
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_390px]">
              {/* Cart items */}
              <div>
                <div className="mb-5 flex items-end justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">
                      Shopping Cart
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {totalItems} item
                      {totalItems !== 1 ? "s" : ""} in your cart
                    </p>
                  </div>

                  <Link
                    href="/products"
                    className="text-sm font-bold text-violet-600 transition hover:text-fuchsia-600"
                  >
                    ← Continue shopping
                  </Link>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => (
                    <article
                      key={item.id}
                      className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                    >
                      <div className="flex flex-col sm:flex-row">
                        {/* Image */}
                        <div
                          className={`relative flex h-48 shrink-0 items-center justify-center overflow-hidden sm:h-auto sm:w-52 ${
                            index % 3 === 0
                              ? "bg-gradient-to-br from-violet-600 to-fuchsia-500"
                              : index % 3 === 1
                              ? "bg-gradient-to-br from-cyan-500 to-blue-600"
                              : "bg-gradient-to-br from-orange-400 to-pink-500"
                          }`}
                        >
                          {item.product.image ? (
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <span className="text-6xl">
                              📦
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
                          <div>
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="text-xl font-black text-slate-900">
                                  {item.product.name}
                                </h3>

                                <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                                  {item.product.description}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeItem(item.id)
                                }
                                className="rounded-xl px-3 py-2 text-sm font-bold text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                              >
                                Remove
                              </button>
                            </div>

                            <div className="mt-5 flex flex-wrap items-center gap-3">
                              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                                KSh{" "}
                                {item.product.price.toLocaleString()}{" "}
                                each
                              </span>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ${
                                  item.product.stock > 0
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-red-50 text-red-600"
                                }`}
                              >
                                {item.product.stock > 0
                                  ? `${item.product.stock} available`
                                  : "Out of stock"}
                              </span>
                            </div>
                          </div>

                          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                            {/* Quantity */}
                            <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    item.quantity - 1
                                  )
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold text-slate-600 transition hover:bg-white hover:text-violet-600"
                              >
                                −
                              </button>

                              <span className="flex h-10 min-w-12 items-center justify-center px-2 font-black text-slate-900">
                                {item.quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    item.quantity + 1
                                  )
                                }
                                disabled={
                                  item.quantity >=
                                  item.product.stock
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold text-slate-600 transition hover:bg-white hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                +
                              </button>
                            </div>

                            <div className="text-right">
                              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Subtotal
                              </p>

                              <p className="mt-1 text-2xl font-black text-slate-900">
                                KSh{" "}
                                {(
                                  item.product.price *
                                  item.quantity
                                ).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              {/* Checkout */}
              <aside className="lg:sticky lg:top-24 lg:self-start">
                <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
                  <div className="bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 p-6 text-white">
                    <p className="text-sm font-bold uppercase tracking-wider text-white/70">
                      Order summary
                    </p>

                    <h2 className="mt-2 text-2xl font-black">
                      Checkout
                    </h2>

                    <p className="mt-1 text-sm text-white/75">
                      Fast and secure M-Pesa payment.
                    </p>
                  </div>

                  <div className="p-6">
                    <div className="space-y-4 border-b border-slate-200 pb-5">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">
                          Items
                        </span>
                        <span className="font-bold text-slate-900">
                          {totalItems}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">
                          Delivery
                        </span>
                        <span className="font-bold text-emerald-600">
                          Available
                        </span>
                      </div>
                    </div>

                    <div className="flex items-end justify-between py-5">
                      <span className="font-bold text-slate-600">
                        Total
                      </span>

                      <span className="text-3xl font-black text-slate-900">
                        KSh {total.toLocaleString()}
                      </span>
                    </div>

                    <div className="rounded-2xl bg-emerald-50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-xl text-white">
                          M
                        </div>

                        <div>
                          <p className="font-black text-emerald-900">
                            Pay with M-Pesa
                          </p>

                          <p className="text-xs text-emerald-700">
                            You will receive an STK prompt.
                          </p>
                        </div>
                      </div>
                    </div>

                    <DeliveryLocationPicker
                      value={deliveryLocation}
                      onChange={setDeliveryLocation}
                    />

                    <label className="mt-6 block">
                      <span className="mb-2 block text-sm font-bold text-slate-700">
                        M-Pesa phone number
                      </span>

                      <input
                        type="tel"
                        value={phone}
                        onChange={(event) =>
                          setPhone(event.target.value)
                        }
                        placeholder="0712345678"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                      />

                      <span className="mt-2 block text-xs text-slate-400">
                        Use a Safaricom number registered for
                        M-Pesa.
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={checkout}
                      disabled={checkoutLoading}
                      className="mt-5 w-full rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 px-5 py-4 font-black text-white shadow-lg shadow-fuchsia-500/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {checkoutLoading
                        ? "Processing..."
                        : `Pay KSh ${total.toLocaleString()} →`}
                    </button>

                    <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div>🔒</div>
                        <p className="mt-1 text-[10px] font-bold text-slate-500">
                          Secure
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <div>📱</div>
                        <p className="mt-1 text-[10px] font-bold text-slate-500">
                          M-Pesa
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <div>⚡</div>
                        <p className="mt-1 text-[10px] font-bold text-slate-500">
                          Fast
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 px-5 py-10 text-slate-400 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="text-lg font-black text-white">
              Market<span className="text-cyan-400">Place</span>
            </div>

            <p className="mt-1 text-sm">
              Shop smarter. Live better.
            </p>
          </div>

          <div className="flex gap-5 text-sm">
            <Link
              href="/"
              className="transition hover:text-white"
            >
              Home
            </Link>

            <Link
              href="/products"
              className="transition hover:text-white"
            >
              Products
            </Link>

            <Link
              href="/login"
              className="transition hover:text-white"
            >
              Login
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-7xl border-t border-white/10 pt-6 text-center text-xs">
          © 2026 SokoMtaani. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
