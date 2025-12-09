import { companyFormSchema, CompanyFormValues } from '@/common/company';
import { Routes } from '@/common/routes';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Divider,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { getStateByCode, stateOptions } from '@shared/states';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useCompany } from '@/providers/company';

export default function NewCompany() {
  const navigate = useNavigate();

  const { getCompany } = useCompany();

  const [error, setError] = useState<string | null>(null);

  const handleBack = () => navigate(Routes.SelectCompany);

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

  const openCompany = async (filePath: string) => {
    if (!window.companyApi) {
      return;
    }

    try {
      await window.companyApi.openCompany(filePath);
      await getCompany();
      navigate(Routes.Dashboard);
    } catch (err) {
      console.error('Failed to open company:', err);
    }
  };

  const onSubmit = async (data: CompanyFormValues) => {
    if (!window.companyApi) {
      setError('Company API is not available.');
      return;
    }

    try {
      setError(null);

      const state = getStateByCode(data.stateCode);
      const companyFilePath = await window.companyApi.createCompany({
        ...data,
        state: state.name,
      });

      reset();

      await openCompany(companyFilePath);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Unable to create company.'
      );
    }
  };

  return (
    <>
      <Box sx={{ p: 3 }}>
        <Typography variant='h5'>Create a new company</Typography>
        <Typography variant='body2' color='text.secondary'>
          Choose a company name to create a new database.
        </Typography>
      </Box>
      <Divider />
      {error ? (
        <Box p={2}>
          <Alert severity='error'>{error}</Alert>
        </Box>
      ) : null}
      <Box
        component='form'
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
          <Grid container spacing={2}>
            <Grid size={6}>
              <TextField
                label='Company name'
                {...register('name')}
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
                required
                autoFocus
                fullWidth
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label='Profession'
                {...register('profession')}
                error={Boolean(errors.profession)}
                helperText={errors.profession?.message}
                fullWidth
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label='PAN'
                {...register('pan')}
                error={Boolean(errors.pan)}
                helperText={errors.pan?.message}
                fullWidth
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label='GSTIN'
                {...register('gstin')}
                error={Boolean(errors.gstin)}
                helperText={errors.gstin?.message}
                fullWidth
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label='Address Line 1'
                {...register('addressLine1')}
                error={Boolean(errors.addressLine1)}
                helperText={errors.addressLine1?.message}
                fullWidth
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label='Address Line 2'
                {...register('addressLine2')}
                error={Boolean(errors.addressLine2)}
                helperText={errors.addressLine2?.message}
                fullWidth
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label='City'
                {...register('city')}
                error={Boolean(errors.city)}
                helperText={errors.city?.message}
                required
                fullWidth
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label='Pincode'
                {...register('pinCode')}
                error={Boolean(errors.pinCode)}
                helperText={errors.pinCode?.message}
                slotProps={{ htmlInput: { maxLength: 6 } }}
                required
                fullWidth
              />
            </Grid>
            <Grid size={6}>
              <Controller
                name='stateCode'
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    value={
                      field?.value
                        ? stateOptions.find(
                            (option) => option.value === field.value
                          )
                        : ''
                    }
                    options={stateOptions}
                    fullWidth
                    onChange={(_event, newValue) => {
                      field.onChange(
                        (newValue as { value: string })?.value ?? ''
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label='State'
                        error={Boolean(errors.stateCode)}
                        helperText={errors.stateCode?.message}
                        required
                      />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid size={6}>
              <TextField label='Phone' fullWidth />
            </Grid>
            <Grid size={6}>
              <TextField label='Email' fullWidth />
            </Grid>
          </Grid>
        </Box>
        <Divider />
        <Box
          component='footer'
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Button
            type='button'
            variant='text'
            sx={{ minWidth: 100 }}
            onClick={handleBack}
          >
            Back
          </Button>
          <Button
            type='submit'
            variant='contained'
            sx={{ minWidth: 150 }}
            loading={isSubmitting}
          >
            Create company
          </Button>
        </Box>
      </Box>
    </>
  );
}
