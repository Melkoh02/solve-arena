import type { WCAEvent } from '../types/timer';

export const WCA_EVENTS: WCAEvent[] = [
  { id: '222', name: '2x2x2' },
  { id: '333', name: '3x3x3' },
  { id: '444', name: '4x4x4' },
  { id: '555', name: '5x5x5' },
  { id: '666', name: '6x6x6' },
  { id: '777', name: '7x7x7' },
  { id: '333bf', name: '3x3 BLD' },
  { id: '333fm', name: '3x3 FMC' },
  { id: '333oh', name: '3x3 OH' },
  { id: 'clock', name: 'Clock' },
  { id: 'minx', name: 'Megaminx' },
  { id: 'pyram', name: 'Pyraminx' },
  { id: 'skewb', name: 'Skewb' },
  { id: 'sq1', name: 'Square-1' },
  { id: '444bf', name: '4x4 BLD' },
  { id: '555bf', name: '5x5 BLD' },
  { id: '333mbf', name: '3x3 MBLD' },
];

export const DEFAULT_EVENT = WCA_EVENTS[1]; // 3x3x3
