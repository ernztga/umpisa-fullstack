import { gql } from '@apollo/client';

/**
 * Query to check if server is up
 */
export const PING_QUERY = gql`
  query Ping {
    ping
  }
`;
