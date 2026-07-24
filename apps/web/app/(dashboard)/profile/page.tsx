'use client';

import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@apollo/client';
import { Box, Typography, Card, CardContent, Avatar, Divider, Button, Stack } from '@mui/material';
import { useRouter } from 'next/navigation';
import { ME_QUERY, LOGOUT_MUTATION, UPDATE_PROFILE_MUTATION } from '@/lib/graphql/mutations/auth';
import { QueryStateHandler } from '@/components/shared/QueryStateHandler';
import { CurrencySelect } from '@/components/form/CurrencySelect';
import { useSessionStore } from '@/lib/store/useSessionStore';
import { useToast } from '@/lib/store/useToastStore';
import { useEffect } from 'react';

interface MeQueryData {
  me: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    preferredCurrency: string;
    createdAt: string;
  } | null;
}

interface ProfileFormValues {
  preferredCurrency: string;
}

export default function ProfilePage(): React.JSX.Element {
  const { data, loading, error, refetch } = useQuery<MeQueryData>(ME_QUERY);
  const router = useRouter();
  const { showSuccess } = useToast();
  const setAuthenticated = useSessionStore((state) => state.setAuthenticated);

  const [logout, { loading: loggingOut }] = useMutation(LOGOUT_MUTATION, {
    onCompleted: () => {
      setAuthenticated(false);
      showSuccess('Logged out successfully.');
      router.push('/login');
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ProfileFormValues>({
    defaultValues: { preferredCurrency: 'PHP' },
  });

  useEffect(() => {
    if (data?.me) reset({ preferredCurrency: data.me.preferredCurrency });
  }, [data, reset]);

  const [updateProfile] = useMutation(UPDATE_PROFILE_MUTATION, {
    // Refetches `me` so every screen reading preferredCurrency (the
    // Dashboard, specifically) sees the new value immediately.
    refetchQueries: [{ query: ME_QUERY }],
    onCompleted: () => showSuccess('Preferred currency updated.'),
  });

  const onSubmit = (values: ProfileFormValues): void => {
    void updateProfile({ variables: { input: values } });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Profile
      </Typography>

      <QueryStateHandler loading={loading} error={error} onRetry={() => void refetch()}>
        {data?.me && (
          <Stack spacing={3} sx={{ maxWidth: 480 }}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: 24 }}>
                    {data.me.firstName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {data.me.firstName} {data.me.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {data.me.email}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Member since
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  {new Date(data.me.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  disabled={loggingOut}
                  onClick={() => void logout()}
                >
                  {loggingOut ? 'Logging out…' : 'Log out'}
                </Button>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                  Dashboard settings
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Choose the currency used to display your total spend on the Dashboard. Expenses
                  logged in other currencies are converted automatically.
                </Typography>
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                  <CurrencySelect
                    name="preferredCurrency"
                    control={control}
                    label="Preferred currency"
                  />
                  <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ mt: 1 }}>
                    Save
                  </Button>
                </form>
              </CardContent>
            </Card>
          </Stack>
        )}
      </QueryStateHandler>
    </Box>
  );
}
