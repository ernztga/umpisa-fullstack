import { gql } from 'graphql-tag';

/**
 * Root GraphQL schema. Feature-specific type defs (auth, category,
 * expense) will be added here as their own files and merged into this
 * array
 */
export const baseTypeDefs = gql`
  type Query {
    """
    Trivial health-check query for verifying the GraphQL pipeline
    (server, context, middleware) is wired correctly.
    """
    ping: String!
  }
`;
