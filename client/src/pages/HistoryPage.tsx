import { useEffect, useState } from "react";
import API_BASE from "../config";

type SortCol = "date" | "description" | "category" | "amount" | "type";
type SortDir = "asc" | "desc";

function SortIcon({ col, sortCol, sortDir }: { col: SortCol; sortCol: SortCol; sortDir: SortDir }) {
  const active = col === sortCol;
  return (
    <span
      className={`inline-flex flex-col leading-none ml-1 align-middle ${active ? "text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500"}`}
      style={{ fontSize: "8px", gap: "1px", verticalAlign: "middle" }}
    >
      <span style={{ opacity: active && sortDir === "asc" ? 1 : 0.4 }}>▲</span>
      <span style={{ opacity: active && sortDir === "desc" ? 1 : 0.4 }}>▼</span>
    </span>
  );
}

interface Entry {
  id: number;
  type: "expense" | "income";
  date: string;
  category: string;
  amount: number;
  description: string;
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [searchText, setSearchText] = useState("");
  const [sortCol, setSortCol] = useState<SortCol>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [undoStack, setUndoStack] = useState<Entry[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [expRes, incRes] = await Promise.all([
          fetch(`${API_BASE}/api/spending`, { credentials: "include" }),
          fetch(`${API_BASE}/api/income`, { credentials: "include" }),
        ]);
        const expenses = await expRes.json();
        const incomes = await incRes.json();
        const combined: Entry[] = [
          ...(Array.isArray(expenses) ? expenses.map((e: Omit<Entry, "type">) => ({ ...e, type: "expense" as const })) : []),
          ...(Array.isArray(incomes) ? incomes.map((i: Omit<Entry, "type">) => ({ ...i, type: "income" as const })) : []),
        ];
        setEntries(combined);
      } catch {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function showNotification(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }

  function handleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  }

  const filtered = entries
    .filter((e) => {
      if (filterType !== "all" && e.type !== filterType) return false;
      const q = searchText.toLowerCase();
      if (
        q &&
        !e.category.toLowerCase().includes(q) &&
        !(e.description || "").toLowerCase().includes(q)
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortCol === "date") cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (sortCol === "description") cmp = (a.description || "").localeCompare(b.description || "");
      else if (sortCol === "category") cmp = a.category.localeCompare(b.category);
      else if (sortCol === "amount") cmp = a.amount - b.amount;
      else if (sortCol === "type") cmp = a.type.localeCompare(b.type);
      // Secondary sort by id desc for stable ordering
      if (cmp === 0) cmp = b.id - a.id;
      return sortDir === "desc" ? -cmp : cmp;
    });

  async function handleDelete(entry: Entry) {
    const endpoint = entry.type === "expense" ? "spending" : "income";
    try {
      const res = await fetch(`${API_BASE}/api/${endpoint}/${entry.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => !(e.id === entry.id && e.type === entry.type)));
        setUndoStack((prev) => [...prev, entry]);
        showNotification(`Deleted ${entry.type} entry.`);
      }
    } catch {
      // silently fail
    }
  }

  async function handleUndo() {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    const endpoint = last.type === "expense" ? "spending" : "income";
    try {
      const res = await fetch(`${API_BASE}/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          date: last.date,
          category: last.category,
          amount: last.amount,
          description: last.description,
        }),
      });
      if (res.ok) {
        const restored = await res.json();
        setEntries((prev) => [...prev, { ...restored, type: last.type }]);
        setUndoStack((prev) => prev.slice(0, -1));
        showNotification(`Restored ${last.type} entry.`);
      }
    } catch {
      // silently fail
    }
  }

  const totalIncome = entries
    .filter((e) => e.type === "income")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = entries
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + e.amount, 0);

  const cols: { col: SortCol; label: string; right?: boolean }[] = [
    { col: "date", label: "Date" },
    { col: "type", label: "Type" },
    { col: "description", label: "Description" },
    { col: "category", label: "Category" },
    { col: "amount", label: "Amount", right: true },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">History</h1>
        <button
          onClick={handleUndo}
          disabled={undoStack.length === 0}
          className="text-sm px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Undo Last Deletion {undoStack.length > 0 && `(${undoStack.length})`}
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 text-sm px-4 py-2 rounded-lg">
          {notification}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Income</p>
          <p className="text-2xl font-bold text-green-500">${totalIncome.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
          <p className="text-2xl font-bold text-red-500">${totalExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Net Balance</p>
          <p className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? "text-green-500" : "text-red-500"}`}>
            ${(totalIncome - totalExpenses).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex flex-wrap gap-2 items-center justify-between">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            All Transactions
            <span className="ml-2 text-gray-400 font-normal">({filtered.length})</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Search description or category..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as "all" | "income" | "expense")}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                {cols.map(({ col, label, right }) => (
                  <th
                    key={col}
                    className={`px-5 py-3 font-medium cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors whitespace-nowrap${right ? " text-right" : ""}`}
                    onClick={() => handleSort(col)}
                  >
                    {label}
                    <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
                  </th>
                ))}
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400 dark:text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400 dark:text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr
                    key={`${e.type}-${e.id}`}
                    className="border-b border-gray-50 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-750"
                  >
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(e.date).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          e.type === "income"
                            ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                            : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {e.type === "income" ? "Income" : "Expense"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{e.description || "—"}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {e.category}
                      </span>
                    </td>
                    <td
                      className={`px-5 py-3 text-right font-medium ${
                        e.type === "income" ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {e.type === "income" ? "+" : "-"}${e.amount.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDelete(e)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        Delete
                      </button>
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