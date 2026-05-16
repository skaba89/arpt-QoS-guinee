'use client';

import { useState, useCallback, useSyncExternalStore } from 'react';
import { OnitLayout } from '@/components/onit-layout';
import { AuthProvider } from '@/components/auth-provider';
import { LoginModal } from '@/components/login-modal';
import { useSession } from 'next-auth/react';

type TabId = 'dashboard' | 'qos' | 'sig' | 'scoring' | 'audit' | 'reports' | 'public' | 'cyber' | 'admin';

// Use useSyncExternalStore for hydration-safe mounted detection
const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const { data: session, status } = useSession();
  const mounted = useMounted();

  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';

  // Show login modal when:
  // - App is mounted (hydration complete)
  // - Not loading
  // - Not authenticated
  // - Not on public tab
  const showLogin = mounted && !isLoading && !isAuthenticated && activeTab !== 'public';

  // If not authenticated, only show public tab; after login, show dashboard
  const effectiveTab = isAuthenticated
    ? (activeTab === 'public' ? 'dashboard' : activeTab)
    : 'public';

  const handleTabChange = useCallback((tab: TabId) => {
    if (!isAuthenticated && tab !== 'public') {
      // User clicked a protected tab while not logged in - show login
      setActiveTab(tab); // Remember where they want to go
      return;
    }
    setActiveTab(tab);
  }, [isAuthenticated]);

  return (
    <>
      <OnitLayout activeTab={effectiveTab} onTabChange={handleTabChange} />
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
