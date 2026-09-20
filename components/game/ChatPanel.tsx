"use client";
import { useState } from "react";
import { useGame } from "@/store/gameStore";

export default function ChatPanel() {
  const chat = useGame((s) => s.chat);
  const [text, setText] = useState("");
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    await fetch("/api/rooms", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
    setText("");
  }
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-2 text-sm">
        {chat.map((c, i) => (
          <p key={i}><b>{c.from}:</b> {c.text}</p>
        ))}
      </div>
      <form onSubmit={send} className="flex gap-1 p-2">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={200} placeholder="chat…" className="flex-1 rounded bg-neutral-800 p-1" />
        <button className="rounded bg-neutral-700 px-2" type="submit">Send</button>
      </form>
    </div>
  );
}
