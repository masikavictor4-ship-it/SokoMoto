"use client";

import { FormEvent, useState } from "react";

type TrackingLocationFormProps = {
  orderId: number;
  initialDeliveryAddress: string | null;
  initialDeliveryLatitude: number | null;
  initialDeliveryLongitude: number | null;
  initialCurrentLatitude: number | null;
  initialCurrentLongitude: number | null;
};

export default function TrackingLocationForm({
  orderId,
  initialDeliveryAddress,
  initialDeliveryLatitude,
  initialDeliveryLongitude,
  initialCurrentLatitude,
  initialCurrentLongitude,
}: TrackingLocationFormProps) {
  const [deliveryAddress, setDeliveryAddress] = useState(
    initialDeliveryAddress ?? ""
  );

  const [deliveryLatitude, setDeliveryLatitude] = useState(
    initialDeliveryLatitude?.toString() ?? ""
  );

  const [deliveryLongitude, setDeliveryLongitude] = useState(
    initialDeliveryLongitude?.toString() ?? ""
  );

  const [currentLatitude, setCurrentLatitude] = useState(
    initialCurrentLatitude?.toString() ?? ""
  );

  const [currentLongitude, setCurrentLongitude] = useState(
    initialCurrentLongitude?.toString() ?? ""
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/orders/${orderId}/tracking`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            deliveryAddress,
            deliveryLatitude,
            deliveryLongitude,
            currentLatitude,
            currentLongitude,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update tracking."
        );
      }

      setMessage("Tracking information saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update tracking."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
      <div className="mb-4">
        <h4 className="text-lg font-bold text-blue-900">
          📍 Delivery Tracking
        </h4>

        <p className="mt-1 text-sm text-blue-700">
          Set the customer's delivery destination and the current
          courier location.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Delivery Address
          </label>

          <input
            type="text"
            value={deliveryAddress}
            onChange={(event) =>
              setDeliveryAddress(event.target.value)
            }
            placeholder="Example: Nairobi CBD"
            className="w-full rounded-lg border bg-white px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <h5 className="mb-2 font-semibold text-gray-800">
            🏠 Customer Delivery Location
          </h5>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-gray-600">
                Delivery Latitude
              </label>

              <input
                type="number"
                step="any"
                min="-90"
                max="90"
                value={deliveryLatitude}
                onChange={(event) =>
                  setDeliveryLatitude(event.target.value)
                }
                placeholder="-1.286389"
                className="w-full rounded-lg border bg-white px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-600">
                Delivery Longitude
              </label>

              <input
                type="number"
                step="any"
                min="-180"
                max="180"
                value={deliveryLongitude}
                onChange={(event) =>
                  setDeliveryLongitude(event.target.value)
                }
                placeholder="36.817223"
                className="w-full rounded-lg border bg-white px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div>
          <h5 className="mb-2 font-semibold text-gray-800">
            🚚 Current Courier Location
          </h5>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-gray-600">
                Current Latitude
              </label>

              <input
                type="number"
                step="any"
                min="-90"
                max="90"
                value={currentLatitude}
                onChange={(event) =>
                  setCurrentLatitude(event.target.value)
                }
                placeholder="-1.292066"
                className="w-full rounded-lg border bg-white px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-600">
                Current Longitude
              </label>

              <input
                type="number"
                step="any"
                min="-180"
                max="180"
                value={currentLongitude}
                onChange={(event) =>
                  setCurrentLongitude(event.target.value)
                }
                placeholder="36.821945"
                className="w-full rounded-lg border bg-white px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {message && (
          <div className="rounded-lg bg-green-100 p-3 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-100 p-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving
            ? "Saving..."
            : "💾 Save Tracking Location"}
        </button>
      </form>
    </div>
  );
}
