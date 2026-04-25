import type {
  ShortcutBinding,
  ShortcutBindings,
  ShortcutId,
} from '../constants/settingsDefaults';

const MODIFIER_KEYS = new Set([
  'Control',
  'Shift',
  'Alt',
  'Meta',
  'CapsLock',
  'OS',
  'Hyper',
  'Super',
]);

/** Normalize a KeyboardEvent.key for comparison (case-insensitive single chars). */
function normalize(key: string): string {
  return key.length === 1 ? key.toLowerCase() : key;
}

/** True when an event matches a binding. Ctrl and Cmd (meta) are treated as equivalent. */
export function matchesShortcut(e: KeyboardEvent, b: ShortcutBinding): boolean {
  if (normalize(e.key) !== normalize(b.key)) return false;
  if (!!b.ctrl !== (e.ctrlKey || e.metaKey)) return false;
  if (!!b.shift !== e.shiftKey) return false;
  if (!!b.alt !== e.altKey) return false;
  return true;
}

/** True when a key from a KeyboardEvent is a pure modifier (no usable binding). */
export function isModifierOnly(key: string): boolean {
  return MODIFIER_KEYS.has(key);
}

/** Build a binding from the current state of a KeyboardEvent. */
export function bindingFromEvent(e: KeyboardEvent): ShortcutBinding | null {
  if (isModifierOnly(e.key)) return null;
  return {
    key: e.key.length === 1 ? e.key.toLowerCase() : e.key,
    ctrl: e.ctrlKey || e.metaKey || undefined,
    shift: e.shiftKey || undefined,
    alt: e.altKey || undefined,
  };
}

/** Pretty display: "Ctrl+Shift+Backspace", "W", "Space". */
export function formatShortcut(b: ShortcutBinding): string {
  const parts: string[] = [];
  if (b.ctrl) parts.push('Ctrl');
  if (b.alt) parts.push('Alt');
  if (b.shift) parts.push('Shift');
  parts.push(formatKey(b.key));
  return parts.join('+');
}

function formatKey(key: string): string {
  if (key === ' ' || key === 'Space') return 'Space';
  if (key.length === 1) return key.toUpperCase();
  return key;
}

export function shortcutsEqual(a: ShortcutBinding, b: ShortcutBinding): boolean {
  return (
    normalize(a.key) === normalize(b.key) &&
    !!a.ctrl === !!b.ctrl &&
    !!a.shift === !!b.shift &&
    !!a.alt === !!b.alt
  );
}

/** IDs of shortcuts that share a binding with the one at `id`. */
export function findConflicts(
  bindings: ShortcutBindings,
  id: ShortcutId,
): ShortcutId[] {
  const target = bindings[id];
  const out: ShortcutId[] = [];
  for (const key of Object.keys(bindings) as ShortcutId[]) {
    if (key === id) continue;
    if (shortcutsEqual(bindings[key], target)) out.push(key);
  }
  return out;
}

/** Look up which color a keydown event corresponds to, given current bindings. */
const COLOR_BINDING_IDS = [
  ['colorWhite', 'w'],
  ['colorYellow', 'y'],
  ['colorRed', 'r'],
  ['colorOrange', 'o'],
  ['colorBlue', 'b'],
  ['colorGreen', 'g'],
] as const;

export function getColorFromEvent(
  e: KeyboardEvent,
  bindings: ShortcutBindings,
): 'w' | 'y' | 'r' | 'o' | 'b' | 'g' | null {
  for (const [id, color] of COLOR_BINDING_IDS) {
    if (matchesShortcut(e, bindings[id])) return color;
  }
  return null;
}
