export type UserRole =
  | "Super Admin"
  | "Admin"
  | "Marketing"
  | "Gudang"
  | "Finance"
  | "Viewer";

export interface UserProfile {
  id: string;
  nama: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login_at?: string;
}

export interface Customer {
  id: string;
  nama: string;
  nik: string;
  alamat: string; // compatibility
  no_hp: string;
  email?: string;
  status: "Leads" | "Deal" | "Batal";
  catatan?: string;
  created_at: string;

  // New fields
  is_registered_before?: boolean;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  alamat_ktp?: string;
  alamat_domisili?: string;
  pekerjaan?: string;
  instansi?: string;
  pendapatan_per_bulan?: string;
  npwp?: string;
  status_pernikahan?: string;
  domisili?: string;
  scan_ktp_url?: string;
  scan_kk_url?: string;
  nama_pasangan?: string;
  tempat_lahir_pasangan?: string;
  tanggal_lahir_pasangan?: string;
  pekerjaan_pasangan?: string;
  nik_pasangan?: string;
  no_hp_pasangan?: string;
  alamat_domisili_pasangan?: string;
  bank_rekening_kpr?: string;
  nomor_rekening_kpr?: string;
  kampung_dusun?: string;
  rt?: string;
  rw?: string;
  kelurahan_id?: string;
}

export interface Bank {
  id: string;
  nama_bank: string;
  cabang: string;
  pic_nama: string;
  jabatan_pic?: string;
  pic_hp: string;
  pic_email: string;
  created_at: string;
}

export interface SalesStep {
  id: string;
  nama_step: string;
  urutan: number;
}

export interface CertificateStep {
  id: string;
  nama_step: string;
  urutan: number;
}

export interface KprStep {
  id: string;
  nama_step: string;
  urutan: number;
}

export interface PriceItem {
  id: string;
  nama_item: string;
  nominal: number;
  keterangan?: string;
}

export interface Location {
  id: string;
  nama_lokasi: string;
  alamat: string;
  kode_lokasi?: string;
  kampung_dusun?: string;
  rt?: string;
  rw?: string;
  kelurahan_id?: string;
}

export interface Block {
  id: string;
  location_id: string;
  nama_blok: string;
  location_nama?: string;
}

export interface UnitType {
  id: string;
  nama_type: string;
  luas_tanah: number;
  luas_bangunan: number;
}

export interface SubsidyType {
  id: string;
  nama_type: string;
  keterangan?: string;
}

export interface Unit {
  id: string;
  no_unit: string;
  block_id: string;
  unit_type_id: string;
  subsidy_type_id: string;
  sales_step_id: string;
  certificate_step_id: string;
  harga_dasar: number;
  maksimal_kredit?: number;
  uang_muka?: number;
  booking_fee?: number;
  status: "Tersedia" | "Booking" | "DP" | "Akad" | "Lunas";
  created_at: string;
  nop?: string; // Nomor Objek Pajak
  // Joined fields for composite table
  location_nama?: string;
  location_kode_lokasi?: string;
  block_nama?: string;
  unit_type_nama?: string;
  luas_tanah?: number;
  luas_bangunan?: number;
  subsidy_type_nama?: string;
  sales_step_nama?: string;
  certificate_step_nama?: string;
  customer_nama?: string;
}

export interface MarketerType {
  id: string;
  nama_jenis: string;
  skema_komisi_default: string;
}

export interface Marketer {
  id: string;
  nama: string;
  marketer_type_id: string;
  marketer_type_nama?: string;
  no_hp: string;
  email: string;
  bank_rekening?: string;
  no_rekening?: string;
  is_active: boolean;
  units_handled?: number;
}

export interface OnlineBooking {
  id: string;
  customer_id: string;
  customer_nama?: string;
  customer_hp?: string;
  unit_id: string;
  unit_no?: string;
  tanggal_booking: string;
  status: "Baru" | "Diproses" | "Deal" | "Batal";
  sumber: string;
}

