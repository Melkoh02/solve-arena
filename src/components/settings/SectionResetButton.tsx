import { Button, Fade } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import { useTranslation } from 'react-i18next';

interface SectionResetButtonProps {
  visible: boolean;
  onClick: () => void;
}

export default function SectionResetButton({
  visible,
  onClick,
}: SectionResetButtonProps) {
  const { t } = useTranslation();
  return (
    <Fade in={visible} unmountOnExit>
      <Button
        size="small"
        variant="text"
        startIcon={<RestoreIcon sx={{ fontSize: 14 }} />}
        onClick={onClick}
        sx={{
          textTransform: 'none',
          fontSize: '0.7rem',
          color: 'text.secondary',
          minWidth: 0,
          px: 1,
        }}>
        {t('settings.resetToDefault')}
      </Button>
    </Fade>
  );
}
