import { useToastStore, Toast } from '../stores/useToastStore';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { useEffect, useState } from 'react';

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((state) => state.removeToast);
  const [isVisible, setIsVisible] = useState(false);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => removeToast(toast.id), 500); // Wait for exit animation
  };

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));

    if (!toast.needsConfirmation) {
      const timer = setTimeout(() => {
        handleClose();
      }, toast.duration || 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  };

  return (
    <div
      className={clsx(
        'flex w-80 items-start gap-3 rounded-lg border border-macos-border bg-macos-window/90 p-4 shadow-lg backdrop-blur-md transition-all duration-500',
        isVisible ? 'translate-x-0 opacity-100 ease-out' : 'translate-x-full opacity-0 ease-in',
      )}
    >
      <div className="mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-macos-text">{toast.title}</h3>
        {toast.message && <p className="mt-1 text-xs text-macos-textSecondary">{toast.message}</p>}
        {toast.needsConfirmation && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleClose}
              className="rounded-md bg-macos-active px-3 py-1.5 text-xs font-medium text-white hover:bg-macos-activeHover"
            >
              Confirm
            </button>
            <button
              onClick={handleClose}
              className="rounded-md border border-macos-border bg-transparent px-3 py-1.5 text-xs font-medium text-macos-text hover:bg-black/5 dark:hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      {!toast.needsConfirmation && (
        <button onClick={handleClose} className="text-macos-textSecondary hover:text-macos-text">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
