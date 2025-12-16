import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

import { formatCurrency } from '@shared/invoice';

interface OverpaymentWarningDialogProps {
  open: boolean;
  previousTotal: number;
  newTotal: number;
  paidAmount: number;
  onAdjust: () => void;
  onCancel: () => void;
}

export default function OverpaymentWarningDialog({
  open,
  previousTotal,
  newTotal,
  paidAmount,
  onAdjust,
  onCancel,
}: OverpaymentWarningDialogProps) {
  const overpaymentAmount = paidAmount - newTotal;

  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth='sm'>
      <DialogTitle>Overpayment Detected</DialogTitle>
      <DialogContent>
        <Alert severity='warning' sx={{ mb: 2 }}>
          The new invoice total ({formatCurrency(newTotal)}) is less than the
          amount already paid ({formatCurrency(paidAmount)}).
        </Alert>
        <Typography variant='body2' sx={{ mb: 2 }}>
          <strong>Previous Total:</strong> {formatCurrency(previousTotal)}
          <br />
          <strong>New Total:</strong> {formatCurrency(newTotal)}
          <br />
          <strong>Paid Amount:</strong> {formatCurrency(paidAmount)}
          <br />
          <strong>Overpayment:</strong> {formatCurrency(overpaymentAmount)}
        </Typography>
        <Typography>
          To save these changes, the paid amount will be adjusted to match the
          new invoice total. The difference of{' '}
          {formatCurrency(overpaymentAmount)} will need to be handled as a
          refund.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Go Back</Button>
        <Button onClick={onAdjust} variant='contained' color='primary'>
          Adjust Paid Amount
        </Button>
      </DialogActions>
    </Dialog>
  );
}
