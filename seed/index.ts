import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { id, hashPassword, daysAgo, monthPeriod } from './helpers';

dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not set');
  process.exit(1);
}

async function seed() {
  await mongoose.connect(MONGODB_URI!);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db!;

  // Drop all collections for idempotent re-seed
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    await db.dropCollection(col.name);
  }
  console.log('Dropped all collections');

  const DEMO_PASS = await hashPassword('Demo@12345');

  // ── IDs ──────────────────────────────────────────────────────────────────
  const adminId = id();
  const supervisorId = id();
  const assistantId = id();
  const managerId = id();
  const clientId = id();

  const projectId = id();
  const buildingId = id();

  const floor2Id = id();
  const floor3Id = id();
  const floor4Id = id();
  const floor19Id = id();
  const floorMakassbId = id();
  const floorSecurityId = id();
  const floorKafaa1Id = id();
  const floorKafaa2Id = id();
  const floorIds = [floor2Id, floor3Id, floor4Id, floor19Id, floorMakassbId, floorSecurityId, floorKafaa1Id, floorKafaa2Id];

  // Food categories
  const catBreakfastId = id();
  const catLunchSandId = id();
  const catLunchMealId = id();
  const catSaladId = id();
  const catSoupId = id();
  const catFruitId = id();
  const catSweetBakeryId = id();
  const catSaltedBakeryId = id();
  const catYogurtId = id();
  const catNutsId = id();
  const catSweetCakeId = id();
  const catGranolaId = id();
  const catJuiceId = id();

  // Material categories
  const catWaterId = id();
  const catCoffeeId = id();
  const catMilkId = id();
  const catTeaId = id();
  const catPaperCupId = id();
  const catPlateId = id();
  const catSpoonId = id();
  const catForkId = id();
  const catKnifeId = id();
  const catSauceId = id();
  const catSyrupId = id();
  const catSupportId = id();

  // Food items
  const item_bs1 = id(); // Breakfast Sandwich - Classic
  const item_bs2 = id(); // Breakfast Sandwich - Veggie
  const item_ls1 = id(); // Lunch Sandwich - Club
  const item_ls2 = id(); // Lunch Sandwich - Tuna
  const item_lm1 = id(); // Chicken Kabsa
  const item_lm2 = id(); // Beef Stew
  const item_sl1 = id(); // Caesar Salad
  const item_sl2 = id(); // Greek Salad
  const item_sp1 = id(); // Tomato Soup
  const item_sp2 = id(); // Lentil Soup
  const item_fr1 = id(); // Apple
  const item_fr2 = id(); // Orange
  const item_fr3 = id(); // Banana
  const item_sb1 = id(); // Croissant
  const item_sb2 = id(); // Muffin
  const item_salt1 = id(); // Cheese Roll
  const item_yog1 = id(); // Yogurt Cup
  const item_nut1 = id(); // Mixed Nuts
  const item_sc1 = id(); // Chocolate Cake Slice
  const item_gran1 = id(); // Granola Bar
  const item_jc1 = id(); // Orange Juice
  const item_jc2 = id(); // Apple Juice

  // Material items
  const item_water1 = id(); // Water 500ml
  const item_water2 = id(); // Water 1.5L
  const item_coffee1 = id(); // Nescafe Sachet
  const item_milk1 = id(); // Milk Box 200ml
  const item_tea1 = id(); // Tea Bag
  const item_pcup1 = id(); // Paper Cup 8oz
  const item_pcup2 = id(); // Paper Cup 12oz
  const item_plate1 = id(); // Disposable Plate
  const item_spoon1 = id(); // Plastic Spoon
  const item_fork1 = id(); // Plastic Fork
  const item_knife1 = id(); // Plastic Knife
  const item_sauce1 = id(); // Ketchup Sachet
  const item_sauce2 = id(); // Mayo Sachet
  const item_syrup1 = id(); // Sugar Sachet
  const item_sup1 = id(); // Napkin Pack
  const item_sup2 = id(); // Tray Liner

  const foodItemIds = [item_bs1, item_bs2, item_ls1, item_ls2, item_lm1, item_lm2, item_sl1, item_sl2, item_sp1, item_sp2, item_fr1, item_fr2, item_fr3, item_sb1, item_sb2, item_salt1, item_yog1, item_nut1, item_sc1, item_gran1, item_jc1, item_jc2];
  const matItemIds = [item_water1, item_water2, item_coffee1, item_milk1, item_tea1, item_pcup1, item_pcup2, item_plate1, item_spoon1, item_fork1, item_knife1, item_sauce1, item_sauce2, item_syrup1, item_sup1, item_sup2];

  const now = new Date();

  // ── INSERT ──────────────────────────────────────────────────────────────

  await db.collection('users').insertMany([
    { _id: adminId, fullName: 'Ahmed Al-Rashidi', email: 'admin@mirsad.demo', password: DEMO_PASS, role: 'admin', status: 'active', createdAt: now, updatedAt: now },
    { _id: supervisorId, fullName: 'Khalid Al-Otaibi', email: 'supervisor@mirsad.demo', password: DEMO_PASS, role: 'supervisor', project: projectId, status: 'active', createdAt: now, updatedAt: now },
    { _id: assistantId, fullName: 'Fatima Al-Zahrani', email: 'assistant@mirsad.demo', password: DEMO_PASS, role: 'assistant_supervisor', project: projectId, status: 'active', createdAt: now, updatedAt: now },
    { _id: managerId, fullName: 'Mohammed Al-Ghamdi', email: 'manager@mirsad.demo', password: DEMO_PASS, role: 'project_manager', project: projectId, status: 'active', createdAt: now, updatedAt: now },
    { _id: clientId, fullName: 'Nora Al-Shehri', email: 'client@mirsad.demo', password: DEMO_PASS, role: 'client', project: projectId, status: 'active', createdAt: now, updatedAt: now },
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
      _id: fid,
      building: buildingId,
      project: projectId,
      name: floorNames[i],
      locationCode: `FL-${floorNames[i].replace(/\s/g, '-')}`,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }))
  );

  await db.collection('itemcategories').insertMany([
    { _id: catBreakfastId, name: 'Breakfast Sandwich', type: 'food', status: 'active', createdAt: now, updatedAt: now },
    { _id: catLunchSandId, name: 'Lunch Sandwich', type: 'food', status: 'active', createdAt: now, updatedAt: now },
    { _id: catLunchMealId, name: 'Lunch Meals', type: 'food', status: 'active', createdAt: now, updatedAt: now },
    { _id: catSaladId, name: 'Salads', type: 'food', status: 'active', createdAt: now, updatedAt: now },
    { _id: catSoupId, name: 'Soups', type: 'food', status: 'active', createdAt: now, updatedAt: now },
    { _id: catFruitId, name: 'Fresh Fruits', type: 'food', status: 'active', createdAt: now, updatedAt: now },
    { _id: catSweetBakeryId, name: 'Sweet Bakery', type: 'food', status: 'active', createdAt: now, updatedAt: now },
    { _id: catSaltedBakeryId, name: 'Salted Bakery', type: 'food', status: 'active', createdAt: now, updatedAt: now },
    { _id: catYogurtId, name: 'Yogurt', type: 'food', status: 'active', createdAt: now, updatedAt: now },
    { _id: catNutsId, name: 'Nuts', type: 'food', status: 'active', createdAt: now, updatedAt: now },
    { _id: catSweetCakeId, name: 'Sweets Cakes', type: 'food', status: 'active', createdAt: now, updatedAt: now },
    { _id: catGranolaId, name: 'Granola', type: 'food', status: 'active', createdAt: now, updatedAt: now },
    { _id: catJuiceId, name: 'Fresh Juice', type: 'food', status: 'active', createdAt: now, updatedAt: now },
    { _id: catWaterId, name: 'Water', type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catCoffeeId, name: 'Coffee', type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catMilkId, name: 'Milk', type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catTeaId, name: 'Tea', type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catPaperCupId, name: 'Paper Cups', type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catPlateId, name: 'Plates', type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catSpoonId, name: 'Spoons', type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catForkId, name: 'Forks', type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catKnifeId, name: 'Knives', type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catSauceId, name: 'Sauces', type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catSyrupId, name: 'Syrups', type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catSupportId, name: 'Support Materials', type: 'material', status: 'active', createdAt: now, updatedAt: now },
  ]);

  await db.collection('items').insertMany([
    { _id: item_bs1, name: 'Classic Breakfast Sandwich', category: catBreakfastId, type: 'food', unit: 'pcs', limitQty: 500, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_bs2, name: 'Veggie Breakfast Sandwich', category: catBreakfastId, type: 'food', unit: 'pcs', limitQty: 200, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_ls1, name: 'Club Lunch Sandwich', category: catLunchSandId, type: 'food', unit: 'pcs', limitQty: 400, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_ls2, name: 'Tuna Lunch Sandwich', category: catLunchSandId, type: 'food', unit: 'pcs', limitQty: 300, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_lm1, name: 'Chicken Kabsa', category: catLunchMealId, type: 'food', unit: 'box', limitQty: 250, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_lm2, name: 'Beef Stew', category: catLunchMealId, type: 'food', unit: 'box', limitQty: 200, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sl1, name: 'Caesar Salad', category: catSaladId, type: 'food', unit: 'bowl', limitQty: 300, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sl2, name: 'Greek Salad', category: catSaladId, type: 'food', unit: 'bowl', limitQty: 200, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sp1, name: 'Tomato Soup', category: catSoupId, type: 'food', unit: 'cup', limitQty: 150, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sp2, name: 'Lentil Soup', category: catSoupId, type: 'food', unit: 'cup', limitQty: 150, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_fr1, name: 'Apple', category: catFruitId, type: 'food', unit: 'pcs', limitQty: 600, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_fr2, name: 'Orange', category: catFruitId, type: 'food', unit: 'pcs', limitQty: 500, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_fr3, name: 'Banana', category: catFruitId, type: 'food', unit: 'pcs', limitQty: 500, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sb1, name: 'Croissant', category: catSweetBakeryId, type: 'food', unit: 'pcs', limitQty: 400, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sb2, name: 'Blueberry Muffin', category: catSweetBakeryId, type: 'food', unit: 'pcs', limitQty: 300, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_salt1, name: 'Cheese Roll', category: catSaltedBakeryId, type: 'food', unit: 'pcs', limitQty: 350, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_yog1, name: 'Yogurt Cup', category: catYogurtId, type: 'food', unit: 'cup', limitQty: 400, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_nut1, name: 'Mixed Nuts 30g', category: catNutsId, type: 'food', unit: 'pack', limitQty: 300, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sc1, name: 'Chocolate Cake Slice', category: catSweetCakeId, type: 'food', unit: 'pcs', limitQty: 200, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_gran1, name: 'Granola Bar', category: catGranolaId, type: 'food', unit: 'bar', limitQty: 400, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_jc1, name: 'Orange Juice 200ml', category: catJuiceId, type: 'food', unit: 'bottle', limitQty: 500, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_jc2, name: 'Apple Juice 200ml', category: catJuiceId, type: 'food', unit: 'bottle', limitQty: 400, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_water1, name: 'Water Bottle 500ml', category: catWaterId, type: 'material', unit: 'bottle', limitQty: 2000, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_water2, name: 'Water Bottle 1.5L', category: catWaterId, type: 'material', unit: 'bottle', limitQty: 1000, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_coffee1, name: 'Nescafe Sachet', category: catCoffeeId, type: 'material', unit: 'sachet', limitQty: 1500, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_milk1, name: 'Milk Box 200ml', category: catMilkId, type: 'material', unit: 'box', limitQty: 1000, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_tea1, name: 'Tea Bag', category: catTeaId, type: 'material', unit: 'bag', limitQty: 2000, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_pcup1, name: 'Paper Cup 8oz', category: catPaperCupId, type: 'material', unit: 'pcs', limitQty: 3000, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_pcup2, name: 'Paper Cup 12oz', category: catPaperCupId, type: 'material', unit: 'pcs', limitQty: 2000, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_plate1, name: 'Disposable Plate', category: catPlateId, type: 'material', unit: 'pcs', limitQty: 2000, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_spoon1, name: 'Plastic Spoon', category: catSpoonId, type: 'material', unit: 'pcs', limitQty: 3000, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_fork1, name: 'Plastic Fork', category: catForkId, type: 'material', unit: 'pcs', limitQty: 2500, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_knife1, name: 'Plastic Knife', category: catKnifeId, type: 'material', unit: 'pcs', limitQty: 2000, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sauce1, name: 'Ketchup Sachet', category: catSauceId, type: 'material', unit: 'sachet', limitQty: 2000, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sauce2, name: 'Mayonnaise Sachet', category: catSauceId, type: 'material', unit: 'sachet', limitQty: 2000, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_syrup1, name: 'Sugar Sachet', category: catSyrupId, type: 'material', unit: 'sachet', limitQty: 5000, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sup1, name: 'Napkin Pack', category: catSupportId, type: 'material', unit: 'pack', limitQty: 500, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sup2, name: 'Tray Liner', category: catSupportId, type: 'material', unit: 'pcs', limitQty: 1000, status: 'active', createdAt: now, updatedAt: now },
  ]);

  // ── Daily Plans (7 days) ──────────────────────────────────────────────
  const planIds = Array.from({ length: 7 }, () => id());
  const planStatuses = ['closed', 'closed', 'closed', 'published', 'published', 'draft', 'draft'];

  await db.collection('dailyplans').insertMany(
    planIds.map((pid, i) => ({
      _id: pid,
      date: daysAgo(6 - i),
      project: projectId,
      building: buildingId,
      shift: 'morning',
      status: planStatuses[i],
      createdBy: adminId,
      createdAt: daysAgo(7 - i),
      updatedAt: daysAgo(7 - i),
    }))
  );

  // Daily plan lines — 4 food items × 8 floors for each plan
  const sampleFoodItems = [item_bs1, item_lm1, item_fr1, item_jc1];
  const sampleMatItems = [item_water1, item_pcup1];
  const sampleItems = [...sampleFoodItems, ...sampleMatItems];
  const planLines: any[] = [];

  for (const pid of planIds) {
    for (const fid of floorIds) {
      for (const iid of sampleItems) {
        planLines.push({
          _id: id(),
          dailyPlan: pid,
          floor: fid,
          item: iid,
          plannedQty: Math.floor(Math.random() * 20) + 10,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }
  await db.collection('dailyplanlines').insertMany(planLines);

  // ── Floor Checks (7 days × 8 floors = 56 checks, varied statuses) ──────
  const floorCheckDocs: any[] = [];
  const floorCheckLinesDocs: any[] = [];
  const approvalRecordDocs: any[] = [];
  const stockMovementDocs: any[] = [];
  const inventoryMap: Record<string, any> = {};

  const checkStatuses = ['approved', 'approved', 'approved', 'submitted', 'submitted', 'under_review', 'returned'];

  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const planId = planIds[dayIdx];
    const checkDate = daysAgo(6 - dayIdx);
    const status = checkStatuses[dayIdx] || 'draft';

    for (let floorIdx = 0; floorIdx < floorIds.length; floorIdx++) {
      const floorId = floorIds[floorIdx];
      const checkId = id();

      const checkLines: any[] = sampleItems.map(iid => {
        const planned = Math.floor(Math.random() * 20) + 10;
        const actual = planned - Math.floor(Math.random() * 5);
        const diff = actual - planned;
        let lineStatus = 'ok';
        if (diff < -3) lineStatus = 'shortage';
        else if (diff > 2) lineStatus = 'extra';

        return {
          _id: id(),
          floorCheck: checkId,
          item: iid,
          plannedQty: planned,
          actualQty: actual,
          difference: diff,
          lineStatus,
          notes: lineStatus === 'shortage' ? 'Requested more from warehouse' : undefined,
          photos: [],
          createdAt: checkDate,
          updatedAt: checkDate,
        };
      });

      floorCheckLinesDocs.push(...checkLines);

      const approvalRecs: mongoose.Types.ObjectId[] = [];

      if (['submitted', 'approved', 'under_review', 'returned'].includes(status)) {
        const submitRec = id();
        approvalRecs.push(submitRec);
        approvalRecordDocs.push({
          _id: submitRec,
          entityType: 'floor_check',
          entityId: checkId,
          step: 'supervisor',
          action: 'submit',
          actor: supervisorId,
          comment: 'Daily check completed',
          version: 1,
          createdAt: new Date(checkDate.getTime() + 3600000),
        });
      }

      if (['under_review', 'approved'].includes(status)) {
        const reviewRec = id();
        approvalRecs.push(reviewRec);
        approvalRecordDocs.push({
          _id: reviewRec,
          entityType: 'floor_check',
          entityId: checkId,
          step: 'assistant_supervisor',
          action: 'review',
          actor: assistantId,
          comment: 'Reviewed — forwarding for approval',
          version: 2,
          createdAt: new Date(checkDate.getTime() + 7200000),
        });
      }

      if (status === 'returned') {
        const returnRec = id();
        approvalRecs.push(returnRec);
        approvalRecordDocs.push({
          _id: returnRec,
          entityType: 'floor_check',
          entityId: checkId,
          step: 'assistant_supervisor',
          action: 'return',
          actor: assistantId,
          comment: 'Quantities need verification on 3rd floor',
          version: 2,
          createdAt: new Date(checkDate.getTime() + 7200000),
        });
      }

      if (status === 'approved') {
        const approveRec = id();
        approvalRecs.push(approveRec);
        approvalRecordDocs.push({
          _id: approveRec,
          entityType: 'floor_check',
          entityId: checkId,
          step: 'project_manager',
          action: 'approve',
          actor: managerId,
          comment: 'Approved',
          version: 3,
          createdAt: new Date(checkDate.getTime() + 10800000),
        });

        // Stock movements for approved checks
        for (const line of checkLines) {
          if (line.actualQty > 0) {
            const isFoodLine = sampleFoodItems.some(fi => fi.equals(line.item));
            const movType = isFoodLine ? 'CONSUMPTION' : 'ISSUE';
            const period = monthPeriod(0);
            const balKey = `${projectId}-${line.item.toString()}-${period}`;

            if (!inventoryMap[balKey]) {
              inventoryMap[balKey] = {
                _id: id(),
                project: projectId,
                item: line.item,
                period,
                monthlyLimit: 500,
                openingBalance: 200,
                receivedQty: 300,
                consumedQty: 0,
                issuedQty: 0,
                damagedQty: 0,
                returnedQty: 0,
                remainingQty: 500,
                status: 'available',
                updatedAt: now,
              };
            }

            if (movType === 'CONSUMPTION') {
              inventoryMap[balKey].consumedQty += line.actualQty;
            } else {
              inventoryMap[balKey].issuedQty += line.actualQty;
            }

            stockMovementDocs.push({
              _id: id(),
              project: projectId,
              item: line.item,
              movementType: movType,
              quantity: line.actualQty,
              movementDate: checkDate,
              sourceType: 'floor_check',
              sourceRef: checkId,
              notes: 'Auto from floor check approval',
              createdBy: supervisorId,
              createdAt: new Date(checkDate.getTime() + 11000000),
            });
          }
        }
      }

      const currentStep =
        status === 'draft' ? 'supervisor'
          : status === 'submitted' ? 'assistant_supervisor'
          : status === 'under_review' ? 'project_manager'
          : status === 'returned' ? 'supervisor'
          : status === 'approved' ? 'client'
          : 'supervisor';

      floorCheckDocs.push({
        _id: checkId,
        dailyPlan: planId,
        date: checkDate,
        project: projectId,
        building: buildingId,
        floor: floorId,
        shift: 'morning',
        supervisor: supervisorId,
        checkTime: new Date(checkDate.getTime() + 1800000),
        status,
        notes: floorIdx === 0 ? 'Floor inspection completed on schedule' : undefined,
        approvalRecords: approvalRecs,
        currentApprovalStep: currentStep,
        createdAt: checkDate,
        updatedAt: checkDate,
      });
    }
  }

  await db.collection('floorchecklines').insertMany(floorCheckLinesDocs);
  await db.collection('floorchecks').insertMany(floorCheckDocs);
  if (approvalRecordDocs.length) await db.collection('approvalrecords').insertMany(approvalRecordDocs);

  // Recalculate inventory balances
  for (const bal of Object.values(inventoryMap)) {
    bal.remainingQty = bal.openingBalance + bal.receivedQty - bal.consumedQty - bal.issuedQty - bal.damagedQty + bal.returnedQty;
    const usedQty = bal.consumedQty + bal.issuedQty;
    if (bal.remainingQty <= 0) bal.status = 'out_of_stock';
    else if (usedQty > bal.monthlyLimit && bal.monthlyLimit > 0) bal.status = 'over_consumed';
    else if (bal.monthlyLimit > 0 && bal.remainingQty / bal.monthlyLimit < 0.2) bal.status = 'low_stock';
    else bal.status = 'available';
  }

  // Add prior month balances
  const prevPeriod = monthPeriod(1);
  for (const iid of [...foodItemIds, ...matItemIds]) {
    const balKey = `${projectId}-${iid.toString()}-${prevPeriod}`;
    inventoryMap[balKey] = {
      _id: id(),
      project: projectId,
      item: iid,
      period: prevPeriod,
      monthlyLimit: 400,
      openingBalance: 100,
      receivedQty: 350,
      consumedQty: 280,
      issuedQty: 0,
      damagedQty: 10,
      returnedQty: 5,
      remainingQty: 165,
      status: 'available',
      updatedAt: now,
    };
  }

  await db.collection('inventorybalances').insertMany(Object.values(inventoryMap));

  // Add extra manual stock movements (RECEIVE)
  const receiveMovements: any[] = [...foodItemIds.slice(0, 5), ...matItemIds.slice(0, 5)].map(iid => ({
    _id: id(),
    project: projectId,
    item: iid,
    movementType: 'RECEIVE',
    quantity: 300,
    movementDate: daysAgo(10),
    sourceType: 'manual',
    notes: 'Monthly stock replenishment',
    createdBy: managerId,
    createdAt: daysAgo(10),
  }));
  if (stockMovementDocs.length || receiveMovements.length) {
    await db.collection('stockmovements').insertMany([...receiveMovements, ...stockMovementDocs]);
  }

  // Audit logs
  const auditLogs: any[] = [
    { _id: id(), user: adminId, action: 'login', entityType: 'user', entityId: adminId, createdAt: daysAgo(7) },
    { _id: id(), user: adminId, action: 'create', entityType: 'project', entityId: projectId, createdAt: daysAgo(7) },
    { _id: id(), user: adminId, action: 'create', entityType: 'building', entityId: buildingId, createdAt: daysAgo(7) },
    { _id: id(), user: supervisorId, action: 'login', entityType: 'user', entityId: supervisorId, createdAt: daysAgo(6) },
    { _id: id(), user: supervisorId, action: 'submit', entityType: 'floor_check', entityId: floorCheckDocs[0]._id, createdAt: daysAgo(6) },
    { _id: id(), user: assistantId, action: 'review', entityType: 'floor_check', entityId: floorCheckDocs[0]._id, createdAt: daysAgo(5) },
    { _id: id(), user: managerId, action: 'approve', entityType: 'floor_check', entityId: floorCheckDocs[0]._id, createdAt: daysAgo(5) },
    { _id: id(), user: managerId, action: 'export', entityType: 'floor_check', entityId: floorCheckDocs[0]._id, createdAt: daysAgo(4) },
    { _id: id(), user: supervisorId, action: 'login', entityType: 'user', entityId: supervisorId, createdAt: daysAgo(3) },
    { _id: id(), user: adminId, action: 'create', entityType: 'item', entityId: item_bs1, createdAt: daysAgo(7) },
    { _id: id(), user: managerId, action: 'login', entityType: 'user', entityId: managerId, createdAt: daysAgo(2) },
    { _id: id(), user: clientId, action: 'login', entityType: 'user', entityId: clientId, createdAt: daysAgo(1) },
  ];
  await db.collection('auditlogs').insertMany(auditLogs);

  console.log('✅ Seed complete!');
  console.log(`   Users: 5`);
  console.log(`   Projects: 1 | Buildings: 1 | Floors: 8`);
  console.log(`   Categories: 25 | Items: ${foodItemIds.length + matItemIds.length}`);
  console.log(`   Daily Plans: ${planIds.length} | Plan Lines: ${planLines.length}`);
  console.log(`   Floor Checks: ${floorCheckDocs.length} | Lines: ${floorCheckLinesDocs.length}`);
  console.log(`   Approval Records: ${approvalRecordDocs.length}`);
  console.log(`   Inventory Balances: ${Object.values(inventoryMap).length}`);
  console.log(`   Stock Movements: ${stockMovementDocs.length + receiveMovements.length}`);
  console.log(`   Audit Logs: ${auditLogs.length}`);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
