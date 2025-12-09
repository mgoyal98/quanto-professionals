import {
  AppBar,
  Button,
  Divider,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { Menu as MenuIcon, Logout, BusinessRounded } from '@mui/icons-material';
import { useCompany } from '@/providers/company';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { company, closeCompany } = useCompany();

  const handleLogout = () => {
    void closeCompany();
  };

  return (
    <AppBar
      position='fixed'
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar>
        <IconButton
          color='inherit'
          aria-label='open drawer'
          edge='start'
          onClick={onMenuClick}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant='h6' noWrap component='div' sx={{ flexGrow: 1 }}>
          Quanto
        </Typography>

        <Stack direction='row' spacing={2} alignItems='center'>
          <Stack direction='row' spacing={1} alignItems='center'>
            <BusinessRounded />
            <Typography variant='subtitle1'>
              {company?.name || 'Quanto'}
            </Typography>
          </Stack>

          <Divider orientation='vertical' flexItem />

          <Button
            color='inherit'
            startIcon={<Logout />}
            onClick={handleLogout}
            sx={{ ml: 2 }}
          >
            Logout
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
