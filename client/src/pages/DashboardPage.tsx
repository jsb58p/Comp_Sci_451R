import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
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
  incomeByCategory: { name: string; value: number }[];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

type SortCol = "date" | "description" | "category" | "type" | "amount";
type SortDir = "asc" | "desc";

function SortIcon({ col, sortCol, sortDir }: { col: SortCol; sortCol: SortCol; sortDir: SortDir }) {
  const active = col === sortCol;
  return (
    <span className={`inline-flex flex-col leading-none ml-1 align-middle ${active ? "text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500"}`} style={{ fontSize: "8px", gap: "1px", verticalAlign: "middle" }}>
      <span style={{ opacity: active && sortDir === "asc" ? 1 : 0.4 }}>▲</span>
      <span style={{ opacity: active && sortDir === "desc" ? 1 : 0.4 }}>▼</span>
    </span>
  );
}

export default function DashboardPage({ username, onNavigateWithForm }: { username: string; onNavigateWithForm: (page: "spending" | "income") => void }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [sortCol, setSortCol] = useState<SortCol>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    fetch(`${API_BASE}/api/dashboard`, { credentials: "include" })
      .then((res) => res.json())
      .then((d: DashboardData) => setData(d))
      .catch(() => setData(null));
  }, []);

  function handleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  }

  function sortedTransactions(txs: Transaction[]) {
    return [...txs].sort((a, b) => {
      let cmp = 0;
      if (sortCol === "date") {
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortCol === "description") {
        cmp = (a.description || "").localeCompare(b.description || "");
      } else if (sortCol === "category") {
        cmp = a.category.localeCompare(b.category);
      } else if (sortCol === "type") {
        cmp = a.type.localeCompare(b.type); // "expense" < "income"
      } else if (sortCol === "amount") {
        cmp = a.amount - b.amount;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Welcome, {username}!</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Balance</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data?.totalBalance != null ? `$${data.totalBalance.toFixed(2)}` : "—"}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Income</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-green-600">
              {data?.monthlyIncome != null ? `$${data.monthlyIncome.toFixed(2)}` : "—"}
            </p>
            <button
              onClick={() => onNavigateWithForm("income")}
              className="border border-gray-300 dark:border-gray-600 rounded-md w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-bold"
              title="Add Income"
            >
              +
            </button>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Spending</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-red-500">
              {data?.monthlyExpenses != null ? `$${data.monthlyExpenses.toFixed(2)}` : "—"}
            </p>
            <button
              onClick={() => onNavigateWithForm("spending")}
              className="border border-gray-300 dark:border-gray-600 rounded-md w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-bold"
              title="Add Expense"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Income vs Expenses + Category Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700 space-y-6">
        <div>
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Income vs Expenses</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data?.monthlyTrend ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", color: "#f9fafb" }} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div>
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Spending by Category</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data?.spendingByCategory ?? []}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {(data?.spendingByCategory ?? []).map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", color: "#f9fafb" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Income by Category</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data?.incomeByCategory ?? []}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {(data?.incomeByCategory ?? []).map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", color: "#f9fafb" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                {(["date", "description", "category", "type", "amount"] as SortCol[]).map((col) => (
                  <th
                    key={col}
                    className={`px-5 py-3 font-medium cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors whitespace-nowrap${col === "amount" ? " text-right" : ""}`}
                    onClick={() => handleSort(col)}
                  >
                    {col.charAt(0).toUpperCase() + col.slice(1)}
                    <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.recentTransactions ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400 dark:text-gray-500">
                    No transactions yet
                  </td>
                </tr>
              ) : (
                sortedTransactions(data?.recentTransactions ?? []).map((t) => (
                  <tr key={t.id} className="border-b border-gray-50 dark:border-gray-700 last:border-0">
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{t.description || <span className="text-gray-400 italic">—</span>}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.type === "income" ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"}`}>
                        {t.type === "income" ? "Income" : "Expense"}
                      </span>
                    </td>
                    <td className={`px-5 py-3 text-right font-medium ${t.type === "income" ? "text-green-600" : "text-red-500"}`}>
                      {t.type === "income" ? "+" : "-"}${t.amount.toFixed(2)}
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
