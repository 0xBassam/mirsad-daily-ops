import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

function id() { return new mongoose.Types.ObjectId(); }
function hashPassword(plain: string) { return bcrypt.hash(plain, 12); }
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(8, 0, 0, 0);
  return d;
}
function monthPeriod(monthsBack = 0): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsBack);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export async function seedLive(): Promise<void> {
  const db = mongoose.connection.db!;
  const now = new Date();

  const DEMO_PASS = await hashPassword('Demo@12345');

  const adminId = id(), supervisorId = id(), assistantId = id(), managerId = id(), clientId = id();
  const projectId = id(), buildingId = id();

  const floor2Id = id(), floor3Id = id(), floor4Id = id(), floor19Id = id();
  const floorMakassbId = id(), floorSecurityId = id(), floorKafaa1Id = id(), floorKafaa2Id = id();
  const floorIds = [floor2Id, floor3Id, floor4Id, floor19Id, floorMakassbId, floorSecurityId, floorKafaa1Id, floorKafaa2Id];

  const catBreakfastId = id(), catLunchSandId = id(), catLunchMealId = id(), catSaladId = id();
  const catSoupId = id(), catFruitId = id(), catSweetBakeryId = id(), catSaltedBakeryId = id();
  const catYogurtId = id(), catNutsId = id(), catSweetCakeId = id(), catGranolaId = id(), catJuiceId = id();
  const catWaterId = id(), catCoffeeId = id(), catMilkId = id(), catTeaId = id();
  const catPaperCupId = id(), catPlateId = id(), catSpoonId = id(), catForkId = id();
  const catKnifeId = id(), catSauceId = id(), catSyrupId = id(), catSupportId = id();

  const item_bs1 = id(), item_bs2 = id(), item_ls1 = id(), item_ls2 = id();
  const item_lm1 = id(), item_lm2 = id(), item_sl1 = id(), item_sl2 = id();
  const item_sp1 = id(), item_sp2 = id(), item_fr1 = id(), item_fr2 = id(), item_fr3 = id();
  const item_sb1 = id(), item_sb2 = id(), item_salt1 = id(), item_yog1 = id();
  const item_nut1 = id(), item_sc1 = id(), item_gran1 = id(), item_jc1 = id(), item_jc2 = id();
  const item_water1 = id(), item_water2 = id(), item_coffee1 = id(), item_milk1 = id();
  const item_tea1 = id(), item_pcup1 = id(), item_pcup2 = id(), item_plate1 = id();
  const item_spoon1 = id(), item_fork1 = id(), item_knife1 = id();
  const item_sauce1 = id(), item_sauce2 = id(), item_syrup1 = id(), item_sup1 = id(), item_sup2 = id();

  const foodItemIds = [item_bs1, item_bs2, item_ls1, item_ls2, item_lm1, item_lm2, item_sl1, item_sl2, item_sp1, item_sp2, item_fr1, item_fr2, item_fr3, item_sb1, item_sb2, item_salt1, item_yog1, item_nut1, item_sc1, item_gran1, item_jc1, item_jc2];
  const matItemIds = [item_water1, item_water2, item_coffee1, item_milk1, item_tea1, item_pcup1, item_pcup2, item_plate1, item_spoon1, item_fork1, item_knife1, item_sauce1, item_sauce2, item_syrup1, item_sup1, item_sup2];

  await db.collection('users').insertMany([
    { _id: adminId,      fullName: 'Ahmed Al-Rashidi',   email: 'admin@mirsad.demo',      password: DEMO_PASS, role: 'admin',                status: 'active', createdAt: now, updatedAt: now },
    { _id: supervisorId, fullName: 'Khalid Al-Otaibi',   email: 'supervisor@mirsad.demo', password: DEMO_PASS, role: 'supervisor',            project: projectId, status: 'active', createdAt: now, updatedAt: now },
    { _id: assistantId,  fullName: 'Fatima Al-Zahrani',  email: 'assistant@mirsad.demo',  password: DEMO_PASS, role: 'assistant_supervisor',  project: projectId, status: 'active', createdAt: now, updatedAt: now },
    { _id: managerId,    fullName: 'Mohammed Al-Ghamdi', email: 'manager@mirsad.demo',    password: DEMO_PASS, role: 'project_manager',       project: projectId, status: 'active', createdAt: now, updatedAt: now },
    { _id: clientId,     fullName: 'Nora Al-Shehri',     email: 'client@mirsad.demo',     password: DEMO_PASS, role: 'client',                project: projectId, status: 'active', createdAt: now, updatedAt: now },
  ]);

  await db.collection('projects').insertMany([
    { _id: projectId, name: 'CDMDNA Building Operations', clientName: 'Ministry of Defense', locationCode: 'CDMDNA-01', status: 'active', createdBy: adminId, createdAt: now, updatedAt: now },
  ]);

  await db.collection('buildings').insertMany([
    { _id: buildingId, project: projectId, name: 'CDMDNA Main Building', status: 'active', createdAt: now, updatedAt: now },
  ]);

  const floorNames = ['2 Floor', '3 Floor', '4 Floor', '19 Floor', 'MAKASSB', 'SECURITY', 'KAFAA-1', 'KAFAA-2'];
  await db.collection('floors').insertMany(
    floorIds.map((fid, i) => ({
      _id: fid, building: buildingId, project: projectId,
      name: floorNames[i], locationCode: `FL-${floorNames[i].replace(/\s/g, '-')}`,
      status: 'active', createdAt: now, updatedAt: now,
    }))
  );

  await db.collection('itemcategories').insertMany([
    { _id: catBreakfastId,   name: 'Breakfast Sandwich', type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catLunchSandId,   name: 'Lunch Sandwich',     type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catLunchMealId,   name: 'Lunch Meals',        type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catSaladId,       name: 'Salads',             type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catSoupId,        name: 'Soups',              type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catFruitId,       name: 'Fresh Fruits',       type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catSweetBakeryId, name: 'Sweet Bakery',       type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catSaltedBakeryId,name: 'Salted Bakery',      type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catYogurtId,      name: 'Yogurt',             type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catNutsId,        name: 'Nuts',               type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catSweetCakeId,   name: 'Sweets Cakes',       type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catGranolaId,     name: 'Granola',            type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catJuiceId,       name: 'Fresh Juice',        type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catWaterId,       name: 'Water',              type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catCoffeeId,      name: 'Coffee',             type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catMilkId,        name: 'Milk',               type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catTeaId,         name: 'Tea',                type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catPaperCupId,    name: 'Paper Cups',         type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catPlateId,       name: 'Plates',             type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catSpoonId,       name: 'Spoons',             type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catForkId,        name: 'Forks',              type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catKnifeId,       name: 'Knives',             type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catSauceId,       name: 'Sauces',             type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catSyrupId,       name: 'Syrups',             type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catSupportId,     name: 'Support Materials',  type: 'material', status: 'active', createdAt: now, updatedAt: now },
  ]);

  await db.collection('items').insertMany([
    { _id: item_bs1,    name: 'Classic Breakfast Sandwich', category: catBreakfastId,    type: 'food',     unit: 'pcs',    limitQty: 500,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_bs2,    name: 'Veggie Breakfast Sandwich',  category: catBreakfastId,    type: 'food',     unit: 'pcs',    limitQty: 200,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_ls1,    name: 'Club Lunch Sandwich',        category: catLunchSandId,    type: 'food',     unit: 'pcs',    limitQty: 400,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_ls2,    name: 'Tuna Lunch Sandwich',        category: catLunchSandId,    type: 'food',     unit: 'pcs',    limitQty: 300,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_lm1,    name: 'Chicken Kabsa',              category: catLunchMealId,    type: 'food',     unit: 'box',    limitQty: 250,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_lm2,    name: 'Beef Stew',                  category: catLunchMealId,    type: 'food',     unit: 'box',    limitQty: 200,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sl1,    name: 'Caesar Salad',               category: catSaladId,        type: 'food',     unit: 'bowl',   limitQty: 300,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sl2,    name: 'Greek Salad',                category: catSaladId,        type: 'food',     unit: 'bowl',   limitQty: 200,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sp1,    name: 'Tomato Soup',                category: catSoupId,         type: 'food',     unit: 'cup',    limitQty: 150,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sp2,    name: 'Lentil Soup',                category: catSoupId,         type: 'food',     unit: 'cup',    limitQty: 150,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_fr1,    name: 'Apple',                      category: catFruitId,        type: 'food',     unit: 'pcs',    limitQty: 600,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_fr2,    name: 'Orange',                     category: catFruitId,        type: 'food',     unit: 'pcs',    limitQty: 500,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_fr3,    name: 'Banana',                     category: catFruitId,        type: 'food',     unit: 'pcs',    limitQty: 500,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sb1,    name: 'Croissant',                  category: catSweetBakeryId,  type: 'food',     unit: 'pcs',    limitQty: 400,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sb2,    name: 'Blueberry Muffin',           category: catSweetBakeryId,  type: 'food',     unit: 'pcs',    limitQty: 300,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_salt1,  name: 'Cheese Roll',                category: catSaltedBakeryId, type: 'food',     unit: 'pcs',    limitQty: 350,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_yog1,   name: 'Yogurt Cup',                 category: catYogurtId,       type: 'food',     unit: 'cup',    limitQty: 400,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_nut1,   name: 'Mixed Nuts 30g',             category: catNutsId,         type: 'food',     unit: 'pack',   limitQty: 300,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sc1,    name: 'Chocolate Cake Slice',       category: catSweetCakeId,    type: 'food',     unit: 'pcs',    limitQty: 200,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_gran1,  name: 'Granola Bar',                category: catGranolaId,      type: 'food',     unit: 'bar',    limitQty: 400,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_jc1,    name: 'Orange Juice 200ml',         category: catJuiceId,        type: 'food',     unit: 'bottle', limitQty: 500,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_jc2,    name: 'Apple Juice 200ml',          category: catJuiceId,        type: 'food',     unit: 'bottle', limitQty: 400,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_water1, name: 'Water Bottle 500ml',         category: catWaterId,        type: 'material', unit: 'bottle', limitQty: 2000, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_water2, name: 'Water Bottle 1.5L',          category: catWaterId,        type: 'material', unit: 'bottle', limitQty: 1000, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_coffee1,name: 'Nescafe Sachet',             category: catCoffeeId,       type: 'material', unit: 'sachet', limitQty: 1500, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_milk1,  name: 'Milk Box 200ml',             category: catMilkId,         type: 'material', unit: 'box',    limitQty: 1000, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_tea1,   name: 'Tea Bag',                    category: catTeaId,          type: 'material', unit: 'bag',    limitQty: 2000, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_pcup1,  name: 'Paper Cup 8oz',              category: catPaperCupId,     type: 'material', unit: 'pcs',    limitQty: 3000, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_pcup2,  name: 'Paper Cup 12oz',             category: catPaperCupId,     type: 'material', unit: 'pcs',    limitQty: 2000, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_plate1, name: 'Disposable Plate',           category: catPlateId,        type: 'material', unit: 'pcs',    limitQty: 2000, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_spoon1, name: 'Plastic Spoon',              category: catSpoonId,        type: 'material', unit: 'pcs',    limitQty: 3000, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_fork1,  name: 'Plastic Fork',               category: catForkId,         type: 'material', unit: 'pcs',    limitQty: 2500, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_knife1, name: 'Plastic Knife',              category: catKnifeId,        type: 'material', unit: 'pcs',    limitQty: 2000, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sauce1, name: 'Ketchup Sachet',             category: catSauceId,        type: 'material', unit: 'sachet', limitQty: 2000, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sauce2, name: 'Mayonnaise Sachet',          category: catSauceId,        type: 'material', unit: 'sachet', limitQty: 2000, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_syrup1, name: 'Sugar Sachet',               category: catSyrupId,        type: 'material', unit: 'sachet', limitQty: 5000, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sup1,   name: 'Napkin Pack',                category: catSupportId,      type: 'material', unit: 'pack',   limitQty: 500,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sup2,   name: 'Tray Liner',                 category: catSupportId,      type: 'material', unit: 'pcs',    limitQty: 1000, status: 'active', createdAt: now, updatedAt: now },
  ]);

  const planIds = Array.from({ length: 7 }, () => id());
  const planStatuses = ['closed', 'closed', 'closed', 'published', 'published', 'draft', 'draft'];

  await db.collection('dailyplans').insertMany(
    planIds.map((pid, i) => ({
      _id: pid, date: daysAgo(6 - i), project: projectId, building: buildingId,
      shift: 'morning', status: planStatuses[i], createdBy: adminId,
      createdAt: daysAgo(7 - i), updatedAt: daysAgo(7 - i),
    }))
  );

  const sampleFoodItems = [item_bs1, item_lm1, item_fr1, item_jc1];
  const sampleMatItems  = [item_water1, item_pcup1];
  const sampleItems     = [...sampleFoodItems, ...sampleMatItems];
  const planLines: object[] = [];
  for (const pid of planIds) {
    for (const fid of floorIds) {
      for (const iid of sampleItems) {
        planLines.push({ _id: id(), dailyPlan: pid, floor: fid, item: iid, plannedQty: Math.floor(Math.random() * 20) + 10, createdAt: now, updatedAt: now });
      }
    }
  }
  await db.collection('dailyplanlines').insertMany(planLines);

  const floorCheckDocs: object[]    = [];
  const floorCheckLines: object[]   = [];
  const approvalRecords: object[]   = [];
  const stockMovements: object[]    = [];
  const inventoryMap: Record<string, any> = {};
  const checkStatuses = ['approved', 'approved', 'approved', 'submitted', 'submitted', 'under_review', 'returned'];

  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const planId    = planIds[dayIdx];
    const checkDate = daysAgo(6 - dayIdx);
    const status    = checkStatuses[dayIdx];

    for (let floorIdx = 0; floorIdx < floorIds.length; floorIdx++) {
      const floorId = floorIds[floorIdx];
      const checkId = id();

      const lines = sampleItems.map(iid => {
        const planned = Math.floor(Math.random() * 20) + 10;
        const actual  = planned - Math.floor(Math.random() * 5);
        const diff    = actual - planned;
        return {
          _id: id(), floorCheck: checkId, item: iid,
          plannedQty: planned, actualQty: actual, difference: diff,
          lineStatus: diff < -3 ? 'shortage' : diff > 2 ? 'extra' : 'ok',
          photos: [], createdAt: checkDate, updatedAt: checkDate,
        };
      });
      floorCheckLines.push(...lines);

      const approvalRefs: mongoose.Types.ObjectId[] = [];

      if (['submitted', 'approved', 'under_review', 'returned'].includes(status)) {
        const rec = id(); approvalRefs.push(rec);
        approvalRecords.push({ _id: rec, entityType: 'floor_check', entityId: checkId, step: 'supervisor', action: 'submit', actor: supervisorId, comment: 'Daily check completed', version: 1, createdAt: new Date(checkDate.getTime() + 3600000) });
      }
      if (['under_review', 'approved'].includes(status)) {
        const rec = id(); approvalRefs.push(rec);
        approvalRecords.push({ _id: rec, entityType: 'floor_check', entityId: checkId, step: 'assistant_supervisor', action: 'review', actor: assistantId, comment: 'Reviewed — forwarding for approval', version: 2, createdAt: new Date(checkDate.getTime() + 7200000) });
      }
      if (status === 'returned') {
        const rec = id(); approvalRefs.push(rec);
        approvalRecords.push({ _id: rec, entityType: 'floor_check', entityId: checkId, step: 'assistant_supervisor', action: 'return', actor: assistantId, comment: 'Quantities need verification', version: 2, createdAt: new Date(checkDate.getTime() + 7200000) });
      }
      if (status === 'approved') {
        const rec = id(); approvalRefs.push(rec);
        approvalRecords.push({ _id: rec, entityType: 'floor_check', entityId: checkId, step: 'project_manager', action: 'approve', actor: managerId, comment: 'Approved', version: 3, createdAt: new Date(checkDate.getTime() + 10800000) });

        for (const line of lines as any[]) {
          if (line.actualQty > 0) {
            const isFood  = sampleFoodItems.some(fi => fi.equals(line.item));
            const movType = isFood ? 'CONSUMPTION' : 'ISSUE';
            const period  = monthPeriod(0);
            const key     = `${projectId}-${line.item}-${period}`;
            if (!inventoryMap[key]) {
              inventoryMap[key] = { _id: id(), project: projectId, item: line.item, period, monthlyLimit: 500, openingBalance: 200, receivedQty: 300, consumedQty: 0, issuedQty: 0, damagedQty: 0, returnedQty: 0, remainingQty: 500, status: 'available', updatedAt: now };
            }
            if (isFood) inventoryMap[key].consumedQty += line.actualQty;
            else        inventoryMap[key].issuedQty   += line.actualQty;
            stockMovements.push({ _id: id(), project: projectId, item: line.item, movementType: movType, quantity: line.actualQty, movementDate: checkDate, sourceType: 'floor_check', sourceRef: checkId, notes: 'Auto from floor check approval', createdBy: supervisorId, createdAt: new Date(checkDate.getTime() + 11000000) });
          }
        }
      }

      const currentStep = status === 'draft' ? 'supervisor' : status === 'submitted' ? 'assistant_supervisor' : status === 'under_review' ? 'project_manager' : status === 'returned' ? 'supervisor' : 'client';
      floorCheckDocs.push({ _id: checkId, dailyPlan: planId, date: checkDate, project: projectId, building: buildingId, floor: floorId, shift: 'morning', supervisor: supervisorId, status, notes: floorIdx === 0 ? 'Floor inspection completed on schedule' : undefined, approvalRecords: approvalRefs, currentApprovalStep: currentStep, createdAt: checkDate, updatedAt: checkDate });
    }
  }

  await db.collection('floorchecklines').insertMany(floorCheckLines);
  await db.collection('floorchecks').insertMany(floorCheckDocs);
  if (approvalRecords.length) await db.collection('approvalrecords').insertMany(approvalRecords);

  for (const bal of Object.values(inventoryMap)) {
    bal.remainingQty = bal.openingBalance + bal.receivedQty - bal.consumedQty - bal.issuedQty - bal.damagedQty + bal.returnedQty;
    const used = bal.consumedQty + bal.issuedQty;
    bal.status = bal.remainingQty <= 0 ? 'out_of_stock' : used > bal.monthlyLimit && bal.monthlyLimit > 0 ? 'over_consumed' : bal.monthlyLimit > 0 && bal.remainingQty / bal.monthlyLimit < 0.2 ? 'low_stock' : 'available';
  }

  const prevPeriod = monthPeriod(1);
  for (const iid of [...foodItemIds, ...matItemIds]) {
    inventoryMap[`prev-${iid}`] = { _id: id(), project: projectId, item: iid, period: prevPeriod, monthlyLimit: 400, openingBalance: 100, receivedQty: 350, consumedQty: 280, issuedQty: 0, damagedQty: 10, returnedQty: 5, remainingQty: 165, status: 'available', updatedAt: now };
  }

  // Inventory balance overrides for low/out-of-stock alerts
  const currentPeriod = monthPeriod(0);
  const yog1Key  = `${projectId}-${item_yog1}-${currentPeriod}`;
  const sc1Key   = `${projectId}-${item_sc1}-${currentPeriod}`;
  const tea1Key  = `${projectId}-${item_tea1}-${currentPeriod}`;

  if (!inventoryMap[yog1Key]) {
    inventoryMap[yog1Key] = { _id: id(), project: projectId, item: item_yog1, period: currentPeriod, monthlyLimit: 400, openingBalance: 200, receivedQty: 300, consumedQty: 0, issuedQty: 0, damagedQty: 0, returnedQty: 0, remainingQty: 400, status: 'available', updatedAt: now };
  }
  inventoryMap[yog1Key].remainingQty = 30;
  inventoryMap[yog1Key].monthlyLimit = 400;
  inventoryMap[yog1Key].status = 'low_stock';

  if (!inventoryMap[sc1Key]) {
    inventoryMap[sc1Key] = { _id: id(), project: projectId, item: item_sc1, period: currentPeriod, monthlyLimit: 200, openingBalance: 100, receivedQty: 200, consumedQty: 0, issuedQty: 0, damagedQty: 0, returnedQty: 0, remainingQty: 200, status: 'available', updatedAt: now };
  }
  inventoryMap[sc1Key].remainingQty = 0;
  inventoryMap[sc1Key].monthlyLimit = 200;
  inventoryMap[sc1Key].status = 'out_of_stock';

  if (!inventoryMap[tea1Key]) {
    inventoryMap[tea1Key] = { _id: id(), project: projectId, item: item_tea1, period: currentPeriod, monthlyLimit: 2000, openingBalance: 500, receivedQty: 1000, consumedQty: 0, issuedQty: 0, damagedQty: 0, returnedQty: 0, remainingQty: 2000, status: 'available', updatedAt: now };
  }
  inventoryMap[tea1Key].remainingQty = 180;
  inventoryMap[tea1Key].monthlyLimit = 2000;
  inventoryMap[tea1Key].status = 'low_stock';

  await db.collection('inventorybalances').insertMany(Object.values(inventoryMap));

  const receiveMovements = [...foodItemIds.slice(0, 5), ...matItemIds.slice(0, 5)].map(iid => ({
    _id: id(), project: projectId, item: iid, movementType: 'RECEIVE', quantity: 300,
    movementDate: daysAgo(10), sourceType: 'manual', notes: 'Monthly stock replenishment', createdBy: managerId, createdAt: daysAgo(10),
  }));
  await db.collection('stockmovements').insertMany([...receiveMovements, ...stockMovements]);

  // ─── 1. Suppliers ────────────────────────────────────────────────────────────
  const supplier1Id = id(), supplier2Id = id();
  await db.collection('suppliers').insertMany([
    {
      _id: supplier1Id,
      name: 'Al-Khair Food & Beverage Supplies',
      nameAr: 'الخير للأغذية والمشروبات',
      contactName: 'Majed Al-Dosari',
      phone: '+966-11-234-5678',
      email: 'orders@alkhair.sa',
      category: 'food',
      rating: 4,
      status: 'active',
      licenseNumber: 'SUP-2024-001',
      address: 'Riyadh Industrial City, Zone 3',
      createdAt: now, updatedAt: now,
    },
    {
      _id: supplier2Id,
      name: 'Al-Noor Catering Materials',
      nameAr: 'النور لمستلزمات الضيافة',
      contactName: 'Sara Al-Mutairi',
      phone: '+966-11-345-6789',
      email: 'supply@alnoor.sa',
      category: 'material',
      rating: 5,
      status: 'active',
      licenseNumber: 'SUP-2024-002',
      address: 'King Fahad Road, Riyadh',
      createdAt: now, updatedAt: now,
    },
  ]);

  // ─── 2. Purchase Orders ───────────────────────────────────────────────────────
  const po1Id = id(), po2Id = id();

  const currentMonthPeriod = monthPeriod(0);
  const [cpYear, cpMonth] = currentMonthPeriod.split('-').map(Number);
  const poStartDate = new Date(cpYear, cpMonth - 1, 1);
  const poEndDate   = new Date(cpYear, cpMonth, 0, 23, 59, 59, 999);

  // PO1 line IDs
  const po1Line1Id = id(), po1Line2Id = id(), po1Line3Id = id(), po1Line4Id = id(), po1Line5Id = id();
  // PO2 line IDs
  const po2Line1Id = id(), po2Line2Id = id(), po2Line3Id = id();

  const po1Lines = [
    { _id: po1Line1Id, item: item_bs1,    unit: 'pcs',    approvedQty: 500, receivedQty: 300, distributedQty: 180, consumedQty: 80,  remainingQty: 240, variance: 0 },
    { _id: po1Line2Id, item: item_lm1,    unit: 'box',    approvedQty: 250, receivedQty: 150, distributedQty: 90,  consumedQty: 50,  remainingQty: 110, variance: 0 },
    { _id: po1Line3Id, item: item_fr1,    unit: 'pcs',    approvedQty: 600, receivedQty: 400, distributedQty: 250, consumedQty: 130, remainingQty: 220, variance: 0 },
    { _id: po1Line4Id, item: item_jc1,    unit: 'bottle', approvedQty: 500, receivedQty: 300, distributedQty: 200, consumedQty: 80,  remainingQty: 220, variance: 0 },
    { _id: po1Line5Id, item: item_sb1,    unit: 'pcs',    approvedQty: 400, receivedQty: 200, distributedQty: 120, consumedQty: 60,  remainingQty: 220, variance: 0 },
  ];
  const po2Lines = [
    { _id: po2Line1Id, item: item_water1, unit: 'bottle', approvedQty: 2000, receivedQty: 1800, distributedQty: 1500, consumedQty: 200, remainingQty: 100, variance: 0 },
    { _id: po2Line2Id, item: item_pcup1,  unit: 'pcs',    approvedQty: 3000, receivedQty: 2800, distributedQty: 2500, consumedQty: 200, remainingQty: 100, variance: 0 },
    { _id: po2Line3Id, item: item_coffee1,unit: 'sachet', approvedQty: 1500, receivedQty: 1200, distributedQty: 800,  consumedQty: 300, remainingQty: 100, variance: 0 },
  ];

  await db.collection('purchaseorders').insertMany([
    {
      _id: po1Id,
      poNumber: 'PO-2025-05-001',
      supplier: supplier1Id,
      project: projectId,
      period: currentMonthPeriod,
      startDate: poStartDate,
      endDate: poEndDate,
      status: 'partially_received',
      lines: po1Lines,
      createdBy: managerId,
      createdAt: daysAgo(7), updatedAt: daysAgo(5),
    },
    {
      _id: po2Id,
      poNumber: 'PO-2025-05-002',
      supplier: supplier2Id,
      project: projectId,
      period: currentMonthPeriod,
      startDate: poStartDate,
      endDate: poEndDate,
      status: 'near_depletion',
      lines: po2Lines,
      createdBy: managerId,
      createdAt: daysAgo(7), updatedAt: daysAgo(2),
    },
  ]);

  // ─── 3. Receiving Records ─────────────────────────────────────────────────────
  const recv1Id = id(), recv2Id = id(), recv3Id = id();

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  await db.collection('receivingrecords').insertMany([
    {
      _id: recv1Id,
      status: 'confirmed',
      deliveryDate: daysAgo(5),
      supplier: supplier1Id,
      purchaseOrder: po1Id,
      invoiceNumber: 'INV-2025-1142',
      project: projectId,
      lines: [
        { _id: id(), item: item_bs1,  purchaseOrderLine: po1Line1Id, quantityOrdered: 300, quantityReceived: 300, condition: 'good' },
        { _id: id(), item: item_lm1,  purchaseOrderLine: po1Line2Id, quantityOrdered: 150, quantityReceived: 150, condition: 'good' },
        { _id: id(), item: item_fr1,  purchaseOrderLine: po1Line3Id, quantityOrdered: 400, quantityReceived: 400, condition: 'good' },
      ],
      receivedBy: assistantId,
      confirmedBy: supervisorId,
      confirmedAt: daysAgo(4),
      createdAt: daysAgo(5), updatedAt: daysAgo(4),
    },
    {
      _id: recv2Id,
      status: 'pending',
      deliveryDate: todayMidnight,
      supplier: supplier2Id,
      invoiceNumber: 'INV-2025-1198',
      project: projectId,
      lines: [
        { _id: id(), item: item_water1, quantityOrdered: 500, quantityReceived: 500, condition: 'good' },
        { _id: id(), item: item_pcup1,  quantityOrdered: 800, quantityReceived: 800, condition: 'good' },
      ],
      receivedBy: assistantId,
      createdAt: daysAgo(0), updatedAt: daysAgo(0),
    },
    {
      _id: recv3Id,
      status: 'partial',
      deliveryDate: daysAgo(2),
      supplier: supplier1Id,
      invoiceNumber: 'INV-2025-1175',
      project: projectId,
      lines: [
        { _id: id(), item: item_jc1,   quantityOrdered: 300, quantityReceived: 300, condition: 'good'     },
        { _id: id(), item: item_sb1,   quantityOrdered: 200, quantityReceived: 180, condition: 'good'     },
        { _id: id(), item: item_ls1,   quantityOrdered: 100, quantityReceived: 0,   condition: 'rejected' },
      ],
      receivedBy: assistantId,
      createdAt: daysAgo(2), updatedAt: daysAgo(2),
    },
  ]);

  // ─── 4. Client Requests ───────────────────────────────────────────────────────
  const cr1Id = id(), cr2Id = id(), cr3Id = id(), cr4Id = id();
  const cr5Id = id(), cr6Id = id(), cr7Id = id(), cr8Id = id();

  await db.collection('clientrequests').insertMany([
    {
      _id: cr1Id,
      title: 'Breakfast Sandwich Restock — Floor 2',
      requestType: 'operation_request',
      priority: 'high',
      project: projectId,
      floor: floor2Id,
      requestedBy: clientId,
      status: 'submitted',
      items: [
        { name: 'Classic Breakfast Sandwich', quantity: 50,  unit: 'pcs'    },
        { name: 'Orange Juice 200ml',         quantity: 30,  unit: 'bottle' },
      ],
      expectedDelivery: daysAgo(-1),
      createdAt: daysAgo(0), updatedAt: daysAgo(0),
    },
    {
      _id: cr2Id,
      title: 'Coffee Break Setup — Meeting Room 3F',
      requestType: 'coffee_break_request',
      priority: 'medium',
      project: projectId,
      floor: floor3Id,
      requestedBy: clientId,
      status: 'submitted',
      items: [
        { name: 'Arabic Coffee', quantity: 2,  unit: 'dallah' },
        { name: 'Tea',           quantity: 30, unit: 'cup'    },
        { name: 'Dates',         quantity: 50, unit: 'pcs'    },
      ],
      expectedDelivery: daysAgo(-1),
      createdAt: daysAgo(1), updatedAt: daysAgo(1),
    },
    {
      _id: cr3Id,
      title: 'Lunch Distribution — Floor 4',
      requestType: 'operation_request',
      priority: 'medium',
      project: projectId,
      floor: floor4Id,
      requestedBy: clientId,
      assignedTo: assistantId,
      status: 'assigned',
      items: [
        { name: 'Chicken Kabsa', quantity: 40, unit: 'box'  },
        { name: 'Caesar Salad',  quantity: 20, unit: 'bowl' },
      ],
      createdAt: daysAgo(3), updatedAt: daysAgo(3),
    },
    {
      _id: cr4Id,
      title: 'VIP Coffee Break — 19th Floor',
      requestType: 'coffee_break_request',
      priority: 'urgent',
      project: projectId,
      floor: floor19Id,
      requestedBy: clientId,
      assignedTo: assistantId,
      status: 'in_progress',
      items: [
        { name: 'Saudi Coffee', quantity: 5,   unit: 'dallah' },
        { name: 'Dates',        quantity: 100, unit: 'pcs'    },
        { name: 'Sweets',       quantity: 30,  unit: 'pcs'    },
      ],
      createdAt: daysAgo(4), updatedAt: daysAgo(4),
    },
    {
      _id: cr5Id,
      title: 'Afternoon Snack Service — MAKASSB',
      requestType: 'operation_request',
      priority: 'medium',
      project: projectId,
      floor: floorMakassbId,
      requestedBy: clientId,
      assignedTo: assistantId,
      status: 'delivered',
      deliveredAt: daysAgo(0),
      items: [
        { name: 'Granola Bar',      quantity: 30, unit: 'bar'    },
        { name: 'Mixed Nuts 30g',   quantity: 20, unit: 'pack'   },
        { name: 'Apple Juice 200ml',quantity: 30, unit: 'bottle' },
      ],
      createdAt: daysAgo(5), updatedAt: daysAgo(0),
    },
    {
      _id: cr6Id,
      title: 'Weekly Coffee Corner Supplies',
      requestType: 'coffee_break_request',
      priority: 'low',
      project: projectId,
      floor: floor2Id,
      requestedBy: clientId,
      status: 'confirmed',
      deliveredAt: daysAgo(6),
      confirmedAt: daysAgo(5),
      items: [
        { name: 'Coffee Sachets', quantity: 5, unit: 'box' },
        { name: 'Sugar Sachets',  quantity: 3, unit: 'box' },
      ],
      createdAt: daysAgo(7), updatedAt: daysAgo(5),
    },
    {
      _id: cr7Id,
      title: 'Emergency Catering — Security Floor',
      requestType: 'catering',
      priority: 'urgent',
      project: projectId,
      floor: floorSecurityId,
      requestedBy: supervisorId,
      status: 'submitted',
      items: [
        { name: 'Sandwiches',    quantity: 50, unit: 'pcs'    },
        { name: 'Water Bottles', quantity: 40, unit: 'bottle' },
      ],
      createdAt: daysAgo(2), updatedAt: daysAgo(2),
    },
    {
      _id: cr8Id,
      title: 'Monthly Supplies Replenishment — KAFAA',
      requestType: 'supplies',
      priority: 'medium',
      project: projectId,
      floor: floorKafaa1Id,
      requestedBy: assistantId,
      status: 'submitted',
      items: [
        { name: 'Paper Cups', quantity: 500, unit: 'pcs'  },
        { name: 'Napkins',    quantity: 200, unit: 'pack' },
      ],
      createdAt: daysAgo(3), updatedAt: daysAgo(3),
    },
  ]);

  // ─── 5. Maintenance Requests ──────────────────────────────────────────────────
  const mr1Id = id(), mr2Id = id(), mr3Id = id();

  await db.collection('maintenancerequests').insertMany([
    {
      _id: mr1Id,
      title: 'Espresso Machine Malfunction — Floor 2',
      description: 'Main espresso machine stopped working during morning service. Urgent repair needed.',
      category: 'equipment',
      priority: 'critical',
      status: 'open',
      project: projectId,
      building: buildingId,
      floor: floor2Id,
      reportedBy: supervisorId,
      createdAt: daysAgo(0), updatedAt: daysAgo(0),
    },
    {
      _id: mr2Id,
      title: 'HVAC Unit Fault — Floor 3',
      description: 'Air conditioning unit producing unusual noise and not cooling adequately. Affects food storage temperature.',
      category: 'hvac',
      priority: 'high',
      status: 'assigned',
      assignedTo: assistantId,
      project: projectId,
      building: buildingId,
      floor: floor3Id,
      reportedBy: supervisorId,
      createdAt: daysAgo(2), updatedAt: daysAgo(2),
    },
    {
      _id: mr3Id,
      title: 'Refrigerator Temperature Drift — Floor 4',
      description: 'Refrigerator temperature rising above safe range (>8°C). Potential food safety risk for dairy products.',
      category: 'equipment',
      priority: 'high',
      status: 'in_progress',
      assignedTo: assistantId,
      project: projectId,
      building: buildingId,
      floor: floor4Id,
      reportedBy: assistantId,
      createdAt: daysAgo(3), updatedAt: daysAgo(3),
    },
  ]);

  // ─── 6. Batches ───────────────────────────────────────────────────────────────
  const batch1Id = id(), batch2Id = id(), batch3Id = id(), batch4Id = id();

  await db.collection('batches').insertMany([
    {
      _id: batch1Id,
      batchNumber: 'BATCH-2025-001',
      item: item_fr1,
      supplier: supplier1Id,
      project: projectId,
      quantity: 400,
      remainingQty: 220,
      receivedDate: daysAgo(10),
      expiryDate: daysAgo(-2),
      storageZone: 'cold',
      status: 'active',
      createdBy: assistantId,
      createdAt: daysAgo(10), updatedAt: daysAgo(10),
    },
    {
      _id: batch2Id,
      batchNumber: 'BATCH-2025-002',
      item: item_milk1,
      supplier: supplier2Id,
      project: projectId,
      quantity: 500,
      remainingQty: 200,
      receivedDate: daysAgo(5),
      expiryDate: daysAgo(-5),
      storageZone: 'chilled',
      status: 'active',
      createdBy: assistantId,
      createdAt: daysAgo(5), updatedAt: daysAgo(5),
    },
    {
      _id: batch3Id,
      batchNumber: 'BATCH-2025-003',
      item: item_yog1,
      supplier: supplier2Id,
      project: projectId,
      quantity: 300,
      remainingQty: 80,
      receivedDate: daysAgo(8),
      expiryDate: daysAgo(-3),
      storageZone: 'cold',
      status: 'active',
      createdBy: assistantId,
      createdAt: daysAgo(8), updatedAt: daysAgo(8),
    },
    {
      _id: batch4Id,
      batchNumber: 'BATCH-2025-004',
      item: item_sb1,
      supplier: supplier1Id,
      project: projectId,
      quantity: 200,
      remainingQty: 80,
      receivedDate: daysAgo(1),
      expiryDate: daysAgo(-14),
      storageZone: 'ambient',
      status: 'active',
      createdBy: assistantId,
      createdAt: daysAgo(1), updatedAt: daysAgo(1),
    },
  ]);

  // ─── 7. Corrective Action (created BEFORE FC2 so we can link it) ──────────────
  const corr1Id = id();

  // FC2 id is needed for corr1's sourceRef — we pre-assign the id here
  const fc2Id = id();

  await db.collection('correctiveactions').insertMany([
    {
      _id: corr1Id,
      title: 'Temperature Breach — Chilled Storage Floor 3',
      description: 'Refrigerator unit temperature exceeded safe range (9.2°C). 15 yogurt cups spoiled. Unit requires immediate inspection and recalibration.',
      sourceType: 'fridge_check',
      sourceRef: fc2Id,
      assignedTo: assistantId,
      dueDate: daysAgo(-1),
      priority: 'high',
      status: 'open',
      project: projectId,
      createdBy: supervisorId,
      createdAt: daysAgo(0), updatedAt: daysAgo(0),
    },
  ]);

  // ─── 8. Fridge Checks ─────────────────────────────────────────────────────────
  const fc1Id = id();
  // fc2Id already declared above

  await db.collection('fridgechecks').insertMany([
    {
      _id: fc1Id,
      date: daysAgo(1),
      floor: floor2Id,
      building: buildingId,
      project: projectId,
      storageZone: 'cold',
      checkedBy: assistantId,
      temperature: 3.8,
      expectedTempMin: 1,
      expectedTempMax: 5,
      cleanlinessOk: true,
      odorOk: true,
      itemsChecked: [
        {
          _id: id(),
          batch: batch1Id,
          item: item_fr1,
          expiryDate: daysAgo(-2),
          isExpired: false,
          isNearExpiry: true,
          quantity: 220,
          condition: 'good',
          nameTagPresent: true,
        },
        {
          _id: id(),
          batch: batch3Id,
          item: item_yog1,
          expiryDate: daysAgo(-3),
          isExpired: false,
          isNearExpiry: true,
          quantity: 80,
          condition: 'good',
          nameTagPresent: true,
        },
      ],
      status: 'ok',
      notes: 'All items labeled. Two items near expiry - flagged for priority distribution.',
      createdAt: daysAgo(1), updatedAt: daysAgo(1),
    },
    {
      _id: fc2Id,
      date: todayMidnight,
      floor: floor3Id,
      building: buildingId,
      project: projectId,
      storageZone: 'chilled',
      checkedBy: assistantId,
      temperature: 9.2,
      expectedTempMin: 2,
      expectedTempMax: 8,
      cleanlinessOk: true,
      odorOk: true,
      itemsChecked: [
        {
          _id: id(),
          batch: batch2Id,
          item: item_milk1,
          expiryDate: daysAgo(-5),
          isExpired: false,
          isNearExpiry: false,
          quantity: 200,
          condition: 'good',
          nameTagPresent: true,
        },
      ],
      status: 'corrective_action_required',
      correctiveActionId: corr1Id,
      notes: 'Temperature above safe range (9.2°C vs max 8°C). Needs immediate corrective action.',
      createdAt: daysAgo(0), updatedAt: daysAgo(0),
    },
  ]);

  // ─── 9. Spoilage Records ──────────────────────────────────────────────────────
  await db.collection('spoilagerecords').insertMany([
    {
      _id: id(),
      item: item_yog1,
      batch: batch3Id,
      project: projectId,
      quantity: 15,
      reason: 'temperature_issue',
      alertType: 'temperature_breach',
      location: 'Floor 3 - Chilled Storage',
      storageZone: 'chilled',
      date: daysAgo(0),
      daysUntilExpiry: 3,
      notes: '15 yogurt cups affected by temperature drift. Removed from service.',
      status: 'active',
      detectedAt: daysAgo(0),
      createdBy: assistantId,
      createdAt: daysAgo(0), updatedAt: daysAgo(0),
    },
  ]);

  // ─── 10. Transfers ────────────────────────────────────────────────────────────
  await db.collection('transfers').insertMany([
    {
      _id: id(),
      project: projectId,
      building: buildingId,
      floor: floor3Id,
      status: 'draft',
      transferDate: daysAgo(1),
      lines: [
        { _id: id(), item: item_water1, quantity: 100 },
        { _id: id(), item: item_pcup1,  quantity: 200 },
      ],
      createdBy: assistantId,
      createdAt: daysAgo(1), updatedAt: daysAgo(1),
    },
    {
      _id: id(),
      project: projectId,
      building: buildingId,
      floor: floor4Id,
      status: 'confirmed',
      transferDate: daysAgo(3),
      lines: [
        { _id: id(), item: item_fr1, quantity: 50 },
        { _id: id(), item: item_fr2, quantity: 50 },
      ],
      createdBy: assistantId,
      confirmedBy: supervisorId,
      createdAt: daysAgo(3), updatedAt: daysAgo(3),
    },
  ]);

  // ─── 11. Audit Logs (original 12 + 15 new) ───────────────────────────────────
  await db.collection('auditlogs').insertMany([
    // Original entries
    { _id: id(), user: adminId,      action: 'login',   entityType: 'user',        entityId: adminId,             createdAt: daysAgo(7) },
    { _id: id(), user: adminId,      action: 'create',  entityType: 'project',     entityId: projectId,           createdAt: daysAgo(7) },
    { _id: id(), user: adminId,      action: 'create',  entityType: 'building',    entityId: buildingId,          createdAt: daysAgo(7) },
    { _id: id(), user: supervisorId, action: 'login',   entityType: 'user',        entityId: supervisorId,        createdAt: daysAgo(6) },
    { _id: id(), user: supervisorId, action: 'submit',  entityType: 'floor_check', entityId: (floorCheckDocs[0] as any)._id, createdAt: daysAgo(6) },
    { _id: id(), user: assistantId,  action: 'review',  entityType: 'floor_check', entityId: (floorCheckDocs[0] as any)._id, createdAt: daysAgo(5) },
    { _id: id(), user: managerId,    action: 'approve', entityType: 'floor_check', entityId: (floorCheckDocs[0] as any)._id, createdAt: daysAgo(5) },
    { _id: id(), user: managerId,    action: 'export',  entityType: 'floor_check', entityId: (floorCheckDocs[0] as any)._id, createdAt: daysAgo(4) },
    { _id: id(), user: supervisorId, action: 'login',   entityType: 'user',        entityId: supervisorId,        createdAt: daysAgo(3) },
    { _id: id(), user: adminId,      action: 'create',  entityType: 'item',        entityId: item_bs1,            createdAt: daysAgo(7) },
    { _id: id(), user: managerId,    action: 'login',   entityType: 'user',        entityId: managerId,           createdAt: daysAgo(2) },
    { _id: id(), user: clientId,     action: 'login',   entityType: 'user',        entityId: clientId,            createdAt: daysAgo(1) },
    // New entries
    { _id: id(), user: managerId,    action: 'create',  entityType: 'purchase_order',    entityId: po1Id,          details: 'Created PO-2025-05-001 for Al-Khair Food & Beverage', createdAt: daysAgo(7) },
    { _id: id(), user: managerId,    action: 'create',  entityType: 'purchase_order',    entityId: po2Id,          details: 'Created PO-2025-05-002 for Al-Noor Catering Materials', createdAt: daysAgo(7) },
    { _id: id(), user: assistantId,  action: 'create',  entityType: 'receiving_record',  entityId: recv1Id,        details: 'Received delivery for INV-2025-1142', createdAt: daysAgo(5) },
    { _id: id(), user: supervisorId, action: 'confirm', entityType: 'receiving_record',  entityId: recv1Id,        details: 'Confirmed receiving record INV-2025-1142', createdAt: daysAgo(4) },
    { _id: id(), user: assistantId,  action: 'create',  entityType: 'receiving_record',  entityId: recv3Id,        details: 'Partial delivery received for INV-2025-1175', createdAt: daysAgo(2) },
    { _id: id(), user: clientId,     action: 'create',  entityType: 'client_request',    entityId: cr1Id,          details: 'Submitted: Breakfast Sandwich Restock — Floor 2', createdAt: daysAgo(0) },
    { _id: id(), user: clientId,     action: 'create',  entityType: 'client_request',    entityId: cr2Id,          details: 'Submitted: Coffee Break Setup — Meeting Room 3F', createdAt: daysAgo(1) },
    { _id: id(), user: supervisorId, action: 'create',  entityType: 'maintenance_request', entityId: mr1Id,        details: 'Reported: Espresso Machine Malfunction — Floor 2', createdAt: daysAgo(0) },
    { _id: id(), user: supervisorId, action: 'create',  entityType: 'maintenance_request', entityId: mr2Id,        details: 'Reported: HVAC Unit Fault — Floor 3', createdAt: daysAgo(2) },
    { _id: id(), user: assistantId,  action: 'create',  entityType: 'fridge_check',      entityId: fc1Id,          details: 'Fridge check completed — Floor 2 cold storage', createdAt: daysAgo(1) },
    { _id: id(), user: assistantId,  action: 'create',  entityType: 'fridge_check',      entityId: fc2Id,          details: 'Fridge check — temperature issue found on Floor 3', createdAt: daysAgo(0) },
    { _id: id(), user: supervisorId, action: 'create',  entityType: 'corrective_action', entityId: corr1Id,        details: 'Opened corrective action for temperature breach Floor 3', createdAt: daysAgo(0) },
    { _id: id(), user: assistantId,  action: 'create',  entityType: 'spoilage_record',   entityId: projectId,      details: '15 Yogurt Cups spoiled due to temperature drift Floor 3', createdAt: daysAgo(0) },
    { _id: id(), user: supervisorId, action: 'create',  entityType: 'client_request',    entityId: cr7Id,          details: 'Submitted: Emergency Catering — Security Floor', createdAt: daysAgo(2) },
    { _id: id(), user: clientId,     action: 'create',  entityType: 'client_request',    entityId: cr4Id,          details: 'Submitted: VIP Coffee Break — 19th Floor', createdAt: daysAgo(4) },
  ]);

  console.log('✅ Auto-seed complete: 5 users, 1 project, 8 floors, 38 items, 56 floor checks, inventory balances, 2 suppliers, 2 purchase orders, 3 receiving records, 8 client requests, 3 maintenance requests, 4 batches, 2 fridge checks, 1 spoilage record, 1 corrective action, 2 transfers, 27 audit logs');
}
