'use client';

import { ThemeProvider, CssBaseline } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { theme } from '@/lib/theme/theme';
import type { ReactNode } from 'react';

/**
 * Wires MUI's Emotion-based styling engine into Next.js's App Router
 */
export function ThemeRegistry({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <AppRouterCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
