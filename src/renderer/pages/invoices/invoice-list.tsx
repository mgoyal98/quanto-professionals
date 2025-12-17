import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add,
  Archive,
  Edit,
  Restore,
  Search,
  Clear,
  Visibility,
  Cancel,
} from '@mui/icons-material';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  InvoiceWithDetails,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
  formatCurrency,
  formatInvoiceDate,
  canEditInvoice,
  InvoiceStatus,
} from '@shared/invoice';
import { formatIpcError } from '@shared/ipc';
import { useNotification } from '@/providers/notification';
import { Routes } from '@/common/routes';
import CancelInvoiceDialog from '@/components/cancel-invoice-dialog';

type InvoicesTab = 'active' | 'archived';
const DEFAULT_PAGE_SIZE = 10;

export default function InvoiceList() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [activeTab, setActiveTab] = useState<InvoicesTab>('active');
  const [activeInvoices, setActiveInvoices] = useState<InvoiceWithDetails[]>(
    []
  );
  const [archivedInvoices, setArchivedInvoices] = useState<
    InvoiceWithDetails[]
  >([]);
  const [activeTotalCount, setActiveTotalCount] = useState(0);
  const [archivedTotalCount, setArchivedTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [invoiceToCancel, setInvoiceToCancel] =
    useState<InvoiceWithDetails | null>(null);

  // Pagination state
  const [activePage, setActivePage] = useState(0);
  const [archivedPage, setArchivedPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const loadInvoices = useCallback(
    async (options?: {
      search?: string;
      activePageNum?: number;
      archivedPageNum?: number;
      pageSizeNum?: number;
    }) => {
      if (!window.invoiceApi) {
        setError('Invoice API is not available.');
        setLoading(false);
        return;
      }

      // Use searchQuery from state if not explicitly passed
      const search = options?.search !== undefined ? options.search : (searchQuery || undefined);
      const currentActivePageNum = options?.activePageNum ?? activePage;
      const currentArchivedPageNum = options?.archivedPageNum ?? archivedPage;
      const currentPageSize = options?.pageSizeNum ?? pageSize;

      try {
        const [activeResult, archivedResult] = await Promise.all([
          window.invoiceApi.listInvoices({
            search,
            isArchived: false,
            limit: currentPageSize,
            offset: currentActivePageNum * currentPageSize,
          }),
          window.invoiceApi.listInvoices({
            search,
            isArchived: true,
            limit: currentPageSize,
            offset: currentArchivedPageNum * currentPageSize,
          }),
        ]);
        setActiveInvoices(activeResult.invoices);
        setArchivedInvoices(archivedResult.invoices);
        setActiveTotalCount(activeResult.total);
        setArchivedTotalCount(archivedResult.total);
      } catch (err) {
        setError(formatIpcError(err));
      } finally {
        setLoading(false);
      }
    },
    [activePage, archivedPage, pageSize, searchQuery]
  );

  // Initial load only
  useEffect(() => {
    void loadInvoices();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search - reset to first page when search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setActivePage(0);
      setArchivedPage(0);
      void loadInvoices({
        search: searchQuery || undefined,
        activePageNum: 0,
        archivedPageNum: 0,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleArchive = async (id: number, invoiceNumber: string) => {
    if (!window.invoiceApi) return;

    try {
      const result = await window.invoiceApi.archiveInvoice(id, invoiceNumber);
      if (result) {
        void loadInvoices({ search: searchQuery || undefined });
        showSuccess('Invoice archived successfully');
      }
    } catch (err) {
      showError(
        err instanceof Error ? err.message : 'Failed to archive invoice.'
      );
    }
  };

  const handleRestore = async (id: number, invoiceNumber: string) => {
    if (!window.invoiceApi) return;

    try {
      const result = await window.invoiceApi.restoreInvoice(id, invoiceNumber);
      if (result) {
        void loadInvoices({ search: searchQuery || undefined });
        showSuccess('Invoice restored successfully');
      }
    } catch (err) {
      showError(
        err instanceof Error ? err.message : 'Failed to restore invoice.'
      );
    }
  };

  const handleUpdateStatus = async (
    id: number,
    status: InvoiceStatus,
    cancelReason?: string
  ) => {
    if (!window.invoiceApi) return;

    try {
      await window.invoiceApi.updateInvoiceStatus({ id, status, cancelReason });
      void loadInvoices({ search: searchQuery || undefined });
      showSuccess(`Invoice ${status.toLowerCase()}`);
    } catch (err) {
      showError(
        err instanceof Error ? err.message : 'Failed to update invoice status.'
      );
    }
  };

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: InvoicesTab
  ) => {
    setActiveTab(newValue);
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    if (activeTab === 'active') {
      setActivePage(newPage);
      void loadInvoices({
        search: searchQuery || undefined,
        activePageNum: newPage,
      });
    } else {
      setArchivedPage(newPage);
      void loadInvoices({
        search: searchQuery || undefined,
        archivedPageNum: newPage,
      });
    }
  };

  const handlePageSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPageSize = parseInt(event.target.value, 10);
    setPageSize(newPageSize);
    setActivePage(0);
    setArchivedPage(0);
    void loadInvoices({
      search: searchQuery || undefined,
      activePageNum: 0,
      archivedPageNum: 0,
      pageSizeNum: newPageSize,
    });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleOpenCancelDialog = (invoice: InvoiceWithDetails) => {
    setInvoiceToCancel(invoice);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async (reason: string) => {
    if (!invoiceToCancel) return;

    await handleUpdateStatus(invoiceToCancel.id, 'CANCELLED', reason);
    setCancelDialogOpen(false);
    setInvoiceToCancel(null);
  };

  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false);
    setInvoiceToCancel(null);
  };

  const currentInvoices =
    activeTab === 'active' ? activeInvoices : archivedInvoices;
  const currentTotalCount =
    activeTab === 'active' ? activeTotalCount : archivedTotalCount;
  const currentPage = activeTab === 'active' ? activePage : archivedPage;

  const getEmptyMessage = () => {
    if (searchQuery) {
      return `No invoices found matching "${searchQuery}".`;
    }
    return activeTab === 'active'
      ? 'No invoices found. Create your first invoice to get started.'
      : 'No archived invoices. Invoices you archive will appear here.';
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
            <Typography variant='h4' gutterBottom>
              Invoices
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              Manage your invoices and track payments
            </Typography>
          </Box>
          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={() => navigate(Routes.InvoiceCreate)}
          >
            New Invoice
          </Button>
        </Box>

        <CancelInvoiceDialog
          open={cancelDialogOpen}
          invoiceNumber={invoiceToCancel?.invoiceNumber}
          onClose={handleCloseCancelDialog}
          onConfirm={handleConfirmCancel}
        />

        <Card sx={{ p: 0 }}>
          <Box
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 2,
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label='invoices tabs'
            >
              <Tab
                label={`Active (${activeTotalCount})`}
                value='active'
                sx={{ minWidth: 100 }}
              />
              <Tab
                label={`Archived (${archivedTotalCount})`}
                value='archived'
                sx={{ minWidth: 100 }}
              />
            </Tabs>

            <TextField
              size='small'
              placeholder='Search invoices...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 300 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Search fontSize='small' />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position='end'>
                      <IconButton size='small' onClick={handleClearSearch}>
                        <Clear fontSize='small' />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <TableContainer
            component={Paper}
            variant='outlined'
            sx={{ m: 2, width: 'auto' }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align='right'>Amount</TableCell>
                  <TableCell align='right'>Due</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align='center'>
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
                  currentInvoices.map((invoice) => (
                    <TableRow key={invoice.id} hover>
                      <TableCell>
                        <Typography fontWeight='medium' fontFamily='monospace'>
                          {invoice.invoiceNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography>{invoice.customer?.name || '-'}</Typography>
                        {invoice.customer?.gstin && (
                          <Typography variant='body2' color='text.secondary'>
                            {invoice.customer.gstin}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatInvoiceDate(invoice.invoiceDate)}
                      </TableCell>
                      <TableCell align='right'>
                        <Typography fontFamily='monospace'>
                          {formatCurrency(invoice.grandTotal)}
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography
                          fontFamily='monospace'
                          color={
                            invoice.dueAmount > 0
                              ? 'error.main'
                              : 'success.main'
                          }
                        >
                          {formatCurrency(invoice.dueAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            INVOICE_STATUS_LABELS[
                              invoice.status as InvoiceStatus
                            ]
                          }
                          color={
                            INVOICE_STATUS_COLORS[
                              invoice.status as InvoiceStatus
                            ]
                          }
                          size='small'
                        />
                      </TableCell>
                      <TableCell align='right'>
                        <Stack
                          direction='row'
                          spacing={0.5}
                          justifyContent='flex-end'
                        >
                          {activeTab === 'active' ? (
                            <>
                              <Tooltip title='View'>
                                <IconButton
                                  size='small'
                                  onClick={() =>
                                    navigate(`/invoices/${invoice.id}`)
                                  }
                                  color='primary'
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                              {canEditInvoice(invoice) && (
                                <Tooltip title='Edit'>
                                  <IconButton
                                    size='small'
                                    onClick={() =>
                                      navigate(`/invoices/${invoice.id}/edit`)
                                    }
                                    color='primary'
                                  >
                                    <Edit />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {invoice.status !== 'PAID' &&
                                invoice.status !== 'CANCELLED' && (
                                  <Tooltip title='Cancel'>
                                    <IconButton
                                      size='small'
                                      onClick={() =>
                                        handleOpenCancelDialog(invoice)
                                      }
                                      color='error'
                                    >
                                      <Cancel />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              <Tooltip title='Archive'>
                                <IconButton
                                  size='small'
                                  onClick={() =>
                                    handleArchive(
                                      invoice.id,
                                      invoice.invoiceNumber
                                    )
                                  }
                                  color='warning'
                                >
                                  <Archive />
                                </IconButton>
                              </Tooltip>
                            </>
                          ) : (
                            <Tooltip title='Restore'>
                              <IconButton
                                size='small'
                                onClick={() =>
                                  handleRestore(
                                    invoice.id,
                                    invoice.invoiceNumber
                                  )
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

          <TablePagination
            component='div'
            count={currentTotalCount}
            page={currentPage}
            onPageChange={handlePageChange}
            rowsPerPage={pageSize}
            onRowsPerPageChange={handlePageSizeChange}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{ borderTop: 1, borderColor: 'divider' }}
          />
        </Card>
      </Stack>
    </Box>
  );
}
