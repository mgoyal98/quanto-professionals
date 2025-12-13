import * as React from 'react';
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
  FormControlLabel,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  invoiceSeriesFormSchema,
  InvoiceSeriesFormValues,
} from '@/common/invoice-series';
import {
  InvoiceSeries,
  previewNextInvoiceNumber,
} from '@shared/invoice-series';
import { useNotification } from '@/providers/notification';

type FormMode = 'create' | 'edit';

interface InvoiceSeriesFormProps {
  open: boolean;
  mode: FormMode;
  seriesId?: number;
  onClose: () => void;
  onSuccess: (series: InvoiceSeries) => void;
}

const defaultValues: InvoiceSeriesFormValues = {
  name: '',
  prefix: '',
  suffix: '',
  startWith: 1,
  isDefault: false,
};

export default function InvoiceSeriesForm({
  open,
  mode,
  seriesId,
  onClose,
  onSuccess,
}: InvoiceSeriesFormProps) {
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
  } = useForm<InvoiceSeriesFormValues>({
    resolver: zodResolver(invoiceSeriesFormSchema),
    defaultValues,
  });

  // Watch form values for preview
  const watchedValues = watch();

  // Preview the invoice number
  const previewNumber = React.useMemo(() => {
    return previewNextInvoiceNumber({
      prefix: watchedValues.prefix || null,
      suffix: watchedValues.suffix || null,
      nextNumber: watchedValues.startWith || 1,
    });
  }, [watchedValues.prefix, watchedValues.suffix, watchedValues.startWith]);

  // Fetch series data when editing
  useEffect(() => {
    if (!open || !isEditMode || !seriesId) {
      reset(defaultValues);
      return;
    }

    if (!window.invoiceSeriesApi) {
      return;
    }

    setLoading(true);

    const loadSeriesAndUpdateForm = async () => {
      try {
        const series = await window.invoiceSeriesApi!.getInvoiceSeries(seriesId);
        if (series) {
          reset({
            name: series.name,
            prefix: series.prefix || '',
            suffix: series.suffix || '',
            startWith: series.startWith,
            isDefault: series.isDefault,
          });
        }
      } catch (error) {
        showError(
          error instanceof Error
            ? error.message
            : 'Failed to load invoice series'
        );
        onClose();
      } finally {
        setLoading(false);
      }
    };

    void loadSeriesAndUpdateForm();
  }, [open, isEditMode, seriesId, reset, showError, onClose]);

  const handleFormSubmit = async (data: InvoiceSeriesFormValues) => {
    if (!window.invoiceSeriesApi) {
      return;
    }

    try {
      if (isEditMode && seriesId) {
        const series = await window.invoiceSeriesApi.updateInvoiceSeries({
          id: seriesId,
          ...data,
        });
        showSuccess('Invoice series updated successfully');
        reset(defaultValues);
        onSuccess(series);
      } else {
        const series = await window.invoiceSeriesApi.createInvoiceSeries(data);
        showSuccess('Invoice series created successfully');
        reset(defaultValues);
        onSuccess(series);
      }
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : `Failed to ${isEditMode ? 'update' : 'create'} invoice series.`
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
      <Box
        component='form'
        onSubmit={handleSubmit(handleFormSubmit)}
        noValidate
      >
        <DialogTitle>
          {isEditMode ? 'Edit Invoice Series' : 'Create Invoice Series'}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label='Series Name'
              {...register('name')}
              error={Boolean(errors.name)}
              helperText={
                errors.name?.message ||
                'A friendly name for this series (e.g., "Standard Invoice")'
              }
              required
              fullWidth
              autoFocus
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label='Prefix'
                  {...register('prefix')}
                  error={Boolean(errors.prefix)}
                  helperText={errors.prefix?.message || 'e.g., "INV-" or "2024/"'}
                  fullWidth
                  placeholder='INV-'
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label='Suffix'
                  {...register('suffix')}
                  error={Boolean(errors.suffix)}
                  helperText={errors.suffix?.message || 'e.g., "-A" or "/FY24"'}
                  fullWidth
                  placeholder='-A'
                />
              </Grid>
            </Grid>

            <Controller
              name='startWith'
              control={control}
              render={({ field }) => (
                <TextField
                  label='Start Number'
                  type='number'
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value, 10) || 1)
                  }
                  error={Boolean(errors.startWith)}
                  helperText={
                    errors.startWith?.message ||
                    (isEditMode
                      ? 'Note: Changing this will not affect existing invoices'
                      : 'The first invoice number in this series')
                  }
                  fullWidth
                  slotProps={{ htmlInput: { min: 1 } }}
                />
              )}
            />

            <Controller
              name='isDefault'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox checked={field.value} onChange={field.onChange} />
                  }
                  label='Set as default series for new invoices'
                />
              )}
            />

            {/* Preview */}
            <Box
              sx={{
                p: 2,
                bgcolor: 'action.hover',
                borderRadius: 1,
              }}
            >
              <Typography variant='caption' color='text.secondary'>
                Invoice Number Preview
              </Typography>
              <Typography variant='h6' fontFamily='monospace'>
                {previewNumber}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color='secondary'>
            Cancel
          </Button>
          <Button type='submit' variant='contained' loading={isSubmitting}>
            {isEditMode ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

