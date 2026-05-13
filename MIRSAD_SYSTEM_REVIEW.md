# Mirsad Daily Ops — System Review

**Version:** 2.0  
**Branch:** `claude/review-readme-jE20X`  
**Last Updated:** 2026-05-13

---

## 1. System Overview

Mirsad Daily Ops is a multi-role operational management platform for hospitality and facilities organizations. It covers:

- Client request lifecycle (services, catering, maintenance, events)
- Operational daily plans and floor checks
- Inventory management (food + materials)
- Purchase orders, receiving, and warehouse-to-floor transfers
- Food safety: fridge checks, expiry tracking, spoilage alerts
- Maintenance request tracking
- Corrective actions and approvals workflow
- Supplier and batch traceability
- Reporting, audit logs, email notifications

The platform is deployed as a single-tenant SaaS where one organization accesses a dedicated instance. All data is scoped to that organization.

---

## 2. Technical Architecture

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| State / Data | TanStack Query v5, React Context |
| Routing | React Router v6 |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB + Mongoose |
| Auth | JWT (HS256), httpOnly-safe Bearer tokens |
| Email | Resend SDK or SMTP (configured per deployment) |
| Deployment | Render (server + client served as static) |
| i18n | react-i18next, English + Arabic (RTL) |

### Project Structure

```
mirsad-daily-ops/
├── client/                   # React frontend
│   └── src/
│       ├── api/              # Axios client
│       ├── components/       # Shared UI components, layout
│       ├── contexts/         # AuthContext
│       ├── i18n/locales/     # en.json, ar.json
│       ├── pages/            # Feature pages
│       └── types/            # TypeScript types
└── server/                   # Express backend
    └── src/
        ├── config/           # env, db config
        ├── controllers/      # Business logic
        ├── middleware/        # auth, error handling
        ├── models/           # Mongoose schemas
        ├── routes/           # Express routers
        ├── services/         # Email, notifications
        └── utils/            # AppError, asyncHandler
```

---

## 3. User Roles

### 3.1 Current Roles (in codebase)

| Role | Description |
|---|---|
| `admin` | Full system access, user management, settings |
| `project_manager` | Operations oversight, reports, most modules |
| `supervisor` | Day-to-day operations, floor checks, maintenance |
| `assistant_supervisor` | Support operations, receiving, transfers |
| `client` | Client-facing portal: own requests + dashboard only |

### 3.2 Target Role Structure (roadmap)

The following role structure is the desired end state, aligned with organizational job functions:

| Role | Maps From | Description |
|---|---|---|
| `admin` | admin | System administrator, full access |
| `operations` | supervisor | Manages requests, assignments, status updates |
| `warehouse` | assistant_supervisor | Inventory, receiving, transfers |
| `kitchen` | *(new)* | Kitchen-only: stock receipt, consumption, shortage reporting |
| `supervisor` | project_manager | Oversight dashboard, reports, cross-module read |
| `client` | client | Client portal: own requests only |

> **Implementation Status:** Role schema expansion is planned. Current system uses the legacy role names. Migration requires User model update, frontend type update, sidebar update, and backend route guard updates.

---

## 4. Demo Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@mirsad.com | demo1234 |
| Project Manager | manager@mirsad.com | demo1234 |
| Supervisor | supervisor@mirsad.com | demo1234 |
| Assistant Supervisor | assistant@mirsad.com | demo1234 |
| Client | client@mirsad.com | demo1234 |

> These credentials exist in seed data only (`server/src/seed/seedDemo.ts`). Manage production users through Admin → Users.

---

## 5. Permission Matrix

### 5.1 Module Access by Role (Current)

