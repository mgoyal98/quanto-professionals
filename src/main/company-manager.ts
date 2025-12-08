import { app } from 'electron';
import path from 'node:path';
import fs from 'fs-extra';
import { config } from '@shared/config';
import { CreateCompanyRequest, RecentCompany } from '@shared/company';
import Database from 'better-sqlite3';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { slugify } from '@shared/utils';
import { companiesTable } from '@db/schema';

let activeDb: BetterSQLite3Database<Record<string, never>> & {
  $client: Database.Database;
};

export function getDataDirectory() {
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

export async function createCompany(company: CreateCompanyRequest) {
  const dbFileName = slugify(company.name);
  const filePath = path.join(getDataDirectory(), `${dbFileName}.db`);
  if (fs.existsSync(filePath)) {
    throw new Error('A company database with this name already exists.');
  }

  const db = openDatabase(filePath, { fileMustExist: false });

  const dbCompany: typeof companiesTable.$inferInsert = {
    ...company,
  };

  try {
    await db.insert(companiesTable).values(dbCompany);

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

export function openCompany(filePath: string) {
  const db = openDatabase(filePath, { fileMustExist: true });
  if (!fs.existsSync(filePath)) {
    throw new Error('Company database not found.');
  }
  activeDb = db;
  return activeDb;
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

const getRecentCompaniesFile = () => {
  return path.join(getDataDirectory(), 'recent-companies.json');
};

export function loadRecentCompanies(): RecentCompany[] {
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
    (company) => company.filePath !== company.filePath
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
