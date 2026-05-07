# Mirsad Daily Ops

Mirsad is a web-based daily operations, food inventory, and materials warehouse management platform.

The goal of Mirsad is to replace paper-based daily floor checks and Excel tracking files with a digital system where supervisors can submit daily checks, record quantities, upload photos, add notes, sign reports, and send them for approval.

Project managers can monitor dashboards, review shortages, approve reports, and export PDF/Excel reports.

---

## Project Name

**Mirsad Daily Ops**

Arabic Name: **مرصاد**

Tagline:

**Monitor. Track. Approve.**  
**راقب، تتبّع، اعتمد.**

---

## Project Overview

Mirsad is designed as a digital operations platform for daily field checks, food inventory, and warehouse tracking.

The current manual process depends on:

- Paper-based daily food inventory forms
- Excel files for daily food distribution
- Excel files for monthly food inventory
- Excel files for materials warehouse tracking
- Manual approvals and signatures
- Manual reporting

Mirsad will convert this process into a web-based system that can be used from desktop browsers and iPad devices.

---

## Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS

### Backend

- Node.js
- Express.js

### Database

- MongoDB Atlas

### Deployment

The demo must be deployed as one integrated full-stack public URL.

Example:

```text
https://mirsad-demo.onrender.com
```

---

## Important Deployment Requirement

Mirsad must be deployed as one integrated full-stack demo URL.

The demo should not require separate frontend and backend links for testing.

Required approach:

- Build the React/Vite frontend
- Serve the frontend build files from the Node.js/Express backend
- Keep all API routes under `/api`
- Connect the backend to MongoDB Atlas
- Deploy the full-stack app as one service
- Provide one public URL only for the demo

The frontend must call the backend using relative API paths only.

Examples:

```text
/api/auth/login
/api/dashboard
/api/projects
/api/items
/api/daily-plans
/api/floor-checks
/api/approvals
/api/reports
```

Do not hardcode localhost URLs in the frontend.

---

## Required Modules

1. Dashboard
2. Authentication & Role-Based Access Control
3. User Management
4. Projects, Buildings, Floors & Locations
5. Items Master, Categories & Units
6. Daily Allocation Plan
7. Daily Floor Check Form
8. Food Inventory
9. Materials Warehouse
10. Stock Movement Ledger
11. Approval Workflow
12. Attachments, Photos & Signatures
13. Reports & Export PDF/Excel
14. Audit Logs

---

## User Roles

The system should include the following roles:

### 1. Admin

Admin can manage the entire system.

Responsibilities:

- Manage users
- Manage roles
- Manage projects
- Manage buildings and floors
- Manage items and categories
- Manage daily plans
- View dashboard
- View reports
- View audit logs

### 2. Supervisor

Supervisor is responsible for daily field checks.

Responsibilities:

- View assigned daily floor checks
- Enter actual quantities
- Add notes
- Upload photos
- Add signature
- Submit report for review

### 3. Assistant Supervisor

Assistant Supervisor reviews submitted reports.

Responsibilities:

- Review submitted daily checks
- Add comments
- Return reports for correction
- Forward reports for project manager approval

### 4. Project Manager

Project Manager approves reports and monitors operations.

Responsibilities:

- View dashboard
- Review shortages
- Approve reports
- Reject reports
- Export PDF and Excel reports
- Monitor food inventory
- Monitor materials warehouse

### 5. Client / Ministry Manager

Client or Ministry Manager can view approved reports and provide final comments or approval.

Responsibilities:

- View approved reports
- Add comments
- Final approval if required
- Export reports

---

## Main Workflow

1. Admin creates or imports the daily allocation plan
2. The system generates daily floor check tasks
3. Supervisor completes the check using the web/iPad-friendly form
4. Supervisor enters actual quantities, notes, photos, and signature
5. Assistant Supervisor reviews the submitted report
6. Project Manager approves the report
7. After approval, inventory balances are updated automatically
8. Reports can be exported as PDF and Excel

---

## Expected Workflow to Test

