'use client';

import { useState, useEffect } from 'react';
import {
  Users, UserPlus, Shield, Activity, Clock, Building2,
  CheckCircle2, XCircle, Loader2, Search, Eye, Key,
  AlertTriangle, FileText, Database, Server, Lock
} from 'lucide-react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { toast } from 'sonner';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  roleId: string;
  organization: string | null;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

interface RoleData {
  id: string;
  name: string;
  description: string | null;
  permissionsCount: number;
}

interface AuditLogEntry {
  id: string;
  user: string;
  action: string;
  resource: string;
  details: string | null;
  ipAddress: string | null;
  time: string;
}

const roleBadgeColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-500/20 text-red-400 border-red-500/30',
  DG: 'bg-primary/20 text-primary border-primary/30',
  DGA: 'bg-primary/15 text-primary/80 border-primary/20',
  DIRECTEUR_TECHNIQUE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  INGENIEUR_RF: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  ANALYSTE_QOS: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  AUDITEUR: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  OPERATEUR_READONLY: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  PUBLIC: 'bg-slate-500/20 text-muted-foreground border-slate-500/30',
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  DG: 'Directeur Général',
  DGA: 'Directeur Général Adjoint',
  DIRECTEUR_TECHNIQUE: 'Dir. Technique',
  INGENIEUR_RF: 'Ingénieur RF',
  ANALYSTE_QOS: 'Analyste QoS',
  AUDITEUR: 'Auditeur',
  OPERATEUR_READONLY: 'Opérateur',
  PUBLIC: 'Public',
};

interface SystemStats {
  database: {
    type: string; status: string; operators: number; regions: number; measures: number;
    activeAlerts: number; reports: number; users: number; activeUsers: number;
    campaigns: number; activeCampaigns: number; auditLogs: number;
  };
  security: {
    overallScore: number; complianceScore: number; activeThreats: number;
    unresolvedCritical: number; unresolvedHigh: number; twoFactorEnabled: boolean;
    encryptionStatus: string; dataResidency: string;
  };
  activity: {
    recentAuditCount: number; loginCount: number; failedLoginCount: number;
  };
}

/* ─── Tricolor Dot for Role Badges ─── */
function TricolorDot() {
  return (
    <span className="inline-flex h-2.5 w-2.5 flex-shrink-0 overflow-hidden rounded-full">
      <span className="h-full w-1/3 bg-[#CE1126]" />
      <span className="h-full w-1/3 bg-[#FCD116]" />
      <span className="h-full w-1/3 bg-[#009460]" />
    </span>
  );
}

