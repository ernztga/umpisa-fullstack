import { Box, Container } from '@mui/material';

/**
 * Minimal, centered layout shared by /login and /register — no
 * navigation/sidebar, since there's no authenticated user context to
 * show nav for yet. Kept deliberately separate from the dashboard
 * layout (Step 10) via the (auth) route group.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="xs">{children}</Container>
    </Box>
  );
}
