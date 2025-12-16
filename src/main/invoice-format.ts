import { invoiceFormatsTable } from '@db/schema/invoice-formats';
import { invoicesTable } from '@db/schema/invoices';
import { companiesTable } from '@db/schema/companies';
import { getActiveDb } from './company-manager';
import { ipcMain } from 'electron';
import { InvoiceFormatIpcChannel, formatIpcError } from '@shared/ipc';
import {
  InvoiceFormat,
  CreateInvoiceFormatRequest,
  UpdateInvoiceFormatRequest,
  RenderInvoiceRequest,
  RenderInvoiceResponse,
  GeneratePdfRequest,
  GeneratePdfResponse,
} from '@shared/invoice-format';
import { getFullHtmlDocument } from './template-engine';
import { generateAndSavePdf, printHtml, PdfOptions } from './pdf-generator';
import {
  DEFAULT_TEMPLATE_NAME,
  DEFAULT_TEMPLATE_DESCRIPTION,
  DEFAULT_HTML_TEMPLATE,
  DEFAULT_CSS_STYLES,
  NON_GST_TEMPLATE_NAME,
  NON_GST_TEMPLATE_DESCRIPTION,
  NON_GST_HTML_TEMPLATE,
  NON_GST_CSS_STYLES,
} from './default-templates';
import { eq, desc, and } from 'drizzle-orm';

// Import getInvoice function - we'll need to get it from invoice.ts
// For now, we'll implement a local version
import { customersTable } from '@db/schema/customers';
import { invoiceSeriesTable } from '@db/schema/invoice-series';
import { paymentMethodsTable } from '@db/schema/payment-methods';
import { invoiceItemsTable } from '@db/schema/invoice-items';
import { invoiceItemTaxesDiscountsTable } from '@db/schema/invoice-item-taxes-discounts';
import { invoiceTaxesDiscountsTable } from '@db/schema/invoice-taxes-discounts';
import { invoicePaymentsTable } from '@db/schema/invoice-payments';
import {
  InvoiceWithDetails,
  InvoiceItemWithDetails,
  InvoicePaymentWithDetails,
} from '@shared/invoice';
import { asc } from 'drizzle-orm';

// ============================================
// Helper Functions
// ============================================

function getInvoiceWithDetails(id: number): InvoiceWithDetails | undefined {
  const db = getActiveDb();
  const invoice = db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.id, id))
    .get();

  if (!invoice) return undefined;

  const customer = db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, invoice.customerId))
    .get();

  const invoiceSeries = db
    .select()
    .from(invoiceSeriesTable)
    .where(eq(invoiceSeriesTable.id, invoice.invoiceSeriesId))
    .get();

  let paymentMethod;
  if (invoice.paymentMethodId) {
    paymentMethod = db
      .select()
      .from(paymentMethodsTable)
      .where(eq(paymentMethodsTable.id, invoice.paymentMethodId))
      .get();
  }

  const items = db
    .select()
    .from(invoiceItemsTable)
    .where(eq(invoiceItemsTable.invoiceId, id))
    .orderBy(asc(invoiceItemsTable.sortOrder))
    .all();

  const itemsWithDetails: InvoiceItemWithDetails[] = items.map((item) => {
    const taxesDiscounts = db
      .select()
      .from(invoiceItemTaxesDiscountsTable)
      .where(eq(invoiceItemTaxesDiscountsTable.invoiceItemId, item.id))
      .orderBy(asc(invoiceItemTaxesDiscountsTable.sortOrder))
      .all();

    return {
      ...item,
      taxesDiscounts,
    };
  });

  const payments = db
    .select()
    .from(invoicePaymentsTable)
    .where(eq(invoicePaymentsTable.invoiceId, id))
    .orderBy(desc(invoicePaymentsTable.paymentDate))
    .all();

  const paymentsWithDetails: InvoicePaymentWithDetails[] = payments.map(
    (payment) => {
      let method;
      if (payment.paymentMethodId) {
        method = db
          .select()
          .from(paymentMethodsTable)
          .where(eq(paymentMethodsTable.id, payment.paymentMethodId))
          .get();
      }
      return { ...payment, paymentMethod: method ?? null };
    }
  );

  const taxDiscountEntries = db
    .select()
    .from(invoiceTaxesDiscountsTable)
    .where(eq(invoiceTaxesDiscountsTable.invoiceId, id))
    .orderBy(asc(invoiceTaxesDiscountsTable.sortOrder))
    .all();

  return {
    ...invoice,
    customer,
    invoiceSeries,
    paymentMethod,
    items: itemsWithDetails,
    payments: paymentsWithDetails,
    taxDiscountEntries,
  };
}

