import { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowBack, Save, Refresh } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router';
import ejs from 'ejs';
import {
  PAPER_SIZES,
  ORIENTATIONS,
  TemplateData,
  formatCurrencyForTemplate,
  formatDateForTemplate,
  formatNumberForTemplate,
} from '@shared/invoice-format';
import { useNotification } from '@/providers/notification';
import { Routes } from '@/common/routes';
import { Company } from '@shared/company';
import { numberToWordsIndian } from '@shared/utils/number-to-words';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && <Box sx={{ height: '100%' }}>{children}</Box>}
    </div>
  );
}

export default function InvoiceFormatForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [htmlTemplate, setHtmlTemplate] = useState('');
  const [cssStyles, setCssStyles] = useState('');
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter' | 'Legal'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    'portrait'
  );
  const [marginTop, setMarginTop] = useState(10);
  const [marginRight, setMarginRight] = useState(10);
  const [marginBottom, setMarginBottom] = useState(10);
  const [marginLeft, setMarginLeft] = useState(10);

  // Company data for preview
  const [company, setCompany] = useState<Company | null>(null);

  // Preview
  const [previewHtml, setPreviewHtml] = useState('');

  // Load company data
  useEffect(() => {
    const loadCompany = async () => {
      try {
        const companyData = await window.companyApi?.getCompanyDetails();
        if (companyData) {
          setCompany(companyData);
        }
      } catch (err) {
        console.error('Failed to load company data:', err);
      }
    };
    void loadCompany();
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      loadFormat(Number(id));
    }
  }, [isEdit, id]);

  const loadFormat = async (formatId: number) => {
    if (!window.invoiceFormatApi) return;

    setLoading(true);
    try {
      const format = await window.invoiceFormatApi.getInvoiceFormat(formatId);
      if (format) {
        setName(format.name);
        setDescription(format.description ?? '');
        setHtmlTemplate(format.htmlTemplate);
        setCssStyles(format.cssStyles);
        setPaperSize(format.paperSize as 'A4' | 'Letter' | 'Legal');
        setOrientation(format.orientation as 'portrait' | 'landscape');
        setMarginTop(format.marginTop);
        setMarginRight(format.marginRight);
        setMarginBottom(format.marginBottom);
        setMarginLeft(format.marginLeft);
      } else {
        setError('Format not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load format');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!window.invoiceFormatApi) return;

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!htmlTemplate.trim()) {
      setError('HTML template is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isEdit && id) {
        await window.invoiceFormatApi.updateInvoiceFormat({
          id: Number(id),
          name,
          description: description || undefined,
          htmlTemplate,
          cssStyles,
          paperSize,
          orientation,
          marginTop,
          marginRight,
          marginBottom,
          marginLeft,
        });
        showSuccess('Format updated successfully');
      } else {
        await window.invoiceFormatApi.createInvoiceFormat({
          name,
          description: description || undefined,
          htmlTemplate,
          cssStyles,
          paperSize,
          orientation,
          marginTop,
          marginRight,
          marginBottom,
          marginLeft,
        });
        showSuccess('Format created successfully');
      }
      navigate(Routes.InvoiceFormats);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save format');
    } finally {
      setSaving(false);
    }
  };

  const updatePreview = useCallback(() => {
    const now = new Date();
    const grandTotal = 11800;

    // Build TemplateData - same structure as used in actual invoice rendering
    const templateData: TemplateData = {
      company: {
        name: company?.name ?? 'Sample Company Name',
        profession: company?.profession ?? 'Professional Services',
        pan: company?.pan ?? 'ABCDE1234F',
        gstin: company?.gstin ?? '27ABCDE1234F1Z5',
        addressLine1: company?.addressLine1 ?? '123 Business Street',
        addressLine2: company?.addressLine2 ?? 'Suite 100',
        city: company?.city ?? 'Mumbai',
        state: company?.state ?? 'Maharashtra',
        stateCode: company?.stateCode ?? '27',
        pinCode: company?.pinCode ?? '400001',
        phone: company?.phone ?? '9876543210',
        email: company?.email ?? 'contact@company.com',
      },
      customer: {
        name: 'ABC Enterprises Pvt. Ltd.',
        addressLine1: '456 Client Avenue',
        addressLine2: 'Floor 5',
        city: 'Delhi',
        state: 'Delhi',
        stateCode: '07',
        pinCode: '110001',
        phone: '9123456789',
        email: 'billing@abcent.com',
        gstin: '07AABCU1234A1Z5',
        pan: 'AABCU1234A',
      },
      invoice: {
        invoiceNumber: 'INV-2025-001',
        invoiceDate: formatDateForTemplate(now),
        invoiceDateRaw: now,
        dueDate: null,
        gstType: 'INTRA',
        status: 'UNPAID',
        notes: 'Thank you for your business!',
        reverseCharge: false,
        reverseChargeText: 'N',
        subTotal: 10000,
        subTotalFormatted: formatCurrencyForTemplate(10000),
        taxableTotal: 10000,
        taxableTotalFormatted: formatCurrencyForTemplate(10000),
        totalTax: 1800,
        totalTaxFormatted: formatCurrencyForTemplate(1800),
        grandTotal: grandTotal,
        grandTotalFormatted: formatCurrencyForTemplate(grandTotal),
        grandTotalInWords: numberToWordsIndian(grandTotal),
        paidAmount: 0,
        paidAmountFormatted: formatCurrencyForTemplate(0),
        dueAmount: grandTotal,
        dueAmountFormatted: formatCurrencyForTemplate(grandTotal),
        totalCgst: 900,
        totalSgst: 900,
        totalIgst: 0,
        totalCess: 0,
      },
      items: [
        {
          index: 1,
          name: 'Web Development Services',
          description: 'Frontend development using React',
          hsnCode: '998314',
          quantity: 1,
          unit: 'NOS',
          rate: 5000,
          rateFormatted: formatCurrencyForTemplate(5000),
          amount: 5000,
          amountFormatted: formatCurrencyForTemplate(5000),
          taxableAmount: 5000,
          taxableAmountFormatted: formatCurrencyForTemplate(5000),
          totalTax: 900,
          totalTaxFormatted: formatCurrencyForTemplate(900),
          total: 5900,
          totalFormatted: formatCurrencyForTemplate(5900),
          taxes: [
            {
              type: 'CGST',
              name: 'CGST @ 9%',
              rate: 9,
              amount: 450,
              amountFormatted: formatCurrencyForTemplate(450),
            },
            {
              type: 'SGST',
              name: 'SGST @ 9%',
              rate: 9,
              amount: 450,
              amountFormatted: formatCurrencyForTemplate(450),
            },
          ],
        },
        {
          index: 2,
          name: 'UI/UX Design',
          description: 'Mobile app design mockups',
          hsnCode: '998314',
          quantity: 1,
          unit: 'NOS',
          rate: 3000,
          rateFormatted: formatCurrencyForTemplate(3000),
          amount: 3000,
          amountFormatted: formatCurrencyForTemplate(3000),
          taxableAmount: 3000,
          taxableAmountFormatted: formatCurrencyForTemplate(3000),
          totalTax: 540,
          totalTaxFormatted: formatCurrencyForTemplate(540),
          total: 3540,
          totalFormatted: formatCurrencyForTemplate(3540),
          taxes: [
            {
              type: 'CGST',
              name: 'CGST @ 9%',
              rate: 9,
              amount: 270,
              amountFormatted: formatCurrencyForTemplate(270),
            },
            {
              type: 'SGST',
              name: 'SGST @ 9%',
              rate: 9,
              amount: 270,
              amountFormatted: formatCurrencyForTemplate(270),
            },
          ],
        },
        {
          index: 3,
          name: 'Consultation',
          description: null,
          hsnCode: '998311',
          quantity: 1,
          unit: 'HRS',
          rate: 2000,
          rateFormatted: formatCurrencyForTemplate(2000),
          amount: 2000,
          amountFormatted: formatCurrencyForTemplate(2000),
          taxableAmount: 2000,
          taxableAmountFormatted: formatCurrencyForTemplate(2000),
          totalTax: 360,
          totalTaxFormatted: formatCurrencyForTemplate(360),
          total: 2360,
          totalFormatted: formatCurrencyForTemplate(2360),
          taxes: [
            {
              type: 'CGST',
              name: 'CGST @ 9%',
              rate: 9,
              amount: 180,
              amountFormatted: formatCurrencyForTemplate(180),
            },
            {
              type: 'SGST',
              name: 'SGST @ 9%',
              rate: 9,
              amount: 180,
              amountFormatted: formatCurrencyForTemplate(180),
            },
          ],
        },
      ],
      taxSummary: [
        {
          type: 'CGST',
          name: 'CGST @ 9%',
          rate: 9,
          taxableAmount: 10000,
          taxableAmountFormatted: formatCurrencyForTemplate(10000),
          amount: 900,
          amountFormatted: formatCurrencyForTemplate(900),
        },
        {
          type: 'SGST',
          name: 'SGST @ 9%',
          rate: 9,
          taxableAmount: 10000,
          taxableAmountFormatted: formatCurrencyForTemplate(10000),
          amount: 900,
          amountFormatted: formatCurrencyForTemplate(900),
        },
      ],
      taxDiscountEntries: [],
      payments: [],
      bankDetails: {
        hasBankDetails: true,
        bankName: 'State Bank of India',
        accountNumber: '1234567890123456',
        accountHolder: company?.name ?? 'Sample Company Name',
        ifscCode: 'SBIN0001234',
        branchName: 'Main Branch',
        upiId: 'company@upi',
        paymentMethodName: 'Bank Transfer',
        paymentMethodType: 'BANK_TRANSFER',
      },
      currencySymbol: '₹',
      printDate: formatDateForTemplate(now),
      printDateTime: now.toLocaleString('en-IN'),
      styles: cssStyles,
      formatCurrency: formatCurrencyForTemplate,
      formatDate: formatDateForTemplate,
      formatNumber: formatNumberForTemplate,
    };

    try {
      // Render using EJS - same as actual invoice rendering
      const renderedBody = ejs.render(htmlTemplate, templateData, {
        rmWhitespace: false,
      });

      const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${cssStyles}</style>
</head>
<body>
${renderedBody}
</body>
</html>`;
      setPreviewHtml(fullHtml);
    } catch (err) {
      // If EJS fails, show the error in preview
      const errorHtml = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    .error { color: #d32f2f; background: #ffebee; padding: 16px; border-radius: 4px; }
    pre { white-space: pre-wrap; word-break: break-word; }
  </style>
</head>
<body>
  <div class="error">
    <h3>Template Error</h3>
    <pre>${err instanceof Error ? err.message : 'Unknown error'}</pre>
  </div>
</body>
</html>`;
      setPreviewHtml(errorHtml);
    }
  }, [htmlTemplate, cssStyles, company]);

  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack
          direction='row'
          justifyContent='space-between'
          alignItems='center'
        >
          <Stack direction='row' alignItems='center' spacing={1}>
            <IconButton onClick={() => navigate(Routes.InvoiceFormats)}>
              <ArrowBack />
            </IconButton>
            <Typography variant='h5'>
              {isEdit ? 'Edit Invoice Format' : 'Create Invoice Format'}
            </Typography>
          </Stack>
          <Button
            variant='contained'
            startIcon={<Save />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity='error' sx={{ m: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Panel - Editor */}
        <Box
          sx={{
            width: '50%',
            display: 'flex',
            flexDirection: 'column',
            borderRight: 1,
            borderColor: 'divider',
          }}
        >
          {/* Metadata */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  size='small'
                  label='Format Name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  size='small'
                  label='Description'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 3 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Paper Size</InputLabel>
                  <Select
                    value={paperSize}
                    label='Paper Size'
                    onChange={(e) =>
                      setPaperSize(e.target.value as 'A4' | 'Letter' | 'Legal')
                    }
                  >
                    {PAPER_SIZES.map((size) => (
                      <MenuItem key={size} value={size}>
                        {size}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 3 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Orientation</InputLabel>
                  <Select
                    value={orientation}
                    label='Orientation'
                    onChange={(e) =>
                      setOrientation(e.target.value as 'portrait' | 'landscape')
                    }
                  >
                    {ORIENTATIONS.map((o) => (
                      <MenuItem key={o} value={o}>
                        {o.charAt(0).toUpperCase() + o.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Stack direction='row' spacing={1}>
                  <TextField
                    size='small'
                    label='Top (mm)'
                    type='number'
                    value={marginTop}
                    onChange={(e) => setMarginTop(Number(e.target.value))}
                    sx={{ width: 80 }}
                  />
                  <TextField
                    size='small'
                    label='Right (mm)'
                    type='number'
                    value={marginRight}
                    onChange={(e) => setMarginRight(Number(e.target.value))}
                    sx={{ width: 80 }}
                  />
                  <TextField
                    size='small'
                    label='Bottom (mm)'
                    type='number'
                    value={marginBottom}
                    onChange={(e) => setMarginBottom(Number(e.target.value))}
                    sx={{ width: 80 }}
                  />
                  <TextField
                    size='small'
                    label='Left (mm)'
                    type='number'
                    value={marginLeft}
                    onChange={(e) => setMarginLeft(Number(e.target.value))}
                    sx={{ width: 80 }}
                  />
                </Stack>
              </Grid>
            </Grid>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab label='HTML Template' />
              <Tab label='CSS Styles' />
            </Tabs>
          </Box>

          {/* Code Editors */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <TabPanel value={activeTab} index={0}>
              <TextField
                multiline
                fullWidth
                value={htmlTemplate}
                onChange={(e) => setHtmlTemplate(e.target.value)}
                placeholder='Enter HTML template with EJS syntax...'
                sx={{
                  height: '100%',
                  '& .MuiInputBase-root': {
                    height: '100%',
                    alignItems: 'flex-start',
                    fontFamily: 'monospace',
                    fontSize: 12,
                  },
                  '& .MuiInputBase-input': {
                    height: '100% !important',
                    overflow: 'auto !important',
                  },
                }}
              />
            </TabPanel>
            <TabPanel value={activeTab} index={1}>
              <TextField
                multiline
                fullWidth
                value={cssStyles}
                onChange={(e) => setCssStyles(e.target.value)}
                placeholder='Enter CSS styles...'
                sx={{
                  height: '100%',
                  '& .MuiInputBase-root': {
                    height: '100%',
                    alignItems: 'flex-start',
                    fontFamily: 'monospace',
                    fontSize: 12,
                  },
                  '& .MuiInputBase-input': {
                    height: '100% !important',
                    overflow: 'auto !important',
                  },
                }}
              />
            </TabPanel>
          </Box>
        </Box>

        {/* Right Panel - Preview */}
        <Box
          sx={{
            width: '50%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'grey.200',
          }}
        >
          <Box
            sx={{
              p: 1,
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Stack
              direction='row'
              justifyContent='space-between'
              alignItems='center'
            >
              <Typography variant='subtitle2'>Preview</Typography>
              <IconButton size='small' onClick={updatePreview}>
                <Refresh fontSize='small' />
              </IconButton>
            </Stack>
          </Box>
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 2,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Card
              sx={{
                width:
                  paperSize === 'A4'
                    ? '210mm'
                    : paperSize === 'Letter'
                      ? '8.5in'
                      : '8.5in',
                minHeight:
                  paperSize === 'A4'
                    ? '297mm'
                    : paperSize === 'Letter'
                      ? '11in'
                      : '14in',
                bgcolor: 'white',
                overflow: 'hidden',
                transform: 'scale(0.6)',
                transformOrigin: 'top center',
              }}
            >
              <iframe
                srcDoc={previewHtml}
                style={{
                  width: '100%',
                  height: '297mm',
                  border: 'none',
                }}
                title='Format Preview'
              />
            </Card>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
