#!/usr/bin/env node
/**
 * Mirsad Load Test — autocannon-based
 * Tests 7 user flow scenarios at 10 / 25 / 50 concurrent users
 */

const autocannon = require('autocannon');
const http = require('http');

const BASE = 'http://localhost:5001';
const DURATION = 20; // seconds per run

// ── Get auth token ────────────────────────────────────────────────────────────
function getToken() {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ email: 'admin@mirsad.demo', password: 'Demo@12345' });
    const req = http.request({
      hostname: 'localhost', port: 5001, path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data).token));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Run one autocannon test ───────────────────────────────────────────────────
function runTest(title, connections, requests, token) {
  return new Promise((resolve) => {
    const instance = autocannon({
      title,
      duration: DURATION,
      connections,
      requests,
      headers: { Authorization: `Bearer ${token}` },
      url: BASE,
    });
    autocannon.track(instance, { renderProgressBar: false });
    instance.on('done', resolve);
  });
}

// ── Format helpers ────────────────────────────────────────────────────────────
function ms(v) { return v != null ? `${Math.round(v)}ms` : 'n/a'; }
function pct(v) { return v != null ? `${v.toFixed(1)}%` : 'n/a'; }

function summarise(label, result) {
  const total    = result.requests.total;
  const errors   = (result['2xx'] != null)
    ? total - (result['2xx'] || 0)
    : (result.errors || 0) + (result.timeouts || 0) + (result.non2xx || 0);
  const errRate  = total > 0 ? (errors / total) * 100 : 0;
  const avg      = result.latency?.mean;
  const p95      = result.latency?.p97_5 ?? result.latency?.p95;
  const p99      = result.latency?.p99;
  const rps      = result.requests?.mean;
  const thrMB    = result.throughput?.mean
    ? (result.throughput.mean / 1024 / 1024).toFixed(2)
    : 'n/a';

  return { label, avg, p95, p99, errRate, rps, errors, total, thrMB };
}

function printTable(rows) {
  const cols = [
    { key: 'label',   hdr: 'Scenario',              w: 32 },
    { key: 'avg',     hdr: 'Avg (ms)',               w: 10, fmt: v => Math.round(v ?? 0) },
    { key: 'p95',     hdr: 'p95 (ms)',               w: 10, fmt: v => Math.round(v ?? 0) },
    { key: 'p99',     hdr: 'p99 (ms)',               w: 10, fmt: v => Math.round(v ?? 0) },
    { key: 'errRate', hdr: 'Err %',                  w: 8,  fmt: v => (v ?? 0).toFixed(2) },
    { key: 'rps',     hdr: 'Req/s',                  w: 8,  fmt: v => Math.round(v ?? 0) },
    { key: 'total',   hdr: 'Total Req',              w: 10 },
    { key: 'thrMB',   hdr: 'MB/s',                   w: 8  },
  ];

  const line = cols.map(c => c.hdr.padEnd(c.w)).join(' | ');
  const sep  = cols.map(c => '-'.repeat(c.w)).join('-+-');
  console.log('\n' + sep);
  console.log(line);
  console.log(sep);
  rows.forEach(r => {
    const row = cols.map(c => {
      const raw = r[c.key];
      const val = c.fmt ? c.fmt(raw) : (raw ?? '');
      return String(val).padEnd(c.w);
    }).join(' | ');
    console.log(row);
  });
  console.log(sep);
}

