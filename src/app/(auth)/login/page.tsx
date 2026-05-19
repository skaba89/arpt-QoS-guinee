import { LoginModal } from '@/components/login-modal';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Connexion — ONIT-PNG',
  description: 'Accès sécurisé à l\'Observatoire National Intelligent des Télécommunications',
};

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  // If already logged in, redirect to home
  if (session?.user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0A0F1E] via-[#0D1321] to-[#0A0F1E]" />

      {/* Subtle animated grid pattern */}
      <div
        className="fixed inset-0 opacity-[0.015]"
        style={{
          backgroundImage: 'linear-gradient(rgba(212,168,67,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,67,0.3) 1px, transparent 1px)',
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
