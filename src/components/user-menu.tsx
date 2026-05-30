'use client';

import { signOut, useSession } from 'next-auth/react';
import { User, LogOut, Shield, Clock, Building2, ChevronDown, Key, FileText } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';

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

export function UserMenu() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowPasswordForm(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setShowPasswordForm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  if (!session?.user) return null;

  const userRole = (session.user as Record<string, unknown>).role as string;
  const userOrg = (session.user as Record<string, unknown>).organization as string;
  const userName = session.user.name || '';
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error('Mot de passe trop court', { description: 'Minimum 8 caractères requis' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mots de passe différents', { description: 'Les deux mots de passe doivent être identiques' });
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      if (res.ok) {
        toast.success('Mot de passe modifié', { description: 'Votre mot de passe a été mis à jour' });
        setShowPasswordForm(false);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const err = await res.json();
        toast.error('Erreur', { description: err.error || 'Impossible de modifier le mot de passe' });
      }
    } catch {
      toast.error('Erreur', { description: 'Erreur de connexion au serveur' });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setIsOpen(!isOpen); setShowPasswordForm(false); }}
        className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/[0.04] transition-all duration-300 w-full"
      >
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#D4A843] to-[#B8922E] flex items-center justify-center text-[10px] font-bold text-[#080C1A] shadow-md shadow-[#D4A843]/15">
          {initials}
        </div>
        <div className="hidden md:block text-left flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-200 truncate max-w-[100px]">{userName}</p>
          <p className="text-[9px] text-slate-500 truncate max-w-[100px]">{session.user.email}</p>
        </div>
        <ChevronDown className={`h-3 w-3 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-72 rounded-xl bg-[#131B30]/95 backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/50 z-50 overflow-hidden animate-scale-in">
          {/* User info header */}
          <div className="p-5 border-b border-white/[0.06]" style={{ background: 'linear-gradient(135deg, rgba(212,168,67,0.06) 0%, transparent 60%)' }}>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#D4A843] to-[#B8922E] flex items-center justify-center text-sm font-bold text-[#080C1A] shadow-md shadow-[#D4A843]/15">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">{userName}</p>
                <p className="text-xs text-slate-400 truncate">{session.user.email}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${roleBadgeColors[userRole] || roleBadgeColors.PUBLIC}`}>
                <Shield className="h-2.5 w-2.5" />
                {roleLabels[userRole] || userRole}
              </span>
              {userOrg && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] text-slate-400 bg-white/[0.04] border border-white/[0.04]">
                  <Building2 className="h-2.5 w-2.5" />
                  {userOrg}
                </span>
              )}
            </div>
          </div>

          {/* Password change form (collapsible) */}
          {showPasswordForm ? (
            <div className="p-4 border-b border-white/[0.06] animate-fade-in-up">
              <div className="space-y-2.5">
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="password"
                    placeholder="Nouveau mot de passe"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="institutional-input pl-9 !py-2 !text-xs"
                  />
                </div>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="password"
                    placeholder="Confirmer le mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="institutional-input pl-9 !py-2 !text-xs"
                    onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                    className="flex-1 py-2 rounded-lg bg-[#D4A843]/15 text-[#D4A843] text-xs font-medium hover:bg-[#D4A843]/25 transition-colors disabled:opacity-50"
                  >
                    {changingPassword ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button
                    onClick={() => { setShowPasswordForm(false); setNewPassword(''); setConfirmPassword(''); }}
                    className="px-4 py-2 rounded-lg bg-white/[0.04] text-slate-400 text-xs hover:bg-white/[0.08] transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Menu items */}
          <div className="p-2">
            {userRole === 'SUPER_ADMIN' && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to audit tab — dispatch custom event
                  const event = new CustomEvent('onit:navigate', { detail: 'admin' });
                  window.dispatchEvent(event);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs text-slate-300 hover:bg-white/[0.05] transition-all duration-300 text-left group"
              >
                <div className="p-1.5 rounded-md bg-white/[0.04] group-hover:bg-blue-500/[0.08] transition-colors">
                  <FileText className="h-3.5 w-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                </div>
                Journal d&apos;audit
              </button>
            )}
            {!showPasswordForm && (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs text-slate-300 hover:bg-white/[0.05] transition-all duration-300 text-left group"
              >
                <div className="p-1.5 rounded-md bg-white/[0.04] group-hover:bg-[#D4A843]/[0.08] transition-colors">
                  <Clock className="h-3.5 w-3.5 text-slate-500 group-hover:text-[#D4A843] transition-colors" />
                </div>
                Changer le mot de passe
              </button>
            )}
          </div>

          {/* Logout */}
          <div className="p-2 border-t border-white/[0.06]">
            <button
              onClick={() => {
                toast.success('Déconnexion', { description: 'Vous avez été déconnecté' });
                signOut({ redirect: false });
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs text-red-400 hover:bg-red-500/[0.08] transition-all duration-300 text-left group"
            >
              <div className="p-1.5 rounded-md bg-white/[0.04] group-hover:bg-red-500/[0.08] transition-colors">
                <LogOut className="h-3.5 w-3.5 group-hover:text-red-400 transition-colors" />
              </div>
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
