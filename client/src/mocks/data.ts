// Static demo dataset — mirrors server/src/db/seedDemo.ts

const now = new Date();
const d = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000).toISOString();

export const PROJECT_ID = 'aaa000000000000000000001';
export const BUILDING_ID = 'bbb000000000000000000001';

export const USERS = [
  { _id: 'usr000000000000000000001', fullName: 'Ahmed Al-Rashidi', email: 'admin@mirsad.demo', role: 'admin', status: 'active', phone: '+966501234567', createdAt: d(30) },
  { _id: 'usr000000000000000000002', fullName: 'Mohammed Al-Ghamdi', email: 'supervisor@mirsad.demo', role: 'supervisor', status: 'active', phone: '+966502345678', project: { _id: PROJECT_ID, name: 'NEOM Phase 1' }, createdAt: d(28) },
  { _id: 'usr000000000000000000003', fullName: 'Khalid Al-Otaibi', email: 'assistant@mirsad.demo', role: 'assistant_supervisor', status: 'active', phone: '+966503456789', project: { _id: PROJECT_ID, name: 'NEOM Phase 1' }, createdAt: d(25) },
  { _id: 'usr000000000000000000004', fullName: 'Abdullah Al-Qahtani', email: 'manager@mirsad.demo', role: 'project_manager', status: 'active', phone: '+966504567890', project: { _id: PROJECT_ID, name: 'NEOM Phase 1' }, createdAt: d(20) },
  { _id: 'usr000000000000000000005', fullName: 'Omar Al-Zahrani', email: 'client@mirsad.demo', role: 'client', status: 'active', phone: '+966505678901', project: { _id: PROJECT_ID, name: 'NEOM Phase 1' }, createdAt: d(15) },
];

export const DEMO_PASSWORDS: Record<string, string> = {
  'admin@mirsad.demo': 'Demo@12345',
  'supervisor@mirsad.demo': 'Demo@12345',
  'assistant@mirsad.demo': 'Demo@12345',
  'manager@mirsad.demo': 'Demo@12345',
  'client@mirsad.demo': 'Demo@12345',
};

export const PROJECTS = [
  { _id: PROJECT_ID, name: 'NEOM Phase 1', clientName: 'NEOM Company', locationCode: 'NE-P1', status: 'active', createdAt: d(30) },
];

export const BUILDINGS = [
  { _id: BUILDING_ID, project: { _id: PROJECT_ID, name: 'NEOM Phase 1' }, name: 'Main Residential Block', status: 'active', createdAt: d(29) },
];

const floorNames = ['2F', '3F', '4F', '19F', 'MAKASSB', 'SECURITY', 'KAFAA-1', 'KAFAA-2'];
export const FLOORS = floorNames.map((name, i) => ({
  _id: `flr00000000000000000000${i + 1}`.slice(0, 24),
  building: { _id: BUILDING_ID, name: 'Main Residential Block' },
  project: { _id: PROJECT_ID, name: 'NEOM Phase 1' },
  name,
  locationCode: `LOC-${name}`,
  status: 'active',
}));

const foodCatNames = ['Rice & Grains', 'Bread & Bakery', 'Proteins', 'Dairy', 'Vegetables', 'Fruits', 'Beverages', 'Condiments', 'Canned Goods', 'Frozen Foods', 'Snacks', 'Oils & Fats', 'Legumes'];
const matCatNames = ['Cleaning Supplies', 'Sanitization', 'Kitchen Equipment', 'Bedding', 'Toiletries', 'Safety', 'Electrical', 'Plumbing', 'Tools', 'Stationery', 'PPE', 'Packaging'];

export const CATEGORIES = [
  ...foodCatNames.map((name, i) => ({ _id: `cat00000000000000000000${i + 1}`.slice(0, 24), name, type: 'food', status: 'active' })),
  ...matCatNames.map((name, i) => ({ _id: `cat0000000000000000000${i + 14}`.slice(0, 24), name, type: 'material', status: 'active' })),
];

