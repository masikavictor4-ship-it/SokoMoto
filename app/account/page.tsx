"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";

type Account = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
  profileImage: string | null;
  createdAt: string;
  orderCount: number;
};

export default function AccountPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [name, setName] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const [uploadingImage, setUploadingImage] = useState(false);
  const [removingImage, setRemovingImage] = useState(false);

  const [savingName, setSavingName] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function loadAccount() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/account", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load account.");
      }

      setAccount(data);
      setName(data.name);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load account."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccount();
  }, []);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedImage(file);
    setMessage("");
    setError("");

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
  }

  async function uploadProfileImage() {
    if (!selectedImage) {
      setError("Please select an image first.");
      return;
    }

    try {
      setUploadingImage(true);
      setMessage("");
      setError("");

      const formData = new FormData();
      formData.append("image", selectedImage);

      const response = await fetch("/api/account/profile-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to upload profile picture."
        );
      }

      setAccount((current) =>
        current
          ? {
              ...current,
              profileImage: data.profileImage,
            }
          : current
      );

      setSelectedImage(null);
      setPreview("");
      setMessage(data.message || "Profile picture updated.");

      const input = document.getElementById(
        "profile-image"
      ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload profile picture."
      );
    } finally {
      setUploadingImage(false);
    }
  }

  async function removeProfileImage() {
    if (!confirm("Remove your profile picture?")) {
      return;
    }

    try {
      setRemovingImage(true);
      setMessage("");
      setError("");

      const response = await fetch("/api/account/profile-image", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to remove profile picture."
        );
      }

      setAccount((current) =>
        current
          ? {
              ...current,
              profileImage: null,
            }
          : current
      );

      setPreview("");
      setSelectedImage(null);
      setMessage(data.message || "Profile picture removed.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to remove profile picture."
      );
    } finally {
      setRemovingImage(false);
    }
  }

  async function updateName(event: FormEvent) {
    event.preventDefault();

    try {
      setSavingName(true);
      setMessage("");
      setError("");

      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "name",
          name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update name.");
      }

      setAccount((current) =>
        current
          ? {
              ...current,
              name: data.user.name,
            }
          : current
      );

      setMessage(data.message || "Name updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update name."
      );
    } finally {
      setSavingName(false);
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();

    try {
      setChangingPassword(true);
      setMessage("");
      setError("");

      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "password",
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to change password."
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setMessage(data.message);

      setTimeout(() => {
        window.location.href = "/login";
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to change password."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  async function deactivateAccount() {
    const password = prompt(
      "Enter your password to deactivate your account:"
    );

    if (!password) {
      return;
    }

    try {
      setDeactivating(true);
      setMessage("");
      setError("");

      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "deactivate",
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to deactivate account."
        );
      }

      alert(data.message);
      window.location.href = "/";
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to deactivate account."
      );
    } finally {
      setDeactivating(false);
    }
  }

  async function deleteAccount() {
    const confirmed = confirm(
      "WARNING: This will permanently delete your account. Continue?"
    );

    if (!confirmed) {
      return;
    }

    const password = prompt(
      "Enter your password to permanently delete your account:"
    );

    if (!password) {
      return;
    }

    try {
      setDeleting(true);
      setMessage("");
      setError("");

      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to delete account."
        );
      }

      alert(data.message);
      window.location.href = "/";
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete account."
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <p>Loading account...</p>
      </main>
    );
  }

  if (!account) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error || "Unable to load account."}
        </div>
      </main>
    );
  }

  const displayedImage = preview || account.profileImage;

  return (
    <main
      id="profile"
      className="mx-auto max-w-4xl px-4 py-10"
    >
      <h1 className="mb-2 text-3xl font-bold">
        Account & Settings
      </h1>

      <p className="mb-8 text-gray-600">
        Manage your profile, security, and account settings.
      </p>

      {message && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <section className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-xl font-semibold">
          Profile Picture
        </h2>

        <p className="mb-6 text-sm text-gray-500">
          JPG, PNG, or WebP. Maximum size: 5 MB.
        </p>

        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          {displayedImage ? (
            <img
              src={displayedImage}
              alt={account.name}
              className="h-32 w-32 rounded-full border object-cover"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gray-200 text-4xl font-bold text-gray-600">
              {account.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <input
              id="profile-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="mb-3 block w-full text-sm"
            />

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={uploadProfileImage}
                disabled={!selectedImage || uploadingImage}
                className="rounded-lg bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploadingImage
                  ? "Uploading..."
                  : "Upload Picture"}
              </button>

              {account.profileImage && (
                <button
                  type="button"
                  onClick={removeProfileImage}
                  disabled={removingImage}
                  className="rounded-lg border border-red-300 px-4 py-2 text-red-600 disabled:opacity-50"
                >
                  {removingImage
                    ? "Removing..."
                    : "Remove Picture"}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold">
          Personal Information
        </h2>

        <form onSubmit={updateName} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border px-4 py-2"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Email
            </label>

            <input
              type="email"
              value={account.email}
              disabled
              className="w-full rounded-lg border bg-gray-100 px-4 py-2 text-gray-500"
            />
          </div>

          <button
            type="submit"
            disabled={savingName}
            className="rounded-lg bg-black px-5 py-2 text-white disabled:opacity-50"
          >
            {savingName ? "Saving..." : "Save Name"}
          </button>
        </form>
      </section>

      <section className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold">
          Account Information
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">Role</p>
            <p className="font-medium">{account.role}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium">{account.status}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Email Verification
            </p>
            <p className="font-medium">
              {account.emailVerified
                ? "Verified"
                : "Not verified"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Orders
            </p>
            <p className="font-medium">
              {account.orderCount}
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold">
          Change Password
        </h2>

        <form
          onSubmit={changePassword}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">
              Current Password
            </label>

            <input
              type="password"
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(event.target.value)
              }
              className="w-full rounded-lg border px-4 py-2"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              New Password
            </label>

            <input
              type="password"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(event.target.value)
              }
              className="w-full rounded-lg border px-4 py-2"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            className="rounded-lg bg-black px-5 py-2 text-white disabled:opacity-50"
          >
            {changingPassword
              ? "Changing..."
              : "Change Password"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="mb-2 text-xl font-semibold text-red-700">
          Danger Zone
        </h2>

        <p className="mb-6 text-sm text-red-600">
          These actions affect your account permanently.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={deactivateAccount}
            disabled={deactivating}
            className="rounded-lg border border-red-400 px-4 py-2 text-red-700 disabled:opacity-50"
          >
            {deactivating
              ? "Deactivating..."
              : "Deactivate Account"}
          </button>

          <button
            type="button"
            onClick={deleteAccount}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {deleting
              ? "Deleting..."
              : "Delete Account Permanently"}
          </button>
        </div>
      </section>
    </main>
  );
}
