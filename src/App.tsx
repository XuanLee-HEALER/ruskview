import { useState, useEffect } from 'react';
import { useAppStore } from './stores/useAppStore';
import { Login } from './views/Login';
import { Dashboard } from './views/Dashboard';
import { SettingsModal } from './components/SettingsModal';
import { ToastContainer } from './components/ToastContainer';
import { listen } from '@tauri-apps/api/event';

function App() {
  const { isAuthenticated, theme, setTheme } = useAppStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    // Initialize theme
    setTheme(theme);
  }, []);

  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        setTheme('system');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, setTheme]);

  useEffect(() => {
    // Listen for menu event from Rust
    const unlisten = listen('open-settings', () => {
      setIsSettingsOpen(true);
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  return (
    <>
      {isAuthenticated ? <Dashboard /> : <Login />}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ToastContainer />
    </>
  );
}

export default App;