| Module / Page | admin | project_manager | supervisor | assistant_supervisor | client |
|---|---|---|---|---|---|
| Dashboard | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Client Dashboard |
| Daily Plans | ✅ | ✅ | ✅ | ❌ | ❌ |
| Floor Checks | ✅ | ✅ | ✅ | ✅ | ❌ |
| Approvals | ✅ | ✅ | ❌ | ✅ | ❌ |
| Purchase Orders | ✅ | ✅ | ❌ | ✅ | ❌ |
| Spoilage Recording | ✅ | ✅ | ✅ | ✅ | ❌ |
| Corrective Actions | ✅ | ✅ | ✅ | ✅ | ❌ |
| Transfers | ✅ | ✅ | ✅ | ✅ | ❌ |
| Receiving | ✅ | ✅ | ❌ | ✅ | ❌ |
| Maintenance | ✅ | ✅ | ✅ | ✅ | ❌ |
| Client Requests | ✅ | ✅ | ✅ | ✅ | ✅ Own only |
| Menu | ✅ | ✅ | ✅ | ✅ | ❌ |
| Food Inventory | ✅ | ✅ | ❌ | ✅ | ❌ |
| Materials Warehouse | ✅ | ✅ | ❌ | ✅ | ❌ |
| Stock Movements | ✅ | ✅ | ❌ | ✅ | ❌ |
| Fridge Checks | ✅ | ✅ | ✅ | ✅ | ❌ |
| Expiry Tracking | ✅ | ✅ | ✅ | ✅ | ❌ |
| Spoilage Alerts | ✅ | ✅ | ✅ | ✅ | ❌ |
| Batches | ✅ | ✅ | ❌ | ✅ | ❌ |
| Suppliers | ✅ | ✅ | ❌ | ✅ | ❌ |
| Projects / Buildings / Floors | ✅ | ✅ | ❌ | ❌ | ❌ |
| Items / Categories | ✅ | ✅ | ❌ | ❌ | ❌ |
| Users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| Reports | ✅ | ✅ | ❌ | ❌ | ✅ Own only |
| Audit Logs | ✅ | ❌ | ❌ | ❌ | ❌ |

### 5.2 Target Permission Matrix (Roadmap Roles)

| Module / Page | admin | supervisor | operations | warehouse | kitchen | client |
|---|---|---|---|---|---|---|
| Admin Dashboard | ✅ | ✅ Read | ❌ | ❌ | ❌ | ❌ |
| Client Dashboard | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Own |
| Daily Plans | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Floor Checks | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Approvals | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Purchase Orders | ✅ | ✅ Read | ❌ | ✅ | ❌ | ❌ |
| Spoilage Recording | ✅ | ✅ | ✅ | ✅ | ✅ Own kitchen | ❌ |
| Corrective Actions | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Transfers | ✅ | ✅ Read | ❌ | ✅ | ❌ | ❌ |
| Receiving | ✅ | ✅ Read | ❌ | ✅ | ❌ | ❌ |
| Maintenance | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Client Requests | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ Own |
| Menu | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Food Inventory | ✅ | ✅ Read | ❌ | ✅ | ✅ Own kitchen | ❌ |
| Materials Warehouse | ✅ | ✅ Read | ❌ | ✅ | ❌ | ❌ |
| Stock Movements | ✅ | ✅ Read | ❌ | ✅ | ❌ | ❌ |
| Fridge Checks | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Expiry Tracking | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Spoilage Alerts | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Batches | ✅ | ✅ Read | ❌ | ✅ | ❌ | ❌ |
| Suppliers | ✅ | ✅ Read | ❌ | ✅ | ❌ | ❌ |
| Projects / Buildings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Items / Categories | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Reports | ✅ | ✅ | ✅ Limited | ✅ Stock | ❌ | ✅ Own |
| Audit Logs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 5.3 Data Scope Rules

| Role | Data Scope |
|---|---|
| admin | All projects, all users, all records |
| supervisor | All projects (read-heavy), cross-site overview |
| operations | Assigned project scope |
| warehouse | Assigned project scope, inventory + receiving only |
| kitchen | Assigned floor/location only, own consumption records |
| client | Own requests only (`requestedBy: userId`), own project |

---

## 6. Module Reference

### Module 1 — Daily Plans
Operational distribution plan per shift. Lines define item → floor → quantity.

- **Fields:** date, project, building, shift, status, notes, lines[]
- **Line fields:** floor, item, plannedQty, actualQty, notes
- **Statuses:** draft → published → closed
- **Roles:** admin, project_manager, supervisor

### Module 2 — Floor Checks
Inspection records per floor.

