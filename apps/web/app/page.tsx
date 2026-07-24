'use client';

import { useQuery } from '@apollo/client';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { PING_QUERY } from '@/lib/graphql/queries/ping';

/**
 * Temporary verification page for full pipeline (Next.js ->
 * Apollo Client -> API -> GraphQL -> back) before any real UI
 */
export default function HomePage(): React.JSX.Element {
  const { data, loading, error } = useQuery<{ ping: string }>(PING_QUERY);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 8 }}>
      <Typography variant="h4">Personal Finance Tracker</Typography>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">Failed to reach the API: {error.message}</Alert>}
      {data && <Alert severity="success">API responded: "{data.ping}"</Alert>}
    </Box>
  );
}
