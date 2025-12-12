import { customersTable } from '@db/schema/customers';
import { CreateCustomerRequest, UpdateCustomerRequest } from '@shared/customer';
import { getActiveDb } from './company-manager';
import { dialog, ipcMain } from 'electron';
import { CustomerIpcChannel, formatIpcError } from '@shared/ipc';
import { asc, eq } from 'drizzle-orm';

function createCustomer(customer: CreateCustomerRequest) {
  const db = getActiveDb();
  const result = db.insert(customersTable).values(customer).returning();
  return result;
}

function getCustomer(id: number) {
  const db = getActiveDb();
  const result = db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, id))
    .get();
  return result;
}

function updateCustomer(id: number, data: Omit<UpdateCustomerRequest, 'id'>) {
  const db = getActiveDb();
  const result = db
    .update(customersTable)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(customersTable.id, id))
    .returning();
  return result;
}

function listCustomers() {
  const db = getActiveDb();
  const result = db
    .select()
    .from(customersTable)
    .where(eq(customersTable.isArchived, false))
    .orderBy(asc(customersTable.name))
    .all();
  return result;
}

function listArchivedCustomers() {
  const db = getActiveDb();
  const result = db
    .select()
    .from(customersTable)
    .where(eq(customersTable.isArchived, true))
    .orderBy(asc(customersTable.name))
    .all();
  return result;
}

function archiveCustomer(id: number) {
  const db = getActiveDb();
  const result = db
    .update(customersTable)
    .set({ isArchived: true })
    .where(eq(customersTable.id, id))
    .returning();
  return result;
}

function restoreCustomer(id: number) {
  const db = getActiveDb();
  const result = db
    .update(customersTable)
    .set({ isArchived: false })
    .where(eq(customersTable.id, id))
    .returning();
  return result;
}

export function registerCustomerHandlers() {
  ipcMain.handle(
    CustomerIpcChannel.Create,
    async (_event, data: CreateCustomerRequest) => {
      try {
        return createCustomer(data);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );
  ipcMain.handle(CustomerIpcChannel.Get, async (_event, id: number) => {
    try {
      return getCustomer(id);
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });
  ipcMain.handle(
    CustomerIpcChannel.Update,
    async (_event, data: UpdateCustomerRequest) => {
      try {
        const { id, ...updateData } = data;
        return updateCustomer(id, updateData);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );
  ipcMain.handle(CustomerIpcChannel.List, async (_event) => {
    try {
      return listCustomers();
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });
  ipcMain.handle(CustomerIpcChannel.ListArchived, async (_event) => {
    try {
      return listArchivedCustomers();
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });
  ipcMain.handle(
    CustomerIpcChannel.Delete,
    async (_event, id: number, name: string) => {
      try {
        const result = await dialog.showMessageBox({
          type: 'warning',
          message: `Are you sure you want to archive this customer (${name})?`,
          buttons: ['Yes', 'No'],
        });
        if (result.response === 0) {
          await archiveCustomer(id);
          return true;
        }
        return false;
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );
  ipcMain.handle(
    CustomerIpcChannel.Restore,
    async (_event, id: number, name: string) => {
      try {
        const result = await dialog.showMessageBox({
          type: 'info',
          message: `Are you sure you want to restore this customer (${name})?`,
          buttons: ['Yes', 'No'],
        });
        if (result.response === 0) {
          await restoreCustomer(id);
          return true;
        }
        return false;
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );
}
