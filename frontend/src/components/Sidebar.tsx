import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FolderOpen,
  MessageSquareReply,
  Megaphone,
} from "lucide-react";

const nav = [
  { to: "/dashboard",    label: "Главная",       icon: LayoutDashboard },
  { to: "/leads",        label: "Лиды",          icon: Users },
  { to: "/deals",        label: "Сделки",        icon: Briefcase },
  { to: "/documents",    label: "Документы",     icon: FolderOpen },
  { to: "/auto-replies", label: "Автоответы",    icon: MessageSquareReply },
  { to: "/broadcasts",   label: "Рассылки",      icon: Megaphone },
];

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100">
        <span className="text-lg font-bold text-brand-600 tracking-tight">CRM Pocket</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
