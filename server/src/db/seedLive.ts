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

  const DEMO_PASS = await hashPassword('demo1234');

  // ─── IDs ──────────────────────────────────────────────────────────────────────
  const adminId = id(), supervisorId = id(), assistantId = id(), managerId = id(), clientId = id();
  const projectId = id(), buildingId = id();

  const floor2Id = id(), floor3Id = id(), floor4Id = id(), floor19Id = id();
  const floorMakassbId = id(), floorSecurityId = id(), floorKafaa1Id = id(), floorKafaa2Id = id();
  const floorIds = [floor2Id, floor3Id, floor4Id, floor19Id, floorMakassbId, floorSecurityId, floorKafaa1Id, floorKafaa2Id];

  // ─── Category IDs ─────────────────────────────────────────────────────────────
  const catSandwichId  = id(); // ساندويتشات
  const catMealsId     = id(); // وجبات
  const catSaladId     = id(); // سلطات وخضار
  const catFruitId     = id(); // فواكه
  const catBakeryId    = id(); // مخبوزات ومعجنات
  const catSnacksId    = id(); // وجبات خفيفة
  const catCoffeeId    = id(); // قهوة
  const catTeaId       = id(); // شاي ومشروبات ساخنة
  const catMilkId      = id(); // حليب وإضافات
  const catWaterId     = id(); // مياه ومشروبات باردة
  const catJuiceId     = id(); // عصائر
  const catCupsId      = id(); // أكواب وأطباق
  const catEquipmentId = id(); // معدات
  const catMeetingId   = id(); // خدمات الاجتماعات
  const catHRId        = id(); // موارد بشرية

  // ─── Item IDs ─────────────────────────────────────────────────────────────────
  // Food items
  const item_sw1  = id(); // ساندويتش فطور
  const item_sw2  = id(); // ساندويتش
  const item_sw3  = id(); // ساندويتش خالي من الغلوتين
  const item_ml1  = id(); // وجبة إفطار خفيفة
  const item_ml2  = id(); // وجبة غداء خفيفة
  const item_ml3  = id(); // وجبة رئيسية
  const item_sl1  = id(); // سلطه
  const item_sl2  = id(); // خضار منوعة
  const item_fr1  = id(); // فواكه متنوعة
  const item_bk1  = id(); // معجنات صغيرة
  const item_bk2  = id(); // مخبوزات صغيرة
  const item_sn1  = id(); // زبادي (يوناني)
  const item_sn2  = id(); // مكسرات منوعة
  const item_sn3  = id(); // الواح شوفان
  const item_sn4  = id(); // بسكويت
  const item_sn5  = id(); // جرانولا
  const item_sn6  = id(); // حلويات قليلة السعرات
  const item_sn7  = id(); // رقائق بطاطس صحية
  // Coffee / material
  const item_cf1  = id(); // قهوة إسبريسو
  const item_cf2  = id(); // قهوة سوداء
  const item_cf3  = id(); // قهوة تركية
  const item_cf4  = id(); // قهوة سعودية
  const item_cf5  = id(); // هيل
  const item_cf6  = id(); // زعفران
  // Tea / hot drinks
  const item_tea1 = id(); // شاهي اسود ممتاز
  const item_tea2 = id(); // شاهي اخضر ممتاز
  const item_tea3 = id(); // شاي زهور
  const item_tea4 = id(); // أظرف شاهي كرك
  const item_tea5 = id(); // خليط الشوكولاتة الساخنة
  // Milk / additives
  const item_mk1  = id(); // حليب طازج
  const item_mk2  = id(); // حليب نباتي
  const item_mk3  = id(); // حليب مكثف
  const item_mk4  = id(); // حليب مبخر
  const item_mk5  = id(); // سيروب بنكهات متعددة
  const item_mk6  = id(); // كرتون أظرف سكر ابيض
  const item_mk7  = id(); // سكر دايت
  const item_mk8  = id(); // أعواد خشبية
  // Water / cold drinks
  const item_w1   = id(); // ماء
  const item_w2   = id(); // جالون مياه
  const item_w3   = id(); // مياه غازية
  const item_w4   = id(); // مشروبات غازية
  // Juices
  const item_j1   = id(); // عصيرات طازجة يومية
  const item_j2   = id(); // عصيرات طبيعية يومية
  // Cups / plates
  const item_cp1  = id(); // اكواب بلاستيك
  const item_cp2  = id(); // اكواب ورقية
  const item_cp3  = id(); // اكواب ورقية صغيرة
  const item_cp4  = id(); // اطباق ورقية
  const item_cp5  = id(); // مجموعة الطعام
  // Equipment
  const item_eq1  = id(); // مكينة اسبريسو
  const item_eq2  = id(); // طاحونة اسبريسو
  const item_eq3  = id(); // غلاية ماء
  const item_eq4  = id(); // محطة تحلية صغيرة الحجم
  const item_eq5  = id(); // محضر القهوة السوداء
  const item_eq6  = id(); // محضر القهوة التركية
  const item_eq7  = id(); // طاحونة قهوة سوداء
  const item_eq8  = id(); // ميزان معايرة القهوة والمشروبات
  const item_eq9  = id(); // صانعة القهوة عربية
  const item_eq10 = id(); // صانعة ثلج
  const item_eq11 = id(); // اناء تبخير الحليب
  const item_eq12 = id(); // وعاء القهوة المستخلصة
  const item_eq13 = id(); // مكبس قهوة
  const item_eq14 = id(); // موزع قهوة
  const item_eq15 = id(); // ثلاجة عرض واقفة للخدمة الذاتية
  const item_eq16 = id(); // ميكرويف لتسخين الساندويتش
  const item_eq17 = id(); // محمصة الخبز
  // Meeting services
  const item_mt1  = id(); // خدمة الاجتماعات A
  const item_mt2  = id(); // خدمة الاجتماعات B
  const item_mt3  = id(); // خدمة الاجتماعات C
  // HR
  const item_hr1  = id(); // مقدم خدمات الضيافة
  const item_hr2  = id(); // مقدم قهوة وشاي سعودي لخدمات VIP باليومية
  const item_hr3  = id(); // مفرغ اطعمة

  const foodItemIds = [item_sw1, item_sw2, item_sw3, item_ml1, item_ml2, item_ml3, item_sl1, item_sl2, item_fr1, item_bk1, item_bk2, item_sn1, item_sn2, item_sn3, item_sn4, item_sn5, item_sn6, item_sn7];
  const matItemIds  = [item_cf1, item_cf2, item_cf3, item_cf4, item_cf5, item_cf6, item_tea1, item_tea2, item_tea3, item_tea4, item_tea5, item_mk1, item_mk2, item_mk3, item_mk4, item_mk5, item_mk6, item_mk7, item_mk8, item_w1, item_w2, item_w3, item_w4, item_j1, item_j2, item_cp1, item_cp2, item_cp3, item_cp4, item_cp5];

  // ─── Users ────────────────────────────────────────────────────────────────────
  await db.collection('users').insertMany([
    { _id: adminId,      fullName: 'أحمد الراشدي',    email: 'admin@mirsad.com',      password: DEMO_PASS, role: 'admin',               status: 'active', createdAt: now, updatedAt: now },
    { _id: supervisorId, fullName: 'خالد العتيبي',    email: 'supervisor@mirsad.com', password: DEMO_PASS, role: 'supervisor',           project: projectId, status: 'active', createdAt: now, updatedAt: now },
    { _id: assistantId,  fullName: 'فاطمة الزهراني',  email: 'assistant@mirsad.com',  password: DEMO_PASS, role: 'assistant_supervisor', project: projectId, status: 'active', createdAt: now, updatedAt: now },
    { _id: managerId,    fullName: 'محمد الغامدي',    email: 'manager@mirsad.com',    password: DEMO_PASS, role: 'project_manager',      project: projectId, status: 'active', createdAt: now, updatedAt: now },
    { _id: clientId,     fullName: 'نورة الشهري',     email: 'client@mirsad.com',     password: DEMO_PASS, role: 'client',               project: projectId, status: 'active', createdAt: now, updatedAt: now },
  ]);

  // ─── Project / Building / Floors ─────────────────────────────────────────────
  await db.collection('projects').insertMany([
    { _id: projectId, name: 'CDMDNA Building Operations', clientName: 'وزارة الدفاع', locationCode: 'CDMDNA-01', status: 'active', createdBy: adminId, createdAt: now, updatedAt: now },
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

  // ─── Categories ───────────────────────────────────────────────────────────────
  await db.collection('itemcategories').insertMany([
    { _id: catSandwichId,  name: 'ساندويتشات',            type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catMealsId,     name: 'وجبات',                  type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catSaladId,     name: 'سلطات وخضار',            type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catFruitId,     name: 'فواكه',                  type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catBakeryId,    name: 'مخبوزات ومعجنات',        type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catSnacksId,    name: 'وجبات خفيفة',            type: 'food',     status: 'active', createdAt: now, updatedAt: now },
    { _id: catCoffeeId,    name: 'قهوة',                   type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catTeaId,       name: 'شاي ومشروبات ساخنة',    type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catMilkId,      name: 'حليب وإضافات',          type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catWaterId,     name: 'مياه ومشروبات باردة',   type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catJuiceId,     name: 'عصائر',                  type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catCupsId,      name: 'أكواب وأطباق',          type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catEquipmentId, name: 'معدات',                  type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catMeetingId,   name: 'خدمات الاجتماعات',      type: 'material', status: 'active', createdAt: now, updatedAt: now },
    { _id: catHRId,        name: 'موارد بشرية',            type: 'material', status: 'active', createdAt: now, updatedAt: now },
  ]);

  // ─── Items ────────────────────────────────────────────────────────────────────
  await db.collection('items').insertMany([
    // Sandwiches
    { _id: item_sw1,  name: 'ساندويتش فطور',                              category: catSandwichId,  type: 'food',     unit: 'قطعة',    limitQty: 500,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sw2,  name: 'ساندويتش',                                   category: catSandwichId,  type: 'food',     unit: 'قطعة',    limitQty: 400,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sw3,  name: 'ساندويتش خالي من الغلوتين',                  category: catSandwichId,  type: 'food',     unit: 'قطعة',    limitQty: 100,  status: 'active', createdAt: now, updatedAt: now },
    // Meals
    { _id: item_ml1,  name: 'وجبة إفطار خفيفة',                          category: catMealsId,     type: 'food',     unit: 'علبة',    limitQty: 300,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_ml2,  name: 'وجبة غداء خفيفة',                           category: catMealsId,     type: 'food',     unit: 'علبة',    limitQty: 300,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_ml3,  name: 'وجبة رئيسية',                               category: catMealsId,     type: 'food',     unit: 'علبة',    limitQty: 250,  status: 'active', createdAt: now, updatedAt: now },
    // Salads & Vegetables
    { _id: item_sl1,  name: 'سلطه',                                       category: catSaladId,     type: 'food',     unit: 'طبق',     limitQty: 300,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sl2,  name: 'خضار منوعة',                                 category: catSaladId,     type: 'food',     unit: 'كجم',     limitQty: 150,  status: 'active', createdAt: now, updatedAt: now },
    // Fruits
    { _id: item_fr1,  name: 'فواكه متنوعة',                              category: catFruitId,     type: 'food',     unit: 'كجم',     limitQty: 300,  status: 'active', createdAt: now, updatedAt: now },
    // Bakery
    { _id: item_bk1,  name: 'معجنات صغيرة',                              category: catBakeryId,    type: 'food',     unit: 'قطعة',    limitQty: 400,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_bk2,  name: 'مخبوزات صغيرة',                             category: catBakeryId,    type: 'food',     unit: 'قطعة',    limitQty: 350,  status: 'active', createdAt: now, updatedAt: now },
    // Snacks
    { _id: item_sn1,  name: 'زبادي (يوناني)',                             category: catSnacksId,    type: 'food',     unit: 'حبة',     limitQty: 400,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sn2,  name: 'مكسرات منوعة',                              category: catSnacksId,    type: 'food',     unit: 'كيس',     limitQty: 300,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sn3,  name: 'الواح شوفان',                               category: catSnacksId,    type: 'food',     unit: 'قطعة',    limitQty: 400,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sn4,  name: 'بسكويت',                                    category: catSnacksId,    type: 'food',     unit: 'علبة',    limitQty: 300,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sn5,  name: 'جرانولا',                                   category: catSnacksId,    type: 'food',     unit: 'علبة',    limitQty: 400,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sn6,  name: 'حلويات قليلة السعرات',                      category: catSnacksId,    type: 'food',     unit: 'قطعة',    limitQty: 200,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_sn7,  name: 'رقائق بطاطس صحية',                          category: catSnacksId,    type: 'food',     unit: 'كيس',     limitQty: 200,  status: 'active', createdAt: now, updatedAt: now },
    // Coffee
    { _id: item_cf1,  name: 'قهوة إسبريسو',                              category: catCoffeeId,    type: 'material', unit: 'كيلو',    limitQty: 100,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_cf2,  name: 'قهوة سوداء',                                category: catCoffeeId,    type: 'material', unit: 'كيلو',    limitQty: 80,   status: 'active', createdAt: now, updatedAt: now },
    { _id: item_cf3,  name: 'قهوة تركية',                                category: catCoffeeId,    type: 'material', unit: 'كيلو',    limitQty: 50,   status: 'active', createdAt: now, updatedAt: now },
    { _id: item_cf4,  name: 'قهوة سعودية',                               category: catCoffeeId,    type: 'material', unit: 'كيلو',    limitQty: 120,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_cf5,  name: 'هيل',                                        category: catCoffeeId,    type: 'material', unit: 'كيلو',    limitQty: 30,   status: 'active', createdAt: now, updatedAt: now },
    { _id: item_cf6,  name: 'زعفران',                                     category: catCoffeeId,    type: 'material', unit: 'جرام',    limitQty: 500,  status: 'active', createdAt: now, updatedAt: now },
    // Tea & Hot Drinks
    { _id: item_tea1, name: 'شاهي اسود ممتاز',                           category: catTeaId,       type: 'material', unit: 'علبة',    limitQty: 500,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_tea2, name: 'شاهي اخضر ممتاز',                           category: catTeaId,       type: 'material', unit: 'علبة',    limitQty: 300,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_tea3, name: 'شاي زهور',                                   category: catTeaId,       type: 'material', unit: 'علبة',    limitQty: 200,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_tea4, name: 'أظرف شاهي كرك',                             category: catTeaId,       type: 'material', unit: 'علبة',    limitQty: 400,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_tea5, name: 'خليط الشوكولاتة الساخنة',                   category: catTeaId,       type: 'material', unit: 'كيلو',    limitQty: 50,   status: 'active', createdAt: now, updatedAt: now },
    // Milk & Additives
    { _id: item_mk1,  name: 'حليب طازج',                                 category: catMilkId,      type: 'material', unit: 'لتر',     limitQty: 500,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_mk2,  name: 'حليب نباتي',                                category: catMilkId,      type: 'material', unit: 'لتر',     limitQty: 200,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_mk3,  name: 'حليب مكثف',                                 category: catMilkId,      type: 'material', unit: 'علبة',    limitQty: 300,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_mk4,  name: 'حليب مبخر',                                 category: catMilkId,      type: 'material', unit: 'علبة',    limitQty: 300,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_mk5,  name: 'سيروب بنكهات متعددة',                       category: catMilkId,      type: 'material', unit: 'زجاجة',   limitQty: 100,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_mk6,  name: 'كرتون أظرف سكر ابيض',                       category: catMilkId,      type: 'material', unit: 'كرتون',   limitQty: 200,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_mk7,  name: 'سكر دايت',                                  category: catMilkId,      type: 'material', unit: 'علبة',    limitQty: 150,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_mk8,  name: 'أعواد خشبية',                               category: catMilkId,      type: 'material', unit: 'علبة',    limitQty: 200,  status: 'active', createdAt: now, updatedAt: now },
    // Water & Cold Drinks
    { _id: item_w1,   name: 'ماء',                                        category: catWaterId,     type: 'material', unit: 'زجاجة',   limitQty: 2000, status: 'active', createdAt: now, updatedAt: now },
    { _id: item_w2,   name: 'جالون مياه',                                category: catWaterId,     type: 'material', unit: 'جالون',   limitQty: 200,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_w3,   name: 'مياه غازية',                                category: catWaterId,     type: 'material', unit: 'علبة',    limitQty: 500,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_w4,   name: 'مشروبات غازية',                             category: catWaterId,     type: 'material', unit: 'علبة',    limitQty: 500,  status: 'active', createdAt: now, updatedAt: now },
    // Juices
    { _id: item_j1,   name: 'عصيرات طازجة يومية',                        category: catJuiceId,     type: 'material', unit: 'كوب',     limitQty: 500,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_j2,   name: 'عصيرات طبيعية يومية',                       category: catJuiceId,     type: 'material', unit: 'كوب',     limitQty: 400,  status: 'active', createdAt: now, updatedAt: now },
    // Cups & Plates
    { _id: item_cp1,  name: 'اكواب بلاستيك',                             category: catCupsId,      type: 'material', unit: 'عبوة',    limitQty: 300,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_cp2,  name: 'اكواب ورقية',                               category: catCupsId,      type: 'material', unit: 'عبوة',    limitQty: 500,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_cp3,  name: 'اكواب ورقية صغيرة',                         category: catCupsId,      type: 'material', unit: 'عبوة',    limitQty: 400,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_cp4,  name: 'اطباق ورقية',                               category: catCupsId,      type: 'material', unit: 'عبوة',    limitQty: 300,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_cp5,  name: 'مجموعة الطعام',                             category: catCupsId,      type: 'material', unit: 'مجموعة',  limitQty: 200,  status: 'active', createdAt: now, updatedAt: now },
    // Equipment
    { _id: item_eq1,  name: 'مكينة اسبريسو',                            category: catEquipmentId, type: 'material', unit: 'جهاز',    limitQty: 10,   status: 'active', createdAt: now, updatedAt: now },
    { _id: item_eq2,  name: 'طاحونة اسبريسو',                           category: catEquipmentId, type: 'material', unit: 'جهاز',    limitQty: 10,   status: 'active', createdAt: now, updatedAt: now },
    { _id: item_eq3,  name: 'غلاية ماء',                                category: catEquipmentId, type: 'material', unit: 'جهاز',    limitQty: 20,   status: 'active', createdAt: now, updatedAt: now },
    { _id: item_eq4,  name: 'محطة تحلية صغيرة الحجم',                  category: catEquipmentId, type: 'material', unit: 'جهاز',    limitQty: 5,    status: 'active', createdAt: now, updatedAt: now },
    { _id: item_eq5,  name: 'محضر القهوة السوداء',                      category: catEquipmentId, type: 'material', unit: 'جهاز',    limitQty: 10,   status: 'active', createdAt: now, updatedAt: now },
    { _id: item_eq6,  name: 'محضر القهوة التركية',                      category: catEquipmentId, type: 'material', unit: 'جهاز',    limitQty: 10,   status: 'active', createdAt: now, updatedAt: now },
    { _id: item_eq7,  name: 'طاحونة قهوة سوداء',                       category: catEquipmentId, type: 'material', unit: 'جهاز',    limitQty: 10,   status: 'active', createdAt: now, updatedAt: now },
    { _id: item_eq8,  name: 'ميزان معايرة القهوة والمشروبات',           category: catEquipmentId, type: 'material', unit: 'جهاز',    limitQty: 10,   status: 'active', createdAt: now, updatedAt: now },
    { _id: item_eq9,  name: 'صانعة القهوة عربية',                       category: catEquipmentId, type: 'material', unit: 'جهاز',    limitQty: 10,   status: 'active', createdAt: now, updatedAt: now },
    { _id: item_eq10, name: 'صانعة ثلج',                                category: catEquipmentId, type: 'material', unit: 'جهاز',    limitQty: 5,    status: 'active', createdAt: now, updatedAt: now },
    { _id: item_eq11, name: 'اناء تبخير الحليب',                        category: catEquipmentId, type: 'material', unit: 'جهاز',    limitQty: 15,   status: 'active', createdAt: now, updatedAt: now },
    { _id: item_eq12, name: 'وعاء القهوة المستخلصة',                    category: catEquipmentId, type: 'material', unit: 'جهاز',    limitQty: 15,   status: 'active', createdAt: now, updatedAt: now },
    { _id: item_eq13, name: 'مكبس قهوة',                                category: catEquipmentId, type: 'material', unit: 'قطعة',    limitQty: 20,   status: 'active', createdAt: now, updatedAt: now },
    { _id: item_eq14, name: 'موزع قهوة',                                category: catEquipmentId, type: 'material', unit: 'قطعة',    limitQty: 20,   status: 'active', createdAt: now, updatedAt: now },
    { _id: item_eq15, name: 'ثلاجة عرض واقفة للخدمة الذاتية',          category: catEquipmentId, type: 'material', unit: 'جهاز',    limitQty: 10,   status: 'active', createdAt: now, updatedAt: now },
    { _id: item_eq16, name: 'ميكرويف لتسخين الساندويتش',               category: catEquipmentId, type: 'material', unit: 'جهاز',    limitQty: 10,   status: 'active', createdAt: now, updatedAt: now },
    { _id: item_eq17, name: 'محمصة الخبز',                              category: catEquipmentId, type: 'material', unit: 'جهاز',    limitQty: 10,   status: 'active', createdAt: now, updatedAt: now },
    // Meeting Services
    { _id: item_mt1,  name: 'خدمة الاجتماعات A',                        category: catMeetingId,   type: 'material', unit: 'خدمة',    limitQty: 100,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_mt2,  name: 'خدمة الاجتماعات B',                        category: catMeetingId,   type: 'material', unit: 'خدمة',    limitQty: 100,  status: 'active', createdAt: now, updatedAt: now },
    { _id: item_mt3,  name: 'خدمة الاجتماعات C',                        category: catMeetingId,   type: 'material', unit: 'خدمة',    limitQty: 100,  status: 'active', createdAt: now, updatedAt: now },
    // HR
    { _id: item_hr1,  name: 'مقدم خدمات الضيافة',                       category: catHRId,        type: 'material', unit: 'يوم',     limitQty: 30,   status: 'active', createdAt: now, updatedAt: now },
    { _id: item_hr2,  name: 'مقدم قهوة وشاي سعودي لخدمات VIP باليومية', category: catHRId,       type: 'material', unit: 'يوم',     limitQty: 30,   status: 'active', createdAt: now, updatedAt: now },
    { _id: item_hr3,  name: 'مفرغ اطعمة',                               category: catHRId,        type: 'material', unit: 'يوم',     limitQty: 30,   status: 'active', createdAt: now, updatedAt: now },
  ]);

  // ─── Daily Plans ──────────────────────────────────────────────────────────────
  const planIds = Array.from({ length: 7 }, () => id());
  const planStatuses = ['closed', 'closed', 'closed', 'published', 'published', 'draft', 'draft'];

  await db.collection('dailyplans').insertMany(
    planIds.map((pid, i) => ({
      _id: pid, date: daysAgo(6 - i), project: projectId, building: buildingId,
      shift: 'morning', status: planStatuses[i], createdBy: adminId,
      createdAt: daysAgo(7 - i), updatedAt: daysAgo(7 - i),
    }))
  );

  const sampleFoodItems = [item_sw1, item_ml3, item_fr1, item_j1];
  const sampleMatItems  = [item_w2,  item_cp2];
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

  // ─── Floor Checks ─────────────────────────────────────────────────────────────
  const floorCheckDocs: object[]  = [];
  const floorCheckLines: object[] = [];
  const approvalRecords: object[] = [];
  const stockMovements: object[]  = [];
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
        approvalRecords.push({ _id: rec, entityType: 'floor_check', entityId: checkId, step: 'supervisor', action: 'submit', actor: supervisorId, comment: 'تم الانتهاء من الجولة اليومية', version: 1, createdAt: new Date(checkDate.getTime() + 3600000) });
      }
      if (['under_review', 'approved'].includes(status)) {
        const rec = id(); approvalRefs.push(rec);
        approvalRecords.push({ _id: rec, entityType: 'floor_check', entityId: checkId, step: 'assistant_supervisor', action: 'review', actor: assistantId, comment: 'تمت المراجعة — إحالة للاعتماد', version: 2, createdAt: new Date(checkDate.getTime() + 7200000) });
      }
      if (status === 'returned') {
        const rec = id(); approvalRefs.push(rec);
        approvalRecords.push({ _id: rec, entityType: 'floor_check', entityId: checkId, step: 'assistant_supervisor', action: 'return', actor: assistantId, comment: 'الكميات تحتاج مراجعة', version: 2, createdAt: new Date(checkDate.getTime() + 7200000) });
      }
      if (status === 'approved') {
        const rec = id(); approvalRefs.push(rec);
        approvalRecords.push({ _id: rec, entityType: 'floor_check', entityId: checkId, step: 'project_manager', action: 'approve', actor: managerId, comment: 'معتمد', version: 3, createdAt: new Date(checkDate.getTime() + 10800000) });

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
            stockMovements.push({ _id: id(), project: projectId, item: line.item, movementType: movType, quantity: line.actualQty, movementDate: checkDate, sourceType: 'floor_check', sourceRef: checkId, notes: 'تلقائي من اعتماد جولة الطابق', createdBy: supervisorId, createdAt: new Date(checkDate.getTime() + 11000000) });
          }
        }
      }

      const currentStep = status === 'draft' ? 'supervisor' : status === 'submitted' ? 'assistant_supervisor' : status === 'under_review' ? 'project_manager' : status === 'returned' ? 'supervisor' : 'client';
      floorCheckDocs.push({ _id: checkId, dailyPlan: planId, date: checkDate, project: projectId, building: buildingId, floor: floorId, shift: 'morning', supervisor: supervisorId, status, notes: floorIdx === 0 ? 'تمت جولة التفتيش في الموعد المحدد' : undefined, approvalRecords: approvalRefs, currentApprovalStep: currentStep, createdAt: checkDate, updatedAt: checkDate });
    }
  }

  await db.collection('floorchecklines').insertMany(floorCheckLines);
  await db.collection('floorchecks').insertMany(floorCheckDocs);
  if (approvalRecords.length) await db.collection('approvalrecords').insertMany(approvalRecords);

  // ─── Inventory Balances ───────────────────────────────────────────────────────
  for (const bal of Object.values(inventoryMap)) {
    bal.remainingQty = bal.openingBalance + bal.receivedQty - bal.consumedQty - bal.issuedQty - bal.damagedQty + bal.returnedQty;
    const used = bal.consumedQty + bal.issuedQty;
    bal.status = bal.remainingQty <= 0 ? 'out_of_stock' : used > bal.monthlyLimit && bal.monthlyLimit > 0 ? 'over_consumed' : bal.monthlyLimit > 0 && bal.remainingQty / bal.monthlyLimit < 0.2 ? 'low_stock' : 'available';
  }

  const prevPeriod = monthPeriod(1);
  for (const iid of [...foodItemIds, ...matItemIds]) {
    inventoryMap[`prev-${iid}`] = { _id: id(), project: projectId, item: iid, period: prevPeriod, monthlyLimit: 400, openingBalance: 100, receivedQty: 350, consumedQty: 280, issuedQty: 0, damagedQty: 10, returnedQty: 5, remainingQty: 165, status: 'available', updatedAt: now };
  }

  // Low / out-of-stock overrides
  const currentPeriod = monthPeriod(0);
  const sn1Key  = `${projectId}-${item_sn1}-${currentPeriod}`;
  const tea4Key = `${projectId}-${item_tea4}-${currentPeriod}`;
  const tea1Key = `${projectId}-${item_tea1}-${currentPeriod}`;
  const j2Key   = `${projectId}-${item_j2}-${currentPeriod}`;

  if (!inventoryMap[sn1Key])  inventoryMap[sn1Key]  = { _id: id(), project: projectId, item: item_sn1,  period: currentPeriod, monthlyLimit: 400, openingBalance: 200, receivedQty: 300, consumedQty: 0, issuedQty: 0, damagedQty: 0, returnedQty: 0, remainingQty: 400, status: 'available', updatedAt: now };
  inventoryMap[sn1Key].remainingQty  = 30;
  inventoryMap[sn1Key].monthlyLimit  = 400;
  inventoryMap[sn1Key].status        = 'low_stock';

  if (!inventoryMap[tea4Key]) inventoryMap[tea4Key] = { _id: id(), project: projectId, item: item_tea4, period: currentPeriod, monthlyLimit: 400, openingBalance: 200, receivedQty: 300, consumedQty: 0, issuedQty: 0, damagedQty: 0, returnedQty: 0, remainingQty: 400, status: 'available', updatedAt: now };
  inventoryMap[tea4Key].remainingQty = 0;
  inventoryMap[tea4Key].monthlyLimit = 400;
  inventoryMap[tea4Key].status       = 'out_of_stock';

  if (!inventoryMap[tea1Key]) inventoryMap[tea1Key] = { _id: id(), project: projectId, item: item_tea1, period: currentPeriod, monthlyLimit: 500, openingBalance: 200, receivedQty: 300, consumedQty: 0, issuedQty: 0, damagedQty: 0, returnedQty: 0, remainingQty: 500, status: 'available', updatedAt: now };
  inventoryMap[tea1Key].remainingQty = 180;
  inventoryMap[tea1Key].monthlyLimit = 500;
  inventoryMap[tea1Key].status       = 'low_stock';

  if (!inventoryMap[j2Key])   inventoryMap[j2Key]   = { _id: id(), project: projectId, item: item_j2,   period: currentPeriod, monthlyLimit: 400, openingBalance: 200, receivedQty: 300, consumedQty: 0, issuedQty: 0, damagedQty: 0, returnedQty: 0, remainingQty: 400, status: 'available', updatedAt: now };
  inventoryMap[j2Key].remainingQty   = 30;
  inventoryMap[j2Key].monthlyLimit   = 400;
  inventoryMap[j2Key].status         = 'low_stock';

  await db.collection('inventorybalances').insertMany(Object.values(inventoryMap));

  const receiveMovements = [...foodItemIds.slice(0, 5), ...matItemIds.slice(0, 5)].map(iid => ({
    _id: id(), project: projectId, item: iid, movementType: 'RECEIVE', quantity: 300,
    movementDate: daysAgo(10), sourceType: 'manual', notes: 'تجديد مخزون شهري', createdBy: managerId, createdAt: daysAgo(10),
  }));
  await db.collection('stockmovements').insertMany([...receiveMovements, ...stockMovements]);

  // ─── 1. Suppliers ─────────────────────────────────────────────────────────────
  const supplier1Id = id(), supplier2Id = id();
  await db.collection('suppliers').insertMany([
    {
      _id: supplier1Id,
      name: 'شركة الخير للأغذية والمشروبات',
      nameAr: 'الخير للأغذية والمشروبات',
      contactName: 'ماجد الدوسري',
      phone: '+966-11-234-5678',
      email: 'orders@alkhair.sa',
      category: 'food',
      rating: 4,
      status: 'active',
      licenseNumber: 'SUP-2024-001',
      address: 'المدينة الصناعية بالرياض، المنطقة 3',
      createdAt: now, updatedAt: now,
    },
    {
      _id: supplier2Id,
      name: 'النور لمستلزمات الضيافة',
      nameAr: 'النور لمستلزمات الضيافة',
      contactName: 'سارة المطيري',
      phone: '+966-11-345-6789',
      email: 'supply@alnoor.sa',
      category: 'material',
      rating: 5,
      status: 'active',
      licenseNumber: 'SUP-2024-002',
      address: 'طريق الملك فهد، الرياض',
      createdAt: now, updatedAt: now,
    },
  ]);

  // ─── 2. Purchase Orders ───────────────────────────────────────────────────────
  const po1Id = id(), po2Id = id();

  const currentMonthPeriod = monthPeriod(0);
  const [cpYear, cpMonth] = currentMonthPeriod.split('-').map(Number);
  const poStartDate = new Date(cpYear, cpMonth - 1, 1);
  const poEndDate   = new Date(cpYear, cpMonth, 0, 23, 59, 59, 999);

  const po1Line1Id = id(), po1Line2Id = id(), po1Line3Id = id(), po1Line4Id = id(), po1Line5Id = id();
  const po2Line1Id = id(), po2Line2Id = id(), po2Line3Id = id();

  const po1Lines = [
    { _id: po1Line1Id, item: item_sw1,  unit: 'قطعة',  approvedQty: 500, receivedQty: 300, distributedQty: 180, consumedQty: 80,  remainingQty: 240, variance: 0 },
    { _id: po1Line2Id, item: item_ml3,  unit: 'علبة',  approvedQty: 250, receivedQty: 150, distributedQty: 90,  consumedQty: 50,  remainingQty: 110, variance: 0 },
    { _id: po1Line3Id, item: item_fr1,  unit: 'كجم',   approvedQty: 300, receivedQty: 200, distributedQty: 120, consumedQty: 60,  remainingQty: 120, variance: 0 },
    { _id: po1Line4Id, item: item_j1,   unit: 'كوب',   approvedQty: 500, receivedQty: 300, distributedQty: 200, consumedQty: 80,  remainingQty: 220, variance: 0 },
    { _id: po1Line5Id, item: item_bk1,  unit: 'قطعة',  approvedQty: 400, receivedQty: 200, distributedQty: 120, consumedQty: 60,  remainingQty: 220, variance: 0 },
  ];
  const po2Lines = [
    { _id: po2Line1Id, item: item_w2,   unit: 'جالون', approvedQty: 200, receivedQty: 180, distributedQty: 150, consumedQty: 20, remainingQty: 10,  variance: 0 },
    { _id: po2Line2Id, item: item_cp2,  unit: 'عبوة',  approvedQty: 300, receivedQty: 280, distributedQty: 250, consumedQty: 20, remainingQty: 10,  variance: 0 },
    { _id: po2Line3Id, item: item_cf1,  unit: 'كيلو',  approvedQty: 100, receivedQty: 80,  distributedQty: 50,  consumedQty: 20, remainingQty: 10,  variance: 0 },
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
      notes: 'أغذية ومشروبات — الدورة الشهرية',
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
      notes: 'مستلزمات وقهوة — الدورة الشهرية',
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
        { _id: id(), item: item_sw1,  purchaseOrderLine: po1Line1Id, quantityOrdered: 300, quantityReceived: 300, condition: 'good' },
        { _id: id(), item: item_ml3,  purchaseOrderLine: po1Line2Id, quantityOrdered: 150, quantityReceived: 150, condition: 'good' },
        { _id: id(), item: item_fr1,  purchaseOrderLine: po1Line3Id, quantityOrdered: 200, quantityReceived: 200, condition: 'good' },
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
        { _id: id(), item: item_w2,   quantityOrdered: 50,  quantityReceived: 50,  condition: 'good' },
        { _id: id(), item: item_cp2,  quantityOrdered: 100, quantityReceived: 100, condition: 'good' },
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
        { _id: id(), item: item_j1,   quantityOrdered: 300, quantityReceived: 300, condition: 'good'     },
        { _id: id(), item: item_bk1,  quantityOrdered: 200, quantityReceived: 180, condition: 'good'     },
        { _id: id(), item: item_sl1,  quantityOrdered: 100, quantityReceived: 0,   condition: 'rejected' },
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
      title: 'طلب إعادة تعبئة ساندويتش الفطور — الطابق 2',
      requestType: 'operation_request',
      priority: 'high',
      project: projectId,
      floor: floor2Id,
      requestedBy: clientId,
      status: 'submitted',
      items: [
        { name: 'ساندويتش فطور',        quantity: 50, unit: 'قطعة' },
        { name: 'عصيرات طازجة يومية',   quantity: 30, unit: 'كوب'  },
      ],
      expectedDelivery: daysAgo(-1),
      createdAt: daysAgo(0), updatedAt: daysAgo(0),
    },
    {
      _id: cr2Id,
      title: 'إعداد كوفي بريك — قاعة اجتماعات الطابق 3',
      requestType: 'coffee_break_request',
      priority: 'medium',
      project: projectId,
      floor: floor3Id,
      requestedBy: clientId,
      status: 'submitted',
      items: [
        { name: 'قهوة سعودية',          quantity: 2,  unit: 'دلة'    },
        { name: 'شاهي اسود ممتاز',      quantity: 30, unit: 'كوب'    },
        { name: 'معجنات صغيرة',         quantity: 20, unit: 'قطعة'   },
      ],
      expectedDelivery: daysAgo(-1),
      createdAt: daysAgo(1), updatedAt: daysAgo(1),
    },
    {
      _id: cr3Id,
      title: 'توزيع وجبات الغداء — الطابق 4',
      requestType: 'operation_request',
      priority: 'medium',
      project: projectId,
      floor: floor4Id,
      requestedBy: clientId,
      assignedTo: assistantId,
      status: 'assigned',
      items: [
        { name: 'وجبة رئيسية',          quantity: 40, unit: 'علبة'  },
        { name: 'سلطه',                  quantity: 20, unit: 'طبق'   },
      ],
      createdAt: daysAgo(3), updatedAt: daysAgo(3),
    },
    {
      _id: cr4Id,
      title: 'كوفي بريك VIP — الطابق 19',
      requestType: 'coffee_break_request',
      priority: 'urgent',
      project: projectId,
      floor: floor19Id,
      requestedBy: clientId,
      assignedTo: assistantId,
      status: 'in_progress',
      items: [
        { name: 'قهوة سعودية',          quantity: 5,  unit: 'دلة'   },
        { name: 'معجنات صغيرة',         quantity: 30, unit: 'قطعة'  },
        { name: 'حلويات قليلة السعرات', quantity: 20, unit: 'قطعة'  },
      ],
      createdAt: daysAgo(4), updatedAt: daysAgo(4),
    },
    {
      _id: cr5Id,
      title: 'خدمة العصر — MAKASSB',
      requestType: 'operation_request',
      priority: 'medium',
      project: projectId,
      floor: floorMakassbId,
      requestedBy: clientId,
      assignedTo: assistantId,
      status: 'delivered',
      deliveredAt: daysAgo(0),
      items: [
        { name: 'جرانولا',              quantity: 30, unit: 'علبة'   },
        { name: 'مكسرات منوعة',         quantity: 20, unit: 'كيس'    },
        { name: 'عصيرات طبيعية يومية',  quantity: 30, unit: 'كوب'    },
      ],
      createdAt: daysAgo(5), updatedAt: daysAgo(0),
    },
    {
      _id: cr6Id,
      title: 'مستلزمات ركن القهوة الأسبوعي',
      requestType: 'coffee_break_request',
      priority: 'low',
      project: projectId,
      floor: floor2Id,
      requestedBy: clientId,
      status: 'confirmed',
      deliveredAt: daysAgo(6),
      confirmedAt: daysAgo(5),
      items: [
        { name: 'قهوة إسبريسو',         quantity: 5,  unit: 'كيلو'  },
        { name: 'كرتون أظرف سكر ابيض',  quantity: 3,  unit: 'كرتون' },
      ],
      createdAt: daysAgo(7), updatedAt: daysAgo(5),
    },
    {
      _id: cr7Id,
      title: 'ضيافة طارئة — طابق الأمن',
      requestType: 'catering',
      priority: 'urgent',
      project: projectId,
      floor: floorSecurityId,
      requestedBy: supervisorId,
      status: 'submitted',
      items: [
        { name: 'ساندويتش',             quantity: 50, unit: 'قطعة'  },
        { name: 'جالون مياه',           quantity: 10, unit: 'جالون'  },
      ],
      createdAt: daysAgo(2), updatedAt: daysAgo(2),
    },
    {
      _id: cr8Id,
      title: 'تجديد المستلزمات الشهرية — KAFAA',
      requestType: 'supplies',
      priority: 'medium',
      project: projectId,
      floor: floorKafaa1Id,
      requestedBy: assistantId,
      status: 'submitted',
      items: [
        { name: 'اكواب ورقية',          quantity: 500, unit: 'عبوة'  },
        { name: 'اطباق ورقية',          quantity: 200, unit: 'عبوة'  },
      ],
      createdAt: daysAgo(3), updatedAt: daysAgo(3),
    },
  ]);

  // ─── 5. Maintenance Requests ──────────────────────────────────────────────────
  const mr1Id = id(), mr2Id = id(), mr3Id = id();

  await db.collection('maintenancerequests').insertMany([
    {
      _id: mr1Id,
      title: 'عطل مكينة الاسبريسو — الطابق 2',
      description: 'توقفت مكينة الاسبريسو الرئيسية عن العمل أثناء خدمة الصباح. تحتاج إصلاحاً عاجلاً.',
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
      title: 'عطل وحدة التكييف — الطابق 3',
      description: 'وحدة التكييف تصدر ضوضاء غير اعتيادية ولا تبرد بشكل كافٍ. يؤثر على درجة حرارة التخزين.',
      category: 'hvac',
      priority: 'high',
      status: 'assigned',
      assignedTo: assistantId,
      assignedAt: daysAgo(1),
      project: projectId,
      building: buildingId,
      floor: floor3Id,
      reportedBy: supervisorId,
      createdAt: daysAgo(2), updatedAt: daysAgo(2),
    },
    {
      _id: mr3Id,
      title: 'ارتفاع درجة حرارة الثلاجة — الطابق 4',
      description: 'درجة حرارة الثلاجة ترتفع عن النطاق الآمن (أكثر من 8 درجة). خطر محتمل على الأمان الغذائي لمنتجات الألبان.',
      category: 'equipment',
      priority: 'high',
      status: 'in_progress',
      assignedTo: assistantId,
      assignedAt: daysAgo(2),
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
      quantity: 200,
      remainingQty: 120,
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
      item: item_mk1,
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
      item: item_sn1,
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
      item: item_bk1,
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

  // ─── 7. Corrective Action (pre-assigned ID needed for fridge check link) ──────
  const corr1Id = id();
  const fc2Id   = id();

  await db.collection('correctiveactions').insertMany([
    {
      _id: corr1Id,
      title: 'خرق درجة الحرارة — تخزين مبرد الطابق 3',
      description: 'تجاوزت درجة حرارة وحدة التبريد النطاق الآمن (9.2 درجة). تلفت 15 حبة زبادي. الوحدة تحتاج فحصاً وإعادة معايرة فورية.',
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
          _id: id(), batch: batch1Id, item: item_fr1,
          expiryDate: daysAgo(-2), isExpired: false, isNearExpiry: true,
          quantity: 120, condition: 'good', nameTagPresent: true,
        },
        {
          _id: id(), batch: batch3Id, item: item_sn1,
          expiryDate: daysAgo(-3), isExpired: false, isNearExpiry: true,
          quantity: 80, condition: 'good', nameTagPresent: true,
        },
      ],
      status: 'ok',
      notes: 'جميع الأصناف مُعلَّمة. صنفان قاربا على الانتهاء — تم الإبلاغ لأولوية التوزيع.',
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
          _id: id(), batch: batch2Id, item: item_mk1,
          expiryDate: daysAgo(-5), isExpired: false, isNearExpiry: false,
          quantity: 200, condition: 'good', nameTagPresent: true,
        },
      ],
      status: 'corrective_action_required',
      correctiveActionId: corr1Id,
      notes: 'درجة الحرارة فوق الحد الآمن (9.2 درجة بدلاً من 8 كحد أقصى). تحتاج إجراءً تصحيحياً فورياً.',
      createdAt: daysAgo(0), updatedAt: daysAgo(0),
    },
  ]);

  // ─── 9. Spoilage Records ──────────────────────────────────────────────────────
  await db.collection('spoilagerecords').insertMany([
    {
      _id: id(),
      item: item_sn1,
      batch: batch3Id,
      project: projectId,
      quantity: 15,
      reason: 'temperature_issue',
      alertType: 'temperature_breach',
      location: 'الطابق 3 — مخزن مبرد',
      storageZone: 'chilled',
      date: daysAgo(0),
      daysUntilExpiry: 3,
      notes: '15 حبة زبادي تأثرت بارتفاع درجة الحرارة. تم سحبها من الخدمة.',
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
        { _id: id(), item: item_w2,  quantity: 20  },
        { _id: id(), item: item_cp2, quantity: 100 },
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
        { _id: id(), item: item_sl2, quantity: 30 },
      ],
      createdBy: assistantId,
      confirmedBy: supervisorId,
      createdAt: daysAgo(3), updatedAt: daysAgo(3),
    },
  ]);

  // ─── 11. Menu ────────────────────────────────────────────────────────────────
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  await db.collection('menus').insertMany([
    {
      _id: id(), project: projectId, date: todayStart, mealType: 'breakfast', status: 'active',
      notes: 'الوجبة تُقدَّم من 7:00 صباحاً حتى 9:00 صباحاً',
      items: [
        { name: 'ساندويتش بيض مع جبنة',   quantity: 2,  unit: 'قطعة' },
        { name: 'عصير برتقال طازج',        quantity: 1,  unit: 'كوب'  },
        { name: 'لبن',                     quantity: 1,  unit: 'كوب'  },
        { name: 'تمر',                     quantity: 3,  unit: 'حبة'  },
      ],
      createdBy: supervisorId, createdAt: daysAgo(0), updatedAt: daysAgo(0),
    },
    {
      _id: id(), project: projectId, date: todayStart, mealType: 'lunch', status: 'active',
      notes: 'وجبة الغداء من 12:00 ظهراً حتى 2:00 مساءً',
      items: [
        { name: 'أرز بسمتي مع دجاج مشوي', quantity: 1,  unit: 'طبق'  },
        { name: 'سلطة فتوش',              quantity: 1,  unit: 'طبق'  },
        { name: 'خبز',                    quantity: 2,  unit: 'رغيف' },
        { name: 'مياه معدنية',            quantity: 1,  unit: 'زجاجة'},
        { name: 'فاكهة الموسم',           quantity: 1,  unit: 'حصة'  },
      ],
      createdBy: supervisorId, createdAt: daysAgo(0), updatedAt: daysAgo(0),
    },
    {
      _id: id(), project: projectId, date: todayStart, mealType: 'coffee_break', status: 'active',
      notes: 'كوفي بريك الساعة 10:30 صباحاً',
      items: [
        { name: 'قهوة عربية',             quantity: 1,  unit: 'فنجان'},
        { name: 'شاي كرك',               quantity: 1,  unit: 'كوب'  },
        { name: 'تمر سكري',              quantity: 3,  unit: 'حبة'  },
        { name: 'معمول',                  quantity: 1,  unit: 'قطعة' },
      ],
      createdBy: assistantId, createdAt: daysAgo(0), updatedAt: daysAgo(0),
    },
  ]);

  // ─── 12. Audit Logs ───────────────────────────────────────────────────────────
  await db.collection('auditlogs').insertMany([
    { _id: id(), user: adminId,      action: 'login',   entityType: 'user',              entityId: adminId,      createdAt: daysAgo(7) },
    { _id: id(), user: adminId,      action: 'create',  entityType: 'project',           entityId: projectId,    createdAt: daysAgo(7) },
    { _id: id(), user: adminId,      action: 'create',  entityType: 'building',          entityId: buildingId,   createdAt: daysAgo(7) },
    { _id: id(), user: supervisorId, action: 'login',   entityType: 'user',              entityId: supervisorId, createdAt: daysAgo(6) },
    { _id: id(), user: supervisorId, action: 'submit',  entityType: 'floor_check',       entityId: (floorCheckDocs[0] as any)._id, createdAt: daysAgo(6) },
    { _id: id(), user: assistantId,  action: 'review',  entityType: 'floor_check',       entityId: (floorCheckDocs[0] as any)._id, createdAt: daysAgo(5) },
    { _id: id(), user: managerId,    action: 'approve', entityType: 'floor_check',       entityId: (floorCheckDocs[0] as any)._id, createdAt: daysAgo(5) },
    { _id: id(), user: managerId,    action: 'export',  entityType: 'floor_check',       entityId: (floorCheckDocs[0] as any)._id, createdAt: daysAgo(4) },
    { _id: id(), user: supervisorId, action: 'login',   entityType: 'user',              entityId: supervisorId, createdAt: daysAgo(3) },
    { _id: id(), user: adminId,      action: 'create',  entityType: 'item',              entityId: item_sw1,     createdAt: daysAgo(7) },
    { _id: id(), user: managerId,    action: 'login',   entityType: 'user',              entityId: managerId,    createdAt: daysAgo(2) },
    { _id: id(), user: clientId,     action: 'login',   entityType: 'user',              entityId: clientId,     createdAt: daysAgo(1) },
    { _id: id(), user: managerId,    action: 'create',  entityType: 'purchase_order',    entityId: po1Id,        details: 'إنشاء PO-2025-05-001 — شركة الخير للأغذية',            createdAt: daysAgo(7) },
    { _id: id(), user: managerId,    action: 'create',  entityType: 'purchase_order',    entityId: po2Id,        details: 'إنشاء PO-2025-05-002 — النور لمستلزمات الضيافة',        createdAt: daysAgo(7) },
    { _id: id(), user: assistantId,  action: 'create',  entityType: 'receiving_record',  entityId: recv1Id,      details: 'استلام توصيل INV-2025-1142',                            createdAt: daysAgo(5) },
    { _id: id(), user: supervisorId, action: 'confirm', entityType: 'receiving_record',  entityId: recv1Id,      details: 'تأكيد سجل الاستلام INV-2025-1142',                      createdAt: daysAgo(4) },
    { _id: id(), user: assistantId,  action: 'create',  entityType: 'receiving_record',  entityId: recv3Id,      details: 'استلام جزئي INV-2025-1175',                             createdAt: daysAgo(2) },
    { _id: id(), user: clientId,     action: 'create',  entityType: 'client_request',    entityId: cr1Id,        details: 'طلب إعادة تعبئة ساندويتش الفطور — الطابق 2',           createdAt: daysAgo(0) },
    { _id: id(), user: clientId,     action: 'create',  entityType: 'client_request',    entityId: cr2Id,        details: 'إعداد كوفي بريك — قاعة الاجتماعات الطابق 3',           createdAt: daysAgo(1) },
    { _id: id(), user: supervisorId, action: 'create',  entityType: 'maintenance_request', entityId: mr1Id,      details: 'إبلاغ: عطل مكينة الاسبريسو — الطابق 2',               createdAt: daysAgo(0) },
    { _id: id(), user: supervisorId, action: 'create',  entityType: 'maintenance_request', entityId: mr2Id,      details: 'إبلاغ: عطل وحدة التكييف — الطابق 3',                  createdAt: daysAgo(2) },
    { _id: id(), user: assistantId,  action: 'create',  entityType: 'fridge_check',      entityId: fc1Id,        details: 'فحص الثلاجة — المخزن البارد الطابق 2',                 createdAt: daysAgo(1) },
    { _id: id(), user: assistantId,  action: 'create',  entityType: 'fridge_check',      entityId: fc2Id,        details: 'فحص الثلاجة — مشكلة درجة حرارة الطابق 3',             createdAt: daysAgo(0) },
    { _id: id(), user: supervisorId, action: 'create',  entityType: 'corrective_action', entityId: corr1Id,      details: 'فتح إجراء تصحيحي لخرق درجة الحرارة — الطابق 3',        createdAt: daysAgo(0) },
    { _id: id(), user: assistantId,  action: 'create',  entityType: 'spoilage_record',   entityId: projectId,    details: 'تسجيل تلف 15 حبة زبادي بسبب ارتفاع درجة الحرارة',     createdAt: daysAgo(0) },
    { _id: id(), user: supervisorId, action: 'create',  entityType: 'client_request',    entityId: cr7Id,        details: 'ضيافة طارئة — طابق الأمن',                             createdAt: daysAgo(2) },
    { _id: id(), user: clientId,     action: 'create',  entityType: 'client_request',    entityId: cr4Id,        details: 'كوفي بريك VIP — الطابق 19',                            createdAt: daysAgo(4) },
  ]);

  console.log('✅ Auto-seed complete: 5 users (@mirsad.com / demo1234), 15 Arabic categories, 72 items, 56 floor checks, 2 suppliers, 2 purchase orders, 3 receiving records, 8 client requests, 3 maintenance requests, 4 batches, 2 fridge checks, 1 spoilage record, 1 corrective action, 2 transfers, 3 menus, 27 audit logs');
}
