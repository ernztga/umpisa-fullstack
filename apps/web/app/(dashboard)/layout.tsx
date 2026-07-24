'use client';

import { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { ME_QUERY } from '@/lib/graphql/mutations/auth';
import { useSessionStore } from '@/lib/store/useSessionStore';
import { AppShell } from '@/components/shell/AppShell';

interface MeQueryData {
  me: { id: string; email: string; firstName: string; lastName: string } | null;
}

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

  return (
    <AppShell
      userInitial={data.me.firstName.charAt(0).toUpperCase()}
      userName={`${data.me.firstName} ${data.me.lastName}`}
    >
      {children}
    </AppShell>
  );
}
