import {
  Customer,
  Bank,
  SalesStep,
  CertificateStep,
  PriceItem,
  Location,
  Block,
  UnitType,
  SubsidyType,
  Unit,
  MarketerType,
  Marketer,
  OnlineBooking,
  MarketerRight,
  InventoryItem,
  Purchase,
  GoodsIn,
  GoodsOut,
  CashBankAccount,
  ChartOfAccount,
  BankLoan,
  CashflowEntry,
  MandorAdvance,
  OperationalExpense,
  DisbursementRequest,
  CompanyAsset,
  Sale,
  UserProfile,
  UserRole,
} from "@/types";

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "c1",
    nama: "Budi Santoso",
    nik: "3275011204850001",
    alamat: "Jl. Merdeka No. 45, Jakarta Selatan",
    no_hp: "081298765432",
    email: "budi.santoso@gmail.com",
    status: "Deal",
    catatan: "Mengambil KPR Bank BTN Tipe 45/90",
    created_at: "2026-07-15T09:30:00Z",
  },
  {
    id: "c2",
    nama: "Siti Rahmawati",
    nik: "3275025508900003",
    alamat: "Jl. Anggrek III No. 12, Tangerang",
    no_hp: "081311223344",
    email: "siti.rahma@yahoo.com",
    status: "Leads",
    catatan: "Tertarik Tipe 36/72 Serpong, menunggu survey akhir pekan",
    created_at: "2026-07-28T14:15:00Z",
  },
  {
    id: "c3",
    nama: "Hendrik Pratama",
    nik: "3171031902880005",
    alamat: "Komp. BSD City Blok F2, Tangerang Selatan",
    no_hp: "085678901234",
    email: "hendrik.p@hotmail.com",
    status: "Deal",
    catatan: "Pembelian Cash Bertahap Tipe 60/120",
    created_at: "2026-06-10T11:00:00Z",
  },
];

export const INITIAL_BANKS: Bank[] = [
  {
    id: "b1",
    nama_bank: "Bank BTN",
    cabang: "KCP Serpong",
    pic_nama: "Ahmad Fauzi",
    pic_hp: "081122334455",
    pic_email: "afauzi@btn.co.id",
    created_at: "2026-01-10T00:00:00Z",
  },
  {
    id: "b2",
    nama_bank: "Bank BRI",
    cabang: "KC BSD",
    pic_nama: "Dewi Lestari",
    pic_hp: "081233445566",
    pic_email: "dewi.lestari@bri.co.id",
    created_at: "2026-01-15T00:00:00Z",
  },
  {
    id: "b3",
    nama_bank: "Bank Mandiri",
    cabang: "KC Alam Sutera",
    pic_nama: "Rian Hidayat",
    pic_hp: "081344556677",
    pic_email: "rian.hidayat@bankmandiri.co.id",
    created_at: "2026-02-01T00:00:00Z",
  },
];

export const INITIAL_SALES_STEPS: SalesStep[] = [
  { id: "ss1", nama_step: "1. Tersedia", urutan: 1 },
  { id: "ss2", nama_step: "2. Booking Fee", urutan: 2 },
  { id: "ss3", nama_step: "3. Pemberkasan KPR", urutan: 3 },
  { id: "ss4", nama_step: "4. Wawancara Bank", urutan: 4 },
  { id: "ss5", nama_step: "5. SP3K Terbit", urutan: 5 },
  { id: "ss6", nama_step: "6. Akad & Lunas", urutan: 6 },
];

export const INITIAL_CERTIFICATE_STEPS: CertificateStep[] = [
  { id: "cs1", nama_step: "Proses BPN", urutan: 1 },
  { id: "cs2", nama_step: "SHGB Terbit", urutan: 2 },
  { id: "cs3", nama_step: "Pecah Sertifikat SHM", urutan: 3 },
  { id: "cs4", nama_step: "Diserahkan ke Konsumen/Bank", urutan: 4 },
];

export const INITIAL_PRICE_ITEMS: PriceItem[] = [
  {
    id: "pi1",
    nama_item: "Harga Dasar Unit",
    nominal: 450000000,
    keterangan: "Harga standar sebelum diskon/biaya KPR",
  },
  {
    id: "pi2",
    nama_item: "Biaya Proses KPR",
    nominal: 15000000,
    keterangan: "Notaris, Asuransi, Appraisal",
  },
  {
    id: "pi3",
    nama_item: "Biaya AJB & BBN",
    nominal: 12000000,
    keterangan: "Akta Jual Beli & Balik Nama",
  },
  {
    id: "pi4",
    nama_item: "BPHTB",
    nominal: 18000000,
    keterangan: "Bea Perolehan Hak atas Tanah dan Bangunan",
  },
];

