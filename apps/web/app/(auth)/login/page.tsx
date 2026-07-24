'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Stack, Link as MuiLink, Typography } from '@mui/material';
import NextLink from 'next/link';
import { AuthCard } from '@/components/auth/AuthCard';
import { FormTextField } from '@/components/form/FormTextField';
import { loginFormSchema, type LoginFormValues } from '@/lib/validation/authSchemas';
import { LOGIN_MUTATION, ME_QUERY } from '@/lib/graphql/mutations/auth';
import { useAuthMutation } from '@/lib/hooks/useAuthMutation';
import { useSessionStore } from '@/lib/store/useSessionStore';
import { useToast } from '@/lib/store/useToastStore';

interface LoginMutationData {
  login: { user: { id: string; email: string; firstName: string } };
}

export default function LoginPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSuccess } = useToast();
  const setAuthenticated = useSessionStore((state) => state.setAuthenticated);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const [login] = useAuthMutation<LoginMutationData, { input: LoginFormValues }>(LOGIN_MUTATION, {
    // Re-fetching `me` immediately after login primes Apollo's cache
    // so the dashboard shell (Step 10) doesn't show a loading spinner
    // for user info it could have known instantly.
    refetchQueries: [{ query: ME_QUERY }],
    onCompleted: (data) => {
      setAuthenticated(true);
      showSuccess(`Welcome back, ${data.login.user.firstName}!`);
      const redirectTo = searchParams.get('redirectTo') ?? '/';
      router.push(redirectTo);
    },
  });

  const onSubmit = (values: LoginFormValues): void => {
    void login({ variables: { input: values } });
  };

  return (
    <AuthCard title="Welcome back" subtitle="Log in to manage your expenses">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={1}>
          <FormTextField
            name="email"
            control={control}
            label="Email"
            type="email"
            autoComplete="email"
          />
          <FormTextField
            name="password"
            control={control}
            label="Password"
            type="password"
            autoComplete="current-password"
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
            sx={{ mt: 2 }}
          >
            {isSubmitting ? 'Logging in…' : 'Log in'}
          </Button>
        </Stack>
      </form>
      <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
        Don't have an account?{' '}
        <MuiLink component={NextLink} href="/register">
          Register
        </MuiLink>
      </Typography>
    </AuthCard>
  );
}
