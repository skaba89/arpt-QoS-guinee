'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Lock, Mail, Eye, EyeOff, Shield, Loader2 } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function LoginModal({ isOpen }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
        setError('Identifiants incorrects. Veuillez réessayer.');
      }
    } catch {
      setError('Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 animate-fade-in-up">
        {/* Glassmorphism Card */}
        <div className="relative overflow-hidden rounded-2xl bg-[#0A0F1E]/95 backdrop-blur-xl border border-white/10 shadow-2xl">
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4A843] to-transparent" />

          {/* Header */}
          <div className="pt-8 pb-4 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-[#D4A843] to-[#B8922E] shadow-lg shadow-[#D4A843]/20 mb-4">
              <Shield className="h-8 w-8 text-[#0A0F1E]" />
            </div>
            <h1 className="text-xl font-bold text-slate-50">ONIT-PNG</h1>
            <p className="text-xs text-slate-500 mt-1">
              Observatoire National Intelligent des Télécommunications
            </p>
            <p className="text-[10px] text-[#D4A843] mt-0.5">République de Guinée — ARPT</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
            {/* Error message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Adresse email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#D4A843]/40 focus:bg-white/[0.08] transition-all"
                  placeholder="admin@arpt.gn"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#D4A843]/40 focus:bg-white/[0.08] transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-[#D4A843]"
                id="remember"
              />
              <label htmlFor="remember" className="text-xs text-slate-400 cursor-pointer">
                Se souvenir de moi
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#D4A843] to-[#B8922E] text-sm font-semibold text-[#0A0F1E] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </button>

            {/* Footer */}
            <div className="pt-2 text-center">
              <p className="text-[10px] text-slate-600">
                Accès réservé au personnel autorisé — ARPT Guinée
              </p>
              <p className="text-[10px] text-slate-700 mt-1">
                Connexion sécurisée • Chiffrement AES-256
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
