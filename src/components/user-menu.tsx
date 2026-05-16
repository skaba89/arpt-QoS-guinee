'use client';

import { signOut, useSession } from 'next-auth/react';
import { User, LogOut, Shield, Clock, Building2, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!session?.user) return null;

  const userRole = (session.user as Record<string, unknown>).role as string;
  const userOrg = (session.user as Record<string, unknown>).organization as string;
  const userName = session.user.name || '';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
      >
        <div className="h-7 w-7 rounded-full bg-[#D4A843]/20 flex items-center justify-center">
          <User className="h-3.5 w-3.5 text-[#D4A843]" />
        </div>
        <div className="hidden md:block text-left">
          <p className="text-xs font-medium text-slate-200 truncate max-w-[100px]">{userName}</p>
          <p className="text-[9px] text-slate-500 truncate max-w-[100px]">{session.user.email}</p>
        </div>
        <ChevronDown className={`h-3 w-3 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-[#1E293B]/95 backdrop-blur-xl border border-white/10 shadow-xl z-50 overflow-hidden animate-fade-in-up">
          {/* User info header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#D4A843]/20 flex items-center justify-center">
                <User className="h-5 w-5 text-[#D4A843]" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">{userName}</p>
                <p className="text-xs text-slate-400">{session.user.email}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${roleBadgeColors[userRole] || roleBadgeColors.PUBLIC}`}>
                <Shield className="h-2.5 w-2.5" />
                {roleLabels[userRole] || userRole}
              </span>
              {userOrg && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-slate-400 bg-white/5 border border-white/5">
                  <Building2 className="h-2.5 w-2.5" />
                  {userOrg}
                </span>
              )}
            </div>
          </div>

          {/* Menu items */}
          <div className="p-2">
            {userRole === 'SUPER_ADMIN' && (
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-white/5 transition-colors text-left">
                <Shield className="h-3.5 w-3.5 text-slate-500" />
                Journal d&apos;audit
              </button>
            )}
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-white/5 transition-colors text-left">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              Changer le mot de passe
            </button>
          </div>

          {/* Logout */}
          <div className="p-2 border-t border-white/10">
            <button
              onClick={() => signOut({ redirect: false })}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors text-left"
            >
              <LogOut className="h-3.5 w-3.5" />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
