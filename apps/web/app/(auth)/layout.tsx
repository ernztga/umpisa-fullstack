import { Box, Container } from '@mui/material';

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
