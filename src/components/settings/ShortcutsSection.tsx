import { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Box, Stack, Tooltip, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../lib/hooks/useStore';
import {
  bindingFromEvent,
  findConflicts,
  formatShortcut,
  isModifierOnly,
} from '../../lib/utils/shortcuts';
import type { ShortcutId } from '../../lib/constants/settingsDefaults';
import SectionResetButton from './SectionResetButton';
import {
  SETTINGS_LABEL_SX as LABEL_SX,
  SETTINGS_SECTION_HEADER_SX,
} from './styles';

const SHORTCUT_GROUPS: Array<{
  title?: string;
  ids: ShortcutId[];
}> = [
  {
    ids: [
      'colorWhite',
      'colorYellow',
      'colorRed',
      'colorOrange',
      'colorBlue',
      'colorGreen',
    ],
  },
  {
    ids: [
      'deleteLastSolve',
      'clearAllSolves',
      'holdScramblePreview',
      'toggleScramblePreview',
      'toggleHistory',
    ],
  },
];

const ShortcutsSection = observer(function ShortcutsSection() {
  const { settingsStore } = useStore();
  const { t } = useTranslation();
  const [recordingId, setRecordingId] = useState<ShortcutId | null>(null);

  // Capture next non-modifier key while recording
  const recordingRef = useRef<ShortcutId | null>(null);
  recordingRef.current = recordingId;
  useEffect(() => {
    if (!recordingId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') {
        setRecordingId(null);
        return;
      }
      if (isModifierOnly(e.key)) return;
      const binding = bindingFromEvent(e);
      if (!binding) return;
      const id = recordingRef.current;
      if (id) settingsStore.setShortcut(id, binding);
      setRecordingId(null);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [recordingId, settingsStore]);

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}>
        <Typography sx={SETTINGS_SECTION_HEADER_SX}>
          {t('settings.shortcutsSection')}
        </Typography>
        <SectionResetButton
          visible={settingsStore.isShortcutsModified}
          onClick={() => settingsStore.resetShortcuts()}
        />
      </Stack>

      <Typography sx={{ ...LABEL_SX, mb: 1.5 }}>
        {t('settings.shortcutsHint')}
      </Typography>

      {SHORTCUT_GROUPS.map((group, gIdx) => (
        <Box
          key={gIdx}
          sx={{
            mb: gIdx < SHORTCUT_GROUPS.length - 1 ? 1.5 : 0,
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            rowGap: 0.75,
            columnGap: 1.5,
            alignItems: 'center',
          }}>
          {group.ids.map(id => {
            const binding = settingsStore.shortcuts[id];
            const conflicts = findConflicts(settingsStore.shortcuts, id);
            const recording = recordingId === id;
            return (
              <Row
                key={id}
                label={t(`settings.shortcuts.${id}`)}
                display={
                  recording
                    ? t('settings.shortcutRecording')
                    : formatShortcut(binding)
                }
                recording={recording}
                conflict={conflicts.length > 0}
                conflictTitle={
                  conflicts.length > 0
                    ? `${t('settings.shortcutConflict')}: ${conflicts
                        .map(c => t(`settings.shortcuts.${c}`))
                        .join(', ')}`
                    : ''
                }
                onClick={() =>
                  setRecordingId(prev => (prev === id ? null : id))
                }
              />
            );
          })}
        </Box>
      ))}
    </Box>
  );
});

interface RowProps {
  label: string;
  display: string;
  recording: boolean;
  conflict: boolean;
  conflictTitle: string;
  onClick: () => void;
}

function Row({
  label,
  display,
  recording,
  conflict,
  conflictTitle,
  onClick,
}: RowProps) {
  return (
    <>
      <Stack
        direction="row"
        spacing={0.75}
        alignItems="center"
        sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: '0.78rem',
            color: 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
          {label}
        </Typography>
        {conflict && (
          <Tooltip title={conflictTitle} arrow>
            <WarningAmberIcon
              sx={{ fontSize: 14, color: 'warning.main', flexShrink: 0 }}
            />
          </Tooltip>
        )}
      </Stack>
      <Box
        component="button"
        type="button"
        onClick={onClick}
        sx={{
          appearance: 'none',
          fontFamily: 'monospace',
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.02em',
          minWidth: 88,
          px: 1.25,
          py: 0.5,
          borderRadius: 1.25,
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'all 0.15s',
          bgcolor: recording
            ? 'rgba(255, 105, 180, 0.18)'
            : 'rgba(255, 255, 255, 0.04)',
          color: recording
            ? 'primary.main'
            : conflict
              ? 'warning.main'
              : 'text.primary',
          border: '1px solid',
          borderColor: recording
            ? 'primary.main'
            : conflict
              ? 'warning.main'
              : 'divider',
          '&:hover': {
            borderColor: recording ? 'primary.main' : 'primary.main',
            bgcolor: 'rgba(255, 105, 180, 0.08)',
          },
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
          },
        }}>
        {display}
      </Box>
    </>
  );
}

export default ShortcutsSection;
