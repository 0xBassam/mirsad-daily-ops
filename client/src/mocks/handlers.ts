import { http, HttpResponse } from 'msw';
import {
  USERS, DEMO_PASSWORDS, PROJECTS, BUILDINGS, FLOORS,
  CATEGORIES, ITEMS, DAILY_PLANS, FLOOR_CHECKS,
  INVENTORY_FOOD, INVENTORY_MATERIALS, MOVEMENTS, AUDIT_LOGS, DASHBOARD,
} from './data';

// axios baseURL is '/api' (absolute path), so all requests go to https://origin/api/...
// MSW handlers must use the same absolute paths — no base prefix.
const paginate = <T>(arr: T[], url: URL) => {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const start = (page - 1) * limit;
  const items = arr.slice(start, start + limit);
  return { success: true, data: items, pagination: { total: arr.length, page, limit, pages: Math.ceil(arr.length / limit) } };
};

const ok = (data: unknown, extra?: object) => HttpResponse.json({ success: true, data, ...extra });
const err = (msg: string, status = 400) => HttpResponse.json({ success: false, message: msg }, { status });

function makeToken(user: typeof USERS[0]) {
  const payload = btoa(JSON.stringify({ sub: user._id, email: user.email, role: user.role }));
  return `demo.${payload}.sig`;
}

function decodeToken(req: Request): typeof USERS[0] | null {
  const auth = req.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  if (!token.startsWith('demo.')) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return USERS.find(u => u._id === payload.sub) || null;
  } catch {
    return null;
  }
}

