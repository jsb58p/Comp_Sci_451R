// Floating AI chatbot for Budget Bridge.

import { useEffect, useRef, useState } from "react";
import {
  sendChatMessage,
  capturePageContext,
  captureFinancialData,
} from "../../lib/chatApi";

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
}

interface QuickAction {
  label: string;
  prompt: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Analyze this month's expenses",
    prompt:
      "Analyze my spending this month. Break it down by category, call out the biggest line items, and note anything that looks out of the ordinary compared to my usual pattern.",
  },
  {
    label: "Summarize income changes",
    prompt:
      "Summarize how my income has changed recently. Compare this month to prior months, mention which income categories grew or shrank, and flag any one-off spikes or dips.",
  },
  {
    label: "Budget recommendations",
    prompt:
      "Given my current income, spending, and category breakdown, suggest a practical budget plan. Include target percentages or dollar amounts for my main categories, and highlight where I have the most room to save.",
  },
  {
    label: "Identify unusual transactions",
    prompt:
      "Look through my recent transactions and flag anything unusual — amounts far outside the norm, unexpected merchants, duplicate charges, or categories that suddenly spiked.",
  },
];

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm your Budget Bridge assistant. Ask me anything about your finances, or pick a quick action below to get started.",
};

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll to the newest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  // Close the panel on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Cancel any in-flight request on unmount.
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function handleSend(rawPrompt?: string) {
    const text = (rawPrompt ?? input).trim();
    if (!text || loading) return;

    setError(null);
    setInput("");

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // Abort any previous in-flight request.
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const pageContext = capturePageContext();
      const financialData = await captureFinancialData();

      const res = await sendChatMessage(
        { message: text, pageContext, financialData },
        ctrl.signal
      );

      const reply = (res.reply || "").trim();
      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content:
          reply ||
          "I didn't get a response from the model. Please try asking again.",
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(
        "Something went wrong reaching the assistant. Check that the backend is running and the LLM is reachable over Tailscale."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function clearConversation() {
    abortRef.current?.abort();
    setMessages([WELCOME_MESSAGE]);
    setError(null);
  }

  return (
    <div data-bb-chatbot>
      {/* Floating launcher button — always fixed bottom-right */}
      <button
        type="button"
        aria-label={open ? "Close assistant" : "Open assistant"}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg ring-1 ring-black/5 transition hover:bg-emerald-700 hover:shadow-xl active:scale-95"
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </button>

      {/* Slide-out panel */}
      <aside
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-40 flex h-full w-full max-w-md transform flex-col border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-out sm:w-[28rem] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Budget Bridge Assistant
            </h2>
            <p className="text-xs text-gray-500">
              AI-powered insights for your finances
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearConversation}
              className="rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              title="Start new conversation"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <CloseIcon />
            </button>
          </div>
        </header>

        {/* Message list */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4"
        >
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <MessageBubble key={m.id} role={m.role} content={m.content} />
            ))}

            {loading && <TypingBubble />}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="border-t border-gray-200 bg-white px-4 pt-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            Quick actions
          </p>
          <div className="flex flex-wrap gap-2 pb-3">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                type="button"
                disabled={loading}
                onClick={() => handleSend(action.prompt)}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 bg-white px-4 py-3">
          <div className="flex items-end gap-2">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your budget, transactions, or income…"
              disabled={loading}
              className="flex-1 resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
              style={{ maxHeight: "8rem" }}
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>
          <p className="mt-2 text-[11px] text-gray-400">
            Powered by your locally deployed LLM. Press Enter to send, Shift+Enter for a new line.
          </p>
        </div>
      </aside>
    </div>
  );
}

/*presentational helpers*/

function MessageBubble({ role, content }: { role: Role; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "rounded-br-sm bg-emerald-600 text-white"
            : "rounded-bl-sm border border-gray-200 bg-white text-gray-800"
        }`}
      >
        {content}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <Dot delay="0s" />
        <Dot delay="0.15s" />
        <Dot delay="0.3s" />
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400"
      style={{ animationDelay: delay }}
    />
  );
}

function ChatIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
