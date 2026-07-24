import { useQuery } from '@apollo/client';
import { EXPENSES_QUERY } from '@/lib/graphql/queries/expenses';

export interface ExpenseDTO {
  id: string;
  amount: string;
  currency: string;
  description: string;
  date: string;
  category: { id: string; name: string; color: string } | null;
}

interface ExpensesQueryData {
  expenses: { items: ExpenseDTO[]; hasNextPage: boolean; endCursor: string | null };
}

interface UseExpensesOptions {
  first?: number;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  minAmount?: string;
  maxAmount?: string;
  sortBy?: 'date' | 'description' | 'category' | 'amount';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Reusable data hook wrapping the paginated `expenses` query. Exposes
 * a `loadMore` function that appends the next page into Apollo's
 * cache via `fetchMore`, so the Expenses screen's "Load more" button
 * is a one-line call rather than manually managing cursor state.
 */
export function useExpenses(options: UseExpensesOptions = {}) {
  const filter =
    options.categoryId ||
    options.startDate ||
    options.endDate ||
    options.description ||
    options.minAmount ||
    options.maxAmount
      ? {
          ...(options.categoryId && { categoryId: options.categoryId }),
          ...(options.startDate && { startDate: options.startDate }),
          ...(options.endDate && { endDate: options.endDate }),
          ...(options.description && { description: options.description }),
          ...(options.minAmount && { minAmount: options.minAmount }),
          ...(options.maxAmount && { maxAmount: options.maxAmount }),
        }
      : undefined;

  const variables = {
    first: options.first ?? 20,
    filter,
    sortBy: options.sortBy ?? 'date',
    sortDirection: options.sortDirection ?? 'desc',
  };

  const { data, loading, error, fetchMore, refetch } = useQuery<ExpensesQueryData>(EXPENSES_QUERY, {
    variables,
  });

  const loadMore = (): void => {
    if (!data?.expenses.hasNextPage) return;
    void fetchMore({
      variables: { ...variables, after: data.expenses.endCursor },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          expenses: {
            ...fetchMoreResult.expenses,
            items: [...prev.expenses.items, ...fetchMoreResult.expenses.items],
          },
        };
      },
    });
  };

  return {
    expenses: data?.expenses.items ?? [],
    hasNextPage: data?.expenses.hasNextPage ?? false,
    loading,
    error,
    loadMore,
    refetch,
  };
}
