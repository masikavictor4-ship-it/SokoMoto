"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ProductVideo = {
  id: number;
  url: string;
  createdAt: string;
};

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string | null;
  videos: ProductVideo[];
};

type Slide = {
  id: string;
  productId: number;
  productName: string;
  description: string;
  price: number;
  type: "image" | "video";
  url: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  async function loadProducts() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/products");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load products."
        );
      }

      setProducts(data);
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load products."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function addToCart(product: Product) {
    try {
      setMessage("");

      if (product.stock < 1) {
        setMessage(`${product.name} is out of stock.`);
        return;
      }

      const response = await fetch("/api/cart", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not add product to cart."
        );
      }

      setMessage(
        `✓ ${product.name} added to your cart.`
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Could not add product to cart."
      );
    }
  }

  const filteredProducts = products.filter((product) => {
    const searchText = search.toLowerCase().trim();

    if (!searchText) {
      return true;
    }

    return (
      product.name
        .toLowerCase()
        .includes(searchText) ||
      product.description
        .toLowerCase()
        .includes(searchText)
    );
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="flex min-h-[75vh] items-center justify-center px-5">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-white/10 border-t-cyan-400" />

            <h2 className="mt-6 text-2xl font-black">
              Loading Marketplace
            </h2>

            <p className="mt-2 text-white/50">
              Finding the latest products for you...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">

      {/* =====================================================
          PRODUCT MEDIA HERO SLIDESHOW
          Pictures + Videos
      ===================================================== */}

      <ProductHeroSlider products={products} />

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <section className="relative z-10 -mt-7 px-5 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl">
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl">
                🔎
              </span>

              <input
                type="text"
                placeholder="Search smartphones, laptops, accessories..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                className="w-full rounded-2xl bg-slate-100 py-4 pl-14 pr-5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PRODUCTS
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6">

        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-black tracking-[0.2em] text-violet-600">
              MARKETPLACE
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
              Available Products
            </h2>

            <p className="mt-2 text-slate-500">
              {filteredProducts.length} product
              {filteredProducts.length !== 1
                ? "s"
                : ""}{" "}
              available
            </p>
          </div>

          <Link
            href="/cart"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-600"
          >
            🛒 View Cart
          </Link>
        </div>

        {message && (
          <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-cyan-50 px-5 py-4 text-sm font-bold text-violet-900 sm:flex-row sm:items-center sm:justify-between">
            <span>{message}</span>

            <Link
              href="/cart"
              className="font-black text-fuchsia-600 hover:text-violet-700"
            >
              View Cart →
            </Link>
          </div>
        )}

        {products.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-16 text-center shadow-sm">
            <div className="text-6xl">📦</div>

            <h2 className="mt-5 text-2xl font-black text-slate-900">
              No products available
            </h2>

            <p className="mt-2 text-slate-500">
              There are currently no products in the marketplace.
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-16 text-center shadow-sm">
            <div className="text-6xl">🔎</div>

            <h2 className="mt-5 text-2xl font-black text-slate-900">
              No matching products
            </h2>

            <p className="mt-2 text-slate-500">
              Try searching with a different product name.
            </p>

            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-6 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 font-black text-white shadow-lg transition hover:-translate-y-0.5"
            >
              Show All Products
            </button>
          </div>
        ) : (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            {filteredProducts.map((product, index) => (
              <article
                key={product.id}
                className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition duration-500 hover:-translate-y-2 hover:shadow-2xl"
              >

                <div
                  className={`relative flex h-64 items-center justify-center overflow-hidden ${
                    index % 4 === 0
                      ? "bg-gradient-to-br from-cyan-100 to-blue-100"
                      : index % 4 === 1
                        ? "bg-gradient-to-br from-violet-100 to-fuchsia-100"
                        : index % 4 === 2
                          ? "bg-gradient-to-br from-orange-100 to-red-100"
                          : "bg-gradient-to-br from-emerald-100 to-teal-100"
                  }`}
                >

                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="text-7xl transition duration-500 group-hover:scale-110">
                        📦
                      </div>

                      <p className="mt-3 text-sm font-bold text-slate-400">
                        No image available
                      </p>
                    </div>
                  )}

                  <div className="absolute left-4 top-4">

                    {product.stock > 0 ? (
                      <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-black text-emerald-700 shadow-lg backdrop-blur">
                        ✓ In Stock
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-black text-white shadow-lg">
                        Sold Out
                      </span>
                    )}

                  </div>

                  {product.videos?.length > 0 && (
                    <div className="absolute bottom-4 left-4 rounded-full bg-black/70 px-3 py-1.5 text-xs font-black text-white backdrop-blur">
                      🎥 {product.videos.length} video
                      {product.videos.length !== 1 ? "s" : ""}
                    </div>
                  )}

                  <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/70 text-xs font-black text-white backdrop-blur">
                    #{index + 1}
                  </div>
                </div>

                <div className="p-6">

                  <h3 className="text-xl font-black text-slate-900">
                    {product.name}
                  </h3>

                  <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-500">
                    {product.description}
                  </p>

                  <div className="mt-5">

                    <p className="text-xs font-black tracking-[0.15em] text-slate-400">
                      PRICE
                    </p>

                    <p className="mt-1 text-2xl font-black text-violet-600">
                      KSh{" "}
                      {product.price.toLocaleString()}
                    </p>

                  </div>

                  <div className="mt-3 text-sm font-semibold text-slate-500">
                    {product.stock > 0
                      ? `${product.stock} available`
                      : "Currently unavailable"}
                  </div>

                  <div className="mt-6 grid gap-3">

                    <Link
                      href={`/products/${product.id}`}
                      className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-black text-slate-900 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                    >
                      View Product →
                    </Link>

                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      disabled={product.stock < 1}
                      className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                    >
                      {product.stock > 0
                        ? "🛒 Add to Cart"
                        : "Sold Out"}
                    </button>

                  </div>
                </div>

              </article>
            ))}

          </div>
        )}

      </section>
    </main>
  );
}