```text
Daily Plan
→ Floor Check
→ Submit
→ Review
→ Approve
→ Inventory Update
→ Report Export
```

---

## Demo Requirement

The demo must look functional and realistic, not empty.

Please add realistic dummy data for:

- Users
- Roles
- Projects
- Buildings
- Floors
- Food items
- Material items
- Daily allocation plans
- Daily floor checks
- Food inventory
- Materials warehouse
- Stock movements
- Approvals
- Reports
- Audit logs
- Dashboard statistics

---

## Required Demo Login

```text
Admin Email: admin@mirsad.demo
Password: Demo@12345
```

Also create test users for each role:

```text
Supervisor Email: supervisor@mirsad.demo
Password: Demo@12345

Assistant Supervisor Email: assistant@mirsad.demo
Password: Demo@12345

Project Manager Email: manager@mirsad.demo
Password: Demo@12345

Client / Ministry Manager Email: client@mirsad.demo
Password: Demo@12345
```

---

## Module Details

### 1. Dashboard

The dashboard should show a clear operational overview.

Required widgets:

- Total daily checks
- Completed checks
- Pending checks
- Submitted reports
- Approved reports
- Rejected reports
- Shortage items
- Low stock items
- Pending approvals
- Food inventory status
- Materials warehouse status

---

### 2. Authentication & Role-Based Access Control

The system should support secure login and role-based permissions.

Required features:

- Login
- Logout
- Protected routes
- Role-based sidebar/menu
- JWT authentication
- Password hashing
- User status active/inactive

---

### 3. User Management

Admin should be able to manage system users.

Required fields:

- Full name
- Email
- Phone
- Role
- Project
- Status
- Created date

Required actions:

- Create user
- Edit user
- Disable user
- Assign role

---

### 4. Projects, Buildings, Floors & Locations

The system should support project and location structure.

Example:

```text
Project: CDMDNA Building Operations
Building: CDMDNA Building
Floors:
- 2 Floor
- 3 Floor
- 4 Floor
- 19 Floor
- MAKASSB
- SECURITY
- KAFAA-1
- KAFAA-2
```

Required fields:

- Project name
- Client name
- Building name
- Floor name
- Location code
- Status

---

### 5. Items Master, Categories & Units

The system should manage all food and material items.

Required item fields:

- Item name
- Category
- Unit
- Type: Food or Material
- Limit quantity
- Active/inactive status

Example food categories:

- Breakfast Sandwich
- Lunch Sandwich
- Lunch Meals
- Salads
- Soups
- Fresh Fruits
- Sweet Bakery
- Salted Bakery
- Yogurt
- Nuts
- Sweets Cakes
- Granola
- Fresh Juice

Example material categories:

- Water
- Coffee
- Milk
- Tea
- Paper Cups
- Plates
- Spoons
- Forks
- Knives
- Sauces
- Syrups
- Support Materials

---

### 6. Daily Allocation Plan

The daily allocation plan defines planned quantities by floor and item.

Required fields:

- Date
- Project
- Building
- Floor
- Shift
- Item
- Planned quantity
- Notes
- Status

Required features:

- Create daily plan
- Copy from previous day
- Import from Excel in the future
- Generate floor check tasks automatically

---

### 7. Daily Floor Check Form

This is the main iPad-friendly form used by supervisors.

Required fields:

- Date
- Time
- Project
- Building
- Floor
- Supervisor
- Shift
- Item
- Planned quantity
- Actual quantity
- Difference
- Status
- Notes
- Photos
- Signature

Item status options:

- OK
- Shortage
- Extra
- Not Available
- Replaced
- Needs Review

---

### 8. Food Inventory

Food inventory should calculate food consumption automatically after approval.

Required fields:

- Item
- Category
- Unit
- Monthly limit
- Opening balance
- Received quantity
- Consumed quantity
- Remaining quantity
- Status

Status options:

- Available
- Low Stock
- Out of Stock
- Over Consumed

---

### 9. Materials Warehouse

Materials warehouse should manage operational materials and stock balance.

Required movements:

