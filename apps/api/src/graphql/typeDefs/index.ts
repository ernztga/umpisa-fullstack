import { gql } from 'graphql-tag';
import { authTypeDefs } from '@/graphql/typeDefs/auth';

const rootTypeDefs = gql`
  type Query {
    ping: String!
  }

  type Mutation {
    _empty: Boolean
  }
`;

export const typeDefs = [rootTypeDefs, authTypeDefs];
