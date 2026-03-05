import { useState } from "react";

type Mode = "login" | "register";

interface AuthResponse {
  success: boolean;
  message: string;
  username: string | null;
}

function App() {
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    usernameOrEmail: "",
  });
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function switchMode(m: Mode) {
    setMode(m);
    setMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body =
      mode === "login"
        ? { usernameOrEmail: form.usernameOrEmail, password: form.password }
        : {
            username: form.username,
            email: form.email,
            password: form.password,
            confirmPassword: form.confirmPassword,
          };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: AuthResponse = await res.json();
      setMessage({ text: data.message, ok: data.success });
    } catch {
      setMessage({ text: "Could not connect to server.", ok: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
        {/* Tabs */}
        <div className="flex mb-6 border-b">
          <button
            className={`flex-1 pb-2 text-sm font-medium transition-colors ${
              mode === "login"
                ? "border-b-2 border-black text-black"
                : "text-gray-400 hover:text-black"
            }`}
            onClick={() => switchMode("login")}
          >
            Login
          </button>
          <button
            className={`flex-1 pb-2 text-sm font-medium transition-colors ${
              mode === "register"
                ? "border-b-2 border-black text-black"
                : "text-gray-400 hover:text-black"
            }`}
            onClick={() => switchMode("register")}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "register" && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Username</label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Enter username"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Enter email"
                />
              </div>
            </>
          )}

          {mode === "login" && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Username or Email</label>
              <input
                name="usernameOrEmail"
                value={form.usernameOrEmail}
                onChange={handleChange}
                required
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Enter username or email"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Enter password"
            />
          </div>

          {mode === "register" && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Confirm Password</label>
              <input
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Confirm password"
              />
            </div>
          )}

          {message && (
            <p className={`text-sm ${message.ok ? "text-green-600" : "text-red-500"}`}>
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;