// ── Scenarios ─────────────────────────────────────────────────────────────────
function buildScenarios(token) {
  const auth = { Authorization: `Bearer ${token}` };
  const json = { 'Content-Type': 'application/json', ...auth };

  return [
    {
      name: '1. Login',
      requests: [{
        method: 'POST', path: '/api/auth/login',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@mirsad.demo', password: 'Demo@12345' }),
      }],
    },
    {
      name: '2. Dashboard',
      requests: [{ method: 'GET', path: '/api/dashboard', headers: auth }],
    },
    {
      name: '3. Inventory (food + materials + movements)',
      requests: [
        { method: 'GET', path: '/api/inventory/food',      headers: auth },
        { method: 'GET', path: '/api/inventory/materials', headers: auth },
        { method: 'GET', path: '/api/inventory/movements', headers: auth },
      ],
    },
    {
      name: '4. Create request (maintenance)',
      requests: [{
        method: 'POST', path: '/api/maintenance',
        headers: json,
        body: JSON.stringify({
          title: 'Load test request',
          description: 'Generated during load test',
          category: 'other', priority: 'low',
        }),
      }],
    },
    {
      name: '5. Approvals (list + floor checks)',
      requests: [
        { method: 'GET', path: '/api/approvals',    headers: auth },
        { method: 'GET', path: '/api/floor-checks', headers: auth },
      ],
    },
    {
      name: '6. Report generation',
      requests: [
        { method: 'GET', path: '/api/reports',      headers: auth },
        {
          method: 'POST', path: '/api/reports',
          headers: json,
          body: JSON.stringify({
            reportType: 'monthly_food_inventory',
            dateFrom: '2026-05-01', dateTo: '2026-05-31',
          }),
        },
      ],
    },
    {
      name: '7. Audit log access',
      requests: [{ method: 'GET', path: '/api/audit-logs', headers: auth }],
    },
  ];
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('='.repeat(72));
  console.log('  MIRSAD BACKEND LOAD TEST');
  console.log('  Node.js/Express + In-memory MongoDB');
  console.log(`  Duration per run: ${DURATION}s | Base URL: ${BASE}`);
  console.log('='.repeat(72));

  const token = await getToken();
  console.log(`\n✓ Auth token acquired\n`);

  const levels = [
    { label: '10 concurrent users',  connections: 10 },
    { label: '25 concurrent users',  connections: 25 },
    { label: '50 concurrent users',  connections: 50 },
  ];

  const allResults = {};
  const scenarios  = buildScenarios(token);

  for (const level of levels) {
    console.log('\n' + '='.repeat(72));
    console.log(`  LOAD LEVEL: ${level.label}`);
    console.log('='.repeat(72));

    const rows = [];

    for (const scenario of scenarios) {
      process.stdout.write(`  Running: ${scenario.name} ... `);
      const result = await runTest(
        `${level.label} — ${scenario.name}`,
        level.connections,
        scenario.requests,
        token,
      );
      const row = summarise(scenario.name, result);
      rows.push(row);
      console.log(`done  (avg ${Math.round(row.avg ?? 0)}ms, p95 ${Math.round(row.p95 ?? 0)}ms, err ${(row.errRate ?? 0).toFixed(2)}%)`);
    }

    allResults[level.label] = rows;
    printTable(rows);
  }

  // ── Summary table ────────────────────────────────────────────────────────────
  console.log('\n\n' + '='.repeat(72));
  console.log('  SUMMARY — WORST-CASE PER LOAD LEVEL (highest p95 across scenarios)');
  console.log('='.repeat(72));

  const TARGET_AVG = 300;
  const TARGET_P95 = 800;
  const TARGET_ERR = 1.0;

  const summaryRows = [];
  for (const [levelLabel, rows] of Object.entries(allResults)) {
    const maxAvg  = Math.max(...rows.map(r => r.avg  ?? 0));
    const maxP95  = Math.max(...rows.map(r => r.p95  ?? 0));
    const maxErr  = Math.max(...rows.map(r => r.errRate ?? 0));
    const totalRq = rows.reduce((s, r) => s + (r.total || 0), 0);
    summaryRows.push({ levelLabel, maxAvg, maxP95, maxErr, totalRq });
  }

  console.log('\n' + [
    'Load Level              ',
    'Worst Avg(ms)',
    'Worst p95(ms)',
    'Max Err%',
    'Total Req',
    'Avg Target',
    'p95 Target',
    'Pass?',
  ].join(' | '));
  console.log('-'.repeat(110));

  for (const r of summaryRows) {
    const passAvg = r.maxAvg  <= TARGET_AVG;
    const passP95 = r.maxP95  <= TARGET_P95;
    const passErr = r.maxErr  <= TARGET_ERR;
    const pass    = passAvg && passP95 && passErr ? 'PASS' : 'FAIL';
    console.log([
      r.levelLabel.padEnd(24),
      String(Math.round(r.maxAvg)).padEnd(13),
      String(Math.round(r.maxP95)).padEnd(13),
      r.maxErr.toFixed(2).padEnd(8),
      String(r.totalRq).padEnd(9),
      `<${TARGET_AVG}ms`.padEnd(10),
      `<${TARGET_P95}ms`.padEnd(10),
      pass,
    ].join(' | '));
  }

  console.log('\n' + '='.repeat(72));
  console.log('  TEST COMPLETE');
  console.log('='.repeat(72) + '\n');
}

main().catch(console.error).finally(() => process.exit(0));
