import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB, getSql } from '../../config/db';
import { User, Role } from '../../models/User';
import { FarmProfile } from '../../models/FarmProfile';
import { CompanyProfile } from '../../models/CompanyProfile';
import { Material } from '../../models/Material';
import { CultivationBoard } from '../../models/CultivationBoard';
import { CultivationEntry } from '../../models/CultivationEntry';
import { FertilizerBoard } from '../../models/FertilizerBoard';
import { FertilizerEntry } from '../../models/FertilizerEntry';
import { PesticideBoard } from '../../models/PesticideBoard';
import { PesticideEntry } from '../../models/PesticideEntry';
import { Product } from '../../models/Product';
import { Order } from '../../models/Order';
import { Task } from '../../models/Task';
import { Notification } from '../../models/Notification';
import { ServicePackage } from '../../models/ServicePackage';
import sampleData from './sample_data.json';

export const TEST_PASSWORD_PLAIN = 'TestSecret123!';
export const JWT_SECRET = process.env.JWT_SECRET || 'agrilog-super-secret-jwt-key-2026';

/**
 * Generate a valid test JWT token for a specific user ID and role
 */
export function generateTestToken(userId: string, role: string = Role.FARM): string {
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Get HTTP Authorization header object for testing
 */
export function getTestAuthHeaders(userId: string, role: string = Role.FARM) {
  return {
    Authorization: `Bearer ${generateTestToken(userId, role)}`,
    'Content-Type': 'application/json'
  };
}

export const TEST_FIXTURE_IDS = {
  ADMIN_USER_ID: 'test_user_admin_001',
  FARM_USER_ID: 'test_user_farm_001',
  COMPANY_USER_ID: 'test_user_company_001',
  LOCKED_USER_ID: 'test_user_locked_001',
  FARM_PROFILE_ID: 'test_farm_profile_001',
  COMPANY_PROFILE_ID: 'test_comp_profile_001',
  FERT_MAT_ID: 'test_mat_fert_001',
  PEST_MAT_ID: 'test_mat_pest_001',
  SEED_MAT_ID: 'test_mat_seed_001',
  CULT_BOARD_ID: 'test_cult_board_001',
  CULT_ENTRY_1_ID: 'test_cult_entry_001',
  CULT_ENTRY_2_ID: 'test_cult_entry_002',
  FERT_BOARD_ID: 'test_fert_board_001',
  FERT_ENTRY_ID: 'test_fert_entry_001',
  PEST_BOARD_ID: 'test_pest_board_001',
  PEST_ENTRY_ID: 'test_pest_entry_001',
  PRODUCT_1_ID: 'test_prod_001',
  PRODUCT_2_ID: 'test_prod_002',
  PRODUCT_3_ID: 'test_prod_003',
  ORDER_ID: 'test_order_001',
  TASK_1_ID: 'test_task_001',
  TASK_2_ID: 'test_task_002',
  TASK_3_ID: 'test_task_003',
  NOTIF_ID: 'test_notif_001',
  PKG_FREE_ID: 'test_pkg_free_001',
  PKG_STD_ID: 'test_pkg_standard_001',
  PKG_PREM_ID: 'test_pkg_premium_001',
};

/**
 * Seed all test fixtures into Supabase PostgreSQL.
 * Safe and idempotent: cleans up any existing test fixture IDs before creating.
 */
export async function seedTestFixtures(): Promise<void> {
  await connectDB();
  await cleanupTestFixtures();

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(TEST_PASSWORD_PLAIN, salt);

  // 1. Users
  for (const u of sampleData.users) {
    await User.create({
      _id: u.id,
      email: u.email,
      name: u.name,
      passwordHash,
      role: u.role,
      isActive: u.isActive,
      allowDevPayment: u.allowDevPayment,
    });
  }

  // 2. Profiles
  for (const fp of sampleData.farmProfiles) {
    await FarmProfile.create({
      _id: fp.id,
      user: fp.user,
      farmName: fp.farmName,
      address: fp.address,
      areaSqm: fp.areaSqm,
      mainCropType: fp.mainCropType,
      subscription: fp.subscription,
      notificationPreferences: fp.notificationPreferences,
    });
  }

  for (const cp of sampleData.companyProfiles) {
    await CompanyProfile.create({
      _id: cp.id,
      user: cp.user,
      companyName: cp.companyName,
      taxCode: cp.taxCode,
      address: cp.address,
      phone: cp.phone,
      email: cp.email,
      isVerified: cp.isVerified,
    });
  }

  // 3. Materials
  for (const m of sampleData.materials) {
    await Material.create({
      _id: m.id,
      farmProfile: m.farmProfile,
      name: m.name,
      type: m.type,
      quantity: m.quantity,
      unit: m.unit,
      supplier: m.supplier,
    });
  }

  // 4. Cultivation Boards & Entries
  for (const cb of sampleData.cultivationBoards) {
    await CultivationBoard.create({
      _id: cb.id,
      farmProfile: cb.farmProfile,
      cropName: cb.cropName,
      variety: cb.variety,
      areaSqm: cb.areaSqm,
      startDate: new Date(cb.startDate),
      status: cb.status,
    });
  }

  for (const ce of sampleData.cultivationEntries) {
    await CultivationEntry.create({
      _id: ce.id,
      cultivationBoard: ce.cultivationBoard,
      date: new Date(ce.date),
      stage: ce.stage,
      action: ce.action,
      notes: ce.notes,
    });
  }

  // 5. Fertilizer Boards & Entries
  for (const fb of sampleData.fertilizerBoards) {
    await FertilizerBoard.create({
      _id: fb.id,
      farmProfile: fb.farmProfile,
      cropName: fb.cropName,
      season: fb.season,
      status: fb.status,
    });
  }

  for (const fe of sampleData.fertilizerEntries) {
    await FertilizerEntry.create({
      _id: fe.id,
      fertilizerBoard: fe.fertilizerBoard,
      material: fe.material,
      date: new Date(fe.date),
      amount: fe.amount,
      unit: fe.unit,
      method: fe.method,
      notes: fe.notes,
    });
  }

  // 6. Pesticide Boards & Entries
  for (const pb of sampleData.pesticideBoards) {
    await PesticideBoard.create({
      _id: pb.id,
      farmProfile: pb.farmProfile,
      cropName: pb.cropName,
      season: pb.season,
      status: pb.status,
    });
  }

  for (const pe of sampleData.pesticideEntries) {
    await PesticideEntry.create({
      _id: pe.id,
      pesticideBoard: pe.pesticideBoard,
      material: pe.material,
      date: new Date(pe.date),
      targetPest: pe.targetPest,
      dosage: pe.dosage,
      unit: pe.unit,
      quarantineDays: pe.quarantineDays,
      safeHarvestDate: new Date(pe.safeHarvestDate),
      notes: pe.notes,
    });
  }

  // 7. Products
  for (const prod of sampleData.products) {
    await Product.create({
      _id: prod.id,
      company: prod.company,
      name: prod.name,
      description: prod.description,
      category: prod.category,
      price: prod.price,
      stockQuantity: prod.stockQuantity,
      unit: prod.unit,
      status: prod.status,
      isAvailable: prod.isAvailable,
    });
  }

  // 8. Orders
  for (const ord of sampleData.orders) {
    await Order.create({
      _id: ord.id,
      farm: ord.farm,
      company: ord.company,
      items: ord.items,
      totalAmount: ord.totalAmount,
      commissionFee: ord.commissionFee,
      status: ord.status,
      shippingAddress: ord.shippingAddress,
      paymentMethod: ord.paymentMethod,
    });
  }

  // 9. Tasks
  for (const t of sampleData.tasks) {
    await Task.create({
      _id: t.id,
      farmProfile: t.farmProfile,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: new Date(t.dueDate),
    });
  }

  // 10. Notifications
  for (const n of sampleData.notifications) {
    await Notification.create({
      _id: n.id,
      user: n.user,
      title: n.title,
      message: n.message,
      type: n.type,
      referenceId: n.referenceId,
      isRead: n.isRead,
    });
  }

  // 11. Service Packages
  for (const pkg of sampleData.servicePackages) {
    await ServicePackage.create({
      _id: pkg.id,
      code: pkg.code,
      name: pkg.name,
      price: pkg.price,
      durationMonths: pkg.durationMonths,
      features: pkg.features,
      isActive: pkg.isActive,
    });
  }

  console.log('✓ Successfully seeded all test fixtures into Supabase PostgreSQL.');
}

/**
 * Safely remove all test fixtures (identified by 'test_%' prefix).
 * Never touches real or main seeder data.
 */
export async function cleanupTestFixtures(): Promise<void> {
  const sql = getSql();
  const tables = [
    'users',
    'farm_profiles',
    'company_profiles',
    'materials',
    'cultivation_boards',
    'cultivation_entries',
    'fertilizer_boards',
    'fertilizer_entries',
    'pesticide_boards',
    'pesticide_entries',
    'products',
    'orders',
    'tasks',
    'notifications',
    'service_packages'
  ];

  for (const tbl of tables) {
    await sql.unsafe(`DELETE FROM public.${tbl} WHERE id LIKE 'test_%'`);
  }

  // Clean any test users created by registration tests
  await sql.unsafe(`DELETE FROM public.users WHERE data->>'email' LIKE '%.test@%' OR data->>'email' LIKE 'test.%'`);
  console.log('✓ Cleaned up all test fixture records.');
}
