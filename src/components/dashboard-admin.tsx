'use client';

import { useState, useEffect } from 'react';
import {
  Users, UserPlus, Shield, Activity, Clock, Building2,
  CheckCircle2, XCircle, Loader2, Search, Eye, Key,
  AlertTriangle, FileText, Database, Server
} from 'lucide-react';
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
  DG: 'bg-[#D4A843]/20 text-[#D4A843] border-[#D4A843]/30',
  DGA: 'bg-[#D4A843]/15 text-[#D4A843]/80 border-[#D4A843]/20',
  DIRECTEUR_TECHNIQUE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  INGENIEUR_RF: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  ANALYSTE_QOS: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  AUDITEUR: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  OPERATEUR_READONLY: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  PUBLIC: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
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

export function DashboardAdmin() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
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
        const [usersRes, rolesRes, logsRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/roles'),
          fetch('/api/audit-logs'),
        ]);
        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data.users || []);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xs text-slate-500 animate-pulse">Chargement administration...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Administration</h1>
          <p className="text-sm text-slate-400 mt-1">Gestion des utilisateurs, rôles et sécurité</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#D4A843] to-[#B8922E] text-sm font-semibold text-[#0A0F1E] hover:opacity-90 transition-opacity"
        >
          <UserPlus className="h-4 w-4" />
          Nouvel Utilisateur
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#D4A843]" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Total Utilisateurs</p>
              <p className="text-2xl font-bold text-slate-50 mt-1">{totalUsers}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#D4A843]/10"><Users className="h-5 w-5 text-[#D4A843]" /></div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-500" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Utilisateurs Actifs</p>
              <p className="text-2xl font-bold text-slate-50 mt-1">{activeUsers}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10"><CheckCircle2 className="h-5 w-5 text-emerald-400" /></div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Rôles Définis</p>
              <p className="text-2xl font-bold text-slate-50 mt-1">{roles.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10"><Shield className="h-5 w-5 text-blue-400" /></div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-purple-500" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Entrées d&apos;Audit</p>
              <p className="text-2xl font-bold text-slate-50 mt-1">{auditLogs.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10"><Activity className="h-5 w-5 text-purple-400" /></div>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'users' as const, label: 'Utilisateurs', icon: Users },
          { id: 'audit' as const, label: 'Journal d\'Audit', icon: FileText },
          { id: 'system' as const, label: 'Système', icon: Server },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeSection === tab.id
                ? 'bg-[#D4A843]/10 text-[#D4A843] border border-[#D4A843]/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-300 border border-transparent'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Section */}
      {activeSection === 'users' && (
        <div className="space-y-4">
          {/* Search + Role Filter */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 flex-1">
              <Search className="h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-slate-300 placeholder-slate-600 focus:outline-none w-full"
              />
            </div>
          </div>

          {/* Users by Role Summary */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(usersByRole).map(([role, count]) => (
              <div key={role} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5">
                <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[9px] font-bold ${roleBadgeColors[role] || roleBadgeColors.PUBLIC} border`}>
                  {count}
                </span>
                <span className="text-[10px] text-slate-400">{roleLabels[role] || role}</span>
              </div>
            ))}
          </div>

          {/* Users Table */}
          <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843] to-transparent opacity-60" />
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Utilisateur</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Rôle</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium hidden md:table-cell">Organisation</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Statut</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium hidden lg:table-cell">Dernière Connexion</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-[#D4A843]/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-[#D4A843]">
                              {user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-200">{user.name}</p>
                            <p className="text-[10px] text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${roleBadgeColors[user.role] || roleBadgeColors.PUBLIC}`}>
                          <Key className="h-2.5 w-2.5" />
                          {roleLabels[user.role] || user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 text-slate-500" />
                          <span className="text-slate-400">{user.organization || '—'}</span>
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
                          <Clock className="h-3 w-3 text-slate-500" />
                          <span className="text-slate-400">
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
                <Users className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Aucun utilisateur trouvé</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Log Section */}
      {activeSection === 'audit' && (
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843] to-transparent opacity-60" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#D4A843]" />
            Journal d&apos;Audit
          </h2>
          <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
            {auditLogs.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
                  entry.action === 'LOGIN' ? 'bg-emerald-400' :
                  entry.action === 'CREATE' ? 'bg-blue-400' :
                  entry.action === 'UPDATE' ? 'bg-amber-400' :
                  entry.action === 'DELETE' ? 'bg-red-400' :
                  'bg-[#D4A843]'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-slate-200">{entry.user}</span>
                    <span className="text-[10px] text-slate-500">→</span>
                    <span className={`text-xs font-medium ${
                      entry.action === 'LOGIN' ? 'text-emerald-400' :
                      entry.action === 'CREATE' ? 'text-blue-400' :
                      entry.action === 'UPDATE' ? 'text-amber-400' :
                      entry.action === 'DELETE' ? 'text-red-400' :
                      'text-slate-400'
                    }`}>{entry.action}</span>
                    <span className="text-xs text-slate-400">{entry.resource}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {entry.details && <span className="text-[10px] text-slate-500 truncate max-w-xs">{entry.details}</span>}
                    <span className="text-[10px] text-slate-600">•</span>
                    <span className="text-[10px] text-slate-500">{entry.time}</span>
                    {entry.ipAddress && (
                      <>
                        <span className="text-[10px] text-slate-600">•</span>
                        <span className="text-[10px] text-slate-600 font-mono">{entry.ipAddress}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <div className="p-8 text-center">
                <FileText className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Aucune entrée d&apos;audit</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* System Section */}
      {activeSection === 'system' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#3B82F6]" />
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-400" />
                Base de Données
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Type', value: 'SQLite' },
                  { label: 'Statut', value: 'Connecté', ok: true },
                  { label: 'Utilisateurs', value: String(totalUsers) },
                  { label: 'Opérateurs', value: '3' },
                  { label: 'Régions', value: '8' },
                  { label: 'Mesures QoS', value: '500+' },
                  { label: 'Alertes actives', value: '12' },
                  { label: 'Rapports', value: '24' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                    <span className="text-xs text-slate-400">{item.label}</span>
                    <span className={`text-xs font-medium ${item.ok ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#10B981]" />
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                Rôles & Permissions
              </h3>
              <div className="space-y-2">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${roleBadgeColors[role.name] || roleBadgeColors.PUBLIC}`}>
                        <Key className="h-2.5 w-2.5" />
                        {roleLabels[role.name] || role.name}
                      </span>
                      {role.description && (
                        <span className="text-[10px] text-slate-500">{role.description}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">{role.permissionsCount} perms</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#F59E0B]" />
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Alertes Système Récentes
            </h3>
            <div className="space-y-2">
              {[
                { type: 'warning', message: 'Certificat SSL expire dans 30 jours', time: 'Il y a 2h' },
                { type: 'info', message: 'Sauvegarde automatique réussie', time: 'Il y a 6h' },
                { type: 'success', message: 'Mise à jour de la base de données effectuée', time: 'Il y a 1j' },
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
                    <p className="text-[10px] text-slate-500 mt-0.5">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="relative w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="relative overflow-hidden rounded-2xl bg-[#0D1321] border border-white/10 shadow-2xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4A843] to-transparent" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-50 flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-[#D4A843]" />
                    Nouvel Utilisateur
                  </h2>
                  <button onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">Nom complet *</label>
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-200 focus:outline-none focus:border-[#D4A843]/40"
                      placeholder="Nom Prénom"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">Email *</label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-200 focus:outline-none focus:border-[#D4A843]/40"
                      placeholder="utilisateur@arpt.gn"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">Mot de passe *</label>
                    <input
                      type="password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-200 focus:outline-none focus:border-[#D4A843]/40"
                      placeholder="Minimum 8 caractères"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">Rôle *</label>
                    <select
                      value={createForm.roleId}
                      onChange={(e) => setCreateForm({ ...createForm, roleId: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-200 focus:outline-none focus:border-[#D4A843]/40"
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
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">Organisation</label>
                    <input
                      type="text"
                      value={createForm.organization}
                      onChange={(e) => setCreateForm({ ...createForm, organization: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-200 focus:outline-none focus:border-[#D4A843]/40"
                      placeholder="ARPT, Orange, MTN, etc."
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleCreateUser}
                      disabled={creating}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#D4A843] to-[#B8922E] text-sm font-semibold text-[#0A0F1E] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
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
