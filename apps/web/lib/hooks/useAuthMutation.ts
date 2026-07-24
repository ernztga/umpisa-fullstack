import {
  useMutation,
  type DocumentNode,
  type MutationHookOptions,
  type OperationVariables,
} from '@apollo/client';
import { useToast } from '@/lib/store/useToastStore';

/**
 * Reusable wrapper using useMutation standardizing
 * error-toast behavior across every apollo mutation in the app.
 */
export function useAuthMutation<TData, TVariables extends OperationVariables>(
  mutation: DocumentNode,
  options?: MutationHookOptions<TData, TVariables>,
) {
  const { showError } = useToast();

  return useMutation<TData, TVariables>(mutation, {
    ...options,
    onError: (error) => {
      showError(error.message);
      options?.onError?.(error);
    },
  });
}
