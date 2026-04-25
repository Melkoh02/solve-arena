import { Route, Routes, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import SoloScreen from '../pages/SoloScreen';
import RoomScreen from '../pages/RoomScreen';
import { vhSafe } from '../lib/utils/viewport';

export default function AppRoutes() {
  return (
    <Box sx={{ ...vhSafe(100), width: '100%', display: 'flex', flex: 1 }}>
      <Routes>
        <Route path="/" element={<SoloScreen />} />
        <Route path="/room/:code" element={<RoomScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  );
}
