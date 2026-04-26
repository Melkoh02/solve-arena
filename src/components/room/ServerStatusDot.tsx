import { Box, keyframes } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../lib/hooks/useStore';

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

const STATUS_COLORS = {
  offline: '#666',
  waking: '#FFA500',
  online: '#4caf50',
} as const;

const ServerStatusDot = observer(function ServerStatusDot() {
  const { serverStore } = useStore();
  const { t } = useTranslation();

  const color = STATUS_COLORS[serverStore.status];
  const label = t(`server.${serverStore.status}`);

  return (
    <Box
      title={label}
      onClick={
        serverStore.status === 'offline'
          ? () => serverStore.warmUp()
          : undefined
      }
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        cursor: serverStore.status === 'offline' ? 'pointer' : 'default',
      }}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: color,
          boxShadow: `0 0 6px ${color}80`,
          animation:
            serverStore.status === 'waking'
              ? `${pulse} 1.5s ease-in-out infinite`
              : 'none',
        }}
      />
    </Box>
  );
});

export default ServerStatusDot;
