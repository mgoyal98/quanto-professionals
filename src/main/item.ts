import { itemsTable } from '@db/schema/items';
import { taxTemplatesTable } from '@db/schema/tax-templates';
import { getActiveDb } from './company-manager';
import { dialog, ipcMain } from 'electron';
import { ItemIpcChannel, formatIpcError } from '@shared/ipc';
import {
  CreateItemRequest,
  UpdateItemRequest,
  ItemListParams,
  ItemListResponse,
  ItemWithTaxTemplates,
} from '@shared/item';
import { eq, asc, and, or, like, sql } from 'drizzle-orm';

// ============================================
// Database Operations
// ============================================

function createItem(data: CreateItemRequest) {
  const db = getActiveDb();

  // Validate rate is non-negative
  if (data.rate < 0) {
    throw new Error('Rate must be a non-negative number');
  }

  // Validate tax template exists if provided
  if (data.taxTemplateId) {
    const taxTemplate = db
      .select()
      .from(taxTemplatesTable)
      .where(
        and(
          eq(taxTemplatesTable.id, data.taxTemplateId),
          eq(taxTemplatesTable.isActive, true)
        )
      )
      .get();

    if (!taxTemplate) {
      throw new Error('Selected tax template does not exist or is inactive');
    }
  }

  // Validate cess template exists if provided
  if (data.cessTemplateId) {
    const cessTemplate = db
      .select()
      .from(taxTemplatesTable)
      .where(
        and(
          eq(taxTemplatesTable.id, data.cessTemplateId),
          eq(taxTemplatesTable.isActive, true),
          eq(taxTemplatesTable.taxType, 'CESS')
        )
      )
      .get();

    if (!cessTemplate) {
      throw new Error(
        'Selected cess template does not exist, is inactive, or is not a CESS type'
      );
    }
  }

  return db.insert(itemsTable).values(data).returning().get();
}

function getItem(id: number): ItemWithTaxTemplates | undefined {
  const db = getActiveDb();

  const item = db.select().from(itemsTable).where(eq(itemsTable.id, id)).get();

  if (!item) return undefined;

  // Fetch related tax templates
  let taxTemplate = null;
  let cessTemplate = null;

  if (item.taxTemplateId) {
    taxTemplate = db
      .select()
      .from(taxTemplatesTable)
      .where(eq(taxTemplatesTable.id, item.taxTemplateId))
      .get();
  }

  if (item.cessTemplateId) {
    cessTemplate = db
      .select()
      .from(taxTemplatesTable)
      .where(eq(taxTemplatesTable.id, item.cessTemplateId))
      .get();
  }

  return {
    ...item,
    taxTemplate: taxTemplate ?? null,
    cessTemplate: cessTemplate ?? null,
  };
}

function updateItem(id: number, data: Omit<UpdateItemRequest, 'id'>) {
  const db = getActiveDb();

  // Validate rate is non-negative
  if (data.rate < 0) {
    throw new Error('Rate must be a non-negative number');
  }

  // Validate tax template exists if provided
  if (data.taxTemplateId) {
    const taxTemplate = db
      .select()
      .from(taxTemplatesTable)
      .where(
        and(
          eq(taxTemplatesTable.id, data.taxTemplateId),
          eq(taxTemplatesTable.isActive, true)
        )
      )
      .get();

    if (!taxTemplate) {
      throw new Error('Selected tax template does not exist or is inactive');
    }
  }

  // Validate cess template exists if provided
  if (data.cessTemplateId) {
    const cessTemplate = db
      .select()
      .from(taxTemplatesTable)
      .where(
        and(
          eq(taxTemplatesTable.id, data.cessTemplateId),
          eq(taxTemplatesTable.isActive, true),
          eq(taxTemplatesTable.taxType, 'CESS')
        )
      )
      .get();

    if (!cessTemplate) {
      throw new Error(
        'Selected cess template does not exist, is inactive, or is not a CESS type'
      );
    }
  }

  return db
    .update(itemsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(itemsTable.id, id))
    .returning()
    .get();
}

