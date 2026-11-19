"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function LoginPage() {
const [form, setForm] = useState({
email: "",
password: "",
});

const [message, setMessage] = useState("");
const [loading, setLoading] = useState(false);
const [resending, setResending] = useState(false);
const [resendMessage, setResendMessage] = useState("");
const [needsVerification, setNeedsVerification] = useState(false);

function handleChange(
event: React.ChangeEvent<HTMLInputElement>
) {
setForm({
...form,
[event.target.name]: event.target.value,
});

if (event.target.name === "email") {
  setNeedsVerification(false);
  setResendMessage("");
}

}

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
event.preventDefault();

setMessage("");
setResendMessage("");
setNeedsVerification(false);
setLoading(true);

try {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(form),
  });

  const data = await response.json();

  if (!response.ok) {
    setMessage(data.error || "Login failed.");

    if (
      response.status === 403 &&
      typeof data.error === "string" &&
      data.error.toLowerCase().includes("verify your email")
    ) {
      setNeedsVerification(true);
    }

    return;
  }

  window.location.href =
    data.user?.role === "ADMIN"
      ? "/admin"
      : "/dashboard";
} catch (error) {
  console.error("Login error:", error);
  setMessage("Something went wrong while logging in.");
} finally {
  setLoading(false);
}

}

async function handleResendVerification() {
const email = form.email.trim().toLowerCase();

if (!email) {
  setResendMessage("Enter your email address first.");
  return;
}

setResending(true);
setResendMessage("");

try {
  const response = await fetch(
    "/api/resend-verification",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    setResendMessage(
      data.error || "Unable to resend verification email."
    );
    return;
  }

  setResendMessage(
    "Verification email sent. Please check your inbox."
  );
} catch (error) {
  console.error("Resend verification error:", error);

  setResendMessage(
    "Something went wrong while resending the verification email."
  );
} finally {
  setResending(false);
}

}

return ( <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12"> <div className="w-full max-w-md"> <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200 sm:p-10">

      {/* Logo */}
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-3xl">
          🛒
        </div>

        <h1 className="mt-6 text-3xl font-bold text-slate-900">
          Welcome Back
        </h1>

        <p className="mt-2 text-slate-500">
          Log in to your SokoMtaani account.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-5"
      >

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Email Address
          </label>

          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-slate-900 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
          />
        </div>

        {/* Password */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-slate-700"
            >
              Password
            </label>

            {/* FORGOT PASSWORD BUTTON */}
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-green-600 transition hover:text-green-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-slate-900 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
          />
        </div>

        {/* Login error */}
        {message && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {message}
          </div>
        )}

        {/* Email verification */}
        {needsVerification && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">
              Your email address has not been verified yet.
            </p>

            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resending}
              className="mt-3 w-full rounded-xl bg-amber-600 px-4 py-3 font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resending
                ? "Sending..."
                : "Resend verification email"}
            </button>

            {resendMessage && (
              <p className="mt-3 text-center text-sm font-medium text-amber-800">
                {resendMessage}
              </p>
            )}
          </div>
        )}

        {/* Login */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-green-600 px-4 py-3.5 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>

      {/* Register */}
      <div className="mt-8 text-center">
        <p className="text-sm text-slate-500">
          Don't have an account?
        </p>

        <Link
          href="/register"
          className="mt-2 inline-block font-semibold text-green-600 hover:text-green-700"
        >
          Create an account
        </Link>
      </div>

    </div>
  </div>
</main>

);
}
