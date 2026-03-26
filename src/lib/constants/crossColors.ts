import type { CrossColor } from '../types/room';

export interface CrossColorEntry {
  key: CrossColor;
  hex: string;
  label: string;
}

export const CROSS_COLORS: CrossColorEntry[] = [
  { key: 'w', hex: '#FFFFFF', label: 'White' },
  { key: 'y', hex: '#FFD500', label: 'Yellow' },
  { key: 'r', hex: '#E00000', label: 'Red' },
  { key: 'o', hex: '#FF8C00', label: 'Orange' },
  { key: 'b', hex: '#0051BA', label: 'Blue' },
  { key: 'g', hex: '#009E60', label: 'Green' },
];

export const CROSS_COLOR_HEX: Record<string, string> = Object.fromEntries(
  CROSS_COLORS.map(c => [c.key, c.hex]),
);

export const CROSS_COLOR_LABEL: Record<string, string> = Object.fromEntries(
  CROSS_COLORS.map(c => [c.key, c.label]),
);
