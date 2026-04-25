import { Box, IconButton, Stack } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import GroupsIcon from '@mui/icons-material/Groups';
import { useTranslation } from 'react-i18next';
import PuzzleSelector from '../../timer/PuzzleSelector';
import ServerStatusDot from '../../room/ServerStatusDot';

export interface MobileTopBarProps {
  eventId: string;
  onChangePuzzle: (id: string) => void;
  onOpenSettings: () => void;
  onOpenCompete: (anchor: HTMLElement) => void;
}

export default function MobileTopBar({
  eventId,
  onChangePuzzle,
  onOpenSettings,
  onOpenCompete,
}: MobileTopBarProps) {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        px: 1.5,
        // Respect iOS notch / status bar
        pt: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        pb: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        flexShrink: 0,
      }}>
      <Box sx={{ minWidth: 0, flex: '0 1 auto' }}>
        <PuzzleSelector value={eventId} onChange={onChangePuzzle} />
      </Box>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <IconButton
          size="medium"
          onClick={onOpenSettings}
          aria-label={t('settings.title')}
          sx={{ color: 'text.secondary' }}>
          <SettingsIcon sx={{ fontSize: 22 }} />
        </IconButton>
        <IconButton
          size="medium"
          onClick={e => onOpenCompete(e.currentTarget)}
          aria-label={t('lobby.compete')}
          sx={{
            color: 'primary.main',
            border: '1.5px solid',
            borderColor: 'primary.main',
            borderRadius: '999px',
            position: 'relative',
            px: 1,
          }}>
          <GroupsIcon sx={{ fontSize: 20 }} />
          <Box
            sx={{
              position: 'absolute',
              right: 4,
              top: 4,
            }}>
            <ServerStatusDot />
          </Box>
        </IconButton>
      </Stack>
    </Box>
  );
}
