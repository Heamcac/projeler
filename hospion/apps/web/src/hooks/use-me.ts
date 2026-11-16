'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { SessionUser } from '@/types';

export function useMe() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<SessionUser>('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
