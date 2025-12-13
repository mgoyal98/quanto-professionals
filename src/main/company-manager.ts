import { app, dialog, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'fs-extra';
import { config } from '@shared/config';
import {
  Company,
  CreateCompanyRequest,
  RecentCompany,
  UpdateCompanyRequest,
} from '@shared/company';
import Database from 'better-sqlite3';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { slugify } from '@shared/utils';
import { companiesTable } from '@db/schema';
import { eq } from 'drizzle-orm';
import { CompanyIpcChannel, formatIpcError } from '@shared/ipc';
import { seedTaxTemplates } from './tax-template';

let activeDb: BetterSQLite3Database<Record<string, never>> & {
  $client: Database.Database;
};

function getDataDirectory() {
  let root: string;
  try {
    root = app.getPath('documents');
  } catch {
    root = app.getPath('userData');
  }
  const dataPath = path.join(root, config.app.dataDir);

  fs.ensureDirSync(dataPath);

  return dataPath;
}

function openDatabase(filePath: string, options?: { fileMustExist?: boolean }) {
  try {
    const sqliteDb = new Database(filePath, {
      fileMustExist: options?.fileMustExist ?? false,
    });

    const db = drizzle(sqliteDb);

    migrate(db, { migrationsFolder: 'drizzle' });

    return db;
  } catch {
    throw new Error('Failed to load database file');
  }
}

async function createCompany(company: CreateCompanyRequest) {
  const dbFileName = slugify(company.name);
  const filePath = path.join(getDataDirectory(), `${dbFileName}.quanto.db`);
  if (fs.existsSync(filePath)) {
    throw new Error('A company database with this name already exists.');
  }

  const db = openDatabase(filePath, { fileMustExist: false });

  const dbCompany: typeof companiesTable.$inferInsert = {
    ...company,
  };

  try {
    await db.insert(companiesTable).values(dbCompany).returning();

    addToRecentCompanies({
      name: company.name,
      filePath: filePath,
      lastOpened: new Date().toISOString(),
    });

    return filePath;
  } finally {
    db.$client.close();
  }
}

async function openCompany(filePath: string) {
  if (activeDb) {
    activeDb.$client.close();
    activeDb = null;
  }
  const db = openDatabase(filePath, { fileMustExist: true });
  if (!fs.existsSync(filePath)) {
    throw new Error('Company database not found.');
  }
  activeDb = db;

  // Seed tax templates if not already seeded
  seedTaxTemplates();

  const company = await getCompanyDetails();
  if (company) {
    addToRecentCompanies({
      name: company.name,
      filePath: filePath,
      lastOpened: new Date().toISOString(),
    });
  }
  return company;
}

async function getCompanyDetails() {
  const db = getActiveDb();
  const company = db.select().from(companiesTable).limit(1).get();
  return company;
}

async function updateCompany(data: UpdateCompanyRequest): Promise<Company> {
  const db = getActiveDb();

  const result = db
    .update(companiesTable)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(companiesTable.id, 1))
    .returning()
    .get();

  return result;
}

export function getActiveDb() {
  if (!activeDb) {
    throw new Error('No active company database.');
  }
  return activeDb;
}

export function closeActiveDb() {
  if (!activeDb) {
    return;
  }
  activeDb.$client.close();
  activeDb = null;
}

function getRecentCompaniesFile() {
  return path.join(getDataDirectory(), 'recent-companies.json');
}

function loadRecentCompanies(): RecentCompany[] {
  const filePath = getRecentCompaniesFile();
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const recent: RecentCompany[] = fs.readJSONSync(filePath);
    // Filter out companies that no longer exist
    return recent.filter((company) => fs.existsSync(company.filePath));
  } catch {
    return [];
  }
}

function addToRecentCompanies(company: RecentCompany) {
  const recent = loadRecentCompanies();

  // Remove if already exists
  const filtered = recent.filter(
    (recentCompany) => recentCompany.filePath !== company.filePath
  );

  // Add to beginning
  filtered.unshift({
    filePath: company.filePath,
    name: company.name,
    lastOpened: new Date().toISOString(),
  });

  // Keep only MAX_RECENT_COMPANIES
  const trimmed = filtered.slice(0, config.company.maxRecent);

  fs.writeJsonSync(getRecentCompaniesFile(), trimmed);
}

async function chooseCompanyFile() {
  const result = await dialog.showOpenDialog({
    defaultPath: getDataDirectory(),
    properties: ['openFile'],
    filters: [
      { name: 'Quanto Company', extensions: ['quanto.db'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
}

export function registerCompanyHandlers() {
  ipcMain.handle(
    CompanyIpcChannel.Create,
    async (_event, data: CreateCompanyRequest) => {
      try {
        return createCompany(data);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );
  ipcMain.handle(CompanyIpcChannel.Open, async (_event, filePath: string) => {
    try {
      return openCompany(filePath);
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });
  ipcMain.handle(CompanyIpcChannel.Close, async () => {
    try {
      return closeActiveDb();
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });
  ipcMain.handle(CompanyIpcChannel.GetRecent, async () => {
    try {
      return loadRecentCompanies();
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });
  ipcMain.handle(CompanyIpcChannel.ChooseFile, async () => {
    try {
      return await chooseCompanyFile();
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });
  ipcMain.handle(CompanyIpcChannel.GetCompanyDetails, async () => {
    try {
      return getCompanyDetails();
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });
  ipcMain.handle(
    CompanyIpcChannel.Update,
    async (_event, data: UpdateCompanyRequest) => {
      try {
        return await updateCompany(data);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );
}
