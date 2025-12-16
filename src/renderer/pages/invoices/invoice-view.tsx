import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
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
  ArrowBack,
  Edit,
  Print,
  Cancel,
  Payment,
  Delete,
  Download,
  Visibility,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router';

import {
  InvoiceWithDetails,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
  formatCurrency,
  formatInvoiceDate,
  canEditInvoice,
  canCancelInvoice,
  canRecordPayment,
  hasPayments,
  InvoiceStatus,
  GstType,
  TaxSummary,
  TaxSummaryRow,
} from '@shared/invoice';
import { roundToTwo } from '@shared/tax-template';
import { useNotification } from '@/providers/notification';
import { Routes } from '@/common/routes';
import RecordPaymentDialog from '@/components/record-payment-dialog';
import CancelInvoiceDialog from '@/components/cancel-invoice-dialog';
import EditInvoiceConfirmationDialog from '@/components/edit-invoice-confirmation-dialog';

export default function InvoiceView() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showSuccess, showError } = useNotification();

  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [editConfirmDialogOpen, setEditConfirmDialogOpen] = useState(false);

  const loadInvoice = async () => {
    if (!id || !window.invoiceApi) {
      setError('Invoice ID or API is not available.');
      setLoading(false);
      return;
    }

    try {
      const data = await window.invoiceApi.getInvoice(Number(id));
      if (data) {
        setInvoice(data);
      } else {
        setError('Invoice not found.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoice.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInvoice();
  }, [id]);

  const handleUpdateStatus = async (
    status: InvoiceStatus,
    cancelReason?: string
  ) => {
    if (!invoice || !window.invoiceApi) return;

    try {
      await window.invoiceApi.updateInvoiceStatus({
        id: invoice.id,
        status,
        cancelReason,
      });
      await loadInvoice();
      showSuccess(`Invoice ${status.toLowerCase()}`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!window.invoiceApi) return;

    try {
      const result = await window.invoiceApi.deletePayment(paymentId);
      if (result) {
        await loadInvoice();
        showSuccess('Payment deleted');
      }
    } catch (err) {
      showError(
        err instanceof Error ? err.message : 'Failed to delete payment'
      );
    }
  };

  const handlePaymentRecorded = () => {
    void loadInvoice();
    setPaymentDialogOpen(false);
  };

  const handlePrint = async () => {
    if (!id || !window.invoiceFormatApi) {
      window.print();
      return;
    }
    try {
      await window.invoiceFormatApi.printInvoice(Number(id));
    } catch (err) {
      // Fallback to browser print
      window.print();
    }
  };

  const handleDownloadPdf = async () => {
    if (!id || !window.invoiceFormatApi) return;
    try {
      const result = await window.invoiceFormatApi.generatePdf({
        invoiceId: Number(id),
      });
      if (result.success) {
        showSuccess(`PDF saved to ${result.filePath}`);
      } else if (result.error && result.error !== 'Save cancelled by user') {
        showError(result.error);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to generate PDF');
    }
  };

  const handleViewPdf = () => {
    navigate(`/invoices/${id}/print`);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !invoice) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='error'>{error || 'Invoice not found.'}</Alert>
      </Box>
    );
  }

  const gstType = invoice.gstType as GstType;
  const isInterState = gstType === 'INTER';

  // Generate tax summary grouped by tax_id/rate from invoice items
  const taxSummary: TaxSummary = (() => {
    const summaryMap = new Map<string, TaxSummaryRow>();

    for (const item of invoice.items ?? []) {
      for (const td of item.taxesDiscounts ?? []) {
        // Create a unique key for grouping - prefer taxTemplateId if available
        const key = td.taxTemplateId
          ? `${td.type}-${td.taxTemplateId}`
          : `${td.type}-${td.name}-${td.rate}`;

        const existing = summaryMap.get(key);
        if (existing) {
          existing.taxableAmount = roundToTwo(
            existing.taxableAmount + td.taxableAmount
          );
          existing.amount = roundToTwo(existing.amount + td.amount);
        } else {
          summaryMap.set(key, {
            taxTemplateId: td.taxTemplateId ?? null,
            type: td.type as TaxSummaryRow['type'],
            name: td.name,
            rate: td.rate,
            taxableAmount: td.taxableAmount,
            amount: td.amount,
          });
        }
      }
    }

    const entries = Array.from(summaryMap.values());

    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalCess = 0;
    let totalDiscount = 0;
    let totalCharges = 0;

    for (const entry of entries) {
      switch (entry.type) {
        case 'CGST':
          totalCgst += entry.amount;
          break;
        case 'SGST':
          totalSgst += entry.amount;
          break;
        case 'IGST':
          totalIgst += entry.amount;
          break;
        case 'CESS':
          totalCess += entry.amount;
          break;
        case 'DISCOUNT':
          totalDiscount += entry.amount;
          break;
        case 'CHARGE':
          totalCharges += entry.amount;
          break;
      }
    }

    return {
      entries,
      totalCgst: roundToTwo(totalCgst),
      totalSgst: roundToTwo(totalSgst),
      totalIgst: roundToTwo(totalIgst),
      totalCess: roundToTwo(totalCess),
      totalDiscount: roundToTwo(totalDiscount),
      totalCharges: roundToTwo(totalCharges),
      grandTotalTax: roundToTwo(totalCgst + totalSgst + totalIgst + totalCess),
    };
  })();

  return (
    <Box>
      <Stack spacing={3}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate(Routes.Invoices)}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant='h4'>
                Invoice {invoice.invoiceNumber}
              </Typography>
              <Chip
                label={INVOICE_STATUS_LABELS[invoice.status as InvoiceStatus]}
                color={INVOICE_STATUS_COLORS[invoice.status as InvoiceStatus]}
                size='small'
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>
          <Stack direction='row' spacing={1}>
            {canEditInvoice(invoice) && (
              <Button
                variant='outlined'
                startIcon={<Edit />}
                onClick={() => {
                  if (hasPayments(invoice)) {
                    setEditConfirmDialogOpen(true);
                  } else {
                    navigate(`/invoices/${id}/edit`);
                  }
                }}
              >
                Edit
              </Button>
            )}
            {canRecordPayment(invoice) && (
              <Button
                variant='contained'
                startIcon={<Payment />}
                onClick={() => setPaymentDialogOpen(true)}
              >
                Record Payment
              </Button>
            )}
            {canCancelInvoice(invoice) && (
              <Button
                variant='outlined'
                color='error'
                startIcon={<Cancel />}
                onClick={() => {
                  setCancelDialogOpen(true);
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              variant='outlined'
              startIcon={<Visibility />}
              onClick={handleViewPdf}
            >
              View PDF
            </Button>
            <Button
              variant='outlined'
              startIcon={<Print />}
              onClick={handlePrint}
            >
              Print
            </Button>
            <Button
              variant='outlined'
              startIcon={<Download />}
              onClick={handleDownloadPdf}
            >
              Download PDF
            </Button>
          </Stack>
        </Box>

        {/* Invoice Info */}
        <Card sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant='subtitle2'
                color='text.secondary'
                gutterBottom
              >
                Bill To
              </Typography>
              <Typography variant='h6'>{invoice.customer?.name}</Typography>
              {invoice.customer?.addressLine1 && (
                <Typography>{invoice.customer.addressLine1}</Typography>
              )}
              {invoice.customer?.addressLine2 && (
                <Typography>{invoice.customer.addressLine2}</Typography>
              )}
              <Typography>
                {[
                  invoice.customer?.city,
                  invoice.customer?.state,
                  invoice.customer?.pinCode,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </Typography>
              {invoice.customer?.gstin && (
                <Typography variant='body2' color='text.secondary'>
                  GSTIN: {invoice.customer.gstin}
                </Typography>
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ textAlign: { md: 'right' } }}>
                <Typography variant='body2' color='text.secondary'>
                  Invoice Date:{' '}
                  <strong>{formatInvoiceDate(invoice.invoiceDate)}</strong>
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  GST Type:{' '}
                  <strong>
                    {isInterState
                      ? 'Inter-State (IGST)'
                      : 'Intra-State (CGST + SGST)'}
                  </strong>
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Reverse Charge:{' '}
                  <strong>{invoice.reverseCharge ? 'Y' : 'N'}</strong>
                </Typography>
                {invoice.paymentMethod && (
                  <Typography variant='body2' color='text.secondary'>
                    Payment Method:{' '}
                    <strong>{invoice.paymentMethod.name}</strong>
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </Card>

        {/* Line Items */}
        <Card sx={{ p: 3 }}>
          <Typography variant='h6' gutterBottom>
            Line Items
          </Typography>
          <TableContainer component={Paper} variant='outlined'>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Item</TableCell>
                  <TableCell>HSN</TableCell>
                  <TableCell align='right'>Qty</TableCell>
                  <TableCell align='right'>Rate</TableCell>
                  <TableCell align='right'>Tax</TableCell>
                  <TableCell align='right'>Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.items?.map((item, index) => {
                  // Get tax info from taxesDiscounts
                  const taxes = (item.taxesDiscounts ?? []).filter(
                    (td) =>
                      td.type === 'CGST' ||
                      td.type === 'SGST' ||
                      td.type === 'IGST' ||
                      td.type === 'CESS'
                  );
                  const taxDisplay = taxes
                    .map((td) => `${td.rate}% ${td.type}`)
                    .join(' + ');

                  return (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Typography variant='body2'>{item.name}</Typography>
                        {item.description && (
                          <Typography
                            variant='caption'
                            color='text.secondary'
                            sx={{ fontStyle: 'italic' }}
                          >
                            {item.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' fontFamily='monospace'>
                          {item.hsnCode || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell align='right'>
                        {formatCurrency(item.rate)}
                      </TableCell>
                      <TableCell align='right'>{taxDisplay || '-'}</TableCell>
                      <TableCell align='right'>
                        {formatCurrency(item.total)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Totals */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            {/* Payment History */}
            {invoice.payments && invoice.payments.length > 0 && (
              <Card sx={{ p: 3 }}>
                <Typography variant='h6' gutterBottom>
                  Payment History
                </Typography>
                <TableContainer>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Method</TableCell>
                        <TableCell align='right'>Amount</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoice.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {formatInvoiceDate(payment.paymentDate)}
                          </TableCell>
                          <TableCell>
                            {payment.paymentMethod?.name || '-'}
                          </TableCell>
                          <TableCell align='right'>
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size='small'
                              color='error'
                              onClick={() => handleDeletePayment(payment.id)}
                            >
                              <Delete fontSize='small' />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            )}

            {/* Notes */}
            {invoice.notes && (
              <Card sx={{ p: 3, mt: 3 }}>
                <Typography variant='h6' gutterBottom>
                  Notes
                </Typography>
                <Typography variant='body2' whiteSpace='pre-wrap'>
                  {invoice.notes}
                </Typography>
              </Card>
            )}

            {/* Cancel Reason */}
            {invoice.status === 'CANCELLED' && invoice.cancelReason && (
              <Card sx={{ p: 3, mt: 3 }}>
                <Typography variant='h6' gutterBottom color='error.dark'>
                  Cancellation Reason
                </Typography>
                <Typography variant='body2'>{invoice.cancelReason}</Typography>
              </Card>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant='h6' gutterBottom>
                Invoice Summary
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color='text.secondary'>Subtotal:</Typography>
                  <Typography fontFamily='monospace'>
                    {formatCurrency(invoice.subTotal)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color='text.secondary'>
                    Taxable Amount:
                  </Typography>
                  <Typography fontFamily='monospace'>
                    {formatCurrency(invoice.taxableTotal)}
                  </Typography>
                </Box>
                {/* Display taxes grouped by rate/tax_id */}
                {taxSummary.entries
                  .filter(
                    (e) =>
                      e.type === 'CGST' ||
                      e.type === 'SGST' ||
                      e.type === 'IGST' ||
                      e.type === 'CESS'
                  )
                  .map((entry, idx) => (
                    <Box
                      key={`${entry.type}-${entry.rate}-${idx}`}
                      sx={{ display: 'flex', justifyContent: 'space-between' }}
                    >
                      <Typography color='text.secondary'>
                        {entry.name}:
                      </Typography>
                      <Typography fontFamily='monospace'>
                        {formatCurrency(entry.amount)}
                      </Typography>
                    </Box>
                  ))}
                {/* Display invoice-level tax/discount entries */}
                {invoice.taxDiscountEntries &&
                  invoice.taxDiscountEntries.length > 0 &&
                  invoice.taxDiscountEntries.map((entry) => (
                    <Box
                      key={entry.id}
                      sx={{ display: 'flex', justifyContent: 'space-between' }}
                    >
                      <Typography color='text.secondary'>
                        {entry.name}
                        {entry.rateType === 'PERCENT'
                          ? ` (${entry.rate}%)`
                          : ''}
                        :
                      </Typography>
                      <Typography
                        fontFamily='monospace'
                        color={
                          entry.entryType === 'DISCOUNT'
                            ? 'error.main'
                            : 'success.main'
                        }
                      >
                        {entry.entryType === 'DISCOUNT' ? '-' : '+'}
                        {formatCurrency(entry.amount)}
                      </Typography>
                    </Box>
                  ))}
                {/* Fallback for legacy invoices without taxDiscountEntries */}
                {(!invoice.taxDiscountEntries ||
                  invoice.taxDiscountEntries.length === 0) &&
                  invoice.additionalTaxAmount > 0 && (
                    <Box
                      sx={{ display: 'flex', justifyContent: 'space-between' }}
                    >
                      <Typography color='text.secondary'>
                        {invoice.additionalTaxName ??
                          `Additional Tax (${invoice.additionalTaxRate}%)`}
                        :
                      </Typography>
                      <Typography fontFamily='monospace' color='success.main'>
                        +{formatCurrency(invoice.additionalTaxAmount)}
                      </Typography>
                    </Box>
                  )}
                {(!invoice.taxDiscountEntries ||
                  invoice.taxDiscountEntries.length === 0) &&
                  invoice.discountAmount > 0 && (
                    <Box
                      sx={{ display: 'flex', justifyContent: 'space-between' }}
                    >
                      <Typography color='text.secondary'>
                        Invoice Discount:
                      </Typography>
                      <Typography fontFamily='monospace' color='error.main'>
                        -{formatCurrency(invoice.discountAmount)}
                      </Typography>
                    </Box>
                  )}
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='h6'>Grand Total:</Typography>
                  <Typography
                    variant='h6'
                    fontFamily='monospace'
                    color='primary'
                  >
                    {formatCurrency(invoice.grandTotal)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color='text.secondary'>Paid Amount:</Typography>
                  <Typography fontFamily='monospace' color='success.main'>
                    {formatCurrency(invoice.paidAmount)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color='text.secondary'>Due Amount:</Typography>
                  <Typography
                    fontFamily='monospace'
                    color={
                      invoice.dueAmount > 0 ? 'error.main' : 'success.main'
                    }
                  >
                    {formatCurrency(invoice.dueAmount)}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Stack>

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        onSuccess={handlePaymentRecorded}
        invoiceId={invoice.id}
        maxAmount={invoice.dueAmount}
      />

      <CancelInvoiceDialog
        open={cancelDialogOpen}
        invoiceNumber={invoice.invoiceNumber}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={async (reason) => handleUpdateStatus('CANCELLED', reason)}
      />

      <EditInvoiceConfirmationDialog
        open={editConfirmDialogOpen}
        invoice={invoice}
        onCancel={() => setEditConfirmDialogOpen(false)}
        onConfirm={() => {
          setEditConfirmDialogOpen(false);
          navigate(`/invoices/${id}/edit`);
        }}
      />
    </Box>
  );
}
