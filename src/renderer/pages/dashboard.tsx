import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Skeleton,
} from '@mui/material';
import {
  Receipt,
  People,
  Inventory2,
  TrendingUp,
  Add,
  ArrowForward,
  Warning,
} from '@mui/icons-material';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useCompany } from '@/providers/company';
import { Routes } from '@/common/routes';
import {
  InvoiceWithDetails,
  formatCurrency,
  formatInvoiceDate,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
  InvoiceStatus,
} from '@shared/invoice';
import { formatIpcError } from '@shared/ipc';

interface DashboardStats {
  totalInvoices: number;
  totalCustomers: number;
  totalItems: number;
  totalRevenue: number;
  unpaidAmount: number;
  paidInvoices: number;
  unpaidInvoices: number;
}

const initialStats: DashboardStats = {
  totalInvoices: 0,
  totalCustomers: 0,
  totalItems: 0,
  totalRevenue: 0,
  unpaidAmount: 0,
  paidInvoices: 0,
  unpaidInvoices: 0,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { company } = useCompany();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [recentInvoices, setRecentInvoices] = useState<InvoiceWithDetails[]>(
    []
  );

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [invoicesResult, customersResult, itemsResult] = await Promise.all([
        window.invoiceApi?.listInvoices({ limit: 100, isArchived: false }),
        window.customerApi?.listCustomers(),
        window.itemApi?.listItems({ limit: 1000 }),
      ]);

      const invoices = invoicesResult?.invoices ?? [];
      const customers = customersResult ?? [];
      const items = itemsResult?.items ?? [];

      // Calculate stats from invoices
      const totalRevenue = invoices.reduce(
        (sum, inv) => sum + inv.grandTotal,
        0
      );
      const unpaidAmount = invoices.reduce(
        (sum, inv) => sum + inv.dueAmount,
        0
      );
      const paidInvoices = invoices.filter(
        (inv) => inv.status === 'PAID'
      ).length;
      const unpaidInvoices = invoices.filter(
        (inv) => inv.status === 'UNPAID' || inv.status === 'PARTIALLY_PAID'
      ).length;

      setStats({
        totalInvoices: invoices.length,
        totalCustomers: customers.length,
        totalItems: items.length,
        totalRevenue,
        unpaidAmount,
        paidInvoices,
        unpaidInvoices,
      });

      // Get 5 most recent invoices
      setRecentInvoices(invoices.slice(0, 5));
    } catch (err) {
      setError(formatIpcError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  const quickActions = [
    {
      title: 'New Invoice',
      description: 'Create a new invoice',
      icon: <Receipt />,
      path: Routes.InvoiceCreate,
      color: '#009966', // Primary green
    },
    {
      title: 'New Customer',
      description: 'Add a customer',
      icon: <People />,
      path: Routes.NewCustomer,
      color: '#2196F3', // Blue
    },
    {
      title: 'New Item',
      description: 'Add a service or product',
      icon: <Inventory2 />,
      path: `${Routes.Items}?newItem=true`,
      color: '#FF9800', // Orange
    },
  ];

  const statCards = [
    {
      title: 'Total Invoices',
      value: stats.totalInvoices,
      icon: <Receipt fontSize='large' />,
      color: '#009966',
      subtitle: `${stats.paidInvoices} paid, ${stats.unpaidInvoices} pending`,
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: <People fontSize='large' />,
      color: '#2196F3',
      subtitle: 'Active customers',
    },
    {
      title: 'Total Items',
      value: stats.totalItems,
      icon: <Inventory2 fontSize='large' />,
      color: '#FF9800',
      subtitle: 'Products & services',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: <TrendingUp fontSize='large' />,
      color: '#4CAF50',
      subtitle: 'From all invoices',
      isMonetary: true,
    },
  ];

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='error'>{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant='h4' gutterBottom>
            Dashboard
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Welcome back to {company?.name || 'Quanto'}
          </Typography>
        </Box>

        {/* Quick Actions */}
        <Box>
          <Typography variant='h6' sx={{ mb: 2 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            {quickActions.map((action) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={action.path}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                      borderColor: action.color,
                    },
                  }}
                  onClick={() => navigate(action.path)}
                >
                  <CardContent>
                    <Stack direction='row' spacing={2} alignItems='center'>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: `${action.color}15`,
                          color: action.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {action.icon}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant='subtitle1' fontWeight='600'>
                          {action.title}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {action.description}
                        </Typography>
                      </Box>
                      <IconButton
                        size='small'
                        sx={{
                          color: action.color,
                          bgcolor: `${action.color}10`,
                          '&:hover': { bgcolor: `${action.color}20` },
                        }}
                      >
                        <Add />
                      </IconButton>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Stats Cards */}
        <Box>
          <Typography variant='h6' sx={{ mb: 2 }}>
            Overview
          </Typography>
          <Grid container spacing={2}>
            {statCards.map((stat) => (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={stat.title}>
                <Card
                  sx={{
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <CardContent>
                    <Stack
                      direction='row'
                      justifyContent='space-between'
                      alignItems='flex-start'
                    >
                      <Box>
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          gutterBottom
                        >
                          {stat.title}
                        </Typography>
                        {loading ? (
                          <Skeleton
                            variant='text'
                            width={100}
                            height={40}
                            animation='wave'
                          />
                        ) : (
                          <Typography
                            variant='h4'
                            fontWeight='bold'
                            sx={{
                              fontFamily: stat.isMonetary
                                ? 'monospace'
                                : 'inherit',
                            }}
                          >
                            {stat.value}
                          </Typography>
                        )}
                        <Typography variant='caption' color='text.secondary'>
                          {stat.subtitle}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 999,
                          bgcolor: `${stat.color}15`,
                          color: stat.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {stat.icon}
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Unpaid Alert */}
        {!loading && stats.unpaidAmount > 0 && (
          <Alert
            severity='warning'
            icon={<Warning />}
            action={
              <Button
                color='inherit'
                size='small'
                onClick={() => navigate(Routes.Invoices)}
              >
                View Invoices
              </Button>
            }
          >
            <Typography variant='body2'>
              You have <strong>{formatCurrency(stats.unpaidAmount)}</strong> in
              outstanding payments across {stats.unpaidInvoices} invoice(s).
            </Typography>
          </Alert>
        )}

        {/* Recent Invoices */}
        <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 0 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant='h6'>Recent Invoices</Typography>
              <Button
                size='small'
                endIcon={<ArrowForward />}
                onClick={() => navigate(Routes.Invoices)}
              >
                View All
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ p: 3 }}>
                <Stack spacing={2}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      variant='rectangular'
                      height={50}
                      animation='wave'
                    />
                  ))}
                </Stack>
              </Box>
            ) : recentInvoices.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Receipt sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant='body1' color='text.secondary' gutterBottom>
                  No invoices yet
                </Typography>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ mb: 2 }}
                >
                  Create your first invoice to get started
                </Typography>
                <Button
                  variant='contained'
                  startIcon={<Add />}
                  onClick={() => navigate(Routes.InvoiceCreate)}
                >
                  Create Invoice
                </Button>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell align='right'>Amount</TableCell>
                      <TableCell align='right'>Due</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentInvoices.map((invoice) => (
                      <TableRow
                        key={invoice.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/invoices/${invoice.id}`)}
                      >
                        <TableCell>
                          <Typography
                            variant='body2'
                            fontWeight='medium'
                            fontFamily='monospace'
                          >
                            {invoice.invoiceNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {formatInvoiceDate(invoice.invoiceDate)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {invoice.customer?.name || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2' fontFamily='monospace'>
                            {formatCurrency(invoice.grandTotal)}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography
                            variant='body2'
                            fontFamily='monospace'
                            color={
                              invoice.dueAmount > 0
                                ? 'error.main'
                                : 'success.main'
                            }
                          >
                            {formatCurrency(invoice.dueAmount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              INVOICE_STATUS_LABELS[
                                invoice.status as InvoiceStatus
                              ]
                            }
                            color={
                              INVOICE_STATUS_COLORS[
                                invoice.status as InvoiceStatus
                              ]
                            }
                            size='small'
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
