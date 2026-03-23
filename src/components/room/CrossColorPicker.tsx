import { useState } from 'react';
import { Box, Popover } from '@mui/material';
import type { CrossColor } from '../../lib/types/room';

const COLORS: { key: CrossColor; hex: string }[] = [
  { key: 'w', hex: '#FFFFFF' },
  { key: 'y', hex: '#FFD500' },
  { key: 'r', hex: '#E00000' },
  { key: 'o', hex: '#FF8C00' },
  { key: 'b', hex: '#0051BA' },
  { key: 'g', hex: '#009E60' },
];

interface CrossColorPickerProps {
  value?: CrossColor;
  onChange: (color: CrossColor) => void;
  size?: number;
}

export default function CrossColorPicker({
  value = 'w',
  onChange,
  size = 22,
}: CrossColorPickerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const currentHex = COLORS.find(c => c.key === value)?.hex ?? '#FFFFFF';

  return (
    <>
      <Box
        onClick={e => {
          e.stopPropagation();
          setAnchorEl(e.currentTarget);
        }}
        sx={{
          width: size,
          height: size,
          borderRadius: 0.75,
          bgcolor: currentHex,
          cursor: 'pointer',
          border: '2px solid',
          borderColor: 'divider',
          flexShrink: 0,
          transition: 'box-shadow 0.15s',
          '&:hover': {
            boxShadow: `0 0 6px ${currentHex}80`,
          },
        }}
      />
      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            sx: {
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              p: 1,
              mt: 0.5,
            },
          },
        }}>
        <Box sx={{ display: 'flex', gap: 0.75 }}>
          {COLORS.map(c => (
            <Box
              key={c.key}
              onClick={e => {
                e.stopPropagation();
                onChange(c.key);
                setAnchorEl(null);
              }}
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: c.hex,
                cursor: 'pointer',
                border: '2px solid',
                borderColor: value === c.key ? 'primary.main' : 'transparent',
                opacity: value === c.key ? 1 : 0.6,
                transition: 'all 0.15s',
                '&:hover': { opacity: 1 },
              }}
            />
          ))}
        </Box>
      </Popover>
    </>
  );
}
