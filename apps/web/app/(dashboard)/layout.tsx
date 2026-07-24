'use client';

import { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { ME_QUERY } from '@/lib/graphql/mutations/auth';
import { useSessionStore } from '@/lib/store/useSessionStore';

interface MeQueryData {
  me: { id: string; email: string; firstName: string; lastName: string } | null;
}

/**
 * Real (server-verified) auth gate for the dashboard section. The
 * middleware already did a cheap cookie-presence check (Step 9.1) —
 * this layout performs the actual verification by calling `me`, which
 * passes through requireAuth on the API and can only succeed with a
 * genuinely valid, unexpired access token.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const router = useRouter();
  const setAuthenticated = useSessionStore((state) => state.setAuthenticated);
  const setInitializing = useSessionStore((state) => state.setInitializing);

  const { data, loading } = useQuery<MeQueryData>(ME_QUERY, { fetchPolicy: 'network-only' });

  useEffect(() => {
    if (loading) return;
    setInitializing(false);

    if (!data?.me) {
      setAuthenticated(false);
      router.replace('/login');
    } else {
      setAuthenticated(true);
    }
  }, [loading, data, router, setAuthenticated, setInitializing]);

  if (loading || !data?.me) {
    return (
      <Box
        sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
}
