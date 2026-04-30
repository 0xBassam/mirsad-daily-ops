import MockAdapter from 'axios-mock-adapter';
import apiClient from './client';
import {
  USERS, DEMO_PASSWORDS, PROJECTS, BUILDINGS, FLOORS,
  CATEGORIES, ITEMS, DAILY_PLANS, FLOOR_CHECKS,
  INVENTORY_FOOD, INVENTORY_MATERIALS, MOVEMENTS, AUDIT_LOGS, DASHBOARD,
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
  mock.onGet('/reports').reply(200, { success: true, data: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 } });
  mock.onPost('/reports').reply(201, { success: true, data: { _id: `rpt_${Date.now()}` } });

  // Attachments
  mock.onPost('/attachments').reply(201, { success: true, data: { _id: `att_${Date.now()}`, url: '/placeholder.png', filename: 'demo.png', originalName: 'demo.png', mimeType: 'image/png', size: 0 } });
}
