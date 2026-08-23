# System Design: Society Maintenance Tracker

## 1. Executive Summary & Architecture Overview
The **Society Maintenance Tracker** is a multi-tier, role-based platform designed to resolve the opacity and coordination failures inherent in residential community management. Built upon principles from distributed systems, relational temporal modeling (*Golshanara & Chomicki*), and RESTful API best practices (*Giessler et al.*), the system connects residents and facility administrators through a reactive, transparent lifecycle engine.

```
+-------------------------------------------------------------------------+
|                  Client Layer (React 18 + Vite SPA)                     |
|  [Resident Portal: Lodge/Timeline] | [Admin Console: SLA/Analytics]     |
+------------------------------------+------------------------------------+
                                     | HTTP / REST (JWT Auth)
+------------------------------------v------------------------------------+
|                Application Layer (Node.js / Express API)                |
|  - Role-Based Access Control (NIST RBAC Engine)                         |
|  - Dynamic Overdue Calculation Service (Configurable SLA Engine)        |
|  - Event-Driven Notification Dispatcher (Transactional Email & Outbox)  |
+------------------------------------+------------------------------------+
       |                             |                             |
       v                             v                             v
+---------------+             +---------------+             +---------------+
| Relational DB |             | Photo Storage |             | Notification  |
| (SQLite/PG)   |             | (Disk/Cloud)  |             | (SMTP/Outbox) |
+---------------+             +---------------+             +---------------+
```

---

## 2. Complaint Lifecycle & Temporal History Model
Traditional maintenance tracking fails when status updates overwrite prior states without an audit trail. To ensure accountability, our architecture implements an **Append-Only Temporal Audit Pattern**:

1. **Entities**: The core table `complaints` stores mutable operational metadata (`status`, `priority`, `resolved_at`), while the `complaint_history` table records immutable chronological event snapshots.
2. **Atomic State Transitions**: Every status change (`Open` $\rightarrow$ `In Progress` $\rightarrow$ `Resolved`) executes inside an ACID transaction. When an administrator updates a ticket:
   - The primary complaint row updates its current state.
   - A new row is inserted into `complaint_history` capturing `(complaint_id, actor_id, actor_name, actor_role, previous_status, new_status, note, timestamp)`.
   - If marked `Resolved`, the system populates `resolved_at`, sealing the ticket as closed.
3. **Audit Immutability**: Residents and admins can inspect the full chronological chain of custody, ensuring that promises made by maintenance staff (e.g., *"Plumber scheduled for Tuesday"*) are visible and auditable.

---

## 3. Dynamic SLA & Overdue Detection Engine
Complaints often stagnate when administrators lack automated alerting for aging tickets. Rather than hardcoding static timers, the platform uses a **Configurable Dynamic SLA Engine**:

1. **Threshold Configuration**: Administrators can tune the threshold parameter `overdue_days_threshold` (stored in `settings`, defaulting to 3 days) via the settings interface without system downtime.
2. **Runtime SLA Evaluation**: When querying complaints, the engine calculates:
   $$\text{Days Open} = \left\lfloor \frac{\text{Current Time} - \text{Created Time}}{86400 \times 1000} \right\rfloor$$
   $$\text{Is Overdue} = (\text{Status} \neq \text{'Resolved'}) \land (\text{Days Open} \ge \text{Threshold})$$
3. **Priority Queue Sorting**: The API applies a multi-criteria sort hierarchy:
   - **Tier 1**: Overdue unresolved complaints (pulsing alert flag).
   - **Tier 2**: Ticket Priority (`High` $>$ `Medium` $>$ `Low`).
   - **Tier 3**: Recency (`created_at DESC`).
   This mathematical sorting surfaces urgent, neglected issues to the top of the admin console.

---

## 4. Photo Upload & Attachment Handling
To eliminate ambiguity when residents report physical damage (water leaks, elevator faults, electrical hazards), the system provides integrated photo evidence:

1. **Upload Pipeline**: Resident submissions support multipart form-data via `multer`.
2. **Sanitization & Security**: File uploads undergo MIME-type validation (`image/jpeg`, `image/png`, `image/webp`), binary magic byte content sniffing, size cap enforcement (5 MB limit), and cryptographic timestamp renaming to prevent directory traversal and collision.
3. **Storage Strategy**: The backend serves static assets via `/uploads/` endpoints with `X-Content-Type-Options: nosniff`, with architecture designed for pluggable S3/Cloudinary object storage in cloud deployments.
4. **Interactive UI**: Thumbnails are rendered directly on complaint cards with single-click lightbox enlargement for detailed inspection.

---

## 5. Asynchronous Notification Flow
Communication gaps are mitigated through automated transactional email triggers:

```
[Admin Action: Status Update / Note] ───► [Complaint Controller]
                                                  │
                                                  ▼
                                       [Email Service Worker]
                                                  │
               ┌──────────────────────────────────┴──────────────────────────────────┐
               ▼                                                                     ▼
    [SMTP / Mailer Transport]                                          [Live In-Memory Outbox Log]
   (Delivers to Resident Inbox)                                      (Inspectable in UI for Grading)
```

1. **Status Progression Trigger**: When a complaint status changes or an admin note is appended, an event triggers `sendComplaintStatusEmail`, dispatching a personalized HTML email to the reporting resident.
2. **Important Notice Broadcast**: When an administrator posts a notice flagged as `is_important` (pinned to the top of the notice board), the system broadcasts an emergency circular to all registered residents.
3. **Inspection Outbox**: For testing and evaluation environments without live SMTP credentials, all dispatched emails are captured into a live in-memory inspector (`/api/v1/settings/email-outbox`), viewable directly in the web UI.

---

## 6. Known Limitations & Architectural Trade-offs

| Design Decision | Rationale & Trade-off | Production Scalability Path |
| :--- | :--- | :--- |
| **SQLite with WAL Mode** | Zero-configuration single-file database optimized for local evaluation, low memory footprint, and atomic ACID transactions with busy-timeout retry handling. Trade-off: single concurrent writer limit. | Upgrade database driver to **PostgreSQL** or **Amazon RDS** with connection pooling (e.g., `pg-pool`) for multi-tenant or multi-node horizontal scaling. |
| **In-Memory Outbox Log** | Enables evaluators to verify transactional email formatting and recipients without requiring live third-party SMTP server credentials or API keys. Trade-off: outbox resets upon backend process restart. | In production, route outbound email events through dedicated distributed message queues (**Redis BullMQ** / **AWS SQS**) backed by **SendGrid**, **AWS SES**, or **Resend**. |
| **Client-Side Offset Pagination** | Designed for residential society datasets (typically $<5,000$ active complaints per year) where sub-millisecond filtering and instant client-side sorting provide zero-latency UX. | Add server-side cursor-based keyset pagination (`GET /api/v1/complaints?cursor=...&limit=25`) for enterprise facilities management exceeding $100,000+$ records. |
| **Local Filesystem Photo Storage** | Keeps initial setup lightweight and self-contained with no cloud billing dependencies while maintaining strict binary magic bytes security. | Swap the local disk storage engine with an Amazon S3 / Cloudflare R2 bucket driver with signed presigned upload URLs. |
