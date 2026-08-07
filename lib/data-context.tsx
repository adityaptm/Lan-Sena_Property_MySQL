'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  Customer, Bank, Location, Block, UnitType, SubsidyType, Unit,
  MarketerType, Marketer, OnlineBooking, InventoryItem, Purchase,
  GoodsIn, GoodsOut, CashBankAccount, ChartOfAccount, BankLoan,
  CashflowEntry, MandorAdvance, OperationalExpense, DisbursementRequest,
  CompanyAsset, Sale, UserProfile, SalesStep, CertificateStep, PriceItem, MarketerRight, CompanySettings,
  SaleAdditionalCost, SalePayment, SaleDiscount
} from '@/types';

// ─── MySQL API Gateway Helpers ───────────────────────────────────────────────
async function dbRequest(body: Record<string, any>) {
  const res = await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Database error');
  return json.data;
}

async function fetchTable<T>(table: string): Promise<T[]> {
  try {
    return await dbRequest({ action: 'select', table }) as T[];
  } catch (e: any) {
    console.warn(`Warning fetching ${table}:`, e.message);
    return [];
  }
}

async function dbInsert(table: string, data: Record<string, any>) {
  const result = await dbRequest({ action: 'insert', table, data });
  return Array.isArray(result) ? result : [result];
}

async function dbUpdate(table: string, id: string, data: Record<string, any>) {
  return dbRequest({ action: 'update', table, data, filters: [{ type: 'eq', column: 'id', value: id }] });
}

async function dbDelete(table: string, id: string) {
  return dbRequest({ action: 'delete', table, filters: [{ type: 'eq', column: 'id', value: id }] });
}

async function dbSelectSingle(table: string, filters: any[]) {
  const rows = await dbRequest({ action: 'select', table, filters, single: true });
  return rows;
}

async function dbSearch(table: string, orFilter: string) {
  return dbRequest({ action: 'select', table, filters: [{ type: 'or', value: orFilter }] });
}

interface DataContextType {
  currentUser: UserProfile | null;
  loading: boolean;

