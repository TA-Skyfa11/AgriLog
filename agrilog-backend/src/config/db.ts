import path from 'path';
import postgres from 'postgres';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Ensure .env is loaded from agrilog-backend directory or current working directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

// Connection strings provided via environment variables
const DIRECT_URL = process.env.DATABASE_URL || '';
const POOLER_URL = process.env.DATABASE_POOLER_URL || process.env.DATABASE_URL || '';

export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';

// Initialize Supabase JS Client
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_KEY || 'placeholder-key'
);

// Choose appropriate connection string:
// If on local/IPv4 environment where direct hostname has no IPv4 A-record, prefer POOLER_URL
let activeConnString = POOLER_URL || DIRECT_URL;
if (process.env.FORCE_DIRECT_DB === 'true' && DIRECT_URL) {
  activeConnString = DIRECT_URL;
}

if (!activeConnString) {
  console.warn('⚠️ [AgriLog DB Warning] DATABASE_URL or DATABASE_POOLER_URL is missing! Please configure .env file.');
}
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ [AgriLog Supabase Warning] SUPABASE_URL or SUPABASE_KEY is missing! Please configure .env file.');
}

export const sql = postgres(activeConnString || 'postgresql://localhost:5432/postgres', {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 15,
});

export const getSql = () => sql;

export const ALL_TABLES = [
  'users',
  'farm_profiles',
  'company_profiles',
  'cultivation_boards',
  'cultivation_entries',
  'fertilizer_boards',
  'fertilizer_entries',
  'pesticide_boards',
  'pesticide_entries',
  'materials',
  'material_logs',
  'notifications',
  'orders',
  'payment_transactions',
  'products',
  'service_packages',
  'system_features',
  'tasks',
  'trial_settings',
  'upload_logs',
  'commission_settings',
  'login_histories',
  'sessions'
];

/**
 * Initializes all required tables and performance indexes in Supabase PostgreSQL
 */
export const initSupabaseSchema = async () => {
  for (const tbl of ALL_TABLES) {
    if (tbl === 'sessions') {
      await sql.unsafe(`
        CREATE TABLE IF NOT EXISTS public.sessions (
          sid VARCHAR(255) PRIMARY KEY,
          sess JSONB NOT NULL,
          expire TIMESTAMPTZ NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_sessions_expire ON public.sessions (expire);
      `);
      continue;
    }

    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.${tbl} (
        id VARCHAR(64) PRIMARY KEY,
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_${tbl}_created_at ON public.${tbl} (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_${tbl}_data ON public.${tbl} USING gin (data);
    `);
  }

  // Commonly queried B-tree indexes for fast queries
  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_users_email ON users ((data->>'email'))`,
    `CREATE INDEX IF NOT EXISTS idx_users_role ON users ((data->>'role'))`,
    `CREATE INDEX IF NOT EXISTS idx_users_google_id ON users ((data->>'googleId'))`,
    `CREATE INDEX IF NOT EXISTS idx_farm_profiles_user ON farm_profiles ((data->>'user'))`,
    `CREATE INDEX IF NOT EXISTS idx_company_profiles_user ON company_profiles ((data->>'user'))`,
    `CREATE INDEX IF NOT EXISTS idx_cult_boards_profile ON cultivation_boards ((data->>'farmProfile'))`,
    `CREATE INDEX IF NOT EXISTS idx_cult_boards_group ON cultivation_boards ((data->>'groupId'))`,
    `CREATE INDEX IF NOT EXISTS idx_cult_entries_board ON cultivation_entries ((data->>'cultivationBoard'))`,
    `CREATE INDEX IF NOT EXISTS idx_cult_entries_group ON cultivation_entries ((data->>'entryGroupId'))`,
    `CREATE INDEX IF NOT EXISTS idx_fert_boards_profile ON fertilizer_boards ((data->>'farmProfile'))`,
    `CREATE INDEX IF NOT EXISTS idx_fert_boards_group ON fertilizer_boards ((data->>'groupId'))`,
    `CREATE INDEX IF NOT EXISTS idx_fert_entries_board ON fertilizer_entries ((data->>'fertilizerBoard'))`,
    `CREATE INDEX IF NOT EXISTS idx_fert_entries_mat ON fertilizer_entries ((data->>'material'))`,
    `CREATE INDEX IF NOT EXISTS idx_pest_boards_profile ON pesticide_boards ((data->>'farmProfile'))`,
    `CREATE INDEX IF NOT EXISTS idx_pest_boards_group ON pesticide_boards ((data->>'groupId'))`,
    `CREATE INDEX IF NOT EXISTS idx_pest_entries_board ON pesticide_entries ((data->>'pesticideBoard'))`,
    `CREATE INDEX IF NOT EXISTS idx_pest_entries_mat ON pesticide_entries ((data->>'material'))`,
    `CREATE INDEX IF NOT EXISTS idx_materials_profile ON materials ((data->>'farmProfile'))`,
    `CREATE INDEX IF NOT EXISTS idx_materials_type ON materials ((data->>'type'))`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications ((data->>'user'))`,
    `CREATE INDEX IF NOT EXISTS idx_orders_farm ON orders ((data->>'farm'))`,
    `CREATE INDEX IF NOT EXISTS idx_orders_company ON orders ((data->>'company'))`,
    `CREATE INDEX IF NOT EXISTS idx_products_company ON products ((data->>'company'))`,
    `CREATE INDEX IF NOT EXISTS idx_products_status ON products ((data->>'status'))`,
    `CREATE INDEX IF NOT EXISTS idx_products_category ON products ((data->>'category'))`,
    `CREATE INDEX IF NOT EXISTS idx_service_packages_code ON service_packages ((data->>'code'))`,
    `CREATE INDEX IF NOT EXISTS idx_system_features_key ON system_features ((data->>'key'))`,
    `CREATE INDEX IF NOT EXISTS idx_tasks_profile ON tasks ((data->>'farmProfile'))`,
    `CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks ((data->>'parentTaskId'))`,
    `CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks ((data->>'dueDate'))`,
    `CREATE INDEX IF NOT EXISTS idx_payment_user ON payment_transactions ((data->>'user'))`,
    `CREATE INDEX IF NOT EXISTS idx_payment_txcode ON payment_transactions ((data->>'transactionCode'))`,
    `CREATE INDEX IF NOT EXISTS idx_payment_order ON payment_transactions ((data->>'orderId'))`
  ];

  for (const idx of indexes) {
    await sql.unsafe(idx);
  }
};

/**
 * Connect to Supabase PostgreSQL and verify connectivity
 */
export const connectDB = async () => {
  try {
    const res = await sql`SELECT current_database() as db, current_user as usr;`;
    console.log(`✓ Supabase PostgreSQL Connected: Database '${res[0]?.db}' (User '${res[0]?.usr}')`);
    await initSupabaseSchema();
    console.log('✓ Supabase Schema and Indexes verified');
  } catch (error) {
    console.error(`Supabase DB Connection Error: ${(error as Error).message}`);
    throw error;
  }
};

export default sql;
