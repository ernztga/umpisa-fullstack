import { gql } from 'graphql-tag';

export const categoryTypeDefs = gql`
  type Category {
    id: ID!
    name: String!
    color: String!
    createdAt: String!
    updatedAt: String!
  }

  input CreateCategoryInput {
    name: String!
    color: String
  }

  input UpdateCategoryInput {
    name: String
    color: String
  }

  extend type Query {
    """
    All categories belonging to the current authenticated user,
    ordered alphabetically by name.
    """
    categories: [Category!]!
  }

  extend type Mutation {
    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(id: ID!, input: UpdateCategoryInput!): Category!
    deleteCategory(id: ID!): Category!
  }
`;
