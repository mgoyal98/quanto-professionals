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
  AccountBalance,
  CreditCard,
  Payments,
  QrCode,
  Receipt,
  Language,
  MoreHoriz,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import {
  PaymentMethod,
  PaymentMethodType,
  PAYMENT_METHOD_TYPE_LABELS,
  formatAccountNumber,
} from '@shared/payment-method';
import { formatIpcError } from '@shared/ipc';
import { useNotification } from '@/providers/notification';
import PaymentMethodForm from './payment-method-form';

type MethodsTab = 'active' | 'archived';

type MethodModalState = {
  open: boolean;
  mode: 'create' | 'edit';
  methodId?: number;
};

// Icon map for payment types
const TYPE_ICONS: Record<PaymentMethodType, React.ReactNode> = {
  CASH: <Payments />,
  BANK_TRANSFER: <AccountBalance />,
  UPI: <QrCode />,
  CHEQUE: <Receipt />,
  CARD: <CreditCard />,
  ONLINE: <Language />,
  OTHER: <MoreHoriz />,
};

export default function PaymentMethodSettings() {
  const { showSuccess, showError } = useNotification();

  const [activeTab, setActiveTab] = useState<MethodsTab>('active');
  const [activeMethods, setActiveMethods] = useState<PaymentMethod[]>([]);
  const [archivedMethods, setArchivedMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [methodModal, setMethodModal] = useState<MethodModalState>({
    open: false,
    mode: 'create',
  });

  const loadMethods = async () => {
    if (!window.paymentMethodApi) {
      setError('Payment Method API is not available.');
      setLoading(false);
      return;
    }

    try {
      const [active, archived] = await Promise.all([
        window.paymentMethodApi.listPaymentMethods(),
        window.paymentMethodApi.listArchivedPaymentMethods(),
      ]);
      setActiveMethods(active);
      setArchivedMethods(archived);
    } catch (err) {
      setError(formatIpcError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMethods();
  }, []);

  const handleOpenCreateModal = () => {
    setMethodModal({ open: true, mode: 'create' });
  };

  const handleOpenEditModal = (methodId: number) => {
    setMethodModal({ open: true, mode: 'edit', methodId });
  };

  const handleCloseModal = () => {
    setMethodModal({ open: false, mode: 'create', methodId: undefined });
  };

  const handleSuccess = () => {
    void loadMethods();
    handleCloseModal();
  };

  const handleArchive = async (id: number, name: string) => {
    if (!window.paymentMethodApi) return;

    try {
      const result = await window.paymentMethodApi.archivePaymentMethod(
        id,
        name
      );
      if (result) {
        void loadMethods();
        showSuccess('Payment method archived successfully');
      }
    } catch (err) {
      showError(
        err instanceof Error ? err.message : 'Failed to archive payment method.'
      );
    }
  };

  const handleRestore = async (id: number, name: string) => {
    if (!window.paymentMethodApi) return;

    try {
      const result = await window.paymentMethodApi.restorePaymentMethod(
        id,
        name
      );
      if (result) {
        void loadMethods();
        showSuccess('Payment method restored successfully');
      }
    } catch (err) {
      showError(
        err instanceof Error ? err.message : 'Failed to restore payment method.'
      );
    }
  };

  const handleSetDefault = async (id: number) => {
    if (!window.paymentMethodApi) return;

    try {
      await window.paymentMethodApi.setDefaultPaymentMethod(id);
      void loadMethods();
      showSuccess('Default payment method updated');
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : 'Failed to set default payment method.'
      );
    }
  };

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: MethodsTab
  ) => {
    setActiveTab(newValue);
  };

  const currentMethods =
    activeTab === 'active' ? activeMethods : archivedMethods;

  // Group methods by type
  const groupedMethods = currentMethods.reduce(
    (acc, method) => {
      const type = method.type as PaymentMethodType;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(method);
      return acc;
    },
    {} as Record<PaymentMethodType, PaymentMethod[]>
  );

  const getEmptyMessage = () => {
    return activeTab === 'active'
      ? 'No payment methods found. Create your first payment method to get started.'
      : 'No archived payment methods. Methods you archive will appear here.';
  };

  const getMethodDetails = (method: PaymentMethod): string => {
    if (method.type === 'BANK_TRANSFER' || method.type === 'CHEQUE') {
      const parts: string[] = [];
      if (method.bankName) parts.push(method.bankName);
      if (method.accountNumber)
        parts.push(formatAccountNumber(method.accountNumber));
      return parts.join(' • ') || '-';
    }
    if (method.type === 'UPI' && method.upiId) {
      return method.upiId;
    }
    return method.description || '-';
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
            <Typography variant='h6'>Payment Methods</Typography>
            <Typography variant='body2' color='text.secondary'>
              Manage payment methods for receiving invoice payments
            </Typography>
          </Box>
          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={handleOpenCreateModal}
          >
            Add Payment Method
          </Button>
        </Box>

        <Card sx={{ p: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label='payment methods tabs'
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
                  <TableCell>Type</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentMethods.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align='center'>
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
                  Object.entries(groupedMethods).map(([type, methods]) => (
                    <>
                      {/* Type header row */}
                      <TableRow
                        key={`header-${type}`}
                        sx={{ bgcolor: 'action.hover' }}
                      >
                        <TableCell colSpan={5}>
                          <Stack direction='row' spacing={1} alignItems='center'>
                            {TYPE_ICONS[type as PaymentMethodType]}
                            <Typography
                              variant='subtitle2'
                              fontWeight='bold'
                              color='text.secondary'
                            >
                              {
                                PAYMENT_METHOD_TYPE_LABELS[
                                  type as PaymentMethodType
                                ]
                              }
                            </Typography>
                          </Stack>
                        </TableCell>
                      </TableRow>

                      {/* Method rows */}
                      {methods.map((method) => (
                        <TableRow key={method.id} hover>
                          <TableCell>
                            <Typography>{method.name}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                PAYMENT_METHOD_TYPE_LABELS[
                                  method.type as PaymentMethodType
                                ]
                              }
                              size='small'
                              variant='outlined'
                            />
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant='body2'
                              color='text.secondary'
                              sx={{
                                maxWidth: 300,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {getMethodDetails(method)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {method.isDefault && (
                              <Chip
                                label='Default'
                                color='primary'
                                size='small'
                              />
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
                                  {!method.isDefault && (
                                    <Tooltip title='Set as Default'>
                                      <IconButton
                                        size='small'
                                        onClick={() =>
                                          handleSetDefault(method.id)
                                        }
                                        color='default'
                                      >
                                        <StarBorder />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  {method.isDefault && (
                                    <Tooltip title='Default Payment Method'>
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
                                      onClick={() =>
                                        handleOpenEditModal(method.id)
                                      }
                                      color='primary'
                                    >
                                      <Edit />
                                    </IconButton>
                                  </Tooltip>
                                  {!method.isDefault && (
                                    <Tooltip title='Archive'>
                                      <IconButton
                                        size='small'
                                        onClick={() =>
                                          handleArchive(method.id, method.name)
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
                                      handleRestore(method.id, method.name)
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
                      ))}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Stack>

      <PaymentMethodForm
        open={methodModal.open}
        mode={methodModal.mode}
        methodId={methodModal.methodId}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </Box>
  );
}