- **Fields:** project, building, floor, checkedBy, date, status, lines[]
- **Statuses:** draft → submitted → approved → rejected
- **Roles:** supervisor, assistant_supervisor, project_manager, admin

### Module 3 — Approvals
Structured approval workflow for floor checks and other records.

- **Fields:** recordType, recordId, status, approvedBy, approvedAt, notes
- **Statuses:** pending → approved → rejected
- **Roles:** assistant_supervisor, project_manager, admin

### Module 4 — Purchase Orders
Procurement lifecycle from request to receipt.

- **Fields:** supplier, project, items[], totalAmount, status, notes
- **Item fields:** item, quantity, unit, unitPrice
- **Statuses:** draft → submitted → approved → ordered → received → closed
- **Roles:** admin, project_manager, assistant_supervisor

### Module 5 — Inventory
Stock balance tracking per item per period.

- **Models:** InventoryBalance, StockMovement
- **Movement types:** in, out, transfer, adjustment, waste
- **Roles:** admin, project_manager, assistant_supervisor

### Module 6 — Transfers
Warehouse-to-floor stock transfer records.

- **Fields:** fromLocation, toLocation, items[], status, notes
- **Statuses:** pending → confirmed → cancelled
- **Roles:** supervisor, assistant_supervisor, project_manager, admin

### Module 7 — Receiving
Goods receipt against purchase orders.

- **Fields:** purchaseOrder, receivedBy, items[], status, notes
- **Statuses:** draft → confirmed
- **Roles:** assistant_supervisor, project_manager, admin

### Module 8 — Maintenance Requests
Facility maintenance request lifecycle.

- **Fields:** title, description, project, building, floor, category, priority, status, assignedTo, notes
- **Categories:** electrical, plumbing, hvac, equipment, cleaning, structural, other
- **Priorities:** low, medium, high, critical
- **Statuses:** open → in_progress → resolved → closed
- **Roles:** supervisor, assistant_supervisor, project_manager, admin

### Module 9 — Client Requests
Client-initiated service requests.

- **Fields:** title, description, requestType, priority, project, building, floor, room, locationNotes, scheduledDate, scheduledTime, status, items[], notes
- **Request types:** operation_request, coffee_break_request, catering, maintenance, supplies, event, housekeeping, other
- **Statuses:** pending → assigned → in_progress → delivered → confirmed → cancelled
- **Client form:** simplified (no project/employee fields)
- **Roles:** all roles; clients see own requests only

### Module 10 — Corrective Actions
Response records to food safety or operational incidents.

- **Fields:** title, description, sourceType, project, assignedTo, dueDate, priority, status, resolvedAt
- **Source types:** fridge_check, floor_check, inventory, manual
- **Statuses:** open → in_progress → resolved → closed
- **Roles:** supervisor, assistant_supervisor, project_manager, admin

### Module 11 — Food Safety (Fridge Checks)
Temperature and condition monitoring for refrigeration units.

- **Fields:** fridge, temperature, status, checkedBy, date, lines[]
- **Statuses:** pass, fail, warning
- **Roles:** supervisor, assistant_supervisor, project_manager, admin

### Module 12 — Spoilage Recording
Waste and spoilage logging linked to inventory.

- **Fields:** item, quantity, unit, reason, location, recordedBy, date
- **Roles:** supervisor, assistant_supervisor, project_manager, admin

### Module 13 — Batches and Traceability
Product batch lifecycle from supplier to kitchen.

- **Fields:** batchNumber, item, supplier, receivedDate, expiryDate, quantity, status
- **Statuses:** active, depleted, recalled
- **Roles:** assistant_supervisor, project_manager, admin

### Module 14 — Menu Management
Weekly or daily menu planning.

- **Fields:** name, date, type, items[], project, status
- **Roles:** admin, supervisor, assistant_supervisor, project_manager

### Module 15 — Reports
Operational and inventory reports.

- **Report types:** inventory, floor_check, maintenance, client_requests
- **Roles:** admin, project_manager, client (own)

### Module 16 — Audit Logs
System-wide change log for all write operations.

- **Fields:** action, entity, entityId, performedBy, timestamp, changes
- **Roles:** admin only

### Module 17 — Settings
System configuration including email, notifications, and client branding.

