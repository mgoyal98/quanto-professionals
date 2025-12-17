import { useEffect, useState, useMemo } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Add, Delete, Save, ArrowBack, Refresh } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { Customer } from '@shared/customer';
import {
  InvoiceSeries,
  previewNextInvoiceNumber,
} from '@shared/invoice-series';
import { ItemWithTaxTemplates, UNITS } from '@shared/item';
import { TaxTemplate } from '@shared/tax-template';
import { PaymentMethod } from '@shared/payment-method';
import { InvoiceFormat } from '@shared/invoice-format';
import {
  InvoiceItemInput,
  calculateInvoiceItem,
  calculateInvoiceTotalsWithEntries,
  CalculatedInvoiceItem,
  GstType,
  determineGstType,
  formatCurrency,
  InvoiceWithDetails,
  generateTaxSummary,
  InvoiceTaxDiscountInput,
} from '@shared/invoice';
import { DiscountType, DiscountTemplate } from '@shared/discount';
import { useNotification } from '@/providers/notification';
import { Routes } from '@/common/routes';
import OverpaymentWarningDialog from '@/components/overpayment-warning-dialog';
import InvoiceTaxDiscountEntries, {
  InvoiceTaxDiscountEntryRow,
} from '@/components/invoice-tax-discount-entries';

interface InvoiceItemRow extends InvoiceItemInput {
  id: string; // temporary ID for React key
}

type PaymentStatus = 'Unpaid' | 'Partially Paid' | 'Paid';

