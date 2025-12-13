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
import { DiscountTemplate, DiscountType, formatDiscount } from '@shared/discount';
import { formatIpcError } from '@shared/ipc';
import { useNotification } from '@/providers/notification';
import DiscountTemplateForm from './discount-template-form';
import { DISCOUNT_TYPE_LABELS } from '@/common/discount-template';

type TemplatesTab = 'active' | 'archived';

type TemplateModalState = {
  open: boolean;
  mode: 'create' | 'edit';
  templateId?: number;
};

export default function DiscountTemplateList() {
  const { showSuccess, showError } = useNotification();

  const [activeTab, setActiveTab] = useState<TemplatesTab>('active');
  const [activeTemplates, setActiveTemplates] = useState<DiscountTemplate[]>(
    []
  );
  const [archivedTemplates, setArchivedTemplates] = useState<DiscountTemplate[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [templateModal, setTemplateModal] = useState<TemplateModalState>({
    open: false,
    mode: 'create',
  });

  const loadTemplates = async () => {
    if (!window.discountTemplateApi) {
      setError('Discount Template API is not available.');
      setLoading(false);
      return;
    }

    try {
      const [active, archived] = await Promise.all([
        window.discountTemplateApi.listDiscountTemplates(),
        window.discountTemplateApi.listArchivedDiscountTemplates(),
      ]);
      setActiveTemplates(active);
      setArchivedTemplates(archived);
    } catch (err) {
      setError(formatIpcError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTemplates();
  }, []);

  const handleOpenCreateModal = () => {
    setTemplateModal({ open: true, mode: 'create' });
  };

  const handleOpenEditModal = (templateId: number) => {
    setTemplateModal({ open: true, mode: 'edit', templateId });
  };

  const handleCloseModal = () => {
    setTemplateModal({ open: false, mode: 'create', templateId: undefined });
  };

  const handleSuccess = () => {
    void loadTemplates();
    handleCloseModal();
  };

  const handleArchive = async (id: number, name: string) => {
    if (!window.discountTemplateApi) return;

    try {
      const result = await window.discountTemplateApi.archiveDiscountTemplate(
        id,
        name
      );
      if (result) {
        void loadTemplates();
        showSuccess('Discount template archived successfully');
      }
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : 'Failed to archive discount template.'
      );
    }
  };

  const handleRestore = async (id: number, name: string) => {
    if (!window.discountTemplateApi) return;

    try {
      const result = await window.discountTemplateApi.restoreDiscountTemplate(
        id,
        name
      );
      if (result) {
        void loadTemplates();
        showSuccess('Discount template restored successfully');
      }
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : 'Failed to restore discount template.'
      );
    }
  };

  const handleSetDefault = async (id: number) => {
    if (!window.discountTemplateApi) return;

    try {
      await window.discountTemplateApi.setDefaultDiscountTemplate(id);
      void loadTemplates();
      showSuccess('Default template updated');
    } catch (err) {
      showError(
        err instanceof Error ? err.message : 'Failed to set default template.'
      );
    }
  };

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: TemplatesTab
  ) => {
    setActiveTab(newValue);
  };

  const currentTemplates =
    activeTab === 'active' ? activeTemplates : archivedTemplates;

  // Group templates by type
  const groupedTemplates = currentTemplates.reduce(
    (acc, template) => {
      const type = template.type as DiscountType;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(template);
      return acc;
    },
    {} as Record<DiscountType, DiscountTemplate[]>
  );

  const getEmptyMessage = () => {
    return activeTab === 'active'
      ? 'No discount templates found. Create your first template to get started.'
      : 'No archived templates. Templates you archive will appear here.';
  };

  const getDiscountTypeChipColor = (
    type: DiscountType
  ): 'primary' | 'secondary' => {
    return type === 'PERCENT' ? 'primary' : 'secondary';
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
              Discounts
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              Manage discount templates for quick application on invoices
            </Typography>
          </Box>
          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={handleOpenCreateModal}
          >
            Add Discount
          </Button>
        </Box>

        <Card sx={{ p: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label='templates tabs'
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
                  <TableCell align='right'>Value</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>
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
                  Object.entries(groupedTemplates).map(([type, templates]) => (
                    <>
                      {/* Type header row */}
                      <TableRow
                        key={`header-${type}`}
                        sx={{ bgcolor: 'action.hover' }}
                      >
                        <TableCell colSpan={6}>
                          <Typography
                            variant='subtitle2'
                            fontWeight='bold'
                            color='text.secondary'
                          >
                            {DISCOUNT_TYPE_LABELS[type as DiscountType]}
                          </Typography>
                        </TableCell>
                      </TableRow>

                      {/* Template rows */}
                      {templates.map((template) => (
                        <TableRow key={template.id} hover>
                          <TableCell>
                            <Typography>{template.name}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                DISCOUNT_TYPE_LABELS[template.type as DiscountType]
                              }
                              size='small'
                              color={getDiscountTypeChipColor(
                                template.type as DiscountType
                              )}
                              variant='outlined'
                            />
                          </TableCell>
                          <TableCell align='right'>
                            <Typography fontFamily='monospace' fontWeight='medium'>
                              {formatDiscount(
                                template.type as DiscountType,
                                template.value
                              )}
                            </Typography>
                          </TableCell>
                          <TableCell>
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
                              {template.description || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {template.isDefault && (
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
                                  {!template.isDefault && (
                                    <Tooltip title='Set as Default'>
                                      <IconButton
                                        size='small'
                                        onClick={() =>
                                          handleSetDefault(template.id)
                                        }
                                        color='default'
                                      >
                                        <StarBorder />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  {template.isDefault && (
                                    <Tooltip title='Default Template'>
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
                                        handleOpenEditModal(template.id)
                                      }
                                      color='primary'
                                    >
                                      <Edit />
                                    </IconButton>
                                  </Tooltip>
                                  {!template.isDefault && (
                                    <Tooltip title='Archive'>
                                      <IconButton
                                        size='small'
                                        onClick={() =>
                                          handleArchive(
                                            template.id,
                                            template.name
                                          )
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
                                      handleRestore(template.id, template.name)
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

      <DiscountTemplateForm
        open={templateModal.open}
        mode={templateModal.mode}
        templateId={templateModal.templateId}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </Box>
  );
}