export interface MarketerRight {
  id: string;
  marketer_id: string;
  marketer_nama?: string;
  sale_id: string;
  customer_nama?: string;
  unit_no?: string;
  persen_fee: number;
  nominal_fee: number;
  status_pencairan: "Belum" | "Sebagian" | "Lunas";
}

export interface InventoryItem {
  id: string;
  nama_barang: string;
  satuan: string;
  kategori: string;
  stok: number;
  min_stok: number;
  harga_satuan: number;
}
export interface Purchase {
  id: string;
  no_po: string;
  supplier: string;
  toko_alamat?: string;
  toko_telepon?: string;
  tanggal: string;
  lokasi?: string;
  blok?: string;
  catatan?: string;
  termin?: string;
  biaya_pengiriman: number;
  pajak: number;
  metode_pembayaran?: string;
  penerima?: string;
  alamat_kirim?: string;
  admin?: string;
  total_harga: number;
  status: "Belum ditanggapi" | "Disetujui" | "Selesai" | "Ditolak";
  created_at?: string;
  items: PurchaseItem[];
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  item_id: string;
  qty: number;
  harga_satuan: number;
  nama_barang?: string;
  satuan?: string;
}
export interface GoodsIn {
  id: string;
  purchase_id?: string;
  no_po?: string;
  tanggal: string;
  catatan?: string;
  items?: { item_id: string; item_nama?: string; qty: number }[];
}

export interface GoodsOut {
  id: string;
  tanggal: string;
  tujuan_pemakaian: string;
  unit_id?: string;
  unit_no?: string;
  catatan?: string;
  items?: { item_id: string; item_nama?: string; qty: number }[];
}

export interface CashBankAccount {
  id: string;
  nama_akun: string;
  jenis: "Kas" | "Bank";
  no_rekening?: string;
  saldo: number;
}

export interface ChartOfAccount {
  id: string;
  kode_akun: string;
  nama_akun: string;
  kategori: "Aset" | "Kewajiban" | "Ekuitas" | "Pendapatan" | "Beban";
}

export interface BankLoan {
  id: string;
  account_id: string;
  bank_nama?: string;
  keterangan?: string;
  total_hutang: number;
  total_terbayar: number;
  // Legacy fields (optional backward compat)
  bank_id?: string;
  nominal_pinjaman?: number;
  bunga?: number;
  tenor?: number;
  sisa_hutang?: number;
}

export interface CashflowEntry {
  id: string;
  account_id: string;
  account_nama?: string;
  tanggal: string;
  jenis: "Masuk" | "Keluar";
  nominal: number;
  keterangan: string;
}

export interface MandorAdvance {
  id: string;
  nama_mandor: string;
  tanggal: string;
  nominal: number;
  keterangan: string;
  status: "Belum Lunas" | "Lunas";
}

export interface OperationalExpense {
  id: string;
  kategori: string;
  tanggal: string;
  nominal: number;
  bukti_url?: string;
  keterangan?: string;
}

export interface DisbursementRequest {
  id: string;
  jenis_pengajuan: string;
  nominal: number;
  tanggal: string;
  status_approval: "Diajukan" | "Disetujui" | "Dicairkan" | "Ditolak";
  requested_by: string;
}

export interface CompanyAsset {
  id: string;
  nomor_aset?: string;
  nama_aset: string;
  keterangan?: string;
  nilai_perolehan: number;
  tanggal_perolehan: string;
  penyusutan: number;
  kondisi?: "Baik" | "Perlu Perbaikan" | "Rusak";
}

