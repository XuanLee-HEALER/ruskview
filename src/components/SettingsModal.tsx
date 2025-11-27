import { useAppStore, Theme } from '../stores/useAppStore';
import { X, Sun, Moon, Monitor } from 'lucide-react';
import clsx from 'clsx';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, setTheme } = useAppStore();

  if (!isOpen) return null;

  const themes: { id: Theme; label: string; icon: any }[] = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="w-[500px] rounded-xl border border-macos-border bg-macos-window p-0 shadow-2xl backdrop-blur-xl">
        {/* Title Bar */}
        <div className="flex items-center justify-between border-b border-macos-border px-4 py-3">
          <h2 className="text-sm font-semibold text-macos-text">Settings</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4 text-macos-textSecondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-macos-text">Appearance</label>
              <div className="flex gap-1 rounded-lg bg-macos-sidebar p-1">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={clsx(
                      'flex flex-1 items-center justify-center gap-2 rounded-md py-1.5 text-sm font-medium transition-all',
                      theme === t.id
                        ? 'bg-macos-active text-white shadow-sm'
                        : 'text-macos-text hover:bg-black/5 dark:hover:bg-white/10',
                    )}
                  >
                    <t.icon className="h-4 w-4" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
