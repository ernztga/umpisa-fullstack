'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  MenuItem,
  TextField,
} from '@mui/material';
import { FormTextField } from '@/components/form/FormTextField';
import { expenseFormSchema, type ExpenseFormValues } from '@/lib/validation/expenseSchemas';
import { useCategories } from '@/lib/hooks/useCategories';
import type { ExpenseDTO } from '@/lib/hooks/useExpenses';

interface ExpenseFormDialogProps {
  open: boolean;
  expense: ExpenseDTO | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: ExpenseFormValues) => void;
}

export function ExpenseFormDialog({
  open,
  expense,
  isSubmitting,
  onClose,
  onSubmit,
}: ExpenseFormDialogProps): React.JSX.Element {
  const { categories } = useCategories();
  const { control, handleSubmit, reset } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: { amount: '', currency: 'PHP', description: '', date: '', categoryId: null },
  });

  useEffect(() => {
    if (open) {
      reset(
        expense
          ? {
              amount: expense.amount,
              currency: expense.currency,
              description: expense.description,
              date: expense.date.slice(0, 10),
              categoryId: expense.category?.id ?? null,
            }
          : {
              amount: '',
              currency: 'PHP',
              description: '',
              date: new Date().toISOString().slice(0, 10),
              categoryId: null,
            },
      );
    }
  }, [open, expense, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{expense ? 'Edit expense' : 'New expense'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={1}>
            <FormTextField name="description" control={control} label="Description" />
            <Stack direction="row" spacing={1}>
              <FormTextField name="amount" control={control} label="Amount" />
              <FormTextField name="currency" control={control} label="Currency" />
            </Stack>
            <FormTextField name="date" control={control} label="Date" type="date" />
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  select
                  label="Category"
                  fullWidth
                  margin="normal"
                >
                  <MenuItem value="">Uncategorized</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
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
