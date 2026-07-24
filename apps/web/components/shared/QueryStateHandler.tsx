import { Box, CircularProgress, Alert, Button, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface QueryStateHandlerProps {
  loading: boolean;
  error?: Error;
  isEmpty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children: ReactNode;
}

/**
 * Single reusable loading/error/empty-state wrapper used by every
 * data-fetching screen (Dashboard, Expenses, Categories). See Step 10
 * architectural decision 2.1 — one component instead of four
 * hand-rolled, subtly-inconsistent loading/error blocks.
 */
export function QueryStateHandler({
  loading,
  error,
  isEmpty,
  emptyMessage = 'Nothing here yet.',
  onRetry,
  children,
}: QueryStateHandlerProps): React.JSX.Element {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          onRetry && (
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          )
        }
        sx={{ my: 2 }}
      >
        {error.message}
      </Alert>
    );
  }

  if (isEmpty) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  return <>{children}</>;
}
