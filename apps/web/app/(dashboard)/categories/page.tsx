'use client';

import { useState } from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, IconButton, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { QueryStateHandler } from '@/components/shared/QueryStateHandler';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { CategoryFormDialog } from '@/components/categories/CategoryFormDialog';
import { useCategories, type CategoryDTO } from '@/lib/hooks/useCategories';
import {
  CREATE_CATEGORY_MUTATION,
  UPDATE_CATEGORY_MUTATION,
  DELETE_CATEGORY_MUTATION,
  CATEGORIES_QUERY,
} from '@/lib/graphql/queries/categories';
import { useAuthMutation } from '@/lib/hooks/useAuthMutation';
import { useToast } from '@/lib/store/useToastStore';
import type { CategoryFormValues } from '@/lib/validation/categorySchemas';

export default function CategoriesPage(): React.JSX.Element {
  const { categories, loading, error, refetch } = useCategories();
  const { showSuccess } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryDTO | null>(null);

  const [createCategory, { loading: creating }] = useAuthMutation(CREATE_CATEGORY_MUTATION, {
    refetchQueries: [{ query: CATEGORIES_QUERY }],
    onCompleted: () => {
      showSuccess('Category created.');
      setFormOpen(false);
    },
  });

  const [updateCategory, { loading: updating }] = useAuthMutation(UPDATE_CATEGORY_MUTATION, {
    refetchQueries: [{ query: CATEGORIES_QUERY }],
    onCompleted: () => {
      showSuccess('Category updated.');
      setFormOpen(false);
      setEditingCategory(null);
    },
  });

  const [deleteCategory, { loading: deleting }] = useAuthMutation(DELETE_CATEGORY_MUTATION, {
    refetchQueries: [{ query: CATEGORIES_QUERY }],
    onCompleted: () => {
      showSuccess('Category deleted.');
      setDeleteTarget(null);
    },
  });

  const handleSubmit = (values: CategoryFormValues): void => {
    if (editingCategory) {
      void updateCategory({ variables: { id: editingCategory.id, input: values } });
    } else {
      void createCategory({ variables: { input: values } });
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
          Categories
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingCategory(null);
            setFormOpen(true);
          }}
        >
          New Category
        </Button>
      </Box>

      <QueryStateHandler
        loading={loading}
        error={error}
        isEmpty={categories.length === 0}
        emptyMessage="No categories yet — create your first one to start organizing expenses."
        onRetry={() => void refetch()}
      >
        <Grid container spacing={2}>
          {categories.map((category) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={category.id}>
              <Card variant="outlined">
                <CardContent
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Chip
                    label={category.name}
                    sx={{ bgcolor: category.color, color: '#fff', fontWeight: 600 }}
                  />
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditingCategory(category);
                        setFormOpen(true);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => setDeleteTarget(category)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </QueryStateHandler>

      <CategoryFormDialog
        open={formOpen}
        category={editingCategory}
        isSubmitting={creating || updating}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete category?"
        message={`"${deleteTarget?.name}" will be removed. Expenses in this category will become uncategorized, not deleted.`}
        isSubmitting={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() =>
          deleteTarget && void deleteCategory({ variables: { id: deleteTarget.id } })
        }
      />
    </Box>
  );
}