function getCompany() {
  const db = getActiveDb();
  return db.select().from(companiesTable).limit(1).get();
}

// ============================================
// Database Operations
// ============================================

function createInvoiceFormat(data: CreateInvoiceFormatRequest): InvoiceFormat {
  const db = getActiveDb();

  const format = db
    .insert(invoiceFormatsTable)
    .values({
      name: data.name,
      description: data.description,
      htmlTemplate: data.htmlTemplate,
      cssStyles: data.cssStyles,
      paperSize: data.paperSize ?? 'A4',
      orientation: data.orientation ?? 'portrait',
      marginTop: data.marginTop ?? 10,
      marginRight: data.marginRight ?? 10,
      marginBottom: data.marginBottom ?? 10,
      marginLeft: data.marginLeft ?? 10,
    })
    .returning()
    .get();

  return format;
}

function updateInvoiceFormat(
  id: number,
  data: Omit<UpdateInvoiceFormatRequest, 'id'>
): InvoiceFormat {
  const db = getActiveDb();

  const existing = db
    .select()
    .from(invoiceFormatsTable)
    .where(eq(invoiceFormatsTable.id, id))
    .get();

  if (!existing) {
    throw new Error('Invoice format not found');
  }

  // Allow editing system templates - only protect the name for system templates
  const updateName = existing.isSystemTemplate
    ? existing.name
    : (data.name ?? existing.name);

  db.update(invoiceFormatsTable)
    .set({
      name: updateName,
      description: data.description ?? existing.description,
      htmlTemplate: data.htmlTemplate ?? existing.htmlTemplate,
      cssStyles: data.cssStyles ?? existing.cssStyles,
      isActive: data.isActive ?? existing.isActive,
      paperSize: data.paperSize ?? existing.paperSize,
      orientation: data.orientation ?? existing.orientation,
      marginTop: data.marginTop ?? existing.marginTop,
      marginRight: data.marginRight ?? existing.marginRight,
      marginBottom: data.marginBottom ?? existing.marginBottom,
      marginLeft: data.marginLeft ?? existing.marginLeft,
      updatedAt: new Date(),
    })
    .where(eq(invoiceFormatsTable.id, id))
    .run();

  return db
    .select()
    .from(invoiceFormatsTable)
    .where(eq(invoiceFormatsTable.id, id))
    .get()!;
}

function getInvoiceFormat(id: number): InvoiceFormat | undefined {
  const db = getActiveDb();
  return db
    .select()
    .from(invoiceFormatsTable)
    .where(eq(invoiceFormatsTable.id, id))
    .get();
}

function listInvoiceFormats(): InvoiceFormat[] {
  const db = getActiveDb();
  return db
    .select()
    .from(invoiceFormatsTable)
    .orderBy(
      desc(invoiceFormatsTable.isDefault),
      desc(invoiceFormatsTable.createdAt)
    )
    .all();
}

function listActiveInvoiceFormats(): InvoiceFormat[] {
  const db = getActiveDb();
  return db
    .select()
    .from(invoiceFormatsTable)
    .where(eq(invoiceFormatsTable.isActive, true))
    .orderBy(
      desc(invoiceFormatsTable.isDefault),
      desc(invoiceFormatsTable.createdAt)
    )
    .all();
}

function deleteInvoiceFormat(id: number): void {
  const db = getActiveDb();

  const existing = db
    .select()
    .from(invoiceFormatsTable)
    .where(eq(invoiceFormatsTable.id, id))
    .get();

  if (!existing) {
    throw new Error('Invoice format not found');
  }

  if (existing.isSystemTemplate) {
    throw new Error('System templates cannot be deleted');
  }

  if (existing.isDefault) {
    throw new Error(
      'Cannot delete the default format. Set another format as default first.'
    );
  }

  // Soft delete - set isActive to false
  db.update(invoiceFormatsTable)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(invoiceFormatsTable.id, id))
    .run();
}

