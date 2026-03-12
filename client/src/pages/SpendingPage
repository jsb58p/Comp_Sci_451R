import { useEffect, useState } from "react";
import API_BASE from "../config";

interface Expense {
  id: number;
  date: string;
  category: string;
  amount: number;
  description: string;
}

const categories = ["Housing", "Food", "Transport", "Utilities", "Entertainment", "Healthcare", "Shopping", "Other"];

export default function SpendingPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], category: "", amount: "", description: "" });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/spending`, { credentials: "include" })
      .then((res) => res.json())
      .then((d: Expense[]) => setExpenses(d))
      .catch(() => setExpenses([]));
  }, []);

  const filtered = expenses
    .filter((e) => {
      if (filterCategory !== "all" && e.category !== filterCategory) return false;
      if (filterDate && !e.date.startsWith(filterDate)) return false;
      return true;
    })
    .sort((a, b) => {
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
      return sortOrder === "desc" ? -diff : diff;
    });

  const total = filtered.reduce((sum, e) => sum + e.amount, 0);

  async function handleAdd() {
    if (!form.category || !form.amount || !form.description) {
      setFormError("Please fill in all fields.");
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

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Spending</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          + Add Expense
        </button>
      </div>

      {/* Add Expense Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-medium text-gray-700">New Expense</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black">
                <option value="">Select category</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Amount ($)</label>
              <input type="number" step="0.01" placeholder="0.00" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Description</label>
              <input type="text" placeholder="Enter description" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
            </div>
          </div>
          {formError && <p className="text-sm text-red-500">{formError}</p>}
          <div className="flex gap-2">
            <button onClick={handleAdd}
              className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              Add Expense
            </button>
            <button onClick={() => { setShowForm(false); setFormError(null); }}
              className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <p className="text-sm text-gray-500">Total Expenses</p>
        <p className="text-2xl font-bold text-red-500">${total.toFixed(2)}</p>
        <p className="text-xs text-gray-400 mt-1">{filtered.length} transaction{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100 flex flex-wrap gap-2 items-center justify-between">
          <h2 className="text-sm font-medium text-gray-700">Expense History</h2>
          <div className="flex flex-wrap gap-2">
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black">
              <option value="all">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="month" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
            <button onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="border rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors">
              {sortOrder === "desc" ? "Newest First" : "Oldest First"}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium text-right">Amount</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400">No expenses found</td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-3 text-gray-500">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="px-5 py-3">{e.description}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{e.category}</span>
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
