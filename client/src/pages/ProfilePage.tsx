import { useEffect, useState } from "react";
import API_BASE from "../config";

interface ProfileData {
  name: string;
  username: string;
  email: string;
  accountType: string;
  status: string;
  joinDate: string;
}

interface ProfilePageProps {
  darkMode: boolean;
  onToggleDark: (value: boolean) => void;
}

export default function ProfilePage({ darkMode, onToggleDark }: ProfilePageProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", username: "", email: "" });
  const [profileMessage, setProfileMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const [passwordResetMessage, setPasswordResetMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [sendingReset, setSendingReset] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/profile`, { credentials: "include" })
      .then((res) => res.json())
      .then((d: ProfileData) => {
        setProfile(d);
        setEditForm({ name: d.name, username: d.username, email: d.email });
      })
      .catch(() => setProfile(null));
  }, []);

  async function handleSaveProfile() {
    try {
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setProfile({ ...profile!, ...editForm });
        setEditingProfile(false);
        setProfileMessage({ text: "Profile updated successfully.", ok: true });
      } else {
        setProfileMessage({ text: data.message, ok: false });
      }
    } catch {
      setProfileMessage({ text: "Could not connect to server.", ok: false });
    }
  }

  async function handleSendPasswordReset() {
    setSendingReset(true);
    setPasswordResetMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/profile/send-password-reset`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setPasswordResetMessage({ text: "Password reset email sent. Check your inbox.", ok: true });
      } else {
        setPasswordResetMessage({ text: "Failed to send reset email.", ok: false });
      }
    } catch {
      setPasswordResetMessage({ text: "Could not connect to server.", ok: false });
    } finally {
      setSendingReset(false);
    }
  }

  return (
    <div className={`p-8 space-y-6 ${darkMode ? "bg-gray-900 min-h-screen" : ""}`}>
      <div className="flex items-center justify-between">
        <h1 className={`text-2xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>Profile</h1>
        <button
          onClick={() => onToggleDark(!darkMode)}
          className="border rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors"
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      {/* Profile Info */}
      <div className={`rounded-xl shadow-sm border p-5 space-y-4 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
        <h2 className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Profile Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Name</label>
            <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              disabled={!editingProfile}
              className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-50 disabled:text-gray-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : ""}`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Username</label>
            <input value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              disabled={!editingProfile}
              className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-50 disabled:text-gray-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : ""}`} />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Email</label>
            <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              disabled={!editingProfile}
              className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-50 disabled:text-gray-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : ""}`} />
          </div>
        </div>
        {profileMessage && (
          <p className={`text-sm ${profileMessage.ok ? "text-green-600" : "text-red-500"}`}>{profileMessage.text}</p>
        )}
        {passwordResetMessage && (
          <p className={`text-sm ${passwordResetMessage.ok ? "text-green-600" : "text-red-500"}`}>{passwordResetMessage.text}</p>
        )}
        <div className="flex gap-2">
          {!editingProfile ? (
            <>
              <button onClick={() => setEditingProfile(true)}
                className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                Edit Profile
              </button>
              <button onClick={handleSendPasswordReset} disabled={sendingReset}
                className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50">
                {sendingReset ? "Sending..." : "Change Password"}
              </button>
            </>
          ) : (
            <>
              <button onClick={handleSaveProfile}
                className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                Save Changes
              </button>
              <button onClick={() => { setEditingProfile(false); setProfileMessage(null); }}
                className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Account Settings */}
      <div className={`rounded-xl shadow-sm border p-5 space-y-3 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
        <h2 className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Account Settings</h2>
        <div className={`text-sm space-y-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          <p><span className="font-medium">Account Type:</span> {profile?.accountType ?? "—"}</p>
          <p><span className="font-medium">Status:</span> {profile?.status ?? "—"}</p>
          <p><span className="font-medium">Member Since:</span> {profile?.joinDate ?? "—"}</p>
        </div>
      </div>
    </div>
  );
}
