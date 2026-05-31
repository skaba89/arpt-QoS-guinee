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
  Upload,
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
import { DataImport } from './data-import';
import { ErrorBoundary } from './error-boundary';
import { UserMenu } from './user-menu';
import { ThemeToggle } from './theme-toggle';
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
  // DONNÉES
  { id: 'import', label: 'Import Données', icon: 'Upload', requireAuth: true, minRole: null, section: 'DONNÉES' },
  // ADMINISTRATION
  { id: 'cyber', label: 'Cybersécurité', icon: 'Shield', requireAuth: true, minRole: 'DIRECTEUR_TECHNIQUE', section: 'ADMINISTRATION' },
  { id: 'admin', label: 'Administration', icon: 'Users', requireAuth: true, minRole: 'SUPER_ADMIN', section: 'ADMINISTRATION' },
  // PUBLIC
  { id: 'public', label: 'Portail Public', icon: 'Globe', requireAuth: false, minRole: null, section: 'PUBLIC' },
];

const sectionOrder = ['SUPERVISION', 'ANALYSE', 'DONNÉES', 'ADMINISTRATION', 'PUBLIC'];

const sectionDescriptions: Record<string, string> = {
  SUPERVISION: 'Temps réel',
  ANALYSE: 'Données & insights',
  DONNÉES: 'Import & alimentation',
  ADMINISTRATION: 'Gestion & sécurité',
  PUBLIC: 'Portail citoyen',
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Activity, Map, Award, ClipboardCheck, FileText, Globe, Shield, Users, Upload,
};

type TabId = 'dashboard' | 'qos' | 'sig' | 'scoring' | 'audit' | 'reports' | 'import' | 'public' | 'cyber' | 'admin';

const dashboardComponents: Record<string, React.ComponentType> = {
  dashboard: DashboardDG,
  qos: DashboardQoS,
  sig: DashboardSIG,
  scoring: DashboardScoring,
  audit: DashboardAudit,
  reports: DashboardReports,
  import: DataImport,
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
    <div className="min-h-screen bg-background flex">
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
          'bg-background border-r border-border',
          'transform transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]',
          'lg:relative lg:translate-x-0 flex flex-col',
          sidebarOpen
            ? 'translate-x-0 shadow-2xl shadow-black/60'
            : '-translate-x-full'
        )}
      >
        {/* ─── LOGO SECTION ─── */}
        <div className="px-5 pt-7 pb-5 border-b border-border">
          {/* ARPT Official Logo */}
          <div className="flex flex-col items-center text-center">
            {/* Guinea Coat of Arms (circular) */}
            <div className="h-16 w-16 rounded-full border-2 border-primary/30 p-0.5 mb-3 shadow-lg shadow-primary/8 bg-gradient-to-br from-primary/8 to-transparent">
              <img
                src="/arpt-crest.png"
                alt="Armoiries de la République de Guinée"
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            {/* ARPT Logo (wide, horizontal) */}
            <img
              src="/arpt-logo.png"
              alt="ARPT Guinée — Autorité de Régulation des Postes et Télécommunications"
              className="w-full max-w-[220px] h-auto object-contain mb-3"
            />
            <p className="text-[8px] text-muted-foreground leading-snug max-w-[200px]">
              Autorité de Régulation des Postes et Télécommunications
            </p>

            {/* Green separator */}
            <div className="mt-4 w-full h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            {/* Role badge */}
            {session && userRole && (
              <div className="mt-3 animate-slide-in-left">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-medium bg-primary/8 text-primary border border-primary/15">
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
                <span className="h-1 w-5 rounded-full bg-gradient-to-r from-primary/60 to-transparent" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {group.section}
                </span>
                <span className="text-[9px] text-muted-foreground/60 hidden lg:inline">
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
                          ? 'bg-primary/8 text-primary shadow-sm shadow-primary/3'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
                              ? 'bg-primary/12'
                              : 'group-hover:bg-muted'
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-4 w-4 transition-colors duration-300',
                              isActive
                                ? 'text-primary'
                                : 'text-muted-foreground group-hover:text-foreground'
                            )}
                          />
                        </div>
                      )}
                      <span className={cn(
                        "font-medium text-[13px] tracking-wide",
                        isActive ? 'text-primary' : ''
                      )}>{tab.label}</span>
                      {isActive && (
                        <ChevronRight className="h-3.5 w-3.5 ml-auto text-primary/50" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ─── BOTTOM: User Menu + Institutional Footer ─── */}
        <div className="border-t border-border bg-background/90 backdrop-blur-sm">
          {/* User menu */}
          <div className="p-4">
            {session ? (
              <UserMenu />
            ) : (
              <div className="p-3 rounded-xl bg-muted text-center border border-border">
                <p className="text-xs text-muted-foreground">Non connecté</p>
              </div>
            )}
          </div>
          {/* Institutional footer */}
          <div className="px-5 pb-4 pt-1 border-t border-border/50">
            <p className="text-[9px] text-muted-foreground/60 text-center tracking-wider">
              ARPT — République de Guinée &copy; 2026
            </p>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════
          MAIN CONTENT AREA
          ═══════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* ─── HEADER (h-16) ─── */}
        <header className="h-16 bg-background/85 backdrop-blur-2xl border-b border-border flex items-center justify-between px-5 lg:px-8 sticky top-0 z-30">
          {/* LEFT: Hamburger + Breadcrumb */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="hidden sm:flex items-center gap-2.5">
              <span className="text-[11px] font-bold text-primary/70 tracking-[0.08em] uppercase">ARPT Guinée</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
              <span className="text-[13px] text-foreground font-medium">
                {navTabs.find((t) => t.id === activeTab)?.label}
              </span>
            </div>
          </div>

          {/* CENTER: French Date */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground font-medium capitalize tracking-wide">
              {currentDate}
            </span>
          </div>

          {/* RIGHT: Theme Toggle + Search + Notifications + Live */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Search */}
            <div
              className={cn(
                'hidden md:flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-all duration-300',
                searchFocused
                  ? 'bg-card border-primary/25 ring-1 ring-primary/8'
                  : 'bg-muted/50 border-border'
              )}
            >
              <Search
                className={cn(
                  'h-3.5 w-3.5 transition-colors duration-300',
                  searchFocused ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-foreground placeholder-muted-foreground focus:outline-none w-48 transition-all"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
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
                  'relative p-2 rounded-xl hover:bg-muted transition-all duration-300',
                  notifOpen
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
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
                <div className="absolute right-0 top-full mt-2.5 w-84 rounded-xl bg-popover/95 backdrop-blur-2xl border border-border shadow-2xl shadow-black/20 dark:shadow-black/50 z-50 overflow-hidden animate-scale-in">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Bell className="h-4 w-4 text-primary" />
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
                        className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors"
                      >
                        <CheckCheck className="h-3 w-3" />
                        Tout marquer lu
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {alerts.length === 0 ? (
                      <div className="p-10 text-center">
                        <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Aucune alerte</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          Les alertes apparaîtront ici
                        </p>
                      </div>
                    ) : (
                      alerts.slice(0, 10).map((alert, i) => (
                        <div
                          key={alert.id}
                          className={cn(
                            'p-3.5 border-b border-border transition-colors hover:bg-muted/50',
                            !alert.isResolved && 'bg-muted/30'
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
                              <p className="text-xs font-medium text-foreground truncate">
                                {alert.message}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {alert.operator && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {alert.operator}
                                  </span>
                                )}
                                {alert.region && (
                                  <span className="text-[10px] text-muted-foreground">
                                    &bull; {alert.region}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
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
