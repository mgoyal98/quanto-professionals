import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  itemFormSchema,
  ItemFormValues,
  UNIT_OPTIONS,
  defaultItemFormValues,
} from '@/common/item';
import { ItemWithTaxTemplates } from '@shared/item';
import { TaxTemplate } from '@shared/tax-template';
import { useNotification } from '@/providers/notification';

type FormMode = 'create' | 'edit';

interface ItemFormProps {
  open: boolean;
  mode: FormMode;
  itemId?: number;
  onClose: () => void;
  onSuccess: (item: ItemWithTaxTemplates) => void;
}

export default function ItemForm({
  open,
  mode,
  itemId,
  onClose,
  onSuccess,
}: ItemFormProps) {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [taxTemplates, setTaxTemplates] = useState<TaxTemplate[]>([]);
  const [cessTemplates, setCessTemplates] = useState<TaxTemplate[]>([]);

  const isEditMode = mode === 'edit';

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: defaultItemFormValues,
  });

  // Load tax templates
  useEffect(() => {
    if (!open || !window.taxTemplateApi) return;

    const loadTemplates = async () => {
      try {
        const templates = await window.taxTemplateApi!.listTaxTemplates();
        // Filter GST and CUSTOM templates for tax dropdown
        setTaxTemplates(
          templates.filter((t) => t.taxType === 'GST' || t.taxType === 'CUSTOM')
        );
        // Filter CESS templates for cess dropdown
        setCessTemplates(templates.filter((t) => t.taxType === 'CESS'));
      } catch (error) {
        console.error('Failed to load tax templates:', error);
      }
    };

    void loadTemplates();
  }, [open]);

  // Fetch item data when editing
  useEffect(() => {
    if (!open || !isEditMode || !itemId) {
      reset(defaultItemFormValues);
      return;
    }

    if (!window.itemApi) {
      return;
    }

    setLoading(true);

    const loadItemAndUpdateForm = async () => {
      try {
        const item = await window.itemApi!.getItem(itemId);
        if (item) {
          reset({
            name: item.name,
            description: item.description || '',
            hsnCode: item.hsnCode || '',
            rate: item.rate,
            unit: item.unit,
            taxTemplateId: item.taxTemplateId ?? null,
            cessTemplateId: item.cessTemplateId ?? null,
          });
        }
      } catch (error) {
        showError(
          error instanceof Error ? error.message : 'Failed to load item'
        );
        onClose();
      } finally {
        setLoading(false);
      }
    };

    void loadItemAndUpdateForm();
  }, [open, isEditMode, itemId, reset, showError, onClose]);

  const handleFormSubmit = async (data: ItemFormValues) => {
    if (!window.itemApi) {
      return;
    }

    try {
      const payload = {
        ...data,
        description: data.description || undefined,
        hsnCode: data.hsnCode || undefined,
        taxTemplateId: data.taxTemplateId ?? undefined,
        cessTemplateId: data.cessTemplateId ?? undefined,
      };

      if (isEditMode && itemId) {
        const item = await window.itemApi.updateItem({
          id: itemId,
          ...payload,
        });
        showSuccess('Item updated successfully');
        reset(defaultItemFormValues);
        onSuccess(item);
      } else {
        const item = await window.itemApi.createItem(payload);
        showSuccess('Item created successfully');
        reset(defaultItemFormValues);
        onSuccess(item);
      }
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : `Failed to ${isEditMode ? 'update' : 'create'} item.`
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
        <DialogTitle>{isEditMode ? 'Edit Item' : 'Create Item'}</DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label='Item Name'
              {...register('name')}
              error={Boolean(errors.name)}
              helperText={
                errors.name?.message || 'Name of the product or service'
              }
              required
              fullWidth
              autoFocus
            />

            <TextField
              label='Description'
              {...register('description')}
              error={Boolean(errors.description)}
              helperText={
                errors.description?.message ||
                'Optional description for this item'
              }
              fullWidth
              multiline
              rows={2}
            />

            <Stack direction='row' spacing={2}>
              <TextField
                label='HSN/SAC Code'
                {...register('hsnCode')}
                error={Boolean(errors.hsnCode)}
                helperText={
                  errors.hsnCode?.message ||
                  'GST classification code (4-8 digits)'
                }
                fullWidth
                placeholder='e.g., 998311'
              />

              <Controller
                name='unit'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={Boolean(errors.unit)}>
                    <InputLabel>Unit</InputLabel>
                    <Select {...field} label='Unit'>
                      {UNIT_OPTIONS.map((unit) => (
                        <MenuItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      {errors.unit?.message || 'Unit of measurement'}
                    </FormHelperText>
                  </FormControl>
                )}
              />
            </Stack>

            <Controller
              name='rate'
              control={control}
              render={({ field }) => (
                <TextField
                  label='Rate'
                  type='number'
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseFloat(e.target.value) || 0)
                  }
                  error={Boolean(errors.rate)}
                  helperText={
                    errors.rate?.message || 'Default unit price for this item'
                  }
                  required
                  fullWidth
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position='start'>₹</InputAdornment>
                      ),
                    },
                    htmlInput: { min: 0, step: 0.01 },
                  }}
                />
              )}
            />

            <Controller
              name='taxTemplateId'
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Tax Template</InputLabel>
                  <Select
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const value = e.target.value as string | number;
                      field.onChange(value === '' ? null : Number(value));
                    }}
                    label='Tax Template'
                  >
                    <MenuItem value=''>
                      <em>No Tax</em>
                    </MenuItem>
                    {taxTemplates.map((template) => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name} ({template.rate}%)
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    Default GST/tax template for this item
                  </FormHelperText>
                </FormControl>
              )}
            />

            <Controller
              name='cessTemplateId'
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Cess Template</InputLabel>
                  <Select
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const value = e.target.value as string | number;
                      field.onChange(value === '' ? null : Number(value));
                    }}
                    label='Cess Template'
                  >
                    <MenuItem value=''>
                      <em>No Cess</em>
                    </MenuItem>
                    {cessTemplates.map((template) => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name} ({template.rate}%)
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    Optional compensation cess template
                  </FormHelperText>
                </FormControl>
              )}
            />
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
