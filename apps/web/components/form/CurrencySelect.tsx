'use client';

import { Autocomplete, TextField, Box, Typography } from '@mui/material';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { CURRENCIES, type Currency } from '@/lib/consts/currencies';

interface CurrencySelectProps<TFormValues extends FieldValues> {
  name: Path<TFormValues>;
  control: Control<TFormValues>;
  label?: string;
}

/**
 * Currency dropdown showing a flag + code + name, used by
 * both the Expense form and the Profile settings'
 */
export function CurrencySelect<TFormValues extends FieldValues>({
  name,
  control,
  label = 'Currency',
}: CurrencySelectProps<TFormValues>): React.JSX.Element {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Autocomplete
          options={CURRENCIES}
          getOptionLabel={(option: Currency) => option.code}
          isOptionEqualToValue={(option, value) => option.code === value.code}
          value={CURRENCIES.find((c) => c.code === field.value) ?? undefined}
          onChange={(_event, newValue) => field.onChange(newValue?.code ?? '')}
          disableClearable
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option.code} sx={{ display: 'flex', gap: 1 }}>
              <span>{option.flag}</span>
              <Typography variant="body2">{option.code}</Typography>
              <Typography variant="body2" color="text.secondary">
                — {option.name}
              </Typography>
            </Box>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              margin="normal"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />
      )}
    />
  );
}
