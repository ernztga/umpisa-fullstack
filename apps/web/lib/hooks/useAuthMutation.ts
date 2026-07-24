import {
  useMutation,
  type DocumentNode,
  type MutationHookOptions,
  type OperationVariables,
} from '@apollo/client';
import { useToast } from '@/lib/store/useToastStore';

/**
 * Thin, reusable wrapper around Apollo's useMutation that standardizes
 * error-toast behavior across every mutation in the app. Individual
 * call sites still get Apollo's normal `data`/`loading`/full `error`
 * object back — this only centralizes the "show a toast on failure"
 * side effect so it's never re-implemented ad hoc per screen.
 *
 * Success toasts are intentionally left to each call site (via
 * `onCompleted`) rather than standardized here, since a good success
 * message is usually specific to the action ("Category created" vs.
 * "Welcome back") in a way a generic wrapper can't phrase well.
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
