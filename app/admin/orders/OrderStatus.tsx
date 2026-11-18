"use client";

import { useState } from "react";

type Props = {
  orderId: number;
  currentStatus: string;
};

export default function OrderStatus({
  orderId,
  currentStatus,
}: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function updateStatus(newStatus: string) {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/orders/${orderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Failed to update.");
        return;
      }

      setStatus(data.status);
      setMessage("Updated");
    } catch {
      setMessage("Failed to update.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4">
      <label className="text-sm font-medium text-gray-700">
        Order Status
      </label>

      <div className="mt-2 flex items-center gap-3">
        <select
          value={status}
          disabled={saving}
          onChange={(event) =>
            updateStatus(event.target.value)
          }
          className="rounded-lg border px-3 py-2"
        >
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        {message && (
          <span className="text-sm text-green-600">
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
