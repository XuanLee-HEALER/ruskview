import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { Sidebar } from '../components/Sidebar';
import { invoke } from '@tauri-apps/api/core';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XOctagon,
  Cpu,
  HardDrive,
  MemoryStick, // Using MemoryStick as proxy for memorychip
  Server,
  Grid2x2,
  Hourglass,
  ScrollText,
  MoreHorizontal,
} from 'lucide-react';
import clsx from 'clsx';

interface ClusterHealth {
  status: 'green' | 'yellow' | 'red';
  cluster_name: string;
  number_of_nodes: number;
  active_shards: number;
  unassigned_shards: number;
  number_of_pending_tasks: number;
}

interface ClusterStats {
  indices?: {
    count?: number;
    docs?: {
      count?: number;
    };
    store?: {
      size_in_bytes?: number;
    };
  };
  nodes?: {
    count?: {
      total?: number;
    };
  };
  _all?: any; // Fallback for older ES versions
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function Dashboard() {
  const currentView = useAppStore((state) => state.currentView);

  return (
    <div className="flex h-screen w-full bg-macos-window text-macos-text font-sans selection:bg-macos-active selection:text-white">
      <div className="absolute top-0 left-0 w-full h-8 z-50" data-tauri-drag-region />
      <Sidebar />
      <main className="flex-1 overflow-auto p-8 pt-12">
        {currentView === 'dashboard' && <ClusterOverview />}
        {currentView === 'search' && <SearchView />}
        {currentView === 'indices' && <IndicesView />}
        {/* Placeholders for other views */}
        {['nodes', 'shards', 'snapshots', 'users'].includes(currentView) && (
          <div className="flex h-full items-center justify-center text-macos-textSecondary">
            Work in progress: {currentView}
          </div>
        )}
      </main>
    </div>
  );
}

function ClusterOverview() {
  const currentCluster = useAppStore((state) => state.currentCluster);
  const [health, setHealth] = useState<ClusterHealth | null>(null);
  const [stats, setStats] = useState<ClusterStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentCluster) return;
      setLoading(true);
      try {
        const healthRes = await invoke<ClusterHealth>('perform_cluster_op', {
          operation: 'health',
          params: {},
        });
        setHealth(healthRes);

        const statsRes = await invoke<ClusterStats>('perform_cluster_op', {
          operation: 'stats',
          params: {},
        });
        console.log('Stats:', statsRes);
        setStats(statsRes);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentCluster]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-macos-active border-t-transparent" />
      </div>
    );
  }

  if (!health || !stats) return null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Level 1: Hero Section */}
      <HeroSection health={health} />

      {/* Level 2: Stats Strip */}
      <StatsStrip stats={stats} />

      {/* Level 3: Control Pods */}
      <ControlPods health={health} stats={stats} />
    </div>
  );
}

function HeroSection({ health }: { health: ClusterHealth }) {
  const statusColor =
    health.status === 'green'
      ? 'text-macos-green'
      : health.status === 'yellow'
        ? 'text-macos-yellow'
        : 'text-macos-red';

  const StatusIcon =
    health.status === 'green'
      ? CheckCircle2
      : health.status === 'yellow'
        ? AlertTriangle
        : XOctagon;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-macos-surface backdrop-blur-md border border-macos-border p-8 shadow-sm transition-all hover:shadow-md group cursor-default">
      <div className="flex items-center justify-between">
        {/* Left: Cluster Health */}
        <div className="flex items-center gap-6">
          <div className={clsx('p-4 rounded-full bg-white/50 dark:bg-black/20', statusColor)}>
            <StatusIcon className="h-12 w-12" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-macos-text">
              Cluster is {health.status === 'green' ? 'Healthy' : 'Unhealthy'}
            </h1>
            <p className="text-macos-textSecondary mt-1 text-lg">
              {health.cluster_name} • {health.number_of_nodes} Nodes
            </p>
          </div>
        </div>

        {/* Right: Resource Rings */}
        <div className="flex gap-8">
          <ResourceRing label="CPU" percent={45} icon={Cpu} color="text-macos-blue" />
          <ResourceRing label="RAM" percent={72} icon={MemoryStick} color="text-macos-yellow" />
          <ResourceRing label="Disk" percent={28} icon={HardDrive} color="text-macos-green" />
        </div>
      </div>
    </div>
  );
}

