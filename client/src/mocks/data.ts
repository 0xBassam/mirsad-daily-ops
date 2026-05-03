// ── helpers ──────────────────────────────────────────────────────────────────
const now = new Date();
const d = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000).toISOString();
const dF = (daysAhead: number) => new Date(now.getTime() + daysAhead * 86400000).toISOString();
const pad = (prefix: string, n: number) => `${prefix}${String(n).padStart(24 - prefix.length, '0')}`;

// ── IDs ───────────────────────────────────────────────────────────────────────
export const PROJECT_IDS = ['aaa000000000000000000001','aaa000000000000000000002','aaa000000000000000000003'];
export const BUILDING_IDS = ['bbb000000000000000000001','bbb000000000000000000002','bbb000000000000000000003','bbb000000000000000000004','bbb000000000000000000005','bbb000000000000000000006'];

// ── USERS ─────────────────────────────────────────────────────────────────────
export const USERS = [
  { _id:'usr000000000000000000001', fullName:'Ahmed Al-Rashidi',     email:'admin@mirsad.demo',       role:'admin',                phone:'+966501234567', status:'active', project:null,                                           createdAt:d(60) },
  { _id:'usr000000000000000000002', fullName:'Sara Al-Mutairi',      email:'admin2@mirsad.demo',      role:'admin',                phone:'+966501234568', status:'active', project:null,                                           createdAt:d(55) },
  { _id:'usr000000000000000000003', fullName:'Mohammed Al-Ghamdi',   email:'supervisor@mirsad.demo',  role:'supervisor',           phone:'+966502345678', status:'active', project:{ _id:PROJECT_IDS[0], name:'CDMDNA Building Operations' },        createdAt:d(50) },
  { _id:'usr000000000000000000004', fullName:'Fatima Al-Zahrani',    email:'supervisor2@mirsad.demo', role:'supervisor',           phone:'+966502345679', status:'active', project:{ _id:PROJECT_IDS[1], name:'Ministry Hospitality Services' },      createdAt:d(48) },
  { _id:'usr000000000000000000005', fullName:'Khalid Al-Otaibi',     email:'assistant@mirsad.demo',   role:'assistant_supervisor', phone:'+966503456789', status:'active', project:{ _id:PROJECT_IDS[0], name:'CDMDNA Building Operations' },        createdAt:d(45) },
  { _id:'usr000000000000000000006', fullName:'Nora Al-Harbi',        email:'assistant2@mirsad.demo',  role:'assistant_supervisor', phone:'+966503456790', status:'active', project:{ _id:PROJECT_IDS[1], name:'Ministry Hospitality Services' },      createdAt:d(43) },
  { _id:'usr000000000000000000007', fullName:'Abdullah Al-Qahtani',  email:'manager@mirsad.demo',     role:'project_manager',      phone:'+966504567890', status:'active', project:{ _id:PROJECT_IDS[0], name:'CDMDNA Building Operations' },        createdAt:d(40) },
  { _id:'usr000000000000000000008', fullName:'Tariq Al-Dosari',      email:'manager2@mirsad.demo',    role:'project_manager',      phone:'+966504567891', status:'active', project:{ _id:PROJECT_IDS[2], name:'Executive Coffee & Snacks Service' }, createdAt:d(38) },
  { _id:'usr000000000000000000009', fullName:'Omar Al-Zahrani',      email:'client@mirsad.demo',      role:'client',               phone:'+966505678901', status:'active', project:{ _id:PROJECT_IDS[0], name:'CDMDNA Building Operations' },        createdAt:d(35) },
  { _id:'usr000000000000000000010', fullName:'Layla Al-Shehri',      email:'client2@mirsad.demo',     role:'client',               phone:'+966505678902', status:'active', project:{ _id:PROJECT_IDS[1], name:'Ministry Hospitality Services' },      createdAt:d(33) },
];

export const DEMO_PASSWORDS: Record<string,string> = {
  'admin@mirsad.demo':'Demo@12345','admin2@mirsad.demo':'Demo@12345',
  'supervisor@mirsad.demo':'Demo@12345','supervisor2@mirsad.demo':'Demo@12345',
  'assistant@mirsad.demo':'Demo@12345','assistant2@mirsad.demo':'Demo@12345',
  'manager@mirsad.demo':'Demo@12345','manager2@mirsad.demo':'Demo@12345',
  'client@mirsad.demo':'Demo@12345','client2@mirsad.demo':'Demo@12345',
};

// ── PROJECTS ──────────────────────────────────────────────────────────────────
export const PROJECTS = [
  { _id:PROJECT_IDS[0], name:'CDMDNA Building Operations',         clientName:'CDMDNA',            locationCode:'CDM-001', status:'active', createdAt:d(60) },
  { _id:PROJECT_IDS[1], name:'Ministry Hospitality Services',      clientName:'Ministry',          locationCode:'MHS-001', status:'active', createdAt:d(45) },
  { _id:PROJECT_IDS[2], name:'Executive Coffee & Snacks Service',  clientName:'Executive Office',  locationCode:'ECS-001', status:'active', createdAt:d(30) },
];

// ── BUILDINGS ─────────────────────────────────────────────────────────────────
export const BUILDINGS = [
  { _id:BUILDING_IDS[0], project:{ _id:PROJECT_IDS[0], name:'CDMDNA Building Operations' },        name:'CDMDNA Building',          status:'active', createdAt:d(55) },
  { _id:BUILDING_IDS[1], project:{ _id:PROJECT_IDS[0], name:'CDMDNA Building Operations' },        name:'Ministry Annex',           status:'active', createdAt:d(54) },
  { _id:BUILDING_IDS[2], project:{ _id:PROJECT_IDS[1], name:'Ministry Hospitality Services' },     name:'Main Ministry Building',   status:'active', createdAt:d(40) },
  { _id:BUILDING_IDS[3], project:{ _id:PROJECT_IDS[1], name:'Ministry Hospitality Services' },     name:'Ministry Annex B',         status:'active', createdAt:d(39) },
  { _id:BUILDING_IDS[4], project:{ _id:PROJECT_IDS[2], name:'Executive Coffee & Snacks Service' }, name:'Executive Lounge Building',status:'active', createdAt:d(25) },
  { _id:BUILDING_IDS[5], project:{ _id:PROJECT_IDS[2], name:'Executive Coffee & Snacks Service' }, name:'Coffee Station Block',     status:'active', createdAt:d(24) },
];

