"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  profileImage: string | null;
};

export default function SiteNav() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/me", {
          cache: "no-store",
        });

        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();
        setUser(data.user ?? null);
      } catch {
        setUser(null);
      }
    }

    loadUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function logout() {
    await fetch("/api/logout", {
      method: "POST",
    });

    window.location.href = "/";
  }

  return (
    <nav className="relative z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          aria-label="SokoMtaani home"
          className="shrink-0"
        >
          <Image
            src="/sokomtaani-logo.svg"
            alt="SokoMtaani - Your Neighbourhood Marketplace"
            width={210}
            height={56}
            priority
            className="h-auto w-[155px] sm:w-[190px] md:w-[210px]"
          />
        </Link>

        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/products"
            className="text-sm font-semibold text-slate-700 transition hover:text-orange-600 sm:text-base"
          >
            Products
          </Link>

          {user ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 transition hover:bg-slate-50"
              >
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <span className="hidden text-sm font-medium sm:block">
                  {user.name}
                </span>

                <span className="text-xs">▼</span>
              </button>

              {open && (
                <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                  <div className="border-b bg-slate-50 px-4 py-3">
                    <p className="font-semibold text-slate-900">
                      {user.name}
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {user.email}
                    </p>
                  </div>

                  <Link
                    href="/account#profile"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 text-slate-700 transition hover:bg-slate-100"
                  >
                    👤 Profile
                  </Link>

                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 text-slate-700 transition hover:bg-slate-100"
                  >
                    ⚙️ Account & Settings
                  </Link>

                  <Link
                    href="/orders"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 text-slate-700 transition hover:bg-slate-100"
                  >
                    📦 My Orders
                  </Link>

                  <Link
                    href="/chat"
                    onClick={() => setOpen(false)}
                    className="mx-2 my-1 block rounded-lg bg-emerald-50 px-4 py-3 text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">💬</span>
                      <div>
                        <p className="font-semibold">
                          Chat with Support
                        </p>
                        <p className="text-xs text-emerald-600">
                          Get help from SokoMtaani
                        </p>
                      </div>
                    </div>
                  </Link>

                  {user.role === "ADMIN" && (
                    <>
                      <div className="my-1 border-t" />

                      <Link
                        href="/admin"
                        onClick={() => setOpen(false)}
                        className="block px-4 py-2.5 font-medium text-blue-600 transition hover:bg-blue-50"
                      >
                        🛠️ Admin Dashboard
                      </Link>

                      <Link
                        href="/admin/chat"
                        onClick={() => setOpen(false)}
                        className="block px-4 py-2.5 font-medium text-purple-600 transition hover:bg-purple-50"
                      >
                        💬 Support Chats
                      </Link>
                    </>
                  )}

                  <div className="my-1 border-t" />

                  <button
                    type="button"
                    onClick={logout}
                    className="block w-full px-4 py-2.5 text-left text-red-600 transition hover:bg-red-50"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="/login"
                className="text-sm font-semibold text-slate-700 transition hover:text-orange-600 sm:text-base"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-bold text-white transition hover:bg-orange-600 sm:px-4 sm:text-base"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
