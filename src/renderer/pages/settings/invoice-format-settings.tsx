import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add,
  Edit,
  ContentCopy,
  Delete,
  Star,
  StarBorder,
} from '@mui/icons-material';
import { useNavigate } from 'react-router';
import { InvoiceFormat } from '@shared/invoice-format';
import { useNotification } from '@/providers/notification';
import { Routes } from '@/common/routes';

export default function InvoiceFormatSettings() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [formats, setFormats] = useState<InvoiceFormat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFormats = async () => {
    if (!window.invoiceFormatApi) {
      setError('API not available');
      setLoading(false);
      return;
    }

    try {
      // Initialize defaults first
      await window.invoiceFormatApi.initializeDefaults();
      const data = await window.invoiceFormatApi.listInvoiceFormats();
      setFormats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load formats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFormats();
  }, []);

  const handleSetDefault = async (id: number) => {
    if (!window.invoiceFormatApi) return;

    try {
      await window.invoiceFormatApi.setDefaultInvoiceFormat(id);
      await loadFormats();
      showSuccess('Default format updated');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to set default');
    }
  };

  const handleDuplicate = async (id: number) => {
    if (!window.invoiceFormatApi) return;

    try {
      const duplicated =
        await window.invoiceFormatApi.duplicateInvoiceFormat(id);
      await loadFormats();
      showSuccess(`Format duplicated as "${duplicated.name}"`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to duplicate');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.invoiceFormatApi) return;

    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await window.invoiceFormatApi.deleteInvoiceFormat(id);
      await loadFormats();
      showSuccess('Format deleted');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity='error'>{error}</Alert>;
  }

  return (
    <Box>
      <Stack spacing={3}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography variant='h5'>Invoice Formats</Typography>
            <Typography variant='body2' color='text.secondary'>
              Manage invoice templates and their appearance
            </Typography>
          </Box>
          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={() => navigate(Routes.InvoiceFormatNew)}
          >
            Create Format
          </Button>
        </Box>

        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Paper Size</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align='center'>
                      <Typography color='text.secondary' sx={{ py: 3 }}>
                        No formats found. Create your first invoice format.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  formats.map((format) => (
                    <TableRow key={format.id}>
                      <TableCell>
                        <Stack direction='row' alignItems='center' spacing={1}>
                          <Typography
                            fontWeight={format.isDefault ? 'bold' : 'normal'}
                          >
                            {format.name}
                          </Typography>
                          {format.isDefault && (
                            <Chip
                              label='Default'
                              size='small'
                              color='primary'
                            />
                          )}
                          {format.isSystemTemplate && (
                            <Chip
                              label='System'
                              size='small'
                              variant='outlined'
                            />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          sx={{
                            maxWidth: 300,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {format.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {format.paperSize} ({format.orientation})
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={format.isActive ? 'Active' : 'Inactive'}
                          size='small'
                          color={format.isActive ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align='right'>
                        <Stack
                          direction='row'
                          spacing={0.5}
                          justifyContent='flex-end'
                        >
                          <Tooltip
                            title={
                              format.isDefault
                                ? 'Default format'
                                : 'Set as default'
                            }
                          >
                            <span>
                              <IconButton
                                size='small'
                                onClick={() => handleSetDefault(format.id)}
                                disabled={format.isDefault}
                                color={format.isDefault ? 'primary' : 'default'}
                              >
                                {format.isDefault ? <Star /> : <StarBorder />}
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title='Duplicate'>
                            <IconButton
                              size='small'
                              onClick={() => handleDuplicate(format.id)}
                            >
                              <ContentCopy fontSize='small' />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title='Edit'>
                            <IconButton
                              size='small'
                              onClick={() =>
                                navigate(`/formats/${format.id}/edit`)
                              }
                            >
                              <Edit fontSize='small' />
                            </IconButton>
                          </Tooltip>
                          {!format.isSystemTemplate && (
                            <Tooltip title='Delete'>
                              <span>
                                <IconButton
                                  size='small'
                                  color='error'
                                  onClick={() =>
                                    handleDelete(format.id, format.name)
                                  }
                                  disabled={format.isDefault}
                                >
                                  <Delete fontSize='small' />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Stack>
    </Box>
  );
}
