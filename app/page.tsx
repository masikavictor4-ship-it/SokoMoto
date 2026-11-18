"use client";
import { useEffect, useState } from "react";
import Link from "next/link";


type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string | null;
  stock: number;
};

export default function HomePage() {

  const [loggedIn, setLoggedIn] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");

  useEffect(() => {
    fetch("/api/me", {
      credentials: "include",
      cache: "no-store",
    })
      .then((response) => setLoggedIn(response.ok))
      .catch(() => setLoggedIn(false));
  }, []);

  function browseProducts() {
    if (loggedIn) {
      window.location.href = "/products";
      return;
    }

    setLoginMessage(
      "Please log in or create an account before browsing products."
    );

    setTimeout(() => {
      window.location.href = "/login?redirect=/products";
    }, 1800);
  }
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
      })
      .catch(() => {});
  }, []);

  const featuredProducts = products.slice(0, 4);

  return (
    <>
      {loginMessage && (
        <div className="fixed left-1/2 top-24 z-[200] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-cyan-400/30 bg-slate-950/95 px-6 py-4 text-center font-bold text-white shadow-2xl backdrop-blur-xl">
          <div className="mb-1 text-lg">🔐 Login required</div>
          <div className="text-sm text-slate-300">{loginMessage}</div>
        </div>
      )}

    <main className="min-h-screen bg-slate-50">
      {/* HERO VIDEO */}
      <section className="relative min-h-[700px] overflow-hidden text-white">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source
            src="/videos/marketplace-hero.mp4"
            type="video/mp4"
          />
        </video>

        {/* Video overlays */}
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-violet-950/90 via-purple-900/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/20" />

        {/* Color glows */}
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-fuchsia-500/25 blur-3xl" />
        <div className="absolute -right-32 bottom-10 h-96 w-96 rounded-full bg-cyan-400/25 blur-3xl" />

        {/* Header */}
        

        {/* Hero content */}
        <div className="relative z-10 mx-auto flex min-h-[620px] max-w-7xl items-center px-5 py-20 sm:px-6">
          <div className="grid w-full items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-black tracking-[0.2em] backdrop-blur-xl">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                WELCOME TO MARKETPLACE
              </div>

              <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                Your world.
                <br />
                Your products.
                <br />
                <span className="bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-transparent">
                  Your marketplace.
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-8 text-white/80 sm:text-xl">
                Discover smartphones, computers, accessories and everyday
                products in one colorful and convenient online marketplace.
              </p>

              <div className="mt-9 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={browseProducts}
                  className="rounded-2xl bg-white px-8 py-4 font-black text-slate-900 shadow-2xl transition duration-300 hover:-translate-y-1 hover:bg-cyan-300"
                >
                  Explore Products →
                </button>

                <Link
                  href="/register"
                  className="rounded-2xl border border-white/30 bg-white/10 px-8 py-4 font-black text-white backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/20"
                >
                  Create Account
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium text-white/75">
                <span>✓ Easy shopping</span>
                <span>✓ Secure accounts</span>
                <span>✓ Easy checkout</span>
                <span>✓ Order tracking</span>
              </div>
            </div>

            {/* Floating category card */}
            <div className="hidden justify-end lg:flex">
              <div className="relative">
                <div className="absolute inset-0 rounded-[3rem] bg-fuchsia-500/30 blur-3xl" />

                <div className="relative w-[390px] rounded-[2rem] border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-white/60">
                        MARKETPLACE
                      </p>
                      <h3 className="mt-1 text-xl font-black">
                        Trending Now
                      </h3>
                    </div>

                    <div className="rounded-xl bg-yellow-300 px-3 py-2 text-xl">
                      🔥
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 p-5 text-center">
                      <div className="text-5xl">📱</div>
                      <p className="mt-3 text-sm font-bold">Smartphones</p>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 p-5 text-center">
                      <div className="text-5xl">💻</div>
                      <p className="mt-3 text-sm font-bold">Computers</p>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 p-5 text-center">
                      <div className="text-5xl">🎧</div>
                      <p className="mt-3 text-sm font-bold">Accessories</p>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 p-5 text-center">
                      <div className="text-5xl">✨</div>
                      <p className="mt-3 text-sm font-bold">Discover</p>
                    </div>
                  </div>

                  <Link
                    href="/products"
                    className="mt-5 block rounded-xl bg-white py-3 text-center font-black text-slate-900 transition hover:bg-cyan-300"
                  >
                    Browse Marketplace
                  </Link>
                </div>

                <div className="absolute -bottom-6 -left-10 rounded-2xl bg-white px-5 py-4 text-slate-900 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                      ✓
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Shopping</p>
                      <p className="text-sm font-black">Made simple</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -right-6 -top-7 flex h-16 w-16 rotate-12 items-center justify-center rounded-2xl bg-yellow-300 text-2xl shadow-xl">
                  ⭐
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-50 to-transparent" />
      </section>

      {/* CATEGORY SECTION */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <p className="text-sm font-black tracking-[0.2em] text-violet-600">
            SHOP BY CATEGORY
          </p>
          <h2 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
            Find what you need
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/products"
            className="group rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-400 p-7 text-white shadow-lg transition hover:-translate-y-2"
          >
            <div className="text-5xl">📱</div>
            <h3 className="mt-5 text-xl font-black">Electronics</h3>
            <p className="mt-2 text-sm text-white/80">
              Smartphones and smart devices.
            </p>
          </Link>

          <Link
            href="/products"
            className="group rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-500 p-7 text-white shadow-lg transition hover:-translate-y-2"
          >
            <div className="text-5xl">💻</div>
            <h3 className="mt-5 text-xl font-black">Computers</h3>
            <p className="mt-2 text-sm text-white/80">
              Laptops and computing essentials.
            </p>
          </Link>

          <Link
            href="/products"
            className="group rounded-3xl bg-gradient-to-br from-orange-500 to-red-500 p-7 text-white shadow-lg transition hover:-translate-y-2"
          >
            <div className="text-5xl">🎧</div>
            <h3 className="mt-5 text-xl font-black">Accessories</h3>
            <p className="mt-2 text-sm text-white/80">
              Useful accessories for everyday life.
            </p>
          </Link>

          <Link
            href="/products"
            className="group rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-400 p-7 text-white shadow-lg transition hover:-translate-y-2"
          >
            <div className="text-5xl">🛍️</div>
            <h3 className="mt-5 text-xl font-black">Everything</h3>
            <p className="mt-2 text-sm text-white/80">
              Explore the complete marketplace.
            </p>
          </Link>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="bg-white px-5 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-black tracking-[0.2em] text-fuchsia-600">
                FEATURED
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
                Popular products
              </h2>
            </div>

            <Link
              href="/products"
              className="font-black text-violet-600 hover:text-fuchsia-600"
            >
              View all products →
            </Link>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl"
                >
                  <div className="relative flex h-56 items-center justify-center overflow-hidden bg-gradient-to-br from-violet-100 via-fuchsia-50 to-cyan-100">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="text-7xl">🛍️</span>
                    )}

                    {product.stock > 0 && (
                      <span className="absolute left-4 top-4 rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-white">
                        IN STOCK
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="truncate text-lg font-black text-slate-900">
                      {product.name}
                    </h3>

                    <p className="mt-2 line-clamp-2 min-h-10 text-sm text-slate-500">
                      {product.description}
                    </p>

                    <div className="mt-5 flex items-center justify-between">
                      <span className="text-xl font-black text-violet-600">
                        KSh {product.price.toLocaleString()}
                      </span>

                      <Link
                        href="/products"
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white transition hover:bg-violet-600"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-3xl border border-dashed border-slate-300 p-12 text-center">
              <div className="text-5xl">🛍️</div>
              <h3 className="mt-4 text-xl font-black">
                Products coming soon
              </h3>
              <p className="mt-2 text-slate-500">
                Check the products page to explore the marketplace.
              </p>
              <button
                type="button"
                onClick={browseProducts}
                className="mt-6 inline-block rounded-xl bg-violet-600 px-6 py-3 font-black text-white"
              >
                Browse Products
              </button>
            </div>
          )}
        </div>
      </section>

      {/* PROMO BANNER */}
      <section className="px-5 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-r from-slate-950 via-violet-950 to-fuchsia-900 p-8 text-white shadow-2xl sm:p-12">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="font-black tracking-[0.2em] text-cyan-300">
                SHOP SMART
              </p>

              <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
                Everything you need,
                <br />
                all in one place.
              </h2>

              <p className="mt-5 max-w-xl leading-7 text-white/70">
                Browse our marketplace, add your favorite products to your
                cart and enjoy a simple checkout experience.
              </p>

              <Link
                href="/products"
                className="mt-7 inline-block rounded-xl bg-white px-7 py-3.5 font-black text-slate-900 transition hover:bg-cyan-300"
              >
                Start Shopping →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl bg-white/10 p-6 backdrop-blur">
                <div className="text-4xl">⚡</div>
                <h3 className="mt-4 font-black">Simple</h3>
                <p className="mt-1 text-sm text-white/60">
                  Easy shopping experience.
                </p>
              </div>

              <div className="rounded-3xl bg-white/10 p-6 backdrop-blur">
                <div className="text-4xl">🔒</div>
                <h3 className="mt-4 font-black">Secure</h3>
                <p className="mt-1 text-sm text-white/60">
                  Your account stays protected.
                </p>
              </div>

              <div className="rounded-3xl bg-white/10 p-6 backdrop-blur">
                <div className="text-4xl">🛒</div>
                <h3 className="mt-4 font-black">Convenient</h3>
                <p className="mt-1 text-sm text-white/60">
                  Add products and checkout easily.
                </p>
              </div>

              <div className="rounded-3xl bg-white/10 p-6 backdrop-blur">
                <div className="text-4xl">📦</div>
                <h3 className="mt-4 font-black">Track Orders</h3>
                <p className="mt-1 text-sm text-white/60">
                  Keep an eye on your purchases.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-slate-950 px-5 py-20 text-center text-white sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="text-5xl">🛍️</div>

          <h2 className="mt-6 text-4xl font-black sm:text-5xl">
            Ready to start shopping?
          </h2>

          <p className="mt-5 text-lg leading-8 text-white/60">
            Discover products, build your cart and enjoy a modern marketplace
            experience.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={browseProducts}
              className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-8 py-4 font-black transition hover:scale-105"
            >
              Explore Products
            </button>

            <Link
              href="/register"
              className="rounded-xl border border-white/20 bg-white/10 px-8 py-4 font-black transition hover:bg-white/20"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black px-5 py-8 text-center text-sm text-white/50">
        <p>
          © {new Date().getFullYear()} MarketPlace. All rights reserved.
        </p>
      </footer>
    </main>
    </>
  );
}
