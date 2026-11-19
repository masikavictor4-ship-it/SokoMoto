"use client";

import { FormEvent, useState } from "react";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Hello 👋 Welcome to SokoMtaani! How can I help you today?",
    },
  ]);

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault();

    const text = message.trim();

    if (!text || loading) {
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: text,
    };

    setMessages((current) => [...current, userMessage]);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Chat request failed.");
      }

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.reply,
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (error) {
      console.error("CHAT ERROR:", error);

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          content:
            "Sorry, I couldn't process your message right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating chat button */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open SokoMtaani chat"
          className="fixed bottom-5 right-5 z-[200] flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 text-2xl shadow-2xl shadow-fuchsia-500/30 transition duration-300 hover:scale-110 hover:shadow-fuchsia-500/50"
        >
          💬
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-5 right-5 z-[200] flex h-[620px] w-[calc(100vw-2rem)] max-w-[390px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/40">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-violet-700 via-fuchsia-600 to-pink-500 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-xl backdrop-blur">
                🤖
              </div>

              <div>
                <p className="font-black">SokoMtaani Chat</p>
                <div className="flex items-center gap-1.5 text-xs text-white/80">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  Online
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg transition hover:bg-white/20"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-900 px-4 py-5">
            {messages.map((item) => (
              <div
                key={item.id}
                className={`flex ${
                  item.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[82%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 ${
                    item.role === "user"
                      ? "rounded-br-md bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                      : "rounded-bl-md border border-white/10 bg-slate-800 text-slate-200"
                  }`}
                >
                  {item.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-white/10 bg-slate-800 px-4 py-3 text-sm text-slate-300">
                  <span className="animate-pulse">Typing...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick questions */}
          <div className="border-t border-white/10 bg-slate-950 px-3 py-3">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {[
                "Show products",
                "How do I checkout?",
                "How does M-Pesa work?",
              ].map((question) => (
                <button
                  key={question}
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setMessage(question);
                  }}
                  className="shrink-0 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs font-bold text-violet-300 transition hover:bg-violet-500/20 disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>

            <form
              onSubmit={sendMessage}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Ask SokoMtaani..."
                disabled={loading}
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500"
              />

              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-lg font-black text-white transition hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send message"
              >
                ➤
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