const foodItems = [
  { name: 'Basmati Rice', unit: 'kg', limitQty: 500 },
  { name: 'White Bread', unit: 'loaf', limitQty: 200 },
  { name: 'Chicken Breast', unit: 'kg', limitQty: 300 },
  { name: 'Whole Milk', unit: 'L', limitQty: 150 },
  { name: 'Tomatoes', unit: 'kg', limitQty: 100 },
  { name: 'Apples', unit: 'kg', limitQty: 80 },
  { name: 'Water Bottles (500ml)', unit: 'case', limitQty: 400 },
  { name: 'Salt', unit: 'kg', limitQty: 50 },
  { name: 'Canned Tuna', unit: 'can', limitQty: 200 },
  { name: 'Frozen Beef', unit: 'kg', limitQty: 250 },
  { name: 'Dates', unit: 'kg', limitQty: 100 },
  { name: 'Sunflower Oil', unit: 'L', limitQty: 200 },
  { name: 'Lentils', unit: 'kg', limitQty: 150 },
  { name: 'Eggs', unit: 'dozen', limitQty: 300 },
  { name: 'Yogurt', unit: 'kg', limitQty: 120 },
  { name: 'Pasta', unit: 'kg', limitQty: 180 },
  { name: 'Cooking Oil Spray', unit: 'can', limitQty: 60 },
  { name: 'Sugar', unit: 'kg', limitQty: 100 },
  { name: 'Tea Bags', unit: 'box', limitQty: 80 },
  { name: 'Instant Coffee', unit: 'jar', limitQty: 50 },
];

const matItems = [
  { name: 'Floor Cleaner', unit: 'L', limitQty: 100 },
  { name: 'Hand Sanitizer', unit: 'L', limitQty: 80 },
  { name: 'Mop Set', unit: 'set', limitQty: 20 },
  { name: 'Bed Sheets (Twin)', unit: 'set', limitQty: 150 },
  { name: 'Shampoo (500ml)', unit: 'bottle', limitQty: 200 },
  { name: 'Safety Helmet', unit: 'pcs', limitQty: 50 },
  { name: 'Extension Cord', unit: 'pcs', limitQty: 30 },
  { name: 'Pipe Wrench', unit: 'pcs', limitQty: 10 },
  { name: 'Screwdriver Set', unit: 'set', limitQty: 15 },
  { name: 'A4 Paper', unit: 'ream', limitQty: 100 },
  { name: 'Gloves (Latex)', unit: 'box', limitQty: 80 },
  { name: 'Trash Bags (Large)', unit: 'roll', limitQty: 120 },
  { name: 'Toilet Paper', unit: 'roll', limitQty: 500 },
  { name: 'Dish Soap', unit: 'L', limitQty: 60 },
  { name: 'Face Masks (N95)', unit: 'box', limitQty: 40 },
  { name: 'Broom', unit: 'pcs', limitQty: 25 },
  { name: 'Disinfectant Spray', unit: 'can', limitQty: 90 },
  { name: 'Light Bulbs (LED)', unit: 'pcs', limitQty: 60 },
];

export const ITEMS = [
  ...foodItems.map((item, i) => ({
    _id: `itm00000000000000000000${i + 1}`.slice(0, 24),
    ...item,
    category: CATEGORIES[Math.floor(i / 2)],
    type: 'food',
    status: 'active',
  })),
  ...matItems.map((item, i) => ({
    _id: `itm0000000000000000000${i + 21}`.slice(0, 24),
    ...item,
    category: CATEGORIES[13 + Math.floor(i / 2)],
    type: 'material',
    status: 'active',
  })),
];

const shifts = ['morning', 'afternoon', 'evening', 'night'] as const;
export const DAILY_PLANS = Array.from({ length: 7 }, (_, i) => ({
  _id: `pln00000000000000000000${i + 1}`.slice(0, 24),
  date: d(i),
  project: { _id: PROJECT_ID, name: 'NEOM Phase 1' },
  building: { _id: BUILDING_ID, name: 'Main Residential Block' },
  shift: shifts[i % 4],
  status: i === 0 ? 'draft' : 'published',
  createdBy: { _id: USERS[1]._id, fullName: USERS[1].fullName },
  createdAt: d(i + 1),
  lines: FLOORS.slice(0, 4).map((fl, li) => ({
    _id: `pll${i}${li}000000000000000000`.slice(0, 24),
    floor: fl,
    item: ITEMS[li * 2],
    plannedQty: 10 + li * 5,
    notes: '',
  })),
}));

