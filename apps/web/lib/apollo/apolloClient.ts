import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { RetryLink } from '@apollo/client/link/retry';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql';

const httpLink = new HttpLink({
  uri: GRAPHQL_URL,
  // REQUIRED for the browser to send httpOnly session cookies
  // cross-origin (dev: localhost:3000 -> localhost:4000). Without
  // this, every request is effectively unauthenticated regardless of
  // whether the user has a valid session, because the cookie is
  // simply never attached.
  credentials: 'include',
});

/**
 * Retries only QUERY operations (never mutations), and only on
 * network errors (not GraphQL errors returned by a successful HTTP
 * response, since those represent a real business-logic outcome —
 * e.g. "Category not found" — that retrying would never fix).
 */
const retryLink = new RetryLink({
  delay: { initial: 300, max: 3000, jitter: true },
  attempts: {
    max: 3,
    retryIf: (error, operation) => {
      const isQuery = operation.query.definitions.some(
        (def) => def.kind === 'OperationDefinition' && def.operation === 'query',
      );
      return Boolean(error) && isQuery;
    },
  },
});

export const apolloClient = new ApolloClient({
  link: from([retryLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      // 'cache-and-network' shows cached data immediately (fast) while
      // still revalidating against the server
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
  },
});
