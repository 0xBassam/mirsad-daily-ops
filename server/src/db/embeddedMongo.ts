/**
 * Zero-dependency embedded MongoDB server speaking the OP_MSG wire protocol.
 * Used as an in-memory fallback when no real MONGODB_URI is configured.
 */
import * as net from 'net';
import { ObjectId, Long, Binary, serialize, deserialize } from 'bson';

const OP_MSG = 2013;
type Doc = Record<string, any>;

// ─── In-memory store ───────────────────────────────────────────────────────────
const store: Record<string, Record<string, Doc[]>> = {};

export function getStore() { return store; }

function getColl(db: string, coll: string): Doc[] {
  if (!store[db]) store[db] = {};
  if (!store[db][coll]) store[db][coll] = [];
  return store[db][coll];
}

// ─── Field helpers ─────────────────────────────────────────────────────────────
function getField(doc: Doc, path: string): any {
  const parts = path.split('.');
  let cur: any = doc;
  for (const p of parts) { if (cur == null) return undefined; cur = cur[p]; }
  return cur;
}

function setField(doc: Doc, path: string, val: any): void {
  const parts = path.split('.');
  let cur: any = doc;
  for (let i = 0; i < parts.length - 1; i++) {
    if (cur[parts[i]] == null || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = val;
}

function delField(doc: Doc, path: string): void {
  const parts = path.split('.');
  let cur: any = doc;
  for (let i = 0; i < parts.length - 1; i++) { if (!cur[parts[i]]) return; cur = cur[parts[i]]; }
  delete cur[parts[parts.length - 1]];
}

// ─── Value equality ────────────────────────────────────────────────────────────
function eq(a: any, b: any): boolean {
  if (a === b) return true;
  if (a instanceof ObjectId && b instanceof ObjectId) return a.equals(b);
  if (a instanceof ObjectId) return a.toString() === String(b);
  if (b instanceof ObjectId) return b.toString() === String(a);
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (Array.isArray(a) && !Array.isArray(b)) return a.some(v => eq(v, b));
  return false;
}

// ─── Document matching ─────────────────────────────────────────────────────────
function matchDoc(doc: Doc, filter: Doc): boolean {
  if (!filter || typeof filter !== 'object') return true;
  for (const [key, val] of Object.entries(filter)) {
    if (key === '$and') { if (!(val as any[]).every((f: Doc) => matchDoc(doc, f))) return false; continue; }
    if (key === '$or')  { if (!(val as any[]).some((f: Doc) => matchDoc(doc, f))) return false; continue; }
    if (key === '$nor') { if ( (val as any[]).some((f: Doc) => matchDoc(doc, f))) return false; continue; }
    const dv = getField(doc, key);
    if (val != null && typeof val === 'object' && !(val instanceof ObjectId) && !(val instanceof Date) && !Array.isArray(val) && !Buffer.isBuffer(val)) {
      for (const [op, ov] of Object.entries(val as Doc)) {
        switch (op) {
          case '$eq':  if (!eq(dv, ov)) return false; break;
          case '$ne':  if ( eq(dv, ov)) return false; break;
          case '$gt':  if (!(dv >  ov)) return false; break;
          case '$gte': if (!(dv >= ov)) return false; break;
          case '$lt':  if (!(dv <  ov)) return false; break;
          case '$lte': if (!(dv <= ov)) return false; break;
          case '$in':  if (!(ov as any[]).some((v: any) => eq(dv, v))) return false; break;
          case '$nin': if ( (ov as any[]).some((v: any) => eq(dv, v))) return false; break;
          case '$regex': {
            const flags = (val as any).$options || '';
            if (!new RegExp(ov as string, flags).test(String(dv ?? ''))) return false; break;
          }
          case '$exists': { const exists = dv !== undefined; if (ov && !exists) return false; if (!ov && exists) return false; break; }
          case '$size': if (!Array.isArray(dv) || dv.length !== ov) return false; break;
          case '$elemMatch':
            if (!Array.isArray(dv) || !dv.some((el: any) => matchDoc(typeof el === 'object' && el ? el : { '': el }, ov as Doc))) return false; break;
          case '$not': if (matchDoc({ v: dv }, { v: ov })) return false; break;
          case '$options': break;
          case '$type': break;
        }
      }
    } else {
      if (!eq(dv, val)) return false;
    }
  }
  return true;
}

// ─── Update ────────────────────────────────────────────────────────────────────
function applyUpdate(doc: Doc, upd: Doc): Doc {
  if (!Object.keys(upd).some(k => k.startsWith('$'))) return { _id: doc._id, ...upd };
  const r: Doc = { ...doc };
  if (upd.$set)       for (const [k, v] of Object.entries(upd.$set)) setField(r, k, v);
  if (upd.$unset)     for (const k of Object.keys(upd.$unset)) delField(r, k);
  if (upd.$inc)       for (const [k, v] of Object.entries(upd.$inc)) setField(r, k, (getField(r, k) || 0) + (v as number));
  if (upd.$mul)       for (const [k, v] of Object.entries(upd.$mul)) setField(r, k, (getField(r, k) || 0) * (v as number));
  if (upd.$push) {
    for (const [k, v] of Object.entries(upd.$push)) {
      let arr = getField(r, k); if (!Array.isArray(arr)) arr = arr != null ? [arr] : [];
      const val = v as any;
      if (val && typeof val === 'object' && '$each' in val) {
        let s = [...arr, ...val.$each];
        if (val.$sort) s = sortDocs(s, val.$sort);
        if (val.$slice != null) s = s.slice(0, val.$slice);
        setField(r, k, s);
      } else { setField(r, k, [...arr, val]); }
    }
  }
  if (upd.$pull) {
    for (const [k, v] of Object.entries(upd.$pull)) {
      const arr = getField(r, k);
      if (Array.isArray(arr)) setField(r, k, arr.filter((el: any) => !eq(el, v)));
    }
  }
  if (upd.$addToSet) {
    for (const [k, v] of Object.entries(upd.$addToSet)) {
      let arr = getField(r, k); if (!Array.isArray(arr)) arr = [];
      const items = (v as any).$each ? (v as any).$each : [v];
      for (const item of items) { if (!arr.some((el: any) => eq(el, item))) arr = [...arr, item]; }
      setField(r, k, arr);
    }
  }
  return r;
}

// ─── Sort ──────────────────────────────────────────────────────────────────────
function sortDocs(docs: Doc[], spec: Doc | null): Doc[] {
  if (!spec) return docs;
  return [...docs].sort((a, b) => {
    for (const [k, dir] of Object.entries(spec)) {
      const av = getField(a, k), bv = getField(b, k);
      let cmp = 0;
      if (av == null && bv == null) continue;
      if (av == null) cmp = -1; else if (bv == null) cmp = 1;
      else if (av instanceof Date && bv instanceof Date) cmp = av.getTime() - bv.getTime();
      else cmp = av < bv ? -1 : av > bv ? 1 : 0;
      if (cmp !== 0) return (dir as number) === 1 ? cmp : -cmp;
    }
    return 0;
  });
}

// ─── Projection ────────────────────────────────────────────────────────────────
function projectDoc(doc: Doc, proj: Doc): Doc {
  if (!proj || !Object.keys(proj).length) return doc;
  const isInc = Object.entries(proj).some(([k, v]) => k !== '_id' && (v === 1 || v === true));
  const r: Doc = {};
  if (isInc) {
    if (proj._id !== 0 && proj._id !== false) r._id = doc._id;
    for (const [k, v] of Object.entries(proj)) { if (v === 1 || v === true) r[k] = getField(doc, k); }
  } else {
    Object.assign(r, doc);
    for (const [k, v] of Object.entries(proj)) { if (v === 0 || v === false) delete r[k]; }
  }
  return r;
}

// ─── Expression evaluator ──────────────────────────────────────────────────────
function evalExpr(expr: any, doc: Doc): any {
  if (expr === null || expr === undefined) return expr;
  if (typeof expr === 'string') return expr.startsWith('$') ? getField(doc, expr.slice(1)) : expr;
  if (typeof expr !== 'object' || expr instanceof ObjectId || expr instanceof Date) return expr;
  if (Array.isArray(expr)) return expr.map((e: any) => evalExpr(e, doc));

  if ('$cond' in expr) {
    const [c, t, f] = Array.isArray(expr.$cond) ? expr.$cond : [expr.$cond.if, expr.$cond.then, expr.$cond.else];
    return evalExpr(c, doc) ? evalExpr(t, doc) : evalExpr(f, doc);
  }
  if ('$eq'  in expr) return eq(evalExpr(expr.$eq[0], doc), evalExpr(expr.$eq[1], doc));
  if ('$ne'  in expr) return !eq(evalExpr(expr.$ne[0], doc), evalExpr(expr.$ne[1], doc));
  if ('$gt'  in expr) return evalExpr(expr.$gt[0],  doc) >  evalExpr(expr.$gt[1],  doc);
  if ('$gte' in expr) return evalExpr(expr.$gte[0], doc) >= evalExpr(expr.$gte[1], doc);
  if ('$lt'  in expr) return evalExpr(expr.$lt[0],  doc) <  evalExpr(expr.$lt[1],  doc);
  if ('$lte' in expr) return evalExpr(expr.$lte[0], doc) <= evalExpr(expr.$lte[1], doc);
  if ('$and' in expr) return (expr.$and as any[]).every((x: any) => evalExpr(x, doc));
  if ('$or'  in expr) return (expr.$or  as any[]).some((x: any) => evalExpr(x, doc));
  if ('$not' in expr) return !evalExpr(expr.$not, doc);
  if ('$add' in expr) return (expr.$add as any[]).reduce((s: number, x: any) => s + (Number(evalExpr(x, doc)) || 0), 0);
  if ('$subtract' in expr) return evalExpr(expr.$subtract[0], doc) - evalExpr(expr.$subtract[1], doc);
  if ('$multiply' in expr) return (expr.$multiply as any[]).reduce((p: number, x: any) => p * (Number(evalExpr(x, doc)) || 0), 1);
  if ('$divide'   in expr) return evalExpr(expr.$divide[0], doc) / evalExpr(expr.$divide[1], doc);
  if ('$mod'      in expr) return evalExpr(expr.$mod[0], doc) % evalExpr(expr.$mod[1], doc);
  if ('$abs'      in expr) return Math.abs(evalExpr(expr.$abs, doc));
  if ('$floor'    in expr) return Math.floor(evalExpr(expr.$floor, doc));
  if ('$ceil'     in expr) return Math.ceil(evalExpr(expr.$ceil, doc));
  if ('$round'    in expr) { const v = Array.isArray(expr.$round) ? expr.$round[0] : expr.$round; return Math.round(evalExpr(v, doc)); }
  if ('$sum' in expr) {
    const e = expr.$sum;
    if (Array.isArray(e)) return e.reduce((s: number, x: any) => s + (Number(evalExpr(x, doc)) || 0), 0);
    return Number(evalExpr(e, doc)) || 0;
  }
  if ('$max' in expr) { const e = expr.$max; if (Array.isArray(e)) { const vs = e.map((x: any) => evalExpr(x, doc)).filter((v: any) => v != null); return vs.length ? Math.max(...vs) : null; } return evalExpr(e, doc); }
  if ('$min' in expr) { const e = expr.$min; if (Array.isArray(e)) { const vs = e.map((x: any) => evalExpr(x, doc)).filter((v: any) => v != null); return vs.length ? Math.min(...vs) : null; } return evalExpr(e, doc); }
  if ('$toLower'   in expr) return String(evalExpr(expr.$toLower,   doc) ?? '').toLowerCase();
  if ('$toUpper'   in expr) return String(evalExpr(expr.$toUpper,   doc) ?? '').toUpperCase();
  if ('$toString'  in expr) return String(evalExpr(expr.$toString,  doc));
  if ('$toInt'     in expr) return parseInt(String(evalExpr(expr.$toInt, doc)), 10);
  if ('$toDouble'  in expr) return parseFloat(String(evalExpr(expr.$toDouble, doc)));
  if ('$concat'    in expr) return (expr.$concat as any[]).map((x: any) => String(evalExpr(x, doc) ?? '')).join('');
  if ('$ifNull'    in expr) { const v = evalExpr(expr.$ifNull[0], doc); return v != null ? v : evalExpr(expr.$ifNull[1], doc); }
  if ('$in'        in expr) return (evalExpr(expr.$in[1], doc) ?? []).some((v: any) => eq(evalExpr(expr.$in[0], doc), v));
  if ('$size'      in expr) { const v = evalExpr(expr.$size, doc); return Array.isArray(v) ? v.length : 0; }
  if ('$literal'   in expr) return expr.$literal;
  if ('$arrayElemAt' in expr) { const a = evalExpr(expr.$arrayElemAt[0], doc), i = evalExpr(expr.$arrayElemAt[1], doc); if (!Array.isArray(a)) return null; return i >= 0 ? a[i] : a[a.length + i]; }
  if ('$first'     in expr) { const a = evalExpr(expr.$first, doc); return Array.isArray(a) ? a[0] : a; }
  if ('$last'      in expr) { const a = evalExpr(expr.$last,  doc); return Array.isArray(a) ? a[a.length - 1] : a; }
  if ('$map' in expr) {
    const arr = evalExpr(expr.$map.input, doc), vn = expr.$map.as || 'this';
    return Array.isArray(arr) ? arr.map((item: any) => evalExpr(expr.$map.in, { ...doc, [vn]: item, [`$$${vn}`]: item })) : [];
  }
  if ('$filter' in expr) {
    const arr = evalExpr(expr.$filter.input, doc), vn = expr.$filter.as || 'this';
    return Array.isArray(arr) ? arr.filter((item: any) => evalExpr(expr.$filter.cond, { ...doc, [vn]: item, [`$$${vn}`]: item })) : [];
  }
  if ('$year'      in expr) { const d = evalExpr(expr.$year, doc);      return d instanceof Date ? d.getFullYear()  : null; }
  if ('$month'     in expr) { const d = evalExpr(expr.$month, doc);     return d instanceof Date ? d.getMonth() + 1 : null; }
  if ('$dayOfMonth'in expr) { const d = evalExpr(expr.$dayOfMonth, doc);return d instanceof Date ? d.getDate()      : null; }
  if ('$dateToString' in expr) {
    const d = evalExpr(expr.$dateToString.date, doc), fmt = expr.$dateToString.format || '%Y-%m-%d';
    if (!(d instanceof Date)) return null;
    return fmt.replace('%Y', d.getFullYear().toString()).replace('%m', String(d.getMonth()+1).padStart(2,'0')).replace('%d', String(d.getDate()).padStart(2,'0'));
  }
  if ('$type' in expr) {
    const v = evalExpr(expr.$type, doc);
    if (v instanceof ObjectId) return 'objectId';
    if (typeof v === 'string') return 'string';
    if (Number.isInteger(v)) return 'int';
    if (typeof v === 'number') return 'double';
    if (typeof v === 'boolean') return 'bool';
    if (v instanceof Date) return 'date';
    if (Array.isArray(v)) return 'array';
    if (v === null) return 'null';
    return 'object';
  }
  // plain object — eval each field
  const r: Doc = {};
  for (const [k, v] of Object.entries(expr)) r[k] = evalExpr(v, doc);
  return r;
}

// ─── Accumulator helpers ───────────────────────────────────────────────────────
type AccState = { n: number; sum: number; min: any; max: any; items: any[]; set: any[]; first: any; firstSet: boolean; last: any };
function mkAccState(): AccState { return { n: 0, sum: 0, min: null, max: null, items: [], set: [], first: undefined, firstSet: false, last: undefined }; }

function accumStep(s: AccState, spec: any, doc: Doc): AccState {
  const r = { ...s, items: s.items, set: s.set };
  const op = Object.keys(spec)[0], expr = spec[op];
  const val = evalExpr(op === '$count' ? 1 : expr, doc);
  switch (op) {
    case '$sum':   r.sum += typeof val === 'number' ? val : 0; r.n++; break;
    case '$avg':   if (typeof val === 'number') { r.sum += val; r.n++; } break;
    case '$min':   if (val != null && (r.min == null || val < r.min)) r.min = val; break;
    case '$max':   if (val != null && (r.max == null || val > r.max)) r.max = val; break;
    case '$push':  r.items = [...r.items, val]; break;
    case '$addToSet': if (!r.set.some((v: any) => eq(v, val))) r.set = [...r.set, val]; break;
    case '$first': if (!r.firstSet) { r.first = val; r.firstSet = true; } break;
    case '$last':  r.last = val; break;
    case '$count': r.sum++; r.n++; break;
  }
  return r;
}

function accumFinal(s: AccState, spec: any): any {
  const op = Object.keys(spec)[0];
  switch (op) {
    case '$sum': return s.sum;
    case '$avg': return s.n > 0 ? s.sum / s.n : null;
    case '$min': return s.min;
    case '$max': return s.max;
    case '$push': return s.items;
    case '$addToSet': return s.set;
    case '$first': return s.first;
    case '$last': return s.last;
    case '$count': return s.sum;
    default: return null;
  }
}

// ─── Aggregation pipeline ──────────────────────────────────────────────────────
function runPipeline(inputDocs: Doc[], pipeline: any[], dbName: string): Doc[] {
  let docs = [...inputDocs];
  for (const stage of pipeline) {
    const [sn] = Object.keys(stage);
    switch (sn) {
      case '$match':
        docs = docs.filter(d => matchDoc(d, stage.$match));
        break;
      case '$project': {
        const proj = stage.$project;
        const isInc = Object.entries(proj).some(([k, v]) => k !== '_id' && (v === 1 || v === true || (typeof v === 'object' && v !== null && !('$literal' in (v as any)))));
        docs = docs.map(d => {
          const out: Doc = {};
          if (isInc) { if (proj._id !== 0 && proj._id !== false) out._id = d._id; }
          else Object.assign(out, d);
          for (const [k, v] of Object.entries(proj)) {
            if (v === 0 || v === false) { delete out[k]; continue; }
            if (v === 1 || v === true) { out[k] = getField(d, k); continue; }
            out[k] = evalExpr(v, d);
          }
          return out;
        });
        break;
      }
      case '$addFields':
        docs = docs.map(d => { const out = { ...d }; for (const [k, v] of Object.entries(stage.$addFields)) out[k] = evalExpr(v, d); return out; });
        break;
      case '$sort':  docs = sortDocs(docs, stage.$sort); break;
      case '$skip':  docs = docs.slice(stage.$skip as number); break;
      case '$limit': docs = docs.slice(0, stage.$limit as number); break;
      case '$count': docs = [{ [stage.$count]: docs.length }]; break;
      case '$replaceRoot': docs = docs.map(d => evalExpr(stage.$replaceRoot.newRoot, d)); break;
      case '$replaceWith': docs = docs.map(d => evalExpr(stage.$replaceWith, d)); break;
      case '$group': {
        const spec = stage.$group;
        const groups = new Map<string, { key: any; states: Record<string, AccState> }>();
        for (const doc of docs) {
          const keyVal = evalExpr(spec._id, doc);
          const keyStr = JSON.stringify(keyVal, (_, v) => v instanceof ObjectId ? v.toString() : v);
          if (!groups.has(keyStr)) {
            const states: Record<string, AccState> = {};
            for (const k of Object.keys(spec)) { if (k !== '_id') states[k] = mkAccState(); }
            groups.set(keyStr, { key: keyVal, states });
          }
          const grp = groups.get(keyStr)!;
          for (const k of Object.keys(spec)) { if (k !== '_id') grp.states[k] = accumStep(grp.states[k], spec[k], doc); }
        }
        docs = Array.from(groups.values()).map(({ key, states }) => {
          const out: Doc = { _id: key };
          for (const [k, v] of Object.entries(spec)) { if (k !== '_id') out[k] = accumFinal(states[k], v); }
          return out;
        });
        break;
      }
      case '$lookup': {
        const lu = stage.$lookup;
        docs = docs.map(doc => {
          let foreign: Doc[] = [];
          for (const db of Object.values(store)) { if (db[lu.from]) foreign = [...foreign, ...db[lu.from]]; }
          if (lu.pipeline) {
            const vars = lu.let || {};
            const ctx: Doc = {};
            for (const [k, v] of Object.entries(vars as Doc)) { ctx[k] = evalExpr(v, doc); ctx[`$$${k}`] = ctx[k]; }
            foreign = runPipeline(foreign.map(fd => ({ ...fd, ...ctx })), lu.pipeline, dbName);
          } else {
            const lv = getField(doc, lu.localField);
            foreign = foreign.filter(fd => eq(getField(fd, lu.foreignField), lv));
          }
          return { ...doc, [lu.as]: foreign };
        });
        break;
      }
      case '$unwind': {
        const cfg = typeof stage.$unwind === 'string' ? { path: stage.$unwind } : stage.$unwind;
        const fn = cfg.path.startsWith('$') ? cfg.path.slice(1) : cfg.path;
        const preserve = cfg.preserveNullAndEmptyArrays || false;
        const idxField = cfg.includeArrayIndex;
        const out: Doc[] = [];
        for (const doc of docs) {
          const arr = getField(doc, fn);
          if (Array.isArray(arr) && arr.length > 0) {
            arr.forEach((item: any, i: number) => {
              const d = { ...doc }; setField(d, fn, item);
              if (idxField) d[idxField] = i;
              out.push(d);
            });
          } else if (preserve) { const d = { ...doc }; setField(d, fn, null); out.push(d); }
        }
        docs = out;
        break;
      }
      case '$facet': {
        const result: Doc = {};
        for (const [k, sub] of Object.entries(stage.$facet as Record<string, any[]>)) result[k] = runPipeline([...docs], sub, dbName);
        docs = [result];
        break;
      }
      case '$out': { const c = getColl(dbName, stage.$out); c.length = 0; c.push(...docs); break; }
      case '$merge': {
        const t = typeof stage.$merge === 'string' ? stage.$merge : stage.$merge.into;
        const c = getColl(dbName, t);
        for (const d of docs) { const i = c.findIndex(x => eq(x._id, d._id)); if (i >= 0) c[i] = d; else c.push(d); }
        break;
      }
    }
  }
  return docs;
}

// ─── Command handler ───────────────────────────────────────────────────────────
function handleCommand(cmd: Doc, dbName: string): Doc {
  const skip = new Set(['$db', '$readPreference', 'lsid', '$clusterTime', '$client']);
  const cmdName = Object.keys(cmd).find(k => !skip.has(k) && !k.startsWith('$'));
  if (!cmdName) return { ok: 1 };

  switch (cmdName) {
    case 'hello': case 'ismaster': case 'isMaster':
      return { ismaster: true, isWritablePrimary: true, helloOk: true,
               localTime: new Date(), connectionId: 1, minWireVersion: 0, maxWireVersion: 21,
               maxBsonObjectSize: 16777216, maxMessageSizeBytes: 48000000, maxWriteBatchSize: 100000,
               logicalSessionTimeoutMinutes: 30, readOnly: false, ok: 1,
               topologyVersion: { processId: FIXED_PROCESS_ID, counter: Long.fromNumber(0) } };
    case 'ping': return { ok: 1 };
    case 'buildInfo': case 'buildinfo': return { version: '7.0.0', gitVersion: '', ok: 1 };
    case 'getCmdLineOpts': return { argv: [], parsed: {}, ok: 1 };
    case 'connectionStatus': return { authInfo: { authenticatedUsers: [], authenticatedUserRoles: [] }, ok: 1 };
    case 'endSessions': case 'killSessions': case 'refreshSessions': case 'logout':
    case 'commitTransaction': case 'abortTransaction': return { ok: 1 };
    case 'startSession': case 'startsession':
      return { id: { id: new Binary(Buffer.alloc(16)), uid: new Binary(Buffer.alloc(32)) }, timeoutMinutes: 30, ok: 1 };
    case 'getLastError': return { n: 0, err: null, ok: 1 };
    case 'serverStatus': return { ok: 1, version: '7.0.0', host: 'embedded', uptime: 1 };
    case 'whatsmyuri': return { you: '127.0.0.1:0', ok: 1 };
    case 'authenticate': case 'saslStart': case 'saslContinue': case 'getnonce':
      return { ok: 1, done: true, conversationId: 1, payload: new Binary(Buffer.alloc(0)), nonce: 'abc' };
    case 'features': case 'getParameter': case 'setParameter': case 'fsync':
    case 'currentOp': case 'killOp': return { ok: 1 };

    case 'listDatabases':
      return { databases: Object.keys(store).map(n => ({ name: n, sizeOnDisk: 0, empty: false })), totalSize: 0, ok: 1 };

    case 'listCollections': {
      const names = Object.keys(store[dbName] || {});
      return { cursor: { firstBatch: names.map(n => ({ name: n, type: 'collection', options: {}, info: { readOnly: false, uuid: new Binary(Buffer.alloc(16)) }, idIndex: { v: 2, key: { _id: 1 }, name: '_id_' } })), id: Long.fromNumber(0), ns: `${dbName}.$cmd.listCollections` }, ok: 1 };
    }

    case 'create': case 'createCollection': case 'createcollection':
      getColl(dbName, cmd[cmdName] as string); return { ok: 1 };

    case 'drop': { if (store[dbName]) delete store[dbName][cmd.drop as string]; return { ok: 1 }; }
    case 'dropDatabase': delete store[dbName]; return { ok: 1 };

    case 'createIndexes': case 'createindexes':
      return { numIndexesBefore: 1, numIndexesAfter: 1, createdCollectionAutomatically: false, ok: 1 };
    case 'dropIndexes': return { ok: 1, nIndexesWas: 1 };
    case 'listIndexes':
      return { cursor: { firstBatch: [{ v: 2, key: { _id: 1 }, name: '_id_' }], id: Long.fromNumber(0), ns: `${dbName}.${cmd.listIndexes}` }, ok: 1 };

    case 'find': {
      const coll = getColl(dbName, cmd.find as string);
      let docs = coll.filter(d => matchDoc(d, (cmd.filter as Doc) || {}));
      if (cmd.sort) docs = sortDocs(docs, cmd.sort as Doc);
      if (cmd.skip) docs = docs.slice(cmd.skip as number);
      if (cmd.limit && (cmd.limit as number) > 0) docs = docs.slice(0, cmd.limit as number);
      if (cmd.projection) docs = docs.map(d => projectDoc(d, cmd.projection as Doc));
      return { cursor: { firstBatch: docs, id: Long.fromNumber(0), ns: `${dbName}.${cmd.find}` }, ok: 1 };
    }

    case 'getMore': return { cursor: { nextBatch: [], id: Long.fromNumber(0), ns: String(cmd.collection || '') }, ok: 1 };

    case 'insert': {
      const coll = getColl(dbName, cmd.insert as string);
      const docs = (cmd.documents as Doc[]) || [];
      for (const d of docs) { if (!d._id) d._id = new ObjectId(); coll.push(d); }
      return { n: docs.length, ok: 1 };
    }

    case 'update': {
      const coll = getColl(dbName, cmd.update as string);
      const updates = (cmd.updates as any[]) || [];
      let nMatched = 0, nModified = 0; const upserted: any[] = [];
      for (const upd of updates) {
        const idxs = coll.reduce<number[]>((a, d, i) => { if (matchDoc(d, upd.q || {})) a.push(i); return a; }, []);
        if (idxs.length === 0 && upd.upsert) {
          const base = Object.keys(upd.q || {}).some(k => !k.startsWith('$')) ? { ...upd.q } : {};
          let nd = applyUpdate(base, upd.u); if (!nd._id) nd._id = new ObjectId();
          if (upd.u.$setOnInsert) Object.assign(nd, upd.u.$setOnInsert);
          coll.push(nd); upserted.push({ index: upserted.length, _id: nd._id }); nMatched++;
        } else {
          const toUpd = upd.multi ? idxs : idxs.slice(0, 1);
          for (const i of toUpd) { coll[i] = applyUpdate(coll[i], upd.u); nMatched++; nModified++; }
        }
      }
      const resp: Doc = { n: nMatched, nModified, ok: 1 };
      if (upserted.length) resp.upserted = upserted;
      return resp;
    }

    case 'delete': {
      const coll = getColl(dbName, cmd.delete as string);
      let n = 0;
      for (const del of (cmd.deletes as any[]) || []) {
        for (let i = coll.length - 1; i >= 0; i--) {
          if (matchDoc(coll[i], del.q || {})) { coll.splice(i, 1); n++; if (del.limit === 1) break; }
        }
      }
      return { n, ok: 1 };
    }

    case 'findAndModify': case 'findandmodify': {
      const coll = getColl(dbName, (cmd.findAndModify || cmd.findandmodify) as string);
      const query = (cmd.query as Doc) || {};
      let docs = coll.filter(d => matchDoc(d, query));
      if (cmd.sort) docs = sortDocs(docs, cmd.sort as Doc);
      const doc = docs[0];
      if (cmd.remove && doc) {
        coll.splice(coll.indexOf(doc), 1);
        return { value: doc, lastErrorObject: { n: 1 }, ok: 1 };
      }
      if (!doc && cmd.upsert && cmd.update) {
        const base = Object.keys(query).some(k => !k.startsWith('$')) ? { ...query } : {};
        let nd = applyUpdate(base, cmd.update as Doc); if (!nd._id) nd._id = new ObjectId();
        if ((cmd.update as Doc).$setOnInsert) Object.assign(nd, (cmd.update as Doc).$setOnInsert);
        coll.push(nd);
        return { value: cmd.new ? nd : null, lastErrorObject: { n: 1, upserted: nd._id }, ok: 1 };
      }
      if (doc && cmd.update) {
        const orig = { ...doc }; const i = coll.indexOf(doc);
        coll[i] = applyUpdate(doc, cmd.update as Doc);
        return { value: cmd.new ? coll[i] : orig, lastErrorObject: { n: 1, updatedExisting: true }, ok: 1 };
      }
      return { value: null, lastErrorObject: { n: 0 }, ok: 1 };
    }

    case 'aggregate': {
      const collName = cmd.aggregate as string;
      const coll = collName === '1' || (collName as unknown) === 1 ? [] : getColl(dbName, collName);
      const result = runPipeline(coll, (cmd.pipeline as any[]) || [], dbName);
      return { cursor: { firstBatch: result, id: Long.fromNumber(0), ns: `${dbName}.${collName}` }, ok: 1 };
    }

    case 'count': {
      const coll = getColl(dbName, cmd.count as string);
      return { n: coll.filter(d => matchDoc(d, (cmd.query as Doc) || {})).length, ok: 1 };
    }

    case 'distinct': {
      const coll = getColl(dbName, cmd.distinct as string);
      const vals = coll.filter(d => matchDoc(d, (cmd.query as Doc) || {})).map(d => getField(d, cmd.key as string)).filter(v => v !== undefined);
      return { values: [...new Set(vals)], ok: 1 };
    }

    case 'collStats': return { ns: `${dbName}.${cmd.collStats}`, count: (store[dbName]?.[cmd.collStats as string] || []).length, ok: 1 };
    case 'dbStats': return { db: dbName, collections: Object.keys(store[dbName] || {}).length, ok: 1 };

    default: return { ok: 1 };
  }
}

// ─── Wire protocol ─────────────────────────────────────────────────────────────
const FIXED_PROCESS_ID = new ObjectId();  // stable across all hello responses

function buildOpMsg(responseTo: number, doc: Doc): Buffer {
  const body = serialize(doc);
  const buf = Buffer.alloc(16 + 4 + 1 + body.length);
  let o = 0;
  buf.writeInt32LE(buf.length, o); o += 4;
  buf.writeInt32LE(0, o);          o += 4;
  buf.writeInt32LE(responseTo, o); o += 4;
  buf.writeInt32LE(OP_MSG, o);     o += 4;
  buf.writeUInt32LE(0, o);         o += 4;  // flagBits
  buf.writeUInt8(0, o);            o += 1;  // section type 0
  Buffer.from(body).copy(buf, o);
  return buf;
}

// OP_REPLY (opCode 1) — used to respond to legacy OP_QUERY (opCode 2004)
function buildOpReply(responseTo: number, doc: Doc): Buffer {
  const body = serialize(doc);
  const buf = Buffer.alloc(16 + 4 + 8 + 4 + 4 + body.length);
  let o = 0;
  buf.writeInt32LE(buf.length, o);  o += 4;
  buf.writeInt32LE(0, o);           o += 4;
  buf.writeInt32LE(responseTo, o);  o += 4;
  buf.writeInt32LE(1, o);           o += 4;  // opCode OP_REPLY
  buf.writeInt32LE(0, o);           o += 4;  // responseFlags
  buf.writeBigInt64LE(0n, o);       o += 8;  // cursorId
  buf.writeInt32LE(0, o);           o += 4;  // startingFrom
  buf.writeInt32LE(1, o);           o += 4;  // numberReturned
  Buffer.from(body).copy(buf, o);
  return buf;
}

// OP_QUERY (opCode 2004) parser: returns { fullCollectionName, query, db, cmd }
function parseOpQuery(msg: Buffer): { db: string; cmd: Doc } {
  let offset = 16;
  // flags (int32)
  offset += 4;
  // fullCollectionName (cstring)
  let end = offset; while (msg[end] !== 0 && end < msg.length) end++;
  const fullColl = msg.slice(offset, end).toString();
  offset = end + 1;
  // numberToSkip, numberToReturn
  offset += 8;
  // query document
  const docLen = msg.readInt32LE(offset);
  const cmd = deserialize(msg.slice(offset, offset + docLen), { promoteLongs: false }) as Doc;
  const db = fullColl.split('.')[0] || 'admin';
  return { db, cmd };
}

function handleSocket(socket: net.Socket): void {
  let buf = Buffer.alloc(0);
  socket.on('data', (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    while (buf.length >= 16) {
      const msgLen = buf.readInt32LE(0);
      if (buf.length < msgLen) break;
      const msg = buf.slice(0, msgLen);
      buf = buf.slice(msgLen);
      const requestId = msg.readInt32LE(4);
      const opCode = msg.readInt32LE(12);

      // Handle legacy OP_QUERY (used by MongoDB driver 6.x for initial handshake)
      if (opCode === 2004) {
        try {
          const { db, cmd } = parseOpQuery(msg);
          const resp = handleCommand(cmd, db);
          socket.write(buildOpReply(requestId, resp));
        } catch (err: any) {
          socket.write(buildOpReply(requestId, { ok: 0, errmsg: String(err?.message || err) }));
        }
        continue;
      }

      if (opCode !== OP_MSG) continue;
      try {
        const flagBits = msg.readUInt32LE(16);
        const checksumPresent = (flagBits & 0x01) !== 0;
        const moreToCome = (flagBits & 0x02) !== 0;
        const msgEnd = checksumPresent ? msgLen - 4 : msgLen;
        let offset = 20;
        let cmd: Doc = {};
        while (offset < msgEnd) {
          const sectionType = msg.readUInt8(offset++);
          if (sectionType === 0) {
            const docLen = msg.readInt32LE(offset);
            cmd = deserialize(msg.slice(offset, offset + docLen), { promoteLongs: false });
            offset += docLen;
          } else if (sectionType === 1) {
            const seqSize = msg.readInt32LE(offset);
            const seqEnd = offset + seqSize; offset += 4;
            let idEnd = offset; while (msg[idEnd] !== 0 && idEnd < msgEnd) idEnd++;
            const identifier = msg.slice(offset, idEnd).toString(); offset = idEnd + 1;
            const seqDocs: Doc[] = [];
            while (offset < seqEnd) {
              const dl = msg.readInt32LE(offset);
              if (dl <= 0 || offset + dl > msgEnd) break;
              seqDocs.push(deserialize(msg.slice(offset, offset + dl), { promoteLongs: false }));
              offset += dl;
            }
            cmd[identifier] = seqDocs;
          } else break;
        }
        if (!moreToCome) {
          const resp = handleCommand(cmd, (cmd.$db as string) || 'admin');
          socket.write(buildOpMsg(requestId, resp));
        }
      } catch (err: any) {
        try { socket.write(buildOpMsg(requestId, { ok: 0, errmsg: String(err?.message || err), code: 1 })); } catch (_) {}
      }
    }
  });
  socket.on('error', () => {});
  socket.on('close', () => {});
}

export async function startEmbeddedMongo(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = net.createServer(handleSocket);
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as net.AddressInfo;
      console.log(`[EmbeddedMongo] Started on 127.0.0.1:${addr.port}`);
      resolve(`mongodb://127.0.0.1:${addr.port}/mirsad`);
    });
  });
}
