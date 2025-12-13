import { discountTemplatesTable } from '@db/schema/discount-templates';
import { getActiveDb } from './company-manager';
import { dialog, ipcMain } from 'electron';
import { DiscountTemplateIpcChannel, formatIpcError } from '@shared/ipc';
import {
  CreateDiscountTemplateRequest,
  UpdateDiscountTemplateRequest,
  STANDARD_DISCOUNT_TEMPLATES,
} from '@shared/discount';
import { eq, asc, and, ne } from 'drizzle-orm';

// ============================================
// Database Operations
// ============================================

/**
 * Seed standard discount templates if no templates exist
 */
export function seedDiscountTemplates() {
  const db = getActiveDb();
  const existing = db.select().from(discountTemplatesTable).all();

  if (existing.length === 0) {
    for (const template of STANDARD_DISCOUNT_TEMPLATES) {
      db.insert(discountTemplatesTable).values(template).run();
    }
  }
}

function createDiscountTemplate(data: CreateDiscountTemplateRequest) {
  const db = getActiveDb();

  // Validate percentage is within range
  if (data.type === 'PERCENT' && (data.value < 0 || data.value > 100)) {
    throw new Error('Percentage must be between 0 and 100');
  }

  // Validate amount is positive
  if (data.type === 'AMOUNT' && data.value < 0) {
    throw new Error('Amount must be positive');
  }

  // If this is default, unset other defaults
  if (data.isDefault) {
    db.update(discountTemplatesTable)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(discountTemplatesTable.isDefault, true))
      .run();
  }

  return db.insert(discountTemplatesTable).values(data).returning().get();
}

function getDiscountTemplate(id: number) {
  const db = getActiveDb();
  return db
    .select()
    .from(discountTemplatesTable)
    .where(eq(discountTemplatesTable.id, id))
    .get();
}

function updateDiscountTemplate(
  id: number,
  data: Omit<UpdateDiscountTemplateRequest, 'id'>
) {
  const db = getActiveDb();

  // Validate percentage is within range
  if (data.type === 'PERCENT' && (data.value < 0 || data.value > 100)) {
    throw new Error('Percentage must be between 0 and 100');
  }

  // Validate amount is positive
  if (data.type === 'AMOUNT' && data.value < 0) {
    throw new Error('Amount must be positive');
  }

  // If this is default, unset other defaults
  if (data.isDefault) {
    db.update(discountTemplatesTable)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(
        and(
          eq(discountTemplatesTable.isDefault, true),
          ne(discountTemplatesTable.id, id)
        )
      )
      .run();
  }

  return db
    .update(discountTemplatesTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(discountTemplatesTable.id, id))
    .returning()
    .get();
}

function listDiscountTemplates() {
  const db = getActiveDb();
  return db
    .select()
    .from(discountTemplatesTable)
    .where(eq(discountTemplatesTable.isActive, true))
    .orderBy(asc(discountTemplatesTable.type), asc(discountTemplatesTable.value))
    .all();
}

function listArchivedDiscountTemplates() {
  const db = getActiveDb();
  return db
    .select()
    .from(discountTemplatesTable)
    .where(eq(discountTemplatesTable.isActive, false))
    .orderBy(asc(discountTemplatesTable.type), asc(discountTemplatesTable.value))
    .all();
}

function archiveDiscountTemplate(id: number) {
  const db = getActiveDb();

  // Check if it's the default template
  const template = db
    .select()
    .from(discountTemplatesTable)
    .where(eq(discountTemplatesTable.id, id))
    .get();

  if (template?.isDefault) {
    throw new Error(
      'Cannot archive the default template. Please set another template as default first.'
    );
  }

  return db
    .update(discountTemplatesTable)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(discountTemplatesTable.id, id))
    .returning()
    .get();
}

function restoreDiscountTemplate(id: number) {
  const db = getActiveDb();
  return db
    .update(discountTemplatesTable)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(discountTemplatesTable.id, id))
    .returning()
    .get();
}

function setDefaultDiscountTemplate(id: number) {
  const db = getActiveDb();

  // Unset all other defaults
  db.update(discountTemplatesTable)
    .set({ isDefault: false, updatedAt: new Date() })
    .where(eq(discountTemplatesTable.isDefault, true))
    .run();

  // Set the new default
  return db
    .update(discountTemplatesTable)
    .set({ isDefault: true, updatedAt: new Date() })
    .where(eq(discountTemplatesTable.id, id))
    .returning()
    .get();
}

// ============================================
// IPC Handlers
// ============================================

export function registerDiscountTemplateHandlers() {
  ipcMain.handle(
    DiscountTemplateIpcChannel.Create,
    async (_event, data: CreateDiscountTemplateRequest) => {
      try {
        return createDiscountTemplate(data);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    DiscountTemplateIpcChannel.Get,
    async (_event, id: number) => {
      try {
        return getDiscountTemplate(id);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    DiscountTemplateIpcChannel.Update,
    async (_event, data: UpdateDiscountTemplateRequest) => {
      try {
        const { id, ...updateData } = data;
        return updateDiscountTemplate(id, updateData);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(DiscountTemplateIpcChannel.List, async () => {
    try {
      return listDiscountTemplates();
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });

  ipcMain.handle(DiscountTemplateIpcChannel.ListArchived, async () => {
    try {
      return listArchivedDiscountTemplates();
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });

  ipcMain.handle(
    DiscountTemplateIpcChannel.Archive,
    async (_event, id: number, name: string) => {
      try {
        const result = await dialog.showMessageBox({
          type: 'warning',
          message: `Are you sure you want to archive this discount template (${name})?`,
          detail: 'Archived templates cannot be used for new invoices.',
          buttons: ['Yes', 'No'],
        });
        if (result.response === 0) {
          archiveDiscountTemplate(id);
          return true;
        }
        return false;
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    DiscountTemplateIpcChannel.Restore,
    async (_event, id: number, name: string) => {
      try {
        const result = await dialog.showMessageBox({
          type: 'info',
          message: `Are you sure you want to restore this discount template (${name})?`,
          buttons: ['Yes', 'No'],
        });
        if (result.response === 0) {
          restoreDiscountTemplate(id);
          return true;
        }
        return false;
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    DiscountTemplateIpcChannel.SetDefault,
    async (_event, id: number) => {
      try {
        return setDefaultDiscountTemplate(id);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );
}