// ── FLOORS ────────────────────────────────────────────────────────────────────
const FLOOR_NAMES = [
  ['2 Floor','3 Floor','4 Floor','19 Floor'],
  ['MAKASSB','SECURITY','KAFAA-1','KAFAA-2'],
  ['Executive Lounge','Coffee Station','VIP Lounge','Reception'],
  ['Ground Floor','Mezzanine','First Floor','Second Floor'],
  ['Level A','Level B','Terrace','Rooftop'],
  ['Main Hall','Side Hall','Storage Area','Kitchen'],
];
export const FLOORS = BUILDING_IDS.flatMap((bid, b) =>
  FLOOR_NAMES[b].map((name, f) => ({
    _id: pad('flr', b * 4 + f + 1),
    building: { _id: bid, name: BUILDINGS[b].name },
    project:  { _id: BUILDINGS[b].project._id, name: BUILDINGS[b].project.name },
    name, locationCode: `${name.replace(/\s/g,'-')}-${b+1}`, status:'active',
  }))
);

// ── CATEGORIES ────────────────────────────────────────────────────────────────
const foodCats  = ['Rice & Grains','Bread & Bakery','Proteins','Dairy','Vegetables','Fruits','Beverages','Condiments','Canned Goods','Frozen Foods','Snacks','Oils & Fats','Legumes'];
const matCats   = ['Cleaning Supplies','Sanitization','Kitchen Equipment','Bedding','Toiletries','Safety','Electrical','Plumbing','Tools','Stationery','PPE','Packaging'];
export const CATEGORIES = [
  ...foodCats.map((name,i) => ({ _id:pad('cat',i+1),  name, type:'food',     status:'active' })),
  ...matCats.map((name,i)  => ({ _id:pad('cat',i+14), name, type:'material', status:'active' })),
];

// ── ITEMS ─────────────────────────────────────────────────────────────────────
const rawFood: [string,string,number][] = [
  ['Shakshouka Samoli Sandwich','pcs',200],['Sourdough Mozzarella Cheese Sandwich','pcs',150],
  ['Labnah Wrap with Vegetables','pcs',180],['Chicken Burger with Swiss Cheese','pcs',160],
  ['Roast Beef Sandwich','pcs',120],['Chicken Tikka with Rice','box',100],
  ['Grill Chicken Bowl','box',120],['Power Salad with Chicken','box',100],
  ['Fruit Salad','cup',150],['Fresh Juice','bottle',200],
  ['Yogurt','cup',180],['Mixed Nuts','bag',100],
  ['Sweet Bakery','pcs',250],['Salted Bakery','pcs',200],['Granola','bag',80],
  ['Pasta','kg',180],['Sugar','kg',100],['Instant Coffee','jar',50],['Olive Oil','L',90],['Eggs','dozen',300],
  ['Bread Rolls','pcs',300],['Flatbread','pcs',250],['Lamb Chops','kg',200],['Salmon Fillet','kg',150],
  ['Cream Cheese','kg',80],['Butter','kg',100],['Cucumbers','kg',90],['Onions','kg',120],
  ['Orange Juice','L',100],['Green Tea','box',60],['Mayonnaise','kg',70],['Ketchup','bottle',80],
  ['Chickpeas','kg',150],['Kidney Beans','kg',130],['Beef Strips','kg',200],['Mixed Vegetables','kg',180],
  ['Cheese Slices','pcs',200],['Sour Cream','kg',70],['Brown Rice','kg',300],['Cooking Spray','can',60],
];
const rawMat: [string,string,number][] = [
  ['Water Bottles','case',400],['Paper Cups','sleeve',300],['Plastic Spoons','bag',200],['Plastic Forks','bag',200],
  ['Paper Plates','sleeve',250],['Coffee Beans','kg',80],['Fresh Milk','L',150],['Tea Bags','box',120],
  ['Sugar Sachets','box',300],['Napkins','pack',400],['Gloves Latex','box',80],['Trash Bags Large','roll',120],
  ['Toilet Paper','roll',500],['Dish Soap','L',60],['Face Masks N95','box',40],['Broom','pcs',25],
  ['Disinfectant Spray','can',90],['Light Bulbs LED','pcs',60],['Vacuum Cleaner Bags','pcs',40],['Rubber Gloves','pair',100],
  ['Laundry Detergent','kg',80],['Fabric Softener','L',60],['Shower Gel','bottle',150],['Hard Hat','pcs',30],
  ['Cable Ties','bag',50],['Duct Tape','roll',40],['Measuring Tape','pcs',20],['Notepad','pcs',100],
  ['Safety Vest','pcs',40],['Hand Soap Liquid','L',80],
];
export const ITEMS = [
  ...rawFood.map(([name,unit,limitQty],i) => ({ _id:pad('itm',i+1),  name, category:CATEGORIES[Math.floor(i/4)],    type:'food',     unit, limitQty, status:'active' })),
  ...rawMat.map(([name,unit,limitQty],i)  => ({ _id:pad('itm',i+41), name, category:CATEGORIES[13+Math.floor(i/3)], type:'material', unit, limitQty, status:'active' })),
];

