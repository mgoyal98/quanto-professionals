import { useMemo } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

import { TaxTemplate } from '@shared/tax-template';
import { DiscountTemplate } from '@shared/discount';
import {
  InvoiceTaxDiscountInput,
  InvoiceTaxDiscountEntryType,
  RateType,
  formatCurrency,
  calculateInvoiceTaxDiscountEntries,
} from '@shared/invoice';

export interface InvoiceTaxDiscountEntryRow extends InvoiceTaxDiscountInput {
  id: string; // temporary ID for React key
}

interface InvoiceTaxDiscountEntriesProps {
  entries: InvoiceTaxDiscountEntryRow[];
  taxTemplates: TaxTemplate[];
  discountTemplates: DiscountTemplate[];
  taxableTotal: number;
  intermediateTotal: number; // Total after line item taxes (taxable + GST + CESS)
  onChange: (entries: InvoiceTaxDiscountEntryRow[]) => void;
}

function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default function InvoiceTaxDiscountEntries({
  entries,
  taxTemplates,
  discountTemplates,
  taxableTotal,
  intermediateTotal,
  onChange,
}: InvoiceTaxDiscountEntriesProps) {
  // Calculate amounts for each entry
  const calculatedEntries = useMemo(() => {
    const inputs: InvoiceTaxDiscountInput[] = entries.map((e, i) => ({
      ...e,
      sortOrder: e.sortOrder ?? i,
    }));
    return calculateInvoiceTaxDiscountEntries(
      inputs,
      taxableTotal,
      intermediateTotal
    );
  }, [entries, taxableTotal, intermediateTotal]);

  // Get custom tax templates only (for invoice-level taxes)
  const customTaxTemplates = taxTemplates.filter((t) => t.taxType === 'CUSTOM');

  const handleAddEntry = () => {
    const newEntry: InvoiceTaxDiscountEntryRow = {
      id: generateTempId(),
      entryType: 'DISCOUNT',
      taxTemplateId: null,
      discountTemplateId: null,
      name: '',
      rateType: 'PERCENT',
      rate: 0,
      applicationMode: 'AFTER_TAX',
      sortOrder: entries.length,
    };
    onChange([...entries, newEntry]);
  };

  const handleRemoveEntry = (entryId: string) => {
    onChange(entries.filter((e) => e.id !== entryId));
  };

  const handleEntryChange = (
    entryId: string,
    field: keyof InvoiceTaxDiscountEntryRow,
    value: unknown
  ) => {
    onChange(
      entries.map((entry) => {
        if (entry.id !== entryId) return entry;

        // Handle entry type change - clear template refs and name
        if (field === 'entryType') {
          return {
            ...entry,
            entryType: value as InvoiceTaxDiscountEntryType,
            taxTemplateId: null,
            discountTemplateId: null,
            name: '',
          };
        }

        return { ...entry, [field]: value };
      })
    );
  };

  const handleSelectTemplate = (
    entryId: string,
    template: TaxTemplate | DiscountTemplate | null,
    entryType: InvoiceTaxDiscountEntryType
  ) => {
    onChange(
      entries.map((entry) => {
        if (entry.id !== entryId) return entry;

        if (!template) {
          // Clear template selection
          return {
            ...entry,
            taxTemplateId: null,
            discountTemplateId: null,
          };
        }

        if (entryType === 'TAX') {
          const taxTemplate = template as TaxTemplate;
          return {
            ...entry,
            taxTemplateId: taxTemplate.id,
            discountTemplateId: null,
            name: taxTemplate.name,
            rateType: (taxTemplate.rateType as RateType) || 'PERCENT',
            rate: taxTemplate.rate,
          };
        } else {
          const discountTemplate = template as DiscountTemplate;
          return {
            ...entry,
            taxTemplateId: null,
            discountTemplateId: discountTemplate.id,
            name: discountTemplate.name,
            rateType: discountTemplate.type as RateType,
            rate: discountTemplate.value,
          };
        }
      })
    );
  };

  // Get amount for a specific entry by its id
  const getCalculatedAmount = (entryId: string, index: number): number => {
    // Find the corresponding calculated entry by sortOrder or index
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return 0;

    const calcEntry = calculatedEntries.entries.find(
      (ce) => ce.sortOrder === (entry.sortOrder ?? index)
    );
    return calcEntry?.amount ?? 0;
  };

  return (
    <Card sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant='h6'>Taxes & Discounts</Typography>
        <Button
          startIcon={<Add />}
          onClick={handleAddEntry}
          size='small'
          disabled={entries.length >= 10}
        >
          Add Entry
        </Button>
      </Box>

      {entries.length === 0 ? (
        <Typography color='text.secondary' sx={{ py: 2, textAlign: 'center' }}>
          No additional taxes or discounts. Click "Add Entry" to add.
        </Typography>
      ) : (
        <TableContainer>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 100 }}>Type</TableCell>
                <TableCell sx={{ minWidth: 180 }}>Name / Template</TableCell>
                <TableCell sx={{ width: 80 }}>Rate Type</TableCell>
                <TableCell sx={{ width: 120 }}>Rate</TableCell>
                <TableCell sx={{ width: 120 }}>Applied</TableCell>
                <TableCell align='right' sx={{ width: 120 }}>
                  Amount
                </TableCell>
                <TableCell sx={{ width: 50 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((entry, index) => {
                const templates =
                  entry.entryType === 'TAX'
                    ? customTaxTemplates
                    : discountTemplates;
                const selectedTemplate =
                  entry.entryType === 'TAX'
                    ? customTaxTemplates.find(
                        (t) => t.id === entry.taxTemplateId
                      )
                    : discountTemplates.find(
                        (d) => d.id === entry.discountTemplateId
                      );
                const amount = getCalculatedAmount(entry.id, index);

                return (
                  <TableRow key={entry.id}>
                    {/* Entry Type */}
                    <TableCell>
                      <FormControl size='small' fullWidth>
                        <Select
                          value={entry.entryType}
                          onChange={(e) =>
                            handleEntryChange(
                              entry.id,
                              'entryType',
                              e.target.value
                            )
                          }
                        >
                          <MenuItem value='TAX'>Tax/Charge</MenuItem>
                          <MenuItem value='DISCOUNT'>Discount</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>

                    {/* Template/Name Selection */}
                    <TableCell>
                      <Autocomplete
                        size='small'
                        options={templates}
                        getOptionLabel={(opt) => opt.name}
                        value={selectedTemplate ?? null}
                        onChange={(_, value) =>
                          handleSelectTemplate(
                            entry.id,
                            value as TaxTemplate | DiscountTemplate | null,
                            entry.entryType
                          )
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder={
                              entry.entryType === 'TAX'
                                ? 'Select tax'
                                : 'Select discount'
                            }
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
                                {entry.entryType === 'TAX'
                                  ? (option as TaxTemplate).rateType ===
                                    'AMOUNT'
                                    ? `₹${(option as TaxTemplate).rate}`
                                    : `${(option as TaxTemplate).rate}%`
                                  : (option as DiscountTemplate).type ===
                                      'PERCENT'
                                    ? `${(option as DiscountTemplate).value}%`
                                    : `₹${(option as DiscountTemplate).value}`}
                              </Typography>
                            </Box>
                          </li>
                        )}
                      />
                    </TableCell>

                    {/* Rate Type */}
                    <TableCell>
                      <FormControl size='small' fullWidth>
                        <Select
                          value={entry.rateType}
                          onChange={(e) =>
                            handleEntryChange(
                              entry.id,
                              'rateType',
                              e.target.value
                            )
                          }
                        >
                          <MenuItem value='PERCENT'>%</MenuItem>
                          <MenuItem value='AMOUNT'>₹</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>

                    {/* Rate Value */}
                    <TableCell>
                      <TextField
                        size='small'
                        type='number'
                        value={entry.rate}
                        onChange={(e) =>
                          handleEntryChange(
                            entry.id,
                            'rate',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        slotProps={{
                          htmlInput: { min: 0, step: 0.01 },
                          input: {
                            startAdornment:
                              entry.rateType === 'AMOUNT' ? (
                                <InputAdornment position='start'>
                                  ₹
                                </InputAdornment>
                              ) : undefined,
                            endAdornment:
                              entry.rateType === 'PERCENT' ? (
                                <InputAdornment position='end'>
                                  %
                                </InputAdornment>
                              ) : undefined,
                          },
                        }}
                        fullWidth
                      />
                    </TableCell>

                    {/* Application Mode */}
                    <TableCell>
                      <FormControl size='small' fullWidth>
                        <Select
                          value={entry.applicationMode}
                          onChange={(e) =>
                            handleEntryChange(
                              entry.id,
                              'applicationMode',
                              e.target.value
                            )
                          }
                        >
                          <MenuItem value='BEFORE_TAX'>Before Tax</MenuItem>
                          <MenuItem value='AFTER_TAX'>After Tax</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>

                    {/* Calculated Amount */}
                    <TableCell align='right'>
                      <Typography
                        fontFamily='monospace'
                        fontWeight='bold'
                        color={
                          entry.entryType === 'DISCOUNT'
                            ? 'error.main'
                            : 'success.main'
                        }
                      >
                        {entry.entryType === 'DISCOUNT' ? '-' : '+'}
                        {formatCurrency(amount)}
                      </Typography>
                    </TableCell>

                    {/* Delete Button */}
                    <TableCell>
                      <IconButton
                        size='small'
                        onClick={() => handleRemoveEntry(entry.id)}
                        color='error'
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Summary */}
      {entries.length > 0 && (
        <Stack
          spacing={0.5}
          sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}
        >
          {calculatedEntries.totalAdditionalTax > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant='body2' color='text.secondary'>
                Total Additional Charges:
              </Typography>
              <Typography
                variant='body2'
                fontFamily='monospace'
                color='success.main'
              >
                +{formatCurrency(calculatedEntries.totalAdditionalTax)}
              </Typography>
            </Box>
          )}
          {calculatedEntries.totalInvoiceDiscount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant='body2' color='text.secondary'>
                Total Discounts:
              </Typography>
              <Typography
                variant='body2'
                fontFamily='monospace'
                color='error.main'
              >
                -{formatCurrency(calculatedEntries.totalInvoiceDiscount)}
              </Typography>
            </Box>
          )}
        </Stack>
      )}
    </Card>
  );
}
