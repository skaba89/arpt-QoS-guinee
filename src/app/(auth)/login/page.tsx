import { LoginModal } from '@/components/login-modal';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Connexion — ARPT Guinée',
  description: 'Accès sécurisé à l\'Autorité de Régulation des Postes et Télécommunications de Guinée',
};

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  // If already logged in, redirect to home
  if (session?.user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-[#071A14] flex items-center justify-center">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#071A14] via-[#0D2219] to-[#071A14]" />

      {/* Subtle animated grid pattern */}
      <div
        className="fixed inset-0 opacity-[0.015]"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,148,96,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,148,96,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Login modal always visible on this page */}
      <div className="relative z-10">
        <LoginModal isOpen={true} />
      </div>
    </div>
  );
}
