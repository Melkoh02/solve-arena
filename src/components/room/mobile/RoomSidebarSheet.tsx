import { observer } from 'mobx-react-lite';
import {
  Box,
  Button,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../../lib/hooks/useStore';
import { vhSafe } from '../../../lib/utils/viewport';
import PlayerSidebar from '../PlayerSidebar';
import HostControls from '../HostControls';

export interface RoomSidebarSheetProps {
  open: boolean;
  onClose: () => void;
  onLeave: () => void;
  onCopyCode: () => void;
}

const RoomSidebarSheet = observer(function RoomSidebarSheet({
  open,
  onClose,
  onLeave,
  onCopyCode,
}: RoomSidebarSheetProps) {
  const { roomStore } = useStore();
  const { t } = useTranslation();

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            ...vhSafe(85),
            display: 'flex',
            flexDirection: 'column',
            pb: 'calc(env(safe-area-inset-bottom, 0px))',
          },
        },
      }}>
      {/* Drag handle */}
      <Box
        sx={{
          width: 40,
          height: 4,
          bgcolor: 'divider',
          borderRadius: 2,
          mx: 'auto',
          mt: 1,
          mb: 1,
          flexShrink: 0,
        }}
      />

      {/* Header: player name + room code on the left, close on the right */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              fontSize: '0.6rem',
              fontWeight: 700,
              color: 'text.secondary',
              mb: 0.25,
            }}>
            {t('room.player')}
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: 'primary.main',
                fontWeight: 800,
                fontSize: '1rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
              {roomStore.playerName}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
              {roomStore.isHost ? t('room.host') : t('room.competitor')}
            </Typography>
          </Stack>
        </Box>
        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          sx={{ flexShrink: 0 }}>
          <Stack
            direction="row"
            spacing={0.25}
            alignItems="center"
            sx={{ mr: 0.5 }}>
            <Typography
              sx={{
                color: 'primary.main',
                fontWeight: 800,
                fontSize: '0.85rem',
                letterSpacing: '0.05em',
              }}>
              {roomStore.roomCode}
            </Typography>
            <IconButton size="small" onClick={onCopyCode} sx={{ p: 0.5 }}>
              <ContentCopyIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            </IconButton>
          </Stack>
          <IconButton
            size="medium"
            onClick={onClose}
            aria-label={t('common.cancel')}
            sx={{ color: 'text.secondary', p: 0.875 }}>
            <CloseIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </Stack>
      </Box>

      {/* Competitors list — scrollable region */}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', py: 1 }}>
        <PlayerSidebar />
      </Box>

      {/* Host controls (only renders for host) + Leave */}
      <Box
        sx={{
          flexShrink: 0,
          borderTop: '1px solid',
          borderColor: 'divider',
          p: 2,
        }}>
        <HostControls />
        <Button
          variant="outlined"
          color="error"
          fullWidth
          onClick={onLeave}
          sx={{ mt: roomStore.isHost ? 1 : 0, textTransform: 'none' }}>
          {t('room.leave')}
        </Button>
      </Box>
    </Drawer>
  );
});

export default RoomSidebarSheet;
