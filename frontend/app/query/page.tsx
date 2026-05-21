"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Which accounts are most at risk of churning this quarter?",
  "What's the common thread across the admin console complaints?",
  "Which CSMs are carrying the heaviest at-risk load?",
  "Are there any expansion opportunities I should prioritize?",
];

export default function QueryPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || streaming) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const history = messages;
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setStreaming(true);

    // Add empty assistant message to stream into
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history }),
      });

      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const dec = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value);
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: "assistant",
            content: copy[copy.length - 1].content + chunk,
          };
          return copy;
        });
      }
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content: "Something went wrong. Make sure ANTHROPIC_API_KEY is set.",
        };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const empty = messages.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 80px)" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, flexShrink: 0 }}>
        <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--atlas-z-500)", marginBottom: 8 }}>
          Atlas · Ask
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", margin: 0 }}>
          Ask Atlas anything about your portfolio
        </h1>
      </div>

      {/* Thread */}
      <div style={{ flex: 1, overflowY: "auto", marginBottom: 16 }}>
        {empty ? (
          <div style={{ paddingTop: 20 }}>
            <p style={{ fontSize: 13.5, color: "var(--atlas-z-500)", marginBottom: 20 }}>
              I have today&apos;s briefing loaded. Try one of these:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 560 }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    textAlign: "left", padding: "10px 14px",
                    background: "var(--atlas-z-50)", border: "1px solid var(--atlas-z-200)",
                    borderRadius: 8, fontSize: 13, color: "var(--atlas-z-700)",
                    cursor: "pointer", transition: "background 0.1s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--atlas-z-100)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "var(--atlas-z-50)")}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 8 }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "72%",
                    padding: "12px 16px",
                    borderRadius: m.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                    background: m.role === "user" ? "var(--atlas-z-900)" : "#ffffff",
                    color: m.role === "user" ? "white" : "var(--atlas-z-900)",
                    border: m.role === "assistant" ? "1px solid var(--atlas-z-200)" : "none",
                    fontSize: 14,
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {m.content}
                  {streaming && i === messages.length - 1 && m.role === "assistant" && m.content === "" && (
                    <span style={{ opacity: 0.5 }}>Thinking…</span>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div
        style={{
          flexShrink: 0, padding: "12px 16px",
          background: "#ffffff", border: "1px solid var(--atlas-z-300)",
          borderRadius: 10, display: "flex", alignItems: "flex-end", gap: 10,
          boxShadow: "0 2px 8px rgba(9,9,11,0.06)",
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask about your portfolio…"
          rows={1}
          style={{
            flex: 1, border: "none", outline: "none", resize: "none",
            fontSize: 14, lineHeight: 1.5, fontFamily: "var(--font-geist-sans)",
            background: "transparent", color: "var(--atlas-z-900)",
          }}
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || streaming}
          style={{
            padding: "7px 14px", borderRadius: 6, border: "none",
            background: input.trim() && !streaming ? "var(--atlas-z-900)" : "var(--atlas-z-200)",
            color: input.trim() && !streaming ? "white" : "var(--atlas-z-400)",
            fontSize: 13, fontWeight: 500, cursor: input.trim() && !streaming ? "pointer" : "default",
            transition: "background 0.15s, color 0.15s", flexShrink: 0,
          }}
        >
          {streaming ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
