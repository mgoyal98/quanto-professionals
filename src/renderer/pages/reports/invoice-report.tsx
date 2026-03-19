import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
  Typography,
  Alert,
  Autocomplete,
  TextField,
} from '@mui/material';
import { Download, Search, FilterList } from '@mui/icons-material';
import { useState, useCallback } from 'react';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  formatCurrency,
  formatInvoiceDate,
  INVOICE_STATUSES,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
  InvoiceStatus,
} from '@shared/invoice';
import type {
  InvoiceReportParams,
  InvoiceReportResponse,
} from '@shared/report';
import { formatIpcError } from '@shared/ipc';
import { useNotification } from '@/providers/notification';
import { Customer } from '@shared/customer';

const PAGE_SIZE = 25;

export default function InvoiceReport() {
  const { showError, showSuccess } = useNotification();

  // Filters
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<InvoiceStatus[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoaded, setCustomersLoaded] = useState(false);

  // Data
  const [reportData, setReportData] = useState<InvoiceReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination (client-side on loaded data)
  const [page, setPage] = useState(0);

  const buildParams = useCallback((): InvoiceReportParams => ({
    dateFrom: dateFrom ?? undefined,
    dateTo: dateTo ?? undefined,
    customerId: selectedCustomer?.id,
    statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
  }), [dateFrom, dateTo, selectedCustomer, selectedStatuses]);

  const loadCustomers = async () => {
    if (customersLoaded) return;
    const result = await window.customerApi?.listCustomers();
    setCustomers(result ?? []);
    setCustomersLoaded(true);
  };

  const handleRunReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPage(0);
    try {
      const result = await window.reportApi?.getInvoiceReport(buildParams());
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
        reportType: 'invoice',
        format,
        invoiceParams: buildParams(),
      });
      if (result?.success) {
        showSuccess(`Exported to ${result.filePath}`);
      }
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
            <Typography variant='subtitle1' fontWeight='600' gutterBottom>
              Filters
            </Typography>
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
                  renderInput={(params) => (
                    <TextField {...params} label='Customer' fullWidth />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl size='small' fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    multiple
                    value={selectedStatuses}
                    onChange={(e) => setSelectedStatuses(e.target.value as InvoiceStatus[])}
                    label='Status'
                    renderValue={(vals) =>
                      (vals as InvoiceStatus[]).map((v) => INVOICE_STATUS_LABELS[v]).join(', ')
                    }
                  >
                    {INVOICE_STATUSES.map((s) => (
                      <MenuItem key={s} value={s}>{INVOICE_STATUS_LABELS[s]}</MenuItem>
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
                      <Button
                        variant='outlined'
                        startIcon={<Download />}
                        onClick={() => handleExport('csv')}
                        disabled={exporting}
                      >
                        Export CSV
                      </Button>
                      <Button
                        variant='outlined'
                        startIcon={<Download />}
                        onClick={() => handleExport('excel')}
                        disabled={exporting}
                      >
                        Export Excel
                      </Button>
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
              {[
                { label: 'Total Invoices', value: String(reportData.summary.totalCount), mono: false },
                { label: 'Grand Total', value: formatCurrency(reportData.summary.totalGrandTotal), mono: true },
                { label: 'Total Paid', value: formatCurrency(reportData.summary.totalPaid), mono: true },
                { label: 'Total Due', value: formatCurrency(reportData.summary.totalDue), mono: true },
                { label: 'Taxable Amount', value: formatCurrency(reportData.summary.totalTaxableAmount), mono: true },
                { label: 'Total CGST', value: formatCurrency(reportData.summary.totalCgst), mono: true },
                { label: 'Total SGST', value: formatCurrency(reportData.summary.totalSgst), mono: true },
                { label: 'Total IGST', value: formatCurrency(reportData.summary.totalIgst), mono: true },
              ].map((stat) => (
                <Grid key={stat.label} size={{ xs: 6, sm: 4, md: 3 }}>
                  <Card variant='outlined'>
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant='caption' color='text.secondary'>{stat.label}</Typography>
                      <Typography
                        variant='h6'
                        fontWeight='bold'
                        fontFamily={stat.mono ? 'monospace' : undefined}
                      >
                        {stat.value}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Status breakdown chips */}
            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
              {INVOICE_STATUSES.map((s) => {
                const count = reportData.summary.countByStatus[s];
                if (count === 0) return null;
                return (
                  <Chip
                    key={s}
                    label={`${INVOICE_STATUS_LABELS[s]}: ${count}`}
                    color={INVOICE_STATUS_COLORS[s]}
                    size='small'
                  />
                );
              })}
            </Stack>

            {/* Table */}
            <Card>
              <TableContainer component={Paper} variant='outlined' sx={{ m: 2, width: 'auto' }}>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>GST Type</TableCell>
                      <TableCell align='right'>Taxable</TableCell>
                      <TableCell align='right'>CGST</TableCell>
                      <TableCell align='right'>SGST</TableCell>
                      <TableCell align='right'>IGST</TableCell>
                      <TableCell align='right'>CESS</TableCell>
                      <TableCell align='right'>Grand Total</TableCell>
                      <TableCell align='right'>Paid</TableCell>
                      <TableCell align='right'>Due</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={13} align='center'>
                          <Typography variant='body2' color='text.secondary' sx={{ py: 2 }}>
                            No invoices match the selected filters.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRows.map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell>
                            <Typography variant='body2' fontFamily='monospace' fontWeight='medium'>
                              {row.invoiceNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>{formatInvoiceDate(row.invoiceDate)}</TableCell>
                          <TableCell>
                            <Typography variant='body2'>{row.customerName}</Typography>
                            {row.customerGstin && (
                              <Typography variant='caption' color='text.secondary'>
                                {row.customerGstin}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={row.gstType}
                              size='small'
                              color={row.gstType === 'INTRA' ? 'default' : 'primary'}
                            />
                          </TableCell>
                          <TableCell align='right' sx={{ fontFamily: 'monospace' }}>
                            {formatCurrency(row.taxableTotal)}
                          </TableCell>
                          <TableCell align='right' sx={{ fontFamily: 'monospace' }}>
                            {row.totalCgst > 0 ? formatCurrency(row.totalCgst) : '-'}
                          </TableCell>
                          <TableCell align='right' sx={{ fontFamily: 'monospace' }}>
                            {row.totalSgst > 0 ? formatCurrency(row.totalSgst) : '-'}
                          </TableCell>
                          <TableCell align='right' sx={{ fontFamily: 'monospace' }}>
                            {row.totalIgst > 0 ? formatCurrency(row.totalIgst) : '-'}
                          </TableCell>
                          <TableCell align='right' sx={{ fontFamily: 'monospace' }}>
                            {row.totalCess > 0 ? formatCurrency(row.totalCess) : '-'}
                          </TableCell>
                          <TableCell align='right' sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                            {formatCurrency(row.grandTotal)}
                          </TableCell>
                          <TableCell align='right' sx={{ fontFamily: 'monospace', color: 'success.main' }}>
                            {formatCurrency(row.paidAmount)}
                          </TableCell>
                          <TableCell
                            align='right'
                            sx={{
                              fontFamily: 'monospace',
                              color: row.dueAmount > 0 ? 'error.main' : 'success.main',
                            }}
                          >
                            {formatCurrency(row.dueAmount)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={INVOICE_STATUS_LABELS[row.status]}
                              color={INVOICE_STATUS_COLORS[row.status]}
                              size='small'
                            />
                          </TableCell>
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
              Select filters and click <strong>Run Report</strong> to generate the invoice report.
            </Typography>
          </Card>
        )}
      </Stack>
    </LocalizationProvider>
  );
}
