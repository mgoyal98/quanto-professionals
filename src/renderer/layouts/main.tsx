import { Box, Toolbar } from '@mui/material';
import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router';

import Header from '@/components/navigation/header';
import Sidebar from '@/components/navigation/sidebar';
import { useCompany } from '@/providers/company';
import { Routes } from '@/common/routes';

export default function MainLayout() {
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);

  const { company } = useCompany();

  useEffect(() => {
    if (!company) {
      navigate(Routes.SelectCompany);
    }
  }, [company]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Header onMenuClick={handleDrawerToggle} />
      <Sidebar mobileOpen={mobileOpen} onMobileClose={handleDrawerToggle} />
      <Box
        component='main'
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 240px)` },
          height: '100vh',
          overflow: 'auto',
          bgcolor: 'grey.50',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
