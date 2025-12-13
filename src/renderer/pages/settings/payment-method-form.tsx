import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  paymentMethodFormSchema,
  PaymentMethodFormValues,
  defaultPaymentMethodFormValues,
  getFieldsForType,
} from '@/common/payment-method';
import {
  PaymentMethod,
  PaymentMethodType,
  PAYMENT_METHOD_TYPES,
  PAYMENT_METHOD_TYPE_LABELS,
} from '@shared/payment-method';
import { useNotification } from '@/providers/notification';

type FormMode = 'create' | 'edit';

interface PaymentMethodFormProps {
  open: boolean;
  mode: FormMode;
  methodId?: number;
  onClose: () => void;
  onSuccess: (method: PaymentMethod) => void;
}

export default function PaymentMethodForm({
  open,
  mode,
  methodId,
  onClose,
  onSuccess,
}: PaymentMethodFormProps) {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);

  const isEditMode = mode === 'edit';

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodFormSchema),
    defaultValues: defaultPaymentMethodFormValues,
  });

  // Watch type to show/hide fields
  const watchedType = watch('type');
  const visibleFields = getFieldsForType(watchedType);

  // Check if a field should be visible
  const isFieldVisible = (fieldName: string) => visibleFields.includes(fieldName);

  // Fetch method data when editing
  useEffect(() => {
    if (!open || !isEditMode || !methodId) {
      reset(defaultPaymentMethodFormValues);
      return;
    }

    if (!window.paymentMethodApi) {
      return;
    }

    setLoading(true);

    const loadMethodAndUpdateForm = async () => {
      try {
        const method = await window.paymentMethodApi!.getPaymentMethod(methodId);
        if (method) {
          reset({
            name: method.name,
            type: method.type as PaymentMethodType,
            description: method.description || '',
            instructions: method.instructions || '',
            bankName: method.bankName || '',
            accountNumber: method.accountNumber || '',
            ifscCode: method.ifscCode || '',
            accountHolder: method.accountHolder || '',
            branchName: method.branchName || '',
            upiId: method.upiId || '',
            isDefault: method.isDefault,
          });
        }
      } catch (error) {
        showError(
          error instanceof Error ? error.message : 'Failed to load payment method'
        );
        onClose();
      } finally {
        setLoading(false);
      }
    };

    void loadMethodAndUpdateForm();
  }, [open, isEditMode, methodId, reset, showError, onClose]);

  const handleFormSubmit = async (data: PaymentMethodFormValues) => {
    if (!window.paymentMethodApi) {
      return;
    }

    try {
      if (isEditMode && methodId) {
        const method = await window.paymentMethodApi.updatePaymentMethod({
          id: methodId,
          ...data,
        });
        showSuccess('Payment method updated successfully');
        reset(defaultPaymentMethodFormValues);
        onSuccess(method);
      } else {
        const method = await window.paymentMethodApi.createPaymentMethod(data);
        showSuccess('Payment method created successfully');
        reset(defaultPaymentMethodFormValues);
        onSuccess(method);
      }
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : `Failed to ${isEditMode ? 'update' : 'create'} payment method.`
      );
    }
  };

  if (loading) {
    return (
      <Dialog open={open} maxWidth='sm' fullWidth>
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 200,
            }}
          >
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <Box component='form' onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        <DialogTitle>
          {isEditMode ? 'Edit Payment Method' : 'Add Payment Method'}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Basic Information */}
            <TextField
              label='Payment Method Name'
              {...register('name')}
              error={Boolean(errors.name)}
              helperText={
                errors.name?.message ||
                'A friendly name (e.g., "Company Bank Account")'
              }
              required
              fullWidth
              autoFocus
            />

            <Controller
              name='type'
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel id='type-label'>Type</InputLabel>
                  <Select
                    {...field}
                    labelId='type-label'
                    label='Type'
                    error={Boolean(errors.type)}
                  >
                    {PAYMENT_METHOD_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {PAYMENT_METHOD_TYPE_LABELS[type]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />

            <TextField
              label='Description'
              {...register('description')}
              error={Boolean(errors.description)}
              helperText={errors.description?.message}
              fullWidth
              multiline
              rows={2}
            />

            {/* Bank Details Section */}
            {(isFieldVisible('bankName') ||
              isFieldVisible('accountNumber') ||
              isFieldVisible('ifscCode')) && (
              <>
                <Divider>
                  <Typography variant='caption' color='text.secondary'>
                    Bank Details
                  </Typography>
                </Divider>

                <Grid container spacing={2}>
                  {isFieldVisible('bankName') && (
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label='Bank Name'
                        {...register('bankName')}
                        error={Boolean(errors.bankName)}
                        helperText={errors.bankName?.message}
                        fullWidth
                        placeholder='e.g., State Bank of India'
                      />
                    </Grid>
                  )}

                  {isFieldVisible('accountNumber') && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label='Account Number'
                        {...register('accountNumber')}
                        error={Boolean(errors.accountNumber)}
                        helperText={errors.accountNumber?.message}
                        fullWidth
                      />
                    </Grid>
                  )}

                  {isFieldVisible('ifscCode') && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label='IFSC Code'
                        {...register('ifscCode')}
                        error={Boolean(errors.ifscCode)}
                        helperText={
                          errors.ifscCode?.message || 'e.g., SBIN0001234'
                        }
                        fullWidth
                        slotProps={{
                          htmlInput: { style: { textTransform: 'uppercase' } },
                        }}
                      />
                    </Grid>
                  )}

                  {isFieldVisible('accountHolder') && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label='Account Holder Name'
                        {...register('accountHolder')}
                        error={Boolean(errors.accountHolder)}
                        helperText={errors.accountHolder?.message}
                        fullWidth
                      />
                    </Grid>
                  )}

                  {isFieldVisible('branchName') && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label='Branch Name'
                        {...register('branchName')}
                        error={Boolean(errors.branchName)}
                        helperText={errors.branchName?.message}
                        fullWidth
                      />
                    </Grid>
                  )}
                </Grid>
              </>
            )}

            {/* UPI Section */}
            {isFieldVisible('upiId') && (
              <>
                <Divider>
                  <Typography variant='caption' color='text.secondary'>
                    UPI Details
                  </Typography>
                </Divider>

                <TextField
                  label='UPI ID'
                  {...register('upiId')}
                  error={Boolean(errors.upiId)}
                  helperText={errors.upiId?.message || 'e.g., business@okicici'}
                  fullWidth
                />
              </>
            )}

            {/* Payment Instructions */}
            <Divider>
              <Typography variant='caption' color='text.secondary'>
                Invoice Display
              </Typography>
            </Divider>

            <TextField
              label='Payment Instructions'
              {...register('instructions')}
              error={Boolean(errors.instructions)}
              helperText={
                errors.instructions?.message ||
                'Instructions to display on the invoice (optional)'
              }
              fullWidth
              multiline
              rows={3}
              placeholder='e.g., Please make payment within 15 days. Reference: Invoice number'
            />

            {/* Default Checkbox */}
            <Controller
              name='isDefault'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox checked={field.value} onChange={field.onChange} />
                  }
                  label='Set as default payment method for new invoices'
                />
              )}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color='secondary'>
            Cancel
          </Button>
          <Button type='submit' variant='contained' disabled={isSubmitting}>
            {isEditMode ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