export const handlers = [
  // Auth
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    const user = USERS.find(u => u.email === body.email);
    if (!user || DEMO_PASSWORDS[body.email] !== body.password) return err('Invalid credentials', 401);
    return ok({ token: makeToken(user), user });
  }),

  http.get('/api/auth/me', ({ request }) => {
    const user = decodeToken(request);
    if (!user) return err('Unauthorized', 401);
    return ok(user);
  }),

  // Dashboard
  http.get('/api/dashboard', () => ok(DASHBOARD)),

  // Users
  http.get('/api/users', ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(paginate(USERS, url));
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json() as Partial<typeof USERS[0]>;
    const user = { _id: `usr_${Date.now()}`, status: 'active', createdAt: new Date().toISOString(), ...body } as typeof USERS[0];
    USERS.push(user);
    return ok(user);
  }),

  http.put('/api/users/:id', async ({ request, params }) => {
    const body = await request.json() as Partial<typeof USERS[0]>;
    const idx = USERS.findIndex(u => u._id === params.id);
    if (idx === -1) return err('Not found', 404);
    USERS[idx] = { ...USERS[idx], ...body };
    return ok(USERS[idx]);
  }),

  // Projects
  http.get('/api/projects', ({ request }) => HttpResponse.json(paginate(PROJECTS, new URL(request.url)))),
  http.post('/api/projects', async ({ request }) => {
    const body = await request.json() as typeof PROJECTS[0];
    const p = { _id: `prj_${Date.now()}`, status: 'active', createdAt: new Date().toISOString(), ...body };
    PROJECTS.push(p);
    return ok(p);
  }),
  http.put('/api/projects/:id', async ({ request, params }) => {
    const body = await request.json() as Partial<typeof PROJECTS[0]>;
    const idx = PROJECTS.findIndex(p => p._id === params.id);
    if (idx === -1) return err('Not found', 404);
    PROJECTS[idx] = { ...PROJECTS[idx], ...body };
    return ok(PROJECTS[idx]);
  }),

  // Buildings
  http.get('/api/buildings', ({ request }) => HttpResponse.json(paginate(BUILDINGS, new URL(request.url)))),
  http.post('/api/buildings', async ({ request }) => {
    const body = await request.json() as typeof BUILDINGS[0];
    const b = { _id: `bld_${Date.now()}`, status: 'active', createdAt: new Date().toISOString(), ...body };
    BUILDINGS.push(b);
    return ok(b);
  }),
  http.put('/api/buildings/:id', async ({ request, params }) => {
    const body = await request.json() as Partial<typeof BUILDINGS[0]>;
    const idx = BUILDINGS.findIndex(b => b._id === params.id);
    if (idx === -1) return err('Not found', 404);
    BUILDINGS[idx] = { ...BUILDINGS[idx], ...body };
    return ok(BUILDINGS[idx]);
  }),

  // Floors
  http.get('/api/floors', ({ request }) => HttpResponse.json(paginate(FLOORS, new URL(request.url)))),
  http.post('/api/floors', async ({ request }) => {
    const body = await request.json() as typeof FLOORS[0];
    const f = { _id: `flr_${Date.now()}`, status: 'active', ...body };
    FLOORS.push(f);
    return ok(f);
  }),
  http.put('/api/floors/:id', async ({ request, params }) => {
    const body = await request.json() as Partial<typeof FLOORS[0]>;
    const idx = FLOORS.findIndex(f => f._id === params.id);
    if (idx === -1) return err('Not found', 404);
    FLOORS[idx] = { ...FLOORS[idx], ...body };
    return ok(FLOORS[idx]);
  }),

  // Categories
  http.get('/api/categories', ({ request }) => HttpResponse.json(paginate(CATEGORIES, new URL(request.url)))),
  http.post('/api/categories', async ({ request }) => {
    const body = await request.json() as typeof CATEGORIES[0];
    const c = { _id: `cat_${Date.now()}`, status: 'active', ...body };
    CATEGORIES.push(c);
    return ok(c);
  }),

  // Items
  http.get('/api/items', ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const filtered = type ? ITEMS.filter(i => i.type === type) : ITEMS;
    return HttpResponse.json(paginate(filtered, url));
  }),
  http.post('/api/items', async ({ request }) => {
    const body = await request.json() as typeof ITEMS[0];
    const item = { _id: `itm_${Date.now()}`, status: 'active', ...body };
    ITEMS.push(item);
    return ok(item);
  }),
  http.put('/api/items/:id', async ({ request, params }) => {
    const body = await request.json() as Partial<typeof ITEMS[0]>;
    const idx = ITEMS.findIndex(i => i._id === params.id);
    if (idx === -1) return err('Not found', 404);
    ITEMS[idx] = { ...ITEMS[idx], ...body };
    return ok(ITEMS[idx]);
  }),

  // Daily Plans
  http.get('/api/daily-plans', ({ request }) => HttpResponse.json(paginate(DAILY_PLANS, new URL(request.url)))),
  http.get('/api/daily-plans/:id', ({ params }) => {
    const plan = DAILY_PLANS.find(p => p._id === params.id);
    return plan ? ok(plan) : err('Not found', 404);
  }),
  http.post('/api/daily-plans', async ({ request }) => {
    const body = await request.json() as typeof DAILY_PLANS[0];
    const plan = { _id: `pln_${Date.now()}`, status: 'draft', createdAt: new Date().toISOString(), lines: [], ...body };
    DAILY_PLANS.unshift(plan);
    return ok(plan);
  }),
  http.put('/api/daily-plans/:id', async ({ request, params }) => {
    const body = await request.json() as Partial<typeof DAILY_PLANS[0]>;
    const idx = DAILY_PLANS.findIndex(p => p._id === params.id);
    if (idx === -1) return err('Not found', 404);
    DAILY_PLANS[idx] = { ...DAILY_PLANS[idx], ...body };
    return ok(DAILY_PLANS[idx]);
  }),
  http.delete('/api/daily-plans/:id', ({ params }) => {
    const idx = DAILY_PLANS.findIndex(p => p._id === params.id);
    if (idx !== -1) DAILY_PLANS.splice(idx, 1);
    return ok({ message: 'Deleted' });
  }),
  http.post('/api/daily-plans/:id/copy', ({ params }) => {
    const src = DAILY_PLANS.find(p => p._id === params.id);
    if (!src) return err('Not found', 404);
    const copy = { ...src, _id: `pln_${Date.now()}`, status: 'draft', date: new Date().toISOString(), createdAt: new Date().toISOString() };
    DAILY_PLANS.unshift(copy);
    return ok(copy);
  }),

  // Floor Checks
  http.get('/api/floor-checks', ({ request }) => {
    const url = new URL(request.url);
    const statusParam = url.searchParams.get('status');
    let filtered = FLOOR_CHECKS;
    if (statusParam) {
      const statuses = statusParam.split(',');
      filtered = FLOOR_CHECKS.filter(f => statuses.includes(f.status));
    }
    return HttpResponse.json(paginate(filtered, url));
  }),
  http.get('/api/floor-checks/:id', ({ params }) => {
    const fc = FLOOR_CHECKS.find(f => f._id === params.id);
    return fc ? ok(fc) : err('Not found', 404);
  }),

  // Approvals
  http.post('/api/approvals/floor_check/:id/:action', async ({ request, params }) => {
    const body = await request.json() as { comment?: string };
    const idx = FLOOR_CHECKS.findIndex(f => f._id === params.id);
    if (idx === -1) return err('Not found', 404);
    const action = params.action as string;
    const user = decodeToken(request) || USERS[3];
    const statusMap: Record<string, string> = {
      submit: 'submitted', approve: 'approved', reject: 'rejected', return: 'returned', review: 'under_review',
    };
    const newStatus = statusMap[action] || FLOOR_CHECKS[idx].status;
    FLOOR_CHECKS[idx] = {
      ...FLOOR_CHECKS[idx],
      status: newStatus as typeof FLOOR_CHECKS[0]['status'],
      approvalRecords: [
        ...FLOOR_CHECKS[idx].approvalRecords,
        { _id: `apr_${Date.now()}`, step: action, action, actor: { _id: user._id, fullName: user.fullName, role: user.role }, comment: body.comment || '', version: 1, createdAt: new Date().toISOString() },
      ],
    };
    return ok(FLOOR_CHECKS[idx]);
  }),

  // Inventory
  http.get('/api/inventory/food', ({ request }) => HttpResponse.json(paginate(INVENTORY_FOOD, new URL(request.url)))),
  http.get('/api/inventory/materials', ({ request }) => HttpResponse.json(paginate(INVENTORY_MATERIALS, new URL(request.url)))),
  http.get('/api/inventory/movements', ({ request }) => HttpResponse.json(paginate(MOVEMENTS, new URL(request.url)))),
  http.post('/api/inventory/movements', async ({ request }) => {
    const body = await request.json() as typeof MOVEMENTS[0];
    const mov = { _id: `mov_${Date.now()}`, createdAt: new Date().toISOString(), ...body };
    MOVEMENTS.unshift(mov);
    return ok(mov);
  }),

  // Audit Logs
  http.get('/api/audit-logs', ({ request }) => HttpResponse.json(paginate(AUDIT_LOGS, new URL(request.url)))),

  // Reports (no PDF generation in demo)
  http.get('/api/reports', () => ok([], { pagination: { total: 0, page: 1, limit: 20, pages: 0 } })),
  http.post('/api/reports', () => ok({ _id: `rpt_${Date.now()}`, status: 'demo' })),

  // Attachments (no-op in demo)
  http.post('/api/attachments', () => ok({ _id: `att_${Date.now()}`, url: '/placeholder.png', filename: 'demo.png', originalName: 'demo.png', mimeType: 'image/png', size: 0 })),
];
