import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { useStore } from '../lib/hooks/useStore';
import { minVhSafe } from '../lib/utils/viewport';
import LanguageSelect from '../components/organisms/LanguageSelect';

const LobbyScreen = observer(function LobbyScreen() {
  const { roomStore, themeStore } = useStore();
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
        ...minVhSafe(100),
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
              {t('lobby.subtitle')}
            </Typography>
          </Box>
        </Box>

        {roomStore.error && (
          <Alert
            severity="error"
            onClose={() => roomStore.clearError()}
            sx={{ mb: 2 }}>
            {t(roomStore.error)}
          </Alert>
        )}

        <TextField
          label={t('lobby.playerName')}
          value={roomStore.playerName}
          onChange={e => roomStore.setPlayerName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleCreate();
          }}
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
          {roomStore.isJoining ? (
            <CircularProgress size={22} sx={{ color: 'inherit' }} />
          ) : (
            t('lobby.createRoom')
          )}
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
          onKeyDown={e => {
            if (e.key === 'Enter') handleJoin();
          }}
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
          {roomStore.isJoining ? (
            <CircularProgress size={22} sx={{ color: 'inherit' }} />
          ) : (
            t('lobby.joinRoom')
          )}
        </Button>

        <Box
          sx={{
            mt: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 0.5,
          }}>
          <IconButton
            size="small"
            onClick={themeStore.toggle}
            aria-label={t('settings.toggleTheme')}
            title={t('settings.toggleTheme')}>
            {themeStore.scheme === 'light' && <DarkModeIcon fontSize="small" />}
            {themeStore.scheme === 'dark' && (
              <AutoAwesomeIcon fontSize="small" />
            )}
            {themeStore.scheme === 'glass' && (
              <LightModeIcon fontSize="small" />
            )}
          </IconButton>
          <LanguageSelect />
        </Box>
      </Paper>
    </Box>
  );
});

export default LobbyScreen;
