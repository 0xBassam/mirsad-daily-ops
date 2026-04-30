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

  // ── Audit logs ─────────────────────────────────────────────────────────────────
  await db.collection('auditlogs').insertMany([
    { _id: oid(), user: adminId,      action: 'login',  entityType: 'user',        entityId: adminId,      createdAt: daysAgo(7) },
    { _id: oid(), user: adminId,      action: 'create', entityType: 'project',     entityId: projectId,    createdAt: daysAgo(7) },
    { _id: oid(), user: adminId,      action: 'create', entityType: 'building',    entityId: buildingId,   createdAt: daysAgo(7) },
    { _id: oid(), user: supervisorId, action: 'login',  entityType: 'user',        entityId: supervisorId, createdAt: daysAgo(6) },
    { _id: oid(), user: supervisorId, action: 'submit', entityType: 'floor_check', entityId: floorCheckDocs[0]._id, createdAt: daysAgo(6) },
    { _id: oid(), user: assistantId,  action: 'review', entityType: 'floor_check', entityId: floorCheckDocs[0]._id, createdAt: daysAgo(5) },
    { _id: oid(), user: managerId,    action: 'approve',entityType: 'floor_check', entityId: floorCheckDocs[0]._id, createdAt: daysAgo(5) },
    { _id: oid(), user: managerId,    action: 'export', entityType: 'floor_check', entityId: floorCheckDocs[0]._id, createdAt: daysAgo(4) },
    { _id: oid(), user: managerId,    action: 'login',  entityType: 'user',        entityId: managerId,    createdAt: daysAgo(2) },
    { _id: oid(), user: clientId,     action: 'login',  entityType: 'user',        entityId: clientId,     createdAt: daysAgo(1) },
    { _id: oid(), user: adminId,      action: 'create', entityType: 'item',        entityId: iBs1,         createdAt: daysAgo(7) },
    { _id: oid(), user: assistantId,  action: 'login',  entityType: 'user',        entityId: assistantId,  createdAt: daysAgo(3) },
  ]);

  console.log('Demo data seeded: 5 users · 56 floor checks · 38 items · inventory balances');
}
