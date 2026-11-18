"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "/api/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Unable to process your request."
        );
        return;
      }

      setMessage(
        data.message ||
          "If an account exists with that email, a password reset link has been sent."
      );

      setEmail("");
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
          "linear-gradient(135deg, #ecfdf5, #f0fdf4, #ffffff)",
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
            🔐
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "30px",
              fontWeight: 800,
              color: "#111827",
            }}
          >
            Forgot Password?
          </h1>

          <p
            style={{
              color: "#6b7280",
              marginTop: "10px",
              lineHeight: 1.6,
            }}
          >
            Enter your email address and we&apos;ll
            send you a link to reset your password.
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
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ marginTop: "25px" }}
        >
          <label
            htmlFor="email"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 700,
              color: "#374151",
            }}
          >
            Email Address
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="you@example.com"
            required
            autoComplete="email"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px",
              border: "1px solid #d1d5db",
              borderRadius: "10px",
              fontSize: "16px",
              outline: "none",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "18px",
              padding: "14px",
              border: "none",
              borderRadius: "10px",
              background: loading
                ? "#86efac"
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
              ? "Sending..."
              : "Send Reset Link"}
          </button>
        </form>

        <div
          style={{
            textAlign: "center",
            marginTop: "24px",
          }}
        >
          <Link
            href="/login"
            style={{
              color: "#16a34a",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
