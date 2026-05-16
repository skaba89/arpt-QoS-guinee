'use client';

import { useState, useEffect, useCallback } from 'react';
import { OnitLayout } from '@/components/onit-layout';
import { AuthProvider } from '@/components/auth-provider';
import { LoginModal } from '@/components/login-modal';
import { useSession } from 'next-auth/react';

type TabId = 'dashboard' | 'qos' | 'sig' | 'scoring' | 'audit' | 'reports' | 'public' | 'cyber' | 'admin';

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';

  // Show login modal when:
  // - App is mounted (hydration complete)
  // - Not loading
  // - Not authenticated
  // - Not on public tab
  const showLogin = mounted && !isLoading && !isAuthenticated && activeTab !== 'public';

  // If not authenticated, only show public tab
  const effectiveTab = isAuthenticated ? activeTab : 'public';

  const handleTabChange = useCallback((tab: TabId) => {
    if (!isAuthenticated && tab !== 'public') {
      // User clicked a protected tab while not logged in - show login
      setActiveTab(tab); // Remember where they want to go
      return;
    }
    setActiveTab(tab);
  }, [isAuthenticated]);

  // After login, go to the tab they wanted
  useEffect(() => {
    if (isAuthenticated && activeTab === 'public') {
      setActiveTab('dashboard');
    }
  }, [isAuthenticated, activeTab]);

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
