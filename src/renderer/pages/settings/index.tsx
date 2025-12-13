import { Box, Card, Stack, Tab, Tabs, Typography } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { Routes } from '@/common/routes';

type SettingsTab = 'company' | 'invoice-series' | 'payment-methods';

const tabRoutes: Record<SettingsTab, string> = {
  company: Routes.SettingsCompany,
  'invoice-series': Routes.SettingsInvoiceSeries,
  'payment-methods': Routes.SettingsPaymentMethods,
};

function getActiveTab(pathname: string): SettingsTab {
  if (pathname.includes('/settings/payment-methods')) return 'payment-methods';
  if (pathname.includes('/settings/invoice-series')) return 'invoice-series';
  if (pathname.includes('/settings/company')) return 'company';
  return 'company';
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = getActiveTab(location.pathname);

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: SettingsTab
  ) => {
    navigate(tabRoutes[newValue]);
  };

  return (
    <Box>
      <Stack spacing={3}>
        <Typography variant='h4'>Settings</Typography>

        <Card sx={{ p: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label='settings tabs'
            >
              <Tab label='Company' value='company' sx={{ minWidth: 120 }} />
              <Tab
                label='Invoice Series'
                value='invoice-series'
                sx={{ minWidth: 140 }}
              />
              <Tab
                label='Payment Methods'
                value='payment-methods'
                sx={{ minWidth: 160 }}
              />
            </Tabs>
          </Box>

          <Box sx={{ p: 3 }}>
            <Outlet />
          </Box>
        </Card>
      </Stack>
    </Box>
  );
}