function duplicateInvoiceFormat(id: number): InvoiceFormat {
  const db = getActiveDb();

  const existing = db
    .select()
    .from(invoiceFormatsTable)
    .where(eq(invoiceFormatsTable.id, id))
    .get();

  if (!existing) {
    throw new Error('Invoice format not found');
  }

  // Generate unique name
  let baseName = existing.name + ' (Copy)';
  let counter = 1;
  let newName = baseName;

  while (
    db
      .select()
      .from(invoiceFormatsTable)
      .where(eq(invoiceFormatsTable.name, newName))
      .get()
  ) {
    counter++;
    newName = `${baseName} ${counter}`;
  }

  const duplicate = db
    .insert(invoiceFormatsTable)
    .values({
      name: newName,
      description: existing.description,
      htmlTemplate: existing.htmlTemplate,
      cssStyles: existing.cssStyles,
      paperSize: existing.paperSize,
      orientation: existing.orientation,
      marginTop: existing.marginTop,
      marginRight: existing.marginRight,
      marginBottom: existing.marginBottom,
      marginLeft: existing.marginLeft,
      isDefault: false,
      isActive: true,
      isSystemTemplate: false,
    })
    .returning()
    .get();

  return duplicate;
}

function setDefaultInvoiceFormat(id: number): InvoiceFormat {
  const db = getActiveDb();

  const format = db
    .select()
    .from(invoiceFormatsTable)
    .where(eq(invoiceFormatsTable.id, id))
    .get();

  if (!format) {
    throw new Error('Invoice format not found');
  }

  if (!format.isActive) {
    throw new Error('Cannot set an inactive format as default');
  }

  // Remove default from all formats
  db.update(invoiceFormatsTable)
    .set({ isDefault: false, updatedAt: new Date() })
    .run();

  // Set this format as default
  db.update(invoiceFormatsTable)
    .set({ isDefault: true, updatedAt: new Date() })
    .where(eq(invoiceFormatsTable.id, id))
    .run();

  return db
    .select()
    .from(invoiceFormatsTable)
    .where(eq(invoiceFormatsTable.id, id))
    .get()!;
}

function getDefaultFormat(): InvoiceFormat | undefined {
  const db = getActiveDb();
  return db
    .select()
    .from(invoiceFormatsTable)
    .where(
      and(
        eq(invoiceFormatsTable.isDefault, true),
        eq(invoiceFormatsTable.isActive, true)
      )
    )
    .get();
}

/**
 * Initialize default format templates if none exist
 * Sets the appropriate template as default based on company GST status
 */
export function initializeDefaultFormats(): void {
  const db = getActiveDb();

  // Check if any formats exist
  const existingFormats = db.select().from(invoiceFormatsTable).all();

  if (existingFormats.length === 0) {
    // Check if company has GST
    const company = db.select().from(companiesTable).limit(1).get();
    const hasGst = Boolean(company?.gstin);

    // Create the GST system template
    db.insert(invoiceFormatsTable)
      .values({
        name: DEFAULT_TEMPLATE_NAME,
        description: DEFAULT_TEMPLATE_DESCRIPTION,
        htmlTemplate: DEFAULT_HTML_TEMPLATE,
        cssStyles: DEFAULT_CSS_STYLES,
        isDefault: hasGst, // Default if company has GST
        isActive: true,
        isSystemTemplate: true,
        paperSize: 'A4',
        orientation: 'portrait',
        marginTop: 10,
        marginRight: 10,
        marginBottom: 10,
        marginLeft: 10,
      })
      .run();

    // Create the Non GST system template
    db.insert(invoiceFormatsTable)
      .values({
        name: NON_GST_TEMPLATE_NAME,
        description: NON_GST_TEMPLATE_DESCRIPTION,
        htmlTemplate: NON_GST_HTML_TEMPLATE,
        cssStyles: NON_GST_CSS_STYLES,
        isDefault: !hasGst, // Default if company does NOT have GST
        isActive: true,
        isSystemTemplate: true,
        paperSize: 'A4',
        orientation: 'portrait',
        marginTop: 10,
        marginRight: 10,
        marginBottom: 10,
        marginLeft: 10,
      })
      .run();
  }
}

// ============================================
// Rendering Functions
// ============================================

function renderInvoice(data: RenderInvoiceRequest): RenderInvoiceResponse {
  const invoice = getInvoiceWithDetails(data.invoiceId);
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  const company = getCompany();
  if (!company) {
    throw new Error('Company not found');
  }

  // Get format - use provided formatId, or invoice's format, or default
  let format: InvoiceFormat | undefined;

  if (data.formatId) {
    format = getInvoiceFormat(data.formatId);
  } else if (invoice.invoiceFormatId) {
    format = getInvoiceFormat(invoice.invoiceFormatId);
  }

  if (!format) {
    format = getDefaultFormat();
  }

  if (!format) {
    throw new Error('No invoice format available');
  }

  const html = getFullHtmlDocument(invoice, company, format);

  return {
    html,
    css: format.cssStyles,
  };
}

