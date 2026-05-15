'use client';

import { useState } from 'react';
import { OnitLayout } from '@/components/onit-layout';
import { AuthProvider } from '@/components/auth-provider';
import { LoginModal } from '@/components/login-modal';
import { useSession } from 'next-auth/react';

type TabId = 'dashboard' | 'qos' | 'sig' | 'scoring' | 'audit' | 'reports' | 'public' | 'cyber' | 'admin';

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const { data: session, status } = useSession();

  const showLogin = status === 'unauthenticated' && activeTab !== 'public';

  // Public tab doesn't require auth
  const effectiveTab = (activeTab === 'public' || session) ? activeTab : 'public';

  return (
    <>
      <OnitLayout activeTab={effectiveTab} onTabChange={setActiveTab} />
      <LoginModal isOpen={showLogin} />
    </>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
