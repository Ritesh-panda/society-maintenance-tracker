# 🏢 Gulmohar Meadows — Society Maintenance Tracker

A production-grade, full-stack web application for co-operative housing societies that streamlines maintenance complaint workflows, enforces immutable status history, detects overdue issues via dynamic SLA thresholds, and broadcasts pinned community notices with transactional email updates.

---

## 📑 Table of Contents
- [Features & Requirements Coverage](#-features--requirements-coverage)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Quick Start Guide](#-quick-start-guide)
- [Automated Verification Test Suite](#-automated-verification-test-suite)
- [Pre-Configured Demo Credentials](#-pre-configured-demo-credentials)
- [Environment Configuration (.env.example)](#-environment-configuration-envexample)
- [System Design Summary](#-system-design-summary)
- [REST API Reference](#-rest-api-reference)
- [Database Schema](#-database-schema)
- [Deployment Guide](#-deployment-guide)

---

## ✨ Features & Requirements Coverage

| Requirement | Implementation Details |
| :--- | :--- |
| **Role-Based Auth** | NIST-aligned RBAC (`resident` and `admin`) with cryptographically signed JWTs and 10-round bcrypt password hashing. |
| **Lodge Complaint** | Visual room selector & form with category dropdown (8 categories), priority (`Low`, `Medium`, `High`), description, and photo upload. |
| **Immutable History Log** | Temporal audit log table capturing timestamp, actor name/role, previous/new status, previous/new priority, and admin remarks note. |
| **Admin Workflow** | Filter complaints by category, status, priority, and date ranges. Update status (`Open` $\rightarrow$ `In Progress` $\rightarrow$ `Resolved`). |
| **Overdue Detection** | Dynamic SLA engine flags open complaints exceeding a configurable threshold (e.g., 3 days) with an overdue badge and bubbles them to the top of the queue. |
| **Digital Notice Board** | Circulars list with `is_important` switch to pin priority announcements to the top and dispatch broadcast notifications. |
| **Email Notifications** | Dispatches HTML emails on status changes and broadcasts emergency notices to all residents (with interactive Live Outbox inspector for evaluation). |
| **Admin Analytics** | Real-time metric cards (Total, Open, In Progress, Resolved, Overdue count) + category distribution charts. |

---

## 🏛️ Architecture & Tech Stack

* **Frontend**: React 18 (Vite), Vanilla CSS Design System with "Heard & Handled" luxury aesthetic (Warm Ivory `#FAFAED` / Deep Obsidian `#0B0F17`), Lucide Icons, Squircle geometry (`22px` / `16px`), Responsive Grids, Modal Drawers, and Lightbox Photo Zoom.
* **Backend API**: Node.js + Express (Layered MVC architecture: routes, controllers, middleware, services, models) with strict CORS, rate-limiting, and error-handling middleware.
* **Database**: Relational SQLite (`better-sqlite3`) with Write-Ahead Logging (WAL) and foreign key constraints; full schema compatible with PostgreSQL.
* **Security & Auth**: JWT (HS256) with Bearer token authentication, sanitized responses, and route-level authorization guards.
* **Photo Handling**: Multipart form handling via `multer` with binary magic-byte content validation, extension whitelisting, and static file serving with `nosniff` security headers.

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Seed the database with demo accounts & sample complaints
npm run seed

# Start the API server (runs on http://localhost:5000)
npm start
```

### 2. Frontend Setup
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server (runs on http://localhost:3000)
npm run dev
```

Visit **`http://localhost:3000`** in your browser to explore the application.

---

## 🧪 Automated Verification Test Suite

The project includes an exhaustive automated checklist test suite executing **153 programmatic assertions** covering authentication, RWA approval gating, complaint lifecycle, SLA calculation, photo uploads, notices, settings, and security defenses:

```bash
cd backend
npm test
# or: node src/scripts/test_133_checklist.js
```

---

## 👥 Pre-Configured Demo Credentials

For quick evaluation, click the **"Admin Demo"** or **"Resident Demo"** 1-click buttons directly on the login screen or use the credentials below:

| Role | Name | Email | Password | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Rajesh Kumar | `admin@society.com` | `admin123` | Estate Management Office (Full Control & Analytics) |
| **Resident** | Aarav Sharma | `aarav@society.com` | `password123` | Flat 402, Tower A |
| **Resident** | Priya Patel | `priya@society.com` | `password123` | Flat 304, Tower B |
| **Resident** | Sneha Roy | `sneha@society.com` | `password123` | Flat 103, Tower A |

*(Residents can also register a new apartment account anytime through the registration form)*

---

## ⚙️ Environment Configuration (.env.example)

Create a `.env` file inside `backend/`:

```ini
# Server Port
PORT=5000
NODE_ENV=development

# JWT Secret Key (Generate with openssl rand -base64 48)
JWT_SECRET=your_jwt_secret_here_generate_with_openssl

# Client Origin
CLIENT_URL=http://localhost:3000

# Optional: Real SMTP Configuration (Leave empty to use built-in Live Outbox evaluation viewer)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="Society Tracker" <noreply@societytracker.local>
```

> **Note for Evaluators:** If SMTP credentials are not configured, the system automatically routes all transactional emails to the **Live Outbox Inspector** (accessible via the `Email Stream` button in the top navbar for admins), where you can view full HTML emails in real time.

---

## 📐 System Design Summary

A complete **System Design write-up** is available in [`docs/system_design.md`](docs/system_design.md), covering:
1. **Complaint History Model**: Event-sourcing temporal audit pattern (`complaint_history`) linked with foreign keys to `complaints`, recording who changed what, when, and why.
2. **Overdue Detection Engine**: Mathematical runtime age calculation ($\text{Days Open} \ge \text{Threshold}$) with multi-criteria priority sorting.
3. **Photo Evidence Pipeline**: Multipart upload sanitization, binary magic bytes validation, and lightbox zooming.
4. **Asynchronous Notification Flow**: Event-driven email dispatch for lifecycle changes and broadcast notices.

---

## ⚖️ Known Limitations & Architectural Trade-offs

* **SQLite Single-Writer Concurrency:** SQLite in WAL mode provides fast zero-latency reads and transactions with busy-timeout retries. For high-throughput multi-tenant deployments, migrating to **PostgreSQL** (`pg-pool`) is recommended.
* **In-Memory Email Outbox:** Dispatched emails are stored in an in-memory queue to allow evaluators to inspect HTML templates without live third-party SMTP API keys. In production, this can be swapped with **SendGrid** / **AWS SES** backed by Redis BullMQ.
* **Client-Side Filter Optimization:** Filter and search operations leverage instant client-side computation suitable for residential communities ($<5,000$ active records). For enterprise facilities management, server-side cursor pagination is easily added.

---

## 📡 REST API Reference

Detailed API specifications are documented in [`docs/api_documentation.md`](docs/api_documentation.md).

* `POST /api/v1/auth/register` — Register resident account
* `POST /api/v1/auth/login` — Login user (resident or admin)
* `GET  /api/v1/auth/pending-approvals` — Admin list unapproved resident registrations
* `PATCH /api/v1/auth/users/:id/approve` — Admin approve resident registration
* `DELETE /api/v1/auth/users/:id/reject` — Admin reject unapproved resident registration
* `GET  /api/v1/complaints` — List complaints (resident gets own; admin gets all with filters & overdue sort)
* `GET  /api/v1/complaints/:id` — Get single complaint with full audit timeline
* `POST /api/v1/complaints` — Lodge complaint with photo attachment
* `PATCH /api/v1/complaints/:id/status` — Admin update status, priority & append note
* `GET  /api/v1/complaints/dashboard/stats` — Admin dashboard aggregated analytics
* `GET  /api/v1/notices` — View notice board (pinned notices first)
* `POST /api/v1/notices` — Admin publish notice (`is_important` broadcasts email)
* `DELETE /api/v1/notices/:id` — Admin delete notice circular
* `GET  /api/v1/settings` — Get application configuration
* `PATCH /api/v1/settings/overdue-threshold` — Admin configure overdue threshold days
* `GET  /api/v1/settings/email-outbox` — Admin view recent sent email dispatches

---

## 🗄️ Database Schema

The full SQL DDL script is located in [`docs/schema.sql`](docs/schema.sql).

```sql
users (id, name, email, password_hash, flat_number, phone, role, is_approved, created_at)
complaints (id, resident_id, title, description, category, priority, status, photo_url, created_at, updated_at, resolved_at)
complaint_history (id, complaint_id, actor_id, actor_name, actor_role, previous_status, new_status, previous_priority, new_priority, note, created_at)
notices (id, author_id, title, content, is_important, created_at, updated_at)
settings (key, value, description)
```

---

## ☁️ Deployment Guide

### Deploying to Render / Railway
1. **Backend Service (Web Service):**
   * Build Command: `npm install`
   * Start Command: `node src/server.js`
   * Environment Variables: Set `JWT_SECRET` and `CLIENT_URL`.
2. **Frontend Service (Static Site):**
   * Build Command: `npm run build`
   * Publish Directory: `dist`
   * Environment Variables: `VITE_API_URL` pointing to your deployed backend URL.
