"use client";

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
    <nav className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold text-gray-900"
        >
          Marketplace
        </Link>

        <div className="flex items-center gap-6">
          {/* Products */}
          <Link
            href="/products"
            className="text-gray-700 transition hover:text-black"
          >
            Products
          </Link>

          {user ? (
            <div
              ref={menuRef}
              className="relative"
            >
              {/* Account Button */}
              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 transition hover:bg-gray-50"
              >
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <span className="hidden sm:block">
                  {user.name}
                </span>

                <span className="text-xs">
                  ▼
                </span>
              </button>

              {/* Dropdown */}
              {open && (
                <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border bg-white shadow-xl">
                  {/* User information */}
                  <div className="border-b bg-gray-50 px-4 py-3">
                    <p className="font-semibold text-gray-900">
                      {user.name}
                    </p>

                    <p className="truncate text-sm text-gray-500">
                      {user.email}
                    </p>
                  </div>

                  {/* Profile */}
                  <Link
                    href="/account#profile"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 text-gray-700 transition hover:bg-gray-100"
                  >
                    👤 Profile
                  </Link>

                  {/* Account */}
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 text-gray-700 transition hover:bg-gray-100"
                  >
                    ⚙️ Account & Settings
                  </Link>

                  {/* Orders */}
                  <Link
                    href="/orders"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 text-gray-700 transition hover:bg-gray-100"
                  >
                    📦 My Orders
                  </Link>

                  {/* Customer Support Chat */}
                  <Link
                    href="/chat"
                    onClick={() => setOpen(false)}
                    className="mx-2 my-1 block rounded-lg bg-emerald-50 px-4 py-3 text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        💬
                      </span>

                      <div>
                        <p className="font-semibold">
                          Chat with Support
                        </p>

                        <p className="text-xs text-emerald-600">
                          Get help from MarketPlace
                        </p>
                      </div>
                    </div>
                  </Link>

                  {/* Admin */}
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

                  {/* Logout */}
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
            /* Logged out */
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-700 transition hover:text-black"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-lg bg-black px-4 py-2 text-white transition hover:bg-gray-800"
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
