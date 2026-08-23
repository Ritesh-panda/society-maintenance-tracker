# REST API Documentation: Society Maintenance Tracker

**Base URL**: `/api/v1`  
**Authentication**: Bearer JWT (`Authorization: Bearer <token>`)

---

## 1. Authentication Endpoints (`/api/v1/auth`)

### `POST /auth/register`
Registers a new resident account.
* **Access**: Public
* **Request Body (JSON)**:
  ```json
  {
    "name": "Aarav Sharma",
    "email": "aarav@society.com",
    "password": "password123",
    "flat_number": "Flat 101, Block A",
    "phone": "+91 9811122334"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Resident registered successfully.",
    "data": {
      "token": "eyJhbGciOi...",
      "user": { "id": "usr_...", "name": "Aarav Sharma", "email": "aarav@society.com", "role": "resident" }
    }
  }
  ```

### `POST /auth/login`
Authenticates a user (Resident or Admin).
* **Access**: Public
* **Request Body (JSON)**:
  ```json
  {
    "email": "admin@society.com",
    "password": "admin123"
  }
  ```
* **Response (200 OK)**: Returns JWT token and sanitized user profile with role.

### `GET /auth/me`
Retrieves current authenticated profile.
* **Access**: Authenticated (Resident or Admin)

---

## 2. Complaints Endpoints (`/api/v1/complaints`)

### `GET /complaints`
Retrieves complaints with overdue enrichment and priority sorting.
* **Access**: Authenticated (Residents see their own tickets; Admins see all society tickets)
* **Query Parameters**:
  * `status`: `all` | `Open` | `In Progress` | `Resolved`
  * `category`: `all` | `Plumbing` | `Electrical` | `Carpentry` | `Security` | `Common Area` | `Cleanliness` | `Lift / Elevator` | `Other`
  * `priority`: `all` | `Low` | `Medium` | `High`
  * `search`: text string (searches title, description, resident name, flat number)
  * `from_date` / `to_date`: `YYYY-MM-DD`
* **Response (200 OK)**: Array of complaint objects enriched with `is_overdue`, `days_open`, and `overdue_threshold`.

### `GET /complaints/:id`
Retrieves detailed complaint object and its complete chronological audit history timeline.
* **Access**: Authenticated (Owner resident or Admin)
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "complaint": { "id": "cmp_101", "title": "...", "status": "In Progress", "photo_url": "/uploads/...", ... },
      "history": [
        { "id": "hist_1", "actor_name": "Aarav", "previous_status": null, "new_status": "Open", "note": "Complaint filed", "created_at": "..." },
        { "id": "hist_2", "actor_name": "Rajesh (Admin)", "previous_status": "Open", "new_status": "In Progress", "note": "Plumber visiting tomorrow", "created_at": "..." }
      ]
    }
  }
  ```

### `POST /complaints`
Creates a new maintenance complaint.
* **Access**: Authenticated (Resident)
* **Content-Type**: `multipart/form-data`
* **Fields**: `title` (string, required), `description` (string, required), `category` (string, required), `priority` (string, optional), `photo` (file, optional).
* **Response (201 Created)**: Returns created complaint and logs initial history record.

### `PATCH /complaints/:id/status`
Updates complaint status and priority with actor attribution and triggers resident email.
* **Access**: Admin only
* **Request Body (JSON)**:
  ```json
  {
    "status": "In Progress",
    "priority": "High",
    "note": "Otis technician scheduled for Tuesday 10 AM inspection."
  }
  ```
* **Response (200 OK)**: Updated complaint and newly appended audit log entry.

### `GET /complaints/dashboard/stats`
Aggregates key metrics for the Admin Dashboard.
* **Access**: Admin only
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "summary": { "total": 6, "open": 3, "in_progress": 2, "resolved": 1, "overdue": 2, "notices": 3, "overdue_threshold_days": 3 },
      "by_category": { "Plumbing": 1, "Electrical": 1, "Lift / Elevator": 1, ... },
      "by_priority": { "High": 3, "Medium": 2, "Low": 1 }
    }
  }
  ```

---

## 3. Notices Endpoints (`/api/v1/notices`)

### `GET /notices`
Fetches community notices sorted with pinned important announcements first (`is_important DESC, created_at DESC`).
* **Access**: Authenticated

### `POST /notices`
Publishes a new society notice. If marked `is_important`, triggers broadcast email to all residents.
* **Access**: Admin only
* **Request Body (JSON)**:
  ```json
  {
    "title": "Water Tank Cleaning on Friday",
    "content": "Water supply suspended from 9 AM to 1 PM for maintenance.",
    "is_important": true
  }
  ```

### `DELETE /notices/:id`
Deletes a notice.
* **Access**: Admin only

---

## 4. Settings & Evaluation Endpoints (`/api/v1/settings`)

### `GET /settings`
Fetches system settings map.

### `PATCH /settings/overdue-threshold`
Updates the overdue days threshold.
* **Access**: Admin only
* **Request Body (JSON)**: `{ "days": 5 }`

### `GET /settings/email-outbox`
Retrieves transactional email dispatches for evaluation, verification, and live demo purposes.