export const INITIAL_LOCATIONS: Location[] = [
  {
    id: "loc1",
    nama_lokasi: "Perumahan Benteng Mutiara Mas",
    alamat:
      "Perum Benteng Mutiara Mas, Desa Benteng Kec. Cempaka Kab. Purwakarta",
    kode_lokasi: "BMM",
  },
  {
    id: "loc2",
    nama_lokasi: "Lansena Grand Hill Cibubur",
    alamat: "Jl. Transyogi KM 6, Cibubur, Bogor",
    kode_lokasi: "LGH",
  },
];

export const INITIAL_BLOCKS: Block[] = [
  {
    id: "blk1",
    location_id: "loc1",
    nama_blok: "Blok A (Emerald)",
    location_nama: "Perumahan Benteng Mutiara Mas",
  },
  {
    id: "blk2",
    location_id: "loc1",
    nama_blok: "Blok B (Sapphire)",
    location_nama: "Perumahan Benteng Mutiara Mas",
  },
  {
    id: "blk3",
    location_id: "loc2",
    nama_blok: "Blok C (Diamond)",
    location_nama: "Lansena Grand Hill Cibubur",
  },
];

export const INITIAL_UNIT_TYPES: UnitType[] = [
  {
    id: "ut1",
    nama_type: "Tipe 36/72 (Lotus)",
    luas_tanah: 72,
    luas_bangunan: 36,
  },
  {
    id: "ut2",
    nama_type: "Tipe 45/90 (Orchid)",
    luas_tanah: 90,
    luas_bangunan: 45,
  },
  {
    id: "ut3",
    nama_type: "Tipe 60/120 (Jasmine)",
    luas_tanah: 120,
    luas_bangunan: 60,
  },
];

export const INITIAL_SUBSIDY_TYPES: SubsidyType[] = [
  {
    id: "sub1",
    nama_type: "Non-Subsidi (Komersial)",
    keterangan: "KPR Komersial / Cash Bertahap",
  },
  {
    id: "sub2",
    nama_type: "Subsidi FLPP",
    keterangan:
      "Kredit Pemilikan Rumah Fasilitas Likuiditas Pembiayaan Perumahan",
  },
];

export const INITIAL_UNITS: Unit[] = [
  {
    id: "u1",
    no_unit: "A-01",
    block_id: "blk1",
    unit_type_id: "ut1",
    subsidy_type_id: "sub1",
    sales_step_id: "ss6",
    certificate_step_id: "cs4",
    harga_dasar: 450000000,
    status: "Lunas",
    created_at: "2026-05-01T00:00:00Z",
    location_nama: "Perumahan Benteng Mutiara Mas",
    block_nama: "Blok A (Emerald)",
    unit_type_nama: "Tipe 36/72 (Lotus)",
    subsidy_type_nama: "Non-Subsidi (Komersial)",
    sales_step_nama: "6. Akad & Lunas",
    certificate_step_nama: "Diserahkan ke Konsumen/Bank",
  },
  {
    id: "u2",
    no_unit: "A-02",
    block_id: "blk1",
    unit_type_id: "ut2",
    subsidy_type_id: "sub1",
    sales_step_id: "ss3",
    certificate_step_id: "cs2",
    harga_dasar: 620000000,
    status: "Booking",
    created_at: "2026-06-12T00:00:00Z",
    location_nama: "Perumahan Benteng Mutiara Mas",
    block_nama: "Blok A (Emerald)",
    unit_type_nama: "Tipe 45/90 (Orchid)",
    subsidy_type_nama: "Non-Subsidi (Komersial)",
    sales_step_nama: "3. Pemberkasan KPR",
    certificate_step_nama: "SHGB Terbit",
  },
  {
    id: "u3",
    no_unit: "B-05",
    block_id: "blk2",
    unit_type_id: "ut1",
    subsidy_type_id: "sub2",
    sales_step_id: "ss1",
    certificate_step_id: "cs1",
    harga_dasar: 185000000,
    status: "Tersedia",
    created_at: "2026-07-01T00:00:00Z",
    location_nama: "Perumahan Benteng Mutiara Mas",
    block_nama: "Blok B (Sapphire)",
    unit_type_nama: "Tipe 36/72 (Lotus)",
    subsidy_type_nama: "Subsidi FLPP",
    sales_step_nama: "1. Tersedia",
    certificate_step_nama: "Proses BPN",
  },
  {
    id: "u4",
    no_unit: "C-10",
    block_id: "blk3",
    unit_type_id: "ut3",
    subsidy_type_id: "sub1",
    sales_step_id: "ss1",
    certificate_step_id: "cs1",
    harga_dasar: 890000000,
    status: "Tersedia",
    created_at: "2026-07-10T00:00:00Z",
    location_nama: "Lansena Grand Hill Cibubur",
    block_nama: "Blok C (Diamond)",
    unit_type_nama: "Tipe 60/120 (Jasmine)",
    subsidy_type_nama: "Non-Subsidi (Komersial)",
    sales_step_nama: "1. Tersedia",
    certificate_step_nama: "Proses BPN",
  },
];

