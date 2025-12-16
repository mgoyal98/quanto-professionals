import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { PaymentMethod } from '@shared/payment-method';
import { useNotification } from '@/providers/notification';

interface RecordPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoiceId: number;
  maxAmount: number;
}

export default function RecordPaymentDialog({
  open,
  onClose,
  onSuccess,
  invoiceId,
  maxAmount,
}: RecordPaymentDialogProps) {
  const { showSuccess, showError } = useNotification();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<number | null>(null);
  const [amount, setAmount] = useState<number>(maxAmount);
  const [paymentDate, setPaymentDate] = useState<Date | null>(new Date());
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(maxAmount);
      setPaymentDate(new Date());
      setReferenceNumber('');
      setNotes('');

      // Load payment methods
      const loadPaymentMethods = async () => {
        const methods = await window.paymentMethodApi?.listPaymentMethods();
        setPaymentMethods(methods ?? []);
        const defaultMethod = methods?.find((m) => m.isDefault);
        if (defaultMethod) {
          setSelectedMethod(defaultMethod.id);
        }
      };
      void loadPaymentMethods();
    }
  }, [open, maxAmount]);

  const handleSubmit = async () => {
    if (!selectedMethod) {
      showError('Please select a payment method');
      return;
    }
    if (!paymentDate) {
      showError('Please select a payment date');
      return;
    }
    if (amount <= 0) {
      showError('Amount must be positive');
      return;
    }
    if (amount > maxAmount) {
      showError(`Amount cannot exceed ${maxAmount}`);
      return;
    }

    setSaving(true);
    try {
      await window.invoiceApi?.recordPayment({
        invoiceId,
        paymentMethodId: selectedMethod,
        amount,
        paymentDate,
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
      });
      showSuccess('Payment recorded successfully');
      onSuccess();
    } catch (err) {
      showError(
        err instanceof Error ? err.message : 'Failed to record payment'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label='Amount'
              type='number'
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>₹</InputAdornment>
                  ),
                },
                htmlInput: { min: 0, max: maxAmount, step: 0.01 },
              }}
              helperText={`Maximum: ₹${maxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            />

            <DatePicker
              label='Payment Date'
              value={paymentDate}
              onChange={setPaymentDate}
              slotProps={{ textField: { fullWidth: true } }}
            />

            <FormControl fullWidth required error={!selectedMethod}>
              <InputLabel>Payment Method</InputLabel>
              <Select<number | ''>
                value={selectedMethod ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedMethod(val === '' ? null : val);
                }}
                label='Payment Method'
              >
                {paymentMethods.map((method) => (
                  <MenuItem key={method.id} value={method.id}>
                    {method.name}
                  </MenuItem>
                ))}
              </Select>
              {!selectedMethod && (
                <FormHelperText>Payment method is required</FormHelperText>
              )}
            </FormControl>

            <TextField
              fullWidth
              label='Reference Number'
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder='Cheque number, transaction ID, etc.'
            />

            <TextField
              fullWidth
              label='Notes'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={2}
              placeholder='Additional notes...'
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color='secondary'>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant='contained'
            disabled={saving || !selectedMethod || amount <= 0}
          >
            {saving ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
