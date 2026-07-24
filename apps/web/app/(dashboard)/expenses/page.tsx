'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { QueryStateHandler } from '@/components/shared/QueryStateHandler';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ExpenseFormDialog } from '@/components/expenses/ExpenseFormDialog';
import { useExpenses, type ExpenseDTO } from '@/lib/hooks/useExpenses';
import {
  CREATE_EXPENSE_MUTATION,
  UPDATE_EXPENSE_MUTATION,
  DELETE_EXPENSE_MUTATION,
} from '@/lib/graphql/queries/expenses';
import { useAuthMutation } from '@/lib/hooks/useAuthMutation';
import { useToast } from '@/lib/store/useToastStore';
import type { ExpenseFormValues } from '@/lib/validation/expenseSchemas';

export default function ExpensesPage(): React.JSX.Element {
  const { expenses, hasNextPage, loading, error, loadMore, refetch } = useExpenses({ first: 20 });
  const { showSuccess } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseDTO | null>(null);

  const [createExpense, { loading: creating }] = useAuthMutation(CREATE_EXPENSE_MUTATION, {
    onCompleted: () => {
      showSuccess('Expense added.');
      setFormOpen(false);
      void refetch();
    },
  });

  const [updateExpense, { loading: updating }] = useAuthMutation(UPDATE_EXPENSE_MUTATION, {
    onCompleted: () => {
      showSuccess('Expense updated.');
      setFormOpen(false);
      setEditingExpense(null);
      void refetch();
    },
  });

  const [deleteExpense, { loading: deleting }] = useAuthMutation(DELETE_EXPENSE_MUTATION, {
    onCompleted: () => {
      showSuccess('Expense deleted.');
      setDeleteTarget(null);
      void refetch();
    },
  });

  const handleSubmit = (values: ExpenseFormValues): void => {
    const input = { ...values, categoryId: values.categoryId || null };
    if (editingExpense) {
      void updateExpense({ variables: { id: editingExpense.id, input } });
    } else {
      void createExpense({ variables: { input } });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
          }}
        >
          Expenses
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingExpense(null);
            setFormOpen(true);
          }}
        >
          New Expense
        </Button>
      </Box>

      <QueryStateHandler
        loading={loading}
        error={error}
        isEmpty={expenses.length === 0}
        emptyMessage="No expenses logged yet — add your first one to get started."
        onRetry={() => void refetch()}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id} hover>
                <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell>
                  {expense.category ? (
                    <Chip
                      size="small"
                      label={expense.category.name}
                      sx={{ bgcolor: expense.category.color, color: '#fff' }}
                    />
                  ) : (
                    <Chip size="small" label="Uncategorized" variant="outlined" />
                  )}
                </TableCell>
                <TableCell align="right">
                  {expense.currency} {expense.amount}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditingExpense(expense);
                      setFormOpen(true);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => setDeleteTarget(expense)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {hasNextPage && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button onClick={loadMore}>Load more</Button>
          </Box>
        )}
      </QueryStateHandler>

      <ExpenseFormDialog
        open={formOpen}
        expense={editingExpense}
        isSubmitting={creating || updating}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete expense?"
        message={`"${deleteTarget?.description}" will be permanently deleted. This cannot be undone.`}
        isSubmitting={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && void deleteExpense({ variables: { id: deleteTarget.id } })}
      />
    </Box>
  );
}
