'use client';

import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Activity,
  Map,
  Award,
  ClipboardCheck,
  FileText,
  Globe,
  Shield,
  Search,
  Bell,
  Menu,
  X,
  ChevronRight,
  Settings,
  Users,
  Key,
  CheckCheck,
  AlertTriangle,
  Info,
  XCircle,
  Zap,
} from 'lucide-react';
import { DashboardDG } from './dashboard-dg';
import { DashboardQoS } from './dashboard-qos';
import { DashboardSIG } from './dashboard-sig';
import { DashboardScoring } from './dashboard-scoring';
import { DashboardAudit } from './dashboard-audit';
import { DashboardReports } from './dashboard-reports';
import { DashboardPublic } from './dashboard-public';
import { DashboardCyber } from './dashboard-cyber';
import { DashboardAdmin } from './dashboard-admin';
import { ErrorBoundary } from './error-boundary';
import { UserMenu } from './user-menu';
import { useSession } from 'next-auth/react';

const navTabs = [
  { id: 'dashboard', label: 'Tableau de Bord', icon: 'LayoutDashboard', requireAuth: true, minRole: null },
  { id: 'qos', label: 'Monitoring QoS', icon: 'Activity', requireAuth: true, minRole: null },
  { id: 'sig', label: 'Cartographie SIG', icon: 'Map', requireAuth: true, minRole: null },
  { id: 'scoring', label: 'Scoring Opérateurs', icon: 'Award', requireAuth: true, minRole: null },
  { id: 'audit', label: 'Audit Terrain', icon: 'ClipboardCheck', requireAuth: true, minRole: null },
  { id: 'reports', label: 'Rapports', icon: 'FileText', requireAuth: true, minRole: null },
  { id: 'public', label: 'Portail Public', icon: 'Globe', requireAuth: false, minRole: null },
  { id: 'cyber', label: 'Cybersécurité', icon: 'Shield', requireAuth: true, minRole: 'DIRECTEUR_TECHNIQUE' },
  { id: 'admin', label: 'Administration', icon: 'Users', requireAuth: true, minRole: 'SUPER_ADMIN' },
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Activity, Map, Award, ClipboardCheck, FileText, Globe, Shield, Users,
};

type TabId = 'dashboard' | 'qos' | 'sig' | 'scoring' | 'audit' | 'reports' | 'public' | 'cyber' | 'admin';

const dashboardComponents: Record<string, React.ComponentType> = {
  dashboard: DashboardDG,
  qos: DashboardQoS,
  sig: DashboardSIG,
  scoring: DashboardScoring,
  audit: DashboardAudit,
  reports: DashboardReports,
  public: DashboardPublic,
  cyber: DashboardCyber,
  admin: DashboardAdmin,
};

const rolePriority: Record<string, number> = {
  SUPER_ADMIN: 100, DG: 90, DGA: 80, DIRECTEUR_TECHNIQUE: 70,
  INGENIEUR_RF: 60, ANALYSTE_QOS: 50, AUDITEUR: 40, OPERATEUR_READONLY: 20, PUBLIC: 10,
};

interface AlertItem {
  id: string;
  type: string;
  severity: string;
  operator?: string;
  region?: string;
  message: string;
  isResolved: boolean;
  createdAt: string;
}

