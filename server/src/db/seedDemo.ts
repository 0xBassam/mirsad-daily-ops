/**
 * Seeds the embedded in-memory MongoDB with demo data.
 * Called automatically when no real MONGODB_URI is set.
 * Data reflects Ministry of Energy cafeteria operations (real item names, real floor structure).
 */
import mongoose from 'mongoose';
import { ObjectId } from 'bson';

const DEMO_PASS = '$2a$10$K8jRxt3xqA0zan6lKXdV1uPhyMMRbbZIHO.Ec0R6P1mecyohGVwmS';

function oid(): ObjectId { return new ObjectId(); }

function daysAgo(n: number): Date {
  const d = new Date(); d.setDate(d.getDate() - n); d.setHours(8, 0, 0, 0); return d;
}
function daysAhead(n: number): Date {
  const d = new Date(); d.setDate(d.getDate() + n); return d;
}
function monthPeriod(back = 0): string {
  const d = new Date(); d.setMonth(d.getMonth() - back);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function monthStart(offset = 0): Date {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - offset); d.setHours(0,0,0,0); return d;
}

export async function seedDemo(): Promise<void> {
  const db = mongoose.connection.db!;
  const now = new Date();

  // ── IDs ──────────────────────────────────────────────────────────────────────
  const adminId      = oid(), supervisorId = oid(), assistantId = oid();
  const managerId    = oid(), clientId     = oid();
  const projectId    = oid();
  const mainBldgId   = oid(), rdBldgId     = oid(), kafaaBldgId = oid(), svcBldgId = oid();

  // Main Building floors 2F-19F
  const floorIds: ObjectId[] = Array.from({ length: 18 }, oid); // 2F..19F
  // RD Building
  const rdFloor1Id = oid(), rdFloor2Id = oid();
  // Kafaa Building
  const kafaa1Id = oid(), kafaa2Id = oid(), kafaa3Id = oid(), kafaa4Id = oid();
  // Service Areas
  const makassbId = oid(), oldId = oid(), securityId = oid();

  const allFloors = [...floorIds, rdFloor1Id, rdFloor2Id, kafaa1Id, kafaa2Id, kafaa3Id, kafaa4Id, makassbId, oldId, securityId];
  // Floor names indexed for convenience
  const mainFloorNames = ['2F','3F','4F','5F','6F','7F','8F','9F','10F','11F','12F','13F','14F','15F','16F','17F','18F','19F'];

  // Food item IDs
  const [iBrSand, iLuSand, iGluFree, iBrMeal, iLuMeal, iFruit, iSoup, iSalad,
         iSwBake, iSaltBake, iYogurt, iNuts, iCakes, iGranola, iJuice,
         iWaraqnab, iSamoli, iPizza, iZaatar, iOmAli] = Array.from({ length: 20 }, oid);

  // Material item IDs
  const [iOrigBlend, iHouseBlend, iCamelCoffee, iSiwarCoffee, iShovelCoffee, iBica, iTurkish, iCardamom, iSaffron, iSaudiCoffee,
         iFreshMilk, iVegMilk, iBlackTea, iGreenTea, iCamomileTea, iKarakTea,
         iNovaWater, iTaniaWater, iSodaWater, iSoftDrinks, iAlmarai,
         iWhiteSugar, iBrownSugar, iDietSugar, iWoodenStick, iSyrup, iHotChoc, iCondMilk, iBonyMilk,
         iDigestive, iChips, iPaperCupHot, iEspressoCup, iPaperPlate, iSingleSpoon, iSingleKnife, iSingleFork, iCutlery] =
    Array.from({ length: 38 }, oid);

  const foodItemIds = [iBrSand, iLuSand, iGluFree, iBrMeal, iLuMeal, iFruit, iSoup, iSalad,
                       iSwBake, iSaltBake, iYogurt, iNuts, iCakes, iGranola, iJuice,
                       iWaraqnab, iSamoli, iPizza, iZaatar, iOmAli];
  const matItemIds  = [iOrigBlend, iHouseBlend, iCamelCoffee, iSiwarCoffee, iShovelCoffee, iBica, iTurkish, iCardamom, iSaffron, iSaudiCoffee,
                       iFreshMilk, iVegMilk, iBlackTea, iGreenTea, iCamomileTea, iKarakTea,
                       iNovaWater, iTaniaWater, iSodaWater, iSoftDrinks, iAlmarai,
                       iWhiteSugar, iBrownSugar, iDietSugar, iWoodenStick, iSyrup, iHotChoc, iCondMilk, iBonyMilk,
                       iDigestive, iChips, iPaperCupHot, iEspressoCup, iPaperPlate, iSingleSpoon, iSingleKnife, iSingleFork, iCutlery];

  // ── Users ─────────────────────────────────────────────────────────────────────
  await db.collection('users').insertMany([
    { _id: adminId,      fullName: 'Ahmed Al-Rashidi',   email: 'admin@mirsad.demo',      password: DEMO_PASS, role: 'admin',               status: 'active', createdAt: now, updatedAt: now },
    { _id: supervisorId, fullName: 'Khalid Al-Otaibi',   email: 'supervisor@mirsad.demo', password: DEMO_PASS, role: 'supervisor',           project: projectId, status: 'active', createdAt: now, updatedAt: now },
    { _id: assistantId,  fullName: 'Fatima Al-Zahrani',  email: 'assistant@mirsad.demo',  password: DEMO_PASS, role: 'assistant_supervisor', project: projectId, status: 'active', createdAt: now, updatedAt: now },
    { _id: managerId,    fullName: 'Mohammed Al-Ghamdi', email: 'manager@mirsad.demo',    password: DEMO_PASS, role: 'project_manager',      project: projectId, status: 'active', createdAt: now, updatedAt: now },
    { _id: clientId,     fullName: 'Nora Al-Shehri',     email: 'client@mirsad.demo',     password: DEMO_PASS, role: 'client',               project: projectId, status: 'active', createdAt: now, updatedAt: now },
  ]);

  // ── Project & Buildings ───────────────────────────────────────────────────────
  await db.collection('projects').insertOne({
    _id: projectId, name: 'Ministry of Energy — Cafeteria Operations',
    clientName: 'Ministry of Energy (وزارة الطاقة)', locationCode: 'MOE-MAIN-01',
    status: 'active', createdBy: adminId, createdAt: now, updatedAt: now,
  });

  await db.collection('buildings').insertMany([
    { _id: mainBldgId,  project: projectId, name: 'Main Building',   locationCode: 'MOE-MAIN',   status: 'active', floors: 18, createdAt: now, updatedAt: now },
    { _id: rdBldgId,    project: projectId, name: 'RD Building',     locationCode: 'MOE-RD',     status: 'active', floors: 2,  createdAt: now, updatedAt: now },
    { _id: kafaaBldgId, project: projectId, name: 'Kafaa Building',  locationCode: 'MOE-KAFAA',  status: 'active', floors: 4,  createdAt: now, updatedAt: now },
    { _id: svcBldgId,   project: projectId, name: 'Service Areas',   locationCode: 'MOE-SVC',    status: 'active', floors: 3,  createdAt: now, updatedAt: now },
  ]);

  // ── Floors ────────────────────────────────────────────────────────────────────
  await db.collection('floors').insertMany([
    ...floorIds.map((fid, i) => ({
      _id: fid, building: mainBldgId, project: projectId,
      name: mainFloorNames[i], locationCode: `MAIN-${mainFloorNames[i]}`,
      status: 'active', createdAt: now, updatedAt: now,
    })),
    { _id: rdFloor1Id,  building: rdBldgId,    project: projectId, name: 'RD 1&2',   locationCode: 'RD-1-2',   status: 'active', createdAt: now, updatedAt: now },
    { _id: rdFloor2Id,  building: rdBldgId,    project: projectId, name: 'RD 3&4',   locationCode: 'RD-3-4',   status: 'active', createdAt: now, updatedAt: now },
    { _id: kafaa1Id,    building: kafaaBldgId, project: projectId, name: 'KAFAA-1',  locationCode: 'KF-1',     status: 'active', createdAt: now, updatedAt: now },
    { _id: kafaa2Id,    building: kafaaBldgId, project: projectId, name: 'KAFAA-2',  locationCode: 'KF-2',     status: 'active', createdAt: now, updatedAt: now },
    { _id: kafaa3Id,    building: kafaaBldgId, project: projectId, name: 'KAFAA-3',  locationCode: 'KF-3',     status: 'active', createdAt: now, updatedAt: now },
    { _id: kafaa4Id,    building: kafaaBldgId, project: projectId, name: 'KAFAA-4',  locationCode: 'KF-4',     status: 'active', createdAt: now, updatedAt: now },
    { _id: makassbId,   building: svcBldgId,   project: projectId, name: 'MAKASSB',  locationCode: 'SVC-MAK',  status: 'active', createdAt: now, updatedAt: now },
    { _id: oldId,       building: svcBldgId,   project: projectId, name: 'OLD',      locationCode: 'SVC-OLD',  status: 'active', createdAt: now, updatedAt: now },
    { _id: securityId,  building: svcBldgId,   project: projectId, name: 'SECURITY', locationCode: 'SVC-SEC',  status: 'active', createdAt: now, updatedAt: now },
  ]);

  // ── Item Categories ───────────────────────────────────────────────────────────
  const [catBrSand, catLuSand, catLuMeal, catBrMeal, catSalad, catSoup, catFruit,
         catSwBake, catSaltBake, catYogurt, catNuts, catCakes, catGranola, catJuice, catSideStation,
         catCoffee, catMilk, catTea, catWater, catDrinks, catSugar, catSyrup, catDisposable, catSnack] =
    Array.from({ length: 24 }, oid);

  await db.collection('itemcategories').insertMany([
    // Food
    { _id: catBrSand,   name: 'Breakfast Sandwiches', type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catLuSand,   name: 'Lunch Sandwiches',     type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catLuMeal,   name: 'Lunch Meals',          type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catBrMeal,   name: 'Breakfast Meals',      type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catSalad,    name: 'Salads',               type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catSoup,     name: 'Soups',                type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catFruit,    name: 'Fresh Fruits',         type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catSwBake,   name: "Sweet Bakery's",       type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catSaltBake, name: "Salted Bakery's",      type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catYogurt,   name: 'Yogurts',              type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catNuts,     name: 'Nuts / Dates',         type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catCakes,    name: 'Sweets & Cakes',       type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catGranola,  name: 'Granola',              type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catJuice,    name: 'Fresh Juices',         type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catSideStation, name: 'Side Station',      type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    // Materials
    { _id: catCoffee,   name: 'Coffee',               type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catMilk,     name: 'Milk',                 type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catTea,      name: 'Tea',                  type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catWater,    name: 'Water',                type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catDrinks,   name: 'Drinks & Juices',      type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catSugar,    name: 'Sugar & Condiments',   type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catSyrup,    name: 'Syrups & Mixes',       type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catDisposable, name: 'Disposables',        type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catSnack,    name: 'Snacks',               type: 'material', status: 'active', createdAt: now, updatedAt: now },
  ]);

  // ── Items ─────────────────────────────────────────────────────────────────────
  await db.collection('items').insertMany([
    // Food items — real names from Ministry of Energy FOODS 2026
    { _id: iBrSand,   name: 'Breakfast Sandwiches',      category: catBrSand,    type: 'food',     unit: 'pcs',    limitQty: 19635, status: 'active', createdAt: now, updatedAt: now },
    { _id: iLuSand,   name: 'Lunch Sandwiches',          category: catLuSand,    type: 'food',     unit: 'pcs',    limitQty: 11235, status: 'active', createdAt: now, updatedAt: now },
    { _id: iGluFree,  name: 'Gluten Free Breads',        category: catBrSand,    type: 'food',     unit: 'pcs',    limitQty: 2100,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iBrMeal,   name: 'Breakfast Meals',           category: catBrMeal,    type: 'food',     unit: 'box',    limitQty: 3213,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iLuMeal,   name: 'Lunch Meals',               category: catLuMeal,    type: 'food',     unit: 'box',    limitQty: 17157, status: 'active', createdAt: now, updatedAt: now },
    { _id: iFruit,    name: 'Fresh Fruits',              category: catFruit,     type: 'food',     unit: 'pcs',    limitQty: 10500, status: 'active', createdAt: now, updatedAt: now },
    { _id: iSoup,     name: "Soup's",                    category: catSoup,      type: 'food',     unit: 'cup',    limitQty: 5040,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iSalad,    name: 'Salads',                    category: catSalad,     type: 'food',     unit: 'bowl',   limitQty: 10080, status: 'active', createdAt: now, updatedAt: now },
    { _id: iSwBake,   name: "Sweet Bakery's",            category: catSwBake,    type: 'food',     unit: 'pcs',    limitQty: 8400,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iSaltBake, name: "Salted Bakery's",           category: catSaltBake,  type: 'food',     unit: 'pcs',    limitQty: 8400,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iYogurt,   name: 'Yogurts',                   category: catYogurt,    type: 'food',     unit: 'cup',    limitQty: 5040,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iNuts,     name: 'Nuts / Dates',              category: catNuts,      type: 'food',     unit: 'pack',   limitQty: 10500, status: 'active', createdAt: now, updatedAt: now },
    { _id: iCakes,    name: 'Sweets Cakes',              category: catCakes,     type: 'food',     unit: 'pcs',    limitQty: 3360,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iGranola,  name: 'Granola',                   category: catGranola,   type: 'food',     unit: 'bar',    limitQty: 4830,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iJuice,    name: 'Fresh Juices',              category: catJuice,     type: 'food',     unit: 'bottle', limitQty: 10500, status: 'active', createdAt: now, updatedAt: now },
    { _id: iWaraqnab, name: 'Waraqnab / Fattah',         category: catSideStation, type: 'food',   unit: 'pcs',    limitQty: 500,   status: 'active', createdAt: now, updatedAt: now },
    { _id: iSamoli,   name: 'Samoli',                    category: catSideStation, type: 'food',   unit: 'pcs',    limitQty: 1000,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iPizza,    name: 'Pizza',                     category: catSideStation, type: 'food',   unit: 'pcs',    limitQty: 500,   status: 'active', createdAt: now, updatedAt: now },
    { _id: iZaatar,   name: 'Zaatar Bread',              category: catSideStation, type: 'food',   unit: 'pcs',    limitQty: 500,   status: 'active', createdAt: now, updatedAt: now },
    { _id: iOmAli,    name: 'Om Ali',                    category: catSideStation, type: 'food',   unit: 'pcs',    limitQty: 300,   status: 'active', createdAt: now, updatedAt: now },
    // Material items — real names from Ministry of Energy MATERIALS 2026
    { _id: iOrigBlend,  name: 'Original Blend Coffee',     category: catCoffee,  type: 'material', unit: 'kg',     limitQty: 200,   status: 'active', createdAt: now, updatedAt: now },
    { _id: iHouseBlend, name: 'House Blend Coffee',        category: catCoffee,  type: 'material', unit: 'kg',     limitQty: 200,   status: 'active', createdAt: now, updatedAt: now },
    { _id: iCamelCoffee,name: 'Camel Coffee (Rwanda Cvanza)', category: catCoffee, type: 'material', unit: 'kg',   limitQty: 50,    status: 'active', createdAt: now, updatedAt: now },
    { _id: iSiwarCoffee,name: 'Siwar Coffee (Mananasi Uganda)', category: catCoffee, type: 'material', unit: 'kg', limitQty: 50,    status: 'active', createdAt: now, updatedAt: now },
    { _id: iShovelCoffee,name: 'Shovel Coffee (Hambela)',  category: catCoffee,  type: 'material', unit: 'kg',     limitQty: 30,    status: 'active', createdAt: now, updatedAt: now },
    { _id: iBica,       name: 'Bica Coffee',               category: catCoffee,  type: 'material', unit: 'kg',     limitQty: 20,    status: 'active', createdAt: now, updatedAt: now },
    { _id: iTurkish,    name: 'Turkish Coffee',            category: catCoffee,  type: 'material', unit: 'kg',     limitQty: 20,    status: 'active', createdAt: now, updatedAt: now },
    { _id: iCardamom,   name: 'Cardamom',                  category: catCoffee,  type: 'material', unit: 'kg',     limitQty: 10,    status: 'active', createdAt: now, updatedAt: now },
    { _id: iSaffron,    name: 'Saffron',                   category: catCoffee,  type: 'material', unit: 'gr',     limitQty: 250,   status: 'active', createdAt: now, updatedAt: now },
    { _id: iSaudiCoffee,name: 'Saudi Coffee (Dallah)',     category: catCoffee,  type: 'material', unit: 'kg',     limitQty: 90,    status: 'active', createdAt: now, updatedAt: now },
    { _id: iFreshMilk,  name: 'Fresh Milk (Lactose Free)', category: catMilk,   type: 'material', unit: 'L',      limitQty: 3082,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iVegMilk,    name: 'Vegetarian Milk',           category: catMilk,   type: 'material', unit: 'L',      limitQty: 500,   status: 'active', createdAt: now, updatedAt: now },
    { _id: iBlackTea,   name: 'Black Tea',                 category: catTea,    type: 'material', unit: 'carton', limitQty: 319,   status: 'active', createdAt: now, updatedAt: now },
    { _id: iGreenTea,   name: 'Green Tea',                 category: catTea,    type: 'material', unit: 'carton', limitQty: 100,   status: 'active', createdAt: now, updatedAt: now },
    { _id: iCamomileTea,name: 'Camomile Tea',              category: catTea,    type: 'material', unit: 'box',    limitQty: 100,   status: 'active', createdAt: now, updatedAt: now },
    { _id: iKarakTea,   name: 'Karak Tea',                 category: catTea,    type: 'material', unit: 'box',    limitQty: 80,    status: 'active', createdAt: now, updatedAt: now },
    { _id: iNovaWater,  name: 'Nova Water (Small)',        category: catWater,  type: 'material', unit: 'carton', limitQty: 5016,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iTaniaWater, name: 'Tania Gallons Water',       category: catWater,  type: 'material', unit: 'gallon', limitQty: 200,   status: 'active', createdAt: now, updatedAt: now },
    { _id: iSodaWater,  name: 'Soda Water',                category: catWater,  type: 'material', unit: 'carton', limitQty: 100,   status: 'active', createdAt: now, updatedAt: now },
    { _id: iSoftDrinks, name: 'Soft Drinks',               category: catDrinks, type: 'material', unit: 'carton', limitQty: 200,   status: 'active', createdAt: now, updatedAt: now },
    { _id: iAlmarai,    name: "Almarai Juice's",           category: catDrinks, type: 'material', unit: 'carton', limitQty: 300,   status: 'active', createdAt: now, updatedAt: now },
    { _id: iWhiteSugar, name: 'White Sugar',               category: catSugar,  type: 'material', unit: 'kg',     limitQty: 120,   status: 'active', createdAt: now, updatedAt: now },
    { _id: iBrownSugar, name: 'Brown Sugar',               category: catSugar,  type: 'material', unit: 'kg',     limitQty: 60,    status: 'active', createdAt: now, updatedAt: now },
    { _id: iDietSugar,  name: 'Diet Sugar',                category: catSugar,  type: 'material', unit: 'kg',     limitQty: 30,    status: 'active', createdAt: now, updatedAt: now },
    { _id: iWoodenStick,name: 'Wooden Stir Sticks',        category: catSugar,  type: 'material', unit: 'pcs',    limitQty: 5000,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iSyrup,      name: 'Multi-Flavor Syrup',        category: catSyrup,  type: 'material', unit: 'bottle', limitQty: 80,    status: 'active', createdAt: now, updatedAt: now },
    { _id: iHotChoc,    name: 'Hot Chocolate Mix',         category: catSyrup,  type: 'material', unit: 'kg',     limitQty: 20,    status: 'active', createdAt: now, updatedAt: now },
    { _id: iCondMilk,   name: 'Condensed Milk',            category: catSyrup,  type: 'material', unit: 'can',    limitQty: 100,   status: 'active', createdAt: now, updatedAt: now },
    { _id: iBonyMilk,   name: 'Bony Milk',                 category: catSyrup,  type: 'material', unit: 'can',    limitQty: 100,   status: 'active', createdAt: now, updatedAt: now },
    { _id: iDigestive,  name: 'Digestive Biscuits',        category: catSnack,  type: 'material', unit: 'pack',   limitQty: 200,   status: 'active', createdAt: now, updatedAt: now },
    { _id: iChips,      name: 'Chips',                     category: catSnack,  type: 'material', unit: 'pack',   limitQty: 300,   status: 'active', createdAt: now, updatedAt: now },
    { _id: iPaperCupHot,name: 'Paper Cups (Hot)',          category: catDisposable, type: 'material', unit: 'pcs', limitQty: 30000, status: 'active', createdAt: now, updatedAt: now },
    { _id: iEspressoCup,name: 'Espresso Cups',             category: catDisposable, type: 'material', unit: 'pcs', limitQty: 5000,  status: 'active', createdAt: now, updatedAt: now },
    { _id: iPaperPlate, name: 'Paper Plates',              category: catDisposable, type: 'material', unit: 'pcs', limitQty: 10000, status: 'active', createdAt: now, updatedAt: now },
    { _id: iSingleSpoon,name: 'Single Spoon',              category: catDisposable, type: 'material', unit: 'pcs', limitQty: 15000, status: 'active', createdAt: now, updatedAt: now },
    { _id: iSingleKnife,name: 'Single Knife',              category: catDisposable, type: 'material', unit: 'pcs', limitQty: 10000, status: 'active', createdAt: now, updatedAt: now },
    { _id: iSingleFork, name: 'Single Fork',               category: catDisposable, type: 'material', unit: 'pcs', limitQty: 10000, status: 'active', createdAt: now, updatedAt: now },
    { _id: iCutlery,    name: 'Cutlery Sets',              category: catDisposable, type: 'material', unit: 'set', limitQty: 5000,  status: 'active', createdAt: now, updatedAt: now },
  ]);

  // ── Suppliers ─────────────────────────────────────────────────────────────────
  const sup1Id = oid(), sup2Id = oid(), sup3Id = oid(), sup4Id = oid(), sup5Id = oid();
  await db.collection('suppliers').insertMany([
    { _id: sup1Id, name: 'Al-Mawrid Food Trading',       nameAr: 'شركة المورد للتجارة الغذائية',     category: 'food',     contactName: 'Faisal Al-Amri',    phone: '+966512345678', email: 'contact@almawrid.sa',  rating: 4.5, status: 'active', licenseNumber: 'SA-F-2023-001', address: 'Riyadh Industrial City', createdAt: daysAgo(90), updatedAt: now },
    { _id: sup2Id, name: 'Arabian Fresh Produce',        nameAr: 'شركة الجزيرة للمنتجات الطازجة',   category: 'food',     contactName: 'Nasser Al-Qahtani', phone: '+966523456789', email: 'info@arabianfresh.sa', rating: 4.2, status: 'active', licenseNumber: 'SA-F-2022-045', address: 'Jeddah Food Market',     createdAt: daysAgo(85), updatedAt: now },
    { _id: sup3Id, name: 'Gulf Coffee & Beverages',      nameAr: 'الخليج للقهوة والمشروبات',        category: 'material', contactName: 'Reem Al-Harbi',     phone: '+966534567890', email: 'orders@gulfcoffee.sa', rating: 4.8, status: 'active', licenseNumber: 'SA-M-2021-112', address: 'Riyadh',                 createdAt: daysAgo(80), updatedAt: now },
    { _id: sup4Id, name: 'Kingdom Hospitality Supplies', nameAr: 'مستلزمات الضيافة للمملكة',        category: 'both',     contactName: 'Mansour Al-Ghamdi', phone: '+966545678901', email: 'contact@khsupplies.sa', rating: 4.0, status: 'active', licenseNumber: 'SA-B-2023-078', address: 'Riyadh',                 createdAt: daysAgo(75), updatedAt: now },
    { _id: sup5Id, name: 'Saudi Dairy & Nutrition',      nameAr: 'الألبان والتغذية السعودية',        category: 'food',     contactName: 'Hana Al-Otaibi',    phone: '+966578901234', email: 'supply@saudinutrition.sa', rating: 3.9, status: 'active', licenseNumber: 'SA-F-2022-089', address: 'Dammam', createdAt: daysAgo(60), updatedAt: now },
  ]);

  // ── Daily Plans ────────────────────────────────────────────────────────────────
  const planIds = Array.from({ length: 7 }, oid);
  const planStatuses = ['closed', 'closed', 'closed', 'published', 'published', 'draft', 'draft'];
  const sampleFloors = [floorIds[0], floorIds[2], floorIds[4], floorIds[8], kafaa1Id, makassbId];

  await db.collection('dailyplans').insertMany(planIds.map((pid, i) => ({
    _id: pid, date: daysAgo(6 - i), project: projectId, building: mainBldgId,
    shift: 'morning', status: planStatuses[i], createdBy: adminId,
    createdAt: daysAgo(7 - i), updatedAt: daysAgo(7 - i),
  })));

  const sampleFoodForPlan = [iBrSand, iLuMeal, iFruit, iJuice];
  const sampleMatForPlan  = [iNovaWater, iPaperCupHot];
  const samplePlanItems = [...sampleFoodForPlan, ...sampleMatForPlan];

  const planLines: any[] = [];
  for (const pid of planIds) {
    for (const fid of sampleFloors) {
      for (const iid of samplePlanItems) {
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

  const checksFloors = [floorIds[0], floorIds[2], floorIds[5], floorIds[8], kafaa1Id, makassbId, securityId, rdFloor1Id];

  for (let day = 0; day < 7; day++) {
    const planId = planIds[day], checkDate = daysAgo(6 - day), status = checkStatuses[day] || 'draft';
    for (let fi = 0; fi < checksFloors.length; fi++) {
      const floorId = checksFloors[fi], checkId = oid();
      const checkLines = samplePlanItems.map(iid => {
        const planned = Math.floor(Math.random() * 20) + 10, actual = planned - Math.floor(Math.random() * 5);
        const diff = actual - planned;
        const lineStatus = diff < -3 ? 'shortage' : diff > 2 ? 'extra' : 'ok';
        return { _id: oid(), floorCheck: checkId, item: iid, plannedQty: planned, actualQty: actual, difference: diff, lineStatus, notes: lineStatus === 'shortage' ? 'Requested additional from warehouse' : undefined, photos: [], createdAt: checkDate, updatedAt: checkDate };
      });
      floorCheckLinesDocs.push(...checkLines);

      const approvalRecs: ObjectId[] = [];
      if (['submitted','approved','under_review','returned'].includes(status)) {
        const r = oid(); approvalRecs.push(r);
        approvalRecordDocs.push({ _id: r, entityType: 'floor_check', entityId: checkId, step: 'supervisor', action: 'submit', actor: supervisorId, comment: 'Daily check completed', version: 1, createdAt: new Date(checkDate.getTime() + 3600000) });
      }
      if (['under_review','approved'].includes(status)) {
        const r = oid(); approvalRecs.push(r);
        approvalRecordDocs.push({ _id: r, entityType: 'floor_check', entityId: checkId, step: 'assistant_supervisor', action: 'review', actor: assistantId, comment: 'Reviewed — forwarding for approval', version: 2, createdAt: new Date(checkDate.getTime() + 7200000) });
      }
      if (status === 'returned') {
        const r = oid(); approvalRecs.push(r);
        approvalRecordDocs.push({ _id: r, entityType: 'floor_check', entityId: checkId, step: 'assistant_supervisor', action: 'return', actor: assistantId, comment: 'Quantities need verification on 3F', version: 2, createdAt: new Date(checkDate.getTime() + 7200000) });
      }
      if (status === 'approved') {
        const r = oid(); approvalRecs.push(r);
        approvalRecordDocs.push({ _id: r, entityType: 'floor_check', entityId: checkId, step: 'project_manager', action: 'approve', actor: managerId, comment: 'Approved', version: 3, createdAt: new Date(checkDate.getTime() + 10800000) });
        for (const line of checkLines) {
          if (line.actualQty > 0) {
            const isFood = sampleFoodForPlan.some(fi => fi.equals(line.item));
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
      floorCheckDocs.push({ _id: checkId, dailyPlan: planId, date: checkDate, project: projectId, building: mainBldgId, floor: floorId, shift: 'morning', supervisor: supervisorId, checkTime: new Date(checkDate.getTime() + 1800000), status, notes: fi === 0 ? 'Floor inspection completed on schedule' : undefined, approvalRecords: approvalRecs, currentApprovalStep: currentStep, createdAt: checkDate, updatedAt: checkDate });
    }
  }

  await db.collection('floorchecklines').insertMany(floorCheckLinesDocs);
  await db.collection('floorchecks').insertMany(floorCheckDocs);
  if (approvalRecordDocs.length) await db.collection('approvalrecords').insertMany(approvalRecordDocs);

  // ── Inventory Balances ────────────────────────────────────────────────────────
  for (const bal of Object.values(inventoryMap)) {
    bal.remainingQty = bal.openingBalance + bal.receivedQty - bal.consumedQty - bal.issuedQty - bal.damagedQty + bal.returnedQty;
    const used = bal.consumedQty + bal.issuedQty;
    bal.status = bal.remainingQty <= 0 ? 'out_of_stock' : (used > bal.monthlyLimit && bal.monthlyLimit > 0) ? 'over_consumed' : (bal.monthlyLimit > 0 && bal.remainingQty / bal.monthlyLimit < 0.2) ? 'low_stock' : 'available';
  }

  // Seed inventory balances for all food + material items with realistic figures
  const foodLimits: Record<string, number> = {
    [iBrSand.toString()]: 19635, [iLuSand.toString()]: 11235, [iGluFree.toString()]: 2100,
    [iBrMeal.toString()]: 3213,  [iLuMeal.toString()]: 17157, [iFruit.toString()]: 10500,
    [iSoup.toString()]: 5040,    [iSalad.toString()]: 10080,  [iSwBake.toString()]: 8400,
    [iSaltBake.toString()]: 8400,[iYogurt.toString()]: 5040,  [iNuts.toString()]: 10500,
    [iCakes.toString()]: 3360,   [iGranola.toString()]: 4830, [iJuice.toString()]: 10500,
  };

  for (const iid of foodItemIds) {
    const lim = foodLimits[iid.toString()] || 500;
    const consumed = Math.floor(lim * 0.35); // ~35% consumed so far this month
    const remaining = lim - consumed;
    const statusVal = remaining <= 0 ? 'out_of_stock' : remaining / lim < 0.2 ? 'low_stock' : 'available';
    const key = `${projectId}-${iid.toString()}-${period}`;
    if (!inventoryMap[key]) {
      inventoryMap[key] = { _id: oid(), project: projectId, item: iid, period, monthlyLimit: lim, openingBalance: Math.floor(lim * 0.05), receivedQty: lim, consumedQty: consumed, issuedQty: 0, damagedQty: 0, returnedQty: 0, remainingQty: remaining, status: statusVal, updatedAt: now };
    }
  }

  const matLimits: Record<string, number> = {
    [iOrigBlend.toString()]: 200, [iHouseBlend.toString()]: 200, [iCamelCoffee.toString()]: 50,
    [iSiwarCoffee.toString()]: 50, [iShovelCoffee.toString()]: 30, [iBica.toString()]: 20,
    [iTurkish.toString()]: 20, [iCardamom.toString()]: 10, [iSaffron.toString()]: 250,
    [iSaudiCoffee.toString()]: 90, [iFreshMilk.toString()]: 3082, [iVegMilk.toString()]: 500,
    [iBlackTea.toString()]: 319, [iGreenTea.toString()]: 100, [iCamomileTea.toString()]: 100,
    [iKarakTea.toString()]: 80, [iNovaWater.toString()]: 5016, [iTaniaWater.toString()]: 200,
    [iSodaWater.toString()]: 100, [iSoftDrinks.toString()]: 200, [iAlmarai.toString()]: 300,
    [iWhiteSugar.toString()]: 120, [iBrownSugar.toString()]: 60, [iDietSugar.toString()]: 30,
    [iWoodenStick.toString()]: 5000, [iSyrup.toString()]: 80, [iHotChoc.toString()]: 20,
    [iCondMilk.toString()]: 100, [iBonyMilk.toString()]: 100,
    [iDigestive.toString()]: 200, [iChips.toString()]: 300,
    [iPaperCupHot.toString()]: 30000, [iEspressoCup.toString()]: 5000,
    [iPaperPlate.toString()]: 10000, [iSingleSpoon.toString()]: 15000,
    [iSingleKnife.toString()]: 10000, [iSingleFork.toString()]: 10000, [iCutlery.toString()]: 5000,
  };

  for (const iid of matItemIds) {
    const lim = matLimits[iid.toString()] || 500;
    const consumed = Math.floor(lim * 0.30);
    const remaining = lim - consumed;
    const statusVal = remaining <= 0 ? 'out_of_stock' : remaining / lim < 0.2 ? 'low_stock' : 'available';
    const key = `${projectId}-${iid.toString()}-${period}`;
    if (!inventoryMap[key]) {
      inventoryMap[key] = { _id: oid(), project: projectId, item: iid, period, monthlyLimit: lim, openingBalance: Math.floor(lim * 0.05), receivedQty: lim, consumedQty: consumed, issuedQty: 0, damagedQty: 0, returnedQty: 0, remainingQty: remaining, status: statusVal, updatedAt: now };
    }
  }

  // Force a few items to be low_stock / out_of_stock for demo realism
  for (const iid of [iSaffron, iBica, iZaatar, iCamomileTea]) {
    const key = `${projectId}-${iid.toString()}-${period}`;
    if (inventoryMap[key]) { inventoryMap[key].status = 'low_stock'; inventoryMap[key].remainingQty = Math.floor(inventoryMap[key].monthlyLimit * 0.12); }
  }
  for (const iid of [iOmAli, iChips]) {
    const key = `${projectId}-${iid.toString()}-${period}`;
    if (inventoryMap[key]) { inventoryMap[key].status = 'out_of_stock'; inventoryMap[key].remainingQty = 0; }
  }

  const prevPeriod = monthPeriod(1);
  for (const iid of [...foodItemIds.slice(0, 8), ...matItemIds.slice(0, 10)]) {
    inventoryMap[`${projectId}-${iid.toString()}-${prevPeriod}`] = { _id: oid(), project: projectId, item: iid, period: prevPeriod, monthlyLimit: 400, openingBalance: 100, receivedQty: 350, consumedQty: 280, issuedQty: 0, damagedQty: 10, returnedQty: 5, remainingQty: 165, status: 'available', updatedAt: now };
  }

  await db.collection('inventorybalances').insertMany(Object.values(inventoryMap));

  // ── Stock Movements ───────────────────────────────────────────────────────────
  const receives = [...foodItemIds.slice(0, 5), ...matItemIds.slice(0, 5)].map(iid => ({
    _id: oid(), project: projectId, item: iid, movementType: 'RECEIVE', quantity: 300,
    movementDate: daysAgo(10), sourceType: 'manual', notes: 'Monthly stock replenishment',
    createdBy: managerId, createdAt: daysAgo(10),
  }));
  await db.collection('stockmovements').insertMany([...receives, ...stockMovementDocs]);

  // ── Batches ───────────────────────────────────────────────────────────────────
  const batchDefs = [
    { item: iJuice,     supplier: sup1Id, qty: 3000, recv: 20, expiry: daysAhead(25),  zone: 'cold',        status: 'active'  },
    { item: iFruit,     supplier: sup2Id, qty: 600,  recv: 18, expiry: daysAhead(5),   zone: 'cold',        status: 'active'  },
    { item: iYogurt,    supplier: sup5Id, qty: 400,  recv: 10, expiry: daysAhead(8),   zone: 'chilled',     status: 'active'  },
    { item: iSwBake,    supplier: sup1Id, qty: 400,  recv: 8,  expiry: daysAhead(2),   zone: 'ambient',     status: 'active'  },
    { item: iBrSand,    supplier: sup1Id, qty: 500,  recv: 5,  expiry: daysAhead(1),   zone: 'ambient',     status: 'active'  },
    { item: iLuMeal,    supplier: sup2Id, qty: 250,  recv: 3,  expiry: daysAhead(-2),  zone: 'cold',        status: 'expired' },
    { item: iNovaWater, supplier: sup4Id, qty: 2000, recv: 30, expiry: daysAhead(365), zone: 'dry_storage', status: 'active'  },
    { item: iPaperCupHot,supplier: sup4Id, qty: 5000,recv: 28, expiry: daysAhead(180), zone: 'dry_storage', status: 'active'  },
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

  // ── Spoilage ──────────────────────────────────────────────────────────────────
  await db.collection('spoilages').insertMany([
    { _id: oid(), item: iLuMeal, batch: batchIds[5], project: projectId, quantity: 12, reason: 'expired', alertType: 'expired', location: '2F Cold Store', storageZone: 'cold', date: daysAgo(2), status: 'active', detectedAt: daysAgo(2), createdBy: supervisorId, createdAt: daysAgo(2), updatedAt: now },
    { _id: oid(), item: iFruit,  batch: batchIds[1], project: projectId, quantity: 8,  reason: 'temperature_issue', alertType: 'temperature_breach', location: 'SECURITY Fridge', storageZone: 'cold', date: daysAgo(3), daysUntilExpiry: 3, status: 'active', detectedAt: daysAgo(3), createdBy: supervisorId, createdAt: daysAgo(3), updatedAt: now },
    { _id: oid(), item: iYogurt, project: projectId, quantity: 5, reason: 'damaged', alertType: 'damaged', location: 'KAFAA-1 Station', storageZone: 'chilled', date: daysAgo(5), status: 'resolved', detectedAt: daysAgo(5), createdBy: supervisorId, resolvedBy: managerId, resolvedAt: daysAgo(4), createdAt: daysAgo(5), updatedAt: daysAgo(4) },
    { _id: oid(), item: iSwBake, batch: batchIds[3], project: projectId, quantity: 20, reason: 'expired',  alertType: 'near_expiry', location: '19F Pantry', storageZone: 'ambient', date: daysAgo(1), daysUntilExpiry: 2, status: 'active', detectedAt: daysAgo(1), createdBy: supervisorId, createdAt: daysAgo(1), updatedAt: now },
    { _id: oid(), item: iBrSand, batch: batchIds[4], project: projectId, quantity: 15, reason: 'quality_issue', alertType: 'spoiled', location: '3F Service', storageZone: 'ambient', date: daysAgo(4), status: 'dismissed', detectedAt: daysAgo(4), createdBy: supervisorId, createdAt: daysAgo(4), updatedAt: daysAgo(4) },
  ]);

  // ── Purchase Orders ───────────────────────────────────────────────────────────
  const currentMonth = monthPeriod(0);
  const po1Id = oid(), po2Id = oid(), po3Id = oid(), po4Id = oid(), po5Id = oid();
  const soMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const eoMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const soNov24 = new Date(2024, 10, 1);
  const eoNov24 = new Date(2024, 10, 30);

  await db.collection('purchaseorders').insertMany([
    {
      _id: po1Id,
      poNumber: `PO-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-001`,
      supplier: sup1Id, project: projectId, month: currentMonth,
      startDate: soMonth, endDate: eoMonth, status: 'partially_received',
      notes: 'Monthly food allocation — Ministry of Energy Cafeteria',
      lines: [
        { _id: oid(), item: iBrSand,   unit: 'pcs',    approvedQty: 20570, receivedQty: 12000, distributedQty: 8400,  consumedQty: 0, remainingQty: 12170, variance: 0 },
        { _id: oid(), item: iLuSand,   unit: 'pcs',    approvedQty: 11770, receivedQty: 7000,  distributedQty: 4800,  consumedQty: 0, remainingQty: 6970,  variance: 0 },
        { _id: oid(), item: iLuMeal,   unit: 'box',    approvedQty: 17974, receivedQty: 10000, distributedQty: 7200,  consumedQty: 0, remainingQty: 10774, variance: 0 },
        { _id: oid(), item: iSalad,    unit: 'bowl',   approvedQty: 10560, receivedQty: 6000,  distributedQty: 4200,  consumedQty: 0, remainingQty: 6360,  variance: 0 },
        { _id: oid(), item: iFruit,    unit: 'pcs',    approvedQty: 11000, receivedQty: 6500,  distributedQty: 4800,  consumedQty: 0, remainingQty: 6200,  variance: 0 },
        { _id: oid(), item: iSwBake,   unit: 'pcs',    approvedQty: 8800,  receivedQty: 5000,  distributedQty: 3800,  consumedQty: 0, remainingQty: 5000,  variance: 0 },
        { _id: oid(), item: iYogurt,   unit: 'cup',    approvedQty: 5280,  receivedQty: 3000,  distributedQty: 2200,  consumedQty: 0, remainingQty: 3080,  variance: 0 },
        { _id: oid(), item: iNuts,     unit: 'pack',   approvedQty: 11000, receivedQty: 6000,  distributedQty: 4500,  consumedQty: 0, remainingQty: 6500,  variance: 0 },
      ],
      createdBy: adminId, createdAt: daysAgo(25), updatedAt: now,
    },
    {
      _id: po2Id,
      poNumber: `PO-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-002`,
      supplier: sup3Id, project: projectId, month: currentMonth,
      startDate: soMonth, endDate: eoMonth, status: 'active',
      notes: 'Monthly coffee & beverages — Ministry of Energy Cafeteria',
      lines: [
        { _id: oid(), item: iOrigBlend,  unit: 'kg',     approvedQty: 200,  receivedQty: 0,    distributedQty: 0,  consumedQty: 0, remainingQty: 200,  variance: 0 },
        { _id: oid(), item: iHouseBlend, unit: 'kg',     approvedQty: 200,  receivedQty: 0,    distributedQty: 0,  consumedQty: 0, remainingQty: 200,  variance: 0 },
        { _id: oid(), item: iFreshMilk,  unit: 'L',      approvedQty: 3082, receivedQty: 0,    distributedQty: 0,  consumedQty: 0, remainingQty: 3082, variance: 0 },
        { _id: oid(), item: iBlackTea,   unit: 'carton', approvedQty: 319,  receivedQty: 0,    distributedQty: 0,  consumedQty: 0, remainingQty: 319,  variance: 0 },
        { _id: oid(), item: iSaudiCoffee,unit: 'kg',     approvedQty: 90,   receivedQty: 0,    distributedQty: 0,  consumedQty: 0, remainingQty: 90,   variance: 0 },
        { _id: oid(), item: iWhiteSugar, unit: 'kg',     approvedQty: 120,  receivedQty: 0,    distributedQty: 0,  consumedQty: 0, remainingQty: 120,  variance: 0 },
      ],
      createdBy: adminId, createdAt: daysAgo(20), updatedAt: now,
    },
    {
      _id: po3Id,
      poNumber: `PO-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-003`,
      supplier: sup4Id, project: projectId, month: currentMonth,
      startDate: soMonth, endDate: eoMonth, status: 'partially_received',
      notes: 'Monthly disposables & water — Ministry of Energy Cafeteria',
      lines: [
        { _id: oid(), item: iNovaWater,   unit: 'carton', approvedQty: 5016, receivedQty: 3000, distributedQty: 2000, consumedQty: 0, remainingQty: 3016, variance: 0 },
        { _id: oid(), item: iPaperCupHot, unit: 'pcs',    approvedQty: 30000,receivedQty: 15000,distributedQty: 10000,consumedQty: 0, remainingQty: 20000,variance: 0 },
        { _id: oid(), item: iPaperPlate,  unit: 'pcs',    approvedQty: 10000,receivedQty: 5000, distributedQty: 3500, consumedQty: 0, remainingQty: 6500, variance: 0 },
        { _id: oid(), item: iSingleSpoon, unit: 'pcs',    approvedQty: 15000,receivedQty: 8000, distributedQty: 6000, consumedQty: 0, remainingQty: 9000, variance: 0 },
      ],
      createdBy: adminId, createdAt: daysAgo(18), updatedAt: now,
    },
    {
      _id: po4Id,
      poNumber: 'PO-2024-11-001',
      supplier: sup1Id, project: projectId, month: '2024-11',
      startDate: soNov24, endDate: eoNov24, status: 'fully_received',
      notes: 'Monthly food allocation — November 2024 — Ministry of Energy Cafeteria',
      lines: [
        { _id: oid(), item: iBrSand,  unit: 'pcs',  approvedQty: 20570, receivedQty: 20570, distributedQty: 20200, consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iLuSand,  unit: 'pcs',  approvedQty: 11770, receivedQty: 11770, distributedQty: 11500, consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iGluFree, unit: 'pcs',  approvedQty: 2200,  receivedQty: 2200,  distributedQty: 2100,  consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iBrMeal,  unit: 'pcs',  approvedQty: 3366,  receivedQty: 3366,  distributedQty: 3300,  consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iLuMeal,  unit: 'box',  approvedQty: 17974, receivedQty: 17974, distributedQty: 17800, consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iSalad,   unit: 'bowl', approvedQty: 10560, receivedQty: 10560, distributedQty: 10400, consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iFruit,   unit: 'pcs',  approvedQty: 11000, receivedQty: 11000, distributedQty: 10800, consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iSwBake,  unit: 'pcs',  approvedQty: 8800,  receivedQty: 8800,  distributedQty: 8600,  consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iYogurt,  unit: 'cup',  approvedQty: 5280,  receivedQty: 5280,  distributedQty: 5200,  consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iNuts,    unit: 'pack', approvedQty: 11000, receivedQty: 11000, distributedQty: 10900, consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iGranola, unit: 'bar',  approvedQty: 5060,  receivedQty: 5060,  distributedQty: 5000,  consumedQty: 0, remainingQty: 0, variance: 0 },
      ],
      createdBy: managerId, createdAt: new Date('2024-10-28'), updatedAt: new Date('2024-11-30'),
    },
    {
      _id: po5Id,
      poNumber: 'PO-2024-11-002',
      supplier: sup3Id, project: projectId, month: '2024-11',
      startDate: soNov24, endDate: eoNov24, status: 'fully_received',
      notes: 'Monthly beverages & materials — November 2024 — Ministry of Energy Cafeteria',
      lines: [
        { _id: oid(), item: iOrigBlend,   unit: 'kg',     approvedQty: 200,  receivedQty: 200,  distributedQty: 195,  consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iHouseBlend,  unit: 'kg',     approvedQty: 300,  receivedQty: 300,  distributedQty: 295,  consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iTurkish,     unit: 'kg',     approvedQty: 20,   receivedQty: 20,   distributedQty: 20,   consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iCardamom,    unit: 'kg',     approvedQty: 10,   receivedQty: 10,   distributedQty: 10,   consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iSaffron,     unit: 'gr',     approvedQty: 250,  receivedQty: 250,  distributedQty: 248,  consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iSaudiCoffee, unit: 'kg',     approvedQty: 90,   receivedQty: 90,   distributedQty: 88,   consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iFreshMilk,   unit: 'L',      approvedQty: 3082, receivedQty: 3082, distributedQty: 3050, consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iVegMilk,     unit: 'L',      approvedQty: 251,  receivedQty: 251,  distributedQty: 250,  consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iBlackTea,    unit: 'carton', approvedQty: 319,  receivedQty: 319,  distributedQty: 315,  consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iGreenTea,    unit: 'carton', approvedQty: 50,   receivedQty: 50,   distributedQty: 50,   consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iKarakTea,    unit: 'carton', approvedQty: 230,  receivedQty: 230,  distributedQty: 228,  consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iNovaWater,   unit: 'carton', approvedQty: 5016, receivedQty: 5016, distributedQty: 5000, consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iWhiteSugar,  unit: 'kg',     approvedQty: 120,  receivedQty: 120,  distributedQty: 118,  consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iDietSugar,   unit: 'carton', approvedQty: 58,   receivedQty: 58,   distributedQty: 57,   consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iWoodenStick, unit: 'carton', approvedQty: 6,    receivedQty: 6,    distributedQty: 6,    consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iSyrup,       unit: 'pcs',    approvedQty: 40,   receivedQty: 40,   distributedQty: 38,   consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iHotChoc,     unit: 'kg',     approvedQty: 198,  receivedQty: 198,  distributedQty: 195,  consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iCondMilk,    unit: 'pcs',    approvedQty: 418,  receivedQty: 418,  distributedQty: 415,  consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iBonyMilk,    unit: 'pcs',    approvedQty: 472,  receivedQty: 472,  distributedQty: 470,  consumedQty: 0, remainingQty: 0, variance: 0 },
        { _id: oid(), item: iChips,       unit: 'pack',   approvedQty: 4510, receivedQty: 4510, distributedQty: 4500, consumedQty: 0, remainingQty: 0, variance: 0 },
      ],
      createdBy: managerId, createdAt: new Date('2024-10-28'), updatedAt: new Date('2024-11-30'),
    },
  ]);

  // ── Receiving Records ─────────────────────────────────────────────────────────
  const rec1Id = oid(), rec2Id = oid(), rec3Id = oid();
  const todayDate = new Date(); todayDate.setHours(7, 30, 0, 0);
  const yesterdayDate = daysAgo(1); yesterdayDate.setHours(8, 0, 0, 0);

  await db.collection('receivings').insertMany([
    {
      _id: rec1Id, project: projectId, supplier: sup1Id, purchaseOrder: po1Id,
      deliveryDate: daysAgo(10),
      lines: [
        { _id: oid(), item: iBrSand, quantityOrdered: 12000, quantityReceived: 12000, condition: 'good', batchNumber: 'BAT-REC-001' },
        { _id: oid(), item: iLuSand, quantityOrdered: 7000,  quantityReceived: 6950,  condition: 'good', batchNumber: 'BAT-REC-002', notes: '50 units short-delivered' },
        { _id: oid(), item: iLuMeal, quantityOrdered: 10000, quantityReceived: 10000, condition: 'good', batchNumber: 'BAT-REC-003' },
        { _id: oid(), item: iFruit,  quantityOrdered: 6500,  quantityReceived: 6300,  condition: 'good', batchNumber: 'BAT-REC-004', notes: '200 units rejected — damaged packaging' },
      ],
      status: 'confirmed', invoiceNumber: 'INV-2026-4512',
      notes: 'May food delivery from Al-Mawrid — all items checked and stored.',
      receivedBy: assistantId, confirmedBy: managerId, confirmedAt: daysAgo(10),
      createdAt: daysAgo(10), updatedAt: daysAgo(10),
    },
    {
      _id: rec2Id, project: projectId, supplier: sup4Id, purchaseOrder: po3Id,
      deliveryDate: yesterdayDate,
      lines: [
        { _id: oid(), item: iNovaWater,    quantityOrdered: 3000, quantityReceived: 3000, condition: 'good' },
        { _id: oid(), item: iPaperCupHot,  quantityOrdered: 15000,quantityReceived: 15000,condition: 'good' },
        { _id: oid(), item: iPaperPlate,   quantityOrdered: 5000, quantityReceived: 5000, condition: 'good' },
        { _id: oid(), item: iSingleSpoon,  quantityOrdered: 8000, quantityReceived: 8000, condition: 'good' },
      ],
      status: 'confirmed', invoiceNumber: 'INV-2026-5201',
      notes: 'Disposables & water delivery — Kingdom Hospitality Supplies.',
      receivedBy: assistantId, confirmedBy: managerId, confirmedAt: yesterdayDate,
      createdAt: yesterdayDate, updatedAt: yesterdayDate,
    },
    {
      _id: rec3Id, project: projectId, supplier: sup5Id,
      deliveryDate: todayDate,
      lines: [
        { _id: oid(), item: iFreshMilk, quantityOrdered: 1500, quantityReceived: 1500, condition: 'good', expiryDate: daysAhead(14) },
        { _id: oid(), item: iYogurt,    quantityOrdered: 2000, quantityReceived: 2000, condition: 'good', expiryDate: daysAhead(10) },
      ],
      status: 'pending', invoiceNumber: 'INV-2026-5388',
      notes: 'Morning dairy delivery — pending inspection.',
      receivedBy: assistantId,
      createdAt: todayDate, updatedAt: todayDate,
    },
  ]);

  // ── Transfers ─────────────────────────────────────────────────────────────────
  await db.collection('transfers').insertMany([
    {
      _id: oid(), project: projectId, building: mainBldgId, floor: floorIds[0],
      status: 'confirmed', transferDate: daysAgo(5),
      lines: [
        { _id: oid(), item: iBrSand,    quantity: 400, notes: '' },
        { _id: oid(), item: iFruit,     quantity: 150, notes: '' },
        { _id: oid(), item: iSwBake,    quantity: 200, notes: '' },
      ],
      notes: 'Daily stock transfer to 2F',
      createdBy: supervisorId, confirmedBy: managerId, confirmedAt: daysAgo(5),
      createdAt: daysAgo(5), updatedAt: daysAgo(5),
    },
    {
      _id: oid(), project: projectId, building: kafaaBldgId, floor: kafaa1Id,
      status: 'confirmed', transferDate: daysAgo(3),
      lines: [
        { _id: oid(), item: iNovaWater,   quantity: 100, notes: '' },
        { _id: oid(), item: iPaperCupHot, quantity: 500, notes: '' },
        { _id: oid(), item: iOrigBlend,   quantity: 5,   notes: '' },
      ],
      notes: 'KAFAA-1 weekly restocking — coffee & water',
      createdBy: supervisorId, confirmedBy: managerId, confirmedAt: daysAgo(3),
      createdAt: daysAgo(3), updatedAt: daysAgo(3),
    },
    {
      _id: oid(), project: projectId, building: mainBldgId, floor: floorIds[17],
      status: 'draft', transferDate: now,
      lines: [
        { _id: oid(), item: iBrSand, quantity: 300, notes: '' },
        { _id: oid(), item: iJuice,  quantity: 200, notes: '' },
      ],
      notes: 'Pending dispatch to 19F — awaiting approval',
      createdBy: supervisorId, createdAt: daysAgo(1), updatedAt: daysAgo(1),
    },
  ]);

  // ── Maintenance Requests ──────────────────────────────────────────────────────
  await db.collection('maintenancerequests').insertMany([
    {
      _id: oid(), title: 'AC malfunction — 2F server room',
      description: 'Air conditioning unit in 2F server room stopped cooling. Temperature rising above safe threshold.',
      project: projectId, building: mainBldgId, floor: floorIds[0],
      category: 'hvac', priority: 'critical', status: 'in_progress',
      reportedBy: supervisorId, assignedTo: assistantId,
      assignedAt: daysAgo(3), createdAt: daysAgo(4), updatedAt: daysAgo(3),
    },
    {
      _id: oid(), title: 'Broken socket outlet — 19F pantry',
      description: 'Three socket outlets near the pantry counter are not functioning. Electrical inspection required.',
      project: projectId, building: mainBldgId, floor: floorIds[17],
      category: 'electrical', priority: 'high', status: 'assigned',
      reportedBy: supervisorId, assignedTo: assistantId,
      assignedAt: daysAgo(1), createdAt: daysAgo(2), updatedAt: daysAgo(1),
    },
    {
      _id: oid(), title: 'Water leak — MAKASSB bathroom',
      description: 'Slow water leak detected under bathroom sink. Needs attention before it worsens.',
      project: projectId, building: svcBldgId, floor: makassbId,
      category: 'plumbing', priority: 'medium', status: 'open',
      reportedBy: supervisorId, createdAt: daysAgo(1), updatedAt: daysAgo(1),
    },
    {
      _id: oid(), title: 'Deep cleaning — 3F kitchen exhaust',
      description: 'Monthly deep clean of 3F kitchen area. Grease build-up on exhaust hoods.',
      project: projectId, building: mainBldgId, floor: floorIds[1],
      category: 'cleaning', priority: 'medium', status: 'closed',
      reportedBy: supervisorId, assignedTo: assistantId,
      resolvedAt: daysAgo(8), resolution: 'Deep cleaning completed. All surfaces sanitized.',
      createdAt: daysAgo(16), updatedAt: daysAgo(8),
    },
  ]);

  // ── Operation Requests ───────────────────────────────────────────────────────
  const opReqFloors = [floorIds[3], floorIds[10], kafaa1Id, floorIds[6], floorIds[13], securityId];
  const opReqStatuses = ['submitted', 'assigned', 'in_progress', 'delivered', 'confirmed', 'submitted'];
  const opReqTitles = [
    'Extra Breakfast Sandwiches — 5F',
    'Fresh Fruits for Meeting — 12F',
    'Additional Yogurts — KAFAA-1',
    'Extra Salads — 8F',
    'Additional Lunch Meals — 15F',
    'Breakfast Meals — SECURITY',
  ];
  const opReqItems = [
    [{ name: 'Breakfast Sandwiches', quantity: 80, unit: 'pcs' }],
    [{ name: 'Fresh Fruits', quantity: 50, unit: 'pcs' }, { name: 'Fresh Juices', quantity: 30, unit: 'bottles' }],
    [{ name: 'Yogurts', quantity: 40, unit: 'cups' }],
    [{ name: 'Salads', quantity: 60, unit: 'bowls' }],
    [{ name: 'Lunch Meals', quantity: 100, unit: 'boxes' }],
    [{ name: 'Breakfast Meals', quantity: 30, unit: 'boxes' }, { name: 'Breakfast Sandwiches', quantity: 20, unit: 'pcs' }],
  ];

  await db.collection('clientrequests').insertMany(
    opReqTitles.map((title, i) => ({
      _id: oid(), title,
      description: `${title} — requested from operations team`,
      requestType: 'operation_request', priority: i === 1 ? 'high' : i === 4 ? 'high' : 'medium',
      project: projectId, building: i < 4 ? mainBldgId : i === 4 ? mainBldgId : svcBldgId,
      floor: opReqFloors[i],
      requestedBy: clientId,
      assignedTo: opReqStatuses[i] !== 'submitted' ? supervisorId : undefined,
      status: opReqStatuses[i],
      items: opReqItems[i],
      expectedDelivery: daysAhead(1 - i > 0 ? 1 : 0),
      deliveredAt: ['delivered','confirmed'].includes(opReqStatuses[i]) ? daysAgo(1) : undefined,
      confirmedAt: opReqStatuses[i] === 'confirmed' ? daysAgo(0) : undefined,
      notes: i === 1 ? 'VIP meeting at 14:00 — urgent' : undefined,
      createdAt: daysAgo(i + 1), updatedAt: daysAgo(Math.max(0, i - 1)),
    }))
  );

  // ── Coffee Break Requests ─────────────────────────────────────────────────────
  const cbReqFloors = [floorIds[4], floorIds[12], floorIds[17], floorIds[8], rdFloor1Id, kafaa2Id];
  const cbReqStatuses = ['submitted', 'in_progress', 'delivered', 'assigned', 'confirmed', 'submitted'];
  const cbReqTitles = [
    'Executive Meeting Coffee Break — 6F (12 pax)',
    'Department Meeting Coffee — 14F (8 pax)',
    'VIP Meeting Coffee Service — 19F (20 pax)',
    'Weekly Team Meeting Coffee — 10F (15 pax)',
    'Guest Coffee Service — RD 1&2 (10 pax)',
    'Department Event Coffee Break — KAFAA-2 (25 pax)',
  ];
  const cbPax = [12, 8, 20, 15, 10, 25];

  await db.collection('clientrequests').insertMany(
    cbReqTitles.map((title, i) => ({
      _id: oid(), title,
      description: `Coffee break service for ${cbPax[i]} attendees`,
      requestType: 'coffee_break_request', priority: i === 2 ? 'high' : i === 0 ? 'high' : 'medium',
      project: projectId, building: i < 4 ? mainBldgId : i === 4 ? rdBldgId : kafaaBldgId,
      floor: cbReqFloors[i],
      requestedBy: clientId,
      assignedTo: cbReqStatuses[i] !== 'submitted' ? supervisorId : undefined,
      status: cbReqStatuses[i],
      items: [
        { name: 'Original Blend Coffee', quantity: Math.ceil(cbPax[i] * 0.4), unit: 'cups' },
        { name: 'Saudi Coffee (Dallah)',  quantity: Math.ceil(cbPax[i] * 0.3), unit: 'cups' },
        { name: 'Nova Water',             quantity: cbPax[i], unit: 'bottles' },
        { name: "Sweet Bakery's",         quantity: Math.ceil(cbPax[i] * 1.5), unit: 'pcs' },
        { name: 'Dates',                  quantity: Math.ceil(cbPax[i] * 0.5), unit: 'plates' },
      ],
      expectedDelivery: daysAhead(1 - i > 0 ? 1 : 0),
      deliveredAt: ['delivered','confirmed'].includes(cbReqStatuses[i]) ? daysAgo(1) : undefined,
      confirmedAt: cbReqStatuses[i] === 'confirmed' ? daysAgo(0) : undefined,
      notes: i === 2 ? 'VIP — use premium service setup' : i === 0 ? 'Board room setup required' : undefined,
      createdAt: daysAgo(i + 1), updatedAt: daysAgo(Math.max(0, i - 1)),
    }))
  );

  // ── Reports ───────────────────────────────────────────────────────────────────
  const mStart = monthStart(0);
  const mEnd2  = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  await db.collection('reports').insertMany([
    { _id: oid(), reportType: 'daily_floor_check',     title: 'Daily Floor Check Report — 2F',                   project: projectId, building: mainBldgId, floor: floorIds[0], dateFrom: daysAgo(1), dateTo: daysAgo(1), generatedBy: managerId,  status: 'generated', createdAt: daysAgo(1) },
    { _id: oid(), reportType: 'daily_project_summary', title: 'Daily Summary — Ministry of Energy Cafeteria',     project: projectId, building: mainBldgId,                  dateFrom: daysAgo(1), dateTo: daysAgo(1), generatedBy: managerId,  status: 'generated', createdAt: daysAgo(1) },
    { _id: oid(), reportType: 'weekly_warehouse',      title: 'Weekly Warehouse & Inventory Report',               project: projectId,                                         dateFrom: daysAgo(7), dateTo: daysAgo(1), generatedBy: managerId,  status: 'generated', createdAt: daysAgo(2) },
    { _id: oid(), reportType: 'monthly_food_inventory',title: `Monthly Food Inventory — May 2026`,                project: projectId, dateFrom: mStart, dateTo: mEnd2,           generatedBy: adminId, status: 'generated', createdAt: daysAgo(3) },
    { _id: oid(), reportType: 'monthly_materials',     title: `Monthly Materials Inventory — May 2026`,           project: projectId, dateFrom: mStart, dateTo: mEnd2,           generatedBy: adminId, status: 'generated', createdAt: daysAgo(3) },
    { _id: oid(), reportType: 'purchase_order',        title: 'Purchase Order Summary — May 2026',                 project: projectId, dateFrom: mStart, dateTo: mEnd2,           generatedBy: adminId, status: 'generated', createdAt: daysAgo(4) },
    { _id: oid(), reportType: 'approval_summary',      title: 'Approval Summary Report — May 2026',                project: projectId, dateFrom: daysAgo(30), dateTo: now,        generatedBy: adminId, status: 'generated', createdAt: daysAgo(4) },
  ]);

  // ── Corrective Actions ────────────────────────────────────────────────────────
  const ca1Id = oid(), ca2Id = oid(), ca3Id = oid();
  await db.collection('correctiveactions').insertMany([
    {
      _id: ca1Id,
      title: 'Temperature breach in cold storage — 2F',
      description: 'Cold storage temperature reached 9°C. All perishables at risk. Root cause: compressor fault.',
      sourceType: 'fridge_check', project: projectId,
      assignedTo: assistantId, dueDate: daysAhead(2),
      priority: 'critical', status: 'in_progress',
      createdBy: supervisorId, createdAt: daysAgo(3), updatedAt: daysAgo(1),
    },
    {
      _id: ca2Id,
      title: 'Expired items in fridge — 3F',
      description: 'Two batches past expiry date found in 3F cold zone. Items discarded. FIFO review required.',
      sourceType: 'fridge_check', project: projectId,
      assignedTo: assistantId, dueDate: daysAhead(5),
      priority: 'high', status: 'open',
      createdBy: supervisorId, createdAt: daysAgo(2), updatedAt: daysAgo(2),
    },
    {
      _id: ca3Id,
      title: 'Missing name tags on fridge items — KAFAA-1',
      description: 'Multiple items in KAFAA-1 station missing date labels. Traceability compromised. Staff retraining required.',
      sourceType: 'fridge_check', project: projectId,
      assignedTo: supervisorId, dueDate: daysAhead(3),
      priority: 'medium', status: 'open',
      createdBy: assistantId, createdAt: daysAgo(1), updatedAt: daysAgo(1),
    },
    {
      _id: oid(),
      title: 'FIFO order not followed — juice stock',
      description: 'Newer juice batches consumed before older ones. Risk of expiry for older stock.',
      sourceType: 'inventory', project: projectId,
      assignedTo: assistantId, dueDate: daysAgo(3),
      priority: 'medium', status: 'closed',
      resolution: 'Staff retrained on FIFO protocol. Storage areas relabelled.',
      resolvedAt: daysAgo(5),
      createdBy: managerId, createdAt: daysAgo(10), updatedAt: daysAgo(5),
    },
  ]);

  // ── Fridge Checks ─────────────────────────────────────────────────────────────
  await db.collection('fridgechecks').insertMany([
    {
      _id: oid(), date: daysAgo(0), floor: floorIds[0], building: mainBldgId, project: projectId,
      storageZone: 'cold', checkedBy: supervisorId,
      temperature: 3.2, expectedTempMin: 1, expectedTempMax: 5, cleanlinessOk: true,
      itemsChecked: [
        { batch: batchIds[0], item: iJuice,    expiryDate: daysAhead(25), isExpired: false, isNearExpiry: false, quantity: 2250, condition: 'good', nameTagPresent: true },
        { batch: batchIds[1], item: iFruit,    expiryDate: daysAhead(5),  isExpired: false, isNearExpiry: false, quantity: 450,  condition: 'good', nameTagPresent: true },
      ],
      status: 'ok', createdAt: daysAgo(0), updatedAt: daysAgo(0),
    },
    {
      _id: oid(), date: daysAgo(1), floor: floorIds[1], building: mainBldgId, project: projectId,
      storageZone: 'cold', checkedBy: supervisorId,
      temperature: 9.1, expectedTempMin: 1, expectedTempMax: 5, cleanlinessOk: true,
      itemsChecked: [
        { batch: batchIds[5], item: iLuMeal,   expiryDate: daysAhead(-2), isExpired: true,  isNearExpiry: false, quantity: 188, condition: 'expired', nameTagPresent: true },
        { batch: batchIds[2], item: iYogurt,   expiryDate: daysAhead(8),  isExpired: false, isNearExpiry: false, quantity: 300, condition: 'good',    nameTagPresent: false },
      ],
      status: 'corrective_action_required', correctiveActionId: ca1Id,
      createdAt: daysAgo(1), updatedAt: daysAgo(1),
    },
    {
      _id: oid(), date: daysAgo(2), floor: kafaa1Id, building: kafaaBldgId, project: projectId,
      storageZone: 'dry_storage', checkedBy: assistantId,
      temperature: 20.1, expectedTempMin: 15, expectedTempMax: 25, cleanlinessOk: false,
      cleanlinessNotes: 'Shelves dusty, bread crumbs accumulation.',
      itemsChecked: [
        { batch: batchIds[6], item: iNovaWater,    expiryDate: daysAhead(365), isExpired: false, isNearExpiry: false, quantity: 1500, condition: 'good', nameTagPresent: true },
        { batch: batchIds[4], item: iBrSand,       expiryDate: daysAhead(1),   isExpired: false, isNearExpiry: true,  quantity: 375,  condition: 'near_expiry', nameTagPresent: false },
      ],
      status: 'corrective_action_required', correctiveActionId: ca3Id,
      createdAt: daysAgo(2), updatedAt: daysAgo(2),
    },
    {
      _id: oid(), date: daysAgo(3), floor: makassbId, building: svcBldgId, project: projectId,
      storageZone: 'cold', checkedBy: supervisorId,
      temperature: 2.5, expectedTempMin: 1, expectedTempMax: 5, cleanlinessOk: true,
      itemsChecked: [
        { batch: batchIds[0], item: iJuice, expiryDate: daysAhead(25), isExpired: false, isNearExpiry: false, quantity: 2250, condition: 'good', nameTagPresent: true },
      ],
      status: 'ok', createdAt: daysAgo(3), updatedAt: daysAgo(3),
    },
  ]);

  // ── Audit Logs ────────────────────────────────────────────────────────────────
  await db.collection('auditlogs').insertMany([
    { _id: oid(), user: adminId,      action: 'login',  entityType: 'user',              entityId: adminId,      createdAt: daysAgo(7) },
    { _id: oid(), user: adminId,      action: 'create', entityType: 'project',           entityId: projectId,    createdAt: daysAgo(7) },
    { _id: oid(), user: supervisorId, action: 'login',  entityType: 'user',              entityId: supervisorId, createdAt: daysAgo(6) },
    { _id: oid(), user: supervisorId, action: 'submit', entityType: 'floor_check',       entityId: floorCheckDocs[0]?._id, createdAt: daysAgo(6) },
    { _id: oid(), user: assistantId,  action: 'review', entityType: 'floor_check',       entityId: floorCheckDocs[0]?._id, createdAt: daysAgo(5) },
    { _id: oid(), user: managerId,    action: 'approve',entityType: 'floor_check',       entityId: floorCheckDocs[0]?._id, createdAt: daysAgo(5) },
    { _id: oid(), user: managerId,    action: 'create', entityType: 'purchase_order',    entityId: po1Id,        createdAt: daysAgo(25) },
    { _id: oid(), user: managerId,    action: 'create', entityType: 'purchase_order',    entityId: po2Id,        createdAt: daysAgo(20) },
    { _id: oid(), user: managerId,    action: 'create', entityType: 'purchase_order',    entityId: po3Id,        createdAt: daysAgo(18) },
    { _id: oid(), user: assistantId,  action: 'create', entityType: 'receiving',         entityId: rec1Id,       createdAt: daysAgo(10) },
    { _id: oid(), user: managerId,    action: 'confirm',entityType: 'receiving',         entityId: rec1Id,       createdAt: daysAgo(10) },
    { _id: oid(), user: assistantId,  action: 'create', entityType: 'receiving',         entityId: rec2Id,       createdAt: daysAgo(1) },
    { _id: oid(), user: managerId,    action: 'confirm',entityType: 'receiving',         entityId: rec2Id,       createdAt: daysAgo(1) },
    { _id: oid(), user: assistantId,  action: 'create', entityType: 'receiving',         entityId: rec3Id,       createdAt: now },
    { _id: oid(), user: clientId,     action: 'create', entityType: 'client_request',    createdAt: daysAgo(1) },
    { _id: oid(), user: clientId,     action: 'create', entityType: 'client_request',    createdAt: daysAgo(2) },
    { _id: oid(), user: supervisorId, action: 'create', entityType: 'spoilage',          createdAt: daysAgo(2) },
    { _id: oid(), user: supervisorId, action: 'create', entityType: 'fridge_check',      createdAt: daysAgo(1) },
    { _id: oid(), user: managerId,    action: 'create', entityType: 'corrective_action', entityId: ca1Id, createdAt: daysAgo(3) },
    { _id: oid(), user: managerId,    action: 'login',  entityType: 'user',              entityId: managerId, createdAt: daysAgo(2) },
    { _id: oid(), user: clientId,     action: 'login',  entityType: 'user',              entityId: clientId,  createdAt: daysAgo(1) },
    { _id: oid(), user: assistantId,  action: 'login',  entityType: 'user',              entityId: assistantId, createdAt: daysAgo(1) },
    { _id: oid(), user: supervisorId, action: 'update', entityType: 'client_request',    createdAt: now },
  ]);

  console.log('Demo seeded: Ministry of Energy | 5 users · 27 floors · 20 food items · 38 material items · 5 suppliers · 6 operation requests · 6 coffee break requests · 5 POs (incl. Nov 2024 historical) · 3 receivings · 4 maintenance · 4 fridge checks · 4 corrective actions · 7 reports');
}
