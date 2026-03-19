import {
  Alert,
  Autocomplete,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
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
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Download, FilterList, Search } from '@mui/icons-material';
import { useState, useCallback } from 'react';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { formatCurrency, formatInvoiceDate } from '@shared/invoice';
import type { PaymentReportParams, PaymentReportResponse } from '@shared/report';
import { formatIpcError } from '@shared/ipc';
import { useNotification } from '@/providers/notification';
import { Customer } from '@shared/customer';
import { PaymentMethod } from '@shared/payment-method';

const PAGE_SIZE = 25;

export default function PaymentReport() {
  const { showError, showSuccess } = useNotification();

  // Filters
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number | ''>('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoaded, setCustomersLoaded] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethodsLoaded, setPaymentMethodsLoaded] = useState(false);

  // Data
  const [reportData, setReportData] = useState<PaymentReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const buildParams = useCallback((): PaymentReportParams => ({
    dateFrom: dateFrom ?? undefined,
    dateTo: dateTo ?? undefined,
    customerId: selectedCustomer?.id,
    paymentMethodId: selectedPaymentMethod !== '' ? selectedPaymentMethod : undefined,
  }), [dateFrom, dateTo, selectedCustomer, selectedPaymentMethod]);

  const loadCustomers = async () => {
    if (customersLoaded) return;
    setCustomers((await window.customerApi?.listCustomers()) ?? []);
    setCustomersLoaded(true);
  };

  const loadPaymentMethods = async () => {
    if (paymentMethodsLoaded) return;
    setPaymentMethods((await window.paymentMethodApi?.listPaymentMethods()) ?? []);
    setPaymentMethodsLoaded(true);
  };

  const handleRunReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPage(0);
    try {
      const result = await window.reportApi?.getPaymentReport(buildParams());
      setReportData(result ?? null);
    } catch (err) {
      setError(formatIpcError(err));
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const handleExport = async (format: 'csv' | 'excel') => {
    setExporting(true);
    try {
      const result = await window.reportApi?.exportReport({
        reportType: 'payment',
        format,
        paymentParams: buildParams(),
      });
      if (result?.success) showSuccess(`Exported to ${result.filePath}`);
    } catch (err) {
      showError(formatIpcError(err));
    } finally {
      setExporting(false);
    }
  };

  const paginatedRows = reportData
    ? reportData.rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    : [];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Stack spacing={3}>
        {/* Filters */}
        <Card>
          <CardContent>
            <Typography variant='subtitle1' fontWeight='600' gutterBottom>Filters</Typography>
            <Grid container spacing={2} alignItems='center'>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DatePicker
                  label='From Date'
                  value={dateFrom}
                  onChange={setDateFrom}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DatePicker
                  label='To Date'
                  value={dateTo}
                  onChange={setDateTo}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Autocomplete
                  size='small'
                  options={customers}
                  getOptionLabel={(c) => c.name}
                  value={selectedCustomer}
                  onChange={(_e, val) => setSelectedCustomer(val)}
                  onOpen={loadCustomers}
                  renderInput={(params) => <TextField {...params} label='Customer' fullWidth />}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl size='small' fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value as number | '')}
                    label='Payment Method'
                    onOpen={loadPaymentMethods}
                  >
                    <MenuItem value=''>All Methods</MenuItem>
                    {paymentMethods.map((pm) => (
                      <MenuItem key={pm.id} value={pm.id}>{pm.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Stack direction='row' spacing={1}>
                  <Button
                    variant='contained'
                    startIcon={loading ? <CircularProgress size={16} color='inherit' /> : <Search />}
                    onClick={handleRunReport}
                    disabled={loading}
                  >
                    Run Report
                  </Button>
                  {reportData && (
                    <>
                      <Button variant='outlined' startIcon={<Download />} onClick={() => handleExport('csv')} disabled={exporting}>Export CSV</Button>
                      <Button variant='outlined' startIcon={<Download />} onClick={() => handleExport('excel')} disabled={exporting}>Export Excel</Button>
                    </>
                  )}
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {error && <Alert severity='error'>{error}</Alert>}

        {reportData && (
          <>
            {/* Summary Cards */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, md: 3 }}>
                <Card variant='outlined'>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant='caption' color='text.secondary'>Total Payments</Typography>
                    <Typography variant='h6' fontWeight='bold'>{reportData.summary.totalCount}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Card variant='outlined'>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant='caption' color='text.secondary'>Total Collected</Typography>
                    <Typography variant='h6' fontWeight='bold' fontFamily='monospace'>
                      {formatCurrency(reportData.summary.totalAmount)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Table */}
            <Card>
              <TableContainer component={Paper} variant='outlined' sx={{ m: 2, width: 'auto' }}>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Payment Method</TableCell>
                      <TableCell align='right'>Amount</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align='center'>
                          <Typography variant='body2' color='text.secondary' sx={{ py: 2 }}>
                            No payments match the selected filters.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRows.map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell>{formatInvoiceDate(row.paymentDate)}</TableCell>
                          <TableCell>
                            <Typography variant='body2' fontFamily='monospace' fontWeight='medium'>
                              {row.invoiceNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>{row.customerName}</TableCell>
                          <TableCell>{row.paymentMethodName ?? '-'}</TableCell>
                          <TableCell align='right' sx={{ fontFamily: 'monospace', color: 'success.main', fontWeight: 'bold' }}>
                            {formatCurrency(row.amount)}
                          </TableCell>
                          <TableCell>{row.referenceNumber ?? '-'}</TableCell>
                          <TableCell>{row.notes ?? '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component='div'
                count={reportData.rows.length}
                page={page}
                onPageChange={(_e, p) => setPage(p)}
                rowsPerPage={PAGE_SIZE}
                rowsPerPageOptions={[PAGE_SIZE]}
                sx={{ borderTop: 1, borderColor: 'divider' }}
              />
            </Card>
          </>
        )}

        {!reportData && !loading && (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <FilterList sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color='text.secondary'>
              Select filters and click <strong>Run Report</strong> to generate the payment report.
            </Typography>
          </Card>
        )}
      </Stack>
    </LocalizationProvider>
  );
}
