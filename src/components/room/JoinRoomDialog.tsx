import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Popover,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../lib/hooks/useStore';

interface JoinRoomPopoverProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

const JoinRoomPopover = observer(function JoinRoomPopover({
  anchorEl,
  onClose,
}: JoinRoomPopoverProps) {
  const { roomStore } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');

  const canSubmit = roomStore.playerName.trim().length > 0;

  const handleCreate = async () => {
    if (!canSubmit) return;
    const code = await roomStore.createRoom();
    if (code) {
      onClose();
      navigate(`/room/${code}`);
    }
  };

  const handleJoin = async () => {
    if (!canSubmit || !roomCode.trim()) return;
    const success = await roomStore.joinRoom(roomCode.trim());
    if (success) {
      onClose();
      navigate(`/room/${roomCode.trim().toUpperCase()}`);
    }
  };

  return (
    <Popover
      open={!!anchorEl}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            mt: 1,
            width: 300,
            backgroundImage: 'none',
          },
        },
      }}>
      <Box sx={{ p: 2.5 }}>
        {roomStore.error && (
          <Alert
            severity="error"
            onClose={() => roomStore.clearError()}
            sx={{ mb: 1.5, py: 0 }}>
            {t(roomStore.error)}
          </Alert>
        )}

        {/* Your identity — shared for both actions */}
        <TextField
          label={t('lobby.playerName')}
          value={roomStore.playerName}
          onChange={e => roomStore.setPlayerName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleCreate();
          }}
          fullWidth
          size="small"
          sx={{ mb: 2 }}
        />

        {/* Create room */}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleCreate}
          disabled={!canSubmit || roomStore.isJoining}
          sx={{ py: 1, fontSize: '0.8rem' }}>
          {roomStore.isJoining ? (
            <CircularProgress size={18} sx={{ color: 'inherit' }} />
          ) : (
            t('lobby.createRoom')
          )}
        </Button>

        <Divider sx={{ my: 1.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontSize: '0.6rem',
            }}>
            {t('lobby.or')}
          </Typography>
        </Divider>

        {/* Join room */}
        <Stack direction="row" spacing={1}>
          <TextField
            placeholder={t('lobby.roomCode')}
            value={roomCode}
            onChange={e => setRoomCode(e.target.value.toUpperCase())}
            onKeyDown={e => {
              if (e.key === 'Enter') handleJoin();
            }}
            size="small"
            slotProps={{
              htmlInput: {
                maxLength: 4,
                style: {
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  fontWeight: 700,
                  textAlign: 'center',
                },
              },
            }}
            sx={{ flex: 1 }}
          />
          <Button
            variant="outlined"
            color="primary"
            onClick={handleJoin}
            disabled={!canSubmit || !roomCode.trim() || roomStore.isJoining}
            sx={{ fontSize: '0.75rem', minWidth: 70 }}>
            {roomStore.isJoining ? (
              <CircularProgress size={18} sx={{ color: 'inherit' }} />
            ) : (
              t('lobby.joinRoom')
            )}
          </Button>
        </Stack>
      </Box>
    </Popover>
  );
});

export default JoinRoomPopover;
