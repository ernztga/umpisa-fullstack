'use client';

import { useQuery } from '@apollo/client';
import { Box, Typography, Card, CardContent, Avatar, Divider, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import { ME_QUERY, LOGOUT_MUTATION } from '@/lib/graphql/mutations/auth';
import { QueryStateHandler } from '@/components/shared/QueryStateHandler';
import { useSessionStore } from '@/lib/store/useSessionStore';
import { useToast } from '@/lib/store/useToastStore';

interface MeQueryData {
  me: { id: string; email: string; firstName: string; lastName: string; createdAt: string } | null;
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

  return (
    <Box>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 'fontWeightBold',
          mb: 3,
        }}
      >
        Profile
      </Typography>

      <QueryStateHandler loading={loading} error={error} onRetry={() => void refetch()}>
        {data?.me && (
          <Card variant="outlined" sx={{ maxWidth: 480 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: 24 }}>
                  {data.me.firstName.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 'fontWeightBold',
                      mb: 3,
                    }}
                  >
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
        )}
      </QueryStateHandler>
    </Box>
  );
}
