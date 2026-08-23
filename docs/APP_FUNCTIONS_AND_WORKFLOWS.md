# 🏢 Gulmohar Meadows CHS — Master System, Functions & Workflow Guide

**Project:** Society Maintenance Tracker (Resident & RWA Admin Portal)  
**Architecture:** Decoupled Multi-Tier SPA (React 18 + Node.js/Express + SQLite WAL / PostgreSQL + NIST RBAC)  
**Design Reference:** Apple-Inspired "Heard & Handled" Design System (Warm Ivory `#FAFAED` / Deep Obsidian `#0B0F17`, Squircle Geometry, Vector Icons, Web Audio API)

---

## 📑 Table of Contents
1. [Executive Overview & Objectives](#1-executive-overview--objectives)
2. [End-to-End User Workflows & State Machines](#2-end-to-end-user-workflows--state-machines)
3. [Exhaustive Backend Function Reference](#3-exhaustive-backend-function-reference)
4. [Exhaustive Frontend Component & State Reference](#4-exhaustive-frontend-component--state-reference)
5. [Database Data Dictionary & Relational Models](#5-database-data-dictionary--relational-models)
6. [Mathematical Logic & Business Service Engines](#6-mathematical-logic--business-service-engines)
7. [Security & NIST RBAC Authorization Model](#7-security--nist-rbac-authorization-model)
8. [Complete RESTful API Endpoint Matrix](#8-complete-restful-api-endpoint-matrix)
9. [UI/UX Design System & Audio Specifications](#9-uiux-design-system--audio-specifications)
10. [Local Development & Deployment Guide](#10-local-development--deployment-guide)

---

## 1. Executive Overview & Objectives

Apartment complexes and Resident Welfare Associations (RWAs) handle a continuous influx of maintenance complaints. Without a systematic tracking, verification, and temporal audit platform, society administrators struggle with overdue tickets, recurring failures, vendor accountability, and fraudulent database spam, while residents have zero visibility into repair progress.

The **Gulmohar Meadows Society Maintenance Tracker** solves this through:
* **Resident Experience:** Transparent 3-stage lifecycle tracking (`1. Received` $\rightarrow$ `2. Dispatched` $\rightarrow$ `3. Handled`), visual room diagnostics, automated technical auto-drafting, arrival slot scheduling, and real-time status updates.
* **Security & Approval Queue:** RWA Admin Verification Queue ensuring newly registered flats must be approved by the committee before gaining access to private society tickets or notice boards.
* **Management Experience:** High-density SLA control center, dynamic overdue breach detection, category distribution analytics, and customizable overdue threshold limits ($1$ to $60$ days).
* **Communication & Transparency:** Digital notice board with pinned announcements, automated mass email broadcasts, and an immutable chronological audit trail.

---

## 2. End-to-End User Workflows & State Machines

### 2.1 Resident Registration & RWA Approval Security Workflow
```
[ New Resident Visit ] ──► [ Open Registration Form ]
                                  │
                                  ├── Validates RFC 5322 Email Regex
                                  ├── Enforces Password (6 - 128 chars)
                                  └── Captures Tower & Flat Number (e.g. Tower C - 502)
                                  │
                                  ▼
                     [ API: POST /api/v1/auth/register ]
                                  │
                                  ├── Hashes password with bcrypt (10 rounds)
                                  ├── Inserts user with `is_approved = 0`
                                  └── Issues signed JWT Bearer Token
                                  │
                                  ▼
                   [ PendingApprovalPage.jsx Holding State ]
            (User CANNOT view complaints or notices)
                                  │
                                  ▼ (RWA Secretary reviews in Admin Hub)
                     [ API: PATCH /api/v1/auth/users/:id/approve ]
                                  │
                                  ├── Sets `is_approved = 1`
                                  └── Dispatches HTML Approval Confirmation Email
                                  │
                                  ▼
                     [ Full Resident Portal Unlocked ]
```

---

### 2.2 Care Request (Complaint) Lodging Workflow
```
[ Click "Request Service" ] ──► [ Open New Complaint Modal ]
                                      │
  ┌───────────────────────────────────┼───────────────────────────────────┐
  ▼                                   ▼                                   ▼
[ 1. Select Room Tile ]     [ 2. Auto-Draft Assist ]      [ 3. Dispatch Slot & Photo ]
• Bathroom (Plumbing)        • 1-Click diagnostic assist   • Select preferred arrival slot
• Kitchen (Plumbing)         • Auto-populates symptom &    • Drag-and-drop photo (<5MB)
• Living Room (Electrical)     technical description       • Real MIME & magic byte check
• Balcony (Common Area)
• Main Door (Carpentry)
• Lift Lobby (Elevator)
                                      │
                                      ▼
                      [ Click "Send to Management" ]
                                      │
                                      ▼
                      [ API: POST /api/v1/complaints ]
                                      │
                 ├── Whitelists Category & Priority
                 ├── Multer saves photo to /uploads/evidence-*.jpg
                 ├── Atomic ACID Transaction:
                 │    ├── INSERT INTO complaints (status = 'Open')
                 │    └── INSERT INTO complaint_history (event = 'Initiated')
                 │
                 ▼
 [ Plays Whisper-Quiet Organic Chime ] ──► [ Modal Closes & Queue Updates ]
```

---

### 2.3 Complaint Resolution & Status Transition State Machine
```
                      ┌──────────────────────┐
                      │     1. Open          │ (Complaint Lodged by Resident)
                      └──────────┬───────────┘
                                 │
                                 ▼ (Admin assigns vendor / updates status)
                      ┌──────────────────────┐
                      │   2. In Progress     │ (Technician Dispatched / In Progress)
                      └──────────┬───────────┘
                                 │
                                 ▼ (Admin marks complete & enters resolution note)
                      ┌──────────────────────┐
                      │    3. Resolved       │ (Work Complete, resolved_at = ISO Timestamp)
                      └──────────┬───────────┘
                                 │
                                 ▼ (If issue re-occurs, Admin re-opens ticket)
                      ┌──────────────────────┐
                      │   Re-Opened Ticket   │ (Status -> 'In Progress', resolved_at = NULL)
                      └──────────────────────┘
```
* **Email Notification:** At every status transition, `sendComplaintStatusEmail` automatically formats a branded HTML email and records it in the transactional Outbox.

---

## 3. Exhaustive Backend Function Reference

### 3.1 Authentication & User Management Controller (`backend/src/controllers/authController.js`)

#### `register(req, res)`
* **Purpose:** Registers new resident account and places it in the RWA verification approval queue.
* **Input Parameters:** `req.body`: `{ name, email, password, flat_number, phone }`
* **Validation Rules:**
  * `name`: string, trimmed, non-empty.
  * `email`: validated via RFC 5322 regex (`EMAIL_REGEX`), normalized to lowercase, checked for database uniqueness.
  * `password`: string, length between $6$ and $128$ characters.
  * `flat_number`: trimmed string.
* **Execution Logic:**
  1. Computes `password_hash = await bcrypt.hash(password, 10)`.
  2. Generates `id = 'usr_' + Date.now() + '_' + rand`.
  3. Sets `is_approved = 0` (unverified state).
  4. Executes `INSERT INTO users (...) VALUES (...)`.
  5. Generates signed JWT containing `{ id, email, role: 'resident', is_approved: 0, name }`.
  6. Returns HTTP `201 Created` with token and user payload.

#### `login(req, res)`
* **Purpose:** Authenticates resident or administrator.
* **Input Parameters:** `req.body`: `{ email, password }`
* **Execution Logic:**
  1. Queries user by normalized email: `SELECT * FROM users WHERE email = ?`.
  2. Compares plain-text password using constant-time `bcrypt.compare(password, user.password_hash)`.
  3. If invalid, returns HTTP `401 Unauthorized`.
  4. If valid, generates JWT containing `{ id, email, role, is_approved, name }` and returns HTTP `200 OK`.

#### `getMe(req, res)`
* **Purpose:** Returns the fresh authenticated session profile from database including live `is_approved` status.

#### `getPendingApprovals(req, res)`
* **Purpose:** Fetches all resident registrations awaiting RWA verification.
* **Access:** Admin only (`requireRole('admin')`).
* **Query:** `SELECT id, name, email, flat_number, phone, role, is_approved, created_at FROM users WHERE is_approved = 0 ORDER BY created_at DESC`.

#### `approveUser(req, res)`
* **Purpose:** Approves resident apartment registration, unlocks portal access, and dispatches confirmation email.
* **Access:** Admin only.
* **Execution Logic:**
  1. Updates database: `UPDATE users SET is_approved = 1 WHERE id = ?`.
  2. Asynchronously invokes `sendResidentApprovalEmail({ residentEmail, residentName, flatNumber })`.
  3. Returns HTTP `200 OK`.

#### `rejectUser(req, res)`
* **Purpose:** Rejects and removes fraudulent/spam user registration.
* **Access:** Admin only.
* **Execution Logic:** Executes `DELETE FROM users WHERE id = ? AND is_approved = 0`.

---

### 3.2 Complaint Controller (`backend/src/controllers/complaintController.js`)

#### `createComplaint(req, res)`
* **Purpose:** Lodges a new maintenance ticket atomically.
* **Input Parameters:** `req.body`: `{ title, description, category, priority }`, `req.file`: photo attachment.
* **Validation Rules:**
  * `title`: 3 to 200 characters.
  * `description`: 5 to 3000 characters.
  * `category`: whitelist check against `['Plumbing', 'Electrical', 'Carpentry', 'Security', 'Common Area', 'Cleanliness', 'Lift / Elevator', 'Other']`.
  * `priority`: whitelist check against `['Low', 'Medium', 'High']` (defaults to `'Medium'`).
  * `photo`: optional, max 5 MB, validated MIME type (`image/jpeg`, `image/png`, `image/webp`).
* **Execution Logic:**
  1. Generates `complaintId = 'cmp_...'` and `historyId = 'hist_...'`.
  2. Opens atomic database transaction:
     * `INSERT INTO complaints (id, resident_id, title, description, category, priority, status, photo_url, created_at, updated_at)`
     * `INSERT INTO complaint_history (id, complaint_id, actor_id, actor_name, actor_role, previous_status, new_status, note, created_at)`
  3. Returns HTTP `201 Created` with enriched complaint (`is_overdue = false`, `days_open = 0`).

#### `getComplaints(req, res)`
* **Purpose:** Fetches complaints with multi-criteria filtering, search, and dynamic overdue prioritization.
* **Access:** Resident receives only their own records; Admin receives all records.
* **Query Parameters:** `status`, `category`, `priority`, `search`, `from_date`, `to_date`.
* **Execution Logic:**
  1. Dynamically constructs parameterized SQL query.
  2. Executes query and passes rows through `enrichAndSortComplaints(rows)`.
  3. Returns HTTP `200 OK` with enriched list.

#### `getComplaintById(req, res)`
* **Purpose:** Fetches a single complaint with its complete chronological audit history.
* **Access:** Admin or resident owner.
* **Execution Logic:**
  1. Retrieves complaint row: `SELECT * FROM complaints WHERE id = ?`.
  2. Verifies ownership if caller is resident.
  3. Retrieves history: `SELECT * FROM complaint_history WHERE complaint_id = ? ORDER BY created_at ASC`.
  4. Returns HTTP `200 OK` with complaint and history array.

#### `updateComplaintStatus(req, res)`
* **Purpose:** Updates complaint lifecycle status, priority, and appends a chronological audit log.
* **Access:** Admin only (`requireRole('admin')`).
* **Input Parameters:** `req.params.id`, `req.body`: `{ status, priority, note }`
* **Execution Logic:**
  1. Retrieves existing complaint state.
  2. If status transitions to `'Resolved'`, sets `resolved_at = datetime('now')`; if transitioned from `'Resolved'` back to unresolved, resets `resolved_at = NULL`.
  3. Executes atomic transaction updating `complaints` and inserting into `complaint_history`.
  4. Asynchronously dispatches `sendComplaintStatusEmail`.
  5. Returns HTTP `200 OK` with updated record.

#### `getDashboardStats(req, res)`
* **Purpose:** Computes aggregated maintenance analytics for the management control room.
* **Access:** Admin only.
* **Metrics Returned:**
  * `total`: integer sum of all complaints.
  * `open`, `in_progress`, `resolved`: counts by status.
  * `overdue`: count of unresolved tickets open $\ge$ configured threshold days.
  * `categoryBreakdown`: object mapping categories to count and percentage.

---

### 3.3 Notice Controller (`backend/src/controllers/noticeController.js`)

#### `getNotices(req, res)`
* **Purpose:** Returns active society notice board circulars.
* **Ordering:** `ORDER BY is_important DESC, created_at DESC` (pinned emergency circulars always float to the top).

#### `createNotice(req, res)`
* **Purpose:** Publishes a new circular and triggers mass email broadcast if marked important.
* **Access:** Admin only.
* **Input Parameters:** `req.body`: `{ title, content, is_important }`
* **Execution Logic:**
  1. Inserts into `notices` table.
  2. If `is_important === true`, queries all approved active residents (`SELECT email FROM users WHERE role = 'resident' AND is_approved = 1`) and calls `sendImportantNoticeEmail`.
  3. Returns HTTP `201 Created`.

#### `deleteNotice(req, res)`
* **Purpose:** Removes a notice circular.
* **Access:** Admin only.

---

### 3.4 Settings Controller (`backend/src/controllers/settingsController.js`)

#### `getSettings(req, res)`
* **Purpose:** Returns society configuration dictionary (including `overdue_days_threshold`).

#### `updateOverdueThreshold(req, res)`
* **Purpose:** Updates the SLA threshold for overdue ticket calculations.
* **Access:** Admin only.
* **Validation:** Integer between $1$ and $60$ days.
* **Execution Logic:** Executes `INSERT INTO settings (key, value) VALUES ('overdue_days_threshold', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`.

#### `getEmailOutbox(req, res)`
* **Purpose:** Returns in-memory email outbox dispatches for live evaluation inspection.
* **Access:** Admin only.

---

## 4. Exhaustive Frontend Component & State Reference

### 4.1 Root Application Controller (`frontend/src/App.jsx`)
* **State Managed:**
  * `activeTab`: `'complaints'` | `'notices'`
  * `theme`: `'light'` | `'dark'`
  * `historyComplaintId`: string | null (activates audit timeline modal)
  * `updatingComplaint`: object | null (activates status transition modal)
  * `showNewComplaint`: boolean
  * `showSettings`: boolean
  * `showOutbox`: boolean
  * `showAvatarTour`: boolean
  * `dataVersion`: integer incremented to trigger seamless reactivity across all views.

---

### 4.2 Navigation Bar (`frontend/src/components/Navbar.jsx`)
* **Features:**
  * Solid theme-aware header (`background: var(--bg-surface)`).
  * Society branding: `Gulmohar Meadows CHS • ESTATE CARE`.
  * Tab navigation capsule (`My Active Care` / `Estate Care Hub` and `Notice Board`).
  * Action controls: `Request Service`, `SLA Limits`, `Email Stream` outbox trigger, Theme switcher (`Sun` / `Moon`), and Sign Out.

---

### 4.3 Pending Approval Holding Page (`frontend/src/pages/PendingApprovalPage.jsx`)
* **Features:**
  * Blocks unverified newly registered residents from viewing private society tickets or notices.
  * Informative explanation of RWA verification protocols.
  * Live "Check Approval Status" refresh button.

---

### 4.4 Complaint Card (`frontend/src/components/ComplaintCard.jsx`)
* **Features:**
  * Squircle card geometry (`border-radius: 22px`).
  * Status accents: Red 4px stripe (Overdue), Amber (Open), Blue (In Progress), Green (Resolved).
  * Responsive 3-stage progress stepper (`1. Received` $\rightarrow$ `2. Dispatched` $\rightarrow$ `3. Handled`).
  * Photo thumbnail with error fallback (`onError`).
  * Click-to-track action opening the full timeline drawer.

---

### 4.5 Care Request Modal (`frontend/src/components/NewComplaintModal.jsx`)
* **Features:**
  * Dual-tone vector room tiles (*Bathroom, Kitchen, Living Room, Balcony, Entrance, Lift Lobby*).
  * 1-Click Smart Diagnostic Assistant auto-populating technical symptoms and recommended priority.
  * Arrival slot scheduler.
  * Drag-and-drop photo uploader with client validation.
  * Plays organic chime upon dispatch.

---

### 4.6 Timeline & Audit Drawer (`frontend/src/components/ComplaintHistoryModal.jsx`)
* **Features:**
  * Complete ticket overview and metadata header.
  * Chronological conversational activity stream with actor attribution and administrative notes.
  * Photo evidence lightbox zoom.

---

### 4.7 Resident Dashboard (`frontend/src/pages/ResidentDashboard.jsx`)
* **Features:**
  * Editorial greeting with resident name.
  * Concentric "Peace of Mind" SVG health ring.
  * Pinned emergency circulars banner.
  * Filter capsule tabs (*All Requests*, *Pending*, *In Progress*, *Handled*).

---

### 4.8 Admin Operations Hub (`frontend/src/pages/AdminDashboard.jsx`)
* **Features:**
  * **Resident Verification Queue:** Real-time applicant cards with 1-click `✓ Approve & Activate` and `✕ Reject`.
  * High-density KPI strip (Total, SLA Overdue, Open, In Progress, Resolved).
  * Real-time category distribution progress bars.
  * Instant multi-filter toolbar (Status, Category, Priority, Date range, Search).
  * Prioritized complaints grid with overdue issues bubbled to the top.

---

### 4.9 Login & Landing Experience (`frontend/src/pages/LoginPage.jsx`)
* **Features:**
  * Clean, factual capability overview cards explaining lifecycle tracking, SLA overdue calculation, and notice broadcasts.
  * 1-Click Evaluator Demo Launcher (`Admin Demo` / `Resident Demo`).
  * Light / Dark mode switcher.
  * Form state validation and toggling between Sign In and Registration.

---

## 5. Database Data Dictionary & Relational Models

```sql
-- 1. Users Table
CREATE TABLE users (
  id TEXT PRIMARY KEY,               -- Format: usr_timestamp_rand
  name TEXT NOT NULL,                -- Resident / Admin Full Name
  email TEXT UNIQUE NOT NULL,        -- Lowercase Email Address
  password_hash TEXT NOT NULL,       -- bcrypt hash (10 rounds)
  flat_number TEXT,                  -- e.g. Tower A - Flat 402
  phone TEXT,                        -- Contact number
  role TEXT NOT NULL CHECK(role IN ('resident', 'admin')),
  is_approved INTEGER NOT NULL DEFAULT 1 CHECK(is_approved IN (0, 1)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Complaints Table
CREATE TABLE complaints (
  id TEXT PRIMARY KEY,               -- Format: cmp_timestamp_rand
  resident_id TEXT NOT NULL,         -- Foreign Key -> users(id)
  title TEXT NOT NULL,               -- Complaint subject (3-200 chars)
  description TEXT NOT NULL,         -- Full description (5-3000 chars)
  category TEXT NOT NULL CHECK(category IN ('Plumbing', 'Electrical', 'Carpentry', 'Security', 'Common Area', 'Cleanliness', 'Lift / Elevator', 'Other')),
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High')),
  status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open', 'In Progress', 'Resolved')),
  photo_url TEXT,                    -- /uploads/photo_*.jpg
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,              -- ISO Timestamp when marked Resolved
  FOREIGN KEY (resident_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Immutable Temporal Audit Trail Table
CREATE TABLE complaint_history (
  id TEXT PRIMARY KEY,               -- Format: hist_timestamp_rand
  complaint_id TEXT NOT NULL,        -- Foreign Key -> complaints(id)
  actor_id TEXT,                     -- Foreign Key -> users(id)
  actor_name TEXT NOT NULL,          -- Actor name at time of event
  actor_role TEXT NOT NULL,          -- 'admin' or 'resident'
  previous_status TEXT,              -- Prior status (NULL for initial lodge)
  new_status TEXT NOT NULL,          -- Updated status
  previous_priority TEXT,            -- Prior priority
  new_priority TEXT,                 -- Updated priority
  note TEXT,                         -- Administrative / technician action note
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. Notice Board Table
CREATE TABLE notices (
  id TEXT PRIMARY KEY,               -- Format: ntc_timestamp_rand
  author_id TEXT NOT NULL,           -- Foreign Key -> users(id)
  title TEXT NOT NULL,               -- Notice headline
  content TEXT NOT NULL,             -- Full notice text
  is_important INTEGER NOT NULL DEFAULT 0 CHECK(is_important IN (0, 1)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Settings Table
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT
);
```

---

## 6. Mathematical Logic & Business Service Engines

### 6.1 Dynamic Overdue Age Calculation (`overdueService.js`)
* **Mathematical Formula:**
  $$\text{DaysOpen} = \left\lfloor \frac{T_{\text{now}} - T_{\text{created}}}{86,400,000\text{ ms}} \right\rfloor$$
* **SLA Overdue Condition:**
  $$\text{IsOverdue} = (\text{Status} \neq \text{'Resolved'}) \land (\text{DaysOpen} \ge \text{Threshold})$$

### 6.2 Multi-Criteria Priority Sort Algorithm
1. **Tier 1 (Emergency Overdue):** `is_overdue === true` bubbled to top.
2. **Tier 2 (Resolution State):** Unresolved (`'Open'`, `'In Progress'`) before `'Resolved'`.
3. **Tier 3 (Priority Weight):** `High (3)` > `Medium (2)` > `Low (1)`.
4. **Tier 4 (Recency):** `created_at` descending.

---

## 7. Security & NIST RBAC Authorization Model

| Security Layer | Implementation Detail |
| :--- | :--- |
| **Authentication** | Stateless JWT (HS256) signed with server secret (`process.env.JWT_SECRET`). |
| **Password Storage** | 10-round bcrypt hash (`bcrypt.hash`). |
| **Approval Guard** | `requireApproved` middleware halts unverified users with HTTP 403 Forbidden. |
| **Role Guard** | `requireRole('admin')` halts unauthorized access to management routes. |
| **SQL Injection Defense** | 100% parameterized SQL prepared statements via `better-sqlite3`. |
| **Photo Upload Security** | Multer disk storage, binary magic bytes sniffing, and `<5MB` cap. |
| **CORS Policy** | Whitelisted client origins with strict pre-flight validation. |

---

## 8. Complete RESTful API Endpoint Matrix

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register resident apartment profile |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user & issue JWT |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieve authenticated user profile |
| `GET` | `/api/v1/auth/pending-approvals` | Admin | List registrations awaiting approval |
| `PATCH` | `/api/v1/auth/users/:id/approve` | Admin | Approve registration & dispatch welcome email |
| `DELETE` | `/api/v1/auth/users/:id/reject` | Admin | Reject & remove unapproved registration |
| `GET` | `/api/v1/complaints` | Approved | List complaints (resident: own; admin: all) |
| `GET` | `/api/v1/complaints/:id` | Approved | Get single ticket with full history audit trail |
| `POST` | `/api/v1/complaints` | Approved | Lodge new complaint with photo attachment |
| `PATCH` | `/api/v1/complaints/:id/status` | Admin | Update status, priority, and append note |
| `GET` | `/api/v1/complaints/dashboard/stats` | Admin | Get aggregated KPI and category analytics |
| `GET` | `/api/v1/notices` | Approved | Get active circulars (pinned first) |
| `POST` | `/api/v1/notices` | Admin | Publish circular (broadcast email if important) |
| `DELETE` | `/api/v1/notices/:id` | Admin | Delete circular |
| `GET` | `/api/v1/settings` | Authenticated | Get society settings dictionary |
| `PATCH` | `/api/v1/settings/overdue-threshold` | Admin | Configure overdue SLA threshold days |
| `GET` | `/api/v1/settings/email-outbox` | Admin | Inspect recent transactional email dispatches |
| `GET` | `/api/health` | Public | Server uptime & database health check |

---

## 9. UI/UX Design System & Audio Specifications

* **Color Palette:**
  * Light Page Canvas: `#FAFAED` (Soft Warm Ivory)
  * Dark Page Canvas: `#0B0F17` (Deep Obsidian)
  * Primary Surface: `#FFFFFF` (Light) / `#1E293B` (Dark)
  * Amber Accent: `#D97706` / `#B45309`
  * Status Colors: Open (`#D97706`), In Progress (`#2563EB`), Resolved (`#16A34A`), Overdue (`#DC2626`)
* **Geometry:** Continuous squircle curvature (`22px` outer cards, `16px` inner wells, `9999px` capsules).
* **Audio Synthesis:** Web Audio API (`audio.js`) generating smooth organic chimes without external media dependencies.

---

## 10. Local Development & Deployment Guide

```bash
# Backend Setup
cd backend
npm install
npm run seed
npm start

# Run Automated Test Suite (153 Programmatic Assertions)
npm test

# Frontend Setup
cd ../frontend
npm install
npm run dev
```