- Receive
- Issue
- Transfer
- Adjustment
- Damage
- Return

Required fields:

- Material name
- Unit
- Limit
- Opening balance
- Received quantity
- Issued quantity
- Transfer quantity
- Damaged quantity
- Remaining quantity
- Notes

---

### 10. Stock Movement Ledger

Inventory should be based on stock movements, not fixed Excel-like columns.

Movement types:

```text
RECEIVE
ISSUE
TRANSFER_IN
TRANSFER_OUT
ADJUSTMENT
DAMAGE
RETURN
CONSUMPTION
```

Required fields:

- Project
- Item
- Movement type
- Quantity
- Movement date
- Source type
- Source reference
- Notes
- Created by
- Created at

---

### 11. Approval Workflow

Approval flow:

```text
Supervisor
↓
Assistant Supervisor
↓
Project Manager
↓
Client / Ministry Manager
```

Report status options:

```text
Draft
Submitted
Under Review
Returned
Approved
Rejected
Closed
```

Each approval action must store:

- Approver
- Approval step
- Status
- Comment
- Signature if applicable
- Date and time
- Version number

---

### 12. Attachments, Photos & Signatures

The system should support:

- Photo upload
- Signature capture
- File attachments
- Attachment preview
- Attachment linking to reports

Supported attachment types:

- Images
- PDF
- Excel files if needed

---

### 13. Reports & Export PDF/Excel

Required reports:

- Daily floor check report
- Daily project summary report
- Weekly warehouse report
- Monthly food inventory report
- Monthly materials report
- Shortage report
- Approval report

Required export formats:

- PDF
- Excel

Reports should include:

- Logo placeholder
- Project name
- Building/floor
- Date
- Supervisor
- Items table
- Planned quantity
- Actual quantity
- Difference
- Notes
- Photos
- Signature
- Approval status
- QR code placeholder if possible

---

### 14. Audit Logs

The system must log important actions.

Audit log should capture:

- User
- Action
- Entity type
- Entity ID
- Old value
- New value
- IP address if available
- Date and time

Actions to log:

- Login
- Create
- Update
- Delete
- Submit
- Review
- Approve
- Reject
- Return
- Export report

---

## Recommended Project Structure

```text
mirsad-daily-ops/
├── client/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── app.ts
│   ├── package.json
│   └── .env.example
│
├── seed/
│   └── mirsad-demo-data.json
│
├── docs/
│   └── Mirsad_Developer_Handover.pdf
│
├── README.md
└── .gitignore
```

---

## Suggested API Routes

```text
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/me

GET    /api/users
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id

GET    /api/projects
POST   /api/projects
PUT    /api/projects/:id
DELETE /api/projects/:id

GET    /api/buildings
POST   /api/buildings
PUT    /api/buildings/:id
DELETE /api/buildings/:id

GET    /api/floors
POST   /api/floors
PUT    /api/floors/:id
DELETE /api/floors/:id

GET    /api/items
POST   /api/items
PUT    /api/items/:id
DELETE /api/items/:id

GET    /api/daily-plans
POST   /api/daily-plans
GET    /api/daily-plans/:id
PUT    /api/daily-plans/:id
POST   /api/daily-plans/import-excel

GET    /api/floor-checks
POST   /api/floor-checks
GET    /api/floor-checks/:id
PUT    /api/floor-checks/:id
POST   /api/floor-checks/:id/submit

POST   /api/approvals/:entityType/:entityId/review
POST   /api/approvals/:entityType/:entityId/approve
POST   /api/approvals/:entityType/:entityId/return
POST   /api/approvals/:entityType/:entityId/reject

GET    /api/inventory/food
GET    /api/inventory/materials
GET    /api/inventory/movements
POST   /api/inventory/movements

POST   /api/attachments/upload

GET    /api/reports/daily
GET    /api/reports/weekly-warehouse
GET    /api/reports/monthly-food
GET    /api/reports/monthly-materials
GET    /api/reports/:id/pdf
GET    /api/reports/:id/excel

GET    /api/audit-logs
GET    /api/dashboard
```