  // Kontak
  customers: Customer[];
  addCustomer: (c: Omit<Customer, 'id' | 'created_at'>) => Promise<void>;
  updateCustomer: (id: string, c: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  searchCustomers: (query: string) => Promise<Customer[]>;

  companySettings: CompanySettings | null;

  banks: Bank[];
  addBank: (b: Omit<Bank, 'id' | 'created_at'>) => Promise<void>;
  updateBank: (id: string, b: Partial<Bank>) => Promise<void>;
  deleteBank: (id: string) => Promise<void>;

  // Master Data Unit
  salesSteps: SalesStep[];
  addSalesStep: (s: Omit<SalesStep, 'id'>) => Promise<void>;
  updateSalesStep: (id: string, s: Partial<SalesStep>) => Promise<void>;
  deleteSalesStep: (id: string) => Promise<void>;
  certificateSteps: CertificateStep[];
  addCertificateStep: (c: Omit<CertificateStep, 'id'>) => Promise<void>;
  updateCertificateStep: (id: string, c: Partial<CertificateStep>) => Promise<void>;
  deleteCertificateStep: (id: string) => Promise<void>;
  priceItems: PriceItem[];
  addPriceItem: (p: Omit<PriceItem, 'id'>) => Promise<void>;
  updatePriceItem: (id: string, p: Partial<PriceItem>) => Promise<void>;
  deletePriceItem: (id: string) => Promise<void>;
  locations: Location[];
  addLocation: (l: Omit<Location, 'id'>) => Promise<void>;
  updateLocation: (id: string, l: Partial<Location>) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  blocks: Block[];
  addBlock: (b: Omit<Block, 'id'>) => Promise<void>;
  updateBlock: (id: string, b: Partial<Block>) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
  unitTypes: UnitType[];
  addUnitType: (u: Omit<UnitType, 'id'>) => Promise<void>;
  updateUnitType: (id: string, u: Partial<UnitType>) => Promise<void>;
  deleteUnitType: (id: string) => Promise<void>;
  subsidyTypes: SubsidyType[];
  addSubsidyType: (s: Omit<SubsidyType, 'id'>) => Promise<void>;
  updateSubsidyType: (id: string, s: Partial<SubsidyType>) => Promise<void>;
  deleteSubsidyType: (id: string) => Promise<void>;

  // Unit Rumah
  units: Unit[];
  addUnit: (u: any) => Promise<void>;
  updateUnit: (id: string, u: any) => Promise<void>;
  deleteUnit: (id: string) => Promise<void>;

  // Marketing
  marketerTypes: MarketerType[];
  addMarketerType: (mt: Omit<MarketerType, 'id'>) => Promise<void>;
  marketers: Marketer[];
  addMarketer: (m: Omit<Marketer, 'id'>) => Promise<void>;
  updateMarketerData: (id: string, m: Partial<Marketer>) => Promise<void>;
  deleteMarketerData: (id: string) => Promise<void>;
  onlineBookings: OnlineBooking[];
  addOnlineBooking: (ob: Omit<OnlineBooking, 'id'>) => Promise<void>;
  convertBookingToSale: (bookingId: string) => Promise<void>;
  marketerRights: MarketerRight[];

  // Gudang
  items: InventoryItem[];
  addItem: (i: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateItem: (id: string, i: Partial<InventoryItem>) => Promise<void>;
  purchases: Purchase[];
  addPurchase: (p: Omit<Purchase, 'id'>) => Promise<void>;
  updatePurchaseStatus: (id: string, status: 'Draft' | 'Approved' | 'Received') => Promise<void>;
  goodsIn: GoodsIn[];
  addGoodsIn: (gi: Omit<GoodsIn, 'id'>) => Promise<void>;
  goodsOut: GoodsOut[];
  addGoodsOut: (go: Omit<GoodsOut, 'id'>) => Promise<void>;

  // Keuangan
  cashBankAccounts: CashBankAccount[];
  addCashBankAccount: (acc: Omit<CashBankAccount, 'id'>) => Promise<void>;
  chartOfAccounts: ChartOfAccount[];
  addChartOfAccount: (coa: Omit<ChartOfAccount, 'id'>) => Promise<void>;
  bankLoans: BankLoan[];
  addBankLoan: (bl: Omit<BankLoan, 'id'>) => Promise<void>;
  cashflowEntries: CashflowEntry[];
  addCashflowEntry: (cfe: Omit<CashflowEntry, 'id'>) => Promise<void>;
  mandorAdvances: MandorAdvance[];
  addMandorAdvance: (ma: Omit<MandorAdvance, 'id'>) => Promise<void>;
  operationalExpenses: OperationalExpense[];
  addOperationalExpense: (oe: Omit<OperationalExpense, 'id'>) => Promise<void>;
  disbursementRequests: DisbursementRequest[];
  addDisbursementRequest: (dr: Omit<DisbursementRequest, 'id'>) => Promise<void>;
  updateDisbursementStatus: (id: string, status: 'Diajukan' | 'Disetujui' | 'Dicairkan' | 'Ditolak') => Promise<void>;
  companyAssets: CompanyAsset[];
  addCompanyAsset: (ca: Omit<CompanyAsset, 'id'>) => Promise<void>;

  // Penjualan
  sales: Sale[];
  addSale: (s: Omit<Sale, 'id' | 'created_at'>) => Promise<any>;
  updateSale: (id: string, s: Partial<Sale>) => Promise<void>;
  updateSaleStatus: (id: string, status: Sale['status']) => Promise<void>;
  updateKprStatus: (id: string, status: Sale['kpr_status']) => Promise<void>;
  cancelSale: (id: string) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  relocateUnit: (saleId: string, newUnitId: string, newUnitNo: string) => Promise<void>;

  // Angsuran / Pembayaran Konsumen
  salePayments: SalePayment[];
  addSalePayment: (p: Omit<SalePayment, 'id' | 'created_at'>) => Promise<void>;
  updateSalePayment: (id: string, p: Partial<SalePayment>) => Promise<void>;
  deleteSalePayment: (id: string) => Promise<void>;

  // Biaya Tambahan
  saleAdditionalCosts: SaleAdditionalCost[];
  addSaleAdditionalCost: (c: Omit<SaleAdditionalCost, 'id' | 'created_at'>) => Promise<void>;
  updateSaleAdditionalCost: (id: string, c: Partial<SaleAdditionalCost>) => Promise<void>;
  deleteSaleAdditionalCost: (id: string) => Promise<void>;

  // Potongan
  saleDiscounts: SaleDiscount[];
  addSaleDiscount: (d: Omit<SaleDiscount, 'id' | 'created_at'>) => Promise<void>;
  updateSaleDiscount: (id: string, d: Partial<SaleDiscount>) => Promise<void>;
  deleteSaleDiscount: (id: string) => Promise<void>;

  // Pengguna
  users: UserProfile[];
  toggleUserActive: (id: string) => Promise<void>;
  updateUser: (id: string, data: { nama: string; role: string }) => Promise<void>;

  // Refresh
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);




export function DataProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [salesSteps, setSalesSteps] = useState<SalesStep[]>([]);
  const [certificateSteps, setCertificateSteps] = useState<CertificateStep[]>([]);
  const [priceItems, setPriceItems] = useState<PriceItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [subsidyTypes, setSubsidyTypes] = useState<SubsidyType[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [marketerTypes, setMarketerTypes] = useState<MarketerType[]>([]);
  const [marketers, setMarketers] = useState<Marketer[]>([]);
  const [onlineBookings, setOnlineBookings] = useState<OnlineBooking[]>([]);
  const [marketerRights, setMarketerRights] = useState<MarketerRight[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [goodsIn, setGoodsIn] = useState<GoodsIn[]>([]);
  const [goodsOut, setGoodsOut] = useState<GoodsOut[]>([]);
  const [cashBankAccounts, setCashBankAccounts] = useState<CashBankAccount[]>([]);
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
  const [bankLoans, setBankLoans] = useState<BankLoan[]>([]);
  const [cashflowEntries, setCashflowEntries] = useState<CashflowEntry[]>([]);
  const [mandorAdvances, setMandorAdvances] = useState<MandorAdvance[]>([]);
  const [operationalExpenses, setOperationalExpenses] = useState<OperationalExpense[]>([]);
  const [disbursementRequests, setDisbursementRequests] = useState<DisbursementRequest[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [companyAssets, setCompanyAssets] = useState<CompanyAsset[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [salePayments, setSalePayments] = useState<SalePayment[]>([]);
  const [saleAdditionalCosts, setSaleAdditionalCosts] = useState<SaleAdditionalCost[]>([]);
  const [saleDiscounts, setSaleDiscounts] = useState<SaleDiscount[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      // Ambil current user dari session cookie via API
      const userRes = await fetch('/api/auth/user');
      let userJson: any = { user: null };
      
      if (userRes.ok && userRes.headers.get('content-type')?.includes('application/json')) {
        try {
          userJson = await userRes.json();
        } catch (err) {
          console.warn('Failed to parse user JSON', err);
        }
      }

      if (!userJson?.user) {
        // Belum login (atau session sudah tidak valid) — jangan lanjut
        // memanggil /api/db sama sekali, supaya tidak muncul error
        // "Unauthorized: Session missing" di console pada halaman publik/login.
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      setCurrentUser(userJson.user);

      const tables = [
        'customers', 'banks', 'sales_steps', 'certificate_steps', 'price_items',
        'locations', 'blocks', 'unit_types', 'subsidy_types', 'units',
        'marketer_types', 'marketers', 'online_bookings', 'marketer_rights', 'company_settings',
        'items', 'purchases', 'goods_in', 'goods_out', 'cash_bank_accounts',
        'chart_of_accounts', 'bank_loans', 'cashflow_entries', 'mandor_advances', 'operational_expenses',
        'disbursement_requests', 'company_assets', 'sales', 'sale_payments', 'sale_additional_costs',
        'sale_discounts', 'users'
      ];

      const batchBody = tables.map(table => ({ action: 'select', table }));
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchBody),
      });

      if (!response.ok) {
        // Kalau session ternyata expired/invalid di tengah jalan (401),
        // treat sebagai belum login alih-alih melempar error fatal ke console.
        if (response.status === 401) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }
        let errMsg = 'Failed to fetch batch data';
        if (response.headers.get('content-type')?.includes('application/json')) {
          try {
            const errJson = await response.json();
            errMsg = errJson.error || errMsg;
          } catch {}
        }
        throw new Error(errMsg);
      }

      let results: any = [];
      if (response.headers.get('content-type')?.includes('application/json')) {
        try {
          results = await response.json();
        } catch (err) {
          throw new Error('Failed to parse database batch response as JSON');
        }
      } else {
        throw new Error(`Server returned non-JSON response (status: ${response.status})`);
      }

      const dataMap: Record<string, any[]> = {};
      tables.forEach((table, index) => {
        dataMap[table] = results[index]?.data || [];
      });

      const cust = dataMap['customers'];
      const bnk = dataMap['banks'];
      const ss = dataMap['sales_steps'];
      const cs = dataMap['certificate_steps'];
      const pi = dataMap['price_items'];
      const loc = dataMap['locations'];
      const blk = dataMap['blocks'];
      const ut = dataMap['unit_types'];
      const sub = dataMap['subsidy_types'];
      const un = dataMap['units'];
      const mt = dataMap['marketer_types'];
      const mkt = dataMap['marketers'];
      const ob = dataMap['online_bookings'];
      const mr = dataMap['marketer_rights'];
      const compSettings = dataMap['company_settings'];
      const itm = dataMap['items'];
      const pur = dataMap['purchases'];
      const gi = dataMap['goods_in'];
      const go = dataMap['goods_out'];
      const cba = dataMap['cash_bank_accounts'];
      const coa = dataMap['chart_of_accounts'];
      const bl = dataMap['bank_loans'];
      const cfe = dataMap['cashflow_entries'];
      const ma = dataMap['mandor_advances'];
      const oe = dataMap['operational_expenses'];
      const dr = dataMap['disbursement_requests'];
      const ca = dataMap['company_assets'];
      const sal = dataMap['sales'];
      const sp = dataMap['sale_payments'];
      const sac = dataMap['sale_additional_costs'];
      const sd = dataMap['sale_discounts'];
      const usr = dataMap['users'];

      // Client-side joins mapping
      const mappedUnits = un.map((unit) => {
        const block = blk.find((b) => b.id === unit.block_id);
        const locItem = loc.find((l) => l.id === block?.location_id);
        const uType = ut.find((t) => t.id === unit.unit_type_id);
        const subType = sub.find((s) => s.id === unit.subsidy_type_id);
        const sStep = ss.find((s) => s.id === unit.sales_step_id);
        const cStep = cs.find((c) => c.id === unit.certificate_step_id);
        return {
          ...unit,
          block_nama: block ? block.nama_blok : undefined,
          location_nama: locItem ? locItem.nama_lokasi : undefined,
          location_kode_lokasi: locItem ? locItem.kode_lokasi : undefined,
          unit_type_nama: uType ? uType.nama_type : undefined,
          luas_tanah: uType ? uType.luas_tanah : undefined,
          luas_bangunan: uType ? uType.luas_bangunan : undefined,
          subsidy_type_nama: subType ? subType.nama_type : undefined,
          sales_step_nama: sStep ? sStep.nama_step : undefined,
          certificate_step_nama: cStep ? cStep.nama_step : undefined,
        };
      });

      const mappedMarketers = mkt.map((m: any) => {
  const mtItem = mt.find((t: any) => t.id === m.marketer_type_id);
  return {
    ...m,
    marketer_type_nama: mtItem ? mtItem.nama_jenis : undefined,
  };
});

      const mappedSales = sal.map((s) => {
  const custItem = cust.find((c) => c.id === s.customer_id);
  const unitItem = mappedUnits.find((u) => u.id === s.unit_id);
  const bankItem = bnk.find((b) => b.id === s.bank_id);
  const marketerItem = mkt.find((m) => m.id === s.marketer_id);
  return {
    ...s,
    customer_nama: custItem ? custItem.nama : undefined,
    unit_no: unitItem ? unitItem.no_unit : undefined,
    location_nama: unitItem ? unitItem.location_nama : undefined,
    block_nama: unitItem ? unitItem.block_nama : undefined,
    unit_type_nama: unitItem ? unitItem.unit_type_nama : undefined,
    subsidy_type_nama: unitItem ? unitItem.subsidy_type_nama : undefined,
    bank_nama: bankItem ? bankItem.nama_bank : undefined,
    marketer_nama: marketerItem ? marketerItem.nama : undefined,
  };
});

      const mappedCashflow = cfe.map((entry) => {
        const account = cba.find((a) => a.id === entry.account_id);
        return { ...entry, account_nama: account ? account.nama_akun : undefined };
      });

      setCustomers(cust); setBanks(bnk); setSalesSteps(ss); setCertificateSteps(cs);
      setPriceItems(pi); setLocations(loc); setBlocks(blk); setUnitTypes(ut);
      setSubsidyTypes(sub); setUnits(mappedUnits); setMarketerTypes(mt); setMarketers(mappedMarketers);
      setOnlineBookings(ob); setMarketerRights(mr); setItems(itm); setPurchases(pur);
      setGoodsIn(gi); setGoodsOut(go); setCashBankAccounts(cba); setChartOfAccounts(coa);
      setBankLoans(bl); setCashflowEntries(mappedCashflow); setMandorAdvances(ma);
      setOperationalExpenses(oe); setDisbursementRequests(dr); setCompanyAssets(ca);
      setSales(mappedSales); setSalePayments(sp); setSaleAdditionalCosts(sac); setSaleDiscounts(sd);
      setUsers(usr); setCompanySettings(compSettings[0] || null);
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // --- Helpers ---
  async function insert(table: string, data: Record<string, any>) {
    const res = await dbInsert(table, data);
    await loadAll();
    return res[0];
  }
  async function update(table: string, id: string, data: Record<string, any>) {
    await dbUpdate(table, id, data);
    await loadAll();
  }
  async function remove(table: string, id: string) {
    await dbDelete(table, id);
    await loadAll();
  }


  // --- Kontak ---
  const addCustomer = (c: Omit<Customer, 'id' | 'created_at'>) => insert('customers', c);
  const updateCustomer = (id: string, c: Partial<Customer>) => update('customers', id, c);
  const deleteCustomer = async (id: string) => {
    const activeSales = sales.filter((s) => s.customer_id === id);
    for (const s of activeSales) {
      if (s.unit_id) await dbUpdate('units', s.unit_id, { status: 'Tersedia' });
      await dbDelete('sales', s.id);
    }
    return remove('customers', id);
  };

  const searchCustomers = async (query: string): Promise<Customer[]> => {
    const keyword = query.trim();
    if (keyword.length < 2) return [];
    try {
      const results = await dbSearch('customers', `nama.ilike.%${keyword}%,no_hp.ilike.%${keyword}%,nik.ilike.%${keyword}%`);
      return (results || []) as Customer[];
    } catch (e: any) {
      console.warn('searchCustomers error:', e.message);
      return [];
    }
  };


  const addBank = (b: Omit<Bank, 'id' | 'created_at'>) => insert('banks', b);
  const updateBank = (id: string, b: Partial<Bank>) => update('banks', id, b);
  const deleteBank = (id: string) => remove('banks', id);

  // --- Master Data ---
  const addSalesStep = (s: Omit<SalesStep, 'id'>) => insert('sales_steps', s);
  const updateSalesStep = (id: string, s: Partial<SalesStep>) => update('sales_steps', id, s);
  const deleteSalesStep = (id: string) => remove('sales_steps', id);

  const addCertificateStep = (c: Omit<CertificateStep, 'id'>) => insert('certificate_steps', c);
  const updateCertificateStep = (id: string, c: Partial<CertificateStep>) => update('certificate_steps', id, c);
  const deleteCertificateStep = (id: string) => remove('certificate_steps', id);

  const addPriceItem = (p: Omit<PriceItem, 'id'>) => insert('price_items', p);
  const updatePriceItem = (id: string, p: Partial<PriceItem>) => update('price_items', id, p);
  const deletePriceItem = (id: string) => remove('price_items', id);

  const addLocation = (l: Omit<Location, 'id'>) => insert('locations', l);
  const updateLocation = (id: string, l: Partial<Location>) => update('locations', id, l);
  const deleteLocation = (id: string) => remove('locations', id);

  const addBlock = (b: Omit<Block, 'id'>) => insert('blocks', b);
  const updateBlock = (id: string, b: Partial<Block>) => update('blocks', id, b);
  const deleteBlock = (id: string) => remove('blocks', id);

  const addUnitType = (u: Omit<UnitType, 'id'>) => insert('unit_types', u);
  const updateUnitType = (id: string, u: Partial<UnitType>) => update('unit_types', id, u);
  const deleteUnitType = (id: string) => remove('unit_types', id);

  const addSubsidyType = (s: Omit<SubsidyType, 'id'>) => insert('subsidy_types', s);
  const updateSubsidyType = (id: string, s: Partial<SubsidyType>) => update('subsidy_types', id, s);
  const deleteSubsidyType = (id: string) => remove('subsidy_types', id);

  // --- Unit ---
  const addUnit = async (u: any) => {
    // 1. Resolve Location & Block
    let blockId = u.block_id || '';
    if (!blockId && u.block_nama) {
      let locId = u.location_id || locations[0]?.id;
      if (!locId) {
        const [newLoc] = await dbInsert('locations', { nama_lokasi: 'Perumahan Benteng Mutiara Mas', alamat: 'Perum Benteng Mutiara Mas, Desa Benteng Kec. Cempaka Kab. Purwakarta' });
        locId = newLoc.id;
      }

      const existingBlock = blocks.find(b => b.nama_blok.toLowerCase() === u.block_nama.toLowerCase() && b.location_id === locId);
      if (existingBlock) {
        blockId = existingBlock.id;
      } else {
        const [newBlock] = await dbInsert('blocks', { nama_blok: u.block_nama, location_id: locId });
        blockId = newBlock.id;
      }
    }

    // 2. Resolve Unit Type
    let unitTypeId = '';
    const existingType = unitTypes.find(t => t.nama_type.toLowerCase() === u.unit_type_nama.toLowerCase());
    if (existingType) {
      unitTypeId = existingType.id;
    } else {
      let lt = 72;
      let lb = 36;
      const match = u.unit_type_nama.match(/(\d+)\s*\/\s*(\d+)/);
      if (match) {
        lb = parseInt(match[1]);
        lt = parseInt(match[2]);
      }
      const [newType] = await dbInsert('unit_types', { nama_type: u.unit_type_nama, luas_tanah: lt, luas_bangunan: lb });
      unitTypeId = newType.id;
    }

    // 3. Resolve Subsidy/KPR Category
    let subsidyTypeId = '';
    const existingSub = subsidyTypes.find(s => s.nama_type.toLowerCase() === u.kategori_kpr.toLowerCase());
    if (existingSub) {
      subsidyTypeId = existingSub.id;
    } else {
      const [newSub] = await dbInsert('subsidy_types', { nama_type: u.kategori_kpr, keterangan: 'Kategori KPR' });
      subsidyTypeId = newSub.id;
    }

    // 4. Resolve Sales Step
    let salesStepId = '';
    const existingStep = salesSteps.find(s => s.nama_step.toLowerCase() === u.sales_step_nama.toLowerCase());
    if (existingStep) {
      salesStepId = existingStep.id;
    } else {
      const [newStep] = await dbInsert('sales_steps', { nama_step: u.sales_step_nama, urutan: salesSteps.length + 1 });
      salesStepId = newStep.id;
    }

    // 5. Insert unit
    await insert('units', {
      no_unit: u.no_unit,
      block_id: blockId,
      unit_type_id: unitTypeId,
      subsidy_type_id: subsidyTypeId,
      sales_step_id: salesStepId,
      certificate_step_id: u.certificate_step_id || null,
      harga_dasar: u.harga_dasar,
      maksimal_kredit: u.maksimal_kredit || 0,
      uang_muka: u.uang_muka || 0,
      booking_fee: u.booking_fee || 0,
      status: u.status
    });
  };

  const updateUnit = async (id: string, u: any) => {
    const updateData: Record<string, any> = {};
    if (u.no_unit !== undefined) updateData.no_unit = u.no_unit;
    if (u.harga_dasar !== undefined) updateData.harga_dasar = u.harga_dasar;
    if (u.maksimal_kredit !== undefined) updateData.maksimal_kredit = u.maksimal_kredit;
    if (u.uang_muka !== undefined) updateData.uang_muka = u.uang_muka;
    if (u.booking_fee !== undefined) updateData.booking_fee = u.booking_fee;
    if (u.status !== undefined) updateData.status = u.status;
    if (u.certificate_step_id !== undefined) updateData.certificate_step_id = u.certificate_step_id || null;

    // Resolve location & block if block_nama or block_id changed
    if (u.block_id !== undefined) {
      updateData.block_id = u.block_id;
    } else if (u.block_nama !== undefined) {
      let locId = u.location_id || locations[0]?.id;
      if (!locId) {
        const [newLoc] = await dbInsert('locations', { nama_lokasi: 'Perumahan Benteng Mutiara Mas', alamat: 'Perum Benteng Mutiara Mas, Desa Benteng Kec. Cempaka Kab. Purwakarta' });
        locId = newLoc.id;
      }
      let blockId = '';
      const existingBlock = blocks.find(b => b.nama_blok.toLowerCase() === u.block_nama.toLowerCase() && b.location_id === locId);
      if (existingBlock) {
        blockId = existingBlock.id;
      } else {
        const [newBlock] = await dbInsert('blocks', { nama_blok: u.block_nama, location_id: locId });
        blockId = newBlock.id;
      }
      updateData.block_id = blockId;
    }

    // Resolve unit type if unit_type_nama changed
    if (u.unit_type_nama !== undefined) {
      let unitTypeId = '';
      const existingType = unitTypes.find(t => t.nama_type.toLowerCase() === u.unit_type_nama.toLowerCase());
      if (existingType) {
        unitTypeId = existingType.id;
      } else {
        let lt = 72;
        let lb = 36;
        const match = u.unit_type_nama.match(/(\d+)\s*\/\s*(\d+)/);
        if (match) {
          lb = parseInt(match[1]);
          lt = parseInt(match[2]);
        }
        const [newType] = await dbInsert('unit_types', { nama_type: u.unit_type_nama, luas_tanah: lt, luas_bangunan: lb });
        unitTypeId = newType.id;
      }
      updateData.unit_type_id = unitTypeId;
    }

    // Resolve subsidy/KPR if changed
    if (u.kategori_kpr !== undefined) {
      let subsidyTypeId = '';
      const existingSub = subsidyTypes.find(s => s.nama_type.toLowerCase() === u.kategori_kpr.toLowerCase());
      if (existingSub) {
        subsidyTypeId = existingSub.id;
      } else {
        const [newSub] = await dbInsert('subsidy_types', { nama_type: u.kategori_kpr, keterangan: 'Kategori KPR' });
        subsidyTypeId = newSub.id;
      }
      updateData.subsidy_type_id = subsidyTypeId;
    }

    // Resolve sales step if changed
    if (u.sales_step_nama !== undefined) {
      let salesStepId = '';
      const existingStep = salesSteps.find(s => s.nama_step.toLowerCase() === u.sales_step_nama.toLowerCase());
      if (existingStep) {
        salesStepId = existingStep.id;
      } else {
        const [newStep] = await dbInsert('sales_steps', { nama_step: u.sales_step_nama, urutan: salesSteps.length + 1 });
        salesStepId = newStep.id;
      }
      updateData.sales_step_id = salesStepId;
    }

    await update('units', id, updateData);
  };

  const deleteUnit = async (id: string) => {
    // Cek apakah unit masih direferensikan oleh sales yang aktif
    const activeSale = sales.find((s) => s.unit_id === id && s.status !== 'Batal');
    if (activeSale) {
      throw new Error(
        `Unit tidak dapat dihapus karena masih terdapat transaksi aktif atas nama "${activeSale.customer_nama || 'Konsumen'}" (Status: ${activeSale.status}). Batalkan atau selesaikan transaksi terlebih dahulu.`
      );
    }
    return remove('units', id);
  };

  // --- Marketing ---
  const addMarketerType = (mt: Omit<MarketerType, 'id'>) => insert('marketer_types', mt);
  const addMarketer = (m: Omit<Marketer, 'id'>) => insert('marketers', m);
  const updateMarketerData = (id: string, m: Partial<Marketer>) => update('marketers', id, m);
  const deleteMarketerData = (id: string) => remove('marketers', id);
  const addOnlineBooking = (ob: Omit<OnlineBooking, 'id'>) => insert('online_bookings', ob);

  const convertBookingToSale = async (bookingId: string) => {
    await update('online_bookings', bookingId, { status: 'Deal' });
    const booking = onlineBookings.find((b) => b.id === bookingId);
    if (!booking) return;
    const un = units.find((u) => u.id === booking.unit_id);
    await insert('sales', {
      customer_id: booking.customer_id,
      unit_id: booking.unit_id,
      tanggal_booking: booking.tanggal_booking,
      total_harga: un?.harga_dasar || 0,
      metode_bayar: 'KPR',
      status: 'Booking',
    });
    if (un) await update('units', un.id, { status: 'Booking' });
  };

  // --- Gudang ---
  const addItem = (i: Omit<InventoryItem, 'id'>) => insert('items', i);
  const updateItem = (id: string, i: Partial<InventoryItem>) => update('items', id, i);
  const addPurchase = (p: Omit<Purchase, 'id'>) => insert('purchases', p);
  const updatePurchaseStatus = (id: string, status: 'Draft' | 'Approved' | 'Received') => update('purchases', id, { status });

  const addGoodsIn = async (gi: Omit<GoodsIn, 'id'>) => {
    await insert('goods_in', gi);
    if (gi.items) {
      for (const giItem of gi.items) {
        const item = items.find((i) => i.id === giItem.item_id);
        if (item) await update('items', item.id, { stok: item.stok + giItem.qty });
      }
    }
  };

  const addGoodsOut = async (go: Omit<GoodsOut, 'id'>) => {
    await insert('goods_out', go);
    if (go.items) {
      for (const goItem of go.items) {
        const item = items.find((i) => i.id === goItem.item_id);
        if (item) await update('items', item.id, { stok: Math.max(0, item.stok - goItem.qty) });
      }
    }
  };

  // --- Keuangan ---
  const addCashBankAccount = (acc: Omit<CashBankAccount, 'id'>) => insert('cash_bank_accounts', acc);
  const addChartOfAccount = (coa: Omit<ChartOfAccount, 'id'>) => insert('chart_of_accounts', coa);
  const addBankLoan = (bl: Omit<BankLoan, 'id'>) => insert('bank_loans', bl);

  const addCashflowEntry = async (cfe: Omit<CashflowEntry, 'id'>) => {
    await insert('cashflow_entries', cfe);
    const acc = cashBankAccounts.find((a) => a.id === cfe.account_id);
    if (acc) {
      const delta = cfe.jenis === 'Masuk' ? cfe.nominal : -cfe.nominal;
      await update('cash_bank_accounts', acc.id, { saldo: acc.saldo + delta });
    }
  };

  const addMandorAdvance = (ma: Omit<MandorAdvance, 'id'>) => insert('mandor_advances', ma);
  const addOperationalExpense = (oe: Omit<OperationalExpense, 'id'>) => insert('operational_expenses', oe);
  const addDisbursementRequest = (dr: Omit<DisbursementRequest, 'id'>) => insert('disbursement_requests', dr);
  const updateDisbursementStatus = (id: string, status: 'Diajukan' | 'Disetujui' | 'Dicairkan' | 'Ditolak') =>
    update('disbursement_requests', id, { status_approval: status });
  const addCompanyAsset = (ca: Omit<CompanyAsset, 'id'>) => insert('company_assets', ca);

  // --- Penjualan ---
  const addSale = async (s: Omit<Sale, 'id' | 'created_at'>) => {
    // Auto-generate no_penjualan jika belum ada
    let saleData = { ...s };
    if (!saleData.no_penjualan) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const prefix = `INV/SALES/${year}/${month}/`;

      // Cari nomor urutan tertinggi yang sudah ada di database untuk bulan & tahun ini
      const matchingSales = sales.filter(item => item.no_penjualan && item.no_penjualan.startsWith(prefix));
      let maxSeq = 0;
      matchingSales.forEach(item => {
        const parts = item.no_penjualan!.split('/');
        const seqStr = parts[parts.length - 1];
        const seqNum = parseInt(seqStr, 10);
        if (!isNaN(seqNum) && seqNum > maxSeq) {
          maxSeq = seqNum;
        }
      });
      const urutan = String(maxSeq + 1).padStart(4, '0');
      saleData.no_penjualan = `${prefix}${urutan}`;
    }

    // Strip virtual/joined fields
    const dbData = {
      customer_id: saleData.customer_id,
      unit_id: saleData.unit_id,
      bank_id: saleData.bank_id,
      marketer_id: saleData.marketer_id,
      tanggal_booking: saleData.tanggal_booking,
      tanggal_akad: saleData.tanggal_akad,
      total_harga: saleData.total_harga,
      metode_bayar: saleData.metode_bayar,
      status: saleData.status,
      marketing_user_id: saleData.marketing_user_id,
      no_penjualan: saleData.no_penjualan,
      harga_jual_awal: saleData.harga_kesepakatan || saleData.harga_jual_awal || saleData.total_harga,
      potongan: saleData.diskon || saleData.potongan || 0,
      komitmen_pembayaran: saleData.komitmen_pembayaran,
      harga_jual_pajak: saleData.harga_jual_pajak,
    };

    const inserted = await insert('sales', dbData);
    const statusMap: Record<string, Unit['status']> = { Lunas: 'Lunas', Akad: 'Akad', DP: 'DP', Booking: 'Booking' };
    if (s.unit_id) await update('units', s.unit_id, { status: statusMap[s.status] || 'Booking' });
    return inserted;
  };

  const updateSale = (id: string, s: Partial<Sale>) => update('sales', id, s);
  const updateSaleStatus = (id: string, status: Sale['status']) => update('sales', id, { status });
  const updateKprStatus = (id: string, kpr_status: Sale['kpr_status']) => update('sales', id, { kpr_status });

  const cancelSale = async (id: string) => {
    const sale = sales.find((s) => s.id === id);
    await update('sales', id, { status: 'Batal' });
    if (sale?.unit_id) await update('units', sale.unit_id, { status: 'Tersedia' });
  };

  const deleteSale = async (id: string) => {
    const sale = sales.find((s) => s.id === id);
    if (sale?.unit_id) await update('units', sale.unit_id, { status: 'Tersedia' });
    await remove('sales', id);
  };

  const relocateUnit = async (saleId: string, newUnitId: string, newUnitNo: string) => {
    const sale = sales.find((s) => s.id === saleId);
    if (sale?.unit_id) await update('units', sale.unit_id, { status: 'Tersedia' });
    await update('units', newUnitId, { status: sale?.status || 'Booking' });
    await update('sales', saleId, { unit_id: newUnitId });
  };

  // --- Angsuran / Pembayaran Konsumen ---
  const addSalePayment = (p: Omit<SalePayment, 'id' | 'created_at'>) => insert('sale_payments', p);
  const updateSalePayment = (id: string, p: Partial<SalePayment>) => update('sale_payments', id, p);
  const deleteSalePayment = (id: string) => remove('sale_payments', id);

  // --- Biaya Tambahan ---
  const addSaleAdditionalCost = (c: Omit<SaleAdditionalCost, 'id' | 'created_at'>) => insert('sale_additional_costs', c);
  const updateSaleAdditionalCost = (id: string, c: Partial<SaleAdditionalCost>) => update('sale_additional_costs', id, c);
  const deleteSaleAdditionalCost = (id: string) => remove('sale_additional_costs', id);

  // --- Potongan ---
  const addSaleDiscount = (d: Omit<SaleDiscount, 'id' | 'created_at'>) => insert('sale_discounts', d);
  const updateSaleDiscount = (id: string, d: Partial<SaleDiscount>) => update('sale_discounts', id, d);
  const deleteSaleDiscount = (id: string) => remove('sale_discounts', id);

  // --- Pengguna ---
  const toggleUserActive = (id: string) => {
    const u = users.find((u) => u.id === id);
    return update('users', id, { is_active: !u?.is_active });
  };
  const updateUser = (id: string, data: { nama: string; role: string }) => update('users', id, data);

  return (
    <DataContext.Provider value={{
      currentUser, loading, companySettings,
      customers, addCustomer, updateCustomer, deleteCustomer, searchCustomers,
      banks, addBank, updateBank, deleteBank,
      salesSteps, addSalesStep, updateSalesStep, deleteSalesStep,
      certificateSteps, addCertificateStep, updateCertificateStep, deleteCertificateStep,
      priceItems, addPriceItem, updatePriceItem, deletePriceItem,
      locations, addLocation, updateLocation, deleteLocation,
      blocks, addBlock, updateBlock, deleteBlock,
      unitTypes, addUnitType, updateUnitType, deleteUnitType,
      subsidyTypes, addSubsidyType, updateSubsidyType, deleteSubsidyType,
      units, addUnit, updateUnit, deleteUnit,
      marketerTypes, addMarketerType, marketers, addMarketer, updateMarketerData, deleteMarketerData,
      onlineBookings, addOnlineBooking, convertBookingToSale, marketerRights,
      items, addItem, updateItem, purchases, addPurchase, updatePurchaseStatus,
      goodsIn, addGoodsIn, goodsOut, addGoodsOut,
      cashBankAccounts, addCashBankAccount, chartOfAccounts, addChartOfAccount,
      bankLoans, addBankLoan, cashflowEntries, addCashflowEntry,
      mandorAdvances, addMandorAdvance, operationalExpenses, addOperationalExpense,
      disbursementRequests, addDisbursementRequest, updateDisbursementStatus,
      companyAssets, addCompanyAsset,
      sales,
      addSale,
      updateSale,
      updateSaleStatus,
      updateKprStatus,
      cancelSale,
      deleteSale,
      relocateUnit,
      salePayments, addSalePayment, updateSalePayment, deleteSalePayment,
      saleAdditionalCosts, addSaleAdditionalCost, updateSaleAdditionalCost, deleteSaleAdditionalCost,
      saleDiscounts, addSaleDiscount, updateSaleDiscount, deleteSaleDiscount,
      users, toggleUserActive, updateUser: updateUser,
      refresh: loadAll,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
}