export function DashboardAdmin() {
  const { isAuthorized, isLoading: authLoading } = useAuthGuard('SUPER_ADMIN');
  const [users, setUsers] = useState<UserData[]>([]);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<'users' | 'audit' | 'system'>('users');

  // Create user form
  const [createForm, setCreateForm] = useState({
    email: '',
    name: '',
    password: '',
    roleId: '',
    organization: '',
  });
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersRes, rolesRes, logsRes, statsRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/roles'),
          fetch('/api/audit-logs'),
          fetch('/api/admin/stats'),
        ]);
        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data.data || []);
        }
        if (rolesRes.ok) {
          const data = await rolesRes.json();
          setRoles(data.roles || []);
        }
        if (logsRes.ok) {
          const data = await logsRes.json();
          setAuditLogs((data.logs || []).map((l: AuditLogEntry & { time: string | Date }) => ({
            ...l,
            time: typeof l.time === 'string' ? l.time : new Date(l.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          })));
        }
        if (statsRes.ok) {
          const data = await statsRes.json();
          setSystemStats(data);
        }
      } catch (err) {
        console.error('Admin fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.name || !createForm.password || !createForm.roleId) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Utilisateur ${createForm.name} créé avec succès`);
        setUsers((prev) => [
          {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: roles.find((r) => r.id === createForm.roleId)?.name || '',
            roleId: createForm.roleId,
            organization: createForm.organization || null,
            isActive: true,
            lastLogin: null,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setCreateForm({ email: '', name: '', password: '', roleId: '', organization: '' });
        setShowCreateModal(false);
      } else {
        toast.error(data.error || 'Erreur lors de la création');
      }
    } catch {
      toast.error('Erreur de connexion au serveur');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    setTogglingId(userId);
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, isActive: !currentActive }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: !currentActive } : u))
        );
        toast.success(
          !currentActive
            ? 'Utilisateur activé'
            : 'Utilisateur désactivé'
        );
      } else {
        toast.error(data.error || 'Erreur lors de la mise à jour');
      }
    } catch {
      toast.error('Erreur de connexion au serveur');
    } finally {
      setTogglingId(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.organization?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const usersByRole = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Lock className="h-12 w-12 text-red-400" />
        <h3 className="text-lg font-semibold text-foreground">Accès non autorisé</h3>
        <p className="text-muted-foreground text-sm">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xs text-muted-foreground animate-pulse">Chargement administration...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Header — Institutional Pattern ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1 w-8 rounded-full bg-gradient-to-r from-primary to-transparent" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary/70">Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Administration</h1>
          <p className="text-sm text-muted-foreground mt-2">Gestion des utilisateurs, rôles et sécurité</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-[#B8922E] text-sm font-semibold text-[#0A0F1E] hover:opacity-90 transition-opacity shadow-md shadow-[#D4A843]/10"
        >
          <UserPlus className="h-4 w-4" />
          Nouvel Utilisateur
        </button>
      </div>

      {/* ─── Stats Cards — institutional-card with tricolor accents ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Red accent — Total Users */}
        <div className="institutional-card relative overflow-hidden !p-5">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#CE1126]" style={{ zIndex: 1 }} />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Utilisateurs</p>
              <p className="text-3xl font-bold text-foreground mt-1">{totalUsers}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#CE1126]/10"><Users className="h-5 w-5 text-[#CE1126]" /></div>
          </div>
        </div>
        {/* Gold accent — Active Users */}
        <div className="institutional-card relative overflow-hidden !p-5">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#FCD116]" style={{ zIndex: 1 }} />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Utilisateurs Actifs</p>
              <p className="text-3xl font-bold text-foreground mt-1">{activeUsers}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#FCD116]/10"><CheckCircle2 className="h-5 w-5 text-[#FCD116]" /></div>
          </div>
        </div>
        {/* Green accent — Roles */}
        <div className="institutional-card relative overflow-hidden !p-5">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#009460]" style={{ zIndex: 1 }} />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Rôles Définis</p>
              <p className="text-3xl font-bold text-foreground mt-1">{roles.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#009460]/10"><Shield className="h-5 w-5 text-[#009460]" /></div>
          </div>
        </div>
        {/* Blue accent — Audit Entries */}
        <div className="institutional-card relative overflow-hidden !p-5">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#3B82F6]" style={{ zIndex: 1 }} />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Entrées d&apos;Audit</p>
              <p className="text-3xl font-bold text-foreground mt-1">{auditLogs.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10"><Activity className="h-5 w-5 text-blue-400" /></div>
          </div>
        </div>
      </div>

      {/* ─── Section Tabs — with gold underline on active ─── */}
      <div className="flex gap-2">
        {[
          { id: 'users' as const, label: 'Utilisateurs', icon: Users },
          { id: 'audit' as const, label: 'Journal d\'Audit', icon: FileText },
          { id: 'system' as const, label: 'Système', icon: Server },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
              activeSection === tab.id
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            {/* Gold underline on active tab */}
            {activeSection === tab.id && (
              <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          USERS SECTION
          ═══════════════════════════════════════════════════════════ */}
      {activeSection === 'users' && (
        <div className="space-y-4">
          {/* Search — slightly more spacious */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-muted border border-border flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur par nom, email ou organisation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-foreground placeholder-muted-foreground focus:outline-none w-full"
              />
            </div>
          </div>

          {/* Users by Role Summary — with tricolor dots */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(usersByRole).map(([role, count]) => (
              <div key={role} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border">
                <span className={`inline-flex items-center gap-1 justify-center h-5 w-5 rounded-full text-[9px] font-bold ${roleBadgeColors[role] || roleBadgeColors.PUBLIC} border`}>
                  {count}
                </span>
                <TricolorDot />
                <span className="text-[10px] text-muted-foreground">{roleLabels[role] || role}</span>
              </div>
            ))}
          </div>

          {/* Users Table — institutional-card container */}
          <div className="guinea-stripe-top institutional-card !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Utilisateur</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Rôle</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden md:table-cell">Organisation</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Statut</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden lg:table-cell">Dernière Connexion</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-muted transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-primary">
                              {user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{user.name}</p>
                            <p className="text-[10px] text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${roleBadgeColors[user.role] || roleBadgeColors.PUBLIC}`}>
                          <TricolorDot />
                          {roleLabels[user.role] || user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{user.organization || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            <XCircle className="h-2.5 w-2.5" />
                            Inactif
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {user.lastLogin
                              ? new Date(user.lastLogin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                              : 'Jamais'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(user.id, user.isActive)}
                          disabled={togglingId === user.id}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all disabled:opacity-50 ${
                            user.isActive
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                          }`}
                        >
                          {togglingId === user.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : user.isActive ? (
                            'Désactiver'
                          ) : (
                            'Activer'
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && (
              <div className="p-8 text-center">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Aucun utilisateur trouvé</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          AUDIT LOG SECTION
          ═══════════════════════════════════════════════════════════ */}
      {activeSection === 'audit' && (
        <div className="guinea-stripe-top institutional-card">
          <h2 className="section-title mb-0 pb-0 text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            JOURNAL D&apos;AUDIT
          </h2>
          <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1 mt-4">
            {auditLogs.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted border border-border">
                <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
                  entry.action === 'LOGIN' ? 'bg-emerald-400' :
                  entry.action === 'CREATE' ? 'bg-blue-400' :
                  entry.action === 'UPDATE' ? 'bg-amber-400' :
                  entry.action === 'DELETE' ? 'bg-red-400' :
                  'bg-primary'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-foreground">{entry.user}</span>
                    <span className="text-[10px] text-muted-foreground">→</span>
                    <span className={`text-xs font-medium ${
                      entry.action === 'LOGIN' ? 'text-emerald-400' :
                      entry.action === 'CREATE' ? 'text-blue-400' :
                      entry.action === 'UPDATE' ? 'text-amber-400' :
                      entry.action === 'DELETE' ? 'text-red-400' :
                      'text-muted-foreground'
                    }`}>{entry.action}</span>
                    <span className="text-xs text-muted-foreground">{entry.resource}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {entry.details && <span className="text-[10px] text-muted-foreground truncate max-w-xs">{entry.details}</span>}
                    <span className="text-[10px] text-muted-foreground">•</span>
                    <span className="text-[10px] text-muted-foreground">{entry.time}</span>
                    {entry.ipAddress && (
                      <>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{entry.ipAddress}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <div className="p-8 text-center">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Aucune entrée d&apos;audit</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SYSTEM SECTION
          ═══════════════════════════════════════════════════════════ */}
      {activeSection === 'system' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Database Card */}
            <div className="guinea-stripe-top institutional-card">
              <h3 className="section-title mb-0 pb-0 text-sm flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-400" />
                BASE DE DONNÉES
              </h3>
              <div className="space-y-3 mt-4">
                {[
                  { label: 'Type', value: systemStats?.database.type || 'SQLite' },
                  { label: 'Statut', value: systemStats?.database.status === 'connected' ? 'Connecté' : 'Déconnecté', ok: systemStats?.database.status === 'connected' },
                  { label: 'Utilisateurs', value: String(systemStats?.database.users ?? totalUsers) },
                  { label: 'Opérateurs', value: String(systemStats?.database.operators ?? '-') },
                  { label: 'Régions', value: String(systemStats?.database.regions ?? '-') },
                  { label: 'Mesures QoS', value: systemStats?.database.measures ? String(systemStats.database.measures) : '-' },
                  { label: 'Alertes actives', value: String(systemStats?.database.activeAlerts ?? '-') },
                  { label: 'Rapports', value: String(systemStats?.database.reports ?? '-') },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-2.5 rounded-lg bg-muted border border-border">
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                    <span className={`text-xs font-medium ${item.ok ? 'text-emerald-400' : 'text-foreground'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Roles & Permissions Card */}
            <div className="guinea-stripe-top institutional-card">
              <h3 className="section-title mb-0 pb-0 text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                RÔLES & PERMISSIONS
              </h3>
              <div className="space-y-2 mt-4">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted border border-border">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${roleBadgeColors[role.name] || roleBadgeColors.PUBLIC}`}>
                        <TricolorDot />
                        {roleLabels[role.name] || role.name}
                      </span>
                      {role.description && (
                        <span className="text-[10px] text-muted-foreground">{role.description}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{role.permissionsCount} perms</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* System Alerts */}
          <div className="guinea-stripe-top institutional-card">
            <h3 className="section-title mb-0 pb-0 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              ALERTES SYSTÈME RÉCENTES
            </h3>
            <div className="space-y-2 mt-4">
              {[
                ...(systemStats?.security.activeThreats ? [
                  { type: 'warning' as string, message: `${systemStats.security.unresolvedCritical} alerte(s) critique(s) non résolue(s)`, time: 'Action requise' },
                  { type: 'warning' as string, message: `${systemStats.security.unresolvedHigh} alerte(s) haute(s) non résolue(s)`, time: 'Surveillance' },
                ] : [
                  { type: 'success' as string, message: 'Aucune alerte de sécurité active', time: 'Système sécurisé' },
                ]),
                { type: 'info' as string, message: `${systemStats?.activity.recentAuditCount ?? 0} actions auditées ces 7 derniers jours`, time: 'Activité récente' },
                { type: 'info' as string, message: `${systemStats?.activity.failedLoginCount ?? 0} tentative(s) de connexion échouée(s) cette semaine`, time: 'Sécurité' },
              ].map((alert, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${
                  alert.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
                  alert.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' :
                  'bg-blue-500/5 border-blue-500/20'
                }`}>
                  {alert.type === 'warning' ? <AlertTriangle className="h-4 w-4 text-amber-400" /> :
                   alert.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> :
                   <Eye className="h-4 w-4 text-blue-400" />}
                  <div className="flex-1">
                    <p className={`text-xs font-medium ${
                      alert.type === 'warning' ? 'text-amber-300' :
                      alert.type === 'success' ? 'text-emerald-300' :
                      'text-blue-300'
                    }`}>{alert.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          CREATE USER MODAL — with guinea-stripe-top
          ═══════════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="relative w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="relative overflow-hidden rounded-2xl bg-[#0D1321] border border-border shadow-2xl guinea-stripe-top">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    Nouvel Utilisateur
                  </h2>
                  <button onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Nom complet *</label>
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-primary/40"
                      placeholder="Nom Prénom"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Email *</label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-primary/40"
                      placeholder="utilisateur@arpt.gn"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Mot de passe *</label>
                    <input
                      type="password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-primary/40"
                      placeholder="Minimum 8 caractères"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Rôle *</label>
                    <select
                      value={createForm.roleId}
                      onChange={(e) => setCreateForm({ ...createForm, roleId: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-primary/40"
                    >
                      <option value="">Sélectionner un rôle</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {roleLabels[role.name] || role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Organisation</label>
                    <input
                      type="text"
                      value={createForm.organization}
                      onChange={(e) => setCreateForm({ ...createForm, organization: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-primary/40"
                      placeholder="ARPT, Orange, MTN, etc."
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleCreateUser}
                      disabled={creating}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-[#B8922E] text-sm font-semibold text-[#0A0F1E] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Création...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          Créer
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