// ── DAILY PLANS ───────────────────────────────────────────────────────────────
const shifts = ['morning','afternoon','evening','night'] as const;
export const DAILY_PLANS = Array.from({length:14},(_,i)=>({
  _id:pad('pln',i+1), date:d(i),
  project:PROJECTS[i%3], building:BUILDINGS[i%6], shift:shifts[i%4],
  status: i<2?'draft':i<12?'published':'closed',
  createdBy:{ _id:USERS[2]._id, fullName:USERS[2].fullName },
  createdAt:d(i+1),
  lines: FLOORS.slice(i%6*4, i%6*4+4).map((fl,li)=>({
    _id:pad('pll',i*4+li+1), floor:fl, item:ITEMS[li*3], plannedQty:10+li*5, notes:'',
  })),
}));

// ── FLOOR CHECKS ──────────────────────────────────────────────────────────────
const fcStatuses = ['approved','approved','submitted','under_review','returned','approved','draft','approved'];
export const FLOOR_CHECKS = FLOORS.flatMap((floor,fi)=>
  Array.from({length:5},(_,di)=>{
    const status = fcStatuses[(fi+di)%fcStatuses.length] as string;
    const id = pad('fck',fi*5+di+1);
    const sup = USERS[2+(fi%2)];
    return {
      _id:id, date:d(di), project:floor.project, building:floor.building, floor,
      shift:shifts[di%4], supervisor:{ _id:sup._id, fullName:sup.fullName },
      status, currentApprovalStep: status==='submitted'?'assistant_review':status==='under_review'?'manager_approval':'complete',
      notes: status==='returned'?'Please recheck floor quantities':'',
      createdAt:d(di+1),
      approvalRecords: status==='approved'?[
        { _id:pad('apr',fi*15+di*3+1), step:'supervisor_submit',  action:'submitted', actor:{ _id:USERS[2]._id, fullName:USERS[2].fullName, role:'supervisor' },           comment:'',        version:1, createdAt:d(di+0.5) },
        { _id:pad('apr',fi*15+di*3+2), step:'assistant_review',   action:'approved',  actor:{ _id:USERS[4]._id, fullName:USERS[4].fullName, role:'assistant_supervisor' }, comment:'Verified',version:1, createdAt:d(di+0.3) },
        { _id:pad('apr',fi*15+di*3+3), step:'manager_approval',   action:'approved',  actor:{ _id:USERS[6]._id, fullName:USERS[6].fullName, role:'project_manager' },      comment:'Approved',version:1, createdAt:d(di+0.1) },
      ]:[],
      lines: ITEMS.slice(fi%10,fi%10+6).map((item,li)=>({
        _id:pad('fcl',fi*30+di*6+li+1), item,
        plannedQty:10+li*3, actualQty:10+li*3-(li%3===0?1:0),
        difference:li%3===0?-1:0, lineStatus:li%3===0?'shortage':'ok', notes:'', photos:[],
      })),
    };
  })
);

// ── INVENTORY ─────────────────────────────────────────────────────────────────
const period = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
const foodItems = ITEMS.filter(i=>i.type==='food');
const matItems  = ITEMS.filter(i=>i.type==='material');

export const INVENTORY_FOOD = foodItems.map((item,i)=>({
  _id:pad('invf',i+1), project:PROJECTS[0], item, period,
  monthlyLimit:item.limitQty, openingBalance:Math.floor(item.limitQty*0.2),
  receivedQty:Math.floor(item.limitQty*0.8), consumedQty:Math.floor(item.limitQty*0.5),
  issuedQty:0, damagedQty:Math.floor(item.limitQty*0.02), returnedQty:Math.floor(item.limitQty*0.05),
  remainingQty:Math.floor(item.limitQty*0.53),
  status: i%9===0?'out_of_stock':i%5===0?'low_stock':'available',
}));

export const INVENTORY_MATERIALS = matItems.map((item,i)=>({
  _id:pad('invm',i+1), project:PROJECTS[0], item, period,
  monthlyLimit:item.limitQty, openingBalance:Math.floor(item.limitQty*0.3),
  receivedQty:Math.floor(item.limitQty*0.7), consumedQty:0,
  issuedQty:Math.floor(item.limitQty*0.4), damagedQty:Math.floor(item.limitQty*0.01),
  returnedQty:Math.floor(item.limitQty*0.03), remainingQty:Math.floor(item.limitQty*0.62),
  status: i%9===0?'low_stock':'available',
}));

// ── STOCK MOVEMENTS ───────────────────────────────────────────────────────────
const movTypes = ['receive','issue','consumption','damage','return','adjustment'];
export const MOVEMENTS = Array.from({length:80},(_,i)=>({
  _id:pad('mov',i+1), project:PROJECTS[i%3], item:ITEMS[i%ITEMS.length],
  movementType:movTypes[i%movTypes.length], quantity:10+(i%20)*5,
  movementDate:d(i%30), sourceType:'manual', notes:'',
  createdBy:{ _id:USERS[0]._id, fullName:USERS[0].fullName }, createdAt:d(i%30+1),
}));

// ── AUDIT LOGS ────────────────────────────────────────────────────────────────
const auditActions = ['login','create','update','submit','approve','reject','return'];
export const AUDIT_LOGS = Array.from({length:40},(_,i)=>({
  _id:pad('aud',i+1), user:USERS[i%USERS.length], action:auditActions[i%auditActions.length],
  entityType:['FloorCheck','User','DailyPlan','InventoryBalance'][i%4],
  entityId:pad('fck',i+1), createdAt:d(i%20),
}));

