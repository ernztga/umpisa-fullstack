import { useSnackbar, type VariantType } from 'notistack';

/**
 * Thin wrapper hook around useSnackbar, giving the rest of
 * the app one consistent, reusable `useToast()` API
 */
export function useToast(): {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
} {
  const { enqueueSnackbar } = useSnackbar();

  const show = (message: string, variant: VariantType): void => {
    enqueueSnackbar(message, { variant, autoHideDuration: 4000 });
  };

  return {
    showSuccess: (message: string) => show(message, 'success'),
    showError: (message: string) => show(message, 'error'),
    showInfo: (message: string) => show(message, 'info'),
  };
}
