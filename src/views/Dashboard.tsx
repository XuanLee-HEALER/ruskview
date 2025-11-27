import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { Sidebar } from '../components/Sidebar';
import { invoke } from '@tauri-apps/api/core';
import { Activity, Database, FileText, HardDrive, Server } from 'lucide-react';
import clsx from 'clsx';

interface ClusterHealth {
  status: 'green' | 'yellow' | 'red';
  cluster_name: string;
  number_of_nodes: number;
  active_shards: number;
  unassigned_shards: number;
}

interface ClusterStats {
  indices: {
    count: number;
  };
  _all: {
    primaries: {
      docs: {
        count: number;
      };
      store: {
        size_in_bytes: number;
      };
    };
  };
}

export function Dashboard() {
  const currentView = useAppStore((state) => state.currentView);

  return (
    <div className="flex h-screen w-full bg-macos-window">
      <div className="absolute top-0 left-0 w-full h-8 z-50" data-tauri-drag-region />
      <Sidebar />
      <main className="flex-1 overflow-auto p-6 pt-10">
        {currentView === 'cluster' && <ClusterView />}
        {currentView === 'search' && <SearchView />}
        {currentView === 'indices' && <IndicesView />}
      </main>
    </div>
  );
}

function ClusterView() {
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="h-full">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'h-3 w-3 rounded-full shadow-sm',
              health.status === 'green' && 'bg-green-500',
              health.status === 'yellow' && 'bg-yellow-500',
              health.status === 'red' && 'bg-red-500',
            )}
          />
          <h1 className="text-2xl font-semibold text-macos-text">{health.cluster_name}</h1>
        </div>
        <p className="mt-1 text-sm text-macos-textSecondary">
          {health.number_of_nodes} Nodes • {health.active_shards} Active Shards
        </p>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Indices"
          value={stats.indices?.count?.toLocaleString() ?? 'N/A'}
          icon={<Database className="h-5 w-5 text-blue-500" />}
        />
        <MetricCard
          title="Documents"
          value={stats._all?.primaries?.docs?.count?.toLocaleString() ?? 'N/A'}
          icon={<FileText className="h-5 w-5 text-green-500" />}
        />
        <MetricCard
          title="Store Size"
          value={
            stats._all?.primaries?.store?.size_in_bytes
              ? formatBytes(stats._all.primaries.store.size_in_bytes)
              : 'N/A'
          }
          icon={<HardDrive className="h-5 w-5 text-purple-500" />}
        />
        <MetricCard
          title="Nodes"
          value={health.number_of_nodes?.toString() ?? 'N/A'}
          icon={<Server className="h-5 w-5 text-orange-500" />}
        />
      </div>

      {/* Secondary Info / Charts Placeholder */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-macos-border bg-macos-input p-4 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-macos-text">
            <Activity className="h-4 w-4" />
            Shard Allocation
          </h3>
          <div className="flex h-40 items-center justify-center text-sm text-macos-textSecondary">
            {/* Placeholder for Pie Chart */}
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-semibold text-green-500">{health.active_shards}</div>
                <div className="text-xs">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-yellow-500">
                  {health.unassigned_shards}
                </div>
                <div className="text-xs">Unassigned</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions / More Info */}
        <div className="grid grid-cols-2 gap-4">
          <ActionTile title="Cluster Settings" />
          <ActionTile title="Node Stats" />
          <ActionTile title="Pending Tasks" />
          <ActionTile title="Repositories" />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-macos-border bg-macos-input p-4 shadow-sm transition-all hover:bg-macos-sidebar">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-macos-textSecondary">{title}</p>
          <p className="mt-1 text-xl font-semibold text-macos-text">{value}</p>
        </div>
        <div className="rounded-lg bg-macos-window p-2">{icon}</div>
      </div>
    </div>
  );
}

function ActionTile({ title }: { title: string }) {
  return (
    <button className="flex h-full w-full items-center justify-center rounded-xl border border-macos-border bg-macos-input p-4 text-sm font-medium text-macos-text shadow-sm transition-all hover:bg-macos-active hover:text-white">
      {title}
    </button>
  );
}

function SearchView() {
  return (
    <div className="flex h-full flex-col">
      <h1 className="mb-4 text-2xl font-bold text-macos-text">Search</h1>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="GET /_search"
          className="flex-1 rounded-md border border-macos-border bg-macos-input p-2 font-mono text-sm text-macos-text focus:border-macos-active focus:outline-none focus:ring-1 focus:ring-macos-active"
        />
        <button className="rounded-md bg-macos-active px-4 py-2 text-white hover:bg-macos-activeHover">
          Run
        </button>
      </div>
      <div className="flex-1 rounded-lg border border-macos-border bg-macos-canvas p-4 font-mono text-sm text-macos-text">
        {/* JSON Editor Placeholder */}
        <pre>{'{}'}</pre>
      </div>
    </div>
  );
}

function IndicesView() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-macos-text">Indices</h1>
      <table className="w-full text-left text-sm text-macos-text">
        <thead>
          <tr className="border-b border-macos-border">
            <th className="pb-2 font-medium text-macos-textSecondary">Name</th>
            <th className="pb-2 font-medium text-macos-textSecondary">Health</th>
            <th className="pb-2 font-medium text-macos-textSecondary">Docs</th>
            <th className="pb-2 font-medium text-macos-textSecondary">Size</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-macos-border/50">
            <td className="py-3">logs-2024-01</td>
            <td className="py-3 text-green-500">green</td>
            <td className="py-3">1,204,500</td>
            <td className="py-3">4.2 GB</td>
          </tr>
          <tr className="border-b border-macos-border/50">
            <td className="py-3">logs-2024-02</td>
            <td className="py-3 text-green-500">green</td>
            <td className="py-3">850,200</td>
            <td className="py-3">2.8 GB</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
