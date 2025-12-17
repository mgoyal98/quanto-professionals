import { invoiceSeriesTable } from '@db/schema/invoice-series';
import {
  CreateInvoiceSeriesRequest,
  UpdateInvoiceSeriesRequest,
} from '@shared/invoice-series';
import { getActiveDb } from './company-manager';
import { dialog, ipcMain } from 'electron';
import { InvoiceSeriesIpcChannel, formatIpcError } from '@shared/ipc';
import { and, asc, eq, ne } from 'drizzle-orm';

// ============================================
// Database Operations
// ============================================

/**
 * Seed default invoice series if no series exist
 */
export function seedInvoiceSeries() {
  const db = getActiveDb();
  const existing = db.select().from(invoiceSeriesTable).all();

  if (existing.length === 0) {
    db.insert(invoiceSeriesTable)
      .values({
        name: 'Default',
        isDefault: true,
        startWith: 1,
        nextNumber: 1,
      })
      .run();
  }
}

function createInvoiceSeries(data: CreateInvoiceSeriesRequest) {
  const db = getActiveDb();

  // If this is set as default, unset all other defaults first
  if (data.isDefault) {
    db.update(invoiceSeriesTable)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(invoiceSeriesTable.isDefault, true))
      .run();
  }

  // Set nextNumber to startWith if provided
  const insertData = {
    ...data,
    nextNumber: data.startWith ?? 1,
  };

  const result = db.insert(invoiceSeriesTable).values(insertData).returning();
  return result.get();
}

function getInvoiceSeries(id: number) {
  const db = getActiveDb();
  const result = db
    .select()
    .from(invoiceSeriesTable)
    .where(eq(invoiceSeriesTable.id, id))
    .get();
  return result;
}

function updateInvoiceSeries(
  id: number,
  data: Omit<UpdateInvoiceSeriesRequest, 'id'>
) {
  const db = getActiveDb();

  // If setting as default, unset all other defaults first
  if (data.isDefault) {
    db.update(invoiceSeriesTable)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(
        and(
          eq(invoiceSeriesTable.isDefault, true),
          ne(invoiceSeriesTable.id, id)
        )
      )
      .run();
  }

  const result = db
    .update(invoiceSeriesTable)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(invoiceSeriesTable.id, id))
    .returning();
  return result.get();
}

function listInvoiceSeries() {
  const db = getActiveDb();
  const result = db
    .select()
    .from(invoiceSeriesTable)
    .where(eq(invoiceSeriesTable.isArchived, false))
    .orderBy(asc(invoiceSeriesTable.name))
    .all();
  return result;
}

function listArchivedInvoiceSeries() {
  const db = getActiveDb();
  const result = db
    .select()
    .from(invoiceSeriesTable)
    .where(eq(invoiceSeriesTable.isArchived, true))
    .orderBy(asc(invoiceSeriesTable.name))
    .all();
  return result;
}

function archiveInvoiceSeries(id: number) {
  const db = getActiveDb();

  // Check if it's the default series
  const series = db
    .select()
    .from(invoiceSeriesTable)
    .where(eq(invoiceSeriesTable.id, id))
    .get();

  if (series?.isDefault) {
    throw new Error(
      'Cannot archive the default series. Please set another series as default first.'
    );
  }

  const result = db
    .update(invoiceSeriesTable)
    .set({ isArchived: true, updatedAt: new Date() })
    .where(eq(invoiceSeriesTable.id, id))
    .returning();
  return result.get();
}

function restoreInvoiceSeries(id: number) {
  const db = getActiveDb();
  const result = db
    .update(invoiceSeriesTable)
    .set({ isArchived: false, updatedAt: new Date() })
    .where(eq(invoiceSeriesTable.id, id))
    .returning();
  return result.get();
}

function setDefaultSeries(id: number) {
  const db = getActiveDb();

  // Unset all other defaults
  db.update(invoiceSeriesTable)
    .set({ isDefault: false, updatedAt: new Date() })
    .where(eq(invoiceSeriesTable.isDefault, true))
    .run();

  // Set the new default
  const result = db
    .update(invoiceSeriesTable)
    .set({ isDefault: true, updatedAt: new Date() })
    .where(eq(invoiceSeriesTable.id, id))
    .returning();
  return result.get();
}

function getNextNumber(id: number) {
  const db = getActiveDb();
  const series = db
    .select({ nextNumber: invoiceSeriesTable.nextNumber })
    .from(invoiceSeriesTable)
    .where(eq(invoiceSeriesTable.id, id))
    .get();
  return series?.nextNumber ?? null;
}

function incrementNextNumber(id: number) {
  const db = getActiveDb();

  const series = db
    .select()
    .from(invoiceSeriesTable)
    .where(eq(invoiceSeriesTable.id, id))
    .get();

  if (!series) {
    throw new Error('Invoice series not found.');
  }

  const result = db
    .update(invoiceSeriesTable)
    .set({
      nextNumber: series.nextNumber + 1,
      updatedAt: new Date(),
    })
    .where(eq(invoiceSeriesTable.id, id))
    .returning();
  return result.get();
}

// ============================================
// IPC Handlers
// ============================================

export function registerInvoiceSeriesHandlers() {
  ipcMain.handle(
    InvoiceSeriesIpcChannel.Create,
    async (_event, data: CreateInvoiceSeriesRequest) => {
      try {
        return createInvoiceSeries(data);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(InvoiceSeriesIpcChannel.Get, async (_event, id: number) => {
    try {
      return getInvoiceSeries(id);
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });

  ipcMain.handle(
    InvoiceSeriesIpcChannel.Update,
    async (_event, data: UpdateInvoiceSeriesRequest) => {
      try {
        const { id, ...updateData } = data;
        return updateInvoiceSeries(id, updateData);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(InvoiceSeriesIpcChannel.List, async () => {
    try {
      return listInvoiceSeries();
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });

  ipcMain.handle(InvoiceSeriesIpcChannel.ListArchived, async () => {
    try {
      return listArchivedInvoiceSeries();
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });

  ipcMain.handle(
    InvoiceSeriesIpcChannel.Archive,
    async (_event, id: number, name: string) => {
      try {
        const result = await dialog.showMessageBox({
          type: 'warning',
          message: `Are you sure you want to archive this invoice series (${name})?`,
          detail: 'Archived series cannot be used for new invoices.',
          buttons: ['Yes', 'No'],
        });
        if (result.response === 0) {
          archiveInvoiceSeries(id);
          return true;
        }
        return false;
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    InvoiceSeriesIpcChannel.Restore,
    async (_event, id: number, name: string) => {
      try {
        const result = await dialog.showMessageBox({
          type: 'info',
          message: `Are you sure you want to restore this invoice series (${name})?`,
          buttons: ['Yes', 'No'],
        });
        if (result.response === 0) {
          restoreInvoiceSeries(id);
          return true;
        }
        return false;
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    InvoiceSeriesIpcChannel.SetDefault,
    async (_event, id: number) => {
      try {
        return setDefaultSeries(id);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    InvoiceSeriesIpcChannel.GetNextNumber,
    async (_event, id: number) => {
      try {
        return getNextNumber(id);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    InvoiceSeriesIpcChannel.IncrementNumber,
    async (_event, id: number) => {
      try {
        return incrementNextNumber(id);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );
}
