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
  FormControl,
  FormControlLabel,
  FormHelperText,
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
  taxTemplateFormSchema,
  TaxTemplateFormValues,
  TAX_TYPES,
  TAX_TYPE_LABELS,
  TAX_TYPE_DESCRIPTIONS,
  TAX_RATE_TYPES,
  TAX_RATE_TYPE_LABELS,
} from '@/common/tax-template';
import { TaxTemplate, TaxType, TaxRateType } from '@shared/tax-template';
import { useNotification } from '@/providers/notification';

type FormMode = 'create' | 'edit';

interface TaxTemplateFormProps {
  open: boolean;
  mode: FormMode;
  templateId?: number;
  onClose: () => void;
  onSuccess: (template: TaxTemplate) => void;
}

const defaultValues: TaxTemplateFormValues = {
  name: '',
  rate: 0,
  rateType: 'PERCENT',
  taxType: 'GST',
  description: '',
  isDefault: false,
};

export default function TaxTemplateForm({
  open,
  mode,
  templateId,
  onClose,
  onSuccess,
}: TaxTemplateFormProps) {
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
  } = useForm<TaxTemplateFormValues>({
    resolver: zodResolver(taxTemplateFormSchema),
    defaultValues,
  });

  // Watch form values for preview
  const watchedTaxType = watch('taxType');
  const watchedRate = watch('rate');
  const watchedRateType = watch('rateType');

  // Fetch template data when editing
  useEffect(() => {
    if (!open || !isEditMode || !templateId) {
      reset(defaultValues);
      return;
    }

    if (!window.taxTemplateApi) {
      return;
    }

    setLoading(true);

    const loadTemplateAndUpdateForm = async () => {
      try {
        const template = await window.taxTemplateApi!.getTaxTemplate(templateId);
        if (template) {
          reset({
            name: template.name,
            rate: template.rate,
            rateType: (template.rateType as TaxRateType) || 'PERCENT',
            taxType: template.taxType as TaxType,
            description: template.description || '',
            isDefault: template.isDefault,
          });
        }
      } catch (error) {
        showError(
          error instanceof Error ? error.message : 'Failed to load tax'
        );
        onClose();
      } finally {
        setLoading(false);
      }
    };

    void loadTemplateAndUpdateForm();
  }, [open, isEditMode, templateId, reset, showError, onClose]);

  const handleFormSubmit = async (data: TaxTemplateFormValues) => {
    if (!window.taxTemplateApi) {
      return;
    }

    try {
      if (isEditMode && templateId) {
        const template = await window.taxTemplateApi.updateTaxTemplate({
          id: templateId,
          ...data,
        });
        showSuccess('Tax updated successfully');
        reset(defaultValues);
        onSuccess(template);
      } else {
        const template = await window.taxTemplateApi.createTaxTemplate(data);
        showSuccess('Tax created successfully');
        reset(defaultValues);
        onSuccess(template);
      }
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : `Failed to ${isEditMode ? 'update' : 'create'} tax.`
      );
    }
  };

  // Preview GST breakdown
  const getGstPreview = () => {
    if (watchedTaxType !== 'GST' || !watchedRate) return null;

    const halfRate = watchedRate / 2;
    return (
      <Box
        sx={{
          p: 2,
          bgcolor: 'action.hover',
          borderRadius: 1,
        }}
      >
        <Typography variant='caption' color='text.secondary'>
          GST Rate Breakdown Preview
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Typography variant='body2'>
            <strong>Intra-state:</strong> CGST {halfRate}% + SGST {halfRate}% ={' '}
            {watchedRate}%
          </Typography>
          <Typography variant='body2'>
            <strong>Inter-state:</strong> IGST {watchedRate}%
          </Typography>
        </Box>
      </Box>
    );
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
          {isEditMode ? 'Edit Tax' : 'Create Tax'}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label='Template Name'
              {...register('name')}
              error={Boolean(errors.name)}
              helperText={
                errors.name?.message ||
                'A friendly name for this template (e.g., "GST 18%")'
              }
              required
              fullWidth
              autoFocus
            />

            <Controller
              name='taxType'
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={Boolean(errors.taxType)}>
                  <InputLabel>Tax Type</InputLabel>
                  <Select {...field} label='Tax Type'>
                    {TAX_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {TAX_TYPE_LABELS[type]}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {errors.taxType?.message ||
                      TAX_TYPE_DESCRIPTIONS[field.value]}
                  </FormHelperText>
                </FormControl>
              )}
            />

            {/* Rate Type selector - only for CUSTOM taxes */}
            {watchedTaxType === 'CUSTOM' && (
              <Controller
                name='rateType'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={Boolean(errors.rateType)}>
                    <InputLabel>Rate Type</InputLabel>
                    <Select {...field} label='Rate Type'>
                      {TAX_RATE_TYPES.map((type) => (
                        <MenuItem key={type} value={type}>
                          {TAX_RATE_TYPE_LABELS[type]}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      {errors.rateType?.message ||
                        'Choose whether to apply as percentage or fixed amount'}
                    </FormHelperText>
                  </FormControl>
                )}
              />
            )}

            <Controller
              name='rate'
              control={control}
              render={({ field }) => (
                <TextField
                  label={
                    watchedTaxType === 'CUSTOM' && watchedRateType === 'AMOUNT'
                      ? 'Tax Amount (₹)'
                      : 'Tax Rate (%)'
                  }
                  type='number'
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseFloat(e.target.value) || 0)
                  }
                  error={Boolean(errors.rate)}
                  helperText={
                    errors.rate?.message ||
                    (watchedTaxType === 'CUSTOM' && watchedRateType === 'AMOUNT'
                      ? 'Fixed tax amount to be applied'
                      : 'Tax rate as a percentage (0-100)')
                  }
                  required
                  fullWidth
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      max: watchedRateType === 'PERCENT' ? 100 : undefined,
                      step: 0.01,
                    },
                  }}
                />
              )}
            />

            <TextField
              label='Description'
              {...register('description')}
              error={Boolean(errors.description)}
              helperText={
                errors.description?.message ||
                'Optional description for this template'
              }
              fullWidth
              multiline
              rows={2}
            />

            <Controller
              name='isDefault'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox checked={field.value} onChange={field.onChange} />
                  }
                  label='Set as default template for this tax type'
                />
              )}
            />

            {/* GST Preview */}
            {getGstPreview()}
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

