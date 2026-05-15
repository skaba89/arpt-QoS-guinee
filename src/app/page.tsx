'use client';

import { useState } from 'react';
import { OnitLayout } from '@/components/onit-layout';

type TabId = 'dashboard' | 'qos' | 'sig' | 'scoring' | 'audit' | 'reports' | 'public' | 'cyber';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  return <OnitLayout activeTab={activeTab} onTabChange={setActiveTab} />;
}
