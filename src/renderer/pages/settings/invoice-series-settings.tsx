import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add,
  Archive,
  Edit,
  Restore,
  Star,
  StarBorder,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import {
  InvoiceSeries,
  previewNextInvoiceNumber,
} from '@shared/invoice-series';
import { formatIpcError } from '@shared/ipc';
import { useNotification } from '@/providers/notification';
import InvoiceSeriesForm from './invoice-series-form';

type SeriesTab = 'active' | 'archived';

type SeriesModalState = {
  open: boolean;
  mode: 'create' | 'edit';
  seriesId?: number;
};

export default function InvoiceSeriesSettings() {
  const { showSuccess, showError } = useNotification();

  const [activeTab, setActiveTab] = useState<SeriesTab>('active');
  const [activeSeries, setActiveSeries] = useState<InvoiceSeries[]>([]);
  const [archivedSeries, setArchivedSeries] = useState<InvoiceSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [seriesModal, setSeriesModal] = useState<SeriesModalState>({
    open: false,
    mode: 'create',
  });

  const loadSeries = async () => {
    if (!window.invoiceSeriesApi) {
      setError('Invoice Series API is not available.');
      setLoading(false);
      return;
    }

    try {
      const [active, archived] = await Promise.all([
        window.invoiceSeriesApi.listInvoiceSeries(),
        window.invoiceSeriesApi.listArchivedInvoiceSeries(),
      ]);
      setActiveSeries(active);
      setArchivedSeries(archived);
    } catch (error) {
      setError(formatIpcError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSeries();
  }, []);

  const handleOpenCreateModal = () => {
    setSeriesModal({ open: true, mode: 'create' });
  };

  const handleOpenEditModal = (seriesId: number) => {
    setSeriesModal({ open: true, mode: 'edit', seriesId });
  };

  const handleCloseModal = () => {
    setSeriesModal({ open: false, mode: 'create', seriesId: undefined });
  };

  const handleSuccess = () => {
    void loadSeries();
    handleCloseModal();
  };

  const handleArchive = async (id: number, name: string) => {
    if (!window.invoiceSeriesApi) return;

    try {
      const result = await window.invoiceSeriesApi.archiveInvoiceSeries(
        id,
        name
      );
      if (result) {
        void loadSeries();
        showSuccess('Invoice series archived successfully');
      }
    } catch (err) {
      showError(
        err instanceof Error ? err.message : 'Failed to archive invoice series.'
      );
    }
  };

  const handleRestore = async (id: number, name: string) => {
    if (!window.invoiceSeriesApi) return;

    try {
      const result = await window.invoiceSeriesApi.restoreInvoiceSeries(
        id,
        name
      );
      if (result) {
        void loadSeries();
        showSuccess('Invoice series restored successfully');
      }
    } catch (err) {
      showError(
        err instanceof Error ? err.message : 'Failed to restore invoice series.'
      );
    }
  };

  const handleSetDefault = async (id: number) => {
    if (!window.invoiceSeriesApi) return;

    try {
      await window.invoiceSeriesApi.setDefaultSeries(id);
      void loadSeries();
      showSuccess('Default series updated');
    } catch (err) {
      showError(
        err instanceof Error ? err.message : 'Failed to set default series.'
      );
    }
  };

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: SeriesTab
  ) => {
    setActiveTab(newValue);
  };

  const currentSeries =
    activeTab === 'active' ? activeSeries : archivedSeries;

  const getEmptyMessage = () => {
    return activeTab === 'active'
      ? 'No invoice series found. Create your first series to get started.'
      : 'No archived series. Series you archive will appear here.';
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 300,
        }}
      >
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
            <Typography variant='h6'>Invoice Series</Typography>
            <Typography variant='body2' color='text.secondary'>
              Manage invoice numbering series for your invoices
            </Typography>
          </Box>
          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={handleOpenCreateModal}
          >
            Add Series
          </Button>
        </Box>

        <Card sx={{ p: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label='series tabs'
            >
              <Tab label='Active' value='active' sx={{ minWidth: 100 }} />
              <Tab label='Archived' value='archived' sx={{ minWidth: 100 }} />
            </Tabs>
          </Box>

          <TableContainer
            component={Paper}
            variant='outlined'
            sx={{ m: 2, width: 'auto' }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Prefix</TableCell>
                  <TableCell>Suffix</TableCell>
                  <TableCell align='right'>Start Number</TableCell>
                  <TableCell align='right'>Next Number</TableCell>
                  <TableCell>Preview</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentSeries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align='center'>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ py: 3 }}
                      >
                        {getEmptyMessage()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentSeries.map((series) => (
                    <TableRow key={series.id} hover>
                      <TableCell>
                        <Stack direction='row' spacing={1} alignItems='center'>
                          <Typography>{series.name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <code>{series.prefix || '-'}</code>
                      </TableCell>
                      <TableCell>
                        <code>{series.suffix || '-'}</code>
                      </TableCell>
                      <TableCell align='right'>{series.startWith}</TableCell>
                      <TableCell align='right'>{series.nextNumber}</TableCell>
                      <TableCell>
                        <Chip
                          label={previewNextInvoiceNumber(series)}
                          size='small'
                          variant='outlined'
                        />
                      </TableCell>
                      <TableCell>
                        {series.isDefault && (
                          <Chip label='Default' color='primary' size='small' />
                        )}
                      </TableCell>
                      <TableCell align='right'>
                        <Stack
                          direction='row'
                          spacing={0.5}
                          justifyContent='flex-end'
                        >
                          {activeTab === 'active' ? (
                            <>
                              {!series.isDefault && (
                                <Tooltip title='Set as Default'>
                                  <IconButton
                                    size='small'
                                    onClick={() => handleSetDefault(series.id)}
                                    color='default'
                                  >
                                    <StarBorder />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {series.isDefault && (
                                <Tooltip title='Default Series'>
                                  <IconButton
                                    size='small'
                                    color='warning'
                                    disabled
                                  >
                                    <Star />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title='Edit'>
                                <IconButton
                                  size='small'
                                  onClick={() => handleOpenEditModal(series.id)}
                                  color='primary'
                                >
                                  <Edit />
                                </IconButton>
                              </Tooltip>
                              {!series.isDefault && (
                                <Tooltip title='Archive'>
                                  <IconButton
                                    size='small'
                                    onClick={() =>
                                      handleArchive(series.id, series.name)
                                    }
                                    color='warning'
                                  >
                                    <Archive />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </>
                          ) : (
                            <Tooltip title='Restore'>
                              <IconButton
                                size='small'
                                onClick={() =>
                                  handleRestore(series.id, series.name)
                                }
                                color='success'
                              >
                                <Restore />
                              </IconButton>
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

      <InvoiceSeriesForm
        open={seriesModal.open}
        mode={seriesModal.mode}
        seriesId={seriesModal.seriesId}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </Box>
  );
}