interface OnitLayoutProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function OnitLayout({ activeTab, onTabChange }: OnitLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  const userRole = (session?.user as Record<string, unknown>)?.role as string;
  const userRolePriority = rolePriority[userRole] || 0;

  const filteredTabs = navTabs.filter((tab) => {
    if (tab.requireAuth && !session) return false;
    if (tab.minRole && userRolePriority < (rolePriority[tab.minRole] || 0)) return false;
    return true;
  });

  const ActiveDashboard = dashboardComponents[activeTab] || DashboardDG;

  // Hydration-safe mount
  useEffect(() => { setMounted(true); }, []);

  // Fetch alerts for notifications
  useEffect(() => {
    if (!session) return;
    async function fetchAlerts() {
      try {
        const res = await fetch('/api/alerts');
        if (res.ok) {
          const data = await res.json();
          const alertList = (data.alerts || []) as AlertItem[];
          setAlerts(alertList);
          setUnreadCount(alertList.filter((a) => !a.isResolved).length);
        }
      } catch (err) {
        console.error('Alerts fetch error:', err);
      }
    }
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [session]);

  // Close notification dropdown on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const unresolved = alerts.filter((a) => !a.isResolved);
      await Promise.all(
        unresolved.map((alert) =>
          fetch('/api/alerts', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: alert.id }),
          })
        )
      );
      setAlerts((prev) => prev.map((a) => ({ ...a, isResolved: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const getAlertIcon = (severity: string) => {
    if (severity === 'CRITIQUE') return <XCircle className="h-4 w-4 text-red-400" />;
    if (severity === 'HAUTE') return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    return <Info className="h-4 w-4 text-blue-400" />;
  };

  const getAlertBg = (severity: string) => {
    if (severity === 'CRITIQUE') return 'bg-red-500/5 border-red-500/20';
    if (severity === 'HAUTE') return 'bg-amber-500/5 border-amber-500/20';
    return 'bg-blue-500/5 border-blue-500/20';
  };

  const formatAlertTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 60) return `Il y a ${minutes} min`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `Il y a ${hours}h`;
      return `Il y a ${Math.floor(hours / 24)}j`;
    } catch {
      return '';
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in-up"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-[#0A0F1E] to-[#0D1325] border-r border-white/[0.06] transform transition-all duration-300 ease-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0 shadow-2xl shadow-black/50' : '-translate-x-full'}`}>
        {/* Logo Section */}
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#D4A843] to-[#B8922E] flex items-center justify-center shadow-lg shadow-[#D4A843]/20 transition-transform duration-300 hover:scale-105">
              <span className="text-[#0A0F1E] font-bold text-sm">ON</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-50 tracking-tight">ONIT-PNG</h1>
              <p className="text-[10px] text-slate-500 leading-tight">Observatoire National<br />Intelligent des Télécom</p>
            </div>
          </div>
          <div className="mt-3 h-px bg-gradient-to-r from-[#D4A843]/60 via-[#D4A843]/20 to-transparent" />
          {session && userRole && (
            <div className="mt-3 flex items-center gap-2 animate-slide-in-left">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-[#D4A843]/10 text-[#D4A843] border border-[#D4A843]/20">
                <Key className="h-2.5 w-2.5" />
                {userRole.replace(/_/g, ' ')}
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-0.5 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {filteredTabs.map((tab, index) => {
            const Icon = iconMap[tab.icon];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { onTabChange(tab.id as TabId); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group animate-stagger-in ${isActive ? 'bg-gradient-to-r from-[#D4A843]/15 to-[#D4A843]/5 text-[#D4A843] border border-[#D4A843]/20 shadow-sm shadow-[#D4A843]/10' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 border border-transparent'}`}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                {Icon && (
                  <div className={`relative p-1 rounded-md transition-colors ${isActive ? 'bg-[#D4A843]/10' : 'group-hover:bg-white/5'}`}>
                    <Icon className={`h-3.5 w-3.5 transition-colors ${isActive ? 'text-[#D4A843]' : 'text-slate-500 group-hover:text-slate-400'}`} />
                    {isActive && <div className="absolute -left-1 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-[#D4A843]" />}
                  </div>
                )}
                <span className="font-medium text-xs">{tab.label}</span>
                {isActive && <ChevronRight className="h-3 w-3 ml-auto text-[#D4A843]/60" />}
              </button>
            );
          })}
        </nav>

        {/* Bottom User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/[0.06] bg-[#0A0F1E]/80 backdrop-blur-sm">
          {session ? (
            <UserMenu />
          ) : (
            <div className="p-2.5 rounded-lg bg-white/[0.03] text-center">
              <p className="text-xs text-slate-400">Non connecté</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-14 bg-[#0A0F1E]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-slate-400 transition-colors">
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <span className="font-medium">ONIT-PNG</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-slate-300">{navTabs.find((t) => t.id === activeTab)?.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 ${searchFocused ? 'bg-white/10 border-[#D4A843]/30 ring-1 ring-[#D4A843]/10' : 'bg-white/[0.03] border-white/[0.06]'}`}>
              <Search className={`h-3.5 w-3.5 transition-colors ${searchFocused ? 'text-[#D4A843]' : 'text-slate-500'}`} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-slate-300 placeholder-slate-600 focus:outline-none w-44 transition-all"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-slate-300 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className={`relative p-2 rounded-lg hover:bg-white/10 transition-all duration-200 ${notifOpen ? 'bg-white/10 text-slate-200' : 'text-slate-400 hover:text-slate-300'}`}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 h-4 min-w-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center px-0.5 animate-scale-in shadow-sm shadow-red-500/50">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-[#1E293B]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40 z-50 overflow-hidden animate-scale-in">
                  <div className="p-3 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                      <Bell className="h-4 w-4 text-[#D4A843]" />
                      Alertes
                      {unreadCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">{unreadCount}</span>}
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1 text-[10px] text-[#D4A843] hover:text-[#D4A843]/80 transition-colors"
                      >
                        <CheckCheck className="h-3 w-3" />
                        Tout marquer lu
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {alerts.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-xs text-slate-500">Aucune alerte</p>
                        <p className="text-[10px] text-slate-600 mt-1">Les alertes apparaîtront ici</p>
                      </div>
                    ) : (
                      alerts.slice(0, 10).map((alert, i) => (
                        <div
                          key={alert.id}
                          className={`p-3 border-b border-white/5 transition-colors hover:bg-white/5 ${!alert.isResolved ? 'bg-white/[0.02]' : ''} animate-stagger-in`}
                          style={{ animationDelay: `${i * 30}ms` }}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`mt-0.5 p-1 rounded-md ${getAlertBg(alert.severity)}`}>
                              {getAlertIcon(alert.severity)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-200 truncate">{alert.message}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {alert.operator && <span className="text-[10px] text-slate-500">{alert.operator}</span>}
                                {alert.region && <span className="text-[10px] text-slate-500">• {alert.region}</span>}
                              </div>
                              <p className="text-[10px] text-slate-600 mt-0.5">{formatAlertTime(alert.createdAt)}</p>
                            </div>
                            {!alert.isResolved && <div className="h-2 w-2 rounded-full bg-red-400 flex-shrink-0 mt-1 animate-pulse" />}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-medium">Live</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <ErrorBoundary key={activeTab}>
            <ActiveDashboard />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
