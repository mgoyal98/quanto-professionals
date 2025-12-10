import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import Box from '@mui/material/Box';
import { Button, Grid, Stack, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import { customerFormSchema, CustomerFormValues } from '@/common/customer';
import { zodResolver } from '@hookform/resolvers/zod';
import StateInput from '@/components/state-input';
import { Customer } from '@shared/customer';
import { getStateByCode } from '@shared/states';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<unknown>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction='up' ref={ref} {...props} />;
});

interface NewCustomerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (customer: Customer) => void;
}

export default function NewCustomer({
  open,
  onClose,
  onSuccess,
}: NewCustomerProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
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
    },
  });

  const handleNewCustomer = async (data: CustomerFormValues) => {
    if (!window.customerApi) {
      return;
    }

    try {
      const state = getStateByCode(data.stateCode);
      const customer = await window.customerApi.createCustomer({
        ...data,
        state: state.name,
      });
      onSuccess(customer);
    } catch (error) {
      console.error('Failed to create customer:', error);
    }
  };

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
            Add New Customer
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component='form'
        onSubmit={handleSubmit(handleNewCustomer)}
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
              <TextField
                label='PAN'
                {...register('pan')}
                error={Boolean(errors.pan)}
                helperText={errors.pan?.message}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <TextField
                label='GSTIN'
                {...register('gstin')}
                error={Boolean(errors.gstin)}
                helperText={errors.gstin?.message}
                fullWidth
              />
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
              Add
            </Button>
          </Stack>
        </Box>
      </Box>
    </Dialog>
  );
}
