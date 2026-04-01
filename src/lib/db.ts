import fs from 'fs/promises';
import path from 'path';
import { User, Transaction, RecurringPaymentStatus } from '@/types';

const dataDir = path.join(process.cwd(), 'data');
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

export async function getDb(): Promise<DB> {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(dbPath, JSON.stringify(defaultDb, null, 2), 'utf-8');
      return defaultDb;
    }
    throw error;
  }
}

export async function saveDb(db: DB): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2), 'utf-8');
}
