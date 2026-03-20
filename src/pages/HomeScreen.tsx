import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function HomeScreen() {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Typography variant="h5">{t('home.welcome')}</Typography>
    </Box>
  );
}
