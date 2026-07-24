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
 * Reusable bridge between React Hook Form's Controller and MUI's
 * TextField, wiring error display automatically from RHF's field
 * state. Every form field in the app (login, register, and later
 * category/expense forms) uses this instead of manually wiring
 * Controller + TextField + error props at every call site — this is
 * one of the highest-leverage reusable components in the whole app,
 * since Steps 9-10 collectively need a dozen+ text fields.
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
