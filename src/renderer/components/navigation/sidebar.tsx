import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Typography,
} from '@mui/material';
import {
  Dashboard,
  Receipt,
  People,
  Settings,
  Assessment,
  FormatPaint,
  Inventory2,
  ReceiptLong,
  LocalOffer,
  Payments,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router';
import { Routes } from '@/common/routes';

const drawerWidth = 240;

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: Routes.Dashboard },
    { text: 'Invoices', icon: <Receipt />, path: Routes.Invoices },
    { text: 'Payments', icon: <Payments />, path: Routes.Payments },
    { text: 'Customers', icon: <People />, path: Routes.Customers },
    { text: 'Items', icon: <Inventory2 />, path: Routes.Items },
    { text: 'Taxes', icon: <ReceiptLong />, path: Routes.TaxTemplates },
    { text: 'Discounts', icon: <LocalOffer />, path: Routes.Discounts },
    { text: 'Reports', icon: <Assessment />, path: '/reports/general' },
    { text: 'Formats', icon: <FormatPaint />, path: Routes.InvoiceFormats },
    { text: 'Settings', icon: <Settings />, path: Routes.Settings },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    onMobileClose();
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant='h6' noWrap component='div'>
          Quanto
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname.startsWith(item.path)}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box
      component='nav'
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label='navigation'
    >
      <Drawer
        variant='temporary'
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant='permanent'
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
}
