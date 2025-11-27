import { useAppStore } from '../stores/useAppStore';
import {
  LayoutDashboard,
  Search,
  Wrench,
  FileText,
  Camera,
  Server,
  Cpu,
  Grid3x3,
  Shield,
  Users,
  LogOut,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';

type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  subItems?: { id: string; label: string; icon: React.ElementType }[];
};

export function Sidebar() {
  const { currentView, setView, logout } = useAppStore();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    operations: true,
    cluster: true,
    security: false,
  });

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'search', label: 'Search', icon: Search },
    {
      id: 'operations',
      label: 'Operations',
      icon: Wrench,
      subItems: [
        { id: 'indices', label: 'Indices', icon: FileText },
        { id: 'snapshots', label: 'Snapshots', icon: Camera },
      ],
    },
    {
      id: 'cluster',
      label: 'Cluster',
      icon: Server,
      subItems: [
        { id: 'nodes', label: 'Nodes', icon: Cpu },
        { id: 'shards', label: 'Shards', icon: Grid3x3 },
      ],
    },
    {
      id: 'security',
      label: 'Security',
      icon: Shield,
      subItems: [
        { id: 'users', label: 'Users', icon: Users },
      ],
    },
  ];

  return (
    <div className="flex h-full w-64 flex-col border-r border-macos-border bg-macos-sidebar backdrop-blur-xl pt-10 transition-colors duration-300">
      <div className="px-4 pb-4" data-tauri-drag-region>
        <h2 className="text-xs font-semibold uppercase text-macos-textSecondary select-none tracking-wider opacity-80">
          Menu
        </h2>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 overflow-y-auto">
        {navItems.map((item) => (
          <div key={item.id}>
            {item.subItems ? (
              <>
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="group flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium text-macos-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 opacity-70" />
                    {item.label}
                  </div>
                  {expanded[item.id] ? (
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  ) : (
                    <ChevronRight className="h-3 w-3 opacity-50" />
                  )}
                </button>
                {expanded[item.id] && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-macos-border pl-2">
                    {item.subItems.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => setView(sub.id)}
                        className={clsx(
                          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
                          currentView === sub.id
                            ? 'bg-macos-active text-white shadow-sm'
                            : 'text-macos-text hover:bg-black/5 dark:hover:bg-white/5'
                        )}
                      >
                        <sub.icon className="h-3.5 w-3.5 opacity-80" />
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => setView(item.id)}
                className={clsx(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
                  currentView === item.id
                    ? 'bg-macos-active text-white shadow-sm'
                    : 'text-macos-text hover:bg-black/5 dark:hover:bg-white/5'
                )}
              >
                <item.icon className="h-4 w-4 opacity-70" />
                {item.label}
              </button>
            )}
          </div>
        ))}
      </nav>
      <div className="border-t border-macos-border p-4 bg-black/5 dark:bg-white/5">
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-macos-red hover:bg-macos-red/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </button>
      </div>
    </div>
  );
}
