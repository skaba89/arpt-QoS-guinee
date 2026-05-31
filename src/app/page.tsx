'use client';

import { useState, useCallback, useSyncExternalStore, useEffect } from 'react';
import { OnitLayout } from '@/components/onit-layout';
import { AuthProvider } from '@/components/auth-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import { LoginModal } from '@/components/login-modal';
import { useSession } from 'next-auth/react';

type TabId = 'dashboard' | 'qos' | 'sig' | 'scoring' | 'audit' | 'reports' | 'import' | 'public' | 'cyber' | 'admin';

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

  // When user authenticates, switch from public to dashboard if they were on public
  useEffect(() => {
    if (isAuthenticated && activeTab === 'public') {
      setActiveTab('dashboard');
    }
  }, [isAuthenticated, activeTab]);

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
      // User clicked a protected tab while not logged in - show login modal
      // Set activeTab to the requested tab so after login they go there
      setActiveTab(tab);
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
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </AuthProvider>
  );
}
