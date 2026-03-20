import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { useStore } from '../lib/hooks/useStore';
import { useTheme } from '../lib/hooks/useTheme';
import LanguageSelect from '../components/organisims/LanguageSelect';

const LobbyScreen = observer(function LobbyScreen() {
  const { roomStore, themeStore } = useStore();
  const { theme } = useTheme();
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
      }}>
      <Paper elevation={2} sx={{ width: '100%', maxWidth: 480, p: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}>
          <Typography variant="h5" fontWeight={700}>
            {t('lobby.title')}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControlLabel
              sx={{ m: 0 }}
              control={
                <Switch
                  checked={theme.scheme === 'dark'}
                  onChange={themeStore.toggle}
                  size="small"
                />
              }
              label=""
            />
            <LanguageSelect />
          </Stack>
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
          fullWidth
          size="large"
          onClick={handleCreate}
          disabled={!canSubmit || roomStore.isJoining}>
          {t('lobby.createRoom')}
        </Button>

        <Divider sx={{ my: 3 }}>{t('lobby.or')}</Divider>

        <TextField
          label={t('lobby.roomCode')}
          value={roomCode}
          onChange={e => setRoomCode(e.target.value.toUpperCase())}
          fullWidth
          slotProps={{
            htmlInput: { maxLength: 4, style: { textTransform: 'uppercase' } },
          }}
          sx={{ mb: 2 }}
        />

        <Button
          variant="outlined"
          fullWidth
          size="large"
          onClick={handleJoin}
          disabled={!canSubmit || !roomCode.trim() || roomStore.isJoining}>
          {t('lobby.joinRoom')}
        </Button>
      </Paper>
    </Box>
  );
});

export default LobbyScreen;
