import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

import {
  InvoiceWithDetails,
  formatCurrency,
  INVOICE_STATUS_LABELS,
  InvoiceStatus,
} from '@shared/invoice';

interface EditInvoiceConfirmationDialogProps {
  open: boolean;
  invoice: InvoiceWithDetails;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function EditInvoiceConfirmationDialog({
  open,
  invoice,
  onConfirm,
  onCancel,
}: EditInvoiceConfirmationDialogProps) {
  const hasPendingPayments = invoice.paidAmount > 0;

  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth='xs'>
      <DialogTitle>Edit Invoice with Payments</DialogTitle>
      <DialogContent>
        {hasPendingPayments && (
          <Alert severity='warning' sx={{ mb: 2 }}>
            This invoice has recorded payments totaling{' '}
            {formatCurrency(invoice.paidAmount)}. Editing the invoice may affect
            the payment balance.
          </Alert>
        )}
        <Typography sx={{ mb: 2 }}>
          Are you sure you want to edit this invoice?
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          • Invoice Number: {invoice.invoiceNumber}
          <br />• Current Status:{' '}
          {INVOICE_STATUS_LABELS[invoice.status as InvoiceStatus]}
          <br />• Paid Amount: {formatCurrency(invoice.paidAmount)}
          <br />• Due Amount: {formatCurrency(invoice.dueAmount)}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm} variant='contained' color='primary'>
          Continue to Edit
        </Button>
      </DialogActions>
    </Dialog>
  );
}
