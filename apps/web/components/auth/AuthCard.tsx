import { Paper, Typography, Box } from '@mui/material';
import type { ReactNode } from 'react';

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/**
 * Reusable card shell shared by Login and Register — the only
 * difference between the two screens is their form fields and copy,
 * so extracting the shared chrome (paper, title, subtitle spacing)
 * here avoids duplicating layout markup between two nearly-identical
 * screens. Directly satisfies "high component reusability."
 */
export function AuthCard({ title, subtitle, children }: AuthCardProps): React.JSX.Element {
  return (
    <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      </Box>
      {children}
    </Paper>
  );
}
