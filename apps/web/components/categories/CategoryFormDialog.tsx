'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack } from '@mui/material';
import { useEffect } from 'react';
import { FormTextField } from '@/components/form/FormTextField';
import { categoryFormSchema, type CategoryFormValues } from '@/lib/validation/categorySchemas';
import type { CategoryDTO } from '@/lib/hooks/useCategories';
import { ColorPicker } from '../form/ColorPicker';

interface CategoryFormDialogProps {
  open: boolean;
  category: CategoryDTO | null; // null = create mode, non-null = edit mode
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: CategoryFormValues) => void;
}

/**
 * A single dialog handles both create and edit — the only difference
 * is whether `category` is provided as default values. Avoids
 * maintaining two nearly-identical dialog components.
 */
export function CategoryFormDialog({
  open,
  category,
  isSubmitting,
  onClose,
  onSubmit,
}: CategoryFormDialogProps): React.JSX.Element {
  const { control, handleSubmit, reset } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: '', color: '#6366F1' },
  });

  useEffect(() => {
    if (open) {
      reset(
        category ? { name: category.name, color: category.color } : { name: '', color: '#6366F1' },
      );
    }
  }, [open, category, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{category ? 'Edit category' : 'New category'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={1}>
            <FormTextField name="name" control={control} label="Name" />
            <ColorPicker name="color" control={control} label="Color" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
