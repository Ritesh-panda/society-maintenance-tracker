# 🏛️ System Design & Architecture Specification
## Gulmohar Meadows — Society Maintenance Tracker

---

## 1. Executive Summary & Architectural Goals

The **Society Maintenance Tracker** is a resilient, multi-tiered enterprise web application designed to solve operational opacity, communication bottlenecks, and accountability gaps in residential housing societies and Resident Welfare Associations (RWAs).

### Core Architectural Goals:
1. **Append-Only Temporal Integrity:** Guarantee an immutable audit trail for every status transition, priority reassignment, and administrative remark.
2. **Deterministic Dynamic SLA Enforcement:** Automatically calculate ticket age and highlight overdue maintenance requests without requiring batch cron jobs or daemon schedulers.
3. **NIST-Aligned Role-Based Security (RBAC):** Strict separation of resident and estate administrator privileges enforced at both the API gateway and database transaction layers.
4. **Resilient Asynchronous Notifications:** Dual-path transactional email dispatch with an in-memory grading outbox stream for automated evaluation.
5. **Zero-Latency Operational Dashboard:** High-density, reactive user interface with sub-100ms client-side search, filtering, and live metric aggregation.

---

## 2. High-Level Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientTier ["Client Tier (Browser / React 18 SPA)"]
        ResidentUI["Resident Portal\n(Lodge, Status Ring, Lightbox)"]
        AdminUI["Admin Operations Console\n(KPIs, Dynamic SLA, Queue)"]
        AuthCtx["Auth Context & Token Cache"]
        OutboxViewer["Live Email Stream Inspector"]
    end

    subgraph GatewayTier ["Gateway & Security Layer"]
        CORSGuard["Permissive CORS Filter\n(*.vercel.app / Localhost)"]
        RateLimit["Express Rate Limiter\n(500 req / 15 min)"]
        JWTGuard["JWT Bearer Authentication\n(NIST RBAC Middleware)"]
        MagicByte["Multer Magic-Byte Inspector\n(Buffer Header Sniffing)"]
    end

    subgraph ServiceTier ["Application Service Layer (Express MVC)"]
        AuthSvc["Auth & Resident Approval Controller"]
        ComplaintSvc["Complaint & Temporal History Controller"]
        NoticeSvc["Notice Board Broadcast Controller"]
        SettingsSvc["Dynamic SLA Settings Controller"]
        EmailWorker["Transactional Email & Outbox Worker"]
    end

    subgraph PersistenceTier ["Persistence & Asset Layer"]
        SQLiteEngine[("SQLite Database (WAL Mode)\nForeign Keys ON + Busy Timeout")]
        LocalMedia[("Uploads Directory\nSanitized Static Image Storage")]
        MemoryOutbox[("In-Memory Transactional Stream\n(50-Item FIFO Ring Buffer)")]
    end

    ResidentUI --> AuthCtx
    AdminUI --> AuthCtx
    AuthCtx --> CORSGuard
    OutboxViewer --> CORSGuard

    CORSGuard --> RateLimit --> JWTGuard
    JWTGuard --> ServiceTier
    MagicByte --> LocalMedia

    AuthSvc --> SQLiteEngine
    ComplaintSvc --> SQLiteEngine
    ComplaintSvc --> EmailWorker
    NoticeSvc --> SQLiteEngine
    NoticeSvc --> EmailWorker
    SettingsSvc --> SQLiteEngine

    EmailWorker --> MemoryOutbox
