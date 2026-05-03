import MockAdapter from 'axios-mock-adapter';
import apiClient from './client';
import {
  USERS, DEMO_PASSWORDS, PROJECTS, BUILDINGS, FLOORS,
  CATEGORIES, ITEMS, DAILY_PLANS, FLOOR_CHECKS,
  INVENTORY_FOOD, INVENTORY_MATERIALS, MOVEMENTS, AUDIT_LOGS, DASHBOARD,
  SUPPLIERS, BATCHES, FRIDGE_CHECKS, CORRECTIVE_ACTIONS, SPOILAGE_ALERTS,
  REPORTS, PURCHASE_ORDERS, SPOILAGE_RECORDS,
} from '../mocks/data';

function makeToken(user: typeof USERS[0]) {
  const payload = btoa(JSON.stringify({ sub: user._id, email: user.email, role: user.role }));
  return `demo.${payload}.sig`;
}

function paginated<T>(arr: T[], params: Record<string, string>) {
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '20');
  const start = (page - 1) * limit;
  return {
    success: true,
    data: arr.slice(start, start + limit),
    pagination: { total: arr.length, page, limit, pages: Math.ceil(arr.length / limit) },
  };
}

export function setupDemoMocks() {
  const mock = new MockAdapter(apiClient, { delayResponse: 250, onNoMatch: 'passthrough' });

  // Auth
  mock.onPost('/auth/login').reply(config => {
    const { email, password } = JSON.parse(config.data);
    const user = USERS.find(u => u.email === email);
    if (!user || DEMO_PASSWORDS[email] !== password)
      return [401, { success: false, message: 'Invalid credentials' }];
    // Match server format: token and user are at top level, not nested under data
    return [200, { success: true, token: makeToken(user), user }];
  });

  mock.onGet('/auth/me').reply(200, { success: true, data: USERS[0] });

  // Dashboard
  mock.onGet('/dashboard').reply(200, { success: true, data: DASHBOARD });

  // Users
  mock.onGet('/users').reply(config => [200, paginated(USERS, config.params || {})]);
  mock.onPost('/users').reply(config => {
    const body = JSON.parse(config.data);
    const user = { _id: `usr_${Date.now()}`, status: 'active', createdAt: new Date().toISOString(), ...body };
    USERS.push(user);
    return [201, { success: true, data: user }];
  });
  mock.onPut(/\/users\/.+/).reply(config => {
    const id = config.url!.split('/').pop()!;
    const idx = USERS.findIndex(u => u._id === id);
    if (idx === -1) return [404, { success: false, message: 'Not found' }];
    USERS[idx] = { ...USERS[idx], ...JSON.parse(config.data) };
    return [200, { success: true, data: USERS[idx] }];
  });

  // Projects
  mock.onGet('/projects').reply(config => [200, paginated(PROJECTS, config.params || {})]);
  mock.onPost('/projects').reply(config => {
    const p = { _id: `prj_${Date.now()}`, status: 'active', createdAt: new Date().toISOString(), ...JSON.parse(config.data) };
    PROJECTS.push(p);
    return [201, { success: true, data: p }];
  });
  mock.onPut(/\/projects\/.+/).reply(config => {
    const id = config.url!.split('/').pop()!;
    const idx = PROJECTS.findIndex(p => p._id === id);
    if (idx === -1) return [404, { success: false, message: 'Not found' }];
    PROJECTS[idx] = { ...PROJECTS[idx], ...JSON.parse(config.data) };
    return [200, { success: true, data: PROJECTS[idx] }];
  });

  // Buildings
  mock.onGet('/buildings').reply(config => [200, paginated(BUILDINGS, config.params || {})]);
  mock.onPost('/buildings').reply(config => {
    const b = { _id: `bld_${Date.now()}`, status: 'active', createdAt: new Date().toISOString(), ...JSON.parse(config.data) };
    BUILDINGS.push(b);
    return [201, { success: true, data: b }];
  });
  mock.onPut(/\/buildings\/.+/).reply(config => {
    const id = config.url!.split('/').pop()!;
    const idx = BUILDINGS.findIndex(b => b._id === id);
    if (idx === -1) return [404, { success: false, message: 'Not found' }];
    BUILDINGS[idx] = { ...BUILDINGS[idx], ...JSON.parse(config.data) };
    return [200, { success: true, data: BUILDINGS[idx] }];
  });

  // Floors
  mock.onGet('/floors').reply(config => [200, paginated(FLOORS, config.params || {})]);
  mock.onPost('/floors').reply(config => {
    const f = { _id: `flr_${Date.now()}`, status: 'active', ...JSON.parse(config.data) };
    FLOORS.push(f);
    return [201, { success: true, data: f }];
  });
  mock.onPut(/\/floors\/.+/).reply(config => {
    const id = config.url!.split('/').pop()!;
    const idx = FLOORS.findIndex(f => f._id === id);
    if (idx === -1) return [404, { success: false, message: 'Not found' }];
    FLOORS[idx] = { ...FLOORS[idx], ...JSON.parse(config.data) };
    return [200, { success: true, data: FLOORS[idx] }];
  });

  // Categories
  mock.onGet('/categories').reply(config => [200, paginated(CATEGORIES, config.params || {})]);
  mock.onPost('/categories').reply(config => {
    const c = { _id: `cat_${Date.now()}`, status: 'active', ...JSON.parse(config.data) };
    CATEGORIES.push(c);
    return [201, { success: true, data: c }];
  });

  // Items
  mock.onGet('/items').reply(config => {
    const type = config.params?.type;
    const filtered = type ? ITEMS.filter(i => i.type === type) : ITEMS;
    return [200, paginated(filtered, config.params || {})];
  });
  mock.onPost('/items').reply(config => {
    const item = { _id: `itm_${Date.now()}`, status: 'active', ...JSON.parse(config.data) };
    ITEMS.push(item);
    return [201, { success: true, data: item }];
  });
  mock.onPut(/\/items\/.+/).reply(config => {
    const id = config.url!.split('/').pop()!;
    const idx = ITEMS.findIndex(i => i._id === id);
    if (idx === -1) return [404, { success: false, message: 'Not found' }];
    ITEMS[idx] = { ...ITEMS[idx], ...JSON.parse(config.data) };
    return [200, { success: true, data: ITEMS[idx] }];
  });

  // Daily Plans
  mock.onGet('/daily-plans').reply(config => [200, paginated(DAILY_PLANS, config.params || {})]);
  mock.onGet(/\/daily-plans\/[^/]+$/).reply(config => {
    const id = config.url!.split('/').pop()!;
    const plan = DAILY_PLANS.find(p => p._id === id);
    return plan ? [200, { success: true, data: plan }] : [404, { success: false, message: 'Not found' }];
  });
  mock.onPost('/daily-plans').reply(config => {
    const plan = { _id: `pln_${Date.now()}`, status: 'draft', createdAt: new Date().toISOString(), lines: [], ...JSON.parse(config.data) };
    DAILY_PLANS.unshift(plan);
    return [201, { success: true, data: plan }];
  });
  mock.onPut(/\/daily-plans\/[^/]+$/).reply(config => {
    const id = config.url!.split('/').pop()!;
    const idx = DAILY_PLANS.findIndex(p => p._id === id);
    if (idx === -1) return [404, { success: false, message: 'Not found' }];
    DAILY_PLANS[idx] = { ...DAILY_PLANS[idx], ...JSON.parse(config.data) };
    return [200, { success: true, data: DAILY_PLANS[idx] }];
  });
  mock.onDelete(/\/daily-plans\/.+/).reply(config => {
    const id = config.url!.split('/').pop()!;
    const idx = DAILY_PLANS.findIndex(p => p._id === id);
    if (idx !== -1) DAILY_PLANS.splice(idx, 1);
    return [200, { success: true, data: {} }];
  });
  mock.onPost(/\/daily-plans\/.+\/copy/).reply(config => {
    const id = config.url!.split('/')[2];
    const src = DAILY_PLANS.find(p => p._id === id);
    if (!src) return [404, { success: false, message: 'Not found' }];
    const copy = { ...src, _id: `pln_${Date.now()}`, status: 'draft', createdAt: new Date().toISOString() };
    DAILY_PLANS.unshift(copy);
    return [201, { success: true, data: copy }];
  });

  // Floor Checks
  mock.onGet('/floor-checks').reply(config => {
    const statusParam = config.params?.status as string | undefined;
    let filtered = FLOOR_CHECKS;
    if (statusParam) {
      const statuses = statusParam.split(',');
      filtered = FLOOR_CHECKS.filter(f => statuses.includes(f.status));
    }
    return [200, paginated(filtered, config.params || {})];
  });
  mock.onGet(/\/floor-checks\/.+/).reply(config => {
    const id = config.url!.split('/').pop()!;
    const fc = FLOOR_CHECKS.find(f => f._id === id);
    return fc ? [200, { success: true, data: fc }] : [404, { success: false, message: 'Not found' }];
  });

  // Approvals
  mock.onPost(/\/approvals\/floor_check\/.+\/.+/).reply(config => {
    const parts = config.url!.split('/');
    const action = parts.pop()!;
    const id = parts.pop()!;
    const idx = FLOOR_CHECKS.findIndex(f => f._id === id);
    if (idx === -1) return [404, { success: false, message: 'Not found' }];
    const body = config.data ? JSON.parse(config.data) : {};
    const statusMap: Record<string, string> = {
      submit: 'submitted', approve: 'approved', reject: 'rejected', return: 'returned', review: 'under_review',
    };
    const newStatus = statusMap[action] || FLOOR_CHECKS[idx].status;
    FLOOR_CHECKS[idx] = {
      ...FLOOR_CHECKS[idx],
      status: newStatus as typeof FLOOR_CHECKS[0]['status'],
      approvalRecords: [
        ...FLOOR_CHECKS[idx].approvalRecords,
        { _id: `apr_${Date.now()}`, step: action, action, actor: { _id: USERS[3]._id, fullName: USERS[3].fullName, role: USERS[3].role }, comment: body.comment || '', version: 1, createdAt: new Date().toISOString() },
      ],
    };
    return [200, { success: true, data: FLOOR_CHECKS[idx] }];
  });

  // Inventory
  mock.onGet('/inventory/food').reply(config => [200, paginated(INVENTORY_FOOD, config.params || {})]);
  mock.onGet('/inventory/materials').reply(config => [200, paginated(INVENTORY_MATERIALS, config.params || {})]);
  mock.onGet('/inventory/movements').reply(config => [200, paginated(MOVEMENTS, config.params || {})]);
  mock.onPost('/inventory/movements').reply(config => {
    const mov = { _id: `mov_${Date.now()}`, createdAt: new Date().toISOString(), ...JSON.parse(config.data) };
    MOVEMENTS.unshift(mov);
    return [201, { success: true, data: mov }];
  });

  // Audit Logs
  mock.onGet('/audit-logs').reply(config => [200, paginated(AUDIT_LOGS, config.params || {})]);

  // Reports
  mock.onGet('/reports').reply(config => [200, paginated(REPORTS, config.params || {})]);
  mock.onGet(/\/reports\/.+/).reply(config => {
    const id = config.url!.split('/').pop()!;
    const r = REPORTS.find(x => x._id === id);
    return r ? [200, { success: true, data: r }] : [404, { success: false, message: 'Not found' }];
  });
  mock.onPost('/reports').reply(201, { success: true, data: { _id: `rpt_${Date.now()}` } });

  // Attachments
  mock.onPost('/attachments').reply(201, { success: true, data: { _id: `att_${Date.now()}`, url: '/placeholder.png', filename: 'demo.png', originalName: 'demo.png', mimeType: 'image/png', size: 0 } });

  // ── Phase 2 ──────────────────────────────────────────────────────────────────

  // Suppliers
  mock.onGet('/suppliers').reply(config => [200, paginated(SUPPLIERS, config.params || {})]);
  mock.onGet(/\/suppliers\/.+/).reply(config => {
    const id = config.url!.split('/').pop()!;
    const s = SUPPLIERS.find(x => x._id === id);
    return s ? [200, { success: true, data: s }] : [404, { success: false, message: 'Not found' }];
  });

  // Batches
  mock.onGet('/batches').reply(config => {
    const p = config.params || {};
    let list = [...BATCHES];
    if (p.status) list = list.filter(b => b.status === p.status);
    if (p.storageZone) list = list.filter(b => b.storageZone === p.storageZone);
    return [200, paginated(list, p)];
  });
  mock.onGet(/\/batches\/.+/).reply(config => {
    const id = config.url!.split('/').pop()!;
    const b = BATCHES.find(x => x._id === id);
    return b ? [200, { success: true, data: b }] : [404, { success: false, message: 'Not found' }];
  });

  // Expiry tracking (derived from batches)
  mock.onGet('/expiry-tracking').reply(config => {
    const tab = config.params?.tab || 'expired';
    const now2 = new Date();
    const list = BATCHES.filter(b => {
      const exp = new Date(b.expiryDate);
      const diff = (exp.getTime() - now2.getTime()) / 86400000;
      if (tab === 'expired') return diff < 0;
      if (tab === 'today')   return diff >= 0 && diff < 1;
      if (tab === '3days')   return diff >= 0 && diff <= 3;
      if (tab === '7days')   return diff >= 0 && diff <= 7;
      return false;
    });
    return [200, paginated(list, config.params || {})];
  });

  // Fridge Checks
  mock.onGet('/fridge-checks').reply(config => [200, paginated(FRIDGE_CHECKS, config.params || {})]);
  mock.onGet(/\/fridge-checks\/.+/).reply(config => {
    const id = config.url!.split('/').pop()!;
    const f = FRIDGE_CHECKS.find(x => x._id === id);
    return f ? [200, { success: true, data: f }] : [404, { success: false, message: 'Not found' }];
  });
  mock.onPost('/fridge-checks').reply(config => {
    const body = JSON.parse(config.data);
    const item = { _id: `frd_${Date.now()}`, status: 'ok', createdAt: new Date().toISOString(), itemsChecked: [], ...body };
    FRIDGE_CHECKS.unshift(item as typeof FRIDGE_CHECKS[0]);
    return [201, { success: true, data: item }];
  });

  // Corrective Actions
  mock.onGet('/corrective-actions').reply(config => {
    const p = config.params || {};
    let list = [...CORRECTIVE_ACTIONS];
    if (p.status) list = list.filter(c => c.status === p.status);
    if (p.priority) list = list.filter(c => c.priority === p.priority);
    return [200, paginated(list, p)];
  });
  mock.onGet(/\/corrective-actions\/.+/).reply(config => {
    const id = config.url!.split('/').pop()!;
    const c = CORRECTIVE_ACTIONS.find(x => x._id === id);
    return c ? [200, { success: true, data: c }] : [404, { success: false, message: 'Not found' }];
  });
  mock.onPut(/\/corrective-actions\/.+/).reply(config => {
    const id = config.url!.split('/').pop()!;
    const idx = CORRECTIVE_ACTIONS.findIndex(x => x._id === id);
    if (idx === -1) return [404, { success: false, message: 'Not found' }];
    CORRECTIVE_ACTIONS[idx] = { ...CORRECTIVE_ACTIONS[idx], ...JSON.parse(config.data) };
    return [200, { success: true, data: CORRECTIVE_ACTIONS[idx] }];
  });

  // Spoilage Alerts
  mock.onGet('/spoilage-alerts').reply(config => {
    const p = config.params || {};
    let list = [...SPOILAGE_ALERTS];
    if (p.status) list = list.filter(s => s.status === p.status);
    return [200, paginated(list, p)];
  });
  mock.onPut(/\/spoilage-alerts\/.+\/resolve/).reply(config => {
    const id = config.url!.split('/')[2];
    const idx = SPOILAGE_ALERTS.findIndex(x => x._id === id);
    if (idx !== -1) SPOILAGE_ALERTS[idx] = { ...SPOILAGE_ALERTS[idx], status: 'resolved', resolvedBy: { _id: USERS[4]._id, fullName: USERS[4].fullName } };
    return [200, { success: true, data: SPOILAGE_ALERTS[idx] }];
  });

  // Purchase Orders
  mock.onGet('/purchase-orders').reply(config => {
    const p = config.params || {};
    let list = [...PURCHASE_ORDERS];
    if (p.status) list = list.filter(po => po.status === p.status);
    if (p.month)  list = list.filter(po => po.month === p.month);
    if (p.project) list = list.filter(po => (po.project as any)._id === p.project);
    return [200, paginated(list, p)];
  });
  mock.onGet(/\/purchase-orders\/.+/).reply(config => {
    const id = config.url!.split('/').pop()!;
    const po = PURCHASE_ORDERS.find(x => x._id === id);
    return po ? [200, { success: true, data: po }] : [404, { success: false, message: 'Not found' }];
  });
  mock.onPost('/purchase-orders').reply(config => {
    const body = JSON.parse(config.data);
    const po = { _id: `po_${Date.now()}`, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...body };
    PURCHASE_ORDERS.push(po as any);
    return [201, { success: true, data: po }];
  });

  // Spoilage recording
  mock.onGet('/spoilage').reply(config => {
    const p = config.params || {};
    let list = [...SPOILAGE_RECORDS];
    if (p.reason) list = list.filter(s => s.reason === p.reason);
    return [200, paginated(list, p)];
  });
  mock.onPost('/spoilage').reply(config => {
    const body = JSON.parse(config.data);
    const item = ITEMS.find(i => i._id === body.item) || ITEMS[0];
    const record = {
      _id: `spr_${Date.now()}`,
      item: { _id: item._id, name: item.name, unit: item.unit, type: item.type },
      project: PROJECTS.find(p => p._id === body.project) || PROJECTS[0],
      quantity: body.quantity,
      reason: body.reason,
      alertType: body.alertType || 'spoiled',
      location: body.location,
      date: body.date || new Date().toISOString(),
      notes: body.notes || '',
      status: 'active' as const,
      detectedAt: new Date().toISOString(),
      createdBy: { _id: USERS[0]._id, fullName: USERS[0].fullName },
      createdAt: new Date().toISOString(),
    };
    SPOILAGE_RECORDS.unshift(record as any);
    return [201, { success: true, data: record }];
  });

  // Project detail
  mock.onGet(/\/projects\/.+/).reply(config => {
    const id = config.url!.split('/').pop()!;
    const p = PROJECTS.find(x => x._id === id);
    return p ? [200, { success: true, data: p }] : [404, { success: false, message: 'Not found' }];
  });

  // Inventory item detail
  mock.onGet(/\/inventory\/food\/.+/).reply(config => {
    const id = config.url!.split('/').pop()!;
    const item = INVENTORY_FOOD.find(x => x._id === id);
    return item ? [200, { success: true, data: item }] : [404, { success: false, message: 'Not found' }];
  });
  mock.onGet(/\/inventory\/materials\/.+/).reply(config => {
    const id = config.url!.split('/').pop()!;
    const item = INVENTORY_MATERIALS.find(x => x._id === id);
    return item ? [200, { success: true, data: item }] : [404, { success: false, message: 'Not found' }];
  });
}
