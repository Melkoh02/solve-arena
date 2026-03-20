import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Divider,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { useStore } from '../lib/hooks/useStore';
import LanguageSelect from '../components/organisims/LanguageSelect';

const LobbyScreen = observer(function LobbyScreen() {
  const { roomStore } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState('');

  const canSubmit = roomStore.playerName.trim().length > 0;

  const handleCreate = async () => {
    if (!canSubmit) return;
    const code = await roomStore.createRoom();
    if (code) navigate(`/room/${code}`);
  };

  const handleJoin = async () => {
    if (!canSubmit || !roomCode.trim()) return;
    const success = await roomStore.joinRoom(roomCode.trim());
    if (success) navigate(`/room/${roomCode.trim().toUpperCase()}`);
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        minHeight: '100vh',
      }}>
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 440,
          p: 5,
          border: '1px solid rgba(255, 105, 180, 0.15)',
        }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
          }}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                color: 'primary.main',
                letterSpacing: '-0.02em',
              }}>
              {t('lobby.title')}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                fontSize: '0.65rem',
              }}>
              Multiplayer Speedcube Timer
            </Typography>
          </Box>
          <LanguageSelect />
        </Box>

        {roomStore.error && (
          <Alert
            severity="error"
            onClose={() => roomStore.clearError()}
            sx={{ mb: 2 }}>
            {roomStore.error}
          </Alert>
        )}

        <TextField
          label={t('lobby.playerName')}
          value={roomStore.playerName}
          onChange={e => roomStore.setPlayerName(e.target.value)}
          fullWidth
          sx={{ mb: 3 }}
        />

        <Button
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          onClick={handleCreate}
          disabled={!canSubmit || roomStore.isJoining}
          sx={{ py: 1.5, fontSize: '0.95rem' }}>
          {t('lobby.createRoom')}
        </Button>

        <Divider sx={{ my: 3 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
            {t('lobby.or')}
          </Typography>
        </Divider>

        <TextField
          label={t('lobby.roomCode')}
          value={roomCode}
          onChange={e => setRoomCode(e.target.value.toUpperCase())}
          fullWidth
          slotProps={{
            htmlInput: {
              maxLength: 4,
              style: {
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                fontWeight: 700,
              },
            },
          }}
          sx={{ mb: 2 }}
        />

        <Button
          variant="outlined"
          color="primary"
          fullWidth
          size="large"
          onClick={handleJoin}
          disabled={!canSubmit || !roomCode.trim() || roomStore.isJoining}
          sx={{ py: 1.5, fontSize: '0.95rem' }}>
          {t('lobby.joinRoom')}
        </Button>
      </Paper>
    </Box>
  );
});

export default LobbyScreen;
