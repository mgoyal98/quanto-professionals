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
} from '@/common/tax-template';
import { TaxTemplate, TaxType } from '@shared/tax-template';
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
            taxType: template.taxType as TaxType,
            description: template.description || '',
            isDefault: template.isDefault,
          });
        }
      } catch (error) {
        showError(
          error instanceof Error ? error.message : 'Failed to load tax template'
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
        showSuccess('Tax template updated successfully');
        reset(defaultValues);
        onSuccess(template);
      } else {
        const template = await window.taxTemplateApi.createTaxTemplate(data);
        showSuccess('Tax template created successfully');
        reset(defaultValues);
        onSuccess(template);
      }
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : `Failed to ${isEditMode ? 'update' : 'create'} tax template.`
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
          {isEditMode ? 'Edit Tax Template' : 'Create Tax Template'}
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

            <Controller
              name='rate'
              control={control}
              render={({ field }) => (
                <TextField
                  label='Tax Rate (%)'
                  type='number'
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseFloat(e.target.value) || 0)
                  }
                  error={Boolean(errors.rate)}
                  helperText={
                    errors.rate?.message || 'Tax rate as a percentage (0-100)'
                  }
                  required
                  fullWidth
                  slotProps={{
                    htmlInput: { min: 0, max: 100, step: 0.01 },
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