---

## Full-Stack Deployment Notes

Express should serve the React build in production.

Expected behavior:

- `client/` contains React + Vite frontend
- `server/` contains Node.js + Express backend
- `server` serves `client/dist` in production
- API routes stay under `/api`
- React Router fallback should return `index.html`

Example production behavior:

```text
GET /               → React app
GET /dashboard      → React app
GET /daily-checks   → React app
GET /api/projects   → Express API
GET /api/items      → Express API
```

---

## Required Deliverables

The developer should provide:

1. Final single public demo URL
2. Admin login credentials
3. Test users credentials
4. README file with setup and run instructions
5. `.env.example` file only
6. Dummy data seed file
7. All modules accessible from the sidebar/menu

---

## Security Notes

Do not commit real secrets to GitHub.

Do not commit:

- MongoDB password
- API keys
- JWT secrets
- Tokens
- Real environment variables

Use `.env.example` only.

Required security basics:

- Passwords must be hashed
- JWT secret must be stored in environment variables
- API routes must be protected
- Role-based access should be enforced
- File upload should be restricted by type and size
- MongoDB connection string must not be committed

---

## Environment Variables Example

Create `.env.example` only.

```text
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mirsad
JWT_SECRET=replace_with_secure_secret
CLIENT_URL=http://localhost:5173
```

---

## Developer Handover Document

Please review the full developer handover PDF inside the `docs` folder:

```text
docs/Mirsad_Developer_Handover.pdf
```

The PDF contains the full project structure, modules, workflow, data model, API plan, reports, and acceptance criteria.

---

## Final Goal

The final demo should allow the owner to access one public URL, login, and review all Mirsad modules from the sidebar.

The demo should show a realistic workflow:

```text
Daily Plan
→ Floor Check
→ Submit
→ Review
→ Approve
→ Inventory Update
→ Report Export
```

The system should feel like a real product demo, not a static UI.

---

## New Modules — Roadmap Feature Scope

The following modules are planned for progressive implementation after the current stable demo. They do not affect the existing demo build. They are organized by package tier below.

---

### 15. Purchase Order Consumption Tracking

Each month, the operations team receives a Purchase Order with approved quantities for food and materials. The PO defines the approved quantity, and each distribution, delivery, or consumption transaction deducts from the remaining PO balance.

**Example:**

```text
PO-2026-05-001
Item: Fresh Juice
Approved Quantity: 3,000 bottles
Distributed Today: 120 bottles
Remaining PO Balance: 2,880 bottles
```

Required fields:

- PO Number
- Supplier
- Project
- Month
- Start Date
- End Date
- Item
- Approved Quantity
- Received Quantity
- Distributed Quantity
- Consumed Quantity
- Remaining Quantity
- Variance
- Status

PO status options:

- Active
- Partially Received
- Fully Received
- Near Depletion
- Over Consumed
- Closed

Required behavior:

- Purchase Receiving increases available stock
- Daily Allocation / Floor Distribution deducts from PO balance
- Consumption deducts from remaining PO balance
- Returns increase available stock
- Damage / Spoilage deducts from stock and is reflected in movement history
- System shows remaining PO balance by item
- System alerts when PO balance is low or exceeded

---

### 16. Warehouse-to-Floor Transfers

Workflow for transferring items from the warehouse to floors, coffee stations, executive lounges, and hospitality areas.

**Workflow:**

```text
Warehouse
→ Floor / Area
→ Received by Supervisor
→ Used / Returned / Damaged
```

Required fields:

- Source location
- Destination location
- Item
- Quantity
- Delivered by
- Received by
- Date / Time
- Notes
- Signature
- Status

Transfer status options:

- Pending
- In Transit
- Received
- Partially Received
- Returned
- Cancelled

---

### 17. Receiving and Delivery Workflow

Receiving and delivery process for food and materials across all operational stages.

**Required scenarios:**

- Supplier delivers to warehouse
- Warehouse receives items
- Warehouse delivers to floor or service area
- Supervisor confirms receiving
- Items are consumed, returned, or marked damaged

