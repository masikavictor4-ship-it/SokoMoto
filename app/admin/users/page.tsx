"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  _count: {
    orders: number;
    cartItems: number;
  };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function loadUsers() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Failed to load users.");
        return;
      }

      setUsers(data);
    } catch {
      setMessage("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function changeRole(userId: number, role: string) {
    setSavingId(userId);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/users/${userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Failed to update role.");
        return;
      }

      setUsers((current) =>
        current.map((user) =>
          user.id === userId
            ? {
                ...user,
                role: data.role,
                status: data.status,
              }
            : user
        )
      );

      setMessage("User role updated successfully.");
    } catch {
      setMessage("Failed to update user.");
    } finally {
      setSavingId(null);
    }
  }

  async function changeStatus(user: User) {
    const newStatus =
      user.status === "ACTIVE"
        ? "DEACTIVATED"
        : "ACTIVE";

    const action =
      newStatus === "ACTIVE"
        ? "activate"
        : "deactivate";

    const confirmed = window.confirm(
      `${action === "activate" ? "Activate" : "Deactivate"} ${
        user.name
      } (${user.email})?`
    );

    if (!confirmed) return;

    setSavingId(user.id);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/users/${user.id}`,
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
        setMessage(
          data.error || "Failed to update account status."
        );
        return;
      }

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? {
                ...item,
                status: data.status,
              }
            : item
        )
      );

      setMessage(
        newStatus === "ACTIVE"
          ? "Account activated successfully."
          : "Account deactivated successfully."
      );
    } catch {
      setMessage(
        "Failed to update account status."
      );
    } finally {
      setSavingId(null);
    }
  }

  async function deleteUser(user: User) {
    const confirmed = window.confirm(
      `Delete ${user.name} (${user.email})?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(user.id);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/users/${user.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.error || "Failed to delete user."
        );
        return;
      }

      setUsers((current) =>
        current.filter(
          (item) => item.id !== user.id
        )
      );

      setMessage("User deleted successfully.");
    } catch {
      setMessage("Failed to delete user.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-10">

        <Link
          href="/admin"
          className="text-sm font-semibold text-violet-600 hover:text-violet-700"
        >
          ← Back to Admin Dashboard
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              User Management
            </h1>

            <p className="mt-2 text-gray-600">
              Manage marketplace users, roles and account status.
            </p>
          </div>

          <button
            onClick={loadUsers}
            disabled={loading}
            className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            Refresh Users
          </button>
        </div>

        {message && (
          <div className="mt-6 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">
            {message}
          </div>
        )}

        <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          {loading ? (
            <div className="p-10 text-center text-gray-500">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">

                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                      User
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                      Role
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                      Orders
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                      Cart
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                      Joined
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50"
                    >

                      <td className="px-6 py-5">
                        <div className="font-semibold text-gray-900">
                          {user.name}
                        </div>

                        <div className="mt-1 text-sm text-gray-500">
                          {user.email}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            user.role === "ADMIN"
                              ? "bg-violet-100 text-violet-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="px-6 py-5">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            user.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.status === "ACTIVE"
                            ? "ACTIVE"
                            : "DEACTIVATED"}
                        </span>

                      </td>

                      <td className="px-6 py-5 text-sm">
                        {user._count.orders}
                      </td>

                      <td className="px-6 py-5 text-sm">
                        {user._count.cartItems}
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-500">
                        {new Date(
                          user.createdAt
                        ).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-5">

                        <div className="flex justify-end gap-2">

                          <select
                            value={user.role}
                            disabled={
                              savingId === user.id
                            }
                            onChange={(event) =>
                              changeRole(
                                user.id,
                                event.target.value
                              )
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          >
                            <option value="CUSTOMER">
                              Customer
                            </option>

                            <option value="ADMIN">
                              Admin
                            </option>
                          </select>

                          <button
                            onClick={() =>
                              changeStatus(user)
                            }
                            disabled={
                              savingId === user.id
                            }
                            className={`rounded-lg px-3 py-2 text-sm font-semibold text-white ${
                              user.status === "ACTIVE"
                                ? "bg-orange-500 hover:bg-orange-600"
                                : "bg-green-600 hover:bg-green-700"
                            } disabled:cursor-not-allowed disabled:opacity-40`}
                          >
                            {savingId === user.id
                              ? "Saving..."
                              : user.status === "ACTIVE"
                              ? "Deactivate"
                              : "Activate"}
                          </button>

                          <button
                            onClick={() =>
                              deleteUser(user)
                            }
                            disabled={
                              deletingId === user.id ||
                              user._count.orders > 0
                            }
                            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {deletingId === user.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>

                        </div>

                      </td>

                    </tr>
                  ))}

                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
