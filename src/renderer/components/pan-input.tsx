import { TextField } from '@mui/material';
import { Control, Controller, FieldErrors } from 'react-hook-form';

interface PanInputProps {
  control: Control<any>;
  errors: FieldErrors<any>;
}

export default function PanInput({ control, errors }: PanInputProps) {
  return (
    <Controller
      name='pan'
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          label='PAN'
          error={Boolean(errors.pan)}
          helperText={
            (errors.pan?.message as string) ||
            '10 characters (e.g., ABCDE1234F)'
          }
          slotProps={{
            htmlInput: {
              maxLength: 10,
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

