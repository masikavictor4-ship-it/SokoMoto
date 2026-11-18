"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function VerifyEmailClient() {
  const searchParams = useSearchParams();

  const [message, setMessage] = useState("Verifying your email...");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setMessage(
        "Invalid verification link. The verification token is missing."
      );
      setSuccess(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(
          `/api/verify-email?token=${encodeURIComponent(token)}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setMessage(
            data.error || "Email verification failed."
          );
          setSuccess(false);
          return;
        }

        setMessage(
          data.message ||
            "Your email has been verified successfully."
        );
        setSuccess(true);
      } catch {
        setMessage(
          "Unable to verify your email. Please try again."
        );
        setSuccess(false);
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          background: "#ffffff",
          padding: "40px",
          borderRadius: "20px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.10)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "30px",
            fontWeight: 700,
            marginBottom: "20px",
          }}
        >
          {success ? "Email Verified" : "Email Verification"}
        </h1>

        <p
          style={{
            color: "#475569",
            marginBottom: "30px",
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>

        <Link
          href="/login"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            borderRadius: "10px",
            background: success ? "#16a34a" : "#2563eb",
            color: "#ffffff",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Go to Login
        </Link>
      </div>
    </main>
  );
}