const fcStatuses: Array<'approved' | 'approved' | 'submitted' | 'under_review' | 'returned' | 'draft'> =
  ['approved', 'approved', 'approved', 'submitted', 'under_review', 'returned', 'draft', 'approved'];

export const FLOOR_CHECKS = FLOORS.flatMap((floor, fi) =>
  Array.from({ length: 7 }, (_, di) => {
    const status = fcStatuses[(fi + di) % fcStatuses.length];
    const id = `fck${fi}${di}000000000000000000`.slice(0, 24);
    return {
      _id: id,
      date: d(di),
      project: { _id: PROJECT_ID, name: 'NEOM Phase 1' },
      building: { _id: BUILDING_ID, name: 'Main Residential Block' },
      floor,
      shift: shifts[di % 4],
      supervisor: { _id: USERS[1]._id, fullName: USERS[1].fullName },
      status,
      currentApprovalStep: status === 'submitted' ? 'assistant_review' : status === 'under_review' ? 'manager_approval' : 'complete',
      notes: status === 'returned' ? 'Please recheck quantities on floor 3' : '',
      createdAt: d(di + 1),
      approvalRecords: status === 'approved' ? [
        { _id: `apr${fi}${di}a000000000000000`.slice(0, 24), step: 'supervisor_submit', action: 'submitted', actor: { _id: USERS[1]._id, fullName: USERS[1].fullName, role: 'supervisor' }, comment: '', version: 1, createdAt: d(di + 0.5) },
        { _id: `apr${fi}${di}b000000000000000`.slice(0, 24), step: 'assistant_review', action: 'approved', actor: { _id: USERS[2]._id, fullName: USERS[2].fullName, role: 'assistant_supervisor' }, comment: 'Verified', version: 1, createdAt: d(di + 0.3) },
        { _id: `apr${fi}${di}c000000000000000`.slice(0, 24), step: 'manager_approval', action: 'approved', actor: { _id: USERS[3]._id, fullName: USERS[3].fullName, role: 'project_manager' }, comment: 'Approved', version: 1, createdAt: d(di + 0.1) },
      ] : [],
      lines: ITEMS.slice(0, 6).map((item, li) => ({
        _id: `fcl${fi}${di}${li}00000000000000`.slice(0, 24),
        item,
        plannedQty: 10 + li * 3,
        actualQty: 10 + li * 3 - (li % 3 === 0 ? 1 : 0),
        difference: li % 3 === 0 ? -1 : 0,
        lineStatus: li % 3 === 0 ? 'shortage' : 'ok',
        notes: '',
        photos: [],
      })),
    };
  })
);

const period = () => {
  const m = now.getMonth() + 1;
  return `${now.getFullYear()}-${String(m).padStart(2, '0')}`;
};

export const INVENTORY_FOOD = ITEMS.filter(i => i.type === 'food').map((item, i) => ({
  _id: `invf0000000000000000000${i + 1}`.slice(0, 24),
  project: { _id: PROJECT_ID, name: 'NEOM Phase 1' },
  item: { _id: item._id, name: item.name, unit: item.unit, category: item.category },
  period: period(),
  monthlyLimit: item.limitQty,
  openingBalance: Math.floor(item.limitQty * 0.2),
  receivedQty: Math.floor(item.limitQty * 0.8),
  consumedQty: Math.floor(item.limitQty * 0.5),
  issuedQty: 0,
  damagedQty: Math.floor(item.limitQty * 0.02),
  returnedQty: Math.floor(item.limitQty * 0.05),
  remainingQty: Math.floor(item.limitQty * 0.53),
  status: i % 7 === 0 ? 'low_stock' : i % 13 === 0 ? 'out_of_stock' : 'available',
}));

export const INVENTORY_MATERIALS = ITEMS.filter(i => i.type === 'material').map((item, i) => ({
  _id: `invm0000000000000000000${i + 1}`.slice(0, 24),
  project: { _id: PROJECT_ID, name: 'NEOM Phase 1' },
  item: { _id: item._id, name: item.name, unit: item.unit, category: item.category },
  period: period(),
  monthlyLimit: item.limitQty,
  openingBalance: Math.floor(item.limitQty * 0.3),
  receivedQty: Math.floor(item.limitQty * 0.7),
  consumedQty: 0,
  issuedQty: Math.floor(item.limitQty * 0.4),
  damagedQty: Math.floor(item.limitQty * 0.01),
  returnedQty: Math.floor(item.limitQty * 0.03),
  remainingQty: Math.floor(item.limitQty * 0.62),
  status: i % 9 === 0 ? 'low_stock' : 'available',
}));

