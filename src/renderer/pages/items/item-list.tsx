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

type ItemModalState = {
  open: boolean;
  mode: 'create' | 'edit';
  itemId?: number;
};

export default function ItemList() {
  const { showSuccess, showError } = useNotification();

  const [activeTab, setActiveTab] = useState<ItemsTab>('active');
  const [activeItems, setActiveItems] = useState<ItemWithTaxTemplates[]>([]);
  const [archivedItems, setArchivedItems] = useState<ItemWithTaxTemplates[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [itemModal, setItemModal] = useState<ItemModalState>({
    open: false,
    mode: 'create',
  });

  const loadItems = useCallback(async (search?: string) => {
    if (!window.itemApi) {
      setError('Item API is not available.');
      setLoading(false);
      return;
    }

    try {
      const [activeResult, archivedResult] = await Promise.all([
        window.itemApi.listItems({ search }),
        window.itemApi.listArchivedItems({ search }),
      ]);
      setActiveItems(activeResult.items);
      setArchivedItems(archivedResult.items);
    } catch (err) {
      setError(formatIpcError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      void loadItems(searchQuery || undefined);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, loadItems]);

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
    void loadItems(searchQuery || undefined);
    handleCloseModal();
  };

  const handleArchive = async (id: number, name: string) => {
    if (!window.itemApi) return;

    try {
      const result = await window.itemApi.archiveItem(id, name);
      if (result) {
        void loadItems(searchQuery || undefined);
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
        void loadItems(searchQuery || undefined);
        showSuccess('Item restored successfully');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to restore item.');
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: ItemsTab) => {
    setActiveTab(newValue);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const currentItems = activeTab === 'active' ? activeItems : archivedItems;

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
                label={`Active (${activeItems.length})`}
                value='active'
                sx={{ minWidth: 100 }}
              />
              <Tab
                label={`Archived (${archivedItems.length})`}
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
                          <Typography fontWeight='medium'>{item.name}</Typography>
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
                        <Typography fontFamily='monospace' color='text.secondary'>
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
                            label={`${item.taxTemplate.name} (${item.taxTemplate.rate}%)`}
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
                                onClick={() => handleRestore(item.id, item.name)}
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

