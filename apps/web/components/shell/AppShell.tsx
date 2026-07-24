'use client';

import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  Divider,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CategoryIcon from '@mui/icons-material/Category';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import { LOGOUT_MUTATION } from '@/lib/graphql/mutations/auth';
import { useSessionStore } from '@/lib/store/useSessionStore';
import { useToast } from '@/lib/store/useToastStore';
import type { ReactNode } from 'react';

const DRAWER_WIDTH = 240;

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: <DashboardIcon /> },
  { label: 'Expenses', href: '/expenses', icon: <ReceiptLongIcon /> },
  { label: 'Categories', href: '/categories', icon: <CategoryIcon /> },
  { label: 'Profile', href: '/profile', icon: <PersonIcon /> },
] as const;

interface AppShellProps {
  userInitial: string;
  userName: string;
  children: ReactNode;
}

export function AppShell({ userInitial, userName, children }: AppShellProps): React.JSX.Element {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('md'));

  const pathname = usePathname();
  const router = useRouter();
  const { showSuccess } = useToast();
  const setAuthenticated = useSessionStore((state) => state.setAuthenticated);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [logout] = useMutation(LOGOUT_MUTATION, {
    onCompleted: () => {
      setAuthenticated(false);
      showSuccess('Logged out successfully.');
      router.push('/login');
    },
  });

  const handleLogout = (): void => {
    setAnchorEl(null);
    void logout();
  };

  const navList = (
    <List>
      {NAV_ITEMS.map((item) => (
        <ListItemButton
          key={item.href}
          component={NextLink}
          href={item.href}
          selected={pathname === item.href}
          onClick={() => isCompact && setDrawerOpen(false)}
        >
          <ListItemIcon>{item.icon}</ListItemIcon>
          <ListItemText primary={item.label} />
        </ListItemButton>
      ))}
    </List>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          width: isCompact ? '100%' : `calc(100% - ${DRAWER_WIDTH}px)`,
          ml: isCompact ? 0 : `${DRAWER_WIDTH}px`,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {isCompact && (
            <IconButton onClick={() => setDrawerOpen(true)} aria-label="Open navigation">
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
              {userInitial}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {userName}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Log out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isCompact ? 'temporary' : 'permanent'}
        open={isCompact ? drawerOpen : true}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }} // better mobile open-performance
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Finance Tracker
          </Typography>
        </Toolbar>
        {navList}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, mt: 8, width: '100%' }}>
        {children}
      </Box>
    </Box>
  );
}