export const INITIAL_MARKETER_TYPES: MarketerType[] = [
  {
    id: "mt1",
    nama_jenis: "Internal Sales",
    skema_komisi_default: "Gaji Pokok + 1.5% Fee dari Harga Unit",
  },
  {
    id: "mt2",
    nama_jenis: "Freelance Marketer",
    skema_komisi_default: "2.5% Fee dari Harga Unit (Akad / Lunas DP)",
  },
  {
    id: "mt3",
    nama_jenis: "Agency Properti",
    skema_komisi_default: "3.0% Fee Per Unit + Bonus Target Overriding",
  },
];

export const INITIAL_MARKETERS: Marketer[] = [
  {
    id: "m1",
    nama: "Doni Kurniawan",
    marketer_type_id: "mt1",
    marketer_type_nama: "Internal Sales",
    no_hp: "081299887766",
    email: "doni.k@lansenaproperty.com",
    is_active: true,
    units_handled: 8,
  },
  {
    id: "m2",
    nama: "Anita Wijaya",
    marketer_type_id: "mt2",
    marketer_type_nama: "Freelance Marketer",
    no_hp: "081388776655",
    email: "anita.wijaya@gmail.com",
    is_active: true,
    units_handled: 4,
  },
];

export const INITIAL_ONLINE_BOOKINGS: OnlineBooking[] = [
  {
    id: "ob1",
    customer_id: "c2",
    customer_nama: "Siti Rahmawati",
    customer_hp: "081311223344",
    unit_id: "u3",
    unit_no: "B-05",
    tanggal_booking: "2026-07-30",
    status: "Baru",
    sumber: "Landing Page Website",
  },
];

export const INITIAL_MARKETER_RIGHTS: MarketerRight[] = [
  {
    id: "mr1",
    marketer_id: "m1",
    marketer_nama: "Doni Kurniawan",
    sale_id: "s1",
    customer_nama: "Budi Santoso",
    unit_no: "A-01",
    persen_fee: 1.5,
    nominal_fee: 6750000,
    status_pencairan: "Lunas",
  },
];

export const INITIAL_INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: "i1",
    nama_barang: "Semen Gresik 50kg",
    satuan: "Sak",
    kategori: "Material Bangunan",
    stok: 120,
    min_stok: 30,
    harga_satuan: 68000,
  },
  {
    id: "i2",
    nama_barang: "Bata Ringan / Hebel 7.5cm",
    satuan: "m3",
    kategori: "Material Bangunan",
    stok: 15,
    min_stok: 20,
    harga_satuan: 620000,
  }, // Low stock alert!
  {
    id: "i3",
    nama_barang: "Besi Beton 10mm SNI",
    satuan: "Batang",
    kategori: "Besi & Metal",
    stok: 8,
    min_stok: 25,
    harga_satuan: 85000,
  }, // Low stock alert!
  {
    id: "i4",
    nama_barang: "Cat Tembok Exterior Dulux 20L",
    satuan: "Pail",
    kategori: "Cat & Finishing",
    stok: 45,
    min_stok: 10,
    harga_satuan: 1450000,
  },
];

export const INITIAL_PURCHASES: Purchase[] = [
  {
    id: "p1",
    no_po: "PO-2026-07-001",
    supplier: "PT Material Utama Jaya",
    tanggal: "2026-07-20",
    biaya_pengiriman: 0,
    pajak: 0,
    total_harga: 28500000,
    status: "Selesai",
    items: [
      {
        id: "pi1",
        purchase_id: "p1",
        item_id: "i1",
        nama_barang: "Semen Gresik 50kg",
        qty: 100,
        harga_satuan: 68000,
      },
    ],
  },
  {
    id: "p2",
    no_po: "PO-2026-08-002",
    supplier: "CV Besi Nusantara",
    tanggal: "2026-08-01",
    biaya_pengiriman: 0,
    pajak: 0,
    total_harga: 17000000,
    status: "Disetujui",
    items: [
      {
        id: "pi2",
        purchase_id: "p2",
        item_id: "i3",
        nama_barang: "Besi Beton 10mm SNI",
        qty: 200,
        harga_satuan: 85000,
      },
    ],
  },
];
export const INITIAL_GOODS_IN: GoodsIn[] = [
  {
    id: "gi1",
    purchase_id: "p1",
    no_po: "PO-2026-07-001",
    tanggal: "2026-07-22",
    catatan: "Penerimaan batch 1 lengkap dari PT Material Utama Jaya",
  },
];

