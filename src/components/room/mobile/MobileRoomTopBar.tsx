import { Box, IconButton, Stack, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SettingsIcon from '@mui/icons-material/Settings';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import { useTranslation } from 'react-i18next';

export interface MobileRoomTopBarProps {
  roomCode: string;
  playerCount: number;
  onOpenSidebar: () => void;
  onOpenSettings: () => void;
  onLeave: () => void;
  onCopyCode: () => void;
}

export default function MobileRoomTopBar({
  roomCode,
  playerCount,
  onOpenSidebar,
  onOpenSettings,
  onLeave,
  onCopyCode,
}: MobileRoomTopBarProps) {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 0.5,
        px: 1,
        pt: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        pb: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        flexShrink: 0,
      }}>
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
        <IconButton
          size="medium"
          onClick={onOpenSidebar}
          aria-label={t('room.competitors')}
          sx={{ color: 'text.secondary' }}>
          <MenuIcon sx={{ fontSize: 22 }} />
        </IconButton>
        <Typography
          sx={{
            color: 'primary.main',
            fontWeight: 800,
            fontSize: '0.95rem',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
          {t('room.roomLabel')}: {roomCode}
        </Typography>
        <IconButton
          size="small"
          onClick={onCopyCode}
          aria-label="Copy room code"
          sx={{ p: 0.75, color: 'text.secondary' }}>
          <ContentCopyIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Stack>
      <Stack direction="row" spacing={0.25} alignItems="center" sx={{ flexShrink: 0 }}>
        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mr: 0.5 }}>
          {t('room.playerCount', { count: playerCount })}
        </Typography>
        <IconButton
          size="medium"
          onClick={onOpenSettings}
          aria-label={t('settings.title')}
          sx={{ color: 'text.secondary' }}>
          <SettingsIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <IconButton
          size="medium"
          onClick={onLeave}
          aria-label={t('room.leave')}
          sx={{ color: 'error.main' }}>
          <MeetingRoomIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Stack>
    </Box>
  );
}