Required fields:

- Supplier
- Item
- Quantity
- Source
- Destination
- Received by
- Delivered by
- Date / Time
- Notes
- Photo attachment
- Signature

---

### 18. Maintenance Requests

Maintenance request module for hospitality and food service assets.

**Examples:**

- Fridge issue
- Coffee machine issue
- Freezer issue
- Counter / service area issue
- Shelf or storage issue
- Cleaning or facility issue

**Maintenance lifecycle:**

```text
New
→ Assigned
→ In Progress
→ Waiting Approval
→ Completed
→ Closed
```

Required fields:

- Request title
- Asset / area
- Location
- Priority
- Issue description
- Photo
- Assigned to
- Status
- Created by
- Closed by
- Completion notes

Priority options:

- Low
- Medium
- High
- Critical

---

### 19. Client Request Lifecycle

Client request workflow for hospitality service requests.

**Example:** A client requests hospitality service for a meeting. The system tracks the request from creation to delivery and closure.

**Lifecycle:**

```text
New Request
→ Received
→ Assigned
→ In Progress
→ Prepared
→ Delivered
→ Confirmed
→ Closed
```

Required fields:

- Request title
- Client / requester
- Project
- Location
- Date / Time needed
- Requested items
- Quantity
- Assigned team
- Status
- Delivery confirmation
- Notes
- Signature if needed

---

### 20. FIFO / FEFO Logic

Basic inventory rotation logic for food and material items.

**For food items:**

FEFO — First Expired, First Out.

Items with an earlier expiry date must be consumed first. Expiry date is required on receiving for food items.

**For non-food materials:**

FIFO — First In, First Out.

Items received earliest are issued first. Based on receiving date.

In the first version, this is basic logic and does not require advanced automation. The system records expiry dates and receiving dates to support correct rotation on issue and distribution.

---

### 21. Spoilage Recording

Recording of spoiled, damaged, or expired items.

Required fields:

- Item
- Quantity
- Reason
- Location
- Date / Time
- Notes
- Photo attachment
- Created by

Spoilage reason options:

- Expired
- Damaged
- Temperature issue
- Packaging issue
- Quality issue
- Spoiled
- Other

Spoilage records must be reflected in stock movement history as a DAMAGE movement type and deducted from the available balance.

---

## Package Tiers

Features are structured by package level to support phased delivery and client onboarding.

### Starter

- Basic PO Quantity Tracking
- Basic FIFO / FEFO
- Basic Spoilage Recording

### Professional

- PO-Based Allocation and Consumption Tracking
- Basic Receiving and Delivery Workflow
- Basic Warehouse-to-Floor Transfer View

### Enterprise

- Advanced PO Lifecycle and Variance Reporting
- Advanced Warehouse-to-Floor Transfers
- Maintenance Requests
- Client Request Lifecycle
- Advanced Food Safety readiness
- Fridge Check readiness
- Supplier and Traceability readiness

---

## New API Routes (Planned)

The following routes correspond to the new modules above and will be added progressively.

```text
GET    /api/purchase-orders
POST   /api/purchase-orders
GET    /api/purchase-orders/:id
PUT    /api/purchase-orders/:id
POST   /api/purchase-orders/:id/receive
POST   /api/purchase-orders/:id/distribute

GET    /api/transfers
POST   /api/transfers
GET    /api/transfers/:id
PUT    /api/transfers/:id
POST   /api/transfers/:id/confirm

GET    /api/receiving
POST   /api/receiving
GET    /api/receiving/:id
PUT    /api/receiving/:id
POST   /api/receiving/:id/confirm

GET    /api/maintenance
POST   /api/maintenance
GET    /api/maintenance/:id
PUT    /api/maintenance/:id
POST   /api/maintenance/:id/assign
POST   /api/maintenance/:id/complete

GET    /api/client-requests
POST   /api/client-requests
GET    /api/client-requests/:id
PUT    /api/client-requests/:id
POST   /api/client-requests/:id/assign
POST   /api/client-requests/:id/deliver
POST   /api/client-requests/:id/confirm

GET    /api/spoilage
POST   /api/spoilage
GET    /api/spoilage/:id
```

