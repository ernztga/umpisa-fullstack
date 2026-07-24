'use client';

import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '@/lib/apollo/apolloClient';
import type { ReactNode } from 'react';

export function ApolloWrapper({ children }: { children: ReactNode }): React.JSX.Element {
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}
