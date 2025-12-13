import { paymentMethodsTable } from '@db/schema/payment-methods';
import { getActiveDb } from './company-manager';
import { dialog, ipcMain } from 'electron';
import { PaymentMethodIpcChannel, formatIpcError } from '@shared/ipc';
import {
  CreatePaymentMethodRequest,
  UpdatePaymentMethodRequest,
  STANDARD_PAYMENT_METHODS,
  isValidIfscCode,
  isValidUpiId,
} from '@shared/payment-method';
import { eq, asc, and, ne } from 'drizzle-orm';

// ============================================
// Database Operations
// ============================================

/**
 * Seed standard payment methods if no methods exist
 */
export function seedPaymentMethods() {
  const db = getActiveDb();
  const existing = db.select().from(paymentMethodsTable).all();

  if (existing.length === 0) {
    for (const method of STANDARD_PAYMENT_METHODS) {
      db.insert(paymentMethodsTable).values(method).run();
    }
  }
}

function createPaymentMethod(data: CreatePaymentMethodRequest) {
  const db = getActiveDb();

  // Validate IFSC code if provided
  if (data.ifscCode && !isValidIfscCode(data.ifscCode)) {
    throw new Error(
      'Invalid IFSC code format. Must be 4 letters followed by 0 and 6 alphanumeric characters.'
    );
  }

  // Validate UPI ID if provided
  if (data.upiId && !isValidUpiId(data.upiId)) {
    throw new Error('Invalid UPI ID format. Must be in format: user@provider');
  }

  // If this is default, unset other defaults
  if (data.isDefault) {
    db.update(paymentMethodsTable)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(paymentMethodsTable.isDefault, true))
      .run();
  }

  return db
    .insert(paymentMethodsTable)
    .values({
      ...data,
      ifscCode: data.ifscCode?.toUpperCase(),
    })
    .returning()
    .get();
}

function getPaymentMethod(id: number) {
  const db = getActiveDb();
  return db
    .select()
    .from(paymentMethodsTable)
    .where(eq(paymentMethodsTable.id, id))
    .get();
}

function updatePaymentMethod(
  id: number,
  data: Omit<UpdatePaymentMethodRequest, 'id'>
) {
  const db = getActiveDb();

  // Validate IFSC code if provided
  if (data.ifscCode && !isValidIfscCode(data.ifscCode)) {
    throw new Error(
      'Invalid IFSC code format. Must be 4 letters followed by 0 and 6 alphanumeric characters.'
    );
  }

  // Validate UPI ID if provided
  if (data.upiId && !isValidUpiId(data.upiId)) {
    throw new Error('Invalid UPI ID format. Must be in format: user@provider');
  }

  // If this is default, unset other defaults
  if (data.isDefault) {
    db.update(paymentMethodsTable)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(
        and(
          eq(paymentMethodsTable.isDefault, true),
          ne(paymentMethodsTable.id, id)
        )
      )
      .run();
  }

  return db
    .update(paymentMethodsTable)
    .set({
      ...data,
      ifscCode: data.ifscCode?.toUpperCase(),
      updatedAt: new Date(),
    })
    .where(eq(paymentMethodsTable.id, id))
    .returning()
    .get();
}

function listPaymentMethods() {
  const db = getActiveDb();
  return db
    .select()
    .from(paymentMethodsTable)
    .where(eq(paymentMethodsTable.isActive, true))
    .orderBy(asc(paymentMethodsTable.type), asc(paymentMethodsTable.name))
    .all();
}

function listArchivedPaymentMethods() {
  const db = getActiveDb();
  return db
    .select()
    .from(paymentMethodsTable)
    .where(eq(paymentMethodsTable.isActive, false))
    .orderBy(asc(paymentMethodsTable.type), asc(paymentMethodsTable.name))
    .all();
}

function archivePaymentMethod(id: number) {
  const db = getActiveDb();

  // Check if it's the default method
  const method = db
    .select()
    .from(paymentMethodsTable)
    .where(eq(paymentMethodsTable.id, id))
    .get();

  if (method?.isDefault) {
    throw new Error(
      'Cannot archive the default payment method. Please set another method as default first.'
    );
  }

  return db
    .update(paymentMethodsTable)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(paymentMethodsTable.id, id))
    .returning()
    .get();
}

function restorePaymentMethod(id: number) {
  const db = getActiveDb();
  return db
    .update(paymentMethodsTable)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(paymentMethodsTable.id, id))
    .returning()
    .get();
}

function setDefaultPaymentMethod(id: number) {
  const db = getActiveDb();

  // Unset all other defaults
  db.update(paymentMethodsTable)
    .set({ isDefault: false, updatedAt: new Date() })
    .where(eq(paymentMethodsTable.isDefault, true))
    .run();

  // Set the new default
  return db
    .update(paymentMethodsTable)
    .set({ isDefault: true, updatedAt: new Date() })
    .where(eq(paymentMethodsTable.id, id))
    .returning()
    .get();
}

// ============================================
// IPC Handlers
// ============================================

export function registerPaymentMethodHandlers() {
  ipcMain.handle(
    PaymentMethodIpcChannel.Create,
    async (_event, data: CreatePaymentMethodRequest) => {
      try {
        return createPaymentMethod(data);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(PaymentMethodIpcChannel.Get, async (_event, id: number) => {
    try {
      return getPaymentMethod(id);
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });

  ipcMain.handle(
    PaymentMethodIpcChannel.Update,
    async (_event, data: UpdatePaymentMethodRequest) => {
      try {
        const { id, ...updateData } = data;
        return updatePaymentMethod(id, updateData);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(PaymentMethodIpcChannel.List, async () => {
    try {
      return listPaymentMethods();
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });

  ipcMain.handle(PaymentMethodIpcChannel.ListArchived, async () => {
    try {
      return listArchivedPaymentMethods();
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });

  ipcMain.handle(
    PaymentMethodIpcChannel.Archive,
    async (_event, id: number, name: string) => {
      try {
        const result = await dialog.showMessageBox({
          type: 'warning',
          message: `Are you sure you want to archive this payment method (${name})?`,
          detail: 'Archived payment methods cannot be used for new invoices.',
          buttons: ['Yes', 'No'],
        });
        if (result.response === 0) {
          archivePaymentMethod(id);
          return true;
        }
        return false;
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    PaymentMethodIpcChannel.Restore,
    async (_event, id: number, name: string) => {
      try {
        const result = await dialog.showMessageBox({
          type: 'info',
          message: `Are you sure you want to restore this payment method (${name})?`,
          buttons: ['Yes', 'No'],
        });
        if (result.response === 0) {
          restorePaymentMethod(id);
          return true;
        }
        return false;
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    PaymentMethodIpcChannel.SetDefault,
    async (_event, id: number) => {
      try {
        return setDefaultPaymentMethod(id);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );
}

