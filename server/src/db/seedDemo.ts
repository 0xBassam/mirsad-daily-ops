/**
 * Seeds the embedded in-memory MongoDB with demo data.
 * Called automatically when no real MONGODB_URI is set.
 */
import mongoose from 'mongoose';
import { ObjectId } from 'bson';

// Pre-computed bcrypt hash for "Demo@12345" (rounds=10)
const DEMO_PASS = '$2a$10$K8jRxt3xqA0zan6lKXdV1uPhyMMRbbZIHO.Ec0R6P1mecyohGVwmS';

function oid(): ObjectId { return new ObjectId(); }

function daysAgo(n: number): Date {
  const d = new Date(); d.setDate(d.getDate() - n); d.setHours(8, 0, 0, 0); return d;
}

function monthPeriod(back = 0): string {
  const d = new Date(); d.setMonth(d.getMonth() - back);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export async function seedDemo(): Promise<void> {
  const db = mongoose.connection.db!;
  const now = new Date();

  // ── IDs ──────────────────────────────────────────────────────────────────────
  const adminId      = oid(), supervisorId = oid(), assistantId = oid();
  const managerId    = oid(), clientId     = oid();
  const projectId    = oid(), buildingId   = oid();
  const floor2Id     = oid(), floor3Id  = oid(), floor4Id      = oid(), floor19Id   = oid();
  const floorMakId   = oid(), floorSecId= oid(), floorKafaa1Id = oid(), floorKafaa2Id = oid();
  const floorIds     = [floor2Id, floor3Id, floor4Id, floor19Id, floorMakId, floorSecId, floorKafaa1Id, floorKafaa2Id];
  const floorNames   = ['2 Floor', '3 Floor', '4 Floor', '19 Floor', 'MAKASSB', 'SECURITY', 'KAFAA-1', 'KAFAA-2'];

  // Food categories
  const [catBrk, catLSand, catLMeal, catSalad, catSoup, catFruit, catSBake, catSaltB, catYog, catNuts, catCake, catGran, catJuice] =
    Array.from({ length: 13 }, oid);

  // Material categories
  const [catWater, catCoffee, catMilk, catTea, catPCup, catPlate, catSpoon, catFork, catKnife, catSauce, catSyrup, catSupport] =
    Array.from({ length: 12 }, oid);

  // Food items
  const [iBs1, iBs2, iLs1, iLs2, iLm1, iLm2, iSl1, iSl2, iSp1, iSp2, iFr1, iFr2, iFr3, iSb1, iSb2, iSalt1, iYog1, iNut1, iSc1, iGran1, iJc1, iJc2] =
    Array.from({ length: 22 }, oid);

  // Material items
  const [iWater1, iWater2, iCoffee1, iMilk1, iTea1, iPCup1, iPCup2, iPlate1, iSpoon1, iFork1, iKnife1, iSauce1, iSauce2, iSyrup1, iSup1, iSup2] =
    Array.from({ length: 16 }, oid);

  const foodItemIds = [iBs1, iBs2, iLs1, iLs2, iLm1, iLm2, iSl1, iSl2, iSp1, iSp2, iFr1, iFr2, iFr3, iSb1, iSb2, iSalt1, iYog1, iNut1, iSc1, iGran1, iJc1, iJc2];
  const matItemIds  = [iWater1, iWater2, iCoffee1, iMilk1, iTea1, iPCup1, iPCup2, iPlate1, iSpoon1, iFork1, iKnife1, iSauce1, iSauce2, iSyrup1, iSup1, iSup2];

  // ── Users ─────────────────────────────────────────────────────────────────────
  await db.collection('users').insertMany([
    { _id: adminId,      fullName: 'Ahmed Al-Rashidi',  email: 'admin@mirsad.demo',      password: DEMO_PASS, role: 'admin',               status: 'active', createdAt: now, updatedAt: now },
    { _id: supervisorId, fullName: 'Khalid Al-Otaibi',  email: 'supervisor@mirsad.demo', password: DEMO_PASS, role: 'supervisor',           project: projectId, status: 'active', createdAt: now, updatedAt: now },
    { _id: assistantId,  fullName: 'Fatima Al-Zahrani', email: 'assistant@mirsad.demo',  password: DEMO_PASS, role: 'assistant_supervisor', project: projectId, status: 'active', createdAt: now, updatedAt: now },
    { _id: managerId,    fullName: 'Mohammed Al-Ghamdi',email: 'manager@mirsad.demo',    password: DEMO_PASS, role: 'project_manager',      project: projectId, status: 'active', createdAt: now, updatedAt: now },
    { _id: clientId,     fullName: 'Nora Al-Shehri',    email: 'client@mirsad.demo',     password: DEMO_PASS, role: 'client',               project: projectId, status: 'active', createdAt: now, updatedAt: now },
  ]);

  // ── Project / Building / Floors ───────────────────────────────────────────────
  await db.collection('projects').insertOne({ _id: projectId, name: 'CDMDNA Building Operations', clientName: 'Ministry of Defense', locationCode: 'CDMDNA-01', status: 'active', createdBy: adminId, createdAt: now, updatedAt: now });
  await db.collection('buildings').insertOne({ _id: buildingId, project: projectId, name: 'CDMDNA Main Building', status: 'active', createdAt: now, updatedAt: now });
  await db.collection('floors').insertMany(floorIds.map((fid, i) => ({ _id: fid, building: buildingId, project: projectId, name: floorNames[i], locationCode: `FL-${floorNames[i].replace(/\s/g, '-')}`, status: 'active', createdAt: now, updatedAt: now })));

  // ── Item categories ───────────────────────────────────────────────────────────
  await db.collection('itemcategories').insertMany([
    { _id: catBrk,    name: 'Breakfast Sandwich', type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catLSand,  name: 'Lunch Sandwich',     type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catLMeal,  name: 'Lunch Meals',        type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catSalad,  name: 'Salads',             type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catSoup,   name: 'Soups',              type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catFruit,  name: 'Fresh Fruits',       type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catSBake,  name: 'Sweet Bakery',       type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catSaltB,  name: 'Salted Bakery',      type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catYog,    name: 'Yogurt',             type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catNuts,   name: 'Nuts',               type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catCake,   name: 'Sweets Cakes',       type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catGran,   name: 'Granola',            type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catJuice,  name: 'Fresh Juice',        type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catWater,  name: 'Water',              type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catCoffee, name: 'Coffee',             type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catMilk,   name: 'Milk',               type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catTea,    name: 'Tea',                type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catPCup,   name: 'Paper Cups',         type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catPlate,  name: 'Plates',             type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catSpoon,  name: 'Spoons',             type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catFork,   name: 'Forks',              type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catKnife,  name: 'Knives',             type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catSauce,  name: 'Sauces',             type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catSyrup,  name: 'Syrups',             type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catSupport,name: 'Support Materials',  type: 'material', status: 'active', createdAt: now, updatedAt: now },
  ]);

  // ── Items ─────────────────────────────────────────────────────────────────────
  await db.collection('items').insertMany([
    { _id: iBs1,    name: 'Classic Breakfast Sandwich', category: catBrk,   type: 'food',     unit: 'pcs',    limitQty: 500,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iBs2,    name: 'Veggie Breakfast Sandwich',  category: catBrk,   type: 'food',     unit: 'pcs',    limitQty: 200,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iLs1,    name: 'Club Lunch Sandwich',        category: catLSand, type: 'food',     unit: 'pcs',    limitQty: 400,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iLs2,    name: 'Tuna Lunch Sandwich',        category: catLSand, type: 'food',     unit: 'pcs',    limitQty: 300,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iLm1,    name: 'Chicken Kabsa',              category: catLMeal, type: 'food',     unit: 'box',    limitQty: 250,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iLm2,    name: 'Beef Stew',                  category: catLMeal, type: 'food',     unit: 'box',    limitQty: 200,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iSl1,    name: 'Caesar Salad',               category: catSalad, type: 'food',     unit: 'bowl',   limitQty: 300,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iSl2,    name: 'Greek Salad',                category: catSalad, type: 'food',     unit: 'bowl',   limitQty: 200,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iSp1,    name: 'Tomato Soup',                category: catSoup,  type: 'food',     unit: 'cup',    limitQty: 150,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iSp2,    name: 'Lentil Soup',                category: catSoup,  type: 'food',     unit: 'cup',    limitQty: 150,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iFr1,    name: 'Apple',                      category: catFruit, type: 'food',     unit: 'pcs',    limitQty: 600,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iFr2,    name: 'Orange',                     category: catFruit, type: 'food',     unit: 'pcs',    limitQty: 500,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iFr3,    name: 'Banana',                     category: catFruit, type: 'food',     unit: 'pcs',    limitQty: 500,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iSb1,    name: 'Croissant',                  category: catSBake, type: 'food',     unit: 'pcs',    limitQty: 400,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iSb2,    name: 'Blueberry Muffin',           category: catSBake, type: 'food',     unit: 'pcs',    limitQty: 300,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iSalt1,  name: 'Cheese Roll',                category: catSaltB, type: 'food',     unit: 'pcs',    limitQty: 350,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iYog1,   name: 'Yogurt Cup',                 category: catYog,   type: 'food',     unit: 'cup',    limitQty: 400,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iNut1,   name: 'Mixed Nuts 30g',             category: catNuts,  type: 'food',     unit: 'pack',   limitQty: 300,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iSc1,    name: 'Chocolate Cake Slice',       category: catCake,  type: 'food',     unit: 'pcs',    limitQty: 200,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iGran1,  name: 'Granola Bar',                category: catGran,  type: 'food',     unit: 'bar',    limitQty: 400,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iJc1,    name: 'Orange Juice 200ml',         category: catJuice, type: 'food',     unit: 'bottle', limitQty: 500,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iJc2,    name: 'Apple Juice 200ml',          category: catJuice, type: 'food',     unit: 'bottle', limitQty: 400,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iWater1, name: 'Water Bottle 500ml',         category: catWater, type: 'material', unit: 'bottle', limitQty: 2000, status: 'active', createdAt: now, updatedAt: now },
    { _id: iWater2, name: 'Water Bottle 1.5L',          category: catWater, type: 'material', unit: 'bottle', limitQty: 1000, status: 'active', createdAt: now, updatedAt: now },
    { _id: iCoffee1,name: 'Nescafe Sachet',             category: catCoffee,type: 'material', unit: 'sachet', limitQty: 1500, status: 'active', createdAt: now, updatedAt: now },
    { _id: iMilk1,  name: 'Milk Box 200ml',             category: catMilk,  type: 'material', unit: 'box',    limitQty: 1000, status: 'active', createdAt: now, updatedAt: now },
    { _id: iTea1,   name: 'Tea Bag',                    category: catTea,   type: 'material', unit: 'bag',    limitQty: 2000, status: 'active', createdAt: now, updatedAt: now },
    { _id: iPCup1,  name: 'Paper Cup 8oz',              category: catPCup,  type: 'material', unit: 'pcs',    limitQty: 3000, status: 'active', createdAt: now, updatedAt: now },
    { _id: iPCup2,  name: 'Paper Cup 12oz',             category: catPCup,  type: 'material', unit: 'pcs',    limitQty: 2000, status: 'active', createdAt: now, updatedAt: now },
    { _id: iPlate1, name: 'Disposable Plate',           category: catPlate, type: 'material', unit: 'pcs',    limitQty: 2000, status: 'active', createdAt: now, updatedAt: now },
    { _id: iSpoon1, name: 'Plastic Spoon',              category: catSpoon, type: 'material', unit: 'pcs',    limitQty: 3000, status: 'active', createdAt: now, updatedAt: now },
    { _id: iFork1,  name: 'Plastic Fork',               category: catFork,  type: 'material', unit: 'pcs',    limitQty: 2500, status: 'active', createdAt: now, updatedAt: now },
    { _id: iKnife1, name: 'Plastic Knife',              category: catKnife, type: 'material', unit: 'pcs',    limitQty: 2000, status: 'active', createdAt: now, updatedAt: now },
    { _id: iSauce1, name: 'Ketchup Sachet',             category: catSauce, type: 'material', unit: 'sachet', limitQty: 2000, status: 'active', createdAt: now, updatedAt: now },
    { _id: iSauce2, name: 'Mayonnaise Sachet',          category: catSauce, type: 'material', unit: 'sachet', limitQty: 2000, status: 'active', createdAt: now, updatedAt: now },
    { _id: iSyrup1, name: 'Sugar Sachet',               category: catSyrup, type: 'material', unit: 'sachet', limitQty: 5000, status: 'active', createdAt: now, updatedAt: now },
    { _id: iSup1,   name: 'Napkin Pack',                category: catSupport,type:'material', unit: 'pack',   limitQty: 500,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iSup2,   name: 'Tray Liner',                 category: catSupport,type:'material', unit: 'pcs',    limitQty: 1000, status: 'active', createdAt: now, updatedAt: now },
  ]);

  // ── Daily Plans (7 days) ──────────────────────────────────────────────────────
  const planIds = Array.from({ length: 7 }, oid);
  const planStatuses = ['closed', 'closed', 'closed', 'published', 'published', 'draft', 'draft'];
  await db.collection('dailyplans').insertMany(planIds.map((pid, i) => ({
    _id: pid, date: daysAgo(6 - i), project: projectId, building: buildingId,
    shift: 'morning', status: planStatuses[i], createdBy: adminId,
    createdAt: daysAgo(7 - i), updatedAt: daysAgo(7 - i),
  })));

  const sampleFood = [iBs1, iLm1, iFr1, iJc1];
  const sampleMat  = [iWater1, iPCup1];
  const sampleItems = [...sampleFood, ...sampleMat];

  const planLines: any[] = [];
  for (const pid of planIds) {
    for (const fid of floorIds) {
      for (const iid of sampleItems) {
        planLines.push({ _id: oid(), dailyPlan: pid, floor: fid, item: iid, plannedQty: Math.floor(Math.random() * 20) + 10, createdAt: now, updatedAt: now });
      }
    }
  }
  await db.collection('dailyplanlines').insertMany(planLines);

  // ── Floor Checks ──────────────────────────────────────────────────────────────
  const checkStatuses = ['approved', 'approved', 'approved', 'submitted', 'submitted', 'under_review', 'returned'];
  const floorCheckDocs: any[] = [], floorCheckLinesDocs: any[] = [], approvalRecordDocs: any[] = [], stockMovementDocs: any[] = [];
  const inventoryMap: Record<string, any> = {};
  const period = monthPeriod(0);

  for (let day = 0; day < 7; day++) {
    const planId = planIds[day], checkDate = daysAgo(6 - day), status = checkStatuses[day] || 'draft';
    for (let fi = 0; fi < floorIds.length; fi++) {
      const floorId = floorIds[fi], checkId = oid();
      const checkLines = sampleItems.map(iid => {
        const planned = Math.floor(Math.random() * 20) + 10, actual = planned - Math.floor(Math.random() * 5);
        const diff = actual - planned;
        const lineStatus = diff < -3 ? 'shortage' : diff > 2 ? 'extra' : 'ok';
        return { _id: oid(), floorCheck: checkId, item: iid, plannedQty: planned, actualQty: actual, difference: diff, lineStatus, notes: lineStatus === 'shortage' ? 'Requested more from warehouse' : undefined, photos: [], createdAt: checkDate, updatedAt: checkDate };
      });
      floorCheckLinesDocs.push(...checkLines);

      const approvalRecs: ObjectId[] = [];
      if (['submitted', 'approved', 'under_review', 'returned'].includes(status)) {
        const r = oid(); approvalRecs.push(r);
        approvalRecordDocs.push({ _id: r, entityType: 'floor_check', entityId: checkId, step: 'supervisor', action: 'submit', actor: supervisorId, comment: 'Daily check completed', version: 1, createdAt: new Date(checkDate.getTime() + 3600000) });
      }
      if (['under_review', 'approved'].includes(status)) {
        const r = oid(); approvalRecs.push(r);
        approvalRecordDocs.push({ _id: r, entityType: 'floor_check', entityId: checkId, step: 'assistant_supervisor', action: 'review', actor: assistantId, comment: 'Reviewed — forwarding for approval', version: 2, createdAt: new Date(checkDate.getTime() + 7200000) });
      }
      if (status === 'returned') {
        const r = oid(); approvalRecs.push(r);
        approvalRecordDocs.push({ _id: r, entityType: 'floor_check', entityId: checkId, step: 'assistant_supervisor', action: 'return', actor: assistantId, comment: 'Quantities need verification on 3rd floor', version: 2, createdAt: new Date(checkDate.getTime() + 7200000) });
      }
      if (status === 'approved') {
        const r = oid(); approvalRecs.push(r);
        approvalRecordDocs.push({ _id: r, entityType: 'floor_check', entityId: checkId, step: 'project_manager', action: 'approve', actor: managerId, comment: 'Approved', version: 3, createdAt: new Date(checkDate.getTime() + 10800000) });
        for (const line of checkLines) {
          if (line.actualQty > 0) {
            const isFood = sampleFood.some(fi => fi.equals(line.item));
            const movType = isFood ? 'CONSUMPTION' : 'ISSUE';
            const key = `${projectId}-${line.item.toString()}-${period}`;
            if (!inventoryMap[key]) {
              inventoryMap[key] = { _id: oid(), project: projectId, item: line.item, period, monthlyLimit: 500, openingBalance: 200, receivedQty: 300, consumedQty: 0, issuedQty: 0, damagedQty: 0, returnedQty: 0, remainingQty: 500, status: 'available', updatedAt: now };
            }
            if (movType === 'CONSUMPTION') inventoryMap[key].consumedQty += line.actualQty;
            else inventoryMap[key].issuedQty += line.actualQty;
            stockMovementDocs.push({ _id: oid(), project: projectId, item: line.item, movementType: movType, quantity: line.actualQty, movementDate: checkDate, sourceType: 'floor_check', sourceRef: checkId, notes: 'Auto from floor check approval', createdBy: supervisorId, createdAt: new Date(checkDate.getTime() + 11000000) });
          }
        }
      }
      const currentStep = status === 'draft' ? 'supervisor' : status === 'submitted' ? 'assistant_supervisor' : status === 'under_review' ? 'project_manager' : status === 'returned' ? 'supervisor' : status === 'approved' ? 'client' : 'supervisor';
      floorCheckDocs.push({ _id: checkId, dailyPlan: planId, date: checkDate, project: projectId, building: buildingId, floor: floorId, shift: 'morning', supervisor: supervisorId, checkTime: new Date(checkDate.getTime() + 1800000), status, notes: fi === 0 ? 'Floor inspection completed on schedule' : undefined, approvalRecords: approvalRecs, currentApprovalStep: currentStep, createdAt: checkDate, updatedAt: checkDate });
    }
  }

  await db.collection('floorchecklines').insertMany(floorCheckLinesDocs);
  await db.collection('floorchecks').insertMany(floorCheckDocs);
  if (approvalRecordDocs.length) await db.collection('approvalrecords').insertMany(approvalRecordDocs);

  // ── Inventory balances ────────────────────────────────────────────────────────
  for (const bal of Object.values(inventoryMap)) {
    bal.remainingQty = bal.openingBalance + bal.receivedQty - bal.consumedQty - bal.issuedQty - bal.damagedQty + bal.returnedQty;
    const used = bal.consumedQty + bal.issuedQty;
    bal.status = bal.remainingQty <= 0 ? 'out_of_stock' : (used > bal.monthlyLimit && bal.monthlyLimit > 0) ? 'over_consumed' : (bal.monthlyLimit > 0 && bal.remainingQty / bal.monthlyLimit < 0.2) ? 'low_stock' : 'available';
  }
  const prevPeriod = monthPeriod(1);
  for (const iid of [...foodItemIds, ...matItemIds]) {
    inventoryMap[`${projectId}-${iid.toString()}-${prevPeriod}`] = { _id: oid(), project: projectId, item: iid, period: prevPeriod, monthlyLimit: 400, openingBalance: 100, receivedQty: 350, consumedQty: 280, issuedQty: 0, damagedQty: 10, returnedQty: 5, remainingQty: 165, status: 'available', updatedAt: now };
  }
  await db.collection('inventorybalances').insertMany(Object.values(inventoryMap));

  // ── Stock movements (RECEIVE) ─────────────────────────────────────────────────
  const receives = [...foodItemIds.slice(0, 5), ...matItemIds.slice(0, 5)].map(iid => ({ _id: oid(), project: projectId, item: iid, movementType: 'RECEIVE', quantity: 300, movementDate: daysAgo(10), sourceType: 'manual', notes: 'Monthly stock replenishment', createdBy: managerId, createdAt: daysAgo(10) }));
  await db.collection('stockmovements').insertMany([...receives, ...stockMovementDocs]);

  // ── Suppliers ─────────────────────────────────────────────────────────────────
  const sup1Id = oid(), sup2Id = oid(), sup3Id = oid(), sup4Id = oid(), sup5Id = oid();
  await db.collection('suppliers').insertMany([
    { _id: sup1Id, name: 'Al-Mawrid Food Trading',        nameAr: 'شركة المورد للتجارة الغذائية',        category: 'food',     contactName: 'Faisal Al-Amri',    phone: '+966512345678', email: 'contact@almawrid.sa',    rating: 4.5, status: 'active',   licenseNumber: 'SA-F-2023-001', address: 'Riyadh Industrial City', createdAt: daysAgo(90), updatedAt: now },
    { _id: sup2Id, name: 'Arabian Fresh Produce Co.',     nameAr: 'شركة الجزيرة للمنتجات الطازجة',      category: 'food',     contactName: 'Nasser Al-Qahtani', phone: '+966523456789', email: 'info@arabianfresh.sa',   rating: 4.2, status: 'active',   licenseNumber: 'SA-F-2022-045', address: 'Jeddah Food Market',     createdAt: daysAgo(85), updatedAt: now },
    { _id: sup3Id, name: 'Gulf Dairy Supplies',           nameAr: 'مستلزمات الخليج للألبان',            category: 'food',     contactName: 'Hana Al-Otaibi',    phone: '+966534567890', email: 'supply@gulfdairy.sa',    rating: 3.8, status: 'active',   licenseNumber: 'SA-F-2021-112', address: 'Dammam',                 createdAt: daysAgo(80), updatedAt: now },
    { _id: sup4Id, name: 'Saudi Cleaning Solutions',      nameAr: 'الحلول السعودية للنظافة',            category: 'material', contactName: 'Mansour Al-Ghamdi', phone: '+966545678901', email: 'orders@scsclean.sa',     rating: 4.0, status: 'active',   licenseNumber: 'SA-M-2023-078', address: 'Riyadh',                 createdAt: daysAgo(75), updatedAt: now },
    { _id: sup5Id, name: 'Kingdom Hospitality Supplies',  nameAr: 'مستلزمات الضيافة للمملكة',           category: 'both',     contactName: 'Reem Al-Harbi',     phone: '+966578901234', email: 'contact@khsupplies.sa',  rating: 4.3, status: 'active',   licenseNumber: 'SA-B-2022-089', address: 'Mecca Road, Jeddah',     createdAt: daysAgo(60), updatedAt: now },
  ]);

  // ── Batches (FIFO/FEFO) ───────────────────────────────────────────────────────
  function daysAhead(n: number): Date {
    const d = new Date(); d.setDate(d.getDate() + n); return d;
  }
  const batchDefs = [
    { item: iJc1,    supplier: sup1Id, qty: 3000, recv: 20, expiry: daysAhead(25),  zone: 'cold',        status: 'active'  },
    { item: iFr1,    supplier: sup2Id, qty: 600,  recv: 18, expiry: daysAhead(5),   zone: 'cold',        status: 'active'  },
    { item: iFr2,    supplier: sup2Id, qty: 500,  recv: 15, expiry: daysAhead(3),   zone: 'cold',        status: 'active'  },
    { item: iYog1,   supplier: sup3Id, qty: 400,  recv: 10, expiry: daysAhead(8),   zone: 'chilled',     status: 'active'  },
    { item: iSb1,    supplier: sup1Id, qty: 400,  recv: 8,  expiry: daysAhead(2),   zone: 'ambient',     status: 'active'  },
    { item: iBs1,    supplier: sup1Id, qty: 500,  recv: 5,  expiry: daysAhead(1),   zone: 'ambient',     status: 'active'  },
    { item: iLm1,    supplier: sup2Id, qty: 250,  recv: 3,  expiry: daysAhead(-2),  zone: 'cold',        status: 'expired' },
    { item: iJc2,    supplier: sup1Id, qty: 400,  recv: 25, expiry: daysAhead(45),  zone: 'cold',        status: 'active'  },
    { item: iWater1, supplier: sup4Id, qty: 2000, recv: 30, expiry: daysAhead(365), zone: 'dry_storage', status: 'active'  },
    { item: iPCup1,  supplier: sup5Id, qty: 3000, recv: 28, expiry: daysAhead(180), zone: 'dry_storage', status: 'active'  },
  ];
  const batchIds = batchDefs.map(() => oid());
  await db.collection('batches').insertMany(batchDefs.map(({ item, supplier, qty, recv, expiry, zone, status }, i) => ({
    _id: batchIds[i],
    batchNumber: `BAT-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`,
    item, supplier, project: projectId,
    quantity: qty, remainingQty: Math.floor(qty * 0.75),
    receivedDate: daysAgo(recv), expiryDate: expiry,
    storageZone: zone, status,
    createdBy: adminId, createdAt: daysAgo(recv), updatedAt: now,
  })));

  // ── Spoilage records ──────────────────────────────────────────────────────────
  await db.collection('spoilages').insertMany([
    { _id: oid(), item: iLm1, batch: batchIds[6], project: projectId, quantity: 12, reason: 'expired', alertType: 'expired', location: '2 Floor Cold Store', storageZone: 'cold', date: daysAgo(2), status: 'active', detectedAt: daysAgo(2), createdBy: supervisorId, createdAt: daysAgo(2), updatedAt: now },
    { _id: oid(), item: iFr2, batch: batchIds[2], project: projectId, quantity: 8,  reason: 'temperature_issue', alertType: 'temperature_breach', location: 'SECURITY Floor Fridge', storageZone: 'cold', date: daysAgo(3), daysUntilExpiry: 3, status: 'active', detectedAt: daysAgo(3), createdBy: supervisorId, createdAt: daysAgo(3), updatedAt: now },
    { _id: oid(), item: iYog1, project: projectId, quantity: 5, reason: 'damaged', alertType: 'damaged', location: 'KAFAA-1 Station', storageZone: 'chilled', date: daysAgo(5), status: 'resolved', detectedAt: daysAgo(5), createdBy: supervisorId, resolvedBy: managerId, resolvedAt: daysAgo(4), createdAt: daysAgo(5), updatedAt: daysAgo(4) },
    { _id: oid(), item: iSb1,  batch: batchIds[4], project: projectId, quantity: 20, reason: 'expired',  alertType: 'near_expiry', location: '19 Floor Pantry', storageZone: 'ambient', date: daysAgo(1), daysUntilExpiry: 2, status: 'active', detectedAt: daysAgo(1), createdBy: supervisorId, createdAt: daysAgo(1), updatedAt: now },
    { _id: oid(), item: iBs1,  batch: batchIds[5], project: projectId, quantity: 15, reason: 'quality_issue', alertType: 'spoiled', location: '3 Floor Service', storageZone: 'ambient', date: daysAgo(4), status: 'dismissed', detectedAt: daysAgo(4), createdBy: supervisorId, createdAt: daysAgo(4), updatedAt: daysAgo(4) },
  ]);

  // ── Purchase Orders ───────────────────────────────────────────────────────────
  const currentMonth = monthPeriod(0);
  const po1Id = oid(), po2Id = oid();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  await db.collection('purchaseorders').insertMany([
    {
      _id: po1Id,
      poNumber: `PO-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-001`,
      supplier: sup1Id, project: projectId, month: currentMonth,
      startDate: startOfMonth, endDate: endOfMonth, status: 'partially_received',
      notes: 'Monthly food allocation — CDMDNA Building Operations',
      lines: [
        { _id: oid(), item: iJc1,  unit: 'bottle', approvedQty: 3000, receivedQty: 1500, distributedQty: 800, consumedQty: 0, remainingQty: 2200, variance: 0 },
        { _id: oid(), item: iFr1,  unit: 'pcs',    approvedQty: 600,  receivedQty: 600,  distributedQty: 280, consumedQty: 0, remainingQty: 320,  variance: 0 },
        { _id: oid(), item: iSb1,  unit: 'pcs',    approvedQty: 400,  receivedQty: 400,  distributedQty: 380, consumedQty: 0, remainingQty: 20,   variance: 0 },
        { _id: oid(), item: iBs1,  unit: 'pcs',    approvedQty: 500,  receivedQty: 500,  distributedQty: 320, consumedQty: 0, remainingQty: 180,  variance: 0 },
      ],
      createdBy: adminId, createdAt: daysAgo(25), updatedAt: now,
    },
    {
      _id: po2Id,
      poNumber: `PO-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-002`,
      supplier: sup4Id, project: projectId, month: currentMonth,
      startDate: startOfMonth, endDate: endOfMonth, status: 'active',
      notes: 'Monthly materials — paper cups, water, napkins',
      lines: [
        { _id: oid(), item: iWater1, unit: 'bottle', approvedQty: 2000, receivedQty: 0,    distributedQty: 0,   consumedQty: 0, remainingQty: 2000, variance: 0 },
        { _id: oid(), item: iPCup1,  unit: 'pcs',    approvedQty: 3000, receivedQty: 1500, distributedQty: 600, consumedQty: 0, remainingQty: 2400, variance: 0 },
        { _id: oid(), item: iSup1,   unit: 'pack',   approvedQty: 500,  receivedQty: 500,  distributedQty: 480, consumedQty: 0, remainingQty: 20,   variance: 0 },
      ],
      createdBy: adminId, createdAt: daysAgo(25), updatedAt: now,
    },
  ]);

  // ── Transfers (warehouse → floor) ────────────────────────────────────────────
  const tr1Id = oid(), tr2Id = oid(), tr3Id = oid();
  await db.collection('transfers').insertMany([
    {
      _id: tr1Id, project: projectId, building: buildingId, floor: floor2Id,
      status: 'confirmed', transferDate: daysAgo(5),
      lines: [
        { _id: oid(), item: iJc1,  quantity: 120, notes: '' },
        { _id: oid(), item: iFr1,  quantity: 60,  notes: '' },
        { _id: oid(), item: iSb1,  quantity: 80,  notes: '' },
      ],
      notes: 'Daily stock transfer to 2 Floor',
      createdBy: supervisorId, confirmedBy: managerId, confirmedAt: daysAgo(5),
      createdAt: daysAgo(5), updatedAt: daysAgo(5),
    },
    {
      _id: tr2Id, project: projectId, building: buildingId, floor: floor3Id,
      status: 'confirmed', transferDate: daysAgo(3),
      lines: [
        { _id: oid(), item: iWater1, quantity: 200, notes: '' },
        { _id: oid(), item: iPCup1,  quantity: 300, notes: '' },
      ],
      notes: '3 Floor weekly restocking',
      createdBy: supervisorId, confirmedBy: managerId, confirmedAt: daysAgo(3),
      createdAt: daysAgo(3), updatedAt: daysAgo(3),
    },
    {
      _id: tr3Id, project: projectId, building: buildingId, floor: floor19Id,
      status: 'draft', transferDate: now,
      lines: [
        { _id: oid(), item: iBs1, quantity: 50,  notes: '' },
        { _id: oid(), item: iJc2, quantity: 40,  notes: '' },
      ],
      notes: 'Pending approval before dispatch',
      createdBy: supervisorId, createdAt: daysAgo(1), updatedAt: daysAgo(1),
    },
  ]);

  // ── Receiving records (deliveries from suppliers) ─────────────────────────────
  const rec1Id = oid(), rec2Id = oid();
  await db.collection('receivings').insertMany([
    {
      _id: rec1Id, project: projectId, supplier: sup1Id, purchaseOrder: po1Id,
      deliveryDate: daysAgo(10),
      lines: [
        { _id: oid(), item: iJc1,  quantityOrdered: 1500, quantityReceived: 1500, condition: 'good',    batchNumber: `BAT-REC-001` },
        { _id: oid(), item: iFr1,  quantityOrdered: 600,  quantityReceived: 580,  condition: 'good',    batchNumber: `BAT-REC-002`, notes: '20 units missing from delivery' },
        { _id: oid(), item: iSb1,  quantityOrdered: 400,  quantityReceived: 390,  condition: 'good',    batchNumber: `BAT-REC-003` },
        { _id: oid(), item: iBs1,  quantityOrdered: 500,  quantityReceived: 500,  condition: 'good',    batchNumber: `BAT-REC-004` },
      ],
      status: 'confirmed', invoiceNumber: 'INV-2026-4512',
      notes: 'May food delivery from Al-Mawrid — all items checked.',
      receivedBy: assistantId, confirmedBy: managerId, confirmedAt: daysAgo(10),
      createdAt: daysAgo(10), updatedAt: daysAgo(10),
    },
    {
      _id: rec2Id, project: projectId, supplier: sup4Id, purchaseOrder: po2Id,
      deliveryDate: daysAgo(2),
      lines: [
        { _id: oid(), item: iWater1, quantityOrdered: 2000, quantityReceived: 2000, condition: 'good' },
        { _id: oid(), item: iPCup1,  quantityOrdered: 1500, quantityReceived: 1500, condition: 'good' },
        { _id: oid(), item: iSup1,   quantityOrdered: 500,  quantityReceived: 500,  condition: 'good' },
      ],
      status: 'confirmed', invoiceNumber: 'INV-2026-2201',
      notes: 'Materials delivery — Saudi Cleaning Solutions.',
      receivedBy: assistantId, confirmedBy: managerId, confirmedAt: daysAgo(2),
      createdAt: daysAgo(2), updatedAt: daysAgo(2),
    },
  ]);

  // ── Maintenance Requests ──────────────────────────────────────────────────────
  const mr1Id = oid(), mr2Id = oid(), mr3Id = oid();
  await db.collection('maintenancerequests').insertMany([
    {
      _id: mr1Id, title: 'AC unit malfunction — 2 Floor server room',
      description: 'The air conditioning unit in the 2nd floor server room stopped cooling. Temperature rising above safe threshold.',
      project: projectId, building: buildingId, floor: floor2Id,
      category: 'hvac', priority: 'critical', status: 'in_progress',
      reportedBy: supervisorId, assignedTo: assistantId,
      assignedAt: daysAgo(3), createdAt: daysAgo(4), updatedAt: daysAgo(3),
    },
    {
      _id: mr2Id, title: 'Broken socket outlet — 19 Floor pantry',
      description: 'Three socket outlets near the pantry counter are not functioning. Electrical inspection required.',
      project: projectId, building: buildingId, floor: floor19Id,
      category: 'electrical', priority: 'high', status: 'assigned',
      reportedBy: supervisorId, assignedTo: assistantId,
      assignedAt: daysAgo(1), createdAt: daysAgo(2), updatedAt: daysAgo(1),
    },
    {
      _id: mr3Id, title: 'Water leak — MAKASSB floor bathroom',
      description: 'Slow water leak detected under bathroom sink. Minor but needs attention before it worsens.',
      project: projectId, building: buildingId, floor: floorMakId,
      category: 'plumbing', priority: 'medium', status: 'open',
      reportedBy: supervisorId, createdAt: daysAgo(1), updatedAt: daysAgo(1),
    },
    {
      _id: oid(), title: 'Elevator inspection certificate renewal',
      description: 'Annual elevator inspection certificate due for renewal. Coordination with facilities management needed.',
      project: projectId, building: buildingId,
      category: 'equipment', priority: 'high', status: 'resolved',
      reportedBy: managerId, assignedTo: assistantId,
      assignedAt: daysAgo(10), resolvedAt: daysAgo(3),
      resolution: 'Certificate renewed by licensed inspector. Copy filed with facilities department.',
      createdAt: daysAgo(12), updatedAt: daysAgo(3),
    },
    {
      _id: oid(), title: 'Deep cleaning required — 3 Floor kitchen',
      description: 'Monthly deep clean of the 3rd floor kitchen area. Grease build-up detected on exhaust hoods.',
      project: projectId, building: buildingId, floor: floor3Id,
      category: 'cleaning', priority: 'medium', status: 'closed',
      reportedBy: supervisorId, assignedTo: assistantId,
      assignedAt: daysAgo(15), resolvedAt: daysAgo(8),
      resolution: 'Deep cleaning completed by specialized team. All surfaces sanitized.',
      createdAt: daysAgo(16), updatedAt: daysAgo(8),
    },
  ]);

  // ── Client Requests ───────────────────────────────────────────────────────────
  await db.collection('clientrequests').insertMany([
    {
      _id: oid(), title: 'VIP meeting catering — Board Room A',
      description: 'Catering required for executive board meeting on Thursday. 15 attendees.',
      requestType: 'catering', priority: 'high',
      project: projectId, building: buildingId, floor: floor19Id,
      requestedBy: clientId, assignedTo: supervisorId, status: 'delivered',
      items: [
        { name: 'Arabic Coffee', quantity: 20, unit: 'cups' },
        { name: 'Dates Platter',  quantity: 3,  unit: 'plates' },
        { name: 'Water Bottles',  quantity: 30, unit: 'bottles' },
        { name: 'Fruit Platter',  quantity: 2,  unit: 'plates' },
      ],
      expectedDelivery: daysAgo(2), deliveredAt: daysAgo(2),
      notes: 'All items delivered 30 mins early as requested.',
      createdAt: daysAgo(5), updatedAt: daysAgo(2),
    },
    {
      _id: oid(), title: 'Office supplies replenishment — Floor 4',
      description: 'Running low on printer paper, pens, and staples. Urgent for weekly reports.',
      requestType: 'supplies', priority: 'medium',
      project: projectId, building: buildingId, floor: floor4Id,
      requestedBy: clientId, assignedTo: assistantId, status: 'confirmed',
      items: [
        { name: 'A4 Paper',  quantity: 5, unit: 'reams' },
        { name: 'Ballpoint Pens', quantity: 20, unit: 'pcs' },
        { name: 'Staples',   quantity: 3, unit: 'boxes' },
      ],
      expectedDelivery: daysAgo(4), deliveredAt: daysAgo(4), confirmedAt: daysAgo(3),
      createdAt: daysAgo(7), updatedAt: daysAgo(3),
    },
    {
      _id: oid(), title: 'Daily coffee station restocking',
      description: 'Coffee station on MAKASSB floor needs restocking — coffee capsules, sugar, and stirrers.',
      requestType: 'housekeeping', priority: 'low',
      project: projectId, building: buildingId, floor: floorMakId,
      requestedBy: clientId, status: 'submitted',
      items: [
        { name: 'Coffee Capsules', quantity: 50, unit: 'pcs' },
        { name: 'Sugar Sachets',   quantity: 100, unit: 'pcs' },
        { name: 'Stirrers',        quantity: 200, unit: 'pcs' },
      ],
      createdAt: daysAgo(1), updatedAt: daysAgo(1),
    },
    {
      _id: oid(), title: 'Quarterly staff celebration event',
      description: 'Team celebration event for Q2 results. Need setup, food, and decorations for 40 people.',
      requestType: 'event', priority: 'medium',
      project: projectId, building: buildingId,
      requestedBy: clientId, assignedTo: managerId, status: 'in_progress',
      items: [
        { name: 'Sandwiches',   quantity: 60,  unit: 'pcs' },
        { name: 'Juice Boxes',  quantity: 80,  unit: 'pcs' },
        { name: 'Cake',         quantity: 2,   unit: 'pcs' },
        { name: 'Decorations',  quantity: 1,   unit: 'set' },
      ],
      expectedDelivery: daysAhead(3),
      createdAt: daysAgo(3), updatedAt: daysAgo(2),
    },
  ]);

  // ── Corrective Actions ────────────────────────────────────────────────────────
  const ca1Id = oid(), ca2Id = oid(), ca3Id = oid(), ca4Id = oid(), ca5Id = oid();
  await db.collection('correctiveactions').insertMany([
    {
      _id: ca1Id,
      title: 'Temperature breach in cold storage — 2 Floor',
      description: 'Cold storage temperature reached 9°C during night shift. All perishables at risk. Root cause: compressor fault. Immediate rectification required.',
      sourceType: 'fridge_check', project: projectId,
      assignedTo: assistantId, dueDate: daysAhead(2),
      priority: 'critical', status: 'in_progress',
      createdBy: supervisorId, createdAt: daysAgo(3), updatedAt: daysAgo(1),
    },
    {
      _id: ca2Id,
      title: 'Expired items found during fridge check — 3 Floor',
      description: 'Two batches past expiry date found in 3 Floor cold zone during routine check. Items discarded. FIFO compliance review required.',
      sourceType: 'fridge_check', project: projectId,
      assignedTo: assistantId, dueDate: daysAhead(5),
      priority: 'high', status: 'open',
      createdBy: supervisorId, createdAt: daysAgo(2), updatedAt: daysAgo(2),
    },
    {
      _id: ca3Id,
      title: 'Missing name tags on fridge items — KAFAA-1',
      description: 'Multiple items in KAFAA-1 station missing name tags and date labels. Traceability compromised. Staff retraining required.',
      sourceType: 'fridge_check', project: projectId,
      assignedTo: supervisorId, dueDate: daysAhead(3),
      priority: 'medium', status: 'open',
      createdBy: assistantId, createdAt: daysAgo(1), updatedAt: daysAgo(1),
    },
    {
      _id: ca4Id,
      title: 'Cleanliness issue in freezer zone — 19 Floor',
      description: 'Ice build-up and residue found on freezer shelves. Scheduled deep clean overdue. Hygiene compliance failure.',
      sourceType: 'floor_check', project: projectId,
      assignedTo: supervisorId, dueDate: daysAgo(1),
      priority: 'high', status: 'resolved',
      resolution: 'Freezer zone deep cleaned by maintenance team. Anti-ice coating applied. Scheduled bi-weekly checks activated.',
      resolvedAt: daysAgo(1),
      createdBy: managerId, createdAt: daysAgo(6), updatedAt: daysAgo(1),
    },
    {
      _id: ca5Id,
      title: 'FIFO order not followed for juice stock',
      description: 'Newer juice batches being consumed before older ones. Risk of expiry for older stock. Process retraining needed.',
      sourceType: 'inventory', project: projectId,
      assignedTo: assistantId, dueDate: daysAgo(3),
      priority: 'medium', status: 'closed',
      resolution: 'Staff retrained on FIFO protocol. Storage areas relabelled with clear date indicators. Supervisor spot-check schedule added.',
      resolvedAt: daysAgo(5),
      createdBy: managerId, createdAt: daysAgo(10), updatedAt: daysAgo(5),
    },
  ]);

  // ── Fridge Checks ─────────────────────────────────────────────────────────────
  await db.collection('fridgechecks').insertMany([
    {
      _id: oid(),
      date: daysAgo(0), floor: floor2Id, building: buildingId, project: projectId,
      storageZone: 'cold', checkedBy: supervisorId,
      temperature: 3.2, expectedTempMin: 1, expectedTempMax: 5,
      cleanlinessOk: true,
      itemsChecked: [
        { batch: batchIds[0], item: iJc1,  expiryDate: daysAhead(25), isExpired: false, isNearExpiry: false, quantity: 2250, condition: 'good',    nameTagPresent: true  },
        { batch: batchIds[1], item: iFr1,  expiryDate: daysAhead(5),  isExpired: false, isNearExpiry: false, quantity: 450,  condition: 'good',    nameTagPresent: true  },
        { batch: batchIds[2], item: iFr2,  expiryDate: daysAhead(3),  isExpired: false, isNearExpiry: true,  quantity: 375,  condition: 'near_expiry', nameTagPresent: true },
      ],
      status: 'issue_found',
      createdAt: daysAgo(0), updatedAt: daysAgo(0),
    },
    {
      _id: oid(),
      date: daysAgo(1), floor: floor3Id, building: buildingId, project: projectId,
      storageZone: 'cold', checkedBy: supervisorId,
      temperature: 9.1, expectedTempMin: 1, expectedTempMax: 5,
      cleanlinessOk: true,
      itemsChecked: [
        { batch: batchIds[6], item: iLm1,  expiryDate: daysAhead(-2), isExpired: true,  isNearExpiry: false, quantity: 188, condition: 'expired', nameTagPresent: true },
        { batch: batchIds[3], item: iYog1, expiryDate: daysAhead(8),  isExpired: false, isNearExpiry: false, quantity: 300, condition: 'good',    nameTagPresent: false },
      ],
      status: 'corrective_action_required',
      correctiveActionId: ca1Id,
      createdAt: daysAgo(1), updatedAt: daysAgo(1),
    },
    {
      _id: oid(),
      date: daysAgo(2), floor: floor19Id, building: buildingId, project: projectId,
      storageZone: 'chilled', checkedBy: assistantId,
      temperature: 4.8, expectedTempMin: 2, expectedTempMax: 6,
      cleanlinessOk: true,
      itemsChecked: [
        { batch: batchIds[3], item: iYog1, expiryDate: daysAhead(8),  isExpired: false, isNearExpiry: false, quantity: 300, condition: 'good', nameTagPresent: true },
        { batch: batchIds[4], item: iSb1,  expiryDate: daysAhead(2),  isExpired: false, isNearExpiry: true,  quantity: 300, condition: 'near_expiry', nameTagPresent: true },
      ],
      status: 'issue_found',
      createdAt: daysAgo(2), updatedAt: daysAgo(2),
    },
    {
      _id: oid(),
      date: daysAgo(3), floor: floorMakId, building: buildingId, project: projectId,
      storageZone: 'cold', checkedBy: supervisorId,
      temperature: 2.5, expectedTempMin: 1, expectedTempMax: 5,
      cleanlinessOk: true,
      itemsChecked: [
        { batch: batchIds[0], item: iJc1, expiryDate: daysAhead(25), isExpired: false, isNearExpiry: false, quantity: 2250, condition: 'good', nameTagPresent: true },
        { batch: batchIds[7], item: iJc2, expiryDate: daysAhead(45), isExpired: false, isNearExpiry: false, quantity: 300,  condition: 'good', nameTagPresent: true },
      ],
      status: 'ok',
      createdAt: daysAgo(3), updatedAt: daysAgo(3),
    },
    {
      _id: oid(),
      date: daysAgo(4), floor: floorKafaa1Id, building: buildingId, project: projectId,
      storageZone: 'dry_storage', checkedBy: assistantId,
      temperature: 20.1, expectedTempMin: 15, expectedTempMax: 25,
      cleanlinessOk: false, cleanlinessNotes: 'Shelves dusty, bread crumbs accumulation on bottom shelf.',
      itemsChecked: [
        { batch: batchIds[8],  item: iWater1, expiryDate: daysAhead(365), isExpired: false, isNearExpiry: false, quantity: 1500, condition: 'good', nameTagPresent: true },
        { batch: batchIds[9],  item: iPCup1,  expiryDate: daysAhead(180), isExpired: false, isNearExpiry: false, quantity: 2250, condition: 'good', nameTagPresent: true },
        { batch: batchIds[5],  item: iBs1,    expiryDate: daysAhead(1),   isExpired: false, isNearExpiry: true,  quantity: 375,  condition: 'near_expiry', nameTagPresent: false },
      ],
      status: 'corrective_action_required',
      correctiveActionId: ca3Id,
      createdAt: daysAgo(4), updatedAt: daysAgo(4),
    },
  ]);

  // ── Audit logs ─────────────────────────────────────────────────────────────────
  await db.collection('auditlogs').insertMany([
    { _id: oid(), user: adminId,      action: 'login',  entityType: 'user',           entityId: adminId,      createdAt: daysAgo(7) },
    { _id: oid(), user: adminId,      action: 'create', entityType: 'project',        entityId: projectId,    createdAt: daysAgo(7) },
    { _id: oid(), user: adminId,      action: 'create', entityType: 'building',       entityId: buildingId,   createdAt: daysAgo(7) },
    { _id: oid(), user: supervisorId, action: 'login',  entityType: 'user',           entityId: supervisorId, createdAt: daysAgo(6) },
    { _id: oid(), user: supervisorId, action: 'submit', entityType: 'floor_check',    entityId: floorCheckDocs[0]._id, createdAt: daysAgo(6) },
    { _id: oid(), user: assistantId,  action: 'review', entityType: 'floor_check',    entityId: floorCheckDocs[0]._id, createdAt: daysAgo(5) },
    { _id: oid(), user: managerId,    action: 'approve',entityType: 'floor_check',    entityId: floorCheckDocs[0]._id, createdAt: daysAgo(5) },
    { _id: oid(), user: managerId,    action: 'export', entityType: 'floor_check',    entityId: floorCheckDocs[0]._id, createdAt: daysAgo(4) },
    { _id: oid(), user: managerId,    action: 'login',  entityType: 'user',           entityId: managerId,    createdAt: daysAgo(2) },
    { _id: oid(), user: clientId,     action: 'login',  entityType: 'user',           entityId: clientId,     createdAt: daysAgo(1) },
    { _id: oid(), user: adminId,      action: 'create', entityType: 'item',           entityId: iBs1,         createdAt: daysAgo(7) },
    { _id: oid(), user: assistantId,  action: 'login',  entityType: 'user',           entityId: assistantId,  createdAt: daysAgo(3) },
    { _id: oid(), user: adminId,      action: 'create', entityType: 'purchase_order', entityId: po1Id,        createdAt: daysAgo(25) },
    { _id: oid(), user: adminId,      action: 'create', entityType: 'purchase_order', entityId: po2Id,        createdAt: daysAgo(25) },
    { _id: oid(), user: supervisorId, action: 'create', entityType: 'spoilage',    createdAt: daysAgo(2) },
    { _id: oid(), user: supervisorId, action: 'create', entityType: 'transfer',    entityId: tr1Id, createdAt: daysAgo(5) },
    { _id: oid(), user: managerId,    action: 'confirm', entityType: 'transfer',   entityId: tr1Id, createdAt: daysAgo(5) },
    { _id: oid(), user: assistantId,  action: 'create', entityType: 'receiving',   entityId: rec1Id, createdAt: daysAgo(10) },
    { _id: oid(), user: managerId,    action: 'confirm', entityType: 'receiving',      entityId: rec1Id, createdAt: daysAgo(10) },
    { _id: oid(), user: supervisorId, action: 'create', entityType: 'fridge_check',    createdAt: daysAgo(1) },
    { _id: oid(), user: assistantId,  action: 'create', entityType: 'fridge_check',    createdAt: daysAgo(2) },
    { _id: oid(), user: managerId,    action: 'create', entityType: 'corrective_action', entityId: ca1Id, createdAt: daysAgo(3) },
    { _id: oid(), user: managerId,    action: 'update', entityType: 'corrective_action', entityId: ca4Id, createdAt: daysAgo(1) },
  ]);

  console.log('Demo data seeded: 5 users · 56 floor checks · 38 items · 5 suppliers · 10 batches · 5 spoilage · 2 POs · 3 transfers · 2 receivings · 5 maintenance · 4 client requests · 5 fridge checks · 5 corrective actions');
}
