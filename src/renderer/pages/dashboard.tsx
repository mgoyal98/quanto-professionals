import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
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
} from '@mui/material';
import {
  Receipt,
  People,
  Business,
  AccountBalance,
  Add,
  ArrowForward,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useCompany } from '@/providers/company';
import { Routes } from '@/common/routes';

export default function Dashboard() {
  const navigate = useNavigate();

  const { company } = useCompany();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentInvoices, setRecentInvoices] = useState([]);

  const quickActions = [
    {
      title: 'New Invoice',
      icon: <Receipt />,
      path: '/invoices/new',
      color: '#1976d2',
    },
    {
      title: 'New Customer',
      icon: <People />,
      path: Routes.NewCustomer,
      color: '#2e7d32',
    },
    {
      title: 'New Service',
      icon: <Business />,
      path: '/services/new',
      color: '#ed6c02',
    },
    {
      title: 'New Expense',
      icon: <AccountBalance />,
      path: '/expenses/new',
      color: '#d32f2f',
    },
  ];

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

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
        <Box>
          <Typography variant='h4' gutterBottom>
            Dashboard
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Welcome to {company?.name || 'Quanto'}
          </Typography>
        </Box>

        {/* Quick Actions */}
        <Grid container spacing={2}>
          {quickActions.map((action) => (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={action.path}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => navigate(action.path)}
              >
                <CardContent>
                  <Stack direction='row' spacing={2} alignItems='center'>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
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
                      <Typography variant='subtitle1' fontWeight='medium'>
                        {action.title}
                      </Typography>
                    </Box>
                    <IconButton size='small' sx={{ color: action.color }}>
                      <Add />
                    </IconButton>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Stats Cards */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card>
              <CardContent>
                <Typography variant='body2' color='text.secondary' gutterBottom>
                  Total Invoices
                </Typography>
                <Typography variant='h4'>0</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card>
              <CardContent>
                <Typography variant='body2' color='text.secondary' gutterBottom>
                  Total Clients
                </Typography>
                <Typography variant='h4'>0</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card>
              <CardContent>
                <Typography variant='body2' color='text.secondary' gutterBottom>
                  Total Services
                </Typography>
                <Typography variant='h4'>0</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card>
              <CardContent>
                <Typography variant='body2' color='text.secondary' gutterBottom>
                  Total Revenue
                </Typography>
                <Typography variant='h4'>₹{(0).toFixed(2)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Invoices */}
        <Card>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant='h6'>Recent Invoices</Typography>
              <IconButton
                size='small'
                onClick={() => navigate('/invoices')}
                color='primary'
              >
                <ArrowForward />
              </IconButton>
            </Box>
            {recentInvoices.length === 0 ? (
              <Typography
                variant='body2'
                color='text.secondary'
                align='center'
                sx={{ py: 3 }}
              >
                No invoices yet. Create your first invoice to get started.
              </Typography>
            ) : (
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Client</TableCell>
                      <TableCell align='right'>Amount</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentInvoices.map((invoice) => (
                      <TableRow
                        key={invoice.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/invoices/${invoice.id}/view`)}
                      >
                        <TableCell>{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.issue_date}</TableCell>
                        <TableCell>{invoice.client_snapshot || '-'}</TableCell>
                        <TableCell align='right'>
                          ₹{invoice.total.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {invoice.payment_status || 'Unpaid'}
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