```

---

## 3. Sequence Diagrams: Core Workflows

### 3.1 Resident Lodges Complaint with Photo Evidence

```mermaid
sequenceDiagram
    autonumber
    actor Resident as Resident (Aarav)
    participant Client as Frontend SPA (React)
    participant Gateway as Express Gateway / Multer
    participant Controller as Complaint Controller
    participant DB as SQLite Database
    participant Email as Email Worker

    Resident->>Client: Selects Room ("Bathroom"), Auto-Drafts Issue, Attaches Photo
    Client->>Gateway: POST /api/v1/complaints (multipart/form-data with Bearer JWT)
    Gateway->>Gateway: Validate JWT & Inspect file magic bytes (JPEG/PNG/WebP)
    Gateway->>Controller: Forward sanitized body + file path
    Controller->>DB: INSERT INTO complaints (user_id, title, category, priority, photo_url, arrival_slot)
    DB-->>Controller: Returns new complaint ID (e.g., CMP-108)
    Controller->>DB: INSERT INTO complaint_history (complaint_id, actor_name, action, note)
    Controller->>Email: Trigger submission confirmation email event
    Email-->>Email: Format HTML template & push to Outbox Stream
    Controller-->>Client: HTTP 201 Created (Complaint Object + History Record)
    Client->>Resident: Visual success confirmation & Real-Time Status Ring updates
```

---

### 3.2 Admin Updates Status with Immutable Audit Trail

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Estate Admin (Rajesh)
    participant Client as Frontend SPA (React)
    participant Controller as Complaint Controller
    participant DB as SQLite Database
    participant Email as Email Worker
    actor Resident as Resident (Aarav)

    Admin->>Client: Changes status to "In Progress", selects "High" Priority, adds remark
    Client->>Controller: PATCH /api/v1/complaints/:id/status (Bearer Admin JWT)
    Controller->>Controller: Verify role === 'admin'
    Controller->>DB: BEGIN TRANSACTION
    Controller->>DB: UPDATE complaints SET status = 'In Progress', priority = 'High', updated_at = NOW()
    Controller->>DB: INSERT INTO complaint_history (complaint_id, actor_id, actor_name, actor_role, previous_status, new_status, note)
    Controller->>DB: COMMIT TRANSACTION
    Controller->>Email: Trigger sendComplaintStatusEmail(resident.email, status, note)
    Email-->>Email: Render luxury status notification email
    Controller-->>Client: HTTP 200 OK (Updated Ticket + Appended Audit Row)
    Email->>Resident: Transactional Email notification received
    Client->>Admin: Live queue reflects updated badge & progress stepper
```

---

### 3.3 RWA Notice Broadcast with Emergency Pinning

```mermaid
sequenceDiagram
    autonumber
    actor Admin as RWA President
    participant Client as Frontend SPA (React)
    participant Controller as Notice Controller
    participant DB as SQLite Database
    participant Email as Email Worker
    actor Residents as All Society Residents

    Admin->>Client: Writes announcement, toggles "Pin as Important Announcement"
    Client->>Controller: POST /api/v1/notices (title, body, is_important = 1)
    Controller->>DB: INSERT INTO notices (user_id, title, body, is_important, expires_at)
    Controller->>DB: SELECT email, name FROM users WHERE role = 'resident' AND is_approved = 1
    DB-->>Controller: Returns active resident contact list
    Controller->>Email: Trigger broadcastNoticeEmail(residents, notice)
    loop For each approved resident
        Email-->>Email: Dispatch circular HTML email
    end
    Controller-->>Client: HTTP 201 Created
    Client->>Residents: Announcement pinned to top of Notice Board with amber badge
```

---

## 4. Mathematical SLA & Dynamic Overdue Engine

Maintenance tickets in residential communities frequently stagnate without active monitoring. The system implements a deterministic, runtime SLA evaluation algorithm:

### 4.1 SLA Formulation
Given a complaint record $C$ and system configuration threshold $\theta_{\text{days}} \in [1, 60]$ (default: $3$):

$$\text{Age}_{\text{ms}} = T_{\text{current}} - T_{\text{created}}$$

$$\text{Age}_{\text{days}} = \left\lfloor \frac{\text{Age}_{\text{ms}}}{86,400,000} \right\rfloor$$

