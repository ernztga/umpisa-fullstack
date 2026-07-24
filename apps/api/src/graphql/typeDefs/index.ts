import { gql } from 'graphql-tag';
import { authTypeDefs } from '@/graphql/typeDefs/auth';
import { categoryTypeDefs } from '@/graphql/typeDefs/category';
import { expenseTypeDefs } from '@/graphql/typeDefs/expense';

const rootTypeDefs = gql`
  type Query {
    ping: String!
  }

  type Mutation {
    _empty: Boolean
  }
`;

export const typeDefs = [rootTypeDefs, authTypeDefs, categoryTypeDefs, expenseTypeDefs];
