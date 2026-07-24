import { gql } from 'graphql-tag';

export const authTypeDefs = gql`
  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    preferredCurrency: String!
    createdAt: String!
  }

  input UpdateProfileInput {
    preferredCurrency: String!
  }

  input RegisterInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  type AuthPayload {
    user: User!
  }

  extend type Query {
    """
    Returns the currently authenticated user, or null if not logged in.
    """
    me: User
  }

  extend type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    """
    Rotates the current session's tokens using the httpOnly refresh
    cookie. Returns the still-current user on success.
    """
    refreshToken: AuthPayload!
    logout: Boolean!
  }

  extend type Mutation {
    updateProfile(input: UpdateProfileInput!): User!
  }
`;
