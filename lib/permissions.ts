export type UserRole = 'Super Admin' | 'Admin' | 'Programmer' | 'Marketing' | 'Finance' | 'Gudang' | 'Viewer';
export type ActionType = 'select' | 'insert' | 'update' | 'delete';

// Modul mapping untuk UI & Navigation
export type ModuleName =
  | 'Kontak'
  | 'Unit Rumah'
  | 'Marketing'
  | 'Gudang'
  | 'Keuangan'
  | 'Penjualan'
  | 'Laporan'
  | 'Pengguna';

// List semua tabel yang ada di aplikasi
export const ALL_TABLES = [
  'users',
  'customers',
  'banks',
  'locations',
  'blocks',
  'unit_types',
  'subsidy_types',
  'sales_steps',
  'certificate_steps',
  'kpr_steps',
  'price_items',
  'units',
  'unit_price_items',
  'marketer_types',
  'marketers',
  'online_bookings',
  'sales',
  'marketer_rights',
  'sales_documents',
  'sale_additional_costs',
  'sale_payments',
  'sale_discounts',
  'sale_billing_letters',
  'sale_step_history',
  'sale_key_handovers',
  'sale_complaints',
  'items',
  'purchases',
  'purchase_items',
  'goods_in',
  'goods_in_items',
  'goods_out',
  'goods_out_items',
  'cash_bank_accounts',
  'chart_of_accounts',
  'bank_loans',
  'cashflow_entries',
  'mandor_advances',
  'operational_expenses',
  'disbursement_requests',
  'company_assets',
  'company_settings',
  'provinsi',
  'kabupaten_kota',
  'kecamatan',
  'kelurahan',
  'trash',
] as const;

export type TableName = (typeof ALL_TABLES)[number];

// Set tabel per kategori untuk mempermudah pengecekan izin
const DASHBOARD_SUMMARY_TABLES = new Set<string>([
  'units',
  'sales',
  'cash_bank_accounts',
  'items',
  'customers',
  'company_settings',
]);

const GUDANG_TABLES = new Set<string>([
  'items',
  'purchases',
  'purchase_items',
  'goods_in',
  'goods_in_items',
  'goods_out',
  'goods_out_items',
]);

const KEUANGAN_TABLES = new Set<string>([
  'cash_bank_accounts',
  'chart_of_accounts',
  'bank_loans',
  'cashflow_entries',
  'mandor_advances',
  'operational_expenses',
  'disbursement_requests',
  'company_assets',
]);

const MARKETING_READ_TABLES = new Set<string>([
  'sales',
  'online_bookings',
  'customers',
  'units',
  'blocks',
  'locations',
  'unit_types',
  'subsidy_types',
  'marketers',
  'marketer_types',
  'marketer_rights',
  'sales_steps',
  'certificate_steps',
  'kpr_steps',
  'price_items',
  'sales_documents',
  'sale_discounts',
  'sale_billing_letters',
  'sale_step_history',
  'sale_key_handovers',
  'sale_complaints',
  'company_settings',
  'provinsi',
  'kabupaten_kota',
  'kecamatan',
  'kelurahan',
]);

const FINANCE_READ_TABLES = new Set<string>([
  ...KEUANGAN_TABLES,
  'sales',
  'sale_payments',
  'sale_additional_costs',
  'sale_discounts',
  'customers',
  'units',
  'banks',
  'company_settings',
  'provinsi',
  'kabupaten_kota',
  'kecamatan',
  'kelurahan',
]);

export function normalizeRole(role?: string): UserRole | string {
  if (!role) return '';
  const r = role.trim().toLowerCase();
  if (r === 'super admin' || r === 'superadmin') return 'Super Admin';
  if (r === 'programmer') return 'Programmer';
  if (r === 'admin') return 'Admin';
  if (r === 'marketing') return 'Marketing';
  if (r === 'finance') return 'Finance';
  if (r === 'gudang') return 'Gudang';
  if (r === 'viewer') return 'Viewer';
  return role.trim();
}

/**
 * Main permission checker function (Single source of truth)
 */
