import type { GraphQLContext } from '@/graphql/context';
import { AuthenticationError } from '@/errors/AppError';
import type { AuthenticatedUser } from '@/graphql/context';

/**
 * A GraphQL resolver function shape, generic over its return type and
 * arguments — matches how Apollo actually calls resolvers:
 * (parent, args, context, info) => result.
 */
type Resolver<TArgs, TResult> = (
  parent: unknown,
  args: TArgs,
  context: GraphQLContext,
  info: unknown,
) => Promise<TResult> | TResult;

/**
 * A resolver whose context is GUARANTEED to have a non-null `user`,
 * for use inside resolvers wrapped by requireAuth — avoids repeating
 * `context.user!.id` (non-null assertions) throughout resolver bodies.
 */
type AuthenticatedContext = Omit<GraphQLContext, 'user'> & { user: AuthenticatedUser };

type AuthenticatedResolver<TArgs, TResult> = (
  parent: unknown,
  args: TArgs,
  context: AuthenticatedContext,
  info: unknown,
) => Promise<TResult> | TResult;

/**
 * Higher-order function wrapping any resolver to require an
 * authenticated user before it runs. 
 */
export function requireAuth<TArgs, TResult>(
  resolver: AuthenticatedResolver<TArgs, TResult>,
): Resolver<TArgs, TResult> {
  return (parent, args, context, info) => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to perform this action.');
    }

    return resolver(parent, args, context as AuthenticatedContext, info);
  };
}
