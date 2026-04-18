// The backend forwards to the Ollama /api/generate endpoint over Tailscale.

export interface ChatApiRequest {
  message: string;
  pageContext?: string;
  financialData?: string;
}

export interface ChatApiResponse {
  reply: string;
  model?: string;
  error?: string;
}

export async function sendChatMessage(
  req: ChatApiRequest,
  signal?: AbortSignal
): Promise<ChatApiResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal,
  });

  if (!res.ok) {
    throw new Error(`Chat request failed: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as ChatApiResponse;
}


export function capturePageContext(): string {
  if (typeof document === "undefined") return "";

  const clone = document.body.cloneNode(true) as HTMLElement;

  // Remove the chatbot's own DOM from the snapshot.
  clone
    .querySelectorAll<HTMLElement>("[data-bb-chatbot]")
    .forEach((el) => el.remove());
  // Remove script/style tags.
  clone.querySelectorAll("script, style, noscript").forEach((el) => el.remove());

  const text = (clone.innerText || clone.textContent || "")
    .replace(/\s+/g, " ")
    .trim();

  // Keep the captured text reasonably sized.
  return text.length > 6000 ? text.slice(0, 6000) + "…" : text;
}


export async function captureFinancialData(): Promise<string> {
  const endpoints = [
    "/api/summary",
    "/api/transactions",
    "/api/income",
    "/api/spending",
  ];

  const results: Record<string, unknown> = {};

  await Promise.all(
    endpoints.map(async (url) => {
      try {
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (res.ok) {
          const key = url.replace(/^\/api\//, "");
          results[key] = await res.json();
        }
      } catch {
        /* endpoint not available — skip silently */
      }
    })
  );

  if (Object.keys(results).length === 0) return "";
  return JSON.stringify(results);
}