- **Configurable:** SMTP / Resend email provider, notification recipients, client name, logo URL, site name, department
- **Roles:** admin only

---

## 7. Client Journey

1. Log in at `/login` with client credentials
2. Land on **Client Dashboard** (`/dashboard`) — shows KPI cards, upcoming scheduled services, request status breakdown, stock overview
3. Navigate to **My Requests** (`/client-requests`) — lists own requests with scheduled date and status
4. Create a new request via **+ New Request** — fills title, description, type, priority, date, location, items, notes
5. Request created → email notification sent to admin / project manager
6. Track request status: pending → assigned → in_progress → delivered
7. Confirm delivery via **Confirm** action on detail page
8. View reports if permitted

---

## 8. Admin / Operations Journey

1. Log in as admin or project manager
2. **Dashboard** shows operational KPIs: open requests, maintenance, pending approvals, floor check compliance
3. **Client Requests** list — assign to team member, update status through lifecycle
4. **Daily Plans** — create distribution plans per shift; publish for floor teams
5. **Floor Checks** — review submitted checks; approve or reject
6. **Maintenance** — view open requests; assign and track resolution
7. **Purchase Orders** — create PO → submit for approval → receive goods
8. **Inventory** — monitor stock levels, movements, transfers
9. **Reports** — generate and export reports
10. **Settings** — configure email, branding, notification recipients
11. **Users** — create/edit/deactivate users, assign roles and project scope

---

## 9. Warehouse Journey

1. Log in as assistant_supervisor
2. **Dashboard** — quick view of pending receiving, low stock alerts
3. **Receiving** — confirm goods receipt against purchase orders
4. **Inventory** — update stock balances, record movements
5. **Transfers** — initiate or confirm stock transfers to floors
6. **Spoilage Recording** — log waste
7. **Batches** — manage product batches, monitor expiry
8. **Suppliers** — maintain supplier records

---

## 10. Request Lifecycle

```
[Client submits request]
       ↓
  status: pending
       ↓  (admin assigns to team member)
  status: assigned
       ↓  (team begins work)
  status: in_progress
       ↓  (team marks as delivered)
  status: delivered
       ↓  (client confirms receipt)
  status: confirmed

  [At any point] → status: cancelled
```

Email notification triggers:
- On creation: admin/project_manager notified with request details
- On status change: relevant parties notified (configurable)

---

## 11. Email Notification Flow

1. Request created → `sendRequestCreated()` in `emailService.ts`
2. Service resolves recipients from `settings.notificationRecipients` → fallback to all admin/project_manager users
3. Email provider resolved: `settings.emailProvider || env.EMAIL_PROVIDER || 'smtp'`
4. Resend: uses `new Resend(apiKey).emails.send({ from, to, subject, html })`
5. SMTP: uses `nodemailer` with configured host/port/auth
6. Fire-and-forget: email failure never blocks the API response
7. Email content includes: request title, type, requester name, scheduled date/time, location (building › floor › room), item count

**Security:** API keys are never committed to source. Stored in `.env` (gitignored) and MongoDB settings document only.

---

## 12. System Settings

Managed at `/settings` (admin only). Stored in a single `SystemSettings` MongoDB document.

| Field | Purpose |
|---|---|
| emailProvider | `smtp` or `resend` |
| resendApiKey | Resend API key (encrypted at rest in DB) |
| smtpHost / smtpPort / smtpUser / smtpPass | SMTP credentials |
| fromEmail / fromName | Sender identity |
| notificationRecipients | Array of email addresses for alerts |
| clientName | Organization display name |
| clientLogoUrl | URL for client logo shown in dashboard header |
| clientSiteName | Site / location name |
| clientDepartment | Department label |

---

## 13. API Route Reference

All routes require `Authorization: Bearer <token>` header.

