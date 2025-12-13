import * as React from 'react';
import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import Box from '@mui/material/Box';
import {
  Button,
  CircularProgress,
  Grid,
  Stack,
  TextField,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { customerFormSchema, CustomerFormValues } from '@/common/customer';
import { zodResolver } from '@hookform/resolvers/zod';
import StateInput from '@/components/state-input';
import PanInput from '@/components/pan-input';
import GstinInput from '@/components/gstin-input';
import { Customer } from '@shared/customer';
import { getStateByCode } from '@shared/states';
import { useNotification } from '@/providers/notification';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<unknown>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction='up' ref={ref} {...props} />;
});

type CustomerFormMode = 'create' | 'edit';

interface CustomerFormProps {
  open: boolean;
  mode: CustomerFormMode;
  customerId?: number;
  onClose: () => void;
  onSuccess: (customer: Customer) => void;
}

const defaultValues: CustomerFormValues = {
  name: '',
  pan: '',
  gstin: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  pinCode: '',
  stateCode: '',
  phone: '',
  email: '',
};

export default function CustomerForm({
  open,
  mode,
  customerId,
  onClose,
  onSuccess,
}: CustomerFormProps) {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);

  const isEditMode = mode === 'edit';

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: defaultValues,
  });

  // Fetch customer data when editing
  useEffect(() => {
    if (!open || !isEditMode || !customerId) {
      reset(defaultValues); // Reset to default values for new customer
      return;
    }

    if (!window.customerApi) {
      return;
    }

    setLoading(true);

    const loadCustomerAndUpdateForm = async () => {
      try {
        const customer = await window.customerApi.getCustomer(customerId);
        if (customer) {
          reset({
            name: customer.name,
            pan: customer.pan || '',
            gstin: customer.gstin || '',
            addressLine1: customer.addressLine1 || '',
            addressLine2: customer.addressLine2 || '',
            city: customer.city,
            pinCode: customer.pinCode || '',
            stateCode: customer.stateCode,
            phone: customer.phone || '',
            email: customer.email || '',
          });
        }
      } catch (error) {
        showError(
          error instanceof Error ? error.message : 'Failed to load customer'
        );
        onClose();
      } finally {
        setLoading(false);
      }
    };

    void loadCustomerAndUpdateForm();
  }, [open, isEditMode, customerId, reset, showError, onClose]);

  const handleFormSubmit = async (data: CustomerFormValues) => {
    if (!window.customerApi) {
      return;
    }

    try {
      const state = getStateByCode(data.stateCode);

      if (isEditMode && customerId) {
        // Update existing customer
        const customer = await window.customerApi.updateCustomer({
          id: customerId,
          ...data,
          state: state.name,
        });
        showSuccess('Customer updated successfully');
        reset(defaultValues);
        onSuccess(customer);
      } else {
        // Create new customer
        const customer = await window.customerApi.createCustomer({
          ...data,
          state: state.name,
        });
        showSuccess('Customer created successfully');
        onSuccess(customer);
      }
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : `Failed to ${isEditMode ? 'update' : 'create'} customer.`
      );
    }
  };

  // Show loading state while fetching customer data
  if (loading) {
    return (
      <Dialog
        fullScreen
        open={open}
        slots={{
          transition: Transition,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <CircularProgress />
        </Box>
      </Dialog>
    );
  }

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      slots={{
        transition: Transition,
      }}
    >
      <AppBar sx={{ position: 'relative' }}>
        <Toolbar>
          <IconButton
            edge='start'
            color='inherit'
            onClick={onClose}
            aria-label='close'
          >
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant='h6' component='div'>
            {isEditMode ? 'Edit Customer' : 'Create New Customer'}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component='form'
        onSubmit={handleSubmit(handleFormSubmit)}
        noValidate
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <Box sx={{ p: 3, flexGrow: 1 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <TextField
                label='Name'
                {...register('name')}
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
                required
                autoFocus
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <PanInput control={control} errors={errors} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <GstinInput control={control} errors={errors} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <TextField
                label='Address Line 1'
                {...register('addressLine1')}
                error={Boolean(errors.addressLine1)}
                helperText={errors.addressLine1?.message}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <TextField
                label='Address Line 2'
                {...register('addressLine2')}
                error={Boolean(errors.addressLine2)}
                helperText={errors.addressLine2?.message}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <TextField
                label='City'
                {...register('city')}
                error={Boolean(errors.city)}
                helperText={errors.city?.message}
                required
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <TextField
                label='Pincode'
                {...register('pinCode')}
                error={Boolean(errors.pinCode)}
                helperText={errors.pinCode?.message}
                slotProps={{ htmlInput: { maxLength: 6 } }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <StateInput control={control} errors={errors} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <TextField
                label='Phone'
                {...register('phone')}
                error={Boolean(errors.phone)}
                helperText={errors.phone?.message}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <TextField
                label='Email'
                {...register('email')}
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                fullWidth
              />
            </Grid>
          </Grid>
        </Box>
        <Box sx={{ p: 3 }}>
          <Stack spacing={2} direction='row' justifyContent='flex-end'>
            <Button
              variant='outlined'
              color='secondary'
              onClick={onClose}
              size='large'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              loading={isSubmitting}
              variant='contained'
              size='large'
              color='primary'
            >
              {isEditMode ? 'Save Changes' : 'Create'}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Dialog>
  );
}
