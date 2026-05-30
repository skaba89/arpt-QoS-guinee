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
import { cn } from '@/lib/utils';

/* ─── Navigation Definition with Section Grouping ─── */

interface NavTab {
  id: string;
  label: string;
  icon: string;
  requireAuth: boolean;
  minRole: string | null;
  section: string;
}

const navTabs: NavTab[] = [
  // SUPERVISION
  { id: 'dashboard', label: 'Tableau de Bord', icon: 'LayoutDashboard', requireAuth: true, minRole: null, section: 'SUPERVISION' },
  { id: 'qos', label: 'Monitoring QoS', icon: 'Activity', requireAuth: true, minRole: null, section: 'SUPERVISION' },
  // ANALYSE
  { id: 'sig', label: 'Cartographie SIG', icon: 'Map', requireAuth: true, minRole: null, section: 'ANALYSE' },
  { id: 'scoring', label: 'Scoring Opérateurs', icon: 'Award', requireAuth: true, minRole: null, section: 'ANALYSE' },
  { id: 'audit', label: 'Audit Terrain', icon: 'ClipboardCheck', requireAuth: true, minRole: null, section: 'ANALYSE' },
  { id: 'reports', label: 'Rapports', icon: 'FileText', requireAuth: true, minRole: null, section: 'ANALYSE' },
  // ADMINISTRATION
  { id: 'cyber', label: 'Cybersécurité', icon: 'Shield', requireAuth: true, minRole: 'DIRECTEUR_TECHNIQUE', section: 'ADMINISTRATION' },
  { id: 'admin', label: 'Administration', icon: 'Users', requireAuth: true, minRole: 'SUPER_ADMIN', section: 'ADMINISTRATION' },
  // PUBLIC
  { id: 'public', label: 'Portail Public', icon: 'Globe', requireAuth: false, minRole: null, section: 'PUBLIC' },
];

const sectionOrder = ['SUPERVISION', 'ANALYSE', 'ADMINISTRATION', 'PUBLIC'];

