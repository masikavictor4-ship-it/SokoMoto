import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";

function VerifyEmailLoading() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 text-center shadow-lg">
      <div className="mb-4 text-4xl">✉️</div>

      <h1 className="text-2xl font-bold text-gray-900">
        Loading verification...
      </h1>

      <p className="mt-2 text-gray-600">
        Please wait while we load your email verification page.
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 px-4 py-12">
      <div className="mx-auto mb-8 max-w-lg text-center">
        <a
          href="/"
          className="text-2xl font-extrabold text-green-600"
        >
          SokoMtaani
        </a>
      </div>

      <Suspense fallback={<VerifyEmailLoading />}>
        <VerifyEmailClient />
      </Suspense>
    </main>
  );
}
