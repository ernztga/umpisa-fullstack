import { requireAuth } from '@/graphql/requireAuth';
import { createCategorySchema, updateCategorySchema } from '@/validation/categorySchemas';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/services/categoryService';

export const categoryResolvers = {
  Query: {
    categories: requireAuth((_parent, _args, context) => {
      return listCategories(context.prisma, context.user.id);
    }),
  },
  Mutation: {
    createCategory: requireAuth((_parent: unknown, args: { input: unknown }, context) => {
      const input = createCategorySchema.parse(args.input);
      return createCategory(context.prisma, context.user.id, input);
    }),

    updateCategory: requireAuth(
      (_parent: unknown, args: { id: string; input: unknown }, context) => {
        const input = updateCategorySchema.parse(args.input);
        return updateCategory(context.prisma, context.user.id, args.id, input);
      },
    ),

    deleteCategory: requireAuth((_parent: unknown, args: { id: string }, context) => {
      return deleteCategory(context.prisma, context.user.id, args.id);
    }),
  },
};
