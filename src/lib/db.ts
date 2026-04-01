import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { User, Transaction, RecurringPaymentStatus } from '@/types';

// Vercel and other serverless environments have a read-only filesystem except for /tmp.
// Data stored here is ephemeral and will reset when the instance sleeps.
// Users must use the Export/Import JSON feature to persist data permanently in production.
const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
const dataDir = isProd ? path.join(os.tmpdir(), 'finance_data') : path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'db.json');

export interface DB {
  users: User[];
  transactions: Transaction[];
  recurringStatuses: RecurringPaymentStatus[];
}

const defaultDb: DB = {
  users: [],
  transactions: [],
  recurringStatuses: [],
};

// Basic in-memory cache to help data survive slightly longer between same-instance requests
let memoryDb: DB | null = null;

export async function getDb(): Promise<DB> {
  if (isProd && memoryDb) {
    return memoryDb;
  }

  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    const parsed = JSON.parse(data);
    if (isProd) memoryDb = parsed;
    return parsed;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      try {
        await fs.mkdir(dataDir, { recursive: true });
        await fs.writeFile(dbPath, JSON.stringify(defaultDb, null, 2), 'utf-8');
      } catch (writeErr) {
        console.warn('Filesystem write failed, falling back to memory only', writeErr);
      }
      if (isProd) memoryDb = defaultDb;
      return defaultDb;
    }
    throw error;
  }
}

export async function saveDb(db: DB): Promise<void> {
  if (isProd) {
    memoryDb = db;
  }

  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    if (isProd) {
      console.warn('Could not write to /tmp on Vercel, relying on memory cache', error);
      return; // Do not crash in production if /tmp write fails
    }
    throw error;
  }
}
