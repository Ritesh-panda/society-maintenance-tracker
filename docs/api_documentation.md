# 🔌 REST API Specification: Society Maintenance Tracker

**Base URL**: `/api/v1`  
**Protocol**: HTTP/1.1 or HTTP/2 over TLS (HTTPS)  
**Content-Type**: `application/json` (or `multipart/form-data` for file uploads)  
**Authentication**: Bearer JWT (`Authorization: Bearer <token>`)  

---

## 📑 Endpoints Summary Table

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/health` | Public | Service health check and database connectivity probe |
| **POST** | `/api/v1/auth/register` | Public | Register a new resident flat account (triggers approval queue) |
| **POST** | `/api/v1/auth/login` | Public | Authenticate user credentials and retrieve JWT token |
| **GET** | `/api/v1/auth/me` | Authenticated | Retrieve authenticated user profile and permissions |
| **GET** | `/api/v1/auth/pending-approvals` | Admin Only | List resident accounts awaiting RWA committee approval |
| **PATCH** | `/api/v1/auth/users/:id/approve` | Admin Only | Approve and activate a resident account |
| **DELETE** | `/api/v1/auth/users/:id/reject` | Admin Only | Reject and purge a pending registration request |
| **GET** | `/api/v1/complaints` | Authenticated | List complaints with SLA overdue calculation and filters |
| **GET** | `/api/v1/complaints/stats` | Admin Only | Aggregated KPI metrics and category distribution |
| **GET** | `/api/v1/complaints/:id` | Authenticated | Retrieve detailed ticket with chronological audit timeline |
| **POST** | `/api/v1/complaints` | Resident Only | Lodge a new maintenance ticket with room & photo upload |
| **PATCH** | `/api/v1/complaints/:id/status` | Admin Only | Update ticket status/priority, append note, and email resident |
| **GET** | `/api/v1/notices` | Authenticated | Retrieve active society notices with pinned priority order |
| **POST** | `/api/v1/notices` | Admin Only | Publish notice and trigger mass email broadcast |
| **DELETE** | `/api/v1/notices/:id` | Admin Only | Delete/archive an existing society notice |
| **GET** | `/api/v1/settings/sla-threshold` | Authenticated | Retrieve currently active SLA overdue threshold days |
| **PATCH** | `/api/v1/settings/sla-threshold` | Admin Only | Update runtime SLA threshold days (1 to 60 days) |
| **GET** | `/api/v1/settings/email-outbox` | Authenticated | Live in-memory email outbox stream for auditing & evaluation |

---

## 1. System Health (`/api/health`)

### `GET /api/health`
Probes API server operational status and SQLite database connection.
* **Access**: Public
* **Response (200 OK)**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-08-24T00:00:00.000Z",
    "service": "Society Maintenance Tracker API",
    "database": "connected"
  }
  ```

---

## 2. Authentication & Resident Approval (`/api/v1/auth`)

### `POST /api/v1/auth/register`
Creates a new resident account and submits it to the RWA verification queue (`is_approved = 0`).
* **Request Body (JSON)**:
  ```json
  {
    "name": "Kavita Rao",
    "email": "kavita@society.com",
    "password": "password123",
    "flat_number": "Tower D - Flat 204",
    "phone": "+91 9876543210"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Registration submitted! Your flat details are pending RWA verification.",
    "data": {
      "user": {
        "id": "usr_1787490000_abc",
        "name": "Kavita Rao",
        "email": "kavita@society.com",
        "flat_number": "Tower D - Flat 204",
        "role": "resident",
        "is_approved": 0
      }
    }
  }
  ```

---

### `POST /api/v1/auth/login`
Authenticates credentials and signs an `HS256` JSON Web Token.
* **Request Body (JSON)**:
  ```json
  {
    "email": "admin@society.com",
    "password": "admin123"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "usr_admin_001",
        "name": "Rajesh Kumar",
        "email": "admin@society.com",
        "flat_number": "Estate Office",
        "role": "admin",
        "is_approved": 1
      }
    }
  }
  ```

---

## 3. Complaints & History (`/api/v1/complaints`)

