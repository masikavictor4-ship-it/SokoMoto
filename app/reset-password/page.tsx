"use client";

import Link from "next/link";
import {
  FormEvent,
  Suspense,
  useEffect,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(
        "This password reset link is invalid or incomplete."
      );
    }
  }, [token]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!token) {
      setError(
        "This password reset link is invalid."
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Your password must contain at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            token,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Unable to reset your password."
        );
        return;
      }

      setSuccess(true);
      setMessage(
        "Your password has been reset successfully."
      );

      setPassword("");
      setConfirmPassword("");
    } catch {
      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background:
          "linear-gradient(135deg, #eff6ff, #ecfdf5, #ffffff)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "#ffffff",
          borderRadius: "20px",
          padding: "36px",
          boxShadow:
            "0 15px 45px rgba(0,0,0,0.10)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "42px",
              marginBottom: "10px",
            }}
          >
            🔑
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "30px",
              fontWeight: 800,
              color: "#111827",
            }}
          >
            Reset Password
          </h1>

          <p
            style={{
              color: "#6b7280",
              marginTop: "10px",
            }}
          >
            Create a new password for your
            MarketPlace account.
          </p>
        </div>

        {message && (
          <div
            style={{
              marginTop: "22px",
              padding: "14px",
              borderRadius: "10px",
              background: "#ecfdf5",
              color: "#166534",
              border: "1px solid #bbf7d0",
              lineHeight: 1.5,
            }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: "22px",
              padding: "14px",
              borderRadius: "10px",
              background: "#fef2f2",
              color: "#b91c1c",
              border: "1px solid #fecaca",
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        {!success && (
          <form
            onSubmit={handleSubmit}
            style={{ marginTop: "25px" }}
          >
            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 700,
                color: "#374151",
              }}
            >
              New Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="At least 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "14px",
                border: "1px solid #d1d5db",
                borderRadius: "10px",
                fontSize: "16px",
              }}
            />

            <label
              htmlFor="confirmPassword"
              style={{
                display: "block",
                marginTop: "18px",
                marginBottom: "8px",
                fontWeight: 700,
                color: "#374151",
              }}
            >
              Confirm New Password
            </label>

            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              placeholder="Enter password again"
              required
              minLength={8}
              autoComplete="new-password"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "14px",
                border: "1px solid #d1d5db",
                borderRadius: "10px",
                fontSize: "16px",
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                marginTop: "24px",
                padding: "14px",
                border: "none",
                borderRadius: "10px",
                background: loading
                  ? "#9ca3af"
                  : "#16a34a",
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: 700,
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {loading
                ? "Resetting Password..."
                : "Reset Password"}
            </button>
          </form>
        )}

        {success && (
          <div
            style={{
              marginTop: "25px",
              padding: "18px",
              borderRadius: "12px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              textAlign: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#166534",
                fontWeight: 600,
              }}
            >
              Your password has been updated.
            </p>

            <Link
              href="/login"
              style={{
                display: "inline-block",
                marginTop: "15px",
                padding: "12px 20px",
                borderRadius: "10px",
                background: "#16a34a",
                color: "#ffffff",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Go to Login
            </Link>
          </div>
        )}

        <div
          style={{
            marginTop: "25px",
            textAlign: "center",
          }}
        >
          <Link
            href="/login"
            style={{
              color: "#2563eb",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}

function LoadingResetPassword() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background:
          "linear-gradient(135deg, #eff6ff, #ecfdf5, #ffffff)",
      }}
    >
      <div
        style={{
          padding: "30px",
          background: "#ffffff",
          borderRadius: "20px",
          boxShadow:
            "0 15px 45px rgba(0,0,0,0.10)",
          textAlign: "center",
          color: "#6b7280",
        }}
      >
        Loading password reset...
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingResetPassword />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
