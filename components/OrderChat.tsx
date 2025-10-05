"use client";
import { useEffect, useRef, useState } from "react";

type Msg = { id: string; sender: string; content: string | null; createdAt: string };

export default function OrderChat({ orderCode, role }: { orderCode: string; role: "buyer" | "seller" }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  async function load() {
    const r = await fetch(`/api/chat/messages/${orderCode}`, { cache: "no-store" });
    if (r.ok) {
      const j = await r.json();
      setMessages(j.messages as Msg[]);
      setTimeout(() => boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" }), 0);
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
    if (!content) return;
    setText("");
    await fetch(`/api/chat/messages/${orderCode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    load();
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
              <div className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${mine ? "bg-green-800 text-white" : "bg-white border"}`}>
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
        <button className="border rounded px-4 py-2 bg-green-800 text-white">Kirim</button>
      </form>
    </div>
  );
}
