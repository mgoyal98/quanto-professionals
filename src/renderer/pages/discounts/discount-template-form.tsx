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
  InputAdornment,
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
  discountTemplateFormSchema,
  DiscountTemplateFormValues,
  DISCOUNT_TYPES,
  DISCOUNT_TYPE_LABELS,
  DISCOUNT_TYPE_SUFFIX,
} from '@/common/discount-template';
import {
  DiscountTemplate,
  DiscountType,
  calculateDiscount,
} from '@shared/discount';
import { useNotification } from '@/providers/notification';

type FormMode = 'create' | 'edit';

interface DiscountTemplateFormProps {
  open: boolean;
  mode: FormMode;
  templateId?: number;
  onClose: () => void;
  onSuccess: (template: DiscountTemplate) => void;
}

const defaultValues: DiscountTemplateFormValues = {
  name: '',
  type: 'PERCENT',
  value: 0,
  description: '',
  isDefault: false,
};

export default function DiscountTemplateForm({
  open,
  mode,
  templateId,
  onClose,
  onSuccess,
}: DiscountTemplateFormProps) {
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
  } = useForm<DiscountTemplateFormValues>({
    resolver: zodResolver(discountTemplateFormSchema),
    defaultValues,
  });

  // Watch form values for preview
  const watchedType = watch('type');
  const watchedValue = watch('value');

  // Fetch template data when editing
  useEffect(() => {
    if (!open || !isEditMode || !templateId) {
      reset(defaultValues);
      return;
    }

    if (!window.discountTemplateApi) {
      return;
    }

    setLoading(true);

    const loadTemplateAndUpdateForm = async () => {
      try {
        const template =
          await window.discountTemplateApi!.getDiscountTemplate(templateId);
        if (template) {
          reset({
            name: template.name,
            type: template.type as DiscountType,
            value: template.value,
            description: template.description || '',
            isDefault: template.isDefault,
          });
        }
      } catch (error) {
        showError(
          error instanceof Error
            ? error.message
            : 'Failed to load discount template'
        );
        onClose();
      } finally {
        setLoading(false);
      }
    };

    void loadTemplateAndUpdateForm();
  }, [open, isEditMode, templateId, reset, showError, onClose]);

  const handleFormSubmit = async (data: DiscountTemplateFormValues) => {
    if (!window.discountTemplateApi) {
      return;
    }

    try {
      if (isEditMode && templateId) {
        const template = await window.discountTemplateApi.updateDiscountTemplate(
          {
            id: templateId,
            ...data,
          }
        );
        showSuccess('Discount template updated successfully');
        reset(defaultValues);
        onSuccess(template);
      } else {
        const template =
          await window.discountTemplateApi.createDiscountTemplate(data);
        showSuccess('Discount template created successfully');
        reset(defaultValues);
        onSuccess(template);
      }
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : `Failed to ${isEditMode ? 'update' : 'create'} discount template.`
      );
    }
  };

  // Preview discount calculation
  const getDiscountPreview = () => {
    if (!watchedValue || watchedValue <= 0) return null;

    const sampleAmount = 1000;
    const result = calculateDiscount(sampleAmount, {
      type: watchedType,
      value: watchedValue,
    });

    return (
      <Box
        sx={{
          p: 2,
          bgcolor: 'action.hover',
          borderRadius: 1,
        }}
      >
        <Typography variant='caption' color='text.secondary'>
          Discount Preview (on ₹1,000)
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Typography variant='body2'>
            <strong>Discount:</strong> ₹{result.discountAmount.toLocaleString('en-IN')}
          </Typography>
          <Typography variant='body2'>
            <strong>After Discount:</strong> ₹
            {result.amountAfterDiscount.toLocaleString('en-IN')}
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
      <Box
        component='form'
        onSubmit={handleSubmit(handleFormSubmit)}
        noValidate
      >
        <DialogTitle>
          {isEditMode ? 'Edit Discount Template' : 'Create Discount Template'}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label='Template Name'
              {...register('name')}
              error={Boolean(errors.name)}
              helperText={
                errors.name?.message ||
                'A friendly name for this template (e.g., "10% Off")'
              }
              required
              fullWidth
              autoFocus
            />

            <Controller
              name='type'
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={Boolean(errors.type)}>
                  <InputLabel>Discount Type</InputLabel>
                  <Select {...field} label='Discount Type'>
                    {DISCOUNT_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {DISCOUNT_TYPE_LABELS[type]}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {errors.type?.message ||
                      (field.value === 'PERCENT'
                        ? 'Percentage discount (e.g., 10% off)'
                        : 'Fixed amount discount (e.g., ₹500 off)')}
                  </FormHelperText>
                </FormControl>
              )}
            />

            <Controller
              name='value'
              control={control}
              render={({ field }) => (
                <TextField
                  label='Discount Value'
                  type='number'
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseFloat(e.target.value) || 0)
                  }
                  error={Boolean(errors.value)}
                  helperText={
                    errors.value?.message ||
                    (watchedType === 'PERCENT'
                      ? 'Percentage (0-100)'
                      : 'Fixed amount in ₹')
                  }
                  required
                  fullWidth
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      max: watchedType === 'PERCENT' ? 100 : undefined,
                      step: watchedType === 'PERCENT' ? 0.1 : 1,
                    },
                    input: {
                      startAdornment: watchedType === 'AMOUNT' && (
                        <InputAdornment position='start'>₹</InputAdornment>
                      ),
                      endAdornment: watchedType === 'PERCENT' && (
                        <InputAdornment position='end'>%</InputAdornment>
                      ),
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
                  label='Set as default discount template'
                />
              )}
            />

            {/* Preview */}
            {getDiscountPreview()}
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