export const INITIAL_GOODS_OUT: GoodsOut[] = [
  {
    id: "go1",
    tanggal: "2026-07-25",
    tujuan_pemakaian: "Pekerjaan Pondasi Unit A-02",
    unit_id: "u2",
    unit_no: "A-02",
    catatan: "Pengambilan oleh Mandor Supri",
  },
];

export const INITIAL_CASH_BANK_ACCOUNTS: CashBankAccount[] = [
  {
    id: "cba1",
    nama_akun: "Kas Operasional Kantor",
    jenis: "Kas",
    saldo: 48500000,
  },
  {
    id: "cba2",
    nama_akun: "Bank BCA Operasional",
    jenis: "Bank",
    no_rekening: "8830-192-881",
    saldo: 1250000000,
  },
  {
    id: "cba3",
    nama_akun: "Bank Mandiri Escrow KPR",
    jenis: "Bank",
    no_rekening: "118-0099-281",
    saldo: 2450000000,
  },
];

export const INITIAL_CHART_OF_ACCOUNTS: ChartOfAccount[] = [
  { id: "coa1", kode_akun: "1010", nama_akun: "Kas Utama", kategori: "Aset" },
  { id: "coa2", kode_akun: "1020", nama_akun: "Bank BCA", kategori: "Aset" },
  {
    id: "coa3",
    kode_akun: "2010",
    nama_akun: "Hutang Bank KPR Proyek",
    kategori: "Kewajiban",
  },
  {
    id: "coa4",
    kode_akun: "4010",
    nama_akun: "Pendapatan Penjualan Rumah",
    kategori: "Pendapatan",
  },
  {
    id: "coa5",
    kode_akun: "5010",
    nama_akun: "Bebam Constructing & Material",
    kategori: "Beban",
  },
  {
    id: "coa6",
    kode_akun: "5020",
    nama_akun: "Beban Komisi Marketing",
    kategori: "Beban",
  },
];

export const INITIAL_BANK_LOANS: BankLoan[] = [
  {
    id: "bl1",
    account_id: "cba2",
    total_hutang: 5000000000,
    total_terbayar: 1800000000,
    bank_id: "b1",
    bank_nama: "Bank BTN",
    nominal_pinjaman: 5000000000,
    bunga: 8.5,
    tenor: 36,
    sisa_hutang: 3200000000,
  },
];

export const INITIAL_CASHFLOW_ENTRIES: CashflowEntry[] = [
  {
    id: "cfe1",
    account_id: "cba2",
    account_nama: "Bank BCA Operasional",
    tanggal: "2026-07-28",
    jenis: "Masuk",
    nominal: 450000000,
    keterangan: "Pencairan KPR BTN Unit A-01 a.n Budi Santoso",
  },
  {
    id: "cfe2",
    account_id: "cba1",
    account_nama: "Kas Operasional Kantor",
    tanggal: "2026-07-29",
    jenis: "Keluar",
    nominal: 12500000,
    keterangan: "Pembayaran Kasbon Mandor Slamet (Projek Serpong Block A)",
  },
];

export const INITIAL_MANDOR_ADVANCES: MandorAdvance[] = [
  {
    id: "ma1",
    nama_mandor: "Mandor Slamet",
    tanggal: "2026-07-29",
    nominal: 12500000,
    keterangan: "Upah tukang minggu ke-4 Pembangunan Unit A-02 & A-03",
    status: "Belum Lunas",
  },
  {
    id: "ma2",
    nama_mandor: "Mandor Supri",
    tanggal: "2026-07-10",
    nominal: 8000000,
    keterangan: "Pekerjaan Plester & Acian Blok B",
    status: "Lunas",
  },
];