const movTypes = ['receive', 'issue', 'consumption', 'damage', 'return', 'adjustment'];
export const MOVEMENTS = Array.from({ length: 30 }, (_, i) => ({
  _id: `mov00000000000000000000${i + 1}`.slice(0, 24),
  project: { _id: PROJECT_ID, name: 'NEOM Phase 1' },
  item: ITEMS[i % ITEMS.length],
  movementType: movTypes[i % movTypes.length],
  quantity: 10 + (i % 20) * 5,
  movementDate: d(i % 14),
  sourceType: 'manual',
  notes: '',
  createdBy: { _id: USERS[0]._id, fullName: USERS[0].fullName },
  createdAt: d(i % 14 + 1),
}));

export const AUDIT_LOGS = [
  { _id: 'aud000000000000000000001', user: { _id: USERS[0]._id, fullName: USERS[0].fullName, email: USERS[0].email, role: 'admin' }, action: 'login', entityType: 'User', entityId: USERS[0]._id, createdAt: d(0) },
  { _id: 'aud000000000000000000002', user: { _id: USERS[1]._id, fullName: USERS[1].fullName, email: USERS[1].email, role: 'supervisor' }, action: 'create', entityType: 'FloorCheck', entityId: FLOOR_CHECKS[0]._id, createdAt: d(1) },
  { _id: 'aud000000000000000000003', user: { _id: USERS[1]._id, fullName: USERS[1].fullName, email: USERS[1].email, role: 'supervisor' }, action: 'submit', entityType: 'FloorCheck', entityId: FLOOR_CHECKS[1]._id, createdAt: d(2) },
  { _id: 'aud000000000000000000004', user: { _id: USERS[2]._id, fullName: USERS[2].fullName, email: USERS[2].email, role: 'assistant_supervisor' }, action: 'approve', entityType: 'FloorCheck', entityId: FLOOR_CHECKS[2]._id, createdAt: d(2) },
  { _id: 'aud000000000000000000005', user: { _id: USERS[3]._id, fullName: USERS[3].fullName, email: USERS[3].email, role: 'project_manager' }, action: 'approve', entityType: 'FloorCheck', entityId: FLOOR_CHECKS[2]._id, createdAt: d(3) },
];

export const DASHBOARD: Record<string, unknown> = {
  checks: { total: FLOOR_CHECKS.length, completed: FLOOR_CHECKS.filter(f => f.status === 'approved').length, pending: FLOOR_CHECKS.filter(f => ['submitted', 'under_review'].includes(f.status)).length },
  reports: { submitted: 12, approved: 8, rejected: 2 },
  shortages: FLOOR_CHECKS.flatMap(f => f.lines).filter(l => l.lineStatus === 'shortage').length,
  lowStock: INVENTORY_FOOD.filter(i => i.status === 'low_stock').length + INVENTORY_MATERIALS.filter(i => i.status === 'low_stock').length,
  outOfStock: INVENTORY_FOOD.filter(i => i.status === 'out_of_stock').length,
  pendingApprovals: FLOOR_CHECKS.filter(f => ['submitted', 'under_review'].includes(f.status)).length,
  foodInventory: {
    available: INVENTORY_FOOD.filter(i => i.status === 'available').length,
    lowStock: INVENTORY_FOOD.filter(i => i.status === 'low_stock').length,
    outOfStock: INVENTORY_FOOD.filter(i => i.status === 'out_of_stock').length,
    overConsumed: 0,
  },
  materialsInventory: {
    available: INVENTORY_MATERIALS.filter(i => i.status === 'available').length,
    lowStock: INVENTORY_MATERIALS.filter(i => i.status === 'low_stock').length,
    outOfStock: 0,
  },
  recentActivity: FLOOR_CHECKS[0].approvalRecords.slice(0, 5),
};
