'use client';

import { useState, useMemo } from 'react';
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
  TableSortLabel,
  TextField,
  MenuItem,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { QueryStateHandler } from '@/components/shared/QueryStateHandler';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ExpenseFormDialog } from '@/components/expenses/ExpenseFormDialog';
import { useExpenses, type ExpenseDTO } from '@/lib/hooks/useExpenses';
import { useCategories } from '@/lib/hooks/useCategories';
import {
  CREATE_EXPENSE_MUTATION,
  UPDATE_EXPENSE_MUTATION,
  DELETE_EXPENSE_MUTATION,
} from '@/lib/graphql/queries/expenses';
import { useAuthMutation } from '@/lib/hooks/useAuthMutation';
import { useToast } from '@/lib/store/useToastStore';
import type { ExpenseFormValues } from '@/lib/validation/expenseSchemas';

type SortField = 'date' | 'description' | 'category' | 'amount';

export default function ExpensesPage(): React.JSX.Element {
  const { categories } = useCategories();
  const [descriptionFilter, setDescriptionFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { expenses, hasNextPage, loading, error, loadMore, refetch } = useExpenses({
    first: 20,
    description: descriptionFilter || undefined,
    categoryId: categoryFilter || undefined,
    sortBy,
    sortDirection,
  });

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

  const handleSort = (field: SortField): void => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const sortHeader = (field: SortField, label: string): React.JSX.Element => (
    <TableCell>
      <TableSortLabel
        active={sortBy === field}
        direction={sortBy === field ? sortDirection : 'asc'}
        onClick={() => handleSort(field)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant="h4" sx={{ fontWegight: 600 }}>
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

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="Search description"
          size="small"
          value={descriptionFilter}
          onChange={(e) => setDescriptionFilter(e.target.value)}
          sx={{ minWidth: 220 }}
        />
        <TextField
          select
          label="Category"
          size="small"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All categories</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <QueryStateHandler
        loading={loading}
        error={error}
        isEmpty={expenses.length === 0}
        emptyMessage="No expenses match your filters."
        onRetry={() => void refetch()}
      >
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                {sortHeader('date', 'Date')}
                {sortHeader('description', 'Description')}
                {sortHeader('category', 'Category')}
                {sortHeader('amount', 'Amount')}
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
                  <TableCell>
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
        </Box>

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
