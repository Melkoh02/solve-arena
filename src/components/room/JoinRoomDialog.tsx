import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  LinearProgress,
  Popover,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../lib/hooks/useStore';
import ServerStatusDot from './ServerStatusDot';

interface JoinRoomPopoverProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

const JoinRoomPopover = observer(function JoinRoomPopover({
  anchorEl,
  onClose,
}: JoinRoomPopoverProps) {
  const { roomStore, serverStore } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [action, setAction] = useState<'create' | 'join' | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const isWaking = serverStore.status === 'waking';

  // Elapsed counter while server is waking
  useEffect(() => {
    if (!isWaking) {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [isWaking]);

  const canSubmit = roomStore.playerName.trim().length > 0;
  const isBusy = roomStore.isJoining;

  const handleCreate = async () => {
    if (!canSubmit || isBusy) return;
    setAction('create');
    const code = await roomStore.createRoom();
    setAction(null);
    if (code) {
      onClose();
      navigate(`/room/${code}`);
    }
  };

  const handleJoin = async () => {
    if (!canSubmit || !roomCode.trim() || isBusy) return;
    setAction('join');
    const success = await roomStore.joinRoom(roomCode.trim());
    setAction(null);
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
            {t('lobby.compete')}
          </Typography>
          <ServerStatusDot />
        </Box>

        {isWaking && (
          <Box
            sx={{
              mb: 1.5,
              p: 1.5,
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'rgba(255, 165, 0, 0.3)',
              bgcolor: 'rgba(255, 165, 0, 0.06)',
            }}>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 0.75 }}>
              {t('server.wakingMessage', { seconds: elapsed })}
            </Typography>
            <LinearProgress
              color="warning"
              sx={{ borderRadius: 1, height: 3 }}
            />
          </Box>
        )}

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
            disabled={!canSubmit || !roomCode.trim() || isBusy}
            sx={{ fontSize: '0.75rem', minWidth: 70 }}>
            {action === 'join' ? (
              <CircularProgress size={18} sx={{ color: 'inherit' }} />
            ) : (
              t('lobby.joinRoom')
            )}
          </Button>
        </Stack>

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

        {/* Create room */}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleCreate}
          disabled={!canSubmit || isBusy}
          sx={{ py: 1, fontSize: '0.8rem' }}>
          {action === 'create' ? (
            <CircularProgress size={18} sx={{ color: 'inherit' }} />
          ) : (
            t('lobby.createRoom')
          )}
        </Button>
      </Box>
    </Popover>
  );
});

export default JoinRoomPopover;
