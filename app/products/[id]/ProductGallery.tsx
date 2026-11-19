"use client";

import { useEffect, useState } from "react";

type Video = {
  id: number;
  url: string;
};

type Props = {
  image: string | null;
  name: string;
  videos: Video[];
};

type Media =
  | {
      type: "image";
      url: string;
    }
  | {
      type: "video";
      url: string;
      id: number;
    };

export default function ProductGallery({
  image,
  name,
  videos,
}: Props) {
  const media: Media[] = [];

  if (image) {
    media.push({
      type: "image",
      url: image,
    });
  }

  videos.forEach((video) => {
    media.push({
      type: "video",
      url: video.url,
      id: video.id,
    });
  });

  const [activeIndex, setActiveIndex] = useState(0);

  if (media.length === 0) {
    return (
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-400 shadow-2xl">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center text-white">
            <div className="text-8xl">📦</div>

            <h2 className="mt-5 text-3xl font-black">
              {name}
            </h2>

            <p className="mt-2 font-semibold text-white/80">
              No product media available
            </p>
          </div>
        </div>
      </section>
    );
  }

  const active =
    media[Math.min(activeIndex, media.length - 1)];

  function previous() {
    setActiveIndex((current) =>
      current === 0
        ? media.length - 1
        : current - 1
    );
  }

  function next() {
    setActiveIndex(
      (current) => (current + 1) % media.length
    );
  }

  // Automatic homepage-style slideshow
  useEffect(() => {
    if (media.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex(
        (current) => (current + 1) % media.length
      );
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [media.length]);

  function downloadVideo() {
    if (active.type !== "video") {
      return;
    }

    const link = document.createElement("a");

    link.href = active.url;
    link.download = `${name
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase()}-video.mp4`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <section className="relative">
      {/* HERO SLIDER */}
      <div className="group relative overflow-hidden rounded-[2rem] bg-slate-950 shadow-2xl ring-1 ring-black/5">

        {/* Media */}
        <div className="relative h-[420px] sm:h-[520px] lg:h-[600px]">

          {/* Colorful background */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-400" />

          {active.type === "image" ? (
            <img
              key={active.url}
              src={active.url}
              alt={name}
              className="relative z-10 h-full w-full object-contain p-4 sm:p-8"
            />
          ) : (
            <video
              key={active.id}
              src={active.url}
              controls
              playsInline
              className="relative z-10 h-full w-full object-contain"
            />
          )}

          {/* Top badge */}
          <div className="absolute left-5 top-5 z-20 rounded-full bg-white/90 px-4 py-2 text-xs font-black text-violet-700 shadow-lg backdrop-blur sm:left-7 sm:top-7">
            {active.type === "image"
              ? "📷 PRODUCT IMAGE"
              : "🎬 PRODUCT VIDEO"}
          </div>

          {/* Product name overlay */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-6 pb-10 pt-24 sm:px-10">
            <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-lg sm:text-5xl">
              {name}
            </h2>

            <p className="mt-2 text-sm font-semibold text-white/80 sm:text-base">
              Premium product • SokoMtaani
            </p>
          </div>

          {/* Previous */}
          {media.length > 1 && (
            <button
              type="button"
              onClick={previous}
              className="absolute left-4 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-3xl font-bold text-slate-900 shadow-xl backdrop-blur transition hover:scale-110 hover:bg-white sm:left-6"
              aria-label="Previous product media"
            >
              ‹
            </button>
          )}

          {/* Next */}
          {media.length > 1 && (
            <button
              type="button"
              onClick={next}
              className="absolute right-4 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-3xl font-bold text-slate-900 shadow-xl backdrop-blur transition hover:scale-110 hover:bg-white sm:right-6"
              aria-label="Next product media"
            >
              ›
            </button>
          )}

          {/* Counter */}
          {media.length > 1 && (
            <div className="absolute right-5 top-5 z-30 rounded-full bg-black/60 px-4 py-2 text-sm font-black text-white backdrop-blur sm:right-7 sm:top-7">
              {activeIndex + 1} / {media.length}
            </div>
          )}
        </div>

        {/* DOTS */}
        {media.length > 1 && (
          <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/40 px-4 py-2 backdrop-blur">
            {media.map((item, index) => (
              <button
                key={
                  item.type === "image"
                    ? "image"
                    : item.id
                }
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Go to media ${index + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  activeIndex === index
                    ? "w-8 bg-white"
                    : "w-2.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* VIDEO ACTION */}
      {active.type === "video" && (
        <button
          type="button"
          onClick={downloadVideo}
          className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 px-6 py-4 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          <span className="text-xl">⬇</span>
          Download Product Video
        </button>
      )}

      {/* THUMBNAILS */}
      {media.length > 1 && (
        <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-6">
          {media.map((item, index) => (
            <button
              type="button"
              key={
                item.type === "image"
                  ? "thumb-image"
                  : item.id
              }
              onClick={() => setActiveIndex(index)}
              className={`relative h-20 overflow-hidden rounded-xl border-2 bg-slate-100 transition hover:-translate-y-1 ${
                activeIndex === index
                  ? "border-violet-600 ring-4 ring-violet-100"
                  : "border-slate-200 hover:border-violet-300"
              }`}
            >
              {item.type === "image" ? (
                <img
                  src={item.url}
                  alt={`${name} thumbnail`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <>
                  <video
                    src={item.url}
                    muted
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />

                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-xl text-white">
                    ▶
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
