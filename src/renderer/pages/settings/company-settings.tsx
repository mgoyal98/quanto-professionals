import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Stack,
  TextField,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { companyFormSchema, CompanyFormValues } from '@/common/company';
import StateInput from '@/components/state-input';
import PanInput from '@/components/pan-input';
import GstinInput from '@/components/gstin-input';
import { useNotification } from '@/providers/notification';
import { useCompany } from '@/providers/company';
import { getStateByCode } from '@shared/states';

export default function CompanySettings() {
  const { showSuccess, showError } = useNotification();
  const { getCompany } = useCompany();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: '',
      profession: '',
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

  useEffect(() => {
    const loadCompanyDetails = async () => {
      if (!window.companyApi) {
        setError('Company API is not available.');
        setLoading(false);
        return;
      }

      try {
        const company = await window.companyApi.getCompanyDetails();
        if (company) {
          reset({
            name: company.name,
            profession: company.profession || '',
            pan: company.pan || '',
            gstin: company.gstin || '',
            addressLine1: company.addressLine1 || '',
            addressLine2: company.addressLine2 || '',
            city: company.city,
            pinCode: company.pinCode,
            stateCode: company.stateCode,
            phone: company.phone || '',
            email: company.email || '',
          });
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load company details'
        );
      } finally {
        setLoading(false);
      }
    };

    void loadCompanyDetails();
  }, [reset]);

  const onSubmit = async (data: CompanyFormValues) => {
    if (!window.companyApi) {
      showError('Company API is not available.');
      return;
    }

    try {
      const state = getStateByCode(data.stateCode);
      await window.companyApi.updateCompany({
        ...data,
        state: state.name,
      });

      // Refresh company context
      await getCompany();

      showSuccess('Company details updated successfully');
    } catch (err) {
      showError(
        err instanceof Error ? err.message : 'Failed to update company details'
      );
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 300,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity='error' sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box component='form' onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={3}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label='Company Name'
              {...register('name')}
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
              required
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label='Profession'
              {...register('profession')}
              error={Boolean(errors.profession)}
              helperText={errors.profession?.message}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <PanInput control={control} errors={errors} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <GstinInput control={control} errors={errors} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label='Address Line 1'
              {...register('addressLine1')}
              error={Boolean(errors.addressLine1)}
              helperText={errors.addressLine1?.message}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label='Address Line 2'
              {...register('addressLine2')}
              error={Boolean(errors.addressLine2)}
              helperText={errors.addressLine2?.message}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label='City'
              {...register('city')}
              error={Boolean(errors.city)}
              helperText={errors.city?.message}
              required
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label='PIN Code'
              {...register('pinCode')}
              error={Boolean(errors.pinCode)}
              helperText={errors.pinCode?.message}
              slotProps={{ htmlInput: { maxLength: 6 } }}
              required
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <StateInput control={control} errors={errors} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label='Phone'
              {...register('phone')}
              error={Boolean(errors.phone)}
              helperText={errors.phone?.message}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label='Email'
              {...register('email')}
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              fullWidth
            />
          </Grid>
        </Grid>

        <Stack direction='row' justifyContent='flex-end'>
          <Button
            type='submit'
            variant='contained'
            startIcon={<Save />}
            loading={isSubmitting}
            sx={{ minWidth: 160 }}
          >
            Save Changes
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
