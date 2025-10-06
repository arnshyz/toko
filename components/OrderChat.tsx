"use client";
import { useEffect, useRef, useState } from "react";

type Msg = { id: string; sender: string; content: string | null; createdAt: string };

export default function OrderChat({ orderCode, role }: { orderCode: string; role: "buyer" | "seller" }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const r = await fetch(`/api/chat/messages/${orderCode}`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!r.ok) {
        throw new Error("Failed to load messages");
      }
      const j = await r.json();
      setMessages(j.messages as Msg[]);
      setError(null);
      setTimeout(() => boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" }), 0);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat percakapan. Muat ulang halaman.");
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [orderCode]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setText("");
    setError(null);
    setSending(true);
    try {
      const res = await fetch(`/api/chat/messages/${orderCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message = typeof data?.error === "string" ? data.error : "Gagal mengirim pesan.";
        setError(message);
        setText(content);
        return;
      }
      const data = (await res.json()) as { message: Msg };
      setMessages((prev) => [...prev, data.message]);
      setTimeout(() => boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" }), 0);
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat mengirim. Silakan coba lagi.");
      setText(content);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border rounded-lg p-3">
      <div ref={boxRef} className="h-64 overflow-y-auto bg-gray-50 rounded-md p-3">
        {messages.length === 0 && <div className="text-sm text-gray-500">Belum ada chat.</div>}
        {messages.map((m) => {
          const isSeller = m.sender.startsWith("seller:");
          const mine = (role === "seller" && isSeller) || (role === "buyer" && !isSeller);
          return (
            <div key={m.id} className={`mb-2 flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                  mine ? "bg-green-800 text-white" : "bg-white border"
                }`}
              >
                <div className="opacity-70 text-[10px] mb-1">
                  {isSeller ? "Seller" : "Buyer"} • {new Date(m.createdAt).toLocaleTimeString("id-ID")}
                </div>
                <div>{m.content}</div>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={send} className="mt-2 flex gap-2">
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="Tulis pesan…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="border rounded px-4 py-2 bg-green-800 text-white" disabled={sending}>
          {sending ? "Mengirim…" : "Kirim"}
        </button>
      </form>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