// ── SUPPLIERS ─────────────────────────────────────────────────────────────────
export const SUPPLIERS = [
  { _id:pad('sup',1), name:'Al-Mawrid Food Trading',        nameAr:'شركة المورد للتجارة الغذائية',       contactName:'Faisal Al-Amri',    phone:'+966512345678', email:'contact@almawrid.sa',   category:'food',     rating:4.5, status:'active',   licenseNumber:'SA-F-2023-001', address:'Riyadh Industrial City', createdAt:d(90) },
  { _id:pad('sup',2), name:'Arabian Fresh Produce Co.',     nameAr:'شركة الجزيرة للمنتجات الطازجة',      contactName:'Nasser Al-Qahtani', phone:'+966523456789', email:'info@arabianfresh.sa',  category:'food',     rating:4.2, status:'active',   licenseNumber:'SA-F-2022-045', address:'Jeddah Food Market',     createdAt:d(85) },
  { _id:pad('sup',3), name:'Gulf Dairy Supplies',           nameAr:'مستلزمات الخليج للألبان',            contactName:'Hana Al-Otaibi',    phone:'+966534567890', email:'supply@gulfdairy.sa',   category:'food',     rating:3.8, status:'active',   licenseNumber:'SA-F-2021-112', address:'Dammam',                 createdAt:d(80) },
  { _id:pad('sup',4), name:'Saudi Cleaning Solutions',      nameAr:'الحلول السعودية للنظافة',            contactName:'Mansour Al-Ghamdi', phone:'+966545678901', email:'orders@scsclean.sa',    category:'material', rating:4.0, status:'active',   licenseNumber:'SA-M-2023-078', address:'Riyadh',                 createdAt:d(75) },
  { _id:pad('sup',5), name:'ProSafe Equipment Trading',     nameAr:'بروسيف لتجارة معدات السلامة',        contactName:'Abdullah Shehri',   phone:'+966556789012', email:'sales@prosafe.sa',      category:'material', rating:4.7, status:'active',   licenseNumber:'SA-M-2022-201', address:'KAFD, Riyadh',           createdAt:d(70) },
  { _id:pad('sup',6), name:'Al-Barakah Frozen Foods',       nameAr:'شركة البركة للأغذية المجمدة',        contactName:'Saleh Al-Dosari',   phone:'+966567890123', email:'info@albarakah.sa',     category:'food',     rating:3.5, status:'active',   licenseNumber:'SA-F-2023-156', address:'Madinah',                createdAt:d(65) },
  { _id:pad('sup',7), name:'Kingdom Hospitality Supplies',  nameAr:'مستلزمات الضيافة للمملكة',          contactName:'Reem Al-Harbi',     phone:'+966578901234', email:'contact@khsupplies.sa', category:'both',     rating:4.3, status:'active',   licenseNumber:'SA-B-2022-089', address:'Mecca Road, Jeddah',     createdAt:d(60) },
  { _id:pad('sup',8), name:'Delta Packaging Co.',           nameAr:'دلتا لتغليف المواد',                 contactName:'Khaled Al-Mutairi', phone:'+966589012345', email:'sales@deltapack.sa',    category:'material', rating:2.9, status:'inactive', licenseNumber:'SA-M-2020-034', address:'Riyadh',                 createdAt:d(55) },
];

// ── BATCHES ───────────────────────────────────────────────────────────────────
const zones = ['cold','chilled','ambient','freezer','dry_storage','coffee_station','hospitality'] as const;
const batchExpiries = [dF(-5),dF(-2),dF(0),dF(1),dF(2),dF(3),dF(7),dF(14),dF(30),dF(60),dF(90),dF(120),dF(180)];
const batchStatuses = (exp: string) => { const d2=new Date(exp).getTime()-now.getTime(); return d2<0?'expired':d2<259200000?'active':'active'; };
export const BATCHES = Array.from({length:25},(_,i)=>({
  _id:pad('bat',i+1),
  batchNumber:`BAT-2026-${String(i+1).padStart(3,'0')}`,
  item:{ _id:ITEMS[i%10]._id, name:ITEMS[i%10].name, unit:ITEMS[i%10].unit, type:ITEMS[i%10].type },
  supplier:{ _id:SUPPLIERS[i%7]._id, name:SUPPLIERS[i%7].name },
  quantity:100+i*20, receivedDate:d(20+i%10),
  expiryDate: batchExpiries[i%batchExpiries.length],
  storageZone:zones[i%zones.length],
  remainingQty:Math.max(0,80+i*15-i*5),
  status: i<5?'expired':i===5?'spoiled':batchStatuses(batchExpiries[i%batchExpiries.length]),
  project:{ _id:PROJECT_IDS[i%3], name:PROJECTS[i%3].name }, notes:'',
}));

// ── FRIDGE CHECKS ─────────────────────────────────────────────────────────────
const fridgeStatuses = ['ok','ok','ok','ok','ok','ok','ok','ok','issue_found','issue_found','issue_found','issue_found','corrective_action_required','corrective_action_required','corrective_action_required'];
export const FRIDGE_CHECKS = Array.from({length:15},(_,i)=>({
  _id:pad('frd',i+1), date:d(i%7),
  floor:FLOORS[i%6], building:BUILDINGS[i%6], project:PROJECTS[i%3],
  storageZone:(['cold','chilled','freezer'] as const)[i%3],
  checkedBy:{ _id:USERS[4]._id, fullName:USERS[4].fullName },
  temperature: fridgeStatuses[i]==='ok' ? 2+Math.random()*2 : 8+Math.random()*5,
  expectedTempMin:1, expectedTempMax:5,
  cleanlinessOk: i%5!==4,
  cleanlinessNotes: i%5===4 ? 'Shelves require immediate cleaning' : '',
  status: fridgeStatuses[i] as 'ok'|'issue_found'|'corrective_action_required',
  correctiveActionId: fridgeStatuses[i]==='corrective_action_required'?pad('cac',i+1):undefined,
  itemsChecked: BATCHES.slice(i%10,i%10+3).map((batch,li)=>({
    _id:pad('fci',i*3+li+1),
    batch:{ _id:batch._id, batchNumber:batch.batchNumber },
    item:{ _id:batch.item._id, name:batch.item.name, unit:batch.item.unit },
    expiryDate:batch.expiryDate,
    isExpired: new Date(batch.expiryDate)<now,
    isNearExpiry: new Date(batch.expiryDate).getTime()-now.getTime() < 3*86400000 && new Date(batch.expiryDate)>=now,
    quantity:batch.remainingQty,
    condition: new Date(batch.expiryDate)<now?'expired':li%5===0?'damaged':'good',
    nameTagPresent: li%4!==0, notes:'',
  })),
  createdAt:d(i%7+1),
}));