---

## Implementation Roadmap

```text
Phase 1 — Current (Stable Demo)
  Modules 1–14
  Daily plan → floor check → approval → inventory → reports

Phase 2 — Starter Tier
  Module 20: Basic FIFO / FEFO logic
  Module 21: Spoilage Recording
  Module 15: Basic PO Quantity Tracking

Phase 3 — Professional Tier
  Module 15: Full PO-Based Allocation and Consumption Tracking
  Module 16: Warehouse-to-Floor Transfers
  Module 17: Receiving and Delivery Workflow

Phase 4 — Enterprise Tier
  Module 18: Maintenance Requests
  Module 19: Client Request Lifecycle
  Advanced Food Safety readiness
  Fridge Check readiness
  Supplier and Traceability readiness
```

---

## Implemented Request Types (Phase 4 — Live)

Two specialised client request workflows are now live in the current demo under Module 19:

### Operation Requests

Daily operational requests submitted by floor/building staff.

**Examples:** Extra breakfast sandwiches for 5F, additional lunch meals for 15F, fresh fruits for a meeting.

**Request Type:** `operation_request`

**Lifecycle:** Submitted → Assigned → In Progress → Delivered → Confirmed

### Coffee Break Requests

Service requests for coffee breaks, meetings, and VIP hospitality.

**Examples:** Executive meeting coffee break (19F, 20 pax), VIP coffee service (Board Room), department event coffee (KAFAA-2, 25 pax).

**Request Type:** `coffee_break_request`

**Lifecycle:** Submitted → Assigned → In Progress → Delivered → Confirmed

Both request types appear as dedicated KPI cards on the dashboard, with separate tables showing the latest open requests per type.

---

## Ministry of Energy — Demo Data

The demo environment is seeded with real data from the Ministry of Energy cafeteria operation:

**Floor Structure (27 locations):**

- Main Building: 2F, 3F, 4F, 5F, 6F, 7F, 8F, 9F, 10F, 11F, 12F, 13F, 14F, 15F, 16F, 17F, 18F, 19F
- RD Building: RD 1&2, RD 3&4
- Kafaa Building: KAFAA-1, KAFAA-2, KAFAA-3, KAFAA-4
- Service Areas: MAKASSB, OLD, SECURITY

**Food Items (20 items, real monthly limits):**

Breakfast Sandwiches (19,635/month), Lunch Sandwiches (11,235), Gluten Free Breads (2,100),
Breakfast Meals (3,213), Lunch Meals (17,157), Fresh Fruits (10,500), Soups (5,040),
Salads (10,080), Sweet Bakery's (8,400), Salted Bakery's (8,400), Yogurts (5,040),
Nuts / Dates (10,500), Sweets Cakes (3,360), Granola (4,830), Fresh Juices (10,500),
Waraqnab / Fattah, Samoli, Pizza, Zaatar Bread, Om Ali.

**Material Items (38 items):**

Coffee: Original Blend, House Blend, Camel (Rwanda Cvanza), Siwar (Mananasi Uganda),
Shovel (Hambela), Bica, Turkish Coffee, Cardamom, Saffron, Saudi Coffee (Dallah).

Milk & Tea: Fresh Milk (Lactose Free), Vegetarian Milk, Black Tea, Green Tea,
Camomile Tea, Karak Tea.

Water & Drinks: Nova Water (Small), Tania Gallons Water, Soda Water, Soft Drinks, Almarai Juices.

Condiments: White Sugar, Brown Sugar, Diet Sugar, Wooden Stir Sticks,
Multi-Flavor Syrup, Hot Chocolate Mix, Condensed Milk, Bony Milk.

Snacks & Disposables: Digestive Biscuits, Chips, Paper Cups (Hot), Espresso Cups,
Paper Plates, Single Spoon, Single Knife, Single Fork, Cutlery Sets.
