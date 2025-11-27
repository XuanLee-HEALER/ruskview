import { useState, useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { useToastStore } from '../stores/useToastStore';
import { Shield, Key, Server, Save } from 'lucide-react';
import clsx from 'clsx';
import { invoke } from '@tauri-apps/api/core';

export function Login() {
  const login = useAppStore((state) => state.login);
  const addToast = useToastStore((state) => state.addToast);
  const [authType, setAuthType] = useState<'basic' | 'iam'>('basic');
  const [url, setUrl] = useState('http://localhost:9200');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [saveProfile, setSaveProfile] = useState(false);
  const [profileName, setProfileName] = useState('Local Cluster');
  const [isLoading, setIsLoading] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<any[]>([]);

  useEffect(() => {
    invoke('get_profiles')
      .then((profiles: any) => {
        setSavedProfiles(profiles);
      })
      .catch(console.error);
  }, []);

  const handleProfileSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const profileId = e.target.value;
    if (!profileId) return;
    const profile = savedProfiles.find((p) => p.id === profileId);
    if (profile) {
      setProfileName(profile.name);
      setUrl(profile.url);
      // setAuthType(profile.auth_type as 'basic' | 'iam'); // User wants to filter by authType, so we assume authType is already set
      if (profile.auth_type === 'basic') {
        setUsername(profile.username || '');
        setPassword(profile.password || '');
      } else {
        setRegion(profile.region || '');
        setAccessKey(profile.access_key || '');
        setSecretKey(profile.secret_key || '');
      }
    }
  };

  const filteredProfiles = savedProfiles.filter((p) => p.auth_type === authType);

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      const profile = {
        id: 'test',
        name: 'Test Profile',
        url,
        auth_type: authType,
        username: authType === 'basic' ? username : null,
        password: authType === 'basic' ? password : null,
        region: authType === 'iam' ? region : null,
        access_key: authType === 'iam' ? accessKey : null,
        secret_key: authType === 'iam' ? secretKey : null,
      };

      await invoke('test_connection', { profile });

      addToast({
        type: 'success',
        title: 'Connection Successful',
        message: `Successfully connected to ${url}`,
      });
    } catch (error) {
      console.error('Test failed:', error);
      addToast({
        type: 'error',
        title: 'Connection Failed',
        message: String(error),
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const profile = {
        id: Date.now().toString(), // In real app, use UUID or let DB generate
        name: profileName,
        url,
        auth_type: authType,
        username: authType === 'basic' ? username : null,
        password: authType === 'basic' ? password : null,
        region: authType === 'iam' ? region : null,
        access_key: authType === 'iam' ? accessKey : null,
        secret_key: authType === 'iam' ? secretKey : null,
      };

      // Call Tauri backend to verify connection
      await invoke('connect_to_cluster', { profile });

      if (saveProfile) {
        await invoke('save_profile', { profile });
        // Refresh profiles
        invoke('get_profiles')
          .then((profiles: any) => {
            setSavedProfiles(profiles);
          })
          .catch(console.error);
      }

      login({
        id: profile.id,
        name: profile.name,
        url: profile.url,
        authType: profile.auth_type as 'basic' | 'iam',
        username: profile.username || undefined,
        region: profile.region || undefined,
      });

      addToast({
        type: 'success',
        title: 'Connected',
        message: 'Connected', // Simplified message
      });
    } catch (error) {
      console.error('Connection failed:', error);
      addToast({
        type: 'error',
        title: 'Connection Failed',
        message: String(error),
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-macos-window">
      <div className="absolute top-0 left-0 w-full h-8 z-50" data-tauri-drag-region />
      <div className="w-[400px] rounded-xl border border-macos-border bg-macos-input p-6 shadow-xl z-10">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-macos-text dark:text-white">
            Connect to Cluster
          </h1>
          <p className="text-macos-textSecondary">Elasticsearch / OpenSearch</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex rounded-lg bg-macos-sidebar p-1">
          <button
            onClick={() => setAuthType('basic')}
            className={clsx(
              'flex-1 rounded-md py-1.5 text-sm font-medium transition-all',
              authType === 'basic'
                ? 'bg-macos-input shadow-sm text-macos-text'
                : 'text-macos-textSecondary hover:text-macos-text',
            )}
          >
            Basic Auth
          </button>
          <button
            onClick={() => setAuthType('iam')}
            className={clsx(
              'flex-1 rounded-md py-1.5 text-sm font-medium transition-all',
              authType === 'iam'
                ? 'bg-macos-input shadow-sm text-macos-text'
                : 'text-macos-textSecondary hover:text-macos-text',
            )}
          >
            AWS IAM
          </button>
        </div>

        <form onSubmit={handleConnect} className="space-y-4">
          {filteredProfiles.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-macos-textSecondary">
                Saved Profiles
              </label>
              <select
                onChange={handleProfileSelect}
                className="w-full rounded-md border border-macos-border bg-macos-input p-2 text-sm text-macos-text focus:border-macos-active focus:outline-none focus:ring-1 focus:ring-macos-active"
                defaultValue=""
              >
                <option value="" disabled>
                  Select a profile...
                </option>
                {filteredProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.url})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-macos-textSecondary">
              Cluster URL
            </label>
            <div className="relative">
              <Server className="absolute left-2.5 top-2.5 h-4 w-4 text-macos-textSecondary" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-md border border-macos-border bg-macos-input py-2 pl-9 pr-3 text-sm text-macos-text focus:border-macos-active focus:outline-none focus:ring-1 focus:ring-macos-active"
                placeholder="https://my-cluster.es.amazonaws.com"
              />
            </div>
          </div>

          {authType === 'basic' ? (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-macos-textSecondary">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-md border border-macos-border bg-macos-input px-3 py-2 text-sm text-macos-text focus:border-macos-active focus:outline-none focus:ring-1 focus:ring-macos-active"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-macos-textSecondary">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-macos-border bg-macos-input px-3 py-2 text-sm text-macos-text focus:border-macos-active focus:outline-none focus:ring-1 focus:ring-macos-active"
                />
              </div>
            </>
          ) : (
            <>
              <div>
              <label className="mb-1 block text-xs font-medium text-macos-textSecondary">
                Access Key ID
              </label>
              <div className="relative">
                <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-macos-textSecondary" />
                <input
                  type="text"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  className="w-full rounded-md border border-macos-border bg-macos-input py-2 pl-9 pr-3 text-sm text-macos-text focus:border-macos-active focus:outline-none focus:ring-1 focus:ring-macos-active"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-macos-textSecondary">
                Secret Access Key
              </label>
              <div className="relative">
                <Shield className="absolute left-2.5 top-2.5 h-4 w-4 text-macos-textSecondary" />
                <input
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="w-full rounded-md border border-macos-border bg-macos-input py-2 pl-9 pr-3 text-sm text-macos-text focus:border-macos-active focus:outline-none focus:ring-1 focus:ring-macos-active"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-macos-textSecondary">
                Region
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full rounded-md border border-macos-border bg-macos-input px-3 py-2 text-sm text-macos-text focus:border-macos-active focus:outline-none focus:ring-1 focus:ring-macos-active"
              />
            </div>
          </>
        )}

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="saveProfile"
            checked={saveProfile}
            onChange={(e) => setSaveProfile(e.target.checked)}
            className="h-4 w-4 rounded border-macos-border text-macos-active focus:ring-macos-active"
          />
          <label htmlFor="saveProfile" className="text-xs text-macos-textSecondary">
            Save connection profile
          </label>
        </div>

        {saveProfile && (
          <div>
            <label className="mb-1 block text-xs font-medium text-macos-textSecondary">
              Profile Name
            </label>
            <div className="relative">
              <Save className="absolute left-2.5 top-2.5 h-4 w-4 text-macos-textSecondary" />
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full rounded-md border border-macos-border bg-macos-input py-2 pl-9 pr-3 text-sm text-macos-text focus:border-macos-active focus:outline-none focus:ring-1 focus:ring-macos-active"
              />
            </div>
          </div>
        )}          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isLoading}
              className={clsx(
                'flex-1 rounded-md border border-macos-border bg-transparent py-2 text-sm font-medium text-macos-text shadow-sm hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-macos-active focus:ring-offset-2',
                isLoading && 'opacity-70 cursor-not-allowed',
              )}
            >
              Test
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={clsx(
                'flex-1 rounded-md bg-macos-active py-2 text-sm font-medium text-white shadow-sm hover:bg-macos-activeHover focus:outline-none focus:ring-2 focus:ring-macos-active focus:ring-offset-2',
                isLoading && 'opacity-70 cursor-not-allowed',
              )}
            >
              {isLoading ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
