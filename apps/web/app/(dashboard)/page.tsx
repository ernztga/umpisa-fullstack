'use client';

import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { subDays } from 'date-fns';
import { QueryStateHandler } from '@/components/shared/QueryStateHandler';
import { ME_QUERY } from '@/lib/graphql/mutations/auth';
import { EXPENSES_WITH_CONVERSION_QUERY } from '@/lib/graphql/queries/expenses';
import { findCurrency } from '@/lib/consts/currencies';

interface MeQueryData {
  me: { preferredCurrency: string } | null;
}

interface ExpenseWithConversion {
  id: string;
  amount: string;
  currency: string;
  convertedAmount: string | null;
  description: string;
  date: string;
  category: { id: string; name: string; color: string } | null;
}

interface ExpensesQueryData {
  expenses: { items: ExpenseWithConversion[]; hasNextPage: boolean; endCursor: string | null };
}

export default function DashboardPage(): React.JSX.Element {
  const startDate = useMemo(() => subDays(new Date(), 90).toISOString(), []);

  const { data: meData, loading: meLoading } = useQuery<MeQueryData>(ME_QUERY);
  const preferredCurrency = meData?.me?.preferredCurrency ?? 'PHP';

  const { data, loading, error, refetch } = useQuery<ExpensesQueryData>(
    EXPENSES_WITH_CONVERSION_QUERY,
    {
      variables: { first: 100, filter: { startDate }, targetCurrency: preferredCurrency },
      skip: meLoading, // wait until we know the preferred currency before firing this query
    },
  );

  const expenses = data?.expenses.items ?? [];

  // Prefer the converted amount; if conversion failed for a given
  // expense fall back to its original amount
  const amountInPreferredCurrency = (expense: ExpenseWithConversion): number =>
    Number(expense.convertedAmount ?? expense.amount);

  const totalSpend = expenses.reduce((sum, e) => sum + amountInPreferredCurrency(e), 0);

  const byCategory = expenses.reduce<
    Record<string, { name: string; color: string; total: number }>
  >((acc, e) => {
    const key = e.category?.id ?? 'uncategorized';
    const name = e.category?.name ?? 'Uncategorized';
    const color = e.category?.color ?? '#9CA3AF';
    acc[key] = acc[key] ?? { name, color, total: 0 };
    acc[key].total += amountInPreferredCurrency(e);
    return acc;
  }, {});
  const categoryBreakdown = Object.values(byCategory);

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const currencySymbolPrefix = findCurrency(preferredCurrency).flag;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Dashboard
      </Typography>

      <QueryStateHandler
        loading={loading || meLoading}
        error={error}
        isEmpty={expenses.length === 0}
        emptyMessage="No expenses in the last 90 days — your dashboard will populate once you add some."
        onRetry={() => void refetch()}
      >
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Total spend (90 days) · {currencySymbolPrefix} {preferredCurrency}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {preferredCurrency} {totalSpend.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Transactions
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {expenses.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Categories used
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {categoryBreakdown.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ height: 340 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                  Spend by category ({preferredCurrency})
                </Typography>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="total"
                      nameKey="name"
                      outerRadius={90}
                      label
                    >
                      {categoryBreakdown.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => {
                        if (typeof value !== 'number') {
                          return String(value ?? '');
                        }

                        return `${preferredCurrency} ${value.toFixed(2)}`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ height: 340 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                  Recent expenses
                </Typography>
                {recentExpenses.map((expense) => (
                  <Box
                    key={expense.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      py: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="body2">{expense.description}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {expense.currency} {expense.amount}
                      {expense.currency !== preferredCurrency && expense.convertedAmount && (
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                          sx={{ ml: 0.5 }}
                        >
                          (≈ {preferredCurrency} {expense.convertedAmount})
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </QueryStateHandler>
    </Box>
  );
}
