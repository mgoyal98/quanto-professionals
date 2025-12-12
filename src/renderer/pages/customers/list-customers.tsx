import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Add, Delete, Edit, Search } from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import NewCustomer from './new-customer';
import { Customer } from '@shared/customer';
import { formatIpcError } from '@shared/ipc';
import { usePagination } from '@/hooks/usePagination';

export default function CustomerList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openNewCustomerModal, setOpenNewCustomerModal] = useState(false);

  const [searchParams] = useSearchParams();
  const isAddNewCustomer = searchParams.get('newCustomer') === 'true';

  const loadCustomers = async () => {
    if (!window.customerApi) {
      setError('Customer API is not available.');
      setLoading(false);
      return;
    }

    try {
      const data = await window.customerApi.listCustomers();
      setCustomers(data);
    } catch (error) {
      setError(formatIpcError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCustomers();
  }, []);

  useEffect(() => {
    if (isAddNewCustomer) {
      setOpenNewCustomerModal(true);
      searchParams.delete('newCustomer');
    }
  }, [isAddNewCustomer, searchParams]);

  const handleNewCustomerSuccess = () => {
    void loadCustomers();
    setOpenNewCustomerModal(false);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.customerApi) return;

    try {
      const result = await window.customerApi.deleteCustomer(id, name);
      if (result) {
        void loadCustomers();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete customer.';
      // showError(errorMessage);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      return `${customer.name} ${customer.gstin} ${customer.pan} ${customer.city} ${customer.state} ${customer.email} ${customer.phone}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    });
  }, [customers, searchQuery]);

  const { currentItems, currentPage, totalPages, totalItems, goToPage } =
    usePagination({
      items: filteredCustomers,
      itemsPerPage: 10,
    });

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='error'>{error}</Alert>
      </Box>
    );
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
          <Typography variant='h4'>Customers</Typography>
          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={() => setOpenNewCustomerModal(true)}
          >
            Create Customer
          </Button>
        </Box>

        <Card sx={{ p: 2 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              placeholder='Search customer by name, GSTIN, or email...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <Search sx={{ mr: 1, color: 'text.secondary' }} />
                  ),
                },
              }}
            />

            <TableContainer component={Paper} variant='outlined'>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Sl. No.</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>GSTIN</TableCell>
                    <TableCell>PAN</TableCell>
                    <TableCell>City</TableCell>
                    <TableCell>State</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Mobile</TableCell>
                    <TableCell align='right'>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align='center'>
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          sx={{ py: 3 }}
                        >
                          {searchQuery
                            ? 'No customers found matching your search.'
                            : 'No customers found. Add your first customer to get started.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentItems.map((customer, index) => (
                      <TableRow key={customer.id} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>{customer.gstin || '-'}</TableCell>
                        <TableCell>{customer.pan || '-'}</TableCell>
                        <TableCell>{customer.city || '-'}</TableCell>
                        <TableCell>{customer.state || '-'}</TableCell>
                        <TableCell>{customer.email || '-'}</TableCell>
                        <TableCell>{customer.phone || '-'}</TableCell>
                        <TableCell align='right'>
                          <IconButton
                            size='small'
                            onClick={() => navigate(`/`)}
                            color='primary'
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size='small'
                            onClick={() =>
                              handleDelete(customer.id!, customer.name!)
                            }
                            color='error'
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {totalPages > 1 && (
              <TablePagination
                component='div'
                count={totalItems}
                page={currentPage}
                onPageChange={(_event, page) => goToPage(page)}
                rowsPerPage={10}
                onRowsPerPageChange={() => {}}
              />
            )}
          </Stack>
        </Card>
      </Stack>

      <NewCustomer
        open={openNewCustomerModal}
        onClose={() => setOpenNewCustomerModal(false)}
        onSuccess={handleNewCustomerSuccess}
      />
    </Box>
  );
}