export interface Sale {
  id: string;
  customer_id: string;
  customer_nama?: string;
  unit_id: string;
  unit_no?: string;
  location_nama?: string;
  block_nama?: string;
  bank_id?: string;
  bank_nama?: string;
  marketer_id?: string;
  marketer_nama?: string;
  tanggal_booking: string;
  tanggal_transaksi?: string;
  tanggal_akad?: string;
  total_harga: number;
  harga_kesepakatan?: number;
  diskon?: number;
  booking_fee: number;
  dp_nominal: number;
  metode_bayar: "Cash" | "Cash Bertahap" | "Cash Keras" | "KPR";
  kpr_status?:
    | "Berkas Lengkap"
    | "Wawancara"
    | "OTS"
    | "SP3K"
    | "Akad"
    | "ACCEPTED"
    | "REJECTED"
    | string;
  status: "Booking" | "DP" | "Akad" | "Lunas" | "Batal";
  marketing_user_id?: string;
  created_at: string;
  // New Sales Features
  no_penjualan?: string;
  harga_jual_awal?: number;
  potongan?: number;
  komitmen_pembayaran?: string;
  harga_jual_pajak?: number;
  kredit_pengajuan?: number;
  fee_marketer?: number;
  customer_hp?: string;
  customer_job?: string;
  customer_nik?: string;
  unit_type_nama?: string;
  subsidy_type_nama?: string;
}

export interface SaleAdditionalCost {
  id: string;
  sale_id: string;
  nominal: number;
  keterangan: string;
  created_at: string;
}

export interface SalePayment {
  id: string;
  sale_id: string;
  no_kwitansi: string;
  tanggal: string;
  deskripsi: string;
  nominal: number;
  bank_tujuan?: string;
  diterima_dari?: string;
  created_at: string;
}

export interface SaleBillingLetter {
  id: string;
  sale_id: string;
  tgl_tagihan: string;
  jatuh_tempo: string;
  kekurangan: number;
  created_at: string;
}

export interface SaleStepHistory {
  id: string;
  sale_id: string;
  jenis_step:
    | "penjualan"
    | "sertifikat"
    | "posisi_sertifikat"
    | "marketing_fee"
    | "pindah_unit"
    | "kpr_berkas";
  status: string;
  keterangan?: string;
  changed_by?: string;
  created_at: string;
  changed_by_nama?: string; // Joined field
}
export interface SaleDiscount {
  id: string;
  sale_id: string;
  tanggal: string;
  nominal: number;
  keterangan?: string;
  created_at: string;
}
export interface SaleKprSubmission {
  id: string;
  sale_id: string;
  no_referensi?: string;
  tanggal: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  kredit_acc: number;
  biaya_tambahan: number;
  keterangan?: string;
  created_at: string;
}
export interface CompanySettings {
  id: string;

  nama_perusahaan: string;

  direktur_nama: string;
  direktur_nik: string;
  direktur_jabatan: string;

  alamat_kantor: string;
  telp_kantor: string;

  email?: string;
  website?: string;
  logo_url?: string;

  npwp?: string;
  created_at?: string;
}

export interface MarketingFeeDisbursement {
  id: string;
  sale_id: string;
  tanggal: string;
  nominal: number;
  rekening?: string;
  keterangan?: string;
  created_at?: string;
}
export interface Mandor {
  id: string;
  nama_mandor: string;
  spesialis?: string;
  total_pekerjaan: number;
  belum_selesai: number;
  selesai: number;
  created_at?: string;
}

export interface TrashItem {
  id: string;
  source_table: string;
  record_id: string;
  record_label?: string;
  record_data: string | Record<string, any>;
  deleted_by?: string;
  deleted_by_nama?: string;
  deleted_at: string;
}

export interface MarketingFee {
  id: string;
  marketer_type_id: string;
  kategori_unit: string;
  booking_fee: number | null;
  akad_fee: number | null;
  created_at?: string;
  updated_at?: string;
}

export const KATEGORI_UNIT_LIST = [
  "30/72",
  "33/66",
  "36/72 (BATA MERAH)",
  "36/72 (BATA RINGAN)",
  "36/72 (BATAKO)",
  "RUKO",
  "Subsidi",
] as const;

