import { useQuery } from '@apollo/client';
import { CATEGORIES_QUERY } from '@/lib/graphql/queries/categories';

export interface CategoryDTO {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

interface CategoriesQueryData {
  categories: CategoryDTO[];
}

/**
 * Single reusable data hook for categories — consumed by the
 * Categories screen (Step 10), the Expense form's category picker,
 * and the Dashboard's spend-by-category breakdown. Apollo's cache
 * deduplicates identical queries automatically, so multiple
 * consumers of this hook share one network request, not three.
 */
export function useCategories() {
  const { data, loading, error, refetch } = useQuery<CategoriesQueryData>(CATEGORIES_QUERY);

  return {
    categories: data?.categories ?? [],
    loading,
    error,
    refetch,
  };
}