export function hasPermission(
  role: string | undefined,
  table: string,
  action: ActionType
): boolean {
  if (!role) return false;
  const normalized = normalizeRole(role);

  // 0. Tabel regional (wilayah) boleh dibaca oleh semua role yang login
  const REGIONAL_TABLES = ['provinsi', 'kabupaten_kota', 'kecamatan', 'kelurahan'];
  if (action === 'select' && REGIONAL_TABLES.includes(table)) return true;

  // 1. Super Admin & Programmer: full access everywhere
  if (normalized === 'Super Admin' || normalized === 'Programmer') return true;

  // 2. Admin: full access to operational tables (user restrictions handled separately in canModifyUser)
  if (normalized === 'Admin') {
    return true;
  }

  // 3. Marketing: Read-only di modul penjualan/prospek/booking + Pengecualian CRUD di sale_payments & sale_additional_costs
  if (normalized === 'Marketing') {
    if (action === 'select') {
      return (
        MARKETING_READ_TABLES.has(table) ||
        table === 'sale_payments' ||
        table === 'sale_additional_costs'
      );
    }
    // Pengecualian: Marketing boleh input/edit angsuran, biaya tambahan, & diskon
    if (table === 'sale_payments' || table === 'sale_additional_costs' || table === 'sale_discounts') {
      return true;
    }
    return false;
  }

  // 4. Finance: Read-only di modul Keuangan & Laporan
  if (normalized === 'Finance') {
    if (action === 'select') {
      return FINANCE_READ_TABLES.has(table);
    }
    return false;
  }

  // 5. Gudang: Opsi A — Full CRUD pada modul Gudang, Read-Only pada referensi dasar/dashboard
  if (normalized === 'Gudang') {
    if (GUDANG_TABLES.has(table)) {
      return true;
    }
    if (action === 'select') {
      return (
        DASHBOARD_SUMMARY_TABLES.has(table) ||
        table === 'locations' ||
        table === 'blocks'
      );
    }
    return false;
  }

  // 6. Viewer: Read-Only HANYA pada tabel ringkasan dashboard
  if (normalized === 'Viewer') {
    if (action === 'select') {
      return DASHBOARD_SUMMARY_TABLES.has(table);
    }
    return false;
  }

  return false;
}

/**
 * Pengecekan aturan khusus untuk modifikasi baris pada tabel `users`.
 */
export function canModifyUser(
  actingUserRole: string | undefined,
  targetUserRole: string | undefined,
  newDataRole?: string
): { allowed: boolean; reason?: string } {
  if (!actingUserRole) {
    return { allowed: false, reason: 'Pengguna belum terautentikasi.' };
  }

  const actRole = normalizeRole(actingUserRole);
  const tgtRole = normalizeRole(targetUserRole);
  const newRole = normalizeRole(newDataRole);

  if (actRole === 'Super Admin' || actRole === 'Programmer') {
    return { allowed: true };
  }

  if (actRole === 'Admin') {
    if (tgtRole === 'Super Admin' || tgtRole === 'Programmer') {
      return { allowed: false, reason: 'Akses ditolak: Admin tidak dapat mengedit atau menghapus akun Super Admin / Programmer.' };
    }
    if (newRole === 'Super Admin' || newRole === 'Programmer') {
      return { allowed: false, reason: 'Akses ditolak: Admin tidak dapat membuat atau me-assign role Super Admin / Programmer.' };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: 'Akses ditolak: Hanya Super Admin, Programmer, dan Admin yang memiliki izin kelola pengguna.' };
}

/**
 * Cek apakah suatu role boleh mengakses suatu modul di UI navigation.
 */
export function canAccessModule(role: string | undefined, moduleName: ModuleName): boolean {
  if (!role) return false;
  const normalized = normalizeRole(role);
  if (normalized === 'Super Admin' || normalized === 'Programmer' || normalized === 'Admin') return true;

  switch (moduleName) {
    case 'Kontak':
      return normalized === 'Marketing' || normalized === 'Finance';
    case 'Unit Rumah':
      return normalized === 'Marketing' || normalized === 'Finance';
    case 'Marketing':
      return normalized === 'Marketing';
    case 'Gudang':
      return normalized === 'Gudang';
    case 'Keuangan':
      return normalized === 'Finance';
    case 'Penjualan':
      return normalized === 'Marketing' || normalized === 'Finance';
    case 'Laporan':
      return normalized === 'Marketing' || normalized === 'Finance' || normalized === 'Gudang';
    case 'Pengguna':
      return normalized === 'Super Admin' || normalized === 'Programmer' || normalized === 'Admin';
    default:
      return false;
  }
}
