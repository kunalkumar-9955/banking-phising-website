'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { adminApi } from '@/lib/api';

export default function AdminPanel() {
  const { user, token, isLoading, logout } = useAuth();
  const router = useRouter();
  const [activePage, setActivePage] = useState('overview');
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([]);
  const [blockedDomains, setBlockedDomains] = useState<Array<{ id: string; domain: string; reason?: string }>>([]);
  const [newDomain, setNewDomain] = useState('');
  const [newDomainReason, setNewDomainReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
      return;
    }
    if (token && user?.role === 'admin') loadData();
  }, [isLoading, user, token]);

  const loadData = async () => {
    if (!token) return;
    try {
      const [statsData, usersData, domainsData] = await Promise.all([
        adminApi.getStats(token),
        adminApi.getUsers(token),
        adminApi.getBlockedDomains(token),
      ]);
      setStats(statsData);
      setUsers(usersData.users || []);
      setBlockedDomains(domainsData.domains || []);
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    if (!token) return;
    setRetraining(true);
    try {
      await adminApi.retrainModel(token);
      alert('Model retrained successfully!');
      loadData();
    } catch {
      alert('Retraining failed');
    } finally {
      setRetraining(false);
    }
  };

  const handleBlockDomain = async () => {
    if (!newDomain.trim() || !token) return;
    try {
      await adminApi.addBlockedDomain(token, newDomain, newDomainReason);
      setNewDomain('');
      setNewDomainReason('');
      const data = await adminApi.getBlockedDomains(token);
      setBlockedDomains(data.domains || []);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleUnblock = async (id: string) => {
    if (!token) return;
    try {
      await adminApi.removeBlockedDomain(token, id);
      setBlockedDomains(blockedDomains.filter((d) => d.id !== id));
    } catch {
      alert('Failed');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Delete this user and all their data?') || !token) return;
    try {
      await adminApi.deleteUser(token, userId);
      setUsers(users.filter((u) => u.id !== userId));
    } catch {
      alert('Failed');
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400">Loading admin panel...</span>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'domains', label: 'Blocked Domains', icon: '🚫' },
    { id: 'model', label: 'ML Model', icon: '🧠' },
    { id: 'scans', label: 'All Scans', icon: '🔍' },
  ];

  return (
    <div className="min-h-screen gradient-mesh flex">
      {/* Sidebar */}
      <aside className="w-64 min-h-screen glass-card rounded-none border-r border-purple-500/10 flex flex-col">
        <Link href="/" className="flex items-center gap-3 p-6 border-b border-gray-800/50">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-xs font-bold">👑</div>
          <span className="font-bold text-white">Admin Panel</span>
        </Link>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
                activePage === item.id
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <Link href="/dashboard" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-cyan-400 hover:bg-cyan-500/10 transition-all border border-cyan-500/20 mt-4">
            <span>←</span>
            Back to Dashboard
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800/50">
          <button onClick={() => { logout(); router.push('/'); }} className="text-red-400 hover:text-red-300 text-sm">Sign Out</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">

          {/* Overview */}
          {activePage === 'overview' && stats && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-white">📊 Admin Overview</h1>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: stats.total_users, icon: '👥', color: 'cyan' },
                  { label: 'Total Scans', value: stats.total_scans, icon: '🔍', color: 'blue' },
                  { label: 'Phishing Today', value: stats.phishing_today, icon: '🚨', color: 'red' },
                  { label: 'Blocked Domains', value: stats.blocked_domains, icon: '🚫', color: 'purple' },
                ].map((stat, i) => (
                  <div key={i} className="glass-card-hover p-6">
                    <div className="text-2xl mb-2">{stat.icon}</div>
                    <div className="text-3xl font-bold text-white">{stat.value as number}</div>
                    <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Today's Breakdown */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="glass-card p-6 text-center border border-green-500/20">
                  <div className="text-2xl font-bold text-green-400">{stats.legitimate_today as number}</div>
                  <div className="text-sm text-gray-400">Legitimate Today</div>
                </div>
                <div className="glass-card p-6 text-center border border-orange-500/20">
                  <div className="text-2xl font-bold text-orange-400">{stats.suspicious_today as number}</div>
                  <div className="text-sm text-gray-400">Suspicious Today</div>
                </div>
                <div className="glass-card p-6 text-center border border-red-500/20">
                  <div className="text-2xl font-bold text-red-400">{stats.phishing_today as number}</div>
                  <div className="text-sm text-gray-400">Phishing Today</div>
                </div>
              </div>

              {/* Weekly Trends */}
              {(stats.weekly_trends as Array<Record<string, unknown>>)?.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">📈 Weekly Trends</h3>
                  <div className="flex items-end gap-2 h-40">
                    {(stats.weekly_trends as Array<{date: string; total: number; phishing: number}>)?.map((day, i) => {
                      const maxVal = Math.max(...(stats.weekly_trends as Array<{total: number}>).map((d) => d.total), 1);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="text-xs text-gray-500">{day.total}</div>
                          <div className="w-full flex flex-col gap-0.5" style={{ height: `${Math.max((day.total / maxVal) * 100, 5)}%` }}>
                            <div className="flex-1 bg-gradient-to-t from-cyan-500/50 to-cyan-400/30 rounded-t" />
                            {day.phishing > 0 && (
                              <div className="bg-red-500/60 rounded-b" style={{ height: `${(day.phishing / Math.max(day.total, 1)) * 100}%`, minHeight: '4px' }} />
                            )}
                          </div>
                          <div className="text-xs text-gray-600">{new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">🕐 Recent Scans</h3>
                <div className="space-y-2">
                  {(stats.recent_scans as Array<Record<string, unknown>>)?.slice(0, 5).map((scan, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
                      <span className="text-sm text-gray-300 font-mono truncate max-w-xs">{scan.url as string}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        scan.status === 'phishing' ? 'status-badge-phishing' :
                        scan.status === 'suspicious' ? 'status-badge-suspicious' :
                        'status-badge-safe'
                      }`}>{scan.status as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* User Management */}
          {activePage === 'users' && (
            <div>
              <h1 className="text-2xl font-bold text-white mb-6">👥 User Management</h1>
              <div className="glass-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400">
                      <th className="text-left p-4">User</th>
                      <th className="text-left p-4">Role</th>
                      <th className="text-center p-4">Scans</th>
                      <th className="text-left p-4">Joined</th>
                      <th className="text-right p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id as string} className="border-b border-gray-800/50 hover:bg-white/5">
                        <td className="p-4">
                          <div className="text-white font-medium">{u.name as string}</div>
                          <div className="text-xs text-gray-500">{u.email as string}</div>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}`}>
                            {u.role as string}
                          </span>
                        </td>
                        <td className="p-4 text-center text-white">{u.scan_count as number}</td>
                        <td className="p-4 text-gray-400 text-xs">{new Date(u.created_at as string).toLocaleDateString()}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => handleDeleteUser(u.id as string)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Blocked Domains */}
          {activePage === 'domains' && (
            <div>
              <h1 className="text-2xl font-bold text-white mb-6">🚫 Blocked Domains</h1>

              {/* Add Domain */}
              <div className="glass-card p-6 mb-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Add Domain to Blocklist</h3>
                <div className="flex gap-3">
                  <input type="text" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} className="neon-input flex-1" placeholder="malicious-domain.com" />
                  <input type="text" value={newDomainReason} onChange={(e) => setNewDomainReason(e.target.value)} className="neon-input flex-1" placeholder="Reason (optional)" />
                  <button onClick={handleBlockDomain} className="neon-btn neon-btn-filled">Block</button>
                </div>
              </div>

              {/* List */}
              <div className="space-y-2">
                {blockedDomains.map((d) => (
                  <div key={d.id as string} className="glass-card p-4 flex items-center justify-between">
                    <div>
                      <span className="text-sm text-red-400 font-mono">{d.domain as string}</span>
                      {d.reason && <span className="text-xs text-gray-500 ml-3">{d.reason as string}</span>}
                    </div>
                    <button onClick={() => handleUnblock(d.id as string)} className="text-xs text-gray-400 hover:text-green-400">Unblock</button>
                  </div>
                ))}
                {blockedDomains.length === 0 && (
                  <div className="glass-card p-8 text-center text-gray-500">No blocked domains yet</div>
                )}
              </div>
            </div>
          )}

          {/* ML Model */}
          {activePage === 'model' && (
            <div>
              <h1 className="text-2xl font-bold text-white mb-6">🧠 ML Model Management</h1>

              <div className="glass-card p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Model Statistics</h3>
                {stats && (stats.model_stats as Record<string, unknown>) && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(stats.model_stats as Record<string, unknown>).filter(([k]) => k !== 'rules_per_class').map(([key, val]) => (
                      <div key={key} className="bg-gray-800/50 rounded-lg p-4">
                        <div className="text-xs text-gray-400 mb-1 capitalize">{key.replace(/_/g, ' ')}</div>
                        <div className="text-lg font-bold text-white">{String(val)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Retrain Model</h3>
                <p className="text-gray-400 text-sm mb-4">Retrain the Associative Classification model with the latest data.</p>
                <button onClick={handleRetrain} disabled={retraining} className="neon-btn neon-btn-filled disabled:opacity-50">
                  {retraining ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                      Retraining...
                    </div>
                  ) : '🔄 Retrain Model'}
                </button>
              </div>
            </div>
          )}

          {/* All Scans */}
          {activePage === 'scans' && <AllScansView token={token!} />}
        </div>
      </main>
    </div>
  );
}

function AllScansView({ token }: { token: string }) {
  const [scans, setScans] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScans();
  }, [token]);

  const loadScans = async () => {
    try {
      const data = await adminApi.getAllScans(token);
      setScans(data.scans || []);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="glass-card p-8 text-center text-gray-400">Loading scans...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">🔍 All Scans</h1>
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400">
              <th className="text-left p-4">URL</th>
              <th className="text-left p-4">Status</th>
              <th className="text-right p-4">Confidence</th>
              <th className="text-left p-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {scans.map((scan) => (
              <tr key={scan.id as string} className="border-b border-gray-800/50 hover:bg-white/5">
                <td className="p-4 font-mono text-xs text-gray-300 max-w-xs truncate">{scan.url as string}</td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    scan.status === 'phishing' ? 'status-badge-phishing' :
                    scan.status === 'suspicious' ? 'status-badge-suspicious' :
                    'status-badge-safe'
                  }`}>{scan.status as string}</span>
                </td>
                <td className="p-4 text-right text-white">{(scan.confidence as number)?.toFixed(1)}%</td>
                <td className="p-4 text-xs text-gray-400">{new Date(scan.created_at as string).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {scans.length === 0 && <div className="p-8 text-center text-gray-500">No scans yet</div>}
      </div>
    </div>
  );
}
