# 🗄️ Relational Entity-Relationship (ER) Diagram

The following diagram illustrates the relational data model for **Gulmohar Meadows Society Maintenance Tracker**, documenting primary keys, foreign keys, cardinality, and temporal audit relationships.

```mermaid
erDiagram
    USERS ||--o{ COMPLAINTS : lodges
    USERS ||--o{ COMPLAINT_HISTORY : acts_upon
    USERS ||--o{ NOTICES : authors
    COMPLAINTS ||--|{ COMPLAINT_HISTORY : tracks_lifecycle

    USERS {
        string id PK "usr_timestamp_rand"
        string name "Full Name"
        string email UK "Lowercase Email Address"
        string password_hash "bcrypt 10-round hash"
        string flat_number "e.g. Tower C - 502"
        string phone "Phone Number"
        string role "CHECK ('resident', 'admin')"
        integer is_approved "0=Pending, 1=Approved"
        datetime created_at "Registration Timestamp"
    }

    COMPLAINTS {
        string id PK "cmp_timestamp_rand"
        string resident_id FK "References USERS(id)"
        string title "3-200 Characters"
        string description "5-3000 Characters"
        string category "Plumbing, Electrical, Carpentry, etc."
        string priority "Low, Medium, High"
        string status "Open, In Progress, Resolved"
        string photo_url "Uploaded Static File Path"
        datetime created_at "Lodged Timestamp"
        datetime updated_at "Last Modified Timestamp"
        datetime resolved_at "Closure Timestamp"
    }

    COMPLAINT_HISTORY {
        string id PK "hist_timestamp_rand"
        string complaint_id FK "References COMPLAINTS(id)"
        string actor_id FK "References USERS(id)"
        string actor_name "Name at Event Snapshot"
        string actor_role "Role at Event Snapshot"
        string previous_status "Prior Status (or NULL)"
        string new_status "Updated Status"
        string previous_priority "Prior Priority"
        string new_priority "Updated Priority"
        string note "Admin / Technician Remarks"
        datetime created_at "Event Timestamp"
    }

    NOTICES {
        string id PK "ntc_timestamp_rand"
        string author_id FK "References USERS(id)"
        string title "Notice Headline"
        string content "Notice Body Text"
        integer is_important "0=Normal, 1=Pinned Priority"
        datetime created_at "Publish Timestamp"
        datetime updated_at "Update Timestamp"
    }

    SETTINGS {
        string key PK "e.g. overdue_days_threshold"
        string value "Configuration Value"
        string description "Setting Explanatory Text"
    }
```

---

## 🔍 Key Relational Design Principles

1. **Temporal Immutability (`COMPLAINTS` $\rightarrow$ `COMPLAINT_HISTORY`):**
   * While `COMPLAINTS` maintains the current mutable state for fast index scans, `COMPLAINT_HISTORY` is an append-only ledger capturing every transition.
   * `ON DELETE CASCADE` ensures child audit logs are cleaned if a parent ticket is purged during test runs, while `ON DELETE SET NULL` on `actor_id` preserves history even if a user account is removed.

2. **RWA Verification Gateway (`USERS.is_approved`):**
   * Ensures newly self-registered resident accounts remain gated until explicitly validated by an estate administrator.

3. **Dynamic SLA Decoupling (`SETTINGS`):**
   * Configurable key-value store permits runtime SLA adjustments without schema migrations or server restarts.
