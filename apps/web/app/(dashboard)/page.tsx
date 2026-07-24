'use client';

import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { QueryStateHandler } from '@/components/shared/QueryStateHandler';
import { useExpenses } from '@/lib/hooks/useExpenses';
import { subDays } from 'date-fns';
import { useMemo } from 'react';

/**
 * See architectural decision 2.3: this dashboard computes totals
 * client-side over the last 90 days of expenses (capped at 100 rows)
 * rather than a dedicated server-side aggregate query — an explicit,
 * documented scope tradeoff appropriate for this project's data
 * volume, not a production-scale aggregation strategy.
 */
export default function DashboardPage(): React.JSX.Element {
  const startDate = useMemo(() => subDays(new Date(), 90).toISOString(), []);
  const { expenses, loading, error, refetch } = useExpenses({ first: 100, startDate });

  const totalSpend = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const byCategory = expenses.reduce<
    Record<string, { name: string; color: string; total: number }>
  >((acc, e) => {
    const key = e.category?.id ?? 'uncategorized';
    const name = e.category?.name ?? 'Uncategorized';
    const color = e.category?.color ?? '#9CA3AF';
    acc[key] = acc[key] ?? { name, color, total: 0 };
    acc[key].total += Number(e.amount);
    return acc;
  }, {});
  const categoryBreakdown = Object.values(byCategory);

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <Box>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 'fontWeightBold',
          mb: 3,
        }}
      >
        Dashboard
      </Typography>

      <QueryStateHandler
        loading={loading}
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
                  Total spend (90 days)
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  ₱{totalSpend.toFixed(2)}
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
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                  }}
                >
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
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  {categoryBreakdown.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ height: 340 }}>
              <CardContent>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  Spend by category
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
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ height: 340 }}>
              <CardContent>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
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
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 'fontWeightBold',
                      }}
                    >
                      {expense.currency} {expense.amount}
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
