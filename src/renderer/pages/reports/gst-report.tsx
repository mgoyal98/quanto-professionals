import {
  Alert,
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
} from '@mui/material';
import { Download, FilterList, Search } from '@mui/icons-material';
import { useState, useCallback } from 'react';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { formatCurrency, formatInvoiceDate } from '@shared/invoice';
import type { GstReportParams, GstReportResponse } from '@shared/report';
import { formatIpcError } from '@shared/ipc';
import { useNotification } from '@/providers/notification';

const PAGE_SIZE = 25;

export default function GstReport() {
  const { showError, showSuccess } = useNotification();

  // Filters
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [gstType, setGstType] = useState<'INTRA' | 'INTER' | ''>('');

  // Data
  const [reportData, setReportData] = useState<GstReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const buildParams = useCallback((): GstReportParams => ({
    dateFrom: dateFrom ?? undefined,
    dateTo: dateTo ?? undefined,
    gstType: gstType !== '' ? gstType : undefined,
  }), [dateFrom, dateTo, gstType]);

  const handleRunReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPage(0);
    try {
      const result = await window.reportApi?.getGstReport(buildParams());
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
        reportType: 'gst',
        format,
        gstParams: buildParams(),
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
                <FormControl size='small' fullWidth>
                  <InputLabel>GST Type</InputLabel>
                  <Select
                    value={gstType}
                    onChange={(e) => setGstType(e.target.value as 'INTRA' | 'INTER' | '')}
                    label='GST Type'
                  >
                    <MenuItem value=''>All</MenuItem>
                    <MenuItem value='INTRA'>Intra-State (CGST + SGST)</MenuItem>
                    <MenuItem value='INTER'>Inter-State (IGST)</MenuItem>
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
              {[
                { label: 'Total Invoices', value: String(reportData.rows.length), mono: false },
                { label: 'Taxable Amount', value: formatCurrency(reportData.summary.totalTaxableAmount), mono: true },
                { label: 'Total CGST', value: formatCurrency(reportData.summary.totalCgst), mono: true },
                { label: 'Total SGST', value: formatCurrency(reportData.summary.totalSgst), mono: true },
                { label: 'Total IGST', value: formatCurrency(reportData.summary.totalIgst), mono: true },
                { label: 'Total CESS', value: formatCurrency(reportData.summary.totalCess), mono: true },
                { label: 'Total Tax', value: formatCurrency(reportData.summary.totalTax), mono: true },
                { label: 'Grand Total', value: formatCurrency(reportData.summary.totalGrandTotal), mono: true },
              ].map((stat) => (
                <Grid key={stat.label} size={{ xs: 6, sm: 4, md: 3 }}>
                  <Card variant='outlined'>
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant='caption' color='text.secondary'>{stat.label}</Typography>
                      <Typography variant='h6' fontWeight='bold' fontFamily={stat.mono ? 'monospace' : undefined}>
                        {stat.value}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Table */}
            <Card>
              <TableContainer component={Paper} variant='outlined' sx={{ m: 2, width: 'auto' }}>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>GSTIN</TableCell>
                      <TableCell>GST Type</TableCell>
                      <TableCell>Rev. Charge</TableCell>
                      <TableCell align='right'>Taxable Amt</TableCell>
                      <TableCell align='right'>CGST</TableCell>
                      <TableCell align='right'>SGST</TableCell>
                      <TableCell align='right'>IGST</TableCell>
                      <TableCell align='right'>CESS</TableCell>
                      <TableCell align='right'>Total Tax</TableCell>
                      <TableCell align='right'>Grand Total</TableCell>
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
                      paginatedRows.map((row, idx) => (
                        <TableRow key={`${row.invoiceNumber}-${idx}`} hover>
                          <TableCell>
                            <Typography variant='body2' fontFamily='monospace' fontWeight='medium'>
                              {row.invoiceNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>{formatInvoiceDate(row.invoiceDate)}</TableCell>
                          <TableCell>{row.customerName}</TableCell>
                          <TableCell>
                            <Typography variant='caption' fontFamily='monospace'>
                              {row.customerGstin ?? '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={row.gstType} size='small' color={row.gstType === 'INTRA' ? 'default' : 'primary'} />
                          </TableCell>
                          <TableCell>
                            {row.reverseCharge && <Chip label='RCM' size='small' color='warning' />}
                          </TableCell>
                          <TableCell align='right' sx={{ fontFamily: 'monospace' }}>{formatCurrency(row.taxableAmount)}</TableCell>
                          <TableCell align='right' sx={{ fontFamily: 'monospace' }}>{row.cgstAmount > 0 ? formatCurrency(row.cgstAmount) : '-'}</TableCell>
                          <TableCell align='right' sx={{ fontFamily: 'monospace' }}>{row.sgstAmount > 0 ? formatCurrency(row.sgstAmount) : '-'}</TableCell>
                          <TableCell align='right' sx={{ fontFamily: 'monospace' }}>{row.igstAmount > 0 ? formatCurrency(row.igstAmount) : '-'}</TableCell>
                          <TableCell align='right' sx={{ fontFamily: 'monospace' }}>{row.cessAmount > 0 ? formatCurrency(row.cessAmount) : '-'}</TableCell>
                          <TableCell align='right' sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{formatCurrency(row.totalTax)}</TableCell>
                          <TableCell align='right' sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{formatCurrency(row.grandTotal)}</TableCell>
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
              Select filters and click <strong>Run Report</strong> to generate the GST summary.
            </Typography>
          </Card>
        )}
      </Stack>
    </LocalizationProvider>
  );
}
