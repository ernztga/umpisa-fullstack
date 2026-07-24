import { gql } from 'graphql-tag';

export const expenseTypeDefs = gql`
  scalar DateTime

  type Expense {
    id: ID!
    amount: String!
    currency: String!
    """
    Best-effort conversion of 'amount' into the requested target
    currency via a live exchange rate. Null if the target currency
    equals the source currency's rate lookup failed (e.g. the external
    FX provider was unreachable) — the frontend should fall back to
    displaying the original amount/currency in that case.
    """
    convertedAmount(targetCurrency: String!): String
    description: String!
    date: DateTime!
    category: Category
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ExpenseConnection {
    items: [Expense!]!
    hasNextPage: Boolean!
    endCursor: ID
  }

  input CreateExpenseInput {
    amount: String!
    currency: String
    description: String!
    date: DateTime!
    categoryId: ID
  }

  input UpdateExpenseInput {
    amount: String
    currency: String
    description: String
    date: DateTime
    categoryId: ID
  }

  input ExpenseFilterInput {
    categoryId: ID
    startDate: DateTime
    endDate: DateTime
  }

  extend type Query {
    """
    Cursor-paginated list of the current user's expenses, newest
    first. Pass 'after' (the previous page's endCursor) to fetch the
    next page.
    """
    expenses(first: Int, after: ID, filter: ExpenseFilterInput): ExpenseConnection!
  }

  extend type Mutation {
    createExpense(input: CreateExpenseInput!): Expense!
    updateExpense(id: ID!, input: UpdateExpenseInput!): Expense!
    deleteExpense(id: ID!): Expense!
  }

  enum ExpenseSortField {
    date
    description
    category
    amount
  }

  enum SortDirection {
    asc
    desc
  }

  input ExpenseFilterInput {
    categoryId: ID
    startDate: DateTime
    endDate: DateTime
    description: String
    minAmount: String
    maxAmount: String
  }

  extend type Query {
    expenses(
      first: Int
      after: ID
      filter: ExpenseFilterInput
      sortBy: ExpenseSortField
      sortDirection: SortDirection
    ): ExpenseConnection!
  }
`;
