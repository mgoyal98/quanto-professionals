import { Routes } from '@/common/routes';
import { useCompany } from '@/providers/company';
import { Add, FileUploadOutlined, History } from '@mui/icons-material';
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
import { RecentCompany } from '@shared/company';
import { timeAgo } from '@shared/utils/date';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

export default function SelectCompany() {
  const [recentCompanies, setRecentCompanies] = useState<RecentCompany[]>([]);

  const navigate = useNavigate();

  const { getCompany } = useCompany();

  const handleNewCompany = () => {
    navigate(Routes.NewCompany);
  };

  const loadRecentCompanies = async () => {
    if (!window.companyApi) {
      return;
    }

    try {
      const recent = await window.companyApi.getRecentCompanies();
      setRecentCompanies(recent);
    } catch (err) {
      console.error('Failed to load recent databases:', err);
    }
  };

  useEffect(() => {
    void loadRecentCompanies();
  }, []);

  const openCompany = async (filePath: string) => {
    if (!window.companyApi) {
      return;
    }

    try {
      await window.companyApi.openCompany(filePath);
      await getCompany();
      loadRecentCompanies();
      navigate(Routes.Dashboard);
    } catch (err) {
      console.error('Failed to open company:', err);
    }
  };

  const handleExistingCompany = async () => {
    if (!window.companyApi) {
      return;
    }

    try {
      const filePath = await window.companyApi.chooseCompanyFile();
      if (!filePath) {
        return;
      }
      await openCompany(filePath);
    } catch (err) {
      console.error('Failed to choose company file:', err);
    }
  };

  return (
    <>
      <Box sx={{ p: 3 }}>
        <Typography variant='h5'>Welcome to Quanto</Typography>
        <Typography variant='body2' color='text.secondary'>
          Create a new company or load an existing company to get started.
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
            secondary='Create a new company'
            slotProps={{
              primary: { variant: 'h6' },
              secondary: { variant: 'caption' },
            }}
          />
        </ListItemButton>
        <ListItemButton onClick={handleExistingCompany}>
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: 'secondary.light' }}>
              <FileUploadOutlined color='secondary' />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary='Existing Company'
            secondary='Load an existing company'
            slotProps={{
              primary: { variant: 'h6' },
              secondary: { variant: 'caption' },
            }}
          />
        </ListItemButton>
      </List>
      <Divider />
      <Typography variant='h6' sx={{ px: 2, py: 1.5 }}>
        Recent Companies
      </Typography>
      {recentCompanies.length > 0 ? (
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {recentCompanies.map((company) => (
            <ListItemButton
              key={company.filePath}
              onClick={() => openCompany(company.filePath)}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'secondary.light' }}>
                  <History color='secondary' />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={company.name}
                secondary={`Opened ${timeAgo.format(new Date(company.lastOpened))}`}
                slotProps={{
                  primary: { variant: 'subtitle1', fontWeight: 'medium' },
                  secondary: { variant: 'caption' },
                }}
              />
            </ListItemButton>
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            p: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <Typography variant='body2' color='text.secondary'>
            Your recent companies will appear here once you start working with
            them.
          </Typography>
        </Box>
      )}
    </>
  );
}
