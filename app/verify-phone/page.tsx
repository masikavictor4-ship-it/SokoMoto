"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

function VerifyPhoneLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-200">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-3xl">
            📱
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Loading verification...
          </h1>

          <p className="mt-3 text-slate-500">
            Please wait while we load your phone verification page.
          </p>
        </div>
      </section>
    </main>
  );
}

function VerifyPhoneForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const userId = searchParams.get("userId") || "";
  const phone = searchParams.get("phone") || "";

  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleVerify(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "/api/verify-phone",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            code,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Verification failed."
        );
      }

      setSuccess(true);
      setMessage(
        "Phone number verified successfully!"
      );

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Verification failed."
      );
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    setMessage("");
    setResending(true);

    try {
      const response = await fetch(
        "/api/resend-phone-verification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            phone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to resend verification code."
        );
      }

      setMessage(
        "A new verification code has been sent to your phone."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to resend code."
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-xl font-bold text-white">
              M
            </div>

            <span className="text-xl font-bold text-slate-900">
              Market<span className="text-green-600">Place</span>
            </span>
          </Link>

          <Link
            href="/login"
            className="text-sm font-semibold text-slate-600 hover:text-green-600"
          >
            Login
          </Link>
        </div>
      </header>

      <section className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200 sm:p-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-3xl">
            📱
          </div>

          <h1 className="text-center text-3xl font-bold text-slate-900">
            Verify Your Phone
          </h1>

          <p className="mt-3 text-center text-slate-500">
            We sent a 6-digit verification code to:
          </p>

          <p className="mt-2 text-center font-semibold text-green-600">
            {phone}
          </p>

          {!success ? (
            <>
              <form
                onSubmit={handleVerify}
                className="mt-8 space-y-5"
              >
                <div>
                  <label
                    htmlFor="code"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Verification code
                  </label>

                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(event) =>
                      setCode(
                        event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6)
                      )
                    }
                    required
                    placeholder="123456"
                    className="w-full rounded-xl border border-slate-300 px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-slate-900 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  />
                </div>

                {message && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full rounded-xl bg-green-600 px-4 py-3.5 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Verifying..."
                    : "Verify Phone"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-500">
                  Didn't receive the code?
                </p>

                <button
                  type="button"
                  onClick={resendCode}
                  disabled={resending}
                  className="mt-2 font-semibold text-green-600 hover:text-green-700 disabled:opacity-50"
                >
                  {resending
                    ? "Sending..."
                    : "Resend Code"}
                </button>
              </div>
            </>
          ) : (
            <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-5 text-center text-green-700">
              <div className="text-3xl">✓</div>

              <p className="mt-2 font-semibold">
                {message}
              </p>

              <p className="mt-1 text-sm">
                Redirecting you to login...
              </p>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-sm font-semibold text-slate-500 hover:text-green-600"
            >
              ← Back to MarketPlace
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function VerifyPhonePage() {
  return (
    <Suspense fallback={<VerifyPhoneLoading />}>
      <VerifyPhoneForm />
    </Suspense>
  );
}





