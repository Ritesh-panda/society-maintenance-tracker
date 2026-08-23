import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new Database(dbPath);

// Enable Write-Ahead Logging (WAL) for high concurrency and performance (informed by DB research)
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;