/* ============================================================
   PRODUCT HERO SLIDESHOW
   Supports:
   - Images
   - MP4 videos
   - Automatic slideshow
   - Previous / Next
   - Dots
============================================================ */

function ProductHeroSlider({
  products,
}: {
  products: Product[];
}) {

  const [activeSlide, setActiveSlide] = useState(0);

  /*
   * Convert products into slideshow media.
   *
   * Example:
   *
   * Product A image
   * Product A video
   * Product A video
   * Product B image
   * Product B video
   */

  const slides = useMemo<Slide[]>(() => {
    const result: Slide[] = [];

    for (const product of products) {

      if (product.image) {
        result.push({
          id: `image-${product.id}`,
          productId: product.id,
          productName: product.name,
          description: product.description,
          price: product.price,
          type: "image",
          url: product.image,
        });
      }

      if (product.videos) {
        for (const video of product.videos) {
          result.push({
            id: `video-${video.id}`,
            productId: product.id,
            productName: product.name,
            description: product.description,
            price: product.price,
            type: "video",
            url: video.url,
          });
        }
      }
    }

    return result;
  }, [products]);

  /*
   * Automatically move to the next slide.
   *
   * 5 seconds per slide.
   */

  useEffect(() => {

    if (slides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {

      setActiveSlide((current) => {
        return (current + 1) % slides.length;
      });

    }, 5000);

    return () => {
      window.clearInterval(timer);
    };

  }, [slides.length]);


  /*
   * Make sure the active slide remains valid
   * when products change.
   */

  useEffect(() => {

    if (
      slides.length > 0 &&
      activeSlide >= slides.length
    ) {
      setActiveSlide(0);
    }

  }, [slides.length, activeSlide]);


  /*
   * No media uploaded yet.
   */

  if (slides.length === 0) {

    return (
      <section className="relative overflow-hidden bg-slate-950 text-white">

        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />

        <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />

        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-fuchsia-600/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:py-20">

          <div className="grid items-center gap-10 lg:grid-cols-2">

            <div>

              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black tracking-[0.2em] text-cyan-300 backdrop-blur">
                ✨ OUR COLLECTION
              </div>

              <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl">
                Find something
                <br />

                <span className="bg-gradient-to-r from-cyan-300 via-white to-fuchsia-400 bg-clip-text text-transparent">
                  you'll love.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-lg leading-8 text-white/60">
                Explore our collection of products and discover your next favorite purchase.
              </p>

              <div className="mt-8">

                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/70 backdrop-blur">
                  🛍️ {products.length} products available
                </span>

              </div>

            </div>


            <div className="flex justify-center lg:justify-end">

              <div className="relative w-full max-w-[520px] overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-400 p-8 shadow-2xl">

                <div className="flex h-[390px] flex-col items-center justify-center text-center">

                  <div className="text-8xl">
                    🛍️
                  </div>

                  <h3 className="mt-6 text-3xl font-black">
                    Shop Everything
                  </h3>

                  <p className="mt-3 text-white/80">
                    Product pictures and videos will appear here.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>
    );
  }


  const slide = slides[activeSlide];


  function previousSlide() {

    setActiveSlide((current) => {

      if (current === 0) {
        return slides.length - 1;
      }

      return current - 1;
    });

  }


  function nextSlide() {

    setActiveSlide((current) => {
      return (current + 1) % slides.length;
    });

  }


  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">

      {/* Background glow */}

      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />

      <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />

      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-fuchsia-600/20 blur-3xl" />


      <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:py-20">

        <div className="grid items-center gap-10 lg:grid-cols-2">


          {/* =================================================
              LEFT SIDE
          ================================================= */}

          <div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black tracking-[0.2em] text-cyan-300 backdrop-blur">
              ✨ OUR COLLECTION
            </div>


            <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl">

              Discover

              <br />

              <span className="bg-gradient-to-r from-cyan-300 via-white to-fuchsia-400 bg-clip-text text-transparent">
                something amazing.
              </span>

            </h1>


            <p className="mt-5 max-w-xl text-lg leading-8 text-white/60">
              Explore our latest products through pictures and videos.
              Find something you'll love.
            </p>


            <div className="mt-8 flex flex-wrap gap-3">

              <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white/80 backdrop-blur">
                🛍️ {products.length} products
              </span>

              <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white/80 backdrop-blur">
                🎬 {slides.length} slides
              </span>

            </div>

          </div>


          {/* =================================================
              RIGHT SIDE MEDIA SLIDER
          ================================================= */}

          <div className="flex justify-center lg:justify-end">

            <div className="relative w-full max-w-[520px]">

              <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-r from-cyan-400/20 via-violet-500/20 to-fuchsia-500/20 blur-2xl" />


              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 shadow-2xl backdrop-blur">


                {/* MEDIA */}

                <div className="relative h-[390px] overflow-hidden bg-slate-900 sm:h-[460px]">


                  {slide.type === "video" ? (

                    <video
                      key={slide.id}
                      src={slide.url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="h-full w-full object-cover"
                    />

                  ) : (

                    <img
                      key={slide.id}
                      src={slide.url}
                      alt={slide.productName}
                      className="h-full w-full object-cover"
                    />

                  )}


                  {/* Dark gradient */}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />


                  {/* MEDIA TYPE */}

                  <div className="absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2 text-xs font-black text-violet-700 shadow-lg backdrop-blur">

                    {slide.type === "video"
                      ? "🎥 VIDEO"
                      : "📸 FEATURED"}

                  </div>


                  {/* SLIDE NUMBER */}

                  <div className="absolute right-5 top-5 rounded-full bg-black/60 px-4 py-2 text-xs font-black text-white backdrop-blur">

                    {activeSlide + 1} / {slides.length}

                  </div>


                  {/* PREVIOUS */}

                  {slides.length > 1 && (

                    <button
                      type="button"
                      onClick={previousSlide}
                      aria-label="Previous slide"
                      className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-3xl font-black text-slate-900 shadow-xl backdrop-blur transition hover:scale-110 hover:bg-white"
                    >
                      ‹
                    </button>

                  )}


                  {/* NEXT */}

                  {slides.length > 1 && (

                    <button
                      type="button"
                      onClick={nextSlide}
                      aria-label="Next slide"
                      className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-3xl font-black text-slate-900 shadow-xl backdrop-blur transition hover:scale-110 hover:bg-white"
                    >
                      ›
                    </button>

                  )}


                  {/* PRODUCT INFORMATION */}

                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-7">

                    <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                      MARKETPLACE
                    </p>


                    <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">
                      {slide.productName}
                    </h2>


                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/70">
                      {slide.description}
                    </p>


                    <div className="mt-4 flex flex-wrap items-end justify-between gap-4">

                      <div>

                        <p className="text-xs font-bold text-white/50">
                          PRICE
                        </p>

                        <p className="text-2xl font-black text-white">
                          KSh{" "}
                          {slide.price.toLocaleString()}
                        </p>

                      </div>


                      <Link
                        href={`/products/${slide.productId}`}
                        className="rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-900 shadow-lg transition hover:scale-105"
                      >
                        View Product →
                      </Link>

                    </div>

                  </div>

                </div>


                {/* =================================================
                    DOTS / SLIDE CONTROLS
                ================================================= */}

                {slides.length > 1 && (

                  <div className="flex items-center justify-center gap-2 overflow-x-auto bg-black/30 px-4 py-4">

                    {slides.map((item, index) => (

                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveSlide(index)}
                        aria-label={`Show ${item.productName}`}
                        className={`h-2.5 shrink-0 rounded-full transition-all ${
                          activeSlide === index
                            ? "w-9 bg-cyan-300"
                            : "w-2.5 bg-white/30 hover:bg-white/70"
                        }`}
                      />

                    ))}

                  </div>

                )}

              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}
