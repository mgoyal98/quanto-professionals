import { TextField } from '@mui/material';
import { Control, Controller, FieldErrors } from 'react-hook-form';

interface GstinInputProps {
  control: Control<any>;
  errors: FieldErrors<any>;
}

export default function GstinInput({ control, errors }: GstinInputProps) {
  return (
    <Controller
      name='gstin'
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          label='GSTIN'
          error={Boolean(errors.gstin)}
          helperText={
            (errors.gstin?.message as string) ||
            '15 characters (e.g., 01ABCDE1234F1Z0)'
          }
          slotProps={{
            htmlInput: {
              maxLength: 15,
              style: { textTransform: 'uppercase' },
            },
          }}
          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
          fullWidth
        />
      )}
    />
  );
}

