"use client";

import { useEffect, useRef, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  profileImage?: string | null;
  role: string;
};

type Conversation = {
  id: number;
  customer: User;
  messages: {
    id: number;
    content: string;
    createdAt: string;
    sender: User;
  }[];
};

type Message = {
  id: number;
  content: string;
  createdAt: string;
  sender: User;
};

export default function ChatPage() {
  const [conversation, setConversation] =
    useState<Conversation | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  async function loadConversation() {
    try {
      const response = await fetch("/api/chat/conversations", {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load chat");
      }

      const data = await response.json();

      let currentConversation: Conversation | null = null;

      if (Array.isArray(data)) {
        currentConversation = data[0] || null;
      } else {
        currentConversation = data.conversation || data || null;
      }

      setConversation(currentConversation);

      if (currentConversation?.id) {
        await loadMessages(currentConversation.id);
      }
    } catch (err) {
      console.error(err);
      setError("Please log in to use customer support chat.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(conversationId: number) {
    try {
      const response = await fetch(
        `/api/chat/messages?conversationId=${conversationId}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!response.ok) return;

      const data = await response.json();

      if (Array.isArray(data)) {
        setMessages(data);
      } else {
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Message loading error:", err);
    }
  }

  useEffect(() => {
    loadConversation();
  }, []);

  useEffect(() => {
    if (!conversation?.id) return;

    const interval = setInterval(() => {
      loadMessages(conversation.id);
    }, 3000);

    return () => clearInterval(interval);
  }, [conversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();

    const content = message.trim();

    if (!content || sending) return;

    setSending(true);
    setError("");

    try {
      let conversationId = conversation?.id;

      if (!conversationId) {
        const response = await fetch("/api/chat/conversations", {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to create conversation");
        }

        const data = await response.json();

        const newConversation =
          data.conversation ||
          (Array.isArray(data) ? data[0] : data);

        if (!newConversation?.id) {
          throw new Error("No conversation found");
        }

        conversationId = newConversation.id;
        setConversation(newConversation);
      }

      const response = await fetch("/api/chat/messages", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          content,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setMessage("");

      await loadMessages(conversationId!);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to send message"
      );
    } finally {
      setSending(false);
    }
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
          <p className="text-gray-600">
            Loading support chat...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            SokoMtaani Support
          </div>

          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Chat with Support
          </h1>

          <p className="mt-1 text-gray-600">
            Ask us about products, orders, payments, delivery,
            or anything else.
          </p>
        </div>

        {/* Chat container */}
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
          {/* Chat header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-2xl">
                💬
              </div>

              <div>
                <h2 className="font-bold">
                  SokoMtaani Support
                </h2>

                <div className="flex items-center gap-2 text-sm text-emerald-50">
                  <span className="h-2 w-2 rounded-full bg-green-300" />
                  Support team
                </div>
              </div>
            </div>

            <div className="hidden rounded-full bg-white/15 px-3 py-1 text-xs sm:block">
              Replies usually appear automatically
            </div>
          </div>

          {/* Messages */}
          <div className="h-[500px] overflow-y-auto bg-gray-50 p-4 sm:p-6">
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-md text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl">
                    👋
                  </div>

                  <h3 className="text-xl font-bold text-gray-900">
                    Welcome to SokoMtaani Support
                  </h3>

                  <p className="mt-2 text-gray-500">
                    Send us a message and our support team
                    will help you.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isCustomer =
                    msg.sender?.role !== "ADMIN";

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        isCustomer
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] ${
                          isCustomer
                            ? "items-end"
                            : "items-start"
                        }`}
                      >
                        <div
                          className={`mb-1 text-xs text-gray-400 ${
                            isCustomer
                              ? "text-right"
                              : "text-left"
                          }`}
                        >
                          {isCustomer
                            ? "You"
                            : "SokoMtaani Support"}
                        </div>

                        <div
                          className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
                            isCustomer
                              ? "rounded-br-md bg-emerald-600 text-white"
                              : "rounded-bl-md border border-gray-200 bg-white text-gray-800"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        </div>

                        <div
                          className={`mt-1 text-[11px] text-gray-400 ${
                            isCustomer
                              ? "text-right"
                              : "text-left"
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={sendMessage}
            className="border-t border-gray-200 bg-white p-4"
          >
            <div className="flex items-end gap-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                rows={2}
                maxLength={2000}
                className="min-h-[52px] flex-1 resize-none rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey
                  ) {
                    e.preventDefault();

                    if (!sending && message.trim()) {
                      sendMessage(e);
                    }
                  }
                }}
              />

              <button
                type="submit"
                disabled={
                  sending || !message.trim()
                }
                className="flex h-[52px] min-w-[100px] items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 font-semibold text-white shadow-md transition hover:from-emerald-700 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>

            <div className="mt-2 text-right text-xs text-gray-400">
              {message.length}/2000
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