// ── CORRECTIVE ACTIONS ────────────────────────────────────────────────────────
const caPriorities = ['low','medium','high','critical'] as const;
const caStatuses   = ['open','open','open','open','open','open','in_progress','in_progress','in_progress','in_progress','in_progress','in_progress','resolved','resolved','resolved','resolved','resolved','closed','closed','closed'] as const;
const caTitles = [
  'Temperature breach in cold storage — Floor 2F','Missing name tags on fridge items',
  'Expired items found during fridge check','Cleanliness issue in freezer zone',
  'Chicken Breast batch near expiry — immediate action','Damaged packaging detected in dry storage',
  'FIFO order not followed for canned goods','Temperature log gap — 6-hour period',
  'Mould detected on bread stock','Pest control required in storage area',
  'Incomplete fridge check documentation','Improper stacking in cold zone',
  'Unauthorised item found in food storage','Cross-contamination risk — raw and cooked',
  'Floor drain blocked in kitchen area','Refrigerator door seal damaged',
  'Expired sanitizer in use','Missing HACCP records for batch',
  'Supplier delivery rejection — quality issue','Staff not following PPE protocol in kitchen',
];
export const CORRECTIVE_ACTIONS = Array.from({length:20},(_,i)=>({
  _id:pad('cac',i+1), title:caTitles[i],
  description:`Detailed corrective action required: ${caTitles[i]}. Immediate inspection and remediation needed.`,
  sourceType:(['fridge_check','floor_check','inventory','manual'] as const)[i%4],
  sourceRef: i%4===0?pad('frd',i+1):i%4===1?pad('fck',i+1):undefined,
  assignedTo:{ _id:USERS[4]._id, fullName:USERS[4].fullName },
  dueDate:dF(2+i%12), priority:caPriorities[i%4], status:caStatuses[i],
  resolution: ['resolved','closed'].includes(caStatuses[i])?'Issue identified and resolved. Preventive measures put in place.':undefined,
  resolvedAt: ['resolved','closed'].includes(caStatuses[i])?d(1):undefined,
  createdBy:{ _id:USERS[6]._id, fullName:USERS[6].fullName }, createdAt:d(i+1),
}));

// ── SPOILAGE ALERTS ───────────────────────────────────────────────────────────
const alertTypes  = ['expired','near_expiry','temperature_breach','damaged','spoiled'] as const;
const alertStatuses = ['active','active','active','active','active','active','active','active','active','active','active','active','resolved','resolved','resolved','resolved','resolved','resolved','resolved','resolved','dismissed','dismissed','dismissed','dismissed','dismissed','dismissed','dismissed','dismissed','dismissed','dismissed'] as const;
export const SPOILAGE_ALERTS = Array.from({length:30},(_,i)=>({
  _id:pad('spa',i+1),
  batch:{ _id:BATCHES[i%10]._id, batchNumber:BATCHES[i%10].batchNumber },
  item:BATCHES[i%10].item,
  alertType:alertTypes[i%5],
  daysUntilExpiry: alertTypes[i%5]==='near_expiry'?i%3+1:alertTypes[i%5]==='expired'?-(i%5+1):undefined,
  quantity:10+(i%15)*5,
  storageZone:zones[i%zones.length],
  status:alertStatuses[i],
  detectedAt:d(i%15),
  resolvedBy: alertStatuses[i]==='resolved'?{ _id:USERS[4]._id, fullName:USERS[4].fullName }:undefined,
}));

// ── REPORTS ───────────────────────────────────────────────────────────────────
export const REPORTS = [
  { _id:pad('rpt',1), title:'Daily Floor Check Report - 2 Floor - 27 Apr 2026',      reportType:'daily_floor_check',      project:PROJECTS[0], building:BUILDINGS[0], floor:FLOORS[0],  dateFrom:d(3), dateTo:d(3), status:'ready',      generatedBy:{ _id:USERS[0]._id, fullName:USERS[0].fullName }, createdAt:d(3) },
  { _id:pad('rpt',2), title:'Daily Project Summary - CDMDNA Building - 27 Apr 2026', reportType:'daily_project_summary',  project:PROJECTS[0], building:BUILDINGS[0], floor:null,        dateFrom:d(3), dateTo:d(3), status:'ready',      generatedBy:{ _id:USERS[0]._id, fullName:USERS[0].fullName }, createdAt:d(3) },
  { _id:pad('rpt',3), title:'Weekly Warehouse Report - Week 18',                      reportType:'weekly_warehouse',        project:PROJECTS[0], building:null,         floor:null,        dateFrom:d(7), dateTo:d(1), status:'ready',      generatedBy:{ _id:USERS[6]._id, fullName:USERS[6].fullName }, createdAt:d(2) },
  { _id:pad('rpt',4), title:'Monthly Food Inventory Report - May 2026',               reportType:'monthly_food_inventory',  project:PROJECTS[0], building:null,         floor:null,        dateFrom:dF(1),dateTo:dF(30),status:'ready',     generatedBy:{ _id:USERS[0]._id, fullName:USERS[0].fullName }, createdAt:d(1) },
  { _id:pad('rpt',5), title:'Monthly Materials Report - May 2026',                    reportType:'monthly_materials',       project:PROJECTS[0], building:null,         floor:null,        dateFrom:dF(1),dateTo:dF(30),status:'ready',     generatedBy:{ _id:USERS[6]._id, fullName:USERS[6].fullName }, createdAt:d(1) },
  { _id:pad('rpt',6), title:'Approval Summary Report',                                reportType:'approval_summary',        project:PROJECTS[0], building:null,         floor:null,        dateFrom:d(30),dateTo:d(0), status:'ready',      generatedBy:{ _id:USERS[6]._id, fullName:USERS[6].fullName }, createdAt:d(0) },
];

