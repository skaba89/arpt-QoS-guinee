'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Lock, Mail, Eye, EyeOff, Shield, Loader2, AlertCircle, Users } from 'lucide-react';
import { toast } from 'sonner';

interface LoginModalProps {
  isOpen: boolean;
}

const demoAccounts = [
  { email: 'admin@arpt.gn', label: 'Super Admin', role: 'SUPER_ADMIN', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { email: 'dg@arpt.gn', label: 'Directeur Général', role: 'DG', color: 'bg-[#D4A843]/20 text-[#D4A843] border-[#D4A843]/30' },
  { email: 'dga@arpt.gn', label: 'Directeur Général Adjoint', role: 'DGA', color: 'bg-[#D4A843]/15 text-[#D4A843]/80 border-[#D4A843]/20' },
  { email: 'dir.tech@arpt.gn', label: 'Directeur Technique', role: 'DIRECTEUR_TECHNIQUE', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { email: 'ing.rf@arpt.gn', label: 'Ingénieur RF', role: 'INGENIEUR_RF', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { email: 'analyste@arpt.gn', label: 'Analyste QoS', role: 'ANALYSTE_QOS', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { email: 'auditeur@arpt.gn', label: 'Auditeur', role: 'AUDITEUR', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { email: 'tech@orange.gn', label: 'Orange Guinée', role: 'OPERATEUR_READONLY', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { email: 'tech@mtn.gn', label: 'MTN Guinée', role: 'OPERATEUR_READONLY', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { email: 'tech@celcom.gn', label: 'Celcom Guinée', role: 'OPERATEUR_READONLY', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
];

export function LoginModal({ isOpen }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Identifiants incorrects. Vérifiez votre email et mot de passe.');
        toast.error('Échec de connexion', { description: 'Identifiants incorrects' });
        setLoading(false);
      } else if (result?.ok) {
        toast.success('Connexion réussie', { description: 'Bienvenue sur ONIT-PNG' });
        // Small delay then reload to ensure session cookie is set
        setTimeout(() => {
          window.location.href = '/';
        }, 300);
      } else {
        setError('Erreur inattendue. Réessayez.');
        setLoading(false);
      }
    } catch (err) {
      setError('Erreur de connexion au serveur. Réessayez.');
      toast.error('Erreur serveur', { description: 'Impossible de se connecter au serveur' });
      setLoading(false);
    }
  };

  const handleQuickLogin = (accountEmail: string) => {
    setEmail(accountEmail);
    setPassword(''); // User must type their own password
    setError('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Main Card */}
        <div className="relative overflow-hidden rounded-2xl bg-[#0D1321] border border-white/10 shadow-2xl shadow-black/50">
          {/* Top gold accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4A843] to-transparent" />

          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-[#D4A843]/5 to-transparent" />
          <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-[#D4A843]/5 to-transparent" />

          {/* Header */}
          <div className="pt-8 pb-5 text-center relative">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-[#D4A843] to-[#B8922E] shadow-lg shadow-[#D4A843]/25 mb-3">
              <Shield className="h-7 w-7 text-[#0A0F1E]" />
            </div>
            <h1 className="text-2xl font-bold text-slate-50 tracking-tight">ONIT-PNG</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">
              Observatoire National Intelligent des Télécommunications
            </p>
            <p className="text-[10px] text-[#D4A843] mt-1 font-medium tracking-wider uppercase">
              République de Guinée — ARPT
            </p>
            <div className="mt-3 mx-auto w-32 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 pb-4 space-y-4">
            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block font-medium">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#D4A843]/50 focus:bg-white/[0.08] focus:ring-1 focus:ring-[#D4A843]/20 transition-all"
                  placeholder="votre.email@arpt.gn"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block font-medium">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#D4A843]/50 focus:bg-white/[0.08] focus:ring-1 focus:ring-[#D4A843]/20 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4A843] to-[#B8922E] text-sm font-bold text-[#0A0F1E] hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-[#D4A843]/20"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Se connecter
                </>
              )}
            </button>
          </form>

          {/* Quick Account Selection */}
          <div className="px-6 pb-6">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-3.5 w-3.5 text-slate-500" />
                <p className="text-[11px] text-slate-400 font-medium">Connexion rapide — Sélectionnez un compte</p>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => handleQuickLogin(account.email)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all hover:bg-white/[0.08] border ${email === account.email ? 'border-[#D4A843]/30 bg-[#D4A843]/5' : 'border-white/5 bg-white/[0.02]'}`}
                  >
                    <span className={`inline-flex items-center justify-center h-5 min-w-5 rounded text-[8px] font-bold border ${account.color}`}>
                      {account.label.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-slate-300 truncate">{account.label}</p>
                      <p className="text-[9px] text-slate-600 truncate">{account.email}</p>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-slate-600 mt-2 text-center">Saisissez votre mot de passe pour vous connecter</p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-5 text-center">
            <p className="text-[10px] text-slate-600">
              Accès réservé au personnel autorisé — ARPT Guinée
            </p>
            <p className="text-[9px] text-slate-700 mt-0.5">
              Connexion sécurisée • Chiffrement de bout en bout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