async function generatePdf(
  data: GeneratePdfRequest
): Promise<GeneratePdfResponse> {
  const invoice = getInvoiceWithDetails(data.invoiceId);
  if (!invoice) {
    return { success: false, error: 'Invoice not found' };
  }

  const company = getCompany();
  if (!company) {
    return { success: false, error: 'Company not found' };
  }

  // Get format
  let format: InvoiceFormat | undefined;

  if (data.formatId) {
    format = getInvoiceFormat(data.formatId);
  } else if (invoice.invoiceFormatId) {
    format = getInvoiceFormat(invoice.invoiceFormatId);
  }

  if (!format) {
    format = getDefaultFormat();
  }

  if (!format) {
    return { success: false, error: 'No invoice format available' };
  }

  const html = getFullHtmlDocument(invoice, company, format);

  const pdfOptions: PdfOptions = {
    paperSize: format.paperSize as 'A4' | 'Letter' | 'Legal',
    orientation: format.orientation as 'portrait' | 'landscape',
    margins: {
      top: format.marginTop,
      right: format.marginRight,
      bottom: format.marginBottom,
      left: format.marginLeft,
    },
  };

  const defaultFileName = `Invoice_${invoice.invoiceNumber.replace(/[/\\]/g, '-')}_${invoice.customer?.name?.replace(/[/\\]/g, '-') ?? 'Customer'}.pdf`;

  return generateAndSavePdf(html, pdfOptions, defaultFileName, data.savePath);
}

async function printInvoice(
  invoiceId: number,
  formatId?: number
): Promise<boolean> {
  const invoice = getInvoiceWithDetails(invoiceId);
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  const company = getCompany();
  if (!company) {
    throw new Error('Company not found');
  }

  // Get format
  let format: InvoiceFormat | undefined;

  if (formatId) {
    format = getInvoiceFormat(formatId);
  } else if (invoice.invoiceFormatId) {
    format = getInvoiceFormat(invoice.invoiceFormatId);
  }

  if (!format) {
    format = getDefaultFormat();
  }

  if (!format) {
    throw new Error('No invoice format available');
  }

  const html = getFullHtmlDocument(invoice, company, format);

  return printHtml(html);
}

// ============================================
// IPC Handlers
// ============================================

export function registerInvoiceFormatHandlers() {
  ipcMain.handle(
    InvoiceFormatIpcChannel.Create,
    async (_event, data: CreateInvoiceFormatRequest) => {
      try {
        return createInvoiceFormat(data);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    InvoiceFormatIpcChannel.Update,
    async (_event, data: UpdateInvoiceFormatRequest) => {
      try {
        const { id, ...updateData } = data;
        return updateInvoiceFormat(id, updateData);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(InvoiceFormatIpcChannel.Get, async (_event, id: number) => {
    try {
      return getInvoiceFormat(id);
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });

  ipcMain.handle(InvoiceFormatIpcChannel.List, async () => {
    try {
      return listInvoiceFormats();
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });

  ipcMain.handle(InvoiceFormatIpcChannel.ListActive, async () => {
    try {
      return listActiveInvoiceFormats();
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });

  ipcMain.handle(InvoiceFormatIpcChannel.Delete, async (_event, id: number) => {
    try {
      deleteInvoiceFormat(id);
      return true;
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });

  ipcMain.handle(
    InvoiceFormatIpcChannel.Duplicate,
    async (_event, id: number) => {
      try {
        return duplicateInvoiceFormat(id);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    InvoiceFormatIpcChannel.SetDefault,
    async (_event, id: number) => {
      try {
        return setDefaultInvoiceFormat(id);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    InvoiceFormatIpcChannel.RenderInvoice,
    async (_event, data: RenderInvoiceRequest) => {
      try {
        return renderInvoice(data);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    InvoiceFormatIpcChannel.GeneratePdf,
    async (_event, data: GeneratePdfRequest) => {
      try {
        return await generatePdf(data);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    InvoiceFormatIpcChannel.PrintInvoice,
    async (_event, invoiceId: number, formatId?: number) => {
      try {
        return await printInvoice(invoiceId, formatId);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(InvoiceFormatIpcChannel.InitializeDefaults, async () => {
    try {
      initializeDefaultFormats();
      return true;
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });
}