```
POST   /api/auth/login
POST   /api/auth/logout

GET    /api/dashboard
GET    /api/client-dashboard

GET    /api/users
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id

GET/POST   /api/daily-plans
GET/PUT    /api/daily-plans/:id

GET/POST   /api/floor-checks
GET/PUT    /api/floor-checks/:id

GET/POST   /api/approvals
PUT        /api/approvals/:id

GET/POST   /api/purchase-orders
GET/PUT    /api/purchase-orders/:id
POST       /api/purchase-orders/:id/receive

GET/POST   /api/inventory
GET        /api/inventory/movements

GET/POST   /api/transfers
PUT        /api/transfers/:id

GET/POST   /api/receiving
PUT        /api/receiving/:id

GET/POST   /api/maintenance
GET/PUT    /api/maintenance/:id

GET/POST   /api/client-requests
GET/PUT    /api/client-requests/:id
POST       /api/client-requests/:id/assign
POST       /api/client-requests/:id/deliver
POST       /api/client-requests/:id/confirm

GET/POST   /api/corrective-actions
GET/PUT    /api/corrective-actions/:id

GET/POST   /api/fridge-checks
GET/PUT    /api/fridge-checks/:id

GET/POST   /api/spoilage
GET        /api/spoilage/:id
GET        /api/spoilage-alerts
PUT        /api/spoilage-alerts/:id/resolve

GET/POST   /api/batches
GET/PUT    /api/batches/:id
GET        /api/expiry-tracking

GET/POST   /api/suppliers
GET/PUT    /api/suppliers/:id

GET/POST   /api/projects
GET/POST   /api/buildings
GET/POST   /api/floors
GET/POST   /api/items
GET/POST   /api/categories

GET/POST   /api/reports
GET/POST   /api/menu

GET        /api/audit-logs
GET/PUT    /api/settings
GET/POST   /api/export
```

---

## 14. Frontend Route Protection

Routes are protected via React Router wrapper components. Each protected route checks `user.role` before rendering.

```
/dashboard           → DashboardRouter (role-aware: admin/ops/supervisor → DashboardPage; client → ClientDashboardPage)
/client-requests     → all roles (clients see own only)
/daily-plans         → admin, supervisor, project_manager
/floor-checks        → admin, supervisor, assistant_supervisor, project_manager
/approvals           → admin, assistant_supervisor, project_manager
/purchase-orders     → admin, project_manager, assistant_supervisor
/inventory/*         → admin, project_manager, assistant_supervisor
/maintenance         → admin, supervisor, assistant_supervisor, project_manager
/corrective-actions  → admin, supervisor, assistant_supervisor, project_manager
/transfers           → admin, supervisor, assistant_supervisor, project_manager
/receiving           → admin, project_manager, assistant_supervisor
/food-safety/*       → admin, supervisor, assistant_supervisor, project_manager
/traceability/*      → admin, project_manager, assistant_supervisor
/projects/*          → admin, project_manager
/items/*             → admin, project_manager
/users               → admin
/settings            → admin
/reports             → admin, project_manager, client
/audit-logs          → admin
```

---

## 15. Admin User Management

Accessible at `/users` (admin only). Supports:

- List all users with role, status, last login
- Create new user: fullName, email, password, role, project assignment
- Edit user: update role, project, status
- Deactivate / reactivate user (status toggle)
- Delete user (soft-delete or hard-delete)

**Project scoping:** Non-admin users are assigned to a `project` (MongoDB ObjectId ref). This scopes their data visibility to buildings, inventory, and requests within that project.

---

## 16. i18n Support

- Languages: English (`en.json`), Arabic (`ar.json`)
- Direction: automatic RTL for Arabic via `<html dir="rtl">`
- Toggle: sidebar language switcher (EN / عربي)
- Key namespaces: `common`, `nav`, `status`, `auth`, `maintenance`, `clientRequests`, `clientDashboard`, `clientBranding`, `correctiveActions`, `dailyPlans`, `inventory`, `reports`

---

## 17. Known Issues and Gaps

| # | Issue | Priority | Status |
|---|---|---|---|
| 1 | Kitchen user role does not exist — no kitchen-scoped access | High | Planned |
| 2 | `warehouse` and `operations` roles not in schema — mapped to existing roles | High | Planned |
| 3 | Backend route guards use `requireRole` but not consistently applied on all routes | High | Needs audit |
| 4 | Client can access `/reports` route directly — backend scope enforcement needed | Medium | Needs fix |
| 5 | Food inventory kitchen distribution flow not implemented | Medium | Separate phase |
| 6 | No password reset flow in UI (admin can only set on create) | Medium | Planned |
| 7 | Audit logs only track some write operations, not all | Low | Planned |
| 8 | No mobile app — web-responsive only | Low | Roadmap |