function ResourceRing({
  label,
  percent,
  icon: Icon,
  color,
}: {
  label: string;
  percent: number;
  icon: React.ElementType;
  color: string;
}) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-16 w-16">
        {/* Background Circle */}
        <svg className="h-full w-full -rotate-90 transform">
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-macos-border"
          />
          {/* Progress Circle */}
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={clsx(color, 'transition-all duration-1000 ease-out')}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="h-5 w-5 text-macos-textSecondary" />
        </div>
      </div>
      <span className="text-xs font-medium text-macos-textSecondary">
        {label} {percent}%
      </span>
    </div>
  );
}

function StatsStrip({ stats }: { stats: ClusterStats }) {
  const docCount = stats.indices?.docs?.count ?? stats._all?.primaries?.docs?.count ?? 0;
  const storeSize =
    stats.indices?.store?.size_in_bytes ?? stats._all?.primaries?.store?.size_in_bytes ?? 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <StatCard
        title="Total Documents"
        value={docCount.toLocaleString()}
        icon={ScrollText}
        color="bg-macos-brown/10 text-macos-brown"
      />
      <StatCard
        title="Store Size"
        value={formatBytes(storeSize)}
        icon={HardDrive}
        color="bg-macos-blue/10 text-macos-blue"
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-macos-surface/50 border border-macos-border p-5 transition-all hover:bg-macos-surface">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={clsx('p-3 rounded-lg', color)}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-macos-textSecondary">{title}</p>
            <p className="text-2xl font-mono font-semibold text-macos-text mt-0.5">{value}</p>
          </div>
        </div>
        {/* Placeholder for Sparkline */}
        <div className="h-8 w-24 bg-current opacity-10 rounded-md" />
      </div>
    </div>
  );
}

function ControlPods({ health, stats }: { health: ClusterHealth; stats: ClusterStats }) {
  const indicesCount = stats.indices?.count ?? 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Pod
        icon={Server}
        label="Nodes"
        value={`${health.number_of_nodes} Nodes`}
        subValue="All Online"
      />
      <Pod
        icon={Grid2x2}
        label="Shards"
        value={`${health.active_shards} Shards`}
        subValue={`${health.unassigned_shards} Unassigned`}
        alert={health.unassigned_shards > 0}
      />
      <Pod
        icon={Hourglass}
        label="Pending Tasks"
        value={`${health.number_of_pending_tasks} Tasks`}
        subValue={health.number_of_pending_tasks > 0 ? 'Processing' : 'Queue Empty'}
      />
      <Pod icon={Activity} label="Indices" value={`${indicesCount}`} subValue="Total Indices" />
    </div>
  );
}

