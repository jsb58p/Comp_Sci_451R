import { Page } from "@/types/page";

export default function Sidebar({
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
        <h2 className="font-semibold text-gray-900">Personal Finance App</h2>
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