### `GET /api/v1/complaints`
Retrieves tickets filtered by query parameters and enriched with dynamic SLA calculations.
* **Headers**: `Authorization: Bearer <token>`
* **Query Parameters**:
  * `status`: `all` | `Open` | `In Progress` | `Resolved` | `overdue`
  * `category`: `all` | `Plumbing` | `Electrical` | `Carpentry` | `Security` | `Common Area` | `Cleanliness` | `Lift / Elevator` | `Other`
  * `priority`: `all` | `Low` | `Medium` | `High`
  * `search`: `string` (searches title, description, resident name, flat number)
  * `from_date` / `to_date`: `YYYY-MM-DD`
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "cmp_101",
        "resident_id": "usr_res_001",
        "resident_name": "Aarav Sharma",
        "flat_number": "Tower A - Flat 402",
        "title": "Master Bathroom Water Heater Tripping",
        "category": "Electrical",
        "priority": "High",
        "status": "In Progress",
        "photo_url": "/uploads/photo_17874000.jpg",
        "arrival_slot": "10:00 AM - 12:00 PM",
        "days_open": 4,
        "is_overdue": 1,
        "overdue_threshold_days": 3,
        "created_at": "2026-08-20T10:00:00.000Z"
      }
    ]
  }
  ```

---

### `POST /api/v1/complaints`
Lodges a new service ticket with multipart form photo upload.
* **Headers**: `Authorization: Bearer <resident_token>`, `Content-Type: multipart/form-data`
* **Form Fields**:
  * `title`: "Kitchen Sink Drain Clogged"
  * `description`: "Water overflowing into cabinet under sink."
  * `category`: "Plumbing"
  * `priority`: "Medium"
  * `arrival_slot`: "02:00 PM - 04:00 PM"
  * `photo`: *(Binary image file: JPEG, PNG, or WebP)*
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Complaint lodged successfully. Notification sent.",
    "data": {
      "id": "cmp_108",
      "status": "Open",
      "category": "Plumbing",
      "photo_url": "/uploads/photo_1787491234_abc.jpg"
    }
  }
  ```

---

### `PATCH /api/v1/complaints/:id/status`
Updates ticket lifecycle state, appends an immutable temporal audit log row, and emails the resident.
* **Headers**: `Authorization: Bearer <admin_token>`, `Content-Type: application/json`
* **Request Body (JSON)**:
  ```json
  {
    "status": "Resolved",
    "priority": "High",
    "note": "Heating element replaced under manufacturer warranty. Verified operational."
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Complaint status updated and resident notified.",
    "data": {
      "complaint": {
        "id": "cmp_101",
        "status": "Resolved",
        "resolved_at": "2026-08-24T00:30:00.000Z"
      },
      "history_entry": {
        "id": "hist_1787495000_xyz",
        "actor_name": "Rajesh Kumar",
        "actor_role": "admin",
        "previous_status": "In Progress",
        "new_status": "Resolved",
        "note": "Heating element replaced under manufacturer warranty. Verified operational.",
        "created_at": "2026-08-24T00:30:00.000Z"
      }
    }
  }
  ```

---

## 4. Notice Board (`/api/v1/notices`)

### `POST /api/v1/notices`
Publishes an official announcement with optional mass-email broadcast.
* **Headers**: `Authorization: Bearer <admin_token>`, `Content-Type: application/json`
* **Request Body (JSON)**:
  ```json
  {
    "title": "Scheduled Overhead Water Tank Cleaning",
    "content": "All towers will experience low water pressure between 9 AM and 2 PM on Sunday.",
    "is_important": 1,
    "expires_at": "2026-08-30T23:59:59.000Z"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Notice published and broadcast email queued for all active residents.",
    "data": {
      "id": "ntc_105",
      "title": "Scheduled Overhead Water Tank Cleaning",
      "is_important": 1
    }
  }
  ```

---

## 5. Dynamic Settings & Outbox (`/api/v1/settings`)

### `PATCH /api/v1/settings/sla-threshold`
Updates the society-wide SLA overdue limit on the fly without server restart.
* **Request Body (JSON)**:
  ```json
  {
    "threshold_days": 2
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "SLA threshold updated to 2 days.",
    "data": {
      "threshold_days": 2
    }
  }
  ```

---

### `GET /api/v1/settings/email-outbox`
Retrieves live in-memory transactional email logs and HTML templates for evaluation.
* **Headers**: `Authorization: Bearer <token>`
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "eml_1787499000_1",
        "to": "aarav@society.com",
        "subject": "✅ Update: Complaint #CMP-101 Marked as Resolved",
        "template_type": "status_update",
        "dispatched_at": "2026-08-24T00:30:00.000Z",
        "html_preview": "<div style=\"font-family: sans-serif; ...\">...</div>"
      }
    ]
  }
  ```

---

## 💻 Example `curl` Testing Commands

```bash
# 1. Health Probe
curl -X GET https://society-tracker-api-1de4.onrender.com/api/health

# 2. Authenticate as Admin
curl -X POST https://society-tracker-api-1de4.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@society.com","password":"admin123"}'

# 3. Retrieve Active Queue
curl -X GET https://society-tracker-api-1de4.onrender.com/api/v1/complaints \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"

# 4. Update SLA Threshold to 2 Days
curl -X PATCH https://society-tracker-api-1de4.onrender.com/api/v1/settings/sla-threshold \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"threshold_days":2}'
```