function Pod({
  icon: Icon,
  label,
  value,
  subValue,
  alert = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue: string;
  alert?: boolean;
}) {
  return (
    <button className="flex flex-col items-center justify-center rounded-xl bg-macos-surface/80 border border-macos-border p-6 transition-all hover:bg-macos-surface hover:scale-[1.02] active:scale-[0.98]">
      <div
        className={clsx(
          'mb-3 p-3 rounded-full bg-macos-window shadow-sm',
          alert ? 'text-macos-red' : 'text-macos-text',
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold text-macos-text">{value}</div>
        <div className="text-xs text-macos-textSecondary mt-1">{subValue}</div>
      </div>
    </button>
  );
}

function SearchView() {
  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('/_search');
  const [body, setBody] = useState('{\n  "query": {\n    "match_all": {}\n  }\n}');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      let parsedBody = null;
      if (body.trim() && method !== 'GET' && method !== 'DELETE') {
        try {
          parsedBody = JSON.parse(body);
        } catch (e) {
          setError('Invalid JSON body');
          setLoading(false);
          return;
        }
      }

      const res = await invoke('proxy_request', {
        method,
        path,
        body: parsedBody,
      });
      setResponse(JSON.stringify(res, null, 2));
    } catch (err: any) {
      setError(typeof err === 'string' ? err : JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-macos-text">Search</h1>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-none w-32">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full h-full rounded-lg border border-macos-border bg-macos-input px-3 py-2.5 text-sm font-bold text-macos-text focus:outline-none focus:ring-2 focus:ring-macos-active"
          >
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>DELETE</option>
          </select>
        </div>
        <div className="relative flex-1">
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="/_search"
            className="w-full rounded-lg border border-macos-border bg-macos-input py-2.5 px-4 font-mono text-sm text-macos-text shadow-sm focus:border-macos-active focus:outline-none focus:ring-1 focus:ring-macos-active"
          />
        </div>
        <button
          onClick={handleRun}
          disabled={loading}
          className={clsx(
            'flex items-center gap-2 rounded-lg px-6 py-2 text-white shadow-sm transition-all',
            loading
              ? 'bg-macos-textSecondary cursor-not-allowed'
              : 'bg-macos-green hover:opacity-90 active:scale-95',
          )}
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Activity className="h-4 w-4" />
          )}
          Run
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Request Body Editor */}
        <div className="flex flex-col rounded-xl border border-macos-border bg-macos-input overflow-hidden shadow-inner">
          <div className="bg-macos-surface border-b border-macos-border px-4 py-2 text-xs font-medium text-macos-textSecondary">
            Request Body (JSON)
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="flex-1 w-full resize-none bg-transparent p-4 font-mono text-sm text-macos-text focus:outline-none"
            spellCheck={false}
          />
        </div>

        {/* Response Viewer */}
        <div className="flex flex-col rounded-xl border border-macos-border bg-macos-input overflow-hidden shadow-inner">
          <div className="bg-macos-surface border-b border-macos-border px-4 py-2 text-xs font-medium text-macos-textSecondary flex justify-between">
            <span>Response</span>
            {error && <span className="text-macos-red">Error</span>}
          </div>
          <div className="flex-1 overflow-auto p-4">
            {error ? (
              <pre className="font-mono text-sm text-macos-red whitespace-pre-wrap">{error}</pre>
            ) : response ? (
              <pre className="font-mono text-sm text-macos-text whitespace-pre-wrap">
                {response}
              </pre>
            ) : (
              <div className="h-full flex items-center justify-center text-macos-textSecondary text-sm">
                No response yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CatIndex {
  health: string;
  status: string;
  index: string;
  uuid: string;
  pri: string;
  rep: string;
  'docs.count': string;
  'store.size': string;
}

function IndicesView() {
  const [indices, setIndices] = useState<CatIndex[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIndices = async () => {
      setLoading(true);
      try {
        const res = await invoke<CatIndex[]>('proxy_request', {
          method: 'GET',
          path: '/_cat/indices?format=json',
          body: null,
        });
        // Sort by name by default
        const sorted = Array.isArray(res) ? res.sort((a, b) => a.index.localeCompare(b.index)) : [];
        setIndices(sorted);
      } catch (error) {
        console.error('Failed to fetch indices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIndices();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-macos-active border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 flex-none">
        <h1 className="text-2xl font-bold text-macos-text">Indices</h1>
        <div className="flex gap-2">
          <button className="p-2 rounded-md hover:bg-macos-surface text-macos-textSecondary">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 rounded-xl border border-macos-border bg-macos-surface overflow-hidden shadow-sm min-h-0 flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-macos-window/50 sticky top-0 backdrop-blur-sm z-10">
              <tr>
                <th className="px-6 py-3 font-medium text-macos-textSecondary">Name</th>
                <th className="px-6 py-3 font-medium text-macos-textSecondary">Health</th>
                <th className="px-6 py-3 font-medium text-macos-textSecondary">Status</th>
                <th className="px-6 py-3 font-medium text-macos-textSecondary">Docs</th>
                <th className="px-6 py-3 font-medium text-macos-textSecondary">Size</th>
                <th className="px-6 py-3 font-medium text-macos-textSecondary">Pri / Rep</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-macos-border">
              {indices.map((idx) => (
                <tr key={idx.index} className="hover:bg-macos-active/5 transition-colors group">
                  <td className="px-6 py-3 font-medium text-macos-text">{idx.index}</td>
                  <td className="px-6 py-3">
                    <span
                      className={clsx(
                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                        idx.health === 'green'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : idx.health === 'yellow'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                      )}
                    >
                      {idx.health}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-macos-textSecondary">{idx.status}</td>
                  <td className="px-6 py-3 text-macos-textSecondary">
                    {parseInt(idx['docs.count']).toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-macos-textSecondary">{idx['store.size']}</td>
                  <td className="px-6 py-3 text-macos-textSecondary">
                    {idx.pri} / {idx.rep}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