// ── SPOILAGE RECORDS (manual recordings) ─────────────────────────────────────
const spoilageReasons = ['expired','damaged','temperature_issue','packaging_issue','quality_issue','spoiled','other'] as const;
const spoilageLocations = ['2 Floor Cold Store','3 Floor Dry Storage','Kitchen Freezer','Fridge Zone A','Main Warehouse','Reception Pantry','Prep Kitchen'];
export const SPOILAGE_RECORDS = Array.from({length:15},(_,i)=>({
  _id:pad('spr',i+1),
  item:{ _id:ITEMS[i%10]._id, name:ITEMS[i%10].name, unit:ITEMS[i%10].unit, type:ITEMS[i%10].type },
  project:{ _id:PROJECT_IDS[i%3], name:PROJECTS[i%3].name },
  quantity:2+i%8*3,
  reason:spoilageReasons[i%spoilageReasons.length],
  alertType:(['expired','near_expiry','temperature_breach','damaged','spoiled'] as const)[i%5],
  location:spoilageLocations[i%spoilageLocations.length],
  date:d(i%14),
  notes:i%3===0?'Discovered during routine inspection':'',
  status:'active' as const,
  detectedAt:d(i%14),
  createdBy:{ _id:USERS[i%4+2]._id, fullName:USERS[i%4+2].fullName },
  createdAt:d(i%14),
}));

// ── PURCHASE ORDERS ───────────────────────────────────────────────────────────
const poMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,7);
const poStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
const poEnd   = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString();
function poLine(idx: number, itemIdx: number, approved: number, received: number, distributed: number, consumed: number) {
  const item = ITEMS[itemIdx];
  const remaining = approved - distributed - consumed;
  return {
    _id: pad('pol', idx),
    item: { _id: item._id, name: item.name, unit: item.unit, type: item.type },
    unit: item.unit,
    approvedQty: approved, receivedQty: received,
    distributedQty: distributed, consumedQty: consumed,
    remainingQty: remaining, variance: remaining - (approved - received),
  };
}
export const PURCHASE_ORDERS = [
  {
    _id:pad('po',1), poNumber:`PO-${poMonth}-001`,
    supplier:{ _id:SUPPLIERS[0]._id, name:SUPPLIERS[0].name, category:'food' },
    project:{ _id:PROJECT_IDS[0], name:PROJECTS[0].name },
    month:poMonth, startDate:poStart, endDate:poEnd, status:'active' as const,
    notes:'Monthly food supply for CDMDNA building operations.',
    lines:[
      poLine(1,  0, 500, 500, 200, 250),
      poLine(2,  1, 300, 300, 100, 180),
      poLine(3,  2, 400, 350,  80, 200),
      poLine(4,  3, 200, 200,  60,  90),
      poLine(5,  4, 150, 100,  30,  60),
    ],
    createdBy:{ _id:USERS[6]._id, fullName:USERS[6].fullName }, createdAt:d(25), updatedAt:d(2),
  },
  {
    _id:pad('po',2), poNumber:`PO-${poMonth}-002`,
    supplier:{ _id:SUPPLIERS[3]._id, name:SUPPLIERS[3].name, category:'material' },
    project:{ _id:PROJECT_IDS[0], name:PROJECTS[0].name },
    month:poMonth, startDate:poStart, endDate:poEnd, status:'near_depletion' as const,
    notes:'Cleaning and sanitisation materials.',
    lines:[
      poLine(6,  20, 200, 200, 120, 65),
      poLine(7,  21, 100, 100,  80, 15),
      poLine(8,  22,  50,  50,  40,  8),
    ],
    createdBy:{ _id:USERS[6]._id, fullName:USERS[6].fullName }, createdAt:d(24), updatedAt:d(3),
  },
  {
    _id:pad('po',3), poNumber:`PO-${poMonth}-003`,
    supplier:{ _id:SUPPLIERS[1]._id, name:SUPPLIERS[1].name, category:'food' },
    project:{ _id:PROJECT_IDS[1], name:PROJECTS[1].name },
    month:poMonth, startDate:poStart, endDate:poEnd, status:'over_consumed' as const,
    notes:'Fresh produce supply for Ministry Hospitality.',
    lines:[
      poLine(9,  5, 120, 120,  50,  80),
      poLine(10, 6, 180, 180, 100, 100),
      poLine(11, 7,  80,  80,  20,  65),
    ],
    createdBy:{ _id:USERS[7]._id, fullName:USERS[7].fullName }, createdAt:d(22), updatedAt:d(1),
  },
  {
    _id:pad('po',4), poNumber:`PO-${poMonth}-004`,
    supplier:{ _id:SUPPLIERS[4]._id, name:SUPPLIERS[4].name, category:'material' },
    project:{ _id:PROJECT_IDS[1], name:PROJECTS[1].name },
    month:poMonth, startDate:poStart, endDate:poEnd, status:'fully_received' as const,
    notes:'Safety equipment and PPE.',
    lines:[
      poLine(12, 23, 60, 60, 30, 20),
      poLine(13, 24, 40, 40, 15, 15),
    ],
    createdBy:{ _id:USERS[7]._id, fullName:USERS[7].fullName }, createdAt:d(20), updatedAt:d(5),
  },
  {
    _id:pad('po',5), poNumber:`PO-${poMonth}-005`,
    supplier:{ _id:SUPPLIERS[6]._id, name:SUPPLIERS[6].name, category:'both' },
    project:{ _id:PROJECT_IDS[2], name:PROJECTS[2].name },
    month:poMonth, startDate:poStart, endDate:poEnd, status:'partially_received' as const,
    notes:'Coffee station supplies and light catering.',
    lines:[
      poLine(14,  8, 300, 150,  40,  80),
      poLine(15,  9, 200, 100,  30,  50),
      poLine(16, 25, 100,  50,  10,  20),
    ],
    createdBy:{ _id:USERS[7]._id, fullName:USERS[7].fullName }, createdAt:d(18), updatedAt:d(4),
  },
];

