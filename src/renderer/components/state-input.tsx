import { Autocomplete, TextField } from '@mui/material';
import { stateOptions } from '@shared/states';
import { Control, Controller, FieldErrors } from 'react-hook-form';

interface StateInputProps {
  control: Control<any>;
  errors: FieldErrors<any>;
}

export default function StateInput({ control, errors }: StateInputProps) {
  return (
    <Controller
      name='stateCode'
      control={control}
      render={({ field }) => (
        <Autocomplete
          {...field}
          value={
            field?.value
              ? stateOptions.find((option) => option.value === field.value)
              : ''
          }
          options={stateOptions}
          fullWidth
          onChange={(_event, newValue) => {
            field.onChange((newValue as { value: string })?.value ?? '');
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label='State'
              error={Boolean(errors.stateCode)}
              helperText={errors.stateCode?.message as string}
              required
            />
          )}
        />
      )}
    />
  );
}
