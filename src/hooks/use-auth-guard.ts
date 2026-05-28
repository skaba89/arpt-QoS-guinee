'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

// Role priority mapping (higher number = more permissions)
const ROLE_PRIORITY: Record<string, number> = {
  SUPER_ADMIN: 100,
  DG: 80,
  DGA: 70,
  DIRECTEUR_TECHNIQUE: 60,
  INGENIEUR_RF: 50,
  ANALYSTE_QOS: 40,
  AUDITEUR: 30,
  OPERATEUR_READONLY: 10,
  PUBLIC: 0,
};

export function useAuthGuard(minRole?: string) {
  const { data: session, status } = useSession();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    setIsLoading(false);
    
    if (!session?.user) {
      setIsAuthorized(false);
      return;
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    
    if (!minRole) {
      setIsAuthorized(true);
      return;
    }

    const userPriority = ROLE_PRIORITY[userRole] ?? 0;
    const requiredPriority = ROLE_PRIORITY[minRole] ?? 0;
    setIsAuthorized(userPriority >= requiredPriority);
  }, [session, status, minRole]);

  return { isAuthorized, isLoading, session, userRole: (session?.user as Record<string, unknown>)?.role as string };
}
