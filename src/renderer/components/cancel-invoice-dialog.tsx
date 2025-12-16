import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';

interface CancelInvoiceDialogProps {
  open: boolean;
  invoiceNumber?: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
}

export default function CancelInvoiceDialog({
  open,
  invoiceNumber,
  onClose,
  onConfirm,
}: CancelInvoiceDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setReason('');
      setError(null);
    }
  }, [open]);

  const handleConfirm = async () => {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError('Cancellation reason is required.');
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(trimmedReason);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to cancel the invoice.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='xs'>
      <DialogTitle>Cancel Invoice</DialogTitle>
      <DialogContent>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          {invoiceNumber
            ? `Provide a reason to cancel invoice ${invoiceNumber}.`
            : 'Provide a cancellation reason.'}
        </Typography>
        <TextField
          autoFocus
          fullWidth
          label='Cancellation Reason'
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) setError(null);
          }}
          multiline
          minRows={2}
          error={Boolean(error)}
          helperText={error || 'Explain why this invoice is being cancelled.'}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Back</Button>
        <Button
          color='error'
          variant='contained'
          onClick={handleConfirm}
          disabled={submitting}
        >
          {submitting ? 'Cancelling...' : 'Cancel Invoice'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
