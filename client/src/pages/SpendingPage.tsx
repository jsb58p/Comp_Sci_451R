import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import API_BASE from "../config";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

type SortCol = "date" | "description" | "category" | "amount";
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

interface Expense {
  id: number;
  date: string;
  category: string;
  amount: number;
  description: string;
}

export default function SpendingPage({ autoOpenForm, onFormOpened }: { autoOpenForm?: boolean; onFormOpened?: () => void } = {}) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [sortCol, setSortCol] = useState<SortCol>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (autoOpenForm) {
      setShowForm(true);
      onFormOpened?.();
    }
  }, [autoOpenForm]);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], category: "", amount: "", description: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(["Housing", "Food", "Transport", "Utilities", "Entertainment", "Healthcare", "Shopping", "Other"]);
  const [newCategory, setNewCategory] = useState("");
  const [showCategoryList, setShowCategoryList] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/spending`, { credentials: "include" })
      .then((res) => res.json())
      .then((d: unknown) => setExpenses(Array.isArray(d) ? d as Expense[] : []))
      .catch(() => setExpenses([]));
  }, []);

  function handleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  }

  const filtered = expenses
    .filter((e) => {
      if (filterCategory !== "all" && e.category !== filterCategory) return false;
      const q = searchText.toLowerCase();
      if (q && !e.category.toLowerCase().includes(q) && !(e.description || "").toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortCol === "date") cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (sortCol === "description") cmp = (a.description || "").localeCompare(b.description || "");
      else if (sortCol === "category") cmp = a.category.localeCompare(b.category);
      else if (sortCol === "amount") cmp = a.amount - b.amount;
      return sortDir === "desc" ? -cmp : cmp;
    });

  const total = filtered.reduce((sum, e) => sum + e.amount, 0);

  const spendingByCategory = Object.entries(
    filtered.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  async function handleAdd() {
    if (!form.category || !form.amount) {
      setFormError("Please fill in category and amount.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/spending`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      const added: Expense = await res.json();
      setExpenses([added, ...expenses]);
      setShowForm(false);
      setForm({ date: new Date().toISOString().split("T")[0], category: "", amount: "", description: "" });
      setFormError(null);
    } catch {
      setFormError("Could not connect to server.");
    }
  }

  async function handleDelete(id: number) {
    try {
      await fetch(`${API_BASE}/api/spending/${id}`, { method: "DELETE", credentials: "include" });
      setExpenses(expenses.filter((e) => e.id !== id));
    } catch {
      // silently fail
    }
  }

  const inputClass = "border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500";

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Spending</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-black dark:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
        >
          + Add Expense
        </button>
      </div>

      {/* Add Expense Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-4">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">New Expense</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Category</label>
              <div className="relative">
                <button type="button" onClick={() => setShowCategoryList(!showCategoryList)}
                  className="w-full border rounded-lg px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-black bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                  {form.category || <span className="text-gray-400 dark:text-gray-500">Select category</span>}
                </button>
                {showCategoryList && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {categories.map((c) => (
                      <div key={c} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600">
                        <span className="text-sm cursor-pointer flex-1 text-gray-800 dark:text-gray-200" onClick={() => { setForm({ ...form, category: c }); setShowCategoryList(false); }}>{c}</span>
                        <button type="button" onClick={() => setCategories(categories.filter((cat) => cat !== c))}
                          className="text-gray-400 hover:text-red-500 text-xs ml-2">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-1">
                <input type="text" placeholder="Add custom category" value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className={`${inputClass} flex-1`} />
                <button type="button" onClick={() => {
                  if (newCategory.trim() && !categories.includes(newCategory.trim())) {
                    setCategories([...categories, newCategory.trim()]);
                    setNewCategory("");
                  }
                }} className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                  Add
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Amount ($)</label>
              <input type="number" step="0.01" placeholder="0.00" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Description <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="text" placeholder="Enter description" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={inputClass} />
            </div>
          </div>
          {formError && <p className="text-sm text-red-500">{formError}</p>}
          <div className="flex gap-2">
            <button onClick={handleAdd}
              className="bg-black dark:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors">
              Add Expense
            </button>
            <button onClick={() => { setShowForm(false); setFormError(null); }}
              className="text-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
        <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
        <p className="text-2xl font-bold text-red-500">${total.toFixed(2)}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{filtered.length} transaction{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Spending by Category */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Spending by Category</h2>
        {spendingByCategory.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No data to display</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={spendingByCategory}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {spendingByCategory.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", color: "#f9fafb" }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex flex-wrap gap-2 items-center justify-between">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Expense History</h2>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Search description or category..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-black">
              <option value="all">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                {(["date", "description", "category", "amount"] as SortCol[]).map((col) => (
                  <th
                    key={col}
                    className={`px-5 py-3 font-medium cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors whitespace-nowrap${col === "amount" ? " text-right" : ""}`}
                    onClick={() => handleSort(col)}
                  >
                    {col.charAt(0).toUpperCase() + col.slice(1)}
                    <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
                  </th>
                ))}
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400 dark:text-gray-500">No expenses found</td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="border-b border-gray-50 dark:border-gray-700 last:border-0">
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{e.description}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{e.category}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-red-500">${e.amount.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => handleDelete(e.id)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors">
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
