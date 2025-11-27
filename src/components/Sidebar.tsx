import { useAppStore } from '../stores/useAppStore';
import { LayoutDashboard, Search, Database, LogOut } from 'lucide-react';
import clsx from 'clsx';

export function Sidebar() {
  const { currentView, setView, logout } = useAppStore();

  const navItems = [
    { id: 'cluster', label: 'Cluster Info', icon: LayoutDashboard },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'indices', label: 'Indices', icon: Database },
  ] as const;

  return (
    <div className="flex h-full w-64 flex-col border-r border-macos-border bg-macos-sidebar pt-10">
      <div className="px-4 pb-4" data-tauri-drag-region>
        <h2 className="text-xs font-semibold uppercase text-macos-textSecondary select-none">
          Menu
        </h2>
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={clsx(
              'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              currentView === item.id
                ? 'bg-macos-active text-white'
                : 'text-macos-text hover:bg-black/5',
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="border-t border-macos-border p-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </button>
      </div>
    </div>
  );
}