$$\text{IsOverdue}(C) = \begin{cases} 
\text{TRUE} & \text{if } C.\text{status} \neq \text{'Resolved'} \land \text{Age}_{\text{days}} \ge \theta_{\text{days}} \\ 
\text{FALSE} & \text{otherwise} 
\end{cases}$$

### 4.2 Priority Queue Sorting Hierarchy
When rendering the administrative queue, tickets are sorted using a 3-tier comparator:

$$\text{Rank}(C) = \big( \text{IsOverdue}(C) \cdot 10^6 \big) + \big( \text{PriorityWeight}(C.\text{priority}) \cdot 10^3 \big) + T_{\text{created}}$$

Where:
$$\text{PriorityWeight}(\text{High}) = 3, \quad \text{PriorityWeight}(\text{Medium}) = 2, \quad \text{PriorityWeight}(\text{Low}) = 1$$

This ensures that **overdue tickets always surface at the top of the queue**, followed by urgent items, and finally chronological recency.

---

## 5. Security Architecture & Threat Modeling

| Threat Category | Potential Attack Vector | System Defense & Mitigation |
| :--- | :--- | :--- |
| **Authentication & Session** | Token forgery, credential stuffing, brute-force attacks | • Cryptographically signed JWTs (`HS256`) with 7-day expiration.<br>• Passwords hashed with 10-round bcrypt.<br>• Rate limiting (`500 requests / 15 minutes`) on auth routes. |
| **Authorization & RBAC** | Resident accessing admin endpoints, unauthorized approval | • Middleware verification of `req.user.role === 'admin'`.<br>• Resident approval gating (`is_approved = 0` blocks login until RWA authorization). |
| **File Upload Exploits** | Upload of malicious `.php`/`.exe`/`.sh` disguised as `.jpg` | • Dual-layer validation: Multer extension check + binary **magic-byte inspection** (analyzing initial file header bytes `0xFFD8FF`, `0x89504E47`, `0x52494646`).<br>• Static files served with `X-Content-Type-Options: nosniff`. |
| **SQL Injection** | Parameter tampering via search or category filters | • Parameterized SQL prepared statements (`better-sqlite3` parameter binding `?`). Zero string concatenation. |
| **Cross-Site Scripting (XSS)** | Injection via complaint description or notice board | • React JSX automatic DOM text node escaping.<br>• Backend sanitization of all string input fields. |
| **CORS Exploits** | Cross-origin request forgery from untrusted domains | • Explicit CORS origin whitelist allowing local development, configured `CLIENT_URL`, and verified `*.vercel.app` production domains. |

---

## 6. Scalability Roadmap & Architectural Trade-offs

```mermaid
flowchart LR
    subgraph CurrentArch ["Current Implementation (Phase 1)"]
        A1["SQLite WAL Single-Writer"]
        A2["Local Disk Photo Storage"]
        A3["In-Memory Email Stream Outbox"]
    end

    subgraph ProductionScale ["Enterprise Scalability (Phase 2)"]
        B1["PostgreSQL RDS with PgBouncer Pooling"]
        B2["Amazon S3 / Cloudflare R2 Presigned URLs"]
        B3["Redis BullMQ + AWS SES / SendGrid Queue"]
    end

    A1 -.->|"Drop-in schema migration via schema.sql"| B1
    A2 -.->|"Pluggable S3 storage adapter"| B2
    A3 -.->|"Distributed message broker worker"| B3
```

1. **Database Migration:** The relational schema in `docs/schema.sql` is ANSI-SQL compliant. Transitioning from SQLite to PostgreSQL requires updating only the database connection pool in `backend/src/config/db.js`.
2. **Object Storage:** File uploads use a modular middleware abstraction. Swapping local disk storage for AWS S3 involves configuring `@aws-sdk/client-s3` in `backend/src/middleware/upload.js`.
3. **Email Dispatch:** Outbound email events use a standard Nodemailer transport interface, allowing seamless switching from test transports to production SMTP relays.