const sectionDescriptions: Record<string, string> = {
  SUPERVISION: 'Temps réel',
  ANALYSE: 'Données & insights',
  ADMINISTRATION: 'Gestion & sécurité',
  PUBLIC: 'Portail citoyen',
};

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
  const [currentDate, setCurrentDate] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  const userRole = (session?.user as Record<string, unknown>)?.role as string;
  const userRolePriority = rolePriority[userRole] || 0;

  const filteredTabs = navTabs.filter((tab) => {
    if (tab.requireAuth && !session) return false;
    if (tab.minRole && userRolePriority < (rolePriority[tab.minRole] || 0)) return false;
    return true;
  });

  // Group filtered tabs by section
  const groupedTabs = sectionOrder
    .map((section) => ({
      section,
      tabs: filteredTabs.filter((t) => t.section === section),
    }))
    .filter((group) => group.tabs.length > 0);

  const ActiveDashboard = dashboardComponents[activeTab] || DashboardDG;

  // Hydration-safe mount
  useEffect(() => { setMounted(true); }, []);

  // French date in header
  useEffect(() => {
    const updateDate = () => {
      setCurrentDate(
        new Date().toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    };
    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="min-h-screen bg-[#080C1A] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════
          SIDEBAR — Institutional Government Design (w-72)
          ═══════════════════════════════════════════════════════════ */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[280px] guinea-stripe-top',
          'bg-gradient-to-b from-[#080C1A] via-[#0B1120] to-[#0D1425]',
          'border-r border-white/[0.05]',
          'transform transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]',
          'lg:relative lg:translate-x-0 flex flex-col',
          sidebarOpen
            ? 'translate-x-0 shadow-2xl shadow-black/60'
            : '-translate-x-full'
        )}
      >
        {/* ─── LOGO SECTION ─── */}
        <div className="px-6 pt-8 pb-6 border-b border-white/[0.05]">
          {/* ARPT Crest */}
          <div className="flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-full border-2 border-[#D4A843]/35 p-1 mb-4 shadow-lg shadow-[#D4A843]/8 bg-gradient-to-br from-[#D4A843]/8 to-transparent">
              <img
                src="/arpt-crest.png"
                alt="Armoiries de la République de Guinée"
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#D4A843]/60 mb-1.5">
              République de Guinée
            </p>
            <h1 className="text-xl font-bold text-slate-50 tracking-tight leading-none">
              ONIT-PNG
            </h1>
            <p className="text-[9px] text-slate-500 leading-snug mt-1.5 max-w-[200px]">
              Observatoire National Intelligent des Télécommunications
            </p>

            {/* Gold separator */}
            <div className="mt-5 w-full h-px bg-gradient-to-r from-transparent via-[#D4A843]/40 to-transparent" />

            {/* Role badge */}
            {session && userRole && (
              <div className="mt-4 animate-slide-in-left">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-medium bg-[#D4A843]/8 text-[#D4A843] border border-[#D4A843]/15">
                  <Key className="h-2.5 w-2.5" />
                  {userRole.replace(/_/g, ' ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ─── NAVIGATION ─── */}
        <nav className="flex-1 px-4 py-5 overflow-y-auto custom-scrollbar space-y-6">
          {groupedTabs.map((group) => (
            <div key={group.section}>
              {/* Section header */}
              <div className="flex items-center gap-2 mb-3 px-2">
                <span className="h-1 w-5 rounded-full bg-gradient-to-r from-[#D4A843]/60 to-transparent" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {group.section}
                </span>
                <span className="text-[9px] text-slate-600 hidden lg:inline">
                  — {sectionDescriptions[group.section]}
                </span>
              </div>
              {/* Section nav items */}
              <div className="space-y-1">
                {group.tabs.map((tab) => {
                  const Icon = iconMap[tab.icon];
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        onTabChange(tab.id as TabId);
                        setSidebarOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-300 group',
                        isActive
                          ? 'bg-[#D4A843]/8 text-[#D4A843] shadow-sm shadow-[#D4A843]/3'
                          : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                      )}
                      style={isActive ? {
                        borderLeft: '2px solid rgba(212,168,67,0.6)',
                        paddingLeft: 'calc(0.75rem - 2px)',
                      } : {
                        borderLeft: '2px solid transparent',
                      }}
                    >
                      {Icon && (
                        <div
                          className={cn(
                            'p-1.5 rounded-md transition-all duration-300',
                            isActive
                              ? 'bg-[#D4A843]/12'
                              : 'group-hover:bg-white/[0.04]'
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-4 w-4 transition-colors duration-300',
                              isActive
                                ? 'text-[#D4A843]'
                                : 'text-slate-500 group-hover:text-slate-300'
                            )}
                          />
                        </div>
                      )}
                      <span className={cn(
                        "font-medium text-[13px] tracking-wide",
                        isActive ? 'text-[#D4A843]' : ''
                      )}>{tab.label}</span>
                      {isActive && (
                        <ChevronRight className="h-3.5 w-3.5 ml-auto text-[#D4A843]/50" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ─── BOTTOM: User Menu + Institutional Footer ─── */}
        <div className="border-t border-white/[0.05] bg-[#080C1A]/90 backdrop-blur-sm">
          {/* User menu */}
          <div className="p-4">
            {session ? (
              <UserMenu />
            ) : (
              <div className="p-3 rounded-xl bg-white/[0.03] text-center border border-white/[0.04]">
                <p className="text-xs text-slate-400">Non connecté</p>
              </div>
            )}
          </div>
          {/* Institutional footer */}
          <div className="px-5 pb-4 pt-1 border-t border-white/[0.04]">
            <p className="text-[9px] text-slate-600 text-center tracking-wider">
              ARPT Guinée &copy; 2026
            </p>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════
          MAIN CONTENT AREA
          ═══════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* ─── HEADER (h-16) ─── */}
        <header className="h-16 bg-[#080C1A]/85 backdrop-blur-2xl border-b border-white/[0.05] flex items-center justify-between px-5 lg:px-8 sticky top-0 z-30">
          {/* LEFT: Hamburger + Breadcrumb */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/[0.06] text-slate-400 transition-colors"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="hidden sm:flex items-center gap-2.5">
              <span className="text-[11px] font-bold text-[#D4A843]/70 tracking-[0.08em] uppercase">ONIT-PNG</span>
              <ChevronRight className="h-3 w-3 text-slate-600" />
              <span className="text-[13px] text-slate-300 font-medium">
                {navTabs.find((t) => t.id === activeTab)?.label}
              </span>
            </div>
          </div>

          {/* CENTER: French Date */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium capitalize tracking-wide">
              {currentDate}
            </span>
          </div>

          {/* RIGHT: Search + Notifications + Live */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div
              className={cn(
                'hidden md:flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-all duration-300',
                searchFocused
                  ? 'bg-white/[0.06] border-[#D4A843]/25 ring-1 ring-[#D4A843]/8'
                  : 'bg-white/[0.03] border-white/[0.05]'
              )}
            >
              <Search
                className={cn(
                  'h-3.5 w-3.5 transition-colors duration-300',
                  searchFocused ? 'text-[#D4A843]' : 'text-slate-500'
                )}
              />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-slate-300 placeholder-slate-600 focus:outline-none w-48 transition-all"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className={cn(
                  'relative p-2 rounded-xl hover:bg-white/[0.06] transition-all duration-300',
                  notifOpen
                    ? 'bg-white/[0.06] text-slate-200'
                    : 'text-slate-400 hover:text-slate-300'
                )}
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 h-4 min-w-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center px-0.5 animate-scale-in shadow-sm shadow-red-500/40">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2.5 w-84 rounded-xl bg-[#131B30]/95 backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/50 z-50 overflow-hidden animate-scale-in">
                  <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                      <Bell className="h-4 w-4 text-[#D4A843]" />
                      Alertes
                      {unreadCount > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">
                          {unreadCount}
                        </span>
                      )}
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
                      <div className="p-10 text-center">
                        <Bell className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-xs text-slate-500">Aucune alerte</p>
                        <p className="text-[10px] text-slate-600 mt-1">
                          Les alertes apparaîtront ici
                        </p>
                      </div>
                    ) : (
                      alerts.slice(0, 10).map((alert, i) => (
                        <div
                          key={alert.id}
                          className={cn(
                            'p-3.5 border-b border-white/[0.04] transition-colors hover:bg-white/[0.03]',
                            !alert.isResolved && 'bg-white/[0.015]'
                          )}
                          style={{ animationDelay: `${i * 30}ms` }}
                        >
                          <div className="flex items-start gap-2.5">
                            <div
                              className={`mt-0.5 p-1 rounded-md ${getAlertBg(alert.severity)}`}
                            >
                              {getAlertIcon(alert.severity)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-200 truncate">
                                {alert.message}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {alert.operator && (
                                  <span className="text-[10px] text-slate-500">
                                    {alert.operator}
                                  </span>
                                )}
                                {alert.region && (
                                  <span className="text-[10px] text-slate-500">
                                    &bull; {alert.region}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-600 mt-0.5">
                                {formatAlertTime(alert.createdAt)}
                              </p>
                            </div>
                            {!alert.isResolved && (
                              <div className="h-2 w-2 rounded-full bg-red-400 flex-shrink-0 mt-1 animate-pulse" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Live Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/[0.08] border border-emerald-500/15">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wide">Live</span>
            </div>
          </div>
        </header>

        {/* ─── MAIN CONTENT ─── */}
        <main className="flex-1 p-5 lg:p-8 overflow-auto">
          <ErrorBoundary key={activeTab}>
            <ActiveDashboard />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
