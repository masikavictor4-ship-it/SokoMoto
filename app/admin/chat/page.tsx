"use client";

import { useEffect, useState } from "react";

type Customer = {
  id: number;
  name: string;
  email: string;
  profileImage: string | null;
};

type Conversation = {
  id: number;
  customer: Customer;
  messages: {
    id: number;
    content: string;
    createdAt: string;
    senderId: number;
    readAt: string | null;
  }[];
};

type Message = {
  id: number;
  content: string;
  createdAt: string;
  senderId: number;
  readAt: string | null;
  sender: {
    id: number;
    name: string;
    role: string;
    profileImage: string | null;
  };
};

export default function AdminChatPage() {
  const [conversations, setConversations] =
    useState<Conversation[]>([]);

  const [selected, setSelected] =
    useState<Conversation | null>(null);

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function loadConversations() {
    try {
      const response = await fetch(
        "/api/admin/chat",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setConversations(data.conversations || []);
    } catch (error) {
      console.error(error);
    }
  }

  async function loadMessages(
    conversationId: number
  ) {
    try {
      const response = await fetch(
        `/api/chat/messages?conversationId=${conversationId}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load messages."
        );
      }

      setMessages(data.messages);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    async function start() {
      setLoading(true);
      await loadConversations();
      setLoading(false);
    }

    start();

    const interval = setInterval(
      loadConversations,
      3000
    );

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selected) return;

    loadMessages(selected.id);

    const interval = setInterval(() => {
      loadMessages(selected.id);
    }, 3000);

    return () => clearInterval(interval);
  }, [selected]);

  async function sendMessage() {
    const content = message.trim();

    if (!content || !selected || sending) {
      return;
    }

    try {
      setSending(true);
      setError("");

      const response = await fetch(
        "/api/chat/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationId: selected.id,
            content,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to send message."
        );
      }

      setMessages((current) => [
        ...current,
        data.message,
      ]);

      setMessage("");
      await loadConversations();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send message."
      );
    } finally {
      setSending(false);
    }
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleString([], {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        Loading support conversations...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm font-bold text-violet-300">
            💬 Support Center
          </span>

          <h1 className="mt-4 text-3xl font-black">
            Customer Chat
          </h1>

          <p className="mt-2 text-slate-400">
            Respond to customers directly from your
            admin dashboard.
          </p>
        </div>

        <div className="grid min-h-[700px] overflow-hidden rounded-3xl border border-white/10 bg-slate-900 md:grid-cols-[320px_1fr]">
          {/* Conversations */}
          <aside className="border-b border-white/10 md:border-b-0 md:border-r">
            <div className="border-b border-white/10 p-5">
              <h2 className="font-black">
                Conversations
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {conversations.length} conversation
                {conversations.length === 1
                  ? ""
                  : "s"}
              </p>
            </div>

            <div className="max-h-[650px] overflow-y-auto">
              {conversations.length === 0 && (
                <div className="p-6 text-center text-sm text-slate-500">
                  No customer conversations yet.
                </div>
              )}

              {conversations.map((item) => {
                const latest =
                  item.messages[0];

                const active =
                  selected?.id === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelected(item);
                      setError("");
                    }}
                    className={`w-full border-b border-white/5 p-4 text-left transition ${
                      active
                        ? "bg-violet-500/10"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-pink-500 font-black">
                        {item.customer
                          .profileImage ? (
                          <img
                            src={
                              item.customer
                                .profileImage
                            }
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          item.customer.name
                            .charAt(0)
                            .toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-2">
                          <p className="truncate font-bold">
                            {item.customer.name}
                          </p>

                          {latest && (
                            <span className="shrink-0 text-[10px] text-slate-500">
                              {formatTime(
                                latest.createdAt
                              )}
                            </span>
                          )}
                        </div>

                        <p className="truncate text-xs text-slate-500">
                          {item.customer.email}
                        </p>

                        {latest && (
                          <p className="mt-1 truncate text-sm text-slate-400">
                            {latest.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Chat */}
          <section className="flex min-h-[700px] flex-col">
            {!selected ? (
              <div className="flex flex-1 items-center justify-center p-8 text-center">
                <div>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-500/10 text-4xl">
                    💬
                  </div>

                  <h2 className="mt-5 text-xl font-black">
                    Select a conversation
                  </h2>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    Choose a customer from the
                    conversation list to start
                    chatting.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <header className="flex items-center gap-3 border-b border-white/10 bg-slate-950 px-5 py-4">
                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-pink-500 font-black">
                    {selected.customer
                      .profileImage ? (
                      <img
                        src={
                          selected.customer
                            .profileImage
                        }
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      selected.customer.name
                        .charAt(0)
                        .toUpperCase()
                    )}
                  </div>

                  <div>
                    <h2 className="font-black">
                      {selected.customer.name}
                    </h2>

                    <p className="text-xs text-slate-500">
                      {selected.customer.email}
                    </p>
                  </div>
                </header>

                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                  {messages.map((item) => {
                    const mine =
                      item.sender.role ===
                      "ADMIN";

                    return (
                      <div
                        key={item.id}
                        className={`flex ${
                          mine
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] ${
                            mine
                              ? "text-right"
                              : ""
                          }`}
                        >
                          <div
                            className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                              mine
                                ? "rounded-br-md bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                                : "rounded-bl-md bg-slate-800 text-slate-200"
                            }`}
                          >
                            {item.content}
                          </div>

                          <p className="mt-1 text-[10px] text-slate-600">
                            {mine
                              ? "You"
                              : selected
                                  .customer
                                  .name}{" "}
                            ·{" "}
                            {formatTime(
                              item.createdAt
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {error && (
                  <div className="border-t border-red-400/20 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <div className="border-t border-white/10 bg-slate-950 p-4">
                  <div className="flex gap-3">
                    <textarea
                      value={message}
                      onChange={(event) =>
                        setMessage(
                          event.target.value
                        )
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key ===
                            "Enter" &&
                          !event.shiftKey
                        ) {
                          event.preventDefault();
                          sendMessage();
                        }
                      }}
                      rows={2}
                      maxLength={2000}
                      placeholder="Reply to customer..."
                      className="min-h-[52px] flex-1 resize-none rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500"
                    />

                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={
                        sending ||
                        !message.trim()
                      }
                      className="h-12 self-end rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 font-black transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