function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { showSuccess, showError } = useNotification();

  // Form state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lookups
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoiceSeries, setInvoiceSeries] = useState<InvoiceSeries[]>([]);
  const [items, setItems] = useState<ItemWithTaxTemplates[]>([]);
  const [taxTemplates, setTaxTemplates] = useState<TaxTemplate[]>([]);
  const [cessTemplates, setCessTemplates] = useState<TaxTemplate[]>([]);
  const [discountTemplates, setDiscountTemplates] = useState<
    DiscountTemplate[]
  >([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoiceFormats, setInvoiceFormats] = useState<InvoiceFormat[]>([]);
  const [companyStateCode, setCompanyStateCode] = useState<string>('');

  // Invoice fields
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [selectedSeries, setSelectedSeries] = useState<InvoiceSeries | null>(
    null
  );
  const [invoiceDate, setInvoiceDate] = useState<Date | null>(new Date());
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemRow[]>([]);
  const [taxDiscountEntries, setTaxDiscountEntries] = useState<
    InvoiceTaxDiscountEntryRow[]
  >([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);
  const [selectedInvoiceFormat, setSelectedInvoiceFormat] =
    useState<InvoiceFormat | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [reverseCharge, setReverseCharge] = useState<boolean>(false);
  const [existingInvoiceNumber, setExistingInvoiceNumber] =
    useState<string>('');

  // Payment Status
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Unpaid');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paidDate, setPaidDate] = useState<Date | null>(null);

  // For edit mode - track existing invoice data
  const [existingInvoice, setExistingInvoice] =
    useState<InvoiceWithDetails | null>(null);
  const [showOverpaymentDialog, setShowOverpaymentDialog] = useState(false);

  // Calculate GST type
  const gstType: GstType = useMemo(() => {
    if (!selectedCustomer || !companyStateCode) return 'INTRA';
    return determineGstType(companyStateCode, selectedCustomer.stateCode);
  }, [selectedCustomer, companyStateCode]);

  // Calculate totals
  const { calculatedItems, totals, taxSummary } = useMemo(() => {
    const calcItems: CalculatedInvoiceItem[] = invoiceItems.map((item) => {
      let taxRate = 0;
      let taxTemplateName: string | undefined;
      let cessRate = 0;
      let cessTemplateName: string | undefined;

      if (item.taxTemplateId) {
        const template = taxTemplates.find((t) => t.id === item.taxTemplateId);
        taxRate = template?.rate ?? 0;
        taxTemplateName = template?.name;
      } else if (item.customTaxRate != null) {
        taxRate = item.customTaxRate;
      }

      if (item.cessTemplateId) {
        const template = cessTemplates.find(
          (t) => t.id === item.cessTemplateId
        );
        cessRate = template?.rate ?? 0;
        cessTemplateName = template?.name;
      } else if (item.customCessRate != null) {
        cessRate = item.customCessRate;
      }

      const calculated = calculateInvoiceItem({
        quantity: item.quantity,
        rate: item.rate,
        discountType: item.discountType ?? null,
        discountValue: item.discountValue ?? 0,
        discountTemplateId: item.discountTemplateId ?? null,
        taxRate,
        taxTemplateId: item.taxTemplateId ?? null,
        taxTemplateName,
        cessRate,
        cessTemplateId: item.cessTemplateId ?? null,
        cessTemplateName,
        gstType,
      });

      return {
        name: item.name,
        description: item.description,
        hsnCode: item.hsnCode,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        amount: calculated.amount,
        taxableAmount: calculated.taxableAmount,
        totalDiscount: calculated.totalDiscount,
        totalTax: calculated.totalTax,
        total: calculated.total,
        taxesDiscounts: calculated.taxesDiscounts,
      };
    });

    // Convert entries to input format for calculation
    const entryInputs: InvoiceTaxDiscountInput[] = taxDiscountEntries.map(
      (e, i) => ({
        entryType: e.entryType,
        taxTemplateId: e.taxTemplateId,
        discountTemplateId: e.discountTemplateId,
        name: e.name,
        rateType: e.rateType,
        rate: e.rate,
        applicationMode: e.applicationMode,
        sortOrder: e.sortOrder ?? i,
      })
    );

    const invTotals = calculateInvoiceTotalsWithEntries(calcItems, entryInputs);

    // Generate tax summary grouped by tax_id/rate
    const summary = generateTaxSummary(calcItems);

    return {
      calculatedItems: calcItems,
      totals: invTotals,
      taxSummary: summary,
    };
  }, [invoiceItems, taxTemplates, cessTemplates, gstType, taxDiscountEntries]);

  useEffect(() => {
    if (paymentStatus === 'Paid' && paidAmount !== totals.grandTotal) {
      setPaidAmount(totals.grandTotal);
    }

    if (
      paymentStatus === 'Partially Paid' &&
      totals.grandTotal > 0 &&
      paidAmount >= totals.grandTotal
    ) {
      setPaidAmount(totals.grandTotal / 2);
    }
  }, [paymentStatus, paidAmount, totals.grandTotal]);

  // Load lookups
  useEffect(() => {
    const loadLookups = async () => {
      setLoading(true);
      try {
        // Initialize default formats first
        await window.invoiceFormatApi?.initializeDefaults();

        const [
          customersData,
          seriesData,
          itemsData,
          taxData,
          discountData,
          paymentData,
          companyData,
          formatsData,
        ] = await Promise.all([
          window.customerApi?.listCustomers(),
          window.invoiceSeriesApi?.listInvoiceSeries(),
          window.itemApi?.listItems(),
          window.taxTemplateApi?.listTaxTemplates(),
          window.discountTemplateApi?.listDiscountTemplates(),
          window.paymentMethodApi?.listPaymentMethods(),
          window.companyApi?.getCompanyDetails(),
          window.invoiceFormatApi?.listActiveInvoiceFormats(),
        ]);

        setCustomers(customersData ?? []);
        setInvoiceSeries(seriesData ?? []);
        setItems(itemsData?.items ?? []);
        setTaxTemplates(
          (taxData ?? []).filter(
            (t) => t.taxType === 'GST' || t.taxType === 'CUSTOM'
          )
        );
        setCessTemplates((taxData ?? []).filter((t) => t.taxType === 'CESS'));
        setDiscountTemplates((discountData ?? []).filter((d) => d.isActive));
        setPaymentMethods(paymentData ?? []);
        setInvoiceFormats(formatsData ?? []);
        setCompanyStateCode(companyData?.stateCode ?? '');

        // Set default series
        const defaultSeries = seriesData?.find((s) => s.isDefault);
        if (defaultSeries) {
          setSelectedSeries(defaultSeries);
        }

        // Set default payment method
        const defaultPayment = paymentData?.find((p) => p.isDefault);
        if (defaultPayment) {
          setSelectedPaymentMethod(defaultPayment);
        }

        // Set default invoice format
        const defaultFormat = formatsData?.find((f) => f.isDefault);
        if (defaultFormat) {
          setSelectedInvoiceFormat(defaultFormat);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    void loadLookups();
  }, []);

  // Load invoice for editing
  useEffect(() => {
    if (!isEdit || !id || loading) return;

    const loadInvoice = async () => {
      try {
        const invoice = await window.invoiceApi?.getInvoice(Number(id));
        if (invoice) {
          // Fetch and add archived entities that are used in this invoice
          // This ensures archived items still appear in dropdowns when editing
          await ensureInvoiceEntitiesInLists(invoice);
          populateFormFromInvoice(invoice);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invoice');
      }
    };

    void loadInvoice();
  }, [
    isEdit,
    id,
    loading,
    customers,
    invoiceSeries,
    paymentMethods,
    discountTemplates,
    taxTemplates,
    invoiceFormats,
  ]);

  // Helper to ensure archived entities used in the invoice are in the lookup lists
  const ensureInvoiceEntitiesInLists = async (invoice: InvoiceWithDetails) => {
    // Check and add archived customer
    if (
      invoice.customerId &&
      !customers.find((c) => c.id === invoice.customerId)
    ) {
      const customer = await window.customerApi?.getCustomer(
        invoice.customerId
      );
      if (customer) {
        setCustomers((prev) => [...prev, customer]);
      }
    }

    // Check and add archived invoice series
    if (
      invoice.invoiceSeriesId &&
      !invoiceSeries.find((s) => s.id === invoice.invoiceSeriesId)
    ) {
      const series = await window.invoiceSeriesApi?.getInvoiceSeries(
        invoice.invoiceSeriesId
      );
      if (series) {
        setInvoiceSeries((prev) => [...prev, series]);
      }
    }

    // Check and add archived payment method
    if (
      invoice.paymentMethodId &&
      !paymentMethods.find((p) => p.id === invoice.paymentMethodId)
    ) {
      const method = await window.paymentMethodApi?.getPaymentMethod(
        invoice.paymentMethodId
      );
      if (method) {
        setPaymentMethods((prev) => [...prev, method]);
      }
    }

    // Check and add archived invoice format
    if (
      invoice.invoiceFormatId &&
      !invoiceFormats.find((f) => f.id === invoice.invoiceFormatId)
    ) {
      const format = await window.invoiceFormatApi?.getInvoiceFormat(
        invoice.invoiceFormatId
      );
      if (format) {
        setInvoiceFormats((prev) => [...prev, format]);
      }
    }

    // Check and add archived items used in invoice line items
    if (invoice.items) {
      for (const item of invoice.items) {
        if (item.itemId && !items.find((i) => i.id === item.itemId)) {
          const fetchedItem = await window.itemApi?.getItem(item.itemId);
          if (fetchedItem) {
            setItems((prev) => [...prev, fetchedItem]);
          }
        }
      }
    }

    // Collect all tax template IDs used in the invoice
    const usedTaxTemplateIds = new Set<number>();

    // From invoice items' taxesDiscounts
    if (invoice.items) {
      for (const item of invoice.items) {
        if (item.taxesDiscounts) {
          for (const td of item.taxesDiscounts) {
            if (td.taxTemplateId) {
              usedTaxTemplateIds.add(td.taxTemplateId);
            }
          }
        }
      }
    }

    // From invoice-level tax/discount entries
    if (invoice.taxDiscountEntries) {
      for (const entry of invoice.taxDiscountEntries) {
        if (entry.taxTemplateId) {
          usedTaxTemplateIds.add(entry.taxTemplateId);
        }
      }
    }

    // Fetch missing tax templates
    const allTaxTemplates = [...taxTemplates, ...cessTemplates];
    for (const taxId of usedTaxTemplateIds) {
      if (!allTaxTemplates.find((t) => t.id === taxId)) {
        const template = await window.taxTemplateApi?.getTaxTemplate(taxId);
        if (template) {
          if (template.taxType === 'CESS') {
            setCessTemplates((prev) => [...prev, template]);
          } else {
            setTaxTemplates((prev) => [...prev, template]);
          }
        }
      }
    }

    // Collect all discount template IDs used in the invoice
    const usedDiscountTemplateIds = new Set<number>();

    if (invoice.taxDiscountEntries) {
      for (const entry of invoice.taxDiscountEntries) {
        if (entry.discountTemplateId) {
          usedDiscountTemplateIds.add(entry.discountTemplateId);
        }
      }
    }

    // Fetch missing discount templates
    for (const discountId of usedDiscountTemplateIds) {
      if (!discountTemplates.find((d) => d.id === discountId)) {
        const template =
          await window.discountTemplateApi?.getDiscountTemplate(discountId);
        if (template) {
          setDiscountTemplates((prev) => [...prev, template]);
        }
      }
    }
  };

  const populateFormFromInvoice = (invoice: InvoiceWithDetails) => {
    const customer = customers.find((c) => c.id === invoice.customerId);
    const series = invoiceSeries.find((s) => s.id === invoice.invoiceSeriesId);
    const payment = paymentMethods.find(
      (p) => p.id === invoice.paymentMethodId
    );
    const format = invoiceFormats.find((f) => f.id === invoice.invoiceFormatId);

    setExistingInvoiceNumber(invoice.invoiceNumber ?? '');
    if (customer) setSelectedCustomer(customer);
    if (series) setSelectedSeries(series);
    if (payment) setSelectedPaymentMethod(payment);
    if (format) setSelectedInvoiceFormat(format);

    setInvoiceDate(invoice.invoiceDate);
    setNotes(invoice.notes ?? '');
    setReverseCharge(invoice.reverseCharge ?? false);

    // Load tax/discount entries from the invoice
    if (invoice.taxDiscountEntries && invoice.taxDiscountEntries.length > 0) {
      setTaxDiscountEntries(
        invoice.taxDiscountEntries.map((entry) => ({
          id: `entry-${entry.id}`,
          entryType: entry.entryType as 'TAX' | 'DISCOUNT',
          taxTemplateId: entry.taxTemplateId,
          discountTemplateId: entry.discountTemplateId,
          name: entry.name,
          rateType: entry.rateType as 'PERCENT' | 'AMOUNT',
          rate: entry.rate,
          applicationMode: entry.applicationMode as 'BEFORE_TAX' | 'AFTER_TAX',
          sortOrder: entry.sortOrder,
        }))
      );
    } else {
      // Fallback: convert legacy single-entry fields to entries for backward compatibility
      const legacyEntries: InvoiceTaxDiscountEntryRow[] = [];
      if (invoice.additionalTaxAmount > 0 && invoice.additionalTaxRate > 0) {
        legacyEntries.push({
          id: 'legacy-tax',
          entryType: 'TAX',
          taxTemplateId: invoice.additionalTaxTemplateId ?? null,
          discountTemplateId: null,
          name:
            invoice.additionalTaxName ?? `Tax @ ${invoice.additionalTaxRate}%`,
          rateType: 'PERCENT',
          rate: invoice.additionalTaxRate,
          applicationMode: 'AFTER_TAX',
          sortOrder: 0,
        });
      }
      if (invoice.discountAmount > 0 && invoice.discountValue) {
        legacyEntries.push({
          id: 'legacy-discount',
          entryType: 'DISCOUNT',
          taxTemplateId: null,
          discountTemplateId: null,
          name:
            invoice.discountType === 'PERCENT'
              ? `Discount ${invoice.discountValue}%`
              : `Discount ₹${invoice.discountValue}`,
          rateType: (invoice.discountType as 'PERCENT' | 'AMOUNT') ?? 'PERCENT',
          rate: invoice.discountValue,
          applicationMode: invoice.discountAfterTax
            ? 'AFTER_TAX'
            : 'BEFORE_TAX',
          sortOrder: 1,
        });
      }
      setTaxDiscountEntries(legacyEntries);
    }

    if (invoice.items) {
      setInvoiceItems(
        invoice.items.map((item) => {
          // Extract tax/cess template IDs from taxesDiscounts entries
          let taxTemplateId: number | null = null;
          let cessTemplateId: number | null = null;

          if (item.taxesDiscounts) {
            const taxEntry = item.taxesDiscounts.find(
              (td) =>
                td.type === 'CGST' || td.type === 'SGST' || td.type === 'IGST'
            );
            if (taxEntry?.taxTemplateId) {
              taxTemplateId = taxEntry.taxTemplateId;
            }

            const cessEntry = item.taxesDiscounts.find(
              (td) => td.type === 'CESS'
            );
            if (cessEntry?.taxTemplateId) {
              cessTemplateId = cessEntry.taxTemplateId;
            }
          }

          return {
            id: generateTempId(),
            itemId: item.itemId,
            name: item.name,
            description: item.description ?? '',
            hsnCode: item.hsnCode ?? '',
            quantity: item.quantity,
            unit: item.unit,
            rate: item.rate,
            taxTemplateId,
            customTaxRate: null as number | null,
            cessTemplateId,
            customCessRate: null as number | null,
            discountType: null as DiscountType | null,
            discountValue: 0,
            discountTemplateId: null as number | null,
          };
        })
      );
    }

    // Store the existing invoice data for overpayment detection
    setExistingInvoice(invoice);
  };

  const handleAddItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      {
        id: generateTempId(),
        itemId: null,
        name: '',
        description: '',
        hsnCode: '',
        quantity: 1,
        unit: 'NOS',
        rate: 0,
        taxTemplateId: null,
        customTaxRate: null,
        cessTemplateId: null,
        customCessRate: null,
        discountType: null,
        discountValue: 0,
        discountTemplateId: null,
      },
    ]);
  };

  const handleRemoveItem = (itemId: string) => {
    setInvoiceItems(invoiceItems.filter((item) => item.id !== itemId));
  };

  const handleItemChange = (
    itemId: string,
    field: keyof InvoiceItemRow,
    value: unknown
  ) => {
    setInvoiceItems(
      invoiceItems.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSelectMasterItem = (
    itemId: string,
    masterItem: ItemWithTaxTemplates | null
  ) => {
    if (!masterItem) return;

    setInvoiceItems(
      invoiceItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              itemId: masterItem.id,
              name: masterItem.name,
              description: masterItem.description ?? '',
              hsnCode: masterItem.hsnCode ?? '',
              rate: masterItem.rate,
              unit: masterItem.unit,
              taxTemplateId: masterItem.taxTemplateId,
              cessTemplateId: masterItem.cessTemplateId,
            }
          : item
      )
    );
  };

  const handlePaymentStatusChange = (status: PaymentStatus) => {
    setPaymentStatus(status);

    if (status === 'Paid') {
      setPaidAmount(totals.grandTotal);
      setPaidDate(new Date());
      return;
    }

    if (status === 'Partially Paid') {
      const defaultPartialAmount =
        paidAmount > 0 && paidAmount < totals.grandTotal
          ? paidAmount
          : totals.grandTotal > 0
            ? totals.grandTotal / 2
            : 0;
      setPaidAmount(defaultPartialAmount);
      setPaidDate(new Date());
      return;
    }

    setPaidAmount(0);
    setPaidDate(null);
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      setError('Please select a customer');
      return;
    }
    if (!selectedSeries) {
      setError('Please select an invoice series');
      return;
    }
    if (invoiceItems.length === 0) {
      setError('Please add at least one item');
      return;
    }
    if (!invoiceDate) {
      setError('Please select an invoice date');
      return;
    }

    if (paymentStatus !== 'Unpaid') {
      if (paidAmount <= 0) {
        setError('Enter a paid amount greater than zero');
        return;
      }
      if (paidAmount > totals.grandTotal) {
        setError('Paid amount cannot exceed the invoice total');
        return;
      }
      if (paymentStatus === 'Paid' && paidAmount < totals.grandTotal) {
        setError('Paid status requires the full invoice amount to be settled');
        return;
      }
      if (
        paymentStatus === 'Partially Paid' &&
        paidAmount >= totals.grandTotal
      ) {
        setError(
          'Partially paid status requires an amount less than the total'
        );
        return;
      }
    }

    // Check for overpayment when editing an invoice with payments
    if (isEdit && existingInvoice && existingInvoice.paidAmount > 0) {
      if (existingInvoice.paidAmount > totals.grandTotal) {
        setShowOverpaymentDialog(true);
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      const itemsPayload: InvoiceItemInput[] = invoiceItems.map(
        (item, idx) => ({
          itemId: item.itemId,
          name: item.name,
          description: item.description || undefined,
          hsnCode: item.hsnCode || undefined,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          taxTemplateId: item.taxTemplateId,
          customTaxRate: item.customTaxRate,
          cessTemplateId: item.cessTemplateId,
          customCessRate: item.customCessRate,
          sortOrder: idx,
        })
      );

      // Convert entries to input format
      const taxDiscountEntriesPayload: InvoiceTaxDiscountInput[] =
        taxDiscountEntries.map((e, i) => ({
          entryType: e.entryType,
          taxTemplateId: e.taxTemplateId,
          discountTemplateId: e.discountTemplateId,
          name: e.name,
          rateType: e.rateType,
          rate: e.rate,
          applicationMode: e.applicationMode,
          sortOrder: e.sortOrder ?? i,
        }));

      if (isEdit && id) {
        await window.invoiceApi?.updateInvoice({
          id: Number(id),
          invoiceFormatId: selectedInvoiceFormat?.id,
          invoiceDate,
          items: itemsPayload,
          taxDiscountEntries: taxDiscountEntriesPayload,
          paymentMethodId: selectedPaymentMethod?.id,
          notes: notes || undefined,
          reverseCharge,
        });
        showSuccess('Invoice updated successfully');
        // Redirect to print view
        navigate(`/invoices/${id}/print`);
      } else {
        // Determine invoice status based on payment
        const invoiceStatus =
          paymentStatus === 'Paid'
            ? 'PAID'
            : paymentStatus === 'Partially Paid'
              ? 'PARTIALLY_PAID'
              : 'UNPAID';
        const paidAmountToSave = paymentStatus === 'Unpaid' ? 0 : paidAmount;
        const paidDateToSave =
          paymentStatus === 'Unpaid' ? undefined : (paidDate ?? new Date());

        const createdInvoice = await window.invoiceApi?.createInvoice({
          invoiceSeriesId: selectedSeries.id,
          customerId: selectedCustomer.id,
          invoiceFormatId: selectedInvoiceFormat?.id,
          invoiceDate,
          items: itemsPayload,
          taxDiscountEntries: taxDiscountEntriesPayload,
          paymentMethodId: selectedPaymentMethod?.id,
          notes: notes || undefined,
          status: invoiceStatus,
          paidAmount: paidAmountToSave,
          paidDate: paidDateToSave,
          reverseCharge,
        });
        showSuccess('Invoice created successfully');
        // Redirect to print view
        if (createdInvoice?.id) {
          navigate(`/invoices/${createdInvoice.id}/print`);
        } else {
          navigate(Routes.Invoices);
        }
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    // Reset to defaults
    setSelectedCustomer(null);
    setInvoiceDate(new Date());
    setInvoiceItems([]);
    setTaxDiscountEntries([]);
    setNotes('');
    setReverseCharge(false);
    setPaymentStatus('Unpaid');
    setPaidAmount(0);
    setPaidDate(null);
    setError(null);

    // Reset to defaults from loaded data
    const defaultSeries = invoiceSeries.find((s) => s.isDefault);
    if (defaultSeries) {
      setSelectedSeries(defaultSeries);
    }
    const defaultPayment = paymentMethods.find((p) => p.isDefault);
    if (defaultPayment) {
      setSelectedPaymentMethod(defaultPayment);
    }
    const defaultFormat = invoiceFormats.find((f) => f.isDefault);
    if (defaultFormat) {
      setSelectedInvoiceFormat(defaultFormat);
    }
  };

  const invoiceNumberPreview = selectedSeries
    ? previewNextInvoiceNumber(selectedSeries)
    : '';

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate(Routes.Invoices)}>
              <ArrowBack />
            </IconButton>
            <Typography variant='h4'>
              {isEdit ? 'Edit Invoice' : 'Create Invoice'}
            </Typography>
          </Box>

          {error && (
            <Alert severity='error' onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Informational banner for invoices with payments */}
          {isEdit && existingInvoice && existingInvoice.paidAmount > 0 && (
            <Alert severity='info'>
              This invoice has payments of{' '}
              {formatCurrency(existingInvoice.paidAmount)} recorded. Changes to
              totals will affect the due amount.
            </Alert>
          )}

          {/* Invoice Details */}
          <Card sx={{ p: 3 }}>
            <Typography variant='h6' gutterBottom>
              Invoice Details
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Invoice Series</InputLabel>
                  <Select
                    value={selectedSeries?.id ?? ''}
                    onChange={(e) => {
                      const series = invoiceSeries.find(
                        (s) => s.id === e.target.value
                      );
                      setSelectedSeries(series ?? null);
                    }}
                    label='Invoice Series'
                    disabled={isEdit}
                  >
                    {invoiceSeries.map((series) => (
                      <MenuItem key={series.id} value={series.id}>
                        {series.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DatePicker
                  label='Invoice Date'
                  value={invoiceDate}
                  onChange={setInvoiceDate}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label='Invoice Number'
                  value={isEdit ? existingInvoiceNumber : invoiceNumberPreview}
                  slotProps={{ input: { readOnly: true } }}
                  helperText={
                    isEdit ? 'Existing invoice number' : 'Auto-generated'
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  options={customers}
                  getOptionLabel={(option) => option.name}
                  value={selectedCustomer}
                  onChange={(_e, value) => setSelectedCustomer(value)}
                  disabled={isEdit}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label='Customer'
                      required
                      helperText={
                        selectedCustomer
                          ? `GSTIN: ${selectedCustomer.gstin || 'N/A'}`
                          : 'Select a customer'
                      }
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box>
                        <Typography>{option.name}</Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {option.city}, {option.state}
                        </Typography>
                      </Box>
                    </li>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Invoice Format</InputLabel>
                  <Select
                    value={selectedInvoiceFormat?.id ?? ''}
                    onChange={(e) => {
                      const format = invoiceFormats.find(
                        (f) => f.id === e.target.value
                      );
                      setSelectedInvoiceFormat(format ?? null);
                    }}
                    label='Invoice Format'
                  >
                    {invoiceFormats.map((format) => (
                      <MenuItem key={format.id} value={format.id}>
                        {format.name}
                        {format.isDefault && ' (Default)'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ pt: 2 }}
                >
                  GST Type:{' '}
                  <strong>
                    {gstType === 'INTRA'
                      ? 'Intra-State (CGST + SGST)'
                      : 'Inter-State (IGST)'}
                  </strong>
                </Typography>
              </Grid>
            </Grid>
          </Card>

          {/* Line Items */}
          <Card sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant='h6'>Line Items</Typography>
              <Button startIcon={<Add />} onClick={handleAddItem}>
                Add Item
              </Button>
            </Box>

            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 220 }}>Item</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>Description</TableCell>
                    <TableCell sx={{ width: 120 }}>Qty</TableCell>
                    <TableCell sx={{ width: 100 }}>Unit</TableCell>
                    <TableCell sx={{ width: 120, minWidth: 180 }}>
                      Rate
                    </TableCell>
                    <TableCell align='right' sx={{ width: 140 }}>
                      Total
                    </TableCell>
                    <TableCell sx={{ width: 50 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoiceItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align='center'>
                        <Typography color='text.secondary' sx={{ py: 3 }}>
                          No items added. Click "Add Item" to add line items.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoiceItems.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Autocomplete
                            size='small'
                            options={items}
                            getOptionLabel={(opt) => opt.name}
                            value={
                              items.find((i) => i.id === item.itemId) ?? null
                            }
                            onChange={(_e, value) => {
                              if (value) {
                                handleSelectMasterItem(item.id, value);
                              } else {
                                // Clear the item reference when cleared
                                handleItemChange(item.id, 'itemId', null);
                                handleItemChange(item.id, 'name', '');
                                handleItemChange(item.id, 'description', '');
                              }
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder='Select item'
                              />
                            )}
                            renderOption={(props, option) => (
                              <li {...props} key={option.id}>
                                <Box>
                                  <Typography>{option.name}</Typography>
                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                  >
                                    {option.hsnCode && `HSN: ${option.hsnCode}`}
                                    {option.hsnCode &&
                                      option.taxTemplate &&
                                      ' • '}
                                    {option.taxTemplate &&
                                      `${option.taxTemplate.name}`}
                                  </Typography>
                                </Box>
                              </li>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size='small'
                            value={item.description}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                'description',
                                e.target.value
                              )
                            }
                            placeholder='Description (optional)'
                            multiline
                            maxRows={2}
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size='small'
                            type='number'
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                'quantity',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            size='small'
                            value={item.unit}
                            onChange={(e) =>
                              handleItemChange(item.id, 'unit', e.target.value)
                            }
                            fullWidth
                          >
                            {UNITS.map((u) => (
                              <MenuItem key={u.code} value={u.code}>
                                {u.code}
                              </MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size='small'
                            type='number'
                            value={item.rate}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                'rate',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            slotProps={{
                              htmlInput: { min: 0, step: 0.01 },
                              input: {
                                startAdornment: (
                                  <InputAdornment position='start'>
                                    ₹
                                  </InputAdornment>
                                ),
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell align='right'>
                          <Typography fontFamily='monospace' fontWeight='bold'>
                            {formatCurrency(calculatedItems[index]?.total ?? 0)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size='small'
                            onClick={() => handleRemoveItem(item.id)}
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
          </Card>

          {/* Totals & Additional Info */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              {/* Taxes & Discounts Entries */}
              <Box sx={{ mb: 2 }}>
                <InvoiceTaxDiscountEntries
                  entries={taxDiscountEntries}
                  taxTemplates={taxTemplates}
                  discountTemplates={discountTemplates}
                  taxableTotal={totals.taxableTotal}
                  intermediateTotal={totals.taxableTotal + totals.totalTax}
                  onChange={setTaxDiscountEntries}
                />
              </Box>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3 }}>
                <Typography variant='h6' gutterBottom>
                  Payment Information
                </Typography>
                <Stack spacing={2}>
                  <FormControl fullWidth size='small' required>
                    <InputLabel>Payment Status</InputLabel>
                    <Select
                      value={paymentStatus}
                      onChange={(e) =>
                        handlePaymentStatusChange(
                          e.target.value as PaymentStatus
                        )
                      }
                      label='Payment Status'
                    >
                      <MenuItem value='Unpaid'>Unpaid</MenuItem>
                      <MenuItem value='Partially Paid'>Partially Paid</MenuItem>
                      <MenuItem value='Paid'>Paid</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size='small'>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={selectedPaymentMethod?.id ?? ''}
                      onChange={(e) => {
                        const method = paymentMethods.find(
                          (p) => p.id === e.target.value
                        );
                        setSelectedPaymentMethod(method ?? null);
                      }}
                      label='Payment Method'
                    >
                      <MenuItem value=''>None</MenuItem>
                      {paymentMethods.map((method) => (
                        <MenuItem key={method.id} value={method.id}>
                          {method.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {paymentStatus !== 'Unpaid' && (
                    <>
                      <TextField
                        fullWidth
                        size='small'
                        type='number'
                        label='Paid Amount'
                        value={paidAmount}
                        onChange={(e) =>
                          setPaidAmount(parseFloat(e.target.value) || 0)
                        }
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position='start'>
                                ₹
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                      <DatePicker
                        label='Paid On'
                        value={paidDate}
                        onChange={setPaidDate}
                        slotProps={{
                          textField: { fullWidth: true, size: 'small' },
                        }}
                      />
                    </>
                  )}
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label='Notes / Remarks'
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder='Add any notes or remarks for this invoice...'
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={reverseCharge}
                        onChange={(e) => setReverseCharge(e.target.checked)}
                      />
                    }
                    label='Reverse Charge Applicable'
                  />
                </Stack>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3 }}>
                <Typography variant='h6' gutterBottom>
                  Invoice Summary
                </Typography>
                <Stack spacing={1}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography color='text.secondary'>Subtotal:</Typography>
                    <Typography fontFamily='monospace'>
                      {formatCurrency(totals.subTotal)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography color='text.secondary'>
                      Taxable Amount:
                    </Typography>
                    <Typography fontFamily='monospace'>
                      {formatCurrency(totals.taxableTotal)}
                    </Typography>
                  </Box>
                  {/* Display taxes grouped by rate */}
                  {taxSummary.entries
                    .filter(
                      (e) =>
                        e.type === 'CGST' ||
                        e.type === 'SGST' ||
                        e.type === 'IGST' ||
                        e.type === 'CESS'
                    )
                    .map((entry, idx) => (
                      <Box
                        key={`${entry.type}-${entry.rate}-${idx}`}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Typography color='text.secondary'>
                          {entry.name}:
                        </Typography>
                        <Typography fontFamily='monospace'>
                          {formatCurrency(entry.amount)}
                        </Typography>
                      </Box>
                    ))}
                  {/* Display invoice-level tax/discount entries */}
                  {totals.taxDiscountCalc?.entries.map((entry, idx) => (
                    <Box
                      key={`entry-${idx}`}
                      sx={{ display: 'flex', justifyContent: 'space-between' }}
                    >
                      <Typography color='text.secondary'>
                        {entry.name}
                        {entry.rateType === 'PERCENT'
                          ? ` (${entry.rate}%)`
                          : ''}
                        :
                      </Typography>
                      <Typography
                        fontFamily='monospace'
                        color={
                          entry.entryType === 'DISCOUNT'
                            ? 'error.main'
                            : 'success.main'
                        }
                      >
                        {entry.entryType === 'DISCOUNT' ? '-' : '+'}
                        {formatCurrency(entry.amount)}
                      </Typography>
                    </Box>
                  ))}
                  <Divider />
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant='h6'>Grand Total:</Typography>
                    <Typography
                      variant='h6'
                      fontFamily='monospace'
                      color='primary'
                    >
                      {formatCurrency(totals.grandTotal)}
                    </Typography>
                  </Box>
                  {paymentStatus !== 'Unpaid' && paidAmount > 0 && (
                    <>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Typography color='text.secondary'>
                          Paid Amount:
                        </Typography>
                        <Typography fontFamily='monospace' color='success.main'>
                          {formatCurrency(paidAmount)}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Typography color='text.secondary'>
                          Due Amount:
                        </Typography>
                        <Typography fontFamily='monospace'>
                          {formatCurrency(
                            Math.max(0, totals.grandTotal - paidAmount)
                          )}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Stack>
              </Card>
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              pt: 2,
            }}
          >
            {!isEdit && (
              <Button
                variant='outlined'
                size='large'
                startIcon={<Refresh />}
                onClick={handleReset}
                disabled={saving}
                sx={{ minWidth: 140 }}
              >
                Reset
              </Button>
            )}
            <Button
              variant='contained'
              size='large'
              startIcon={<Save />}
              onClick={handleSubmit}
              disabled={saving}
              sx={{ minWidth: 180 }}
            >
              {saving
                ? 'Saving...'
                : isEdit
                  ? 'Update Invoice'
                  : 'Create Invoice'}
            </Button>
          </Box>
        </Stack>
      </Box>

      {/* Overpayment Warning Dialog */}
      {existingInvoice && (
        <OverpaymentWarningDialog
          open={showOverpaymentDialog}
          previousTotal={existingInvoice.grandTotal}
          newTotal={totals.grandTotal}
          paidAmount={existingInvoice.paidAmount}
          onCancel={() => setShowOverpaymentDialog(false)}
          onAdjust={async () => {
            setShowOverpaymentDialog(false);
            // Proceed with save - the backend will adjust the paid amount
            setSaving(true);
            setError(null);

            try {
              const itemsPayload: InvoiceItemInput[] = invoiceItems.map(
                (item, idx) => ({
                  itemId: item.itemId,
                  name: item.name,
                  description: item.description || undefined,
                  hsnCode: item.hsnCode || undefined,
                  quantity: item.quantity,
                  unit: item.unit,
                  rate: item.rate,
                  taxTemplateId: item.taxTemplateId,
                  customTaxRate: item.customTaxRate,
                  cessTemplateId: item.cessTemplateId,
                  customCessRate: item.customCessRate,
                  sortOrder: idx,
                })
              );

              // Convert entries to input format
              const taxDiscountEntriesPayload: InvoiceTaxDiscountInput[] =
                taxDiscountEntries.map((e, i) => ({
                  entryType: e.entryType,
                  taxTemplateId: e.taxTemplateId,
                  discountTemplateId: e.discountTemplateId,
                  name: e.name,
                  rateType: e.rateType,
                  rate: e.rate,
                  applicationMode: e.applicationMode,
                  sortOrder: e.sortOrder ?? i,
                }));

              await window.invoiceApi?.updateInvoice({
                id: Number(id),
                invoiceDate,
                items: itemsPayload,
                taxDiscountEntries: taxDiscountEntriesPayload,
                paymentMethodId: selectedPaymentMethod?.id,
                notes: notes || undefined,
                reverseCharge,
              });
              showSuccess('Invoice updated successfully');
              navigate(Routes.Invoices);
            } catch (err) {
              showError(
                err instanceof Error ? err.message : 'Failed to save invoice'
              );
            } finally {
              setSaving(false);
            }
          }}
        />
      )}
    </LocalizationProvider>
  );
}
