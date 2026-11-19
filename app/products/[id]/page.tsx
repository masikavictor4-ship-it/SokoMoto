import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductGallery from "./ProductGallery";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductPage({
  params,
}: Props) {
  const { id } = await params;

  const productId = Number(id);

  if (!Number.isInteger(productId)) {
    notFound();
  }

  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },
    include: {
      videos: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="border-b bg-white px-5 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href="/products"
            className="text-xl font-black text-violet-600"
          >
            SokoMtaani
          </Link>

          <div className="flex gap-3">
            <Link
              href="/products"
              className="rounded-xl border px-4 py-2 text-sm font-bold"
            >
              Products
            </Link>

            <Link
              href="/cart"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
            >
              🛒 Cart
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:py-16">
        <Link
          href="/products"
          className="font-bold text-violet-600 hover:text-violet-800"
        >
          ← Back to Products
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <ProductGallery
            image={product.image}
            name={product.name}
            videos={product.videos}
          />

          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-700">
              {product.stock > 0
                ? `✓ ${product.stock} in stock`
                : "Sold Out"}
            </div>

            <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              {product.name}
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              {product.description}
            </p>

            <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-black uppercase tracking-wider text-slate-400">
                Price
              </p>

              <p className="mt-2 text-4xl font-black text-violet-600">
                KSh {product.price.toLocaleString()}
              </p>

              {product.videos.length > 0 && (
                <p className="mt-4 text-sm font-bold text-slate-500">
                  🎬 {product.videos.length} product video
                  {product.videos.length === 1 ? "" : "s"} available
                </p>
              )}

              <Link
                href="/products"
                className="mt-6 block w-full rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 px-6 py-4 text-center font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                🛒 Add from Products
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