// ── TRANSFERS ─────────────────────────────────────────────────────────────────
const transferStatuses = ['confirmed','confirmed','confirmed','draft','draft','cancelled'] as const;
export const TRANSFERS = Array.from({length:6},(_,i)=>({
  _id: pad('tfr',i+1),
  project: { _id:PROJECT_IDS[i%3], name:PROJECTS[i%3].name },
  building: { _id:BUILDING_IDS[i%3], name:BUILDINGS[i%3].name },
  floor: { _id:FLOORS[i%6]._id, name:FLOORS[i%6].name },
  status: transferStatuses[i],
  transferDate: d(i%10+1),
  notes: i%2===0 ? `Daily restocking to ${FLOORS[i%6].name}` : '',
  lines: ITEMS.slice(i%5, i%5+3).map((item, li) => ({
    _id: pad('tfl', i*3+li+1),
    item: { _id:item._id, name:item.name, unit:item.unit, type:item.type },
    quantity: 50+li*25,
    notes: '',
  })),
  createdBy: { _id:USERS[i%4+2]._id, fullName:USERS[i%4+2].fullName },
  confirmedBy: transferStatuses[i]==='confirmed' ? { _id:USERS[6]._id, fullName:USERS[6].fullName } : undefined,
  confirmedAt: transferStatuses[i]==='confirmed' ? d(i%10+1) : undefined,
  createdAt: d(i%10+2),
}));

// ── RECEIVING ─────────────────────────────────────────────────────────────────
const receivingStatuses = ['confirmed','confirmed','partial','pending','pending','rejected'] as const;
export const RECEIVINGS = Array.from({length:6},(_,i)=>({
  _id: pad('rcv',i+1),
  project: { _id:PROJECT_IDS[i%2], name:PROJECTS[i%2].name },
  supplier: { _id:SUPPLIERS[i%5]._id, name:SUPPLIERS[i%5].name, contactName:SUPPLIERS[i%5].contactName },
  purchaseOrder: i < 4 ? { _id:PURCHASE_ORDERS[i%2]._id, poNumber:PURCHASE_ORDERS[i%2].poNumber, status:PURCHASE_ORDERS[i%2].status } : undefined,
  deliveryDate: d(i*3+1),
  status: receivingStatuses[i],
  invoiceNumber: `INV-2026-${1000+i+1}`,
  notes: i%3===0 ? 'Delivery checked on arrival. All items accounted for.' : '',
  lines: ITEMS.slice(i%8, i%8+4).map((item,li)=>({
    _id: pad('rcl', i*4+li+1),
    item: { _id:item._id, name:item.name, unit:item.unit, type:item.type },
    quantityOrdered: 200+li*50,
    quantityReceived: receivingStatuses[i]==='rejected' ? 0 : 180+li*50,
    condition: (li===2 && i===2) ? 'damaged' as const : li===3 && i===5 ? 'rejected' as const : 'good' as const,
    batchNumber: `BAT-REC-${String(i*4+li+1).padStart(3,'0')}`,
    notes: (li===2 && i===2) ? '2 boxes had torn packaging' : '',
  })),
  receivedBy: { _id:USERS[4]._id, fullName:USERS[4].fullName },
  confirmedBy: ['confirmed','partial','rejected'].includes(receivingStatuses[i]) ? { _id:USERS[6]._id, fullName:USERS[6].fullName } : undefined,
  confirmedAt: ['confirmed','partial','rejected'].includes(receivingStatuses[i]) ? d(i*3) : undefined,
  createdAt: d(i*3+2),
}));

// ── MAINTENANCE REQUESTS ──────────────────────────────────────────────────────
const mrCategories = ['electrical','plumbing','hvac','equipment','cleaning','structural','other'] as const;
const mrPriorities = ['critical','high','high','medium','medium','medium','low','low'] as const;
const mrStatuses   = ['in_progress','assigned','open','resolved','closed','open','in_progress','assigned'] as const;
const mrTitles = [
  'AC unit malfunction — 2 Floor server room',
  'Broken socket outlets — 19 Floor pantry',
  'Water leak — MAKASSB floor bathroom',
  'Elevator inspection certificate renewal',
  'Deep cleaning required — 3 Floor kitchen',
  'Emergency exit sign not working — KAFAA-1',
  'Freezer temperature alarm — cold storage',
  'Loose handrail — main staircase',
];
const mrDescriptions = [
  'The AC unit stopped cooling. Temperature rising above safe threshold.',
  'Three socket outlets near the pantry counter are not functioning.',
  'Slow water leak detected under bathroom sink.',
  'Annual elevator inspection certificate due for renewal.',
  'Monthly deep clean required. Grease buildup on exhaust hoods.',
  'Emergency exit sign bulb needs replacement — safety compliance.',
  'Freezer temp alarm triggered. Unit may need servicing.',
  'Handrail on main staircase is loose and poses a safety risk.',
];
export const MAINTENANCE_REQUESTS: any[] = mrTitles.map((title, i) => ({
  _id: pad('mnr', i+1),
  title,
  description: mrDescriptions[i],
  project:  { _id:PROJECT_IDS[i%2], name:PROJECTS[i%2].name },
  building: { _id:BUILDING_IDS[i%3], name:BUILDINGS[i%3].name },
  floor:    i%3!==2 ? { _id:FLOORS[i%6]._id, name:FLOORS[i%6].name } : undefined,
  category: mrCategories[i % mrCategories.length],
  priority: mrPriorities[i % mrPriorities.length],
  status:   mrStatuses[i % mrStatuses.length],
  reportedBy: { _id:USERS[i%5+2<USERS.length?i%5+2:0]._id, fullName:USERS[i%5+2<USERS.length?i%5+2:0].fullName },
  assignedTo: mrStatuses[i]!=='open' ? { _id:USERS[4]._id, fullName:USERS[4].fullName } : undefined,
  assignedAt: mrStatuses[i]!=='open' ? d(i%5+1) : undefined,
  resolvedAt: ['resolved','closed'].includes(mrStatuses[i]) ? d(i%3) : undefined,
  resolution: ['resolved','closed'].includes(mrStatuses[i]) ? 'Issue identified and resolved successfully. Preventive measures applied.' : undefined,
  createdAt: d(i%12+1), updatedAt: d(i%5),
}));

