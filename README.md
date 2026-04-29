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
