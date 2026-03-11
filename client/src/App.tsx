import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import ResetPassword from "./ResetPassword";
import API_BASE from "./config";

type Mode = "login" | "register" | "forgot";
type Page = "dashboard" | "spending" | "income" | "profile";

interface AuthResponse {
  success: boolean;
  message: string;
  username: string | null;
}

// ─── Sidebar ────────────────────────────────────────────────────────────────

function Sidebar({
  activePage,
  onNavigate,
  onLogout,
}: {
  activePage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}) {
  const navItems: { label: string; page: Page }[] = [
    { label: "Dashboard", page: "dashboard" },
    { label: "Spending", page: "spending" },
    { label: "Income", page: "income" },
    { label: "Profile", page: "profile" },
  ];

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col h-screen shrink-0">
      <div className="p-5 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">My App</h2>
      </div>
      <nav className="flex-1 p-3 flex flex-col gap-1">
        {navItems.map((item) => (
          <button
            key={item.page}
            onClick={() => onNavigate(item.page)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activePage === item.page
                ? "bg-black text-white"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

// ─── Pages ───────────────────────────────────────────────────────────────────

function DashboardPage({ username }: { username: string }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900">Welcome, {username}!</h1>
    </div>
  );
}

function SpendingPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900">Spending</h1>
    </div>
  );
}

function IncomePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900">Income</h1>
    </div>
  );
}

function ProfilePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
    </div>
  );
}

// ─── Post-login layout ───────────────────────────────────────────────────────

function AppLayout({ username, onLogout }: { username: string; onLogout: () => void }) {
  const [activePage, setActivePage] = useState<Page>("dashboard");

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activePage={activePage} onNavigate={setActivePage} onLogout={onLogout} />
      <main className="flex-1 overflow-y-auto">
        {activePage === "dashboard" && <DashboardPage username={username} />}
        {activePage === "spending" && <SpendingPage />}
        {activePage === "income" && <IncomePage />}
        {activePage === "profile" && <ProfilePage />}
      </main>
    </div>
  );
}

// ─── Auth ────────────────────────────────────────────────────────────────────

function AuthPages() {
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    usernameOrEmail: "",
    forgotEmail: "",
  });
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  if (loggedInUser) {
    return <AppLayout username={loggedInUser} onLogout={() => setLoggedInUser(null)} />;
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8 text-center">
          <h2 className="text-lg font-semibold mb-2">Check your email</h2>
          <p className="text-sm text-gray-600">
            A verification link has been sent to your email address. Click the link to activate your account.
          </p>
          <button
            className="mt-6 text-sm text-gray-400 hover:text-black transition-colors"
            onClick={() => { setEmailSent(false); switchMode("login"); }}
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  if (resetEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8 text-center">
          <h2 className="text-lg font-semibold mb-2">Check your email</h2>
          <p className="text-sm text-gray-600">
            If an account with that email exists, a password reset link has been sent. Check your inbox.
          </p>
          <button
            className="mt-6 text-sm text-gray-400 hover:text-black transition-colors"
            onClick={() => { setResetEmailSent(false); switchMode("login"); }}
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function switchMode(m: Mode) {
    setMode(m);
    setMessage(null);
  }

  function validatePassword(password: string): string | null {
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter.";
    if (!/[^a-zA-Z0-9]/.test(password)) return "Password must contain at least one special character.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (mode === "forgot") {
      try {
        await fetch(`${API_BASE}/api/auth/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.forgotEmail }),
        });
        setResetEmailSent(true);
      } catch {
        setMessage({ text: "Could not connect to server.", ok: false });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === "register") {
      const error = validatePassword(form.password);
      if (error) {
        setMessage({ text: error, ok: false });
        setLoading(false);
        return;
      }
    }

    const url = mode === "login" ? `${API_BASE}/api/auth/login` : `${API_BASE}/api/auth/register`;
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
      if (data.success && mode === "login") {
        setLoggedInUser(data.username ?? form.usernameOrEmail);
        return;
      }
      if (data.success && mode === "register") {
        setEmailSent(true);
        return;
      }
      setMessage({ text: data.message, ok: data.success });
    } catch {
      setMessage({ text: "Could not connect to server.", ok: false });
    } finally {
      setLoading(false);
    }
  }

  if (mode === "forgot") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
          <h2 className="text-lg font-semibold mb-6">Forgot your password?</h2>
          <p className="text-sm text-gray-500 mb-4">
            Enter your email and we'll send you a link to reset your password.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Email</label>
              <input
                name="forgotEmail"
                type="email"
                value={form.forgotEmail}
                onChange={handleChange}
                required
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Enter your email"
              />
            </div>
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
              {loading ? "Please wait..." : "Send Reset Link"}
            </button>
            <button
              type="button"
              className="text-sm text-gray-400 hover:text-black transition-colors"
              onClick={() => switchMode("login")}
            >
              Back to login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
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
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                required
                className="border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-black w-full"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {mode === "login" && (
              <button
                type="button"
                className="text-xs text-gray-400 hover:text-black text-left mt-1 transition-colors"
                onClick={() => switchMode("forgot")}
              >
                Forgot password?
              </button>
            )}
          </div>

          {mode === "register" && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Confirm Password</label>
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  className="border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-black w-full"
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPages />} />
      <Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
  );
}

export default App;
