import { Box, Card } from '@mui/material';
import { Outlet } from 'react-router';

export default function CompanyLayout() {
  return (
    <Box
      sx={{
        height: '100dvh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        bgcolor: (theme) => theme.palette.grey[50],
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 600,
          height: '100%',
          maxHeight: 700,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
        elevation={2}
      >
        <Outlet />
      </Card>
    </Box>
  );
}
