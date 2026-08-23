import db from '../config/db.js';

export function initDatabase() {
  // Create Users table with is_approved verification column
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      flat_number TEXT,
      phone TEXT,
      role TEXT NOT NULL CHECK(role IN ('resident', 'admin')),
      is_approved INTEGER NOT NULL DEFAULT 1 CHECK(is_approved IN (0, 1)),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Safe migration: Add is_approved column if existing database does not have it
  try {
    db.exec(`ALTER TABLE users ADD COLUMN is_approved INTEGER DEFAULT 1;`);
  } catch (e) {
    // Column already exists
  }

  // Create Complaints table
  db.exec(`
    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      resident_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('Plumbing', 'Electrical', 'Carpentry', 'Security', 'Common Area', 'Cleanliness', 'Lift / Elevator', 'Other')),
      priority TEXT NOT NULL DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High')),
      status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open', 'In Progress', 'Resolved')),
      photo_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY (resident_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Create Complaint History table (Temporal audit log)
  db.exec(`
    CREATE TABLE IF NOT EXISTS complaint_history (
      id TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      previous_status TEXT,
      new_status TEXT NOT NULL,
      previous_priority TEXT,
      new_priority TEXT,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Create Notices table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notices (
      id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      is_important INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Create System Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT
    );
  `);

  // Optimized indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_complaints_resident ON complaints(resident_id);
    CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
    CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
    CREATE INDEX IF NOT EXISTS idx_complaints_created ON complaints(created_at);
    CREATE INDEX IF NOT EXISTS idx_complaint_history_cid ON complaint_history(complaint_id);
    CREATE INDEX IF NOT EXISTS idx_notices_pinned ON notices(is_important DESC, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_users_approval ON users(is_approved);
  `);

  // Insert default setting for overdue threshold (3 days) if not exists
  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value, description)
    VALUES ('overdue_days_threshold', '3', 'Number of days after which an open complaint is considered overdue')
  `);
  insertSetting.run();
}
