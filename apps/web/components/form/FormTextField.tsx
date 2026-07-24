import { TextField, type TextFieldProps } from '@mui/material';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

interface FormTextFieldProps<TFormValues extends FieldValues> {
  name: Path<TFormValues>;
  control: Control<TFormValues>;
  label: string;
  type?: TextFieldProps['type'];
  autoComplete?: string;
}

/**
 * Reusable component for forms
 */
export function FormTextField<TFormValues extends FieldValues>({
  name,
  control,
  label,
  type = 'text',
  autoComplete,
}: FormTextFieldProps<TFormValues>): React.JSX.Element {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          label={label}
          type={type}
          autoComplete={autoComplete}
          fullWidth
          margin="normal"
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message}
        />
      )}
    />
  );
}
