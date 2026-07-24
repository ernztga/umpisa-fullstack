import { gql } from '@apollo/client';

export const EXPENSES_QUERY = gql`
  query Expenses(
    $first: Int
    $after: ID
    $filter: ExpenseFilterInput
    $sortBy: ExpenseSortField
    $sortDirection: SortDirection
  ) {
    expenses(
      first: $first
      after: $after
      filter: $filter
      sortBy: $sortBy
      sortDirection: $sortDirection
    ) {
      items {
        id
        amount
        currency
        description
        date
        category {
          id
          name
          color
        }
      }
      hasNextPage
      endCursor
    }
  }
`;

export const CREATE_EXPENSE_MUTATION = gql`
  mutation CreateExpense($input: CreateExpenseInput!) {
    createExpense(input: $input) {
      id
      amount
      currency
      description
      date
      category {
        id
        name
        color
      }
    }
  }
`;

export const UPDATE_EXPENSE_MUTATION = gql`
  mutation UpdateExpense($id: ID!, $input: UpdateExpenseInput!) {
    updateExpense(id: $id, input: $input) {
      id
      amount
      currency
      description
      date
      category {
        id
        name
        color
      }
    }
  }
`;

export const DELETE_EXPENSE_MUTATION = gql`
  mutation DeleteExpense($id: ID!) {
    deleteExpense(id: $id) {
      id
    }
  }
`;

export const EXPENSES_WITH_CONVERSION_QUERY = gql`
  query ExpensesWithConversion($first: Int, $filter: ExpenseFilterInput, $targetCurrency: String!) {
    expenses(first: $first, filter: $filter) {
      items {
        id
        amount
        currency
        convertedAmount(targetCurrency: $targetCurrency)
        description
        date
        category {
          id
          name
          color
        }
      }
      hasNextPage
      endCursor
    }
  }
`;
