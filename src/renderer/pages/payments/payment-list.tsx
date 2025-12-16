import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Card,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Tooltip,
  CircularProgress,
  Alert,
  Link as MuiLink,
} from '@mui/material';
import { Delete, Search, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { PaymentWithDetails, PaymentListParams, formatPaymentDate } from '@shared/payment';
import { PaymentMethod } from '@shared/payment-method';
import { formatCurrency } from '@shared/invoice';
import { useNotification } from '@/providers/notification';
import { Routes } from '@/common/routes';

export default function PaymentListPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState<number | ''>('');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [paymentsRes, methodsRes] = await Promise.all([
          window.paymentApi?.listPayments({}),
          window.paymentMethodApi?.listPaymentMethods(),
        ]);
        setPayments(paymentsRes?.payments ?? []);
        setPaymentMethods(methodsRes ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payments');
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, []);

  // Reload payments when filters change
  useEffect(() => {
    const loadPayments = async () => {
      try {
        const params: PaymentListParams = {};
        if (selectedMethodId) params.paymentMethodId = selectedMethodId;
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;

        const res = await window.paymentApi?.listPayments(params);
        setPayments(res?.payments ?? []);
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to load payments');
      }
    };
    void loadPayments();
  }, [selectedMethodId, dateFrom, dateTo, showError]);

  // Filter by search locally
  const filteredPayments = useMemo(() => {
    if (!search) return payments;
    const searchLower = search.toLowerCase();
    return payments.filter((p) => {
      const matchesInvoice = p.invoice?.invoiceNumber?.toLowerCase().includes(searchLower);
      const matchesCustomer = p.invoice?.customer?.name?.toLowerCase().includes(searchLower);
      const matchesRef = p.referenceNumber?.toLowerCase().includes(searchLower);
      return matchesInvoice || matchesCustomer || matchesRef;
    });
  }, [payments, search]);

  // Summary calculations
  const totalAmount = useMemo(
    () => filteredPayments.reduce((sum, p) => sum + p.amount, 0),
    [filteredPayments]
  );

  const handleDelete = async (payment: PaymentWithDetails) => {
    if (!confirm(`Delete payment of ${formatCurrency(payment.amount)} for invoice ${payment.invoice?.invoiceNumber}?`)) {
      return;
    }

    try {
      await window.paymentApi?.deletePayment(payment.id);
      setPayments(payments.filter((p) => p.id !== payment.id));
      showSuccess('Payment deleted successfully');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete payment');
    }
  };

  const handleViewInvoice = (invoiceId: number) => {
    navigate(`/invoices/${invoiceId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity='error'>{error}</Alert>;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Header with title and summary cards */}
        <Stack direction='row' justifyContent='space-between' alignItems='flex-start' mb={3}>
          <Typography variant='h4'>Payments</Typography>
          <Stack direction='row' spacing={2}>
            <Card sx={{ px: 3, py: 2 }}>
              <Typography variant='body2' color='text.secondary'>
                Total Received
              </Typography>
              <Typography variant='h5' fontFamily='monospace' color='success.main'>
                {formatCurrency(totalAmount)}
              </Typography>
            </Card>
            <Card sx={{ px: 3, py: 2 }}>
              <Typography variant='body2' color='text.secondary'>
                Count
              </Typography>
              <Typography variant='h5'>{filteredPayments.length}</Typography>
            </Card>
          </Stack>
        </Stack>

        {/* Filters */}
        <Card sx={{ p: 2, mb: 3 }}>
          <Stack direction='row' spacing={2} flexWrap='wrap' useFlexGap>
            <TextField
              size='small'
              placeholder='Search by invoice, customer, reference...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 280 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Search />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <DatePicker
              label='From Date'
              value={dateFrom}
              onChange={setDateFrom}
              slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
            />
            <DatePicker
              label='To Date'
              value={dateTo}
              onChange={setDateTo}
              slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
            />
            <FormControl size='small' sx={{ minWidth: 160 }}>
              <InputLabel>Payment Method</InputLabel>
              <Select<number | ''>
                value={selectedMethodId}
                onChange={(e) => setSelectedMethodId(e.target.value as number | '')}
                label='Payment Method'
              >
                <MenuItem value=''>All Methods</MenuItem>
                {paymentMethods.map((method) => (
                  <MenuItem key={method.id} value={method.id}>
                    {method.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Card>

        {/* Payments Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Invoice</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell align='right'>Amount</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell align='center'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align='center'>
                    <Typography color='text.secondary' sx={{ py: 4 }}>
                      No payments found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>{formatPaymentDate(payment.paymentDate)}</TableCell>
                    <TableCell>
                      <MuiLink
                        component='button'
                        onClick={() => payment.invoice && handleViewInvoice(payment.invoice.id)}
                        sx={{ cursor: 'pointer' }}
                      >
                        {payment.invoice?.invoiceNumber ?? '-'}
                      </MuiLink>
                    </TableCell>
                    <TableCell>{payment.invoice?.customer?.name ?? '-'}</TableCell>
                    <TableCell align='right'>
                      <Typography fontFamily='monospace' color='success.main'>
                        {formatCurrency(payment.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>{payment.paymentMethod?.name ?? '-'}</TableCell>
                    <TableCell>{payment.referenceNumber ?? '-'}</TableCell>
                    <TableCell align='center'>
                      <Stack direction='row' spacing={0.5} justifyContent='center'>
                        <Tooltip title='View Invoice'>
                          <IconButton
                            size='small'
                            onClick={() => payment.invoice && handleViewInvoice(payment.invoice.id)}
                          >
                            <Visibility fontSize='small' />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title='Delete Payment'>
                          <IconButton size='small' color='error' onClick={() => handleDelete(payment)}>
                            <Delete fontSize='small' />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </LocalizationProvider>
  );
}

