'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button, Stack, Link as MuiLink, Typography } from '@mui/material';
import NextLink from 'next/link';
import { AuthCard } from '@/components/auth/AuthCard';
import { FormTextField } from '@/components/form/FormTextField';
import { registerFormSchema, type RegisterFormValues } from '@/lib/validation/authSchemas';
import { REGISTER_MUTATION, ME_QUERY } from '@/lib/graphql/mutations/auth';
import { useAuthMutation } from '@/lib/hooks/useAuthMutation';
import { useSessionStore } from '@/lib/store/useSessionStore';
import { useToast } from '@/lib/store/useToastStore';

interface RegisterMutationData {
  register: { user: { id: string; email: string; firstName: string } };
}

export default function RegisterPage(): React.JSX.Element {
  const router = useRouter();
  const { showSuccess } = useToast();
  const setAuthenticated = useSessionStore((state) => state.setAuthenticated);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
  });

  const [register] = useAuthMutation<RegisterMutationData, { input: RegisterFormValues }>(
    REGISTER_MUTATION,
    {
      refetchQueries: [{ query: ME_QUERY }],
      onCompleted: (data) => {
        setAuthenticated(true);
        showSuccess(`Welcome, ${data.register.user.firstName}! Your account is ready.`);
        router.push('/');
      },
    },
  );

  const onSubmit = (values: RegisterFormValues): void => {
    void register({ variables: { input: values } });
  };

  return (
    <AuthCard title="Create your account" subtitle="Start tracking your expenses in minutes">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1}>
            <FormTextField
              name="firstName"
              control={control}
              label="First name"
              autoComplete="given-name"
            />
            <FormTextField
              name="lastName"
              control={control}
              label="Last name"
              autoComplete="family-name"
            />
          </Stack>
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
            autoComplete="new-password"
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
            sx={{ mt: 2 }}
          >
            {isSubmitting ? 'Creating account…' : 'Register'}
          </Button>
        </Stack>
      </form>
      <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
        Already have an account?{' '}
        <MuiLink component={NextLink} href="/login">
          Log in
        </MuiLink>
      </Typography>
    </AuthCard>
  );
}
