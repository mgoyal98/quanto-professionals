import { taxTemplatesTable } from '@db/schema/tax-templates';
import { getActiveDb } from './company-manager';
import { dialog, ipcMain } from 'electron';
import { TaxTemplateIpcChannel, formatIpcError } from '@shared/ipc';
import {
  CreateTaxTemplateRequest,
  UpdateTaxTemplateRequest,
  TaxType,
  STANDARD_TAX_TEMPLATES,
} from '@shared/tax-template';
import { eq, asc, and, ne } from 'drizzle-orm';

// ============================================
// Database Operations
// ============================================

/**
 * Seed standard tax templates if no templates exist
 */
export function seedTaxTemplates() {
  const db = getActiveDb();
  const existing = db.select().from(taxTemplatesTable).all();

  if (existing.length === 0) {
    for (const template of STANDARD_TAX_TEMPLATES) {
      db.insert(taxTemplatesTable).values(template).run();
    }
  }
}

function createTaxTemplate(data: CreateTaxTemplateRequest) {
  const db = getActiveDb();

  // If this is default, unset other defaults of same type
  if (data.isDefault) {
    db.update(taxTemplatesTable)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(taxTemplatesTable.taxType, data.taxType ?? 'GST'))
      .run();
  }

  return db
    .insert(taxTemplatesTable)
    .values({
      ...data,
      taxType: data.taxType ?? 'GST',
    })
    .returning()
    .get();
}

function getTaxTemplate(id: number) {
  const db = getActiveDb();
  return db
    .select()
    .from(taxTemplatesTable)
    .where(eq(taxTemplatesTable.id, id))
    .get();
}

function updateTaxTemplate(
  id: number,
  data: Omit<UpdateTaxTemplateRequest, 'id'>
) {
  const db = getActiveDb();

  // If this is default, unset other defaults of same type
  if (data.isDefault && data.taxType) {
    db.update(taxTemplatesTable)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(
        and(
          eq(taxTemplatesTable.taxType, data.taxType),
          ne(taxTemplatesTable.id, id)
        )
      )
      .run();
  }

  return db
    .update(taxTemplatesTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(taxTemplatesTable.id, id))
    .returning()
    .get();
}

function listTaxTemplates() {
  const db = getActiveDb();
  return db
    .select()
    .from(taxTemplatesTable)
    .where(eq(taxTemplatesTable.isActive, true))
    .orderBy(asc(taxTemplatesTable.taxType), asc(taxTemplatesTable.rate))
    .all();
}

function listTaxTemplatesByType(taxType: TaxType) {
  const db = getActiveDb();
  return db
    .select()
    .from(taxTemplatesTable)
    .where(
      and(
        eq(taxTemplatesTable.isActive, true),
        eq(taxTemplatesTable.taxType, taxType)
      )
    )
    .orderBy(asc(taxTemplatesTable.rate))
    .all();
}

function archiveTaxTemplate(id: number) {
  const db = getActiveDb();

  // Check if it's the default template
  const template = db
    .select()
    .from(taxTemplatesTable)
    .where(eq(taxTemplatesTable.id, id))
    .get();

  if (template?.isDefault) {
    throw new Error(
      'Cannot archive the default template. Please set another template as default first.'
    );
  }

  return db
    .update(taxTemplatesTable)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(taxTemplatesTable.id, id))
    .returning()
    .get();
}

function restoreTaxTemplate(id: number) {
  const db = getActiveDb();
  return db
    .update(taxTemplatesTable)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(taxTemplatesTable.id, id))
    .returning()
    .get();
}

function listArchivedTaxTemplates() {
  const db = getActiveDb();
  return db
    .select()
    .from(taxTemplatesTable)
    .where(eq(taxTemplatesTable.isActive, false))
    .orderBy(asc(taxTemplatesTable.taxType), asc(taxTemplatesTable.rate))
    .all();
}

function setDefaultTaxTemplate(id: number) {
  const db = getActiveDb();

  // Get the template to find its type
  const template = db
    .select()
    .from(taxTemplatesTable)
    .where(eq(taxTemplatesTable.id, id))
    .get();

  if (!template) {
    throw new Error('Tax template not found.');
  }

  // Unset other defaults of the same type
  db.update(taxTemplatesTable)
    .set({ isDefault: false, updatedAt: new Date() })
    .where(eq(taxTemplatesTable.taxType, template.taxType))
    .run();

  // Set the new default
  return db
    .update(taxTemplatesTable)
    .set({ isDefault: true, updatedAt: new Date() })
    .where(eq(taxTemplatesTable.id, id))
    .returning()
    .get();
}

// ============================================
// IPC Handlers
// ============================================

export function registerTaxTemplateHandlers() {
  ipcMain.handle(
    TaxTemplateIpcChannel.Create,
    async (_event, data: CreateTaxTemplateRequest) => {
      try {
        return createTaxTemplate(data);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(TaxTemplateIpcChannel.Get, async (_event, id: number) => {
    try {
      return getTaxTemplate(id);
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });

  ipcMain.handle(
    TaxTemplateIpcChannel.Update,
    async (_event, data: UpdateTaxTemplateRequest) => {
      try {
        const { id, ...updateData } = data;
        return updateTaxTemplate(id, updateData);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(TaxTemplateIpcChannel.List, async () => {
    try {
      return listTaxTemplates();
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });

  ipcMain.handle(
    TaxTemplateIpcChannel.ListByType,
    async (_event, taxType: TaxType) => {
      try {
        return listTaxTemplatesByType(taxType);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    TaxTemplateIpcChannel.Archive,
    async (_event, id: number, name: string) => {
      try {
        const result = await dialog.showMessageBox({
          type: 'warning',
          message: `Are you sure you want to archive this tax template (${name})?`,
          detail: 'Archived templates cannot be used for new items.',
          buttons: ['Yes', 'No'],
        });
        if (result.response === 0) {
          archiveTaxTemplate(id);
          return true;
        }
        return false;
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    TaxTemplateIpcChannel.Restore,
    async (_event, id: number, name: string) => {
      try {
        const result = await dialog.showMessageBox({
          type: 'info',
          message: `Are you sure you want to restore this tax template (${name})?`,
          buttons: ['Yes', 'No'],
        });
        if (result.response === 0) {
          restoreTaxTemplate(id);
          return true;
        }
        return false;
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    TaxTemplateIpcChannel.SetDefault,
    async (_event, id: number) => {
      try {
        return setDefaultTaxTemplate(id);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(TaxTemplateIpcChannel.ListArchived, async () => {
    try {
      return listArchivedTaxTemplates();
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });
}