export const INITIAL_OPERATIONAL_EXPENSES: OperationalExpense[] = [
  {
    id: "oe1",
    kategori: "Listrik & Air Kantor",
    tanggal: "2026-07-25",
    nominal: 3450000,
    keterangan: "Tagihan PLN & PAM Galery Marketing Serpong",
  },
  {
    id: "oe2",
    kategori: "Iklan & Marketing",
    tanggal: "2026-07-27",
    nominal: 7500000,
    keterangan: "Meta Ads & Google Ads Campaign Perumahan Benteng Mutiara Mas",
  },
];

export const INITIAL_DISBURSEMENT_REQUESTS: DisbursementRequest[] = [
  {
    id: "dr1",
    jenis_pengajuan: "Pembelian Material Besi Beton SNI",
    nominal: 17000000,
    tanggal: "2026-08-01",
    status_approval: "Disetujui",
    requested_by: "Gudang Manager (Bambang)",
  },
  {
    id: "dr2",
    jenis_pengajuan: "Pencairan Fee Marketing Unit A-01",
    nominal: 6750000,
    tanggal: "2026-08-02",
    status_approval: "Diajukan",
    requested_by: "Marketing Admin (Siska)",
  },
];

export const INITIAL_COMPANY_ASSETS: CompanyAsset[] = [
  {
    id: "ca1",
    nama_aset: "Mobil Operasional Proyek (Toyota Hilux)",
    nilai_perolehan: 380000000,
    tanggal_perolehan: "2025-03-10",
    penyusutan: 38000000,
    kondisi: "Baik",
  },
  {
    id: "ca2",
    nama_aset: "Excavator Mini Komatsu PC50",
    nilai_perolehan: 650000000,
    tanggal_perolehan: "2024-11-15",
    penyusutan: 130000000,
    kondisi: "Baik",
  },
];

export const INITIAL_SALES: Sale[] = [
  {
    id: "s1",
    customer_id: "c1",
    customer_nama: "Budi Santoso",
    unit_id: "u1",
    unit_no: "A-01",
    location_nama: "Perumahan Benteng Mutiara Mas",
    block_nama: "Blok A (Emerald)",
    bank_id: "b1",
    bank_nama: "Bank BTN",
    marketer_id: "m1",
    marketer_nama: "Doni Kurniawan",
    tanggal_booking: "2026-05-10",
    tanggal_transaksi: "2026-05-10",
    tanggal_akad: "2026-07-15",
    harga_kesepakatan: 460000000,
    diskon: 10000000,
    total_harga: 450000000,
    booking_fee: 5000000,
    dp_nominal: 45000000,
    metode_bayar: "KPR",
    kpr_status: "Akad",
    status: "Lunas",
    created_at: "2026-05-10T10:00:00Z",
  },
  {
    id: "s2",
    customer_id: "c3",
    customer_nama: "Hendrik Pratama",
    unit_id: "u2",
    unit_no: "A-02",
    location_nama: "Perumahan Benteng Mutiara Mas",
    block_nama: "Blok A (Emerald)",
    bank_id: "b2",
    bank_nama: "Bank BRI",
    marketer_id: "m2",
    marketer_nama: "Anita Wijaya",
    tanggal_booking: "2026-06-12",
    tanggal_transaksi: "2026-06-12",
    harga_kesepakatan: 640000000,
    diskon: 20000000,
    total_harga: 620000000,
    booking_fee: 5000000,
    dp_nominal: 62000000,
    metode_bayar: "Cash Bertahap",
    status: "DP",
    created_at: "2026-06-12T14:20:00Z",
  },
];

export const INITIAL_USERS: UserProfile[] = [
  {
    id: "usr1",
    nama: "Administrator Lansena",
    email: "admin@lansenaproperty.com",
    role: "Admin",
    is_active: true,
    last_login_at: "2026-08-03T12:00:00Z",
  },
  {
    id: "usr2",
    nama: "Marketing Executive",
    email: "marketing@lansenaproperty.com",
    role: "Marketing",
    is_active: true,
    last_login_at: "2026-08-03T11:30:00Z",
  },
  {
    id: "usr3",
    nama: "Kepala Gudang",
    email: "gudang@lansenaproperty.com",
    role: "Gudang",
    is_active: true,
    last_login_at: "2026-08-02T16:45:00Z",
  },
  {
    id: "usr4",
    nama: "Finance Officer",
    email: "finance@lansenaproperty.com",
    role: "Finance",
    is_active: true,
    last_login_at: "2026-08-03T09:15:00Z",
  },
  {
    id: "usr5",
    nama: "Management Viewer",
    email: "viewer@lansenaproperty.com",
    role: "Viewer",
    is_active: true,
    last_login_at: "2026-07-30T10:00:00Z",
  },
];
