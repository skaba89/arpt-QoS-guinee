'use client';

import { useState } from 'react';
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
  User,
  Menu,
  X,
  ChevronRight,
  Settings,
  LogOut,
} from 'lucide-react';
import { DashboardDG } from './dashboard-dg';
import { DashboardQoS } from './dashboard-qos';
import { DashboardSIG } from './dashboard-sig';
import { DashboardScoring } from './dashboard-scoring';
import { DashboardAudit } from './dashboard-audit';
import { DashboardReports } from './dashboard-reports';
import { DashboardPublic } from './dashboard-public';
import { DashboardCyber } from './dashboard-cyber';
import { navTabs } from '@/lib/mock-data';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Activity,
  Map,
  Award,
  ClipboardCheck,
  FileText,
  Globe,
  Shield,
};

type TabId = 'dashboard' | 'qos' | 'sig' | 'scoring' | 'audit' | 'reports' | 'public' | 'cyber';

const dashboardComponents: Record<TabId, React.ComponentType> = {
  dashboard: DashboardDG,
  qos: DashboardQoS,
  sig: DashboardSIG,
  scoring: DashboardScoring,
  audit: DashboardAudit,
  reports: DashboardReports,
  public: DashboardPublic,
  cyber: DashboardCyber,
};

interface OnitLayoutProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function OnitLayout({ activeTab, onTabChange }: OnitLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const ActiveDashboard = dashboardComponents[activeTab];

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0A0F1E] border-r border-white/10 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo / Branding */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#D4A843] to-[#B8922E] flex items-center justify-center shadow-lg shadow-[#D4A843]/20">
              <span className="text-[#0A0F1E] font-bold text-sm">ON</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-50 tracking-tight">ONIT-PNG</h1>
              <p className="text-[10px] text-slate-500 leading-tight">Observatoire National<br />Intelligent des Télécom</p>
            </div>
          </div>
          {/* Gold accent line */}
          <div className="mt-3 h-px bg-gradient-to-r from-[#D4A843]/60 via-[#D4A843]/20 to-transparent" />
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navTabs.map((tab) => {
            const Icon = iconMap[tab.icon];
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id as TabId);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#D4A843]/10 text-[#D4A843] border border-[#D4A843]/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                }`}
              >
                {Icon && <Icon className={`h-4 w-4 ${isActive ? 'text-[#D4A843]' : 'text-slate-500 group-hover:text-slate-400'}`} />}
                <span className="font-medium text-xs">{tab.label}</span>
                {isActive && <ChevronRight className="h-3.5 w-3.5 ml-auto text-[#D4A843]/60" />}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10">
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5">
            <div className="h-8 w-8 rounded-full bg-[#D4A843]/20 flex items-center justify-center">
              <User className="h-4 w-4 text-[#D4A843]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">DG ARPT</p>
              <p className="text-[10px] text-slate-500 truncate">admin@arpt.gn</p>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors">
                <Settings className="h-3.5 w-3.5" />
              </button>
              <button className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-14 bg-[#0A0F1E]/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Hamburger */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-slate-400 transition-colors"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <span>ONIT-PNG</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-slate-300">{navTabs.find((t) => t.id === activeTab)?.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
              searchFocused ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10'
            }`}>
              <Search className="h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="bg-transparent text-xs text-slate-300 placeholder-slate-600 focus:outline-none w-40"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-300 transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-400 animate-pulse" />
            </button>

            {/* Live indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-medium">Live</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <ActiveDashboard />
        </main>
      </div>
    </div>
  );
}
