'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Lock, Mail, Eye, EyeOff, Shield, Loader2, AlertCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface LoginModalProps {
  isOpen: boolean;
}

const demoAccounts = [
  { email: 'admin@arpt.gn', label: 'Super Admin', role: 'SUPER_ADMIN', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { email: 'dg@arpt.gn', label: 'Directeur Général', role: 'DG', color: 'bg-primary/20 text-primary border-primary/30' },
  { email: 'dga@arpt.gn', label: 'Directeur Général Adjoint', role: 'DGA', color: 'bg-primary/15 text-primary/80 border-primary/20' },
  { email: 'dir.tech@arpt.gn', label: 'Directeur Technique', role: 'DIRECTEUR_TECHNIQUE', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { email: 'ing.rf@arpt.gn', label: 'Ingénieur RF', role: 'INGENIEUR_RF', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { email: 'analyste@arpt.gn', label: 'Analyste QoS', role: 'ANALYSTE_QOS', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { email: 'auditeur@arpt.gn', label: 'Auditeur', role: 'AUDITEUR', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { email: 'tech@orange.gn', label: 'Orange Guinée', role: 'OPERATEUR_READONLY', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { email: 'tech@mtn.gn', label: 'MTN Guinée', role: 'OPERATEUR_READONLY', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { email: 'tech@celcom.gn', label: 'Celcom Guinée', role: 'OPERATEUR_READONLY', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { email: 'tech@intercel.gn', label: 'Intercel Guinée', role: 'OPERATEUR_READONLY', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
];

// SECURITY: Only show demo accounts in development mode.
// In production, users must know their own email addresses.
const visibleAccounts = process.env.NODE_ENV === 'development' ? demoAccounts : [];

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
        toast.success('Connexion réussie', { description: 'Bienvenue sur ARPT Guinée' });
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      {/* Decorative background patterns */}
      <div className="absolute inset-0 guinea-bg-subtle" />
      <div
        className="absolute inset-0 dark:block hidden"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 700px 500px at 80% 10%, rgba(206,17,38,0.06), transparent),
            radial-gradient(ellipse 700px 500px at 15% 90%, rgba(0,148,96,0.05), transparent),
            radial-gradient(ellipse 500px 400px at 50% 50%, rgba(212,168,67,0.03), transparent),
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 24px,
              rgba(255,255,255,0.012) 24px,
              rgba(255,255,255,0.012) 25px
            ),
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 24px,
              rgba(255,255,255,0.012) 24px,
              rgba(255,255,255,0.012) 25px
            )
          `,
        }}
      />
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 700px 500px at 80% 10%, rgba(206,17,38,0.04), transparent),
            radial-gradient(ellipse 700px 500px at 15% 90%, rgba(0,148,96,0.03), transparent),
            radial-gradient(ellipse 500px 400px at 50% 50%, rgba(184,146,46,0.03), transparent)
          `,
        }}
      />

      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-black/10 dark:bg-black/30 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        {/* Main Card */}
        <div className="relative overflow-hidden rounded-2xl bg-card/95 border border-border shadow-2xl shadow-black/20 dark:shadow-black/60 backdrop-blur-2xl">

          {/* ═══ TRICOLOR STRIPE ═══ */}
          <div className="flex h-[3px] w-full">
            <div className="h-full flex-1 bg-[#CE1126]" />
            <div className="h-full flex-1 bg-[#FCD116]" />
            <div className="h-full flex-1 bg-[#009460]" />
          </div>

          {/* ═══ INSTITUTIONAL HEADER ═══ */}
          <div className="pt-10 pb-5 text-center relative">
            {/* Decorative glow behind crest */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-primary/6 blur-2xl pointer-events-none" />

            {/* ARPT Crest */}
            <div className="relative mb-5">
              <img
                src="/arpt-logo.png"
                alt="ARPT Guinée"
                className="h-22 w-22 mx-auto rounded-full shadow-lg shadow-primary/15 border-2 border-primary/25 object-cover"
                style={{ height: '5.5rem', width: '5.5rem' }}
              />
            </div>

            {/* République de Guinée */}
            <p className="text-[10px] text-primary font-semibold tracking-[0.22em] uppercase">
              République de Guinée
            </p>

            {/* ARPT */}
            <h2 className="text-3xl font-bold text-foreground tracking-[0.15em] mt-3">
              ARPT
            </h2>

            {/* Full name */}
            <p className="text-[11px] text-muted-foreground mt-1.5 max-w-[320px] mx-auto leading-relaxed">
              Autorité de Régulation des Postes et Télécommunications
            </p>

            {/* Separator */}
            <div className="mt-5 mx-auto w-48 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />

            {/* Section title with lock */}
            <div className="mt-5 flex items-center justify-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/15">
                <Lock className="h-3.5 w-3.5 text-primary/70" />
              </div>
              <p className="text-sm font-semibold text-foreground tracking-wide">
                ARPT — Espace Sécurisé
              </p>
            </div>
          </div>

          {/* ═══ FORM ═══ */}
          <form onSubmit={handleSubmit} className="px-8 pb-6 space-y-5">
            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-red-500/[0.08] border border-red-500/15"
              >
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-400 leading-relaxed">{error}</p>
              </motion.div>
            )}

            {/* Email */}
            <div>
              <label className="text-[10px] text-muted-foreground mb-2 block font-semibold uppercase tracking-[0.1em]">
                Adresse email
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary/60 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="institutional-input pl-12"
                  placeholder="votre.email@arpt.gn"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[10px] text-muted-foreground mb-2 block font-semibold uppercase tracking-[0.1em]">
                Mot de passe
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary/60 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="institutional-input pl-12 pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#009460] to-[#007A4D] text-sm font-bold text-white hover:brightness-110 active:brightness-95 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:hover:brightness-100 shadow-lg shadow-[#009460]/12 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authentification en cours...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  ACCÈS SÉCURISÉ
                </>
              )}
            </button>
          </form>

          {/* ═══ QUICK ACCOUNT SELECTION — Dev Only ═══ */}
          {visibleAccounts.length > 0 && (
            <div className="px-8 pb-6">
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[11px] text-muted-foreground font-medium tracking-wide">Connexion rapide — Sélectionnez un compte</p>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {visibleAccounts.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => handleQuickLogin(account.email)}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all hover:bg-muted border ${
                        email === account.email
                          ? 'border-primary/25 bg-primary/5'
                          : 'border-border bg-card'
                      }`}
                    >
                      <span className={`inline-flex items-center justify-center h-5 min-w-5 rounded text-[8px] font-bold border ${account.color}`}>
                        {account.label.charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium text-foreground truncate">{account.label}</p>
                        <p className="text-[9px] text-muted-foreground truncate">{account.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-muted-foreground/60 mt-2 text-center">Saisissez votre mot de passe pour vous connecter</p>
              </div>
            </div>
          )}

          {/* ═══ FOOTER ═══ */}
          <div className="px-8 pb-6 text-center">
            {/* Subtle separator */}
            <div className="mx-auto w-24 h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4" />

            <p className="text-[10px] text-muted-foreground font-medium">
              Accès réservé au personnel autorisé de l&apos;ARPT
            </p>
            <p className="text-[9px] text-muted-foreground/60 mt-1.5 font-mono tracking-wide">
              Connexion sécurisée TLS 1.3 &bull; Chiffrement AES-256
            </p>

            {/* Guinea tricolor dots */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="h-1.5 w-1.5 rounded-full bg-[#CE1126]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#FCD116]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#009460]" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
