'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Lock, Mail, Eye, EyeOff, Shield, Loader2, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
}

export function LoginModal({ isOpen }: LoginModalProps) {
  const [email, setEmail] = useState('admin@arpt.gn');
  const [password, setPassword] = useState('Admin@2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use NextAuth signIn with redirect: false
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Identifiants incorrects. Vérifiez votre email et mot de passe.');
      } else if (result?.ok) {
        // Force a page reload to ensure session is picked up
        window.location.reload();
      }
    } catch (err) {
      setError('Erreur de connexion au serveur. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md mx-4">
        {/* Main Card */}
        <div className="relative overflow-hidden rounded-2xl bg-[#0D1321] border border-white/10 shadow-2xl shadow-black/50">
          {/* Top gold accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4A843] to-transparent" />

          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-[#D4A843]/5 to-transparent" />
          <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-[#D4A843]/5 to-transparent" />

          {/* Header */}
          <div className="pt-10 pb-6 text-center relative">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-[#D4A843] to-[#B8922E] shadow-lg shadow-[#D4A843]/25 mb-4">
              <Shield className="h-8 w-8 text-[#0A0F1E]" />
            </div>
            <h1 className="text-2xl font-bold text-slate-50 tracking-tight">ONIT-PNG</h1>
            <p className="text-xs text-slate-400 mt-1.5 max-w-[280px] mx-auto">
              Observatoire National Intelligent des Télécommunications
            </p>
            <p className="text-[10px] text-[#D4A843] mt-1 font-medium tracking-wider uppercase">
              République de Guinée — ARPT
            </p>
            <div className="mt-4 mx-auto w-32 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
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
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4A843] to-[#B8922E] text-sm font-bold text-[#0A0F1E] hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-[#D4A843]/20"
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

            {/* Demo credentials */}
            <div className="pt-1 p-3 rounded-lg bg-white/[0.03] border border-white/5">
              <p className="text-[10px] text-slate-500 text-center mb-1.5">Comptes de démonstration :</p>
              <div className="space-y-1 text-[10px] text-slate-500">
                <p><span className="text-slate-400">Admin :</span> admin@arpt.gn / Admin@2026!</p>
                <p><span className="text-slate-400">DG :</span> dg@arpt.gn / Admin@2026!</p>
                <p><span className="text-slate-400">Opérateur :</span> tech@orange.gn / Admin@2026!</p>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-1 text-center">
              <p className="text-[10px] text-slate-600">
                Accès réservé au personnel autorisé — ARPT Guinée
              </p>
              <p className="text-[9px] text-slate-700 mt-0.5">
                Connexion sécurisée • Chiffrement de bout en bout
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
