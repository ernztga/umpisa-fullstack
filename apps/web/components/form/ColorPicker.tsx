'use client';

import { useState } from 'react';
import { Box, Popover, Typography, TextField } from '@mui/material';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

const SWATCHES = [
  '#6366F1',
  '#4F46E5',
  '#14B8A6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#EC4899',
  '#8B5CF6',
  '#3B82F6',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#DC2626',
  '#6B7280',
  '#0EA5E9',
];

interface ColorPickerProps<TFormValues extends FieldValues> {
  name: Path<TFormValues>;
  control: Control<TFormValues>;
  label?: string;
}

/**
 * Intuitive color selection: a curated swatch grid for the common
 * case, plus a native <input type="color"> for anything else — no
 * manual hex-typing required, and no extra dependency (see
 * architectural decision 2.2).
 */
export function ColorPicker<TFormValues extends FieldValues>({
  name,
  control,
  label = 'Color',
}: ColorPickerProps<TFormValues>): React.JSX.Element {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {label}
          </Typography>
          <Box
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1,
              bgcolor: field.value,
              border: '1px solid',
              borderColor: 'divider',
              cursor: 'pointer',
            }}
            aria-label="Choose color"
            role="button"
          />
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            <Box sx={{ p: 2, width: 220 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, mb: 2 }}>
                {SWATCHES.map((swatch) => (
                  <Box
                    key={swatch}
                    onClick={() => {
                      field.onChange(swatch);
                      setAnchorEl(null);
                    }}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      bgcolor: swatch,
                      cursor: 'pointer',
                      border: field.value === swatch ? '2px solid black' : '1px solid transparent',
                    }}
                  />
                ))}
              </Box>
              <TextField
                type="color"
                label="Custom"
                fullWidth
                size="small"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
            </Box>
          </Popover>
        </Box>
      )}
    />
  );
}