---

## 18. Completed Features (as of this build)

- [x] Full authentication with JWT
- [x] Role-based sidebar navigation
- [x] Admin dashboard with KPI summary
- [x] Dedicated client dashboard (separate from My Requests)
- [x] Client branding (logo, company name, site, department in settings + dashboard)
- [x] Client request full lifecycle with status tracking
- [x] Simplified client request form (no employee/project fields)
- [x] Email notifications on request creation (Resend + SMTP)
- [x] Scheduled date/time in client request form and list cards
- [x] Role-aware titles ("My Requests" for client, "Client Requests" for others)
- [x] Daily plans with line items
- [x] Floor checks with approval workflow
- [x] Purchase orders full lifecycle
- [x] Inventory balance tracking and stock movements
- [x] Warehouse-to-floor transfers
- [x] Goods receiving workflow
- [x] Maintenance request lifecycle
- [x] Corrective actions workflow
- [x] Fridge checks and food safety monitoring
- [x] Spoilage recording and spoilage alerts
- [x] Expiry tracking
- [x] Batch and supplier traceability
- [x] Menu management
- [x] Reports module
- [x] Audit logs
- [x] Settings page (email config + client branding)
- [x] Full Arabic / RTL support
- [x] Project selector removed from all operational forms (auto-scoped by user)

---

## 19. Test Checklist

### Authentication
- [ ] Login with each demo account works
- [ ] Invalid credentials return 401
- [ ] Expired token returns 401 on API call
- [ ] Logout clears session

### Role Access
- [ ] Client cannot navigate to `/users`, `/settings`, `/audit-logs`, `/purchase-orders`
- [ ] Client accessing `/client-requests` only sees own requests
- [ ] Admin can see all requests across all users
- [ ] Supervisor cannot access `/users`
- [ ] Direct URL to protected page redirects or shows 403

### Client Request Flow
- [ ] Client creates request with scheduled date — form submits without project selector
- [ ] Email notification received by admin on new request
- [ ] Admin assigns request — status updates to `assigned`
- [ ] Admin marks delivered — status updates to `delivered`
- [ ] Client confirms — status updates to `confirmed`
- [ ] List card shows scheduled date and time

### Client Dashboard
- [ ] Shows KPI cards (total, active, pending, awaiting confirmation, completed)
- [ ] Upcoming services widget shows next scheduled requests
- [ ] Requests by type bar chart renders
- [ ] Stock overview shows availability summary
- [ ] Branding header shows client name/logo from settings

### Inventory
- [ ] Stock movement creates InventoryBalance update
- [ ] Low stock triggers spoilage alert
- [ ] Expiry tracking shows items expiring within threshold

### Settings
- [ ] Admin saves email provider (Resend) — next email uses Resend
- [ ] Admin saves SMTP config — next email uses SMTP
- [ ] Admin saves client branding — dashboard header updates immediately
- [ ] Logo URL preview renders in settings page

### Arabic / RTL
- [ ] Switching to Arabic flips layout to RTL
- [ ] All translated strings render correctly
- [ ] Number and date formatting respects locale

---

## 20. Deployment Notes

- **Environment variables** required in `server/.env`:
  ```
  NODE_ENV=production
  MONGO_URI=mongodb+srv://...
  JWT_SECRET=<strong-random-secret>
  PORT=3001
  EMAIL_PROVIDER=smtp|resend        # fallback if not set in DB
  RESEND_API_KEY=re_...             # fallback if not set in DB
  SMTP_HOST=...
  SMTP_PORT=587
  SMTP_USER=...
  SMTP_PASS=...
  FROM_EMAIL=noreply@yourdomain.com
  FROM_NAME=Mirsad Ops
  ```

- **Never commit** `.env` file or API keys to source control.
- The `server/.env` is gitignored.
- Seed data runs once on first boot if no admin user exists.

---

*This document is maintained alongside the codebase. Update after each major sprint.*
