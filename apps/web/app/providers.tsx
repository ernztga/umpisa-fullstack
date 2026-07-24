'use client';

import { SnackbarProvider } from 'notistack';
import { ApolloWrapper } from '@/lib/apollo/ApolloWrapper';
import { ThemeRegistry } from '@/lib/theme/ThemeRegistry';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ApolloWrapper>
      <ThemeRegistry>
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          {children}
        </SnackbarProvider>
      </ThemeRegistry>
    </ApolloWrapper>
  );
}