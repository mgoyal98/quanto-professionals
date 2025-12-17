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
} from '@mui/icons-material';
import { useEffect, useState, useCallback } from 'react';
import { ItemWithTaxTemplates, formatRate, getUnitLabel } from '@shared/item';
import { formatIpcError } from '@shared/ipc';
import { useNotification } from '@/providers/notification';
import ItemForm from './item-form';

type ItemsTab = 'active' | 'archived';
const DEFAULT_PAGE_SIZE = 10;

type ItemModalState = {
  open: boolean;
  mode: 'create' | 'edit';
  itemId?: number;
};

export default function ItemList() {
  const { showSuccess, showError } = useNotification();

  const [activeTab, setActiveTab] = useState<ItemsTab>('active');
  const [activeItems, setActiveItems] = useState<ItemWithTaxTemplates[]>([]);
  const [archivedItems, setArchivedItems] = useState<ItemWithTaxTemplates[]>(
    []
  );
  const [activeTotalCount, setActiveTotalCount] = useState(0);
  const [archivedTotalCount, setArchivedTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [activePage, setActivePage] = useState(0);
  const [archivedPage, setArchivedPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [itemModal, setItemModal] = useState<ItemModalState>({
    open: false,
    mode: 'create',
  });

  const loadItems = useCallback(
    async (options?: { search?: string; activePageNum?: number; archivedPageNum?: number; pageSizeNum?: number }) => {
      if (!window.itemApi) {
        setError('Item API is not available.');
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
          window.itemApi.listItems({
            search,
            limit: currentPageSize,
            offset: currentActivePageNum * currentPageSize,
          }),
          window.itemApi.listArchivedItems({
            search,
            limit: currentPageSize,
            offset: currentArchivedPageNum * currentPageSize,
          }),
        ]);
        setActiveItems(activeResult.items);
        setArchivedItems(archivedResult.items);
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
    void loadItems();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search - reset to first page when search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setActivePage(0);
      setArchivedPage(0);
      void loadItems({ search: searchQuery || undefined, activePageNum: 0, archivedPageNum: 0 });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenCreateModal = () => {
    setItemModal({ open: true, mode: 'create' });
  };

  const handleOpenEditModal = (itemId: number) => {
    setItemModal({ open: true, mode: 'edit', itemId });
  };

  const handleCloseModal = () => {
    setItemModal({ open: false, mode: 'create', itemId: undefined });
  };

  const handleSuccess = () => {
    void loadItems({ search: searchQuery || undefined });
    handleCloseModal();
  };

  const handleArchive = async (id: number, name: string) => {
    if (!window.itemApi) return;

    try {
      const result = await window.itemApi.archiveItem(id, name);
      if (result) {
        void loadItems({ search: searchQuery || undefined });
        showSuccess('Item archived successfully');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to archive item.');
    }
  };

  const handleRestore = async (id: number, name: string) => {
    if (!window.itemApi) return;

    try {
      const result = await window.itemApi.restoreItem(id, name);
      if (result) {
        void loadItems({ search: searchQuery || undefined });
        showSuccess('Item restored successfully');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to restore item.');
    }
  };

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: ItemsTab
  ) => {
    setActiveTab(newValue);
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    if (activeTab === 'active') {
      setActivePage(newPage);
      void loadItems({ search: searchQuery || undefined, activePageNum: newPage });
    } else {
      setArchivedPage(newPage);
      void loadItems({ search: searchQuery || undefined, archivedPageNum: newPage });
    }
  };

  const handlePageSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPageSize = parseInt(event.target.value, 10);
    setPageSize(newPageSize);
    setActivePage(0);
    setArchivedPage(0);
    void loadItems({ search: searchQuery || undefined, activePageNum: 0, archivedPageNum: 0, pageSizeNum: newPageSize });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const currentItems = activeTab === 'active' ? activeItems : archivedItems;
  const currentTotalCount = activeTab === 'active' ? activeTotalCount : archivedTotalCount;
  const currentPage = activeTab === 'active' ? activePage : archivedPage;

  const getEmptyMessage = () => {
    if (searchQuery) {
      return `No items found matching "${searchQuery}".`;
    }
    return activeTab === 'active'
      ? 'No items found. Create your first item to get started.'
      : 'No archived items. Items you archive will appear here.';
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
              Items
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              Manage products and services for your invoices
            </Typography>
          </Box>
          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={handleOpenCreateModal}
          >
            Add Item
          </Button>
        </Box>

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
              aria-label='items tabs'
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
              placeholder='Search items...'
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
                  <TableCell>Name</TableCell>
                  <TableCell>HSN/SAC</TableCell>
                  <TableCell align='right'>Rate</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Tax</TableCell>
                  <TableCell>Cess</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentItems.length === 0 ? (
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
                  currentItems.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Box>
                          <Typography fontWeight='medium'>
                            {item.name}
                          </Typography>
                          {item.description && (
                            <Typography
                              variant='body2'
                              color='text.secondary'
                              sx={{
                                maxWidth: 250,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {item.description}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          fontFamily='monospace'
                          color='text.secondary'
                        >
                          {item.hsnCode || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography fontFamily='monospace'>
                          {formatRate(item.rate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getUnitLabel(item.unit)}
                          size='small'
                          variant='outlined'
                        />
                      </TableCell>
                      <TableCell>
                        {item.taxTemplate ? (
                          <Chip
                            label={`${item.taxTemplate.name} (${
                              item.taxTemplate.rateType === 'AMOUNT'
                                ? `₹${item.taxTemplate.rate}`
                                : `${item.taxTemplate.rate}%`
                            })`}
                            size='small'
                            color='primary'
                            variant='outlined'
                          />
                        ) : (
                          <Typography variant='body2' color='text.secondary'>
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.cessTemplate ? (
                          <Chip
                            label={`${item.cessTemplate.name} (${item.cessTemplate.rate}%)`}
                            size='small'
                            color='secondary'
                            variant='outlined'
                          />
                        ) : (
                          <Typography variant='body2' color='text.secondary'>
                            -
                          </Typography>
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
                              <Tooltip title='Edit'>
                                <IconButton
                                  size='small'
                                  onClick={() => handleOpenEditModal(item.id)}
                                  color='primary'
                                >
                                  <Edit />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title='Archive'>
                                <IconButton
                                  size='small'
                                  onClick={() =>
                                    handleArchive(item.id, item.name)
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
                                  handleRestore(item.id, item.name)
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

      <ItemForm
        open={itemModal.open}
        mode={itemModal.mode}
        itemId={itemModal.itemId}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </Box>
  );
}
