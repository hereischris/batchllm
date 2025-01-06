import { openDB, IDBPDatabase } from 'idb';

export interface AIParams {
  model: string;
  temperature: number;
  maxTokens: number;
  presencePenalty: number;
  topP: number;
  concurrency: number;
}

export interface ColumnRange {
  start: string;
  end: string;
}

export interface RowRange {
  start: number;
  end: number;
}

export interface LogEntry {
  timestamp: Date;
  type: 'info' | 'error' | 'warning';
  message: string;
}

export interface File {
  id: string;
  name: string;
  uploadedAt: Date;
  data: any[];
  preview: any[];
  columnNames: string[];
  rowCount: number;
}

export interface Batch {
  id: string;
  fileId: string;
  name: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  createdAt: Date;
  systemPrompt?: string;
  prompt: string;
  columnRange: ColumnRange;
  rowRange: RowRange;
  concurrency: number;
  model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-2';
  temperature: number;
  maxTokens: number;
  presencePenalty: number;
  topP: number;
  progress?: number;
  error?: string;
  logs?: Array<{
    timestamp: Date;
    message: string;
    type: 'info' | 'error' | 'success';
  }>;
  result?: any[];
  costEstimate?: number;
}

export interface Settings {
  id: string;
  provider: string;
  apiKey: string;
  defaultAIParams?: AIParams;
}

const DB_NAME = 'batchllm-db';
const DB_VERSION = 2;

export async function initDB() {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion) {
      // Create files store
      if (!db.objectStoreNames.contains('files')) {
        const fileStore = db.createObjectStore('files', { keyPath: 'id' });
        fileStore.createIndex('uploadedAt', 'uploadedAt');
        fileStore.createIndex('name', 'name');
      }

      // Create batches store
      if (!db.objectStoreNames.contains('batches')) {
        const batchStore = db.createObjectStore('batches', { keyPath: 'id' });
        batchStore.createIndex('createdAt', 'createdAt');
        batchStore.createIndex('status', 'status');
        batchStore.createIndex('fileId', 'fileId');
      }

      // Create settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    },
  });
  return db;
}

// File operations
export async function saveFile(file: File) {
  const db = await initDB();
  return db.put('files', file);
}

export async function getFile(id: string) {
  const db = await initDB();
  return db.get('files', id);
}

export async function getAllFiles() {
  const db = await initDB();
  return db.getAllFromIndex('files', 'uploadedAt');
}

export async function deleteFile(id: string) {
  const db = await initDB();
  // Delete all batches associated with this file
  const batchIndex = db.transaction('batches').store.index('fileId');
  const batches = await batchIndex.getAllKeys(id);
  const tx = db.transaction(['files', 'batches'], 'readwrite');
  await Promise.all([
    ...batches.map(batchId => tx.objectStore('batches').delete(batchId)),
    tx.objectStore('files').delete(id),
  ]);
  await tx.done;
}

// Batch operations
export async function saveBatch(batch: Batch) {
  const db = await initDB();
  return db.put('batches', batch);
}

export async function getBatch(id: string) {
  const db = await initDB();
  return db.get('batches', id);
}

export async function getAllBatches() {
  const db = await initDB();
  return db.getAllFromIndex('batches', 'createdAt');
}

export async function getBatchesByStatus(status: Batch['status']) {
  const db = await initDB();
  const index = db.transaction('batches').store.index('status');
  return index.getAll(status);
}

export async function getBatchesByFile(fileId: string) {
  const db = await initDB();
  const index = db.transaction('batches').store.index('fileId');
  return index.getAll(fileId);
}

export async function deleteBatch(id: string) {
  const db = await initDB();
  return db.delete('batches', id);
}

export async function deleteAllBatches() {
  const db = await initDB();
  const tx = db.transaction('batches', 'readwrite');
  await tx.objectStore('batches').clear();
  await tx.done;
}

// Settings operations
export async function saveSettings(settings: Settings) {
  const db = await initDB();
  return db.put('settings', settings);
}

export async function getSettings() {
  const db = await initDB();
  return db.get('settings', 'default') as Promise<Settings | undefined>;
}

// Log operations
export async function addBatchLog(batchId: string, log: LogEntry) {
  const db = await initDB();
  const batch = await getBatch(batchId);
  if (!batch) return;
  
  batch.logs = [...(batch.logs || []), log];
  return saveBatch(batch);
} 