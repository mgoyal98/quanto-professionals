import { Routes } from '@/common/routes';
import { Add, FileUploadOutlined } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Divider,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router';

export default function SelectCompany() {
  const navigate = useNavigate();

  const handleNewCompany = () => {
    navigate(Routes.NewCompany);
  };

  return (
    <>
      <Box sx={{ p: 3 }}>
        <Typography variant='h5'>Welcome to Quanto</Typography>
        <Typography variant='body2' color='text.secondary'>
          Create a new company or load an existing database to get started.
        </Typography>
      </Box>
      <Divider />
      <List sx={{ p: 0 }} aria-labelledby='create-or-select-company'>
        <ListItemButton onClick={handleNewCompany}>
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: 'primary.light' }}>
              <Add color='primary' />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary='New Company'
            secondary='Create a new company database'
            slotProps={{
              primary: { variant: 'h6' },
              secondary: { variant: 'caption' },
            }}
          />
        </ListItemButton>
        <ListItemButton>
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: 'secondary.light' }}>
              <FileUploadOutlined color='secondary' />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary='Existing Company'
            secondary='Browse to a saved company database'
            slotProps={{
              primary: { variant: 'h6' },
              secondary: { variant: 'caption' },
            }}
          />
        </ListItemButton>
      </List>
      <Divider />
      <Typography variant='h6' sx={{ p: 2 }}>
        Recent Companies
      </Typography>
      <Box sx={{ flex: 1, overflowY: 'auto' }}></Box>
    </>
  );
}
