import { createTheme } from '@mui/material/styles';

/**
 * Single shared MUI theme instance.
 */
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4F46E5', // indigo — used consistently across buttons, links, active states
    },
    secondary: {
      main: '#14B8A6', // teal — reserved for secondary actions/accents
    },
    error: {
      main: '#DC2626',
    },
    background: {
      default: '#F9FAFB',
      paper: '#FFFFFF',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: 'var(--font-inter), system-ui, sans-serif',
  },
});
