import { FormEvent, useEffect, useState } from "react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import API_BASE from "../config";

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: "income" | "expense";
}

interface DashboardData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  recentTransactions: Transaction[];
  monthlyTrend: { month: string; income: number; expenses: number }[];
  spendingByCategory: { name: string; value: number }[];
}

interface AiResponse {
  content: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

export default function DashboardPage({ username }: { username: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Ask about your balance, spending categories, recent transactions, or trends.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/dashboard`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load dashboard.");
        }
        return res.json();
      })
      .then((dashboardData: DashboardData) => setData(dashboardData))
      .catch(() => setData(null));
  }, []);

  useEffect(() => {
    setSummaryLoading(true);
    fetch(`${API_BASE}/api/dashboard/ai/summary`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load summary.");
        }
        return res.json();
      })
      .then((response: AiResponse) => {
        setSummary(response.content);
        setSummaryError("");
      })
      .catch(() => {
        setSummary("");
        setSummaryError("Summary unavailable.");
      })
      .finally(() => setSummaryLoading(false));
  }, []);

  async function handleChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = chatInput.trim();
    if (!message || chatLoading) {
      return;
    }

    const nextMessages = [...chatMessages, { role: "user" as const, content: message }];
    setChatMessages(nextMessages);
    setChatInput("");
    setChatLoading(true);
    setChatError("");

    try {
      const response = await fetch(`${API_BASE}/api/dashboard/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message,
          history: chatMessages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message.");
      }

      const body: AiResponse = await response.json();
      setChatMessages([...nextMessages, { role: "assistant", content: body.content }]);
    } catch {
      setChatMessages(nextMessages);
      setChatError("AI chat is unavailable right now.");
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-2xl font-semibold text-gray-900">Welcome, {username}!</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Balance</p>
          <p className="text-2xl font-bold text-gray-900">
            {data?.totalBalance != null ? `$${data.totalBalance.toFixed(2)}` : "--"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Monthly Income</p>
          <p className="text-2xl font-bold text-green-600">
            {data?.monthlyIncome != null ? `$${data.monthlyIncome.toFixed(2)}` : "--"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Monthly Spending</p>
          <p className="text-2xl font-bold text-red-500">
            {data?.monthlyExpenses != null ? `$${data.monthlyExpenses.toFixed(2)}` : "--"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_1fr]">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700">AI Summary</h2>
            {summaryLoading && <span className="text-xs text-gray-400">Loading...</span>}
          </div>
          <div className="min-h-28 rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-700">
            {summaryError || summary || "No summary available."}
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-medium text-gray-700">AI Chat</h2>
          <div className="mb-3 flex h-72 flex-col gap-3 overflow-y-auto rounded-lg bg-gray-50 p-3">
            {chatMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === "user"
                    ? "self-end bg-black text-white"
                    : "self-start bg-white text-gray-700 shadow-sm"
                }`}
              >
                {message.content}
              </div>
            ))}
            {chatLoading && (
              <div className="self-start rounded-2xl bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
                Thinking...
              </div>
            )}
          </div>
          <form onSubmit={handleChatSubmit} className="space-y-2">
            <textarea
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              rows={3}
              placeholder="Ask about this dashboard..."
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            {chatError && <p className="text-sm text-red-500">{chatError}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-medium text-gray-700">Income vs Expenses</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data?.monthlyTrend ?? []}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Legend />
              <Line dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} type="monotone" />
              <Line dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-medium text-gray-700">Spending by Category</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data?.spendingByCategory ?? []}
                cx="50%"
                cy="50%"
                dataKey="value"
                outerRadius={80}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {(data?.spendingByCategory ?? []).map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <h2 className="text-sm font-medium text-gray-700">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentTransactions ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                    No transactions yet
                  </td>
                </tr>
              ) : (
                (data?.recentTransactions ?? []).map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {transaction.description || <span className="italic text-gray-400">No description</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {transaction.category}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          transaction.type === "income"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {transaction.type === "income" ? "Income" : "Expense"}
                      </span>
                    </td>
                    <td
                      className={`px-5 py-3 text-right font-medium ${
                        transaction.type === "income" ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}${transaction.amount.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
