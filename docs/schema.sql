-- =============================================================================
-- Society Maintenance Tracker: Relational Schema DDL
-- Compatible with SQLite & PostgreSQL
-- ER Diagram: docs/er-diagram.md
-- =============================================================================

-- 1. Users Table (Role-Based Access Control & RWA Approval Queue)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  flat_number VARCHAR(100),
  phone VARCHAR(50),
  role VARCHAR(20) NOT NULL CHECK(role IN ('resident', 'admin')),
  is_approved INTEGER NOT NULL DEFAULT 1 CHECK(is_approved IN (0, 1)),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Complaints Table (Primary Ticket Entity)
CREATE TABLE IF NOT EXISTS complaints (
  id VARCHAR(64) PRIMARY KEY,
  resident_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK(category IN ('Plumbing', 'Electrical', 'Carpentry', 'Security', 'Common Area', 'Cleanliness', 'Lift / Elevator', 'Other')),
  priority VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High')),
  status VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK(status IN ('Open', 'In Progress', 'Resolved')),
  photo_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  FOREIGN KEY (resident_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Complaint History Table (Temporal Audit Trail - Golshanara & Chomicki)
CREATE TABLE IF NOT EXISTS complaint_history (
  id VARCHAR(64) PRIMARY KEY,
  complaint_id VARCHAR(64) NOT NULL,
  actor_id VARCHAR(64),
  actor_name VARCHAR(255) NOT NULL,
  actor_role VARCHAR(20) NOT NULL,
  previous_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  previous_priority VARCHAR(20),
  new_priority VARCHAR(20),
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. Notices Table (Community Notice Board with Pinned Item Priority)
CREATE TABLE IF NOT EXISTS notices (
  id VARCHAR(64) PRIMARY KEY,
  author_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_important INTEGER NOT NULL DEFAULT 0 CHECK(is_important IN (0, 1)),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. System Settings Table (Dynamic SLA Threshold Configuration)
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(100) PRIMARY KEY,
  value VARCHAR(255) NOT NULL,
  description TEXT
);

-- Indexes for Fast Lookups and Aggregations
CREATE INDEX IF NOT EXISTS idx_complaints_resident ON complaints(resident_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_created ON complaints(created_at);
CREATE INDEX IF NOT EXISTS idx_complaint_history_cid ON complaint_history(complaint_id);
CREATE INDEX IF NOT EXISTS idx_notices_pinned ON notices(is_important DESC, created_at DESC);
