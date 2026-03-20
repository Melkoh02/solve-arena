import { Route, Routes, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import LobbyScreen from '../pages/LobbyScreen';
import RoomScreen from '../pages/RoomScreen';

export default function AppRoutes() {
  return (
    <Box sx={{ height: '100vh', width: '100%', display: 'flex', flex: 1 }}>
      <Routes>
        <Route path="/" element={<LobbyScreen />} />
        <Route path="/room/:code" element={<RoomScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  );
}