// ── CLIENT REQUESTS ───────────────────────────────────────────────────────────
const crTypes     = ['catering','supplies','event','housekeeping','maintenance','catering','supplies','other'] as const;
const crPriorities= ['high','medium','high','low','urgent','medium','low','medium'] as const;
const crStatuses  = ['delivered','confirmed','in_progress','submitted','assigned','submitted','confirmed','delivered'] as const;
const crTitles = [
  'VIP meeting catering — Board Room A',
  'Office supplies replenishment — Floor 4',
  'Quarterly staff celebration event',
  'Daily coffee station restocking',
  'AC repair coordination — VIP Suite',
  'Breakfast catering — Morning briefing',
  'Printer cartridges — Admin office',
  'Special arrangement for client visit',
];
export const CLIENT_REQUESTS: any[] = crTitles.map((title, i) => ({
  _id: pad('cre', i+1),
  title,
  description: `${title}. Please ensure timely fulfillment as per the specifications provided.`,
  requestType: crTypes[i],
  priority: crPriorities[i],
  status: crStatuses[i],
  project: { _id:PROJECT_IDS[i%3], name:PROJECTS[i%3].name },
  building: { _id:BUILDING_IDS[i%3], name:BUILDINGS[i%3].name },
  floor: { _id:FLOORS[i%6]._id, name:FLOORS[i%6].name },
  requestedBy: { _id:USERS[8]._id, fullName:USERS[8].fullName, role:'client' },
  assignedTo: crStatuses[i]!=='submitted' ? { _id:USERS[i%4+2]._id, fullName:USERS[i%4+2].fullName } : undefined,
  items: i%2===0 ? [
    { name:ITEMS[i%10].name, quantity:10+i, unit:ITEMS[i%10].unit },
    { name:ITEMS[(i+1)%10].name, quantity:5+i, unit:ITEMS[(i+1)%10].unit },
  ] : [],
  expectedDelivery: dF(i%5+1),
  deliveredAt: ['delivered','confirmed'].includes(crStatuses[i]) ? d(1) : undefined,
  confirmedAt: crStatuses[i]==='confirmed' ? d(0) : undefined,
  createdAt: d(i%7+1), updatedAt: d(i%3),
}));

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
export const DASHBOARD = {
  checks:{ total:FLOOR_CHECKS.length, completed:FLOOR_CHECKS.filter(f=>f.status==='approved').length, pending:FLOOR_CHECKS.filter(f=>['submitted','under_review'].includes(f.status)).length },
  reports:{ submitted:28, approved:18, rejected:4 },
  shortages:12, lowStock:INVENTORY_FOOD.filter(i=>i.status==='low_stock').length,
  outOfStock:INVENTORY_FOOD.filter(i=>i.status==='out_of_stock').length,
  pendingApprovals:FLOOR_CHECKS.filter(f=>['submitted','under_review'].includes(f.status)).length,
  foodInventory:{ available:INVENTORY_FOOD.filter(i=>i.status==='available').length, lowStock:INVENTORY_FOOD.filter(i=>i.status==='low_stock').length, outOfStock:INVENTORY_FOOD.filter(i=>i.status==='out_of_stock').length, overConsumed:2 },
  materialsInventory:{ available:INVENTORY_MATERIALS.filter(i=>i.status==='available').length, lowStock:INVENTORY_MATERIALS.filter(i=>i.status==='low_stock').length, outOfStock:0 },
  recentActivity:FLOOR_CHECKS[0].approvalRecords.slice(0,5),
  expiringIn3Days:BATCHES.filter(b=>{ const diff=(new Date(b.expiryDate).getTime()-now.getTime())/86400000; return diff>=0&&diff<=3; }).length,
  activeCorrectiveActions:CORRECTIVE_ACTIONS.filter(c=>['open','in_progress'].includes(c.status)).length,
  fridgeChecksToday:3,
  activeSpoilageAlerts:SPOILAGE_ALERTS.filter(s=>s.status==='active').length,
  topConsumedItems: [...INVENTORY_FOOD].sort((a,b)=>b.consumedQty-a.consumedQty).slice(0,5).map(inv=>({ name:(inv.item as any).name as string, consumed:inv.consumedQty })),
  checksByFloor: (() => {
    const counts: Record<string,{name:string;count:number}> = {};
    FLOOR_CHECKS.forEach(fc=>{ const fl=fc.floor as any; if(fl?._id){ counts[fl._id]=counts[fl._id]||{name:fl.name,count:0}; counts[fl._id].count++; } });
    return Object.values(counts).sort((a,b)=>b.count-a.count).slice(0,5);
  })(),
};