function listItems(params: ItemListParams = {}): ItemListResponse {
  const db = getActiveDb();
  const {
    search,
    isActive = true,
    taxTemplateId,
    limit = 50,
    offset = 0,
  } = params;

  // Build where conditions
  const conditions = [eq(itemsTable.isActive, isActive)];

  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(
        like(itemsTable.name, searchPattern),
        like(itemsTable.description, searchPattern),
        like(itemsTable.hsnCode, searchPattern)
      )!
    );
  }

  if (taxTemplateId) {
    conditions.push(eq(itemsTable.taxTemplateId, taxTemplateId));
  }

  // Get total count
  const countResult = db
    .select({ count: sql<number>`count(*)` })
    .from(itemsTable)
    .where(and(...conditions))
    .get();

  const total = countResult?.count ?? 0;

  // Get items with pagination
  const items = db
    .select()
    .from(itemsTable)
    .where(and(...conditions))
    .orderBy(asc(itemsTable.name))
    .limit(limit)
    .offset(offset)
    .all();

  // Fetch related tax templates for each item
  const itemsWithTemplates: ItemWithTaxTemplates[] = items.map((item) => {
    let taxTemplate = null;
    let cessTemplate = null;

    if (item.taxTemplateId) {
      taxTemplate = db
        .select()
        .from(taxTemplatesTable)
        .where(eq(taxTemplatesTable.id, item.taxTemplateId))
        .get();
    }

    if (item.cessTemplateId) {
      cessTemplate = db
        .select()
        .from(taxTemplatesTable)
        .where(eq(taxTemplatesTable.id, item.cessTemplateId))
        .get();
    }

    return {
      ...item,
      taxTemplate: taxTemplate ?? null,
      cessTemplate: cessTemplate ?? null,
    };
  });

  return {
    items: itemsWithTemplates,
    total,
    limit,
    offset,
  };
}

function listArchivedItems(
  params: Omit<ItemListParams, 'isActive'> = {}
): ItemListResponse {
  return listItems({ ...params, isActive: false });
}

function archiveItem(id: number) {
  const db = getActiveDb();

  // TODO: In the future, check if item is used in any invoices
  // For now, just archive it

  return db
    .update(itemsTable)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(itemsTable.id, id))
    .returning()
    .get();
}

function restoreItem(id: number) {
  const db = getActiveDb();
  return db
    .update(itemsTable)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(itemsTable.id, id))
    .returning()
    .get();
}

// ============================================
// IPC Handlers
// ============================================

export function registerItemHandlers() {
  ipcMain.handle(
    ItemIpcChannel.Create,
    async (_event, data: CreateItemRequest) => {
      try {
        return createItem(data);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(ItemIpcChannel.Get, async (_event, id: number) => {
    try {
      return getItem(id);
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });

  ipcMain.handle(
    ItemIpcChannel.Update,
    async (_event, data: UpdateItemRequest) => {
      try {
        const { id, ...updateData } = data;
        return updateItem(id, updateData);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    ItemIpcChannel.List,
    async (_event, params?: ItemListParams) => {
      try {
        return listItems(params);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    ItemIpcChannel.ListArchived,
    async (_event, params?: Omit<ItemListParams, 'isActive'>) => {
      try {
        return listArchivedItems(params);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    ItemIpcChannel.Search,
    async (_event, search: string, limit?: number) => {
      try {
        return listItems({ search, limit: limit ?? 20 });
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    ItemIpcChannel.Archive,
    async (_event, id: number, name: string) => {
      try {
        const result = await dialog.showMessageBox({
          type: 'warning',
          message: `Are you sure you want to archive "${name}"?`,
          detail:
            'Archived items will not appear in item selection for new invoices.',
          buttons: ['Yes', 'No'],
        });
        if (result.response === 0) {
          archiveItem(id);
          return true;
        }
        return false;
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    ItemIpcChannel.Restore,
    async (_event, id: number, name: string) => {
      try {
        const result = await dialog.showMessageBox({
          type: 'info',
          message: `Are you sure you want to restore "${name}"?`,
          buttons: ['Yes', 'No'],
        });
        if (result.response === 0) {
          restoreItem(id);
          return true;
        }
        return false;
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );
}

