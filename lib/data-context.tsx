"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type {
  Customer,
  Bank,
  Location,
  Block,
  UnitType,
  SubsidyType,
  Unit,
  MarketerType,
  Marketer,
  OnlineBooking,
  InventoryItem,
  Purchase,
  GoodsIn,
  GoodsOut,
  CashBankAccount,
  ChartOfAccount,
  BankLoan,
  CashflowEntry,
  MandorAdvance,
  Mandor,
  OperationalExpense,
  DisbursementRequest,
  CompanyAsset,
  Sale,
  UserProfile,
  SalesStep,
  CertificateStep,
  PriceItem,
  MarketerRight,
  CompanySettings,
  SaleAdditionalCost,
  SalePayment,
  SaleDiscount,
  TrashItem,
  MarketingFee,
} from "@/types";

// ─── MySQL API Gateway Helpers ───────────────────────────────────────────────
async function dbRequest(body: Record<string, any>) {
  const res = await fetch("/api/db", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Database error");
  return json.data;
}

async function fetchTable<T>(table: string): Promise<T[]> {
  try {
    return (await dbRequest({ action: "select", table })) as T[];
  } catch (e: any) {
    console.warn(`Warning fetching ${table}:`, e.message);
    return [];
  }
}

async function dbInsert(table: string, data: Record<string, any>) {
  const result = await dbRequest({ action: "insert", table, data });
  return Array.isArray(result) ? result : [result];
}

async function dbUpdate(table: string, id: string, data: Record<string, any>) {
  return dbRequest({
    action: "update",
    table,
    data,
    filters: [{ type: "eq", column: "id", value: id }],
  });
}

async function dbDelete(
  table: string,
  id: string,
  options?: { skipTrash?: boolean; record_label?: string },
) {
  return dbRequest({
    action: "delete",
    table,
    filters: [{ type: "eq", column: "id", value: id }],
    skipTrash: options?.skipTrash,
    record_label: options?.record_label,
  });
}

async function dbSelectSingle(table: string, filters: any[]) {
  const rows = await dbRequest({
    action: "select",
    table,
    filters,
    single: true,
  });
  return rows;
}

async function dbSearch(table: string, orFilter: string) {
  return dbRequest({
    action: "select",
    table,
    filters: [{ type: "or", value: orFilter }],
  });
}

interface DataContextType {
  currentUser: UserProfile | null;
  loading: boolean;

  // Kontak
  customers: Customer[];
  addCustomer: (c: Omit<Customer, "id" | "created_at">) => Promise<void>;
  updateCustomer: (id: string, c: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  searchCustomers: (query: string) => Promise<Customer[]>;

  companySettings: CompanySettings | null;

  banks: Bank[];
  addBank: (b: Omit<Bank, "id" | "created_at">) => Promise<void>;
  updateBank: (id: string, b: Partial<Bank>) => Promise<void>;
  deleteBank: (id: string) => Promise<void>;

  // Master Data Unit
  salesSteps: SalesStep[];
  addSalesStep: (s: Omit<SalesStep, "id">) => Promise<void>;
  updateSalesStep: (id: string, s: Partial<SalesStep>) => Promise<void>;
  deleteSalesStep: (id: string) => Promise<void>;
  certificateSteps: CertificateStep[];
  addCertificateStep: (c: Omit<CertificateStep, "id">) => Promise<void>;
  updateCertificateStep: (
    id: string,
    c: Partial<CertificateStep>,
  ) => Promise<void>;
  deleteCertificateStep: (id: string) => Promise<void>;
  priceItems: PriceItem[];
  addPriceItem: (p: Omit<PriceItem, "id">) => Promise<void>;
  updatePriceItem: (id: string, p: Partial<PriceItem>) => Promise<void>;
  deletePriceItem: (id: string) => Promise<void>;
  locations: Location[];
  addLocation: (l: Omit<Location, "id">) => Promise<void>;
  updateLocation: (id: string, l: Partial<Location>) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  blocks: Block[];
  addBlock: (b: Omit<Block, "id">) => Promise<void>;
  updateBlock: (id: string, b: Partial<Block>) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
  unitTypes: UnitType[];
  addUnitType: (u: Omit<UnitType, "id">) => Promise<void>;
  updateUnitType: (id: string, u: Partial<UnitType>) => Promise<void>;
  deleteUnitType: (id: string) => Promise<void>;
  subsidyTypes: SubsidyType[];
  addSubsidyType: (s: Omit<SubsidyType, "id">) => Promise<void>;
  updateSubsidyType: (id: string, s: Partial<SubsidyType>) => Promise<void>;
  deleteSubsidyType: (id: string) => Promise<void>;

  // Unit Rumah
  units: Unit[];
  addUnit: (u: any) => Promise<void>;
  updateUnit: (id: string, u: any) => Promise<void>;
  deleteUnit: (id: string) => Promise<void>;

  // Marketing
  marketerTypes: MarketerType[];
  addMarketerType: (mt: Omit<MarketerType, "id">) => Promise<void>;
  deleteMarketerType: (id: string) => Promise<void>;
  marketingFees: MarketingFee[];
  updateMarketingFees: (
    marketerTypeId: string,
    updates: {
      kategori_unit: string;
      booking_fee: number | null;
      akad_fee: number | null;
    }[],
  ) => Promise<void>;
  marketers: Marketer[];
  addMarketer: (m: Omit<Marketer, "id">) => Promise<void>;
  updateMarketerData: (id: string, m: Partial<Marketer>) => Promise<void>;
  deleteMarketerData: (id: string) => Promise<void>;
  onlineBookings: OnlineBooking[];
  addOnlineBooking: (ob: Omit<OnlineBooking, "id">) => Promise<void>;
  convertBookingToSale: (bookingId: string) => Promise<void>;
  marketerRights: MarketerRight[];

  // Gudang
  items: InventoryItem[];
  addItem: (i: Omit<InventoryItem, "id">) => Promise<void>;
  updateItem: (id: string, i: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  purchases: Purchase[];
  addPurchase: (p: any) => Promise<any>;
  updatePurchase: (id: string, p: any) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;
  updatePurchaseStatus: (
    id: string,
    status: "Belum ditanggapi" | "Disetujui" | "Selesai" | "Ditolak",
  ) => Promise<void>;
  goodsIn: GoodsIn[];
  addGoodsIn: (gi: Omit<GoodsIn, "id">) => Promise<void>;
  goodsOut: GoodsOut[];
  addGoodsOut: (go: Omit<GoodsOut, "id">) => Promise<void>;

  // Keuangan
  cashBankAccounts: CashBankAccount[];
  addCashBankAccount: (acc: Omit<CashBankAccount, "id">) => Promise<void>;
  updateCashBankAccount: (
    id: string,
    acc: Partial<CashBankAccount>,
  ) => Promise<void>;
  deleteCashBankAccount: (id: string) => Promise<void>;
  chartOfAccounts: ChartOfAccount[];
  addChartOfAccount: (coa: Omit<ChartOfAccount, "id">) => Promise<void>;
  updateChartOfAccount: (
    id: string,
    coa: Partial<ChartOfAccount>,
  ) => Promise<void>;
  deleteChartOfAccount: (id: string) => Promise<void>;
  bankLoans: BankLoan[];
  addBankLoan: (bl: Omit<BankLoan, "id">) => Promise<void>;
  updateBankLoan: (id: string, bl: Partial<BankLoan>) => Promise<void>;
  deleteBankLoan: (id: string) => Promise<void>;
  cashflowEntries: CashflowEntry[];
  addCashflowEntry: (cfe: Omit<CashflowEntry, "id">) => Promise<void>;
  updateCashflowEntry: (
    id: string,
    cfe: Partial<CashflowEntry>,
  ) => Promise<void>;
  deleteCashflowEntry: (id: string) => Promise<void>;
  mandorAdvances: MandorAdvance[];
  addMandorAdvance: (ma: Omit<MandorAdvance, "id">) => Promise<void>;
  updateMandorAdvance: (
    id: string,
    ma: Partial<MandorAdvance>,
  ) => Promise<void>;
  deleteMandorAdvance: (id: string) => Promise<void>;

  // Progress Pekerjaan Mandor
  mandors: Mandor[];
  addMandor: (m: Omit<Mandor, "id" | "created_at">) => Promise<void>;
  updateMandor: (id: string, m: Partial<Mandor>) => Promise<void>;
  deleteMandor: (id: string) => Promise<void>;

  operationalExpenses: OperationalExpense[];
  addOperationalExpense: (oe: Omit<OperationalExpense, "id">) => Promise<void>;
  disbursementRequests: DisbursementRequest[];
  addDisbursementRequest: (
    dr: Omit<DisbursementRequest, "id">,
  ) => Promise<void>;
  updateDisbursementStatus: (
    id: string,
    status: "Diajukan" | "Disetujui" | "Dicairkan" | "Ditolak",
  ) => Promise<void>;
  companyAssets: CompanyAsset[];
  addCompanyAsset: (ca: Omit<CompanyAsset, "id">) => Promise<void>;
  updateCompanyAsset: (id: string, ca: Partial<CompanyAsset>) => Promise<void>;
  deleteCompanyAsset: (id: string) => Promise<void>;

  // Penjualan
  sales: Sale[];
  addSale: (s: Omit<Sale, "id" | "created_at">) => Promise<any>;
  updateSale: (id: string, s: Partial<Sale>) => Promise<void>;
  updateSaleStatus: (id: string, status: Sale["status"]) => Promise<void>;
  updateKprStatus: (id: string, status: Sale["kpr_status"]) => Promise<void>;
  cancelSale: (id: string) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  relocateUnit: (
    saleId: string,
    newUnitId: string,
    newUnitNo: string,
  ) => Promise<void>;

  // Angsuran / Pembayaran Konsumen
  salePayments: SalePayment[];
  addSalePayment: (p: Omit<SalePayment, "id" | "created_at">) => Promise<void>;
  updateSalePayment: (id: string, p: Partial<SalePayment>) => Promise<void>;
  deleteSalePayment: (id: string) => Promise<void>;

  // Biaya Tambahan
  saleAdditionalCosts: SaleAdditionalCost[];
  addSaleAdditionalCost: (
    c: Omit<SaleAdditionalCost, "id" | "created_at">,
  ) => Promise<void>;
  updateSaleAdditionalCost: (
    id: string,
    c: Partial<SaleAdditionalCost>,
  ) => Promise<void>;
  deleteSaleAdditionalCost: (id: string) => Promise<void>;

  // Potongan
  saleDiscounts: SaleDiscount[];
  addSaleDiscount: (
    d: Omit<SaleDiscount, "id" | "created_at">,
  ) => Promise<void>;
  updateSaleDiscount: (id: string, d: Partial<SaleDiscount>) => Promise<void>;
  deleteSaleDiscount: (id: string) => Promise<void>;

  // Pengguna
  users: UserProfile[];
  toggleUserActive: (id: string) => Promise<void>;
  updateUser: (
    id: string,
    data: { nama: string; role: string },
  ) => Promise<void>;

  // Trash & Audit Log
  trashItems: TrashItem[];
  restoreFromTrash: (trashId: string) => Promise<void>;
  permanentlyDeleteTrash: (trashId: string) => Promise<void>;

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
  const [certificateSteps, setCertificateSteps] = useState<CertificateStep[]>(
    [],
  );
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
  const [cashBankAccounts, setCashBankAccounts] = useState<CashBankAccount[]>(
    [],
  );
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
  const [bankLoans, setBankLoans] = useState<BankLoan[]>([]);
  const [cashflowEntries, setCashflowEntries] = useState<CashflowEntry[]>([]);
  const [mandorAdvances, setMandorAdvances] = useState<MandorAdvance[]>([]);
  const [mandors, setMandors] = useState<Mandor[]>([]);
  const [operationalExpenses, setOperationalExpenses] = useState<
    OperationalExpense[]
  >([]);
  const [disbursementRequests, setDisbursementRequests] = useState<
    DisbursementRequest[]
  >([]);
  const [companySettings, setCompanySettings] =
    useState<CompanySettings | null>(null);
  const [companyAssets, setCompanyAssets] = useState<CompanyAsset[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [salePayments, setSalePayments] = useState<SalePayment[]>([]);
  const [saleAdditionalCosts, setSaleAdditionalCosts] = useState<
    SaleAdditionalCost[]
  >([]);
  const [saleDiscounts, setSaleDiscounts] = useState<SaleDiscount[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [marketingFees, setMarketingFees] = useState<MarketingFee[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      // Ambil current user dari session cookie via API
      const userRes = await fetch("/api/auth/user");
      let userJson: any = { user: null };

      if (
        userRes.ok &&
        userRes.headers.get("content-type")?.includes("application/json")
      ) {
        try {
          userJson = await userRes.json();
        } catch (err) {
          console.warn("Failed to parse user JSON", err);
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
        "customers",
        "banks",
        "sales_steps",
        "certificate_steps",
        "price_items",
        "locations",
        "blocks",
        "unit_types",
        "subsidy_types",
        "units",
        "marketer_types",
        "marketers",
        "online_bookings",
        "marketer_rights",
        "company_settings",
        "items",
        "purchases",
        "purchase_items",
        "goods_in",
        "goods_out",
        "cash_bank_accounts",
        "chart_of_accounts",
        "bank_loans",
        "cashflow_entries",
        "mandor_advances",
        "mandors",
        "operational_expenses",
        "disbursement_requests",
        "company_assets",
        "sales",
        "sale_payments",
        "sale_additional_costs",
        "sale_discounts",
        "users",
        "trash",
        "marketing_fees",
      ];

      const batchBody = tables.map((table) => ({ action: "select", table }));
      const response = await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        let errMsg = "Failed to fetch batch data";
        if (
          response.headers.get("content-type")?.includes("application/json")
        ) {
          try {
            const errJson = await response.json();
            errMsg = errJson.error || errMsg;
          } catch {}
        }
        throw new Error(errMsg);
      }

      let results: any = [];
      if (response.headers.get("content-type")?.includes("application/json")) {
        try {
          results = await response.json();
        } catch (err) {
          throw new Error("Failed to parse database batch response as JSON");
        }
      } else {
        throw new Error(
          `Server returned non-JSON response (status: ${response.status})`,
        );
      }

      const dataMap: Record<string, any[]> = {};
      tables.forEach((table, index) => {
        dataMap[table] = results[index]?.data || [];
      });

      const cust = dataMap["customers"];
      const bnk = dataMap["banks"];
      const ss = dataMap["sales_steps"];
      const cs = dataMap["certificate_steps"];
      const pi = dataMap["price_items"];
      const loc = dataMap["locations"];
      const blk = dataMap["blocks"];
      const ut = dataMap["unit_types"];
      const sub = dataMap["subsidy_types"];
      const un = dataMap["units"];
      const mt = dataMap["marketer_types"];
      const mkt = dataMap["marketers"];
      const ob = dataMap["online_bookings"];
      const mr = dataMap["marketer_rights"];
      const compSettings = dataMap["company_settings"];
      const itm = dataMap["items"];
      const pur = dataMap["purchases"];
      const purItems = dataMap["purchase_items"] || [];
      const gi = dataMap["goods_in"];
      const go = dataMap["goods_out"];
      const cba = dataMap["cash_bank_accounts"];
      const coa = dataMap["chart_of_accounts"];
      const bl = dataMap["bank_loans"];
      const cfe = dataMap["cashflow_entries"];
      const ma = dataMap["mandor_advances"];
      const mnd = dataMap["mandors"];
      const oe = dataMap["operational_expenses"];
      const dr = dataMap["disbursement_requests"];
      const ca = dataMap["company_assets"];
      const sal = dataMap["sales"];
      const sp = dataMap["sale_payments"];
      const sac = dataMap["sale_additional_costs"];
      const sd = dataMap["sale_discounts"];
      const usr = dataMap["users"];
      const trsh = dataMap["trash"] || [];
      const mf = dataMap["marketing_fees"] || [];

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

      const mappedPurchases = pur.map((p: any) => {
        const relatedItems = purItems
          .filter((pi: any) => pi.purchase_id === p.id)
          .map((pi: any) => {
            const itemMaster = itm.find((i: any) => i.id === pi.item_id);
            return {
              ...pi,
              nama_barang: itemMaster ? itemMaster.nama_barang : undefined,
              satuan: itemMaster ? itemMaster.satuan : undefined,
            };
          });
        return { ...p, items: relatedItems };
      });

      // FIX: sebelumnya ada deklarasi `const mappedCashflow` dobel/bersarang
      // di sini yang bikin seluruh file gagal di-compile. Sekarang cuma satu.
      const mappedCashflow = cfe.map((entry) => {
        const account = cba.find((a) => a.id === entry.account_id);
        return {
          ...entry,
          account_nama: account ? account.nama_akun : undefined,
        };
      });

      setCustomers(cust);
      setBanks(bnk);
      setSalesSteps(ss);
      setCertificateSteps(cs);
      setPriceItems(pi);
      setLocations(loc);
      setBlocks(blk);
      setUnitTypes(ut);
      setSubsidyTypes(sub);
      setUnits(mappedUnits);
      setMarketerTypes(mt);
      setMarketers(mappedMarketers);
      setOnlineBookings(ob);
      setMarketerRights(mr);
      setItems(itm);
      setPurchases(mappedPurchases);
      setGoodsIn(gi);
      setGoodsOut(go);
      setCashBankAccounts(cba);
      setChartOfAccounts(coa);
      setBankLoans(bl);
      setCashflowEntries(mappedCashflow);
      setMandorAdvances(ma);
      setMandors(mnd);
      setOperationalExpenses(oe);
      setDisbursementRequests(dr);
      setCompanyAssets(ca);
      setSales(mappedSales);
      setSalePayments(sp);
      setSaleAdditionalCosts(sac);
      setSaleDiscounts(sd);
      setUsers(usr);
      setCompanySettings(compSettings[0] || null);
      setTrashItems(trsh);
      setMarketingFees(mf);
    } catch (e) {
      console.error("Load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // --- Helpers ---
  const ENRICHED_FIELDS: Record<string, string[]> = {
    sales: [
      "customer_nama",
      "unit_no",
      "location_nama",
      "block_nama",
      "unit_type_nama",
      "subsidy_type_nama",
      "bank_nama",
      "marketer_nama",
    ],
    units: [
      "block_nama",
      "location_nama",
      "location_kode_lokasi",
      "unit_type_nama",
      "luas_tanah",
      "luas_bangunan",
      "subsidy_type_nama",
      "sales_step_nama",
      "certificate_step_nama",
    ],
    marketers: ["marketer_type_nama"],
    cashflow_entries: ["account_nama"],
    purchases: ["items"],
  };

  function stripEnrichedFields(table: string, data: Record<string, any>) {
    const fieldsToStrip = ENRICHED_FIELDS[table];
    if (!fieldsToStrip) return data;
    const clean = { ...data };
    fieldsToStrip.forEach((f) => delete clean[f]);
    return clean;
  }

  async function insert(table: string, data: Record<string, any>) {
    const cleanData = stripEnrichedFields(table, data);
    const res = await dbInsert(table, cleanData);
    await loadAll();
    return res[0];
  }
  async function update(table: string, id: string, data: Record<string, any>) {
    const cleanData = stripEnrichedFields(table, data);
    await dbUpdate(table, id, cleanData);
    await loadAll();
  }
  async function remove(
    table: string,
    id: string,
    _snapshot?: Record<string, any>,
    label?: string,
  ) {
    await dbDelete(table, id, { record_label: label });
    await loadAll();
  }

  const restoreFromTrash = async (trashId: string) => {
    const item = trashItems.find((t) => t.id === trashId);
    if (!item) return;

    let parsed: Record<string, any>;
    try {
      parsed = JSON.parse(item.record_data);
    } catch {
      throw new Error("Data trash rusak/tidak bisa dibaca.");
    }

    const childRecords = parsed._child_records as Record<string, any[]> | undefined;
    delete parsed._child_records;
    const cleanData = stripEnrichedFields(item.source_table, parsed);
    cleanData.id = item.record_id;

    await dbInsert(item.source_table, cleanData);

    if (childRecords) {
      for (const [childTable, rows] of Object.entries(childRecords)) {
        for (const childRow of rows) {
          const cleanChild = stripEnrichedFields(childTable, childRow);
          await dbInsert(childTable, cleanChild);
        }
      }
    }

    await dbDelete("trash", trashId, { skipTrash: true });
    await loadAll();
  };

  const permanentlyDeleteTrash = async (trashId: string) => {
    await dbDelete("trash", trashId, { skipTrash: true });
    await loadAll();
  };
  // --- Kontak ---
  const addCustomer = (c: Omit<Customer, "id" | "created_at">) =>
    insert("customers", c);
  const updateCustomer = (id: string, c: Partial<Customer>) =>
    update("customers", id, c);
  const deleteCustomer = async (id: string) => {
    const target = customers.find((c) => c.id === id);
    const activeSales = sales.filter((s) => s.customer_id === id);
    for (const s of activeSales) {
      if (s.unit_id) await dbUpdate("units", s.unit_id, { status: "Tersedia" });
      await dbDelete("sales", s.id);
    }
    return remove("customers", id, target, target?.nama);
  };

  const searchCustomers = async (query: string): Promise<Customer[]> => {
    const keyword = query.trim();
    if (keyword.length < 2) return [];
    try {
      const results = await dbSearch(
        "customers",
        `nama.ilike.%${keyword}%,no_hp.ilike.%${keyword}%,nik.ilike.%${keyword}%`,
      );
      return (results || []) as Customer[];
    } catch (e: any) {
      console.warn("searchCustomers error:", e.message);
      return [];
    }
  };

  const addBank = (b: Omit<Bank, "id" | "created_at">) => insert("banks", b);
  const updateBank = (id: string, b: Partial<Bank>) => update("banks", id, b);
  const deleteBank = (id: string) => {
    const target = banks.find((b) => b.id === id);
    return remove("banks", id, target, target?.nama_bank);
  };

  // --- Master Data ---
  const addSalesStep = (s: Omit<SalesStep, "id">) => insert("sales_steps", s);
  const updateSalesStep = (id: string, s: Partial<SalesStep>) =>
    update("sales_steps", id, s);
  const deleteSalesStep = (id: string) => {
    const target = salesSteps.find((s) => s.id === id);
    return remove("sales_steps", id, target, target?.nama_step);
  };

  const addCertificateStep = (c: Omit<CertificateStep, "id">) =>
    insert("certificate_steps", c);
  const updateCertificateStep = (id: string, c: Partial<CertificateStep>) =>
    update("certificate_steps", id, c);
  const deleteCertificateStep = (id: string) => {
    const target = certificateSteps.find((c) => c.id === id);
    return remove("certificate_steps", id, target, target?.nama_step);
  };

  const addPriceItem = (p: Omit<PriceItem, "id">) => insert("price_items", p);
  const updatePriceItem = (id: string, p: Partial<PriceItem>) =>
    update("price_items", id, p);
  const deletePriceItem = (id: string) => {
    const target = priceItems.find((p) => p.id === id);
    return remove("price_items", id, target, target?.nama_item);
  };

  const addLocation = (l: Omit<Location, "id">) => insert("locations", l);
  const updateLocation = (id: string, l: Partial<Location>) =>
    update("locations", id, l);
  const deleteLocation = (id: string) => {
    const target = locations.find((l) => l.id === id);
    return remove("locations", id, target, target?.nama_lokasi);
  };

  const addBlock = (b: Omit<Block, "id">) => insert("blocks", b);
  const updateBlock = (id: string, b: Partial<Block>) =>
    update("blocks", id, b);
  const deleteBlock = (id: string) => {
    const target = blocks.find((b) => b.id === id);
    return remove("blocks", id, target, target?.nama_blok);
  };

  const addUnitType = (u: Omit<UnitType, "id">) => insert("unit_types", u);
  const updateUnitType = (id: string, u: Partial<UnitType>) =>
    update("unit_types", id, u);
  const deleteUnitType = (id: string) => {
    const target = unitTypes.find((u) => u.id === id);
    return remove("unit_types", id, target, target?.nama_type);
  };

  const addSubsidyType = (s: Omit<SubsidyType, "id">) =>
    insert("subsidy_types", s);
  const updateSubsidyType = (id: string, s: Partial<SubsidyType>) =>
    update("subsidy_types", id, s);
  const deleteSubsidyType = (id: string) => {
    const target = subsidyTypes.find((s) => s.id === id);
    return remove("subsidy_types", id, target, target?.nama_type);
  };

  // --- Unit ---
  const addUnit = async (u: any) => {
    let blockId = u.block_id || "";
    if (!blockId && u.block_nama) {
      let locId = u.location_id || locations[0]?.id;
      if (!locId) {
        const [newLoc] = await dbInsert("locations", {
          nama_lokasi: "Perumahan Benteng Mutiara Mas",
          alamat:
            "Perum Benteng Mutiara Mas, Desa Benteng Kec. Cempaka Kab. Purwakarta",
        });
        locId = newLoc.id;
      }

      const existingBlock = blocks.find(
        (b) =>
          b.nama_blok.toLowerCase() === u.block_nama.toLowerCase() &&
          b.location_id === locId,
      );
      if (existingBlock) {
        blockId = existingBlock.id;
      } else {
        const [newBlock] = await dbInsert("blocks", {
          nama_blok: u.block_nama,
          location_id: locId,
        });
        blockId = newBlock.id;
      }
    }

    let unitTypeId = "";
    const existingType = unitTypes.find(
      (t) => t.nama_type.toLowerCase() === u.unit_type_nama.toLowerCase(),
    );
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
      const [newType] = await dbInsert("unit_types", {
        nama_type: u.unit_type_nama,
        luas_tanah: lt,
        luas_bangunan: lb,
      });
      unitTypeId = newType.id;
    }

    let subsidyTypeId = "";
    const existingSub = subsidyTypes.find(
      (s) => s.nama_type.toLowerCase() === u.kategori_kpr.toLowerCase(),
    );
    if (existingSub) {
      subsidyTypeId = existingSub.id;
    } else {
      const [newSub] = await dbInsert("subsidy_types", {
        nama_type: u.kategori_kpr,
        keterangan: "Kategori KPR",
      });
      subsidyTypeId = newSub.id;
    }

    let salesStepId = "";
    const existingStep = salesSteps.find(
      (s) => s.nama_step.toLowerCase() === u.sales_step_nama.toLowerCase(),
    );
    if (existingStep) {
      salesStepId = existingStep.id;
    } else {
      const [newStep] = await dbInsert("sales_steps", {
        nama_step: u.sales_step_nama,
        urutan: salesSteps.length + 1,
      });
      salesStepId = newStep.id;
    }

    await insert("units", {
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
      status: u.status,
    });
  };

  const updateUnit = async (id: string, u: any) => {
    const updateData: Record<string, any> = {};
    if (u.no_unit !== undefined) updateData.no_unit = u.no_unit;
    if (u.harga_dasar !== undefined) updateData.harga_dasar = u.harga_dasar;
    if (u.maksimal_kredit !== undefined)
      updateData.maksimal_kredit = u.maksimal_kredit;
    if (u.uang_muka !== undefined) updateData.uang_muka = u.uang_muka;
    if (u.booking_fee !== undefined) updateData.booking_fee = u.booking_fee;
    if (u.status !== undefined) updateData.status = u.status;
    if (u.certificate_step_id !== undefined)
      updateData.certificate_step_id = u.certificate_step_id || null;

    if (u.block_id !== undefined) {
      updateData.block_id = u.block_id;
    } else if (u.block_nama !== undefined) {
      let locId = u.location_id || locations[0]?.id;
      if (!locId) {
        const [newLoc] = await dbInsert("locations", {
          nama_lokasi: "Perumahan Benteng Mutiara Mas",
          alamat:
            "Perum Benteng Mutiara Mas, Desa Benteng Kec. Cempaka Kab. Purwakarta",
        });
        locId = newLoc.id;
      }
      let blockId = "";
      const existingBlock = blocks.find(
        (b) =>
          b.nama_blok.toLowerCase() === u.block_nama.toLowerCase() &&
          b.location_id === locId,
      );
      if (existingBlock) {
        blockId = existingBlock.id;
      } else {
        const [newBlock] = await dbInsert("blocks", {
          nama_blok: u.block_nama,
          location_id: locId,
        });
        blockId = newBlock.id;
      }
      updateData.block_id = blockId;
    }

    if (u.unit_type_nama !== undefined) {
      let unitTypeId = "";
      const existingType = unitTypes.find(
        (t) => t.nama_type.toLowerCase() === u.unit_type_nama.toLowerCase(),
      );
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
        const [newType] = await dbInsert("unit_types", {
          nama_type: u.unit_type_nama,
          luas_tanah: lt,
          luas_bangunan: lb,
        });
        unitTypeId = newType.id;
      }
      updateData.unit_type_id = unitTypeId;
    }

    if (u.kategori_kpr !== undefined) {
      let subsidyTypeId = "";
      const existingSub = subsidyTypes.find(
        (s) => s.nama_type.toLowerCase() === u.kategori_kpr.toLowerCase(),
      );
      if (existingSub) {
        subsidyTypeId = existingSub.id;
      } else {
        const [newSub] = await dbInsert("subsidy_types", {
          nama_type: u.kategori_kpr,
          keterangan: "Kategori KPR",
        });
        subsidyTypeId = newSub.id;
      }
      updateData.subsidy_type_id = subsidyTypeId;
    }

    if (u.sales_step_nama !== undefined) {
      let salesStepId = "";
      const existingStep = salesSteps.find(
        (s) => s.nama_step.toLowerCase() === u.sales_step_nama.toLowerCase(),
      );
      if (existingStep) {
        salesStepId = existingStep.id;
      } else {
        const [newStep] = await dbInsert("sales_steps", {
          nama_step: u.sales_step_nama,
          urutan: salesSteps.length + 1,
        });
        salesStepId = newStep.id;
      }
      updateData.sales_step_id = salesStepId;
    }

    await update("units", id, updateData);
  };

  const deleteUnit = async (id: string) => {
    const target = units.find((u) => u.id === id);
    const activeSale = sales.find(
      (s) => s.unit_id === id && s.status !== "Batal",
    );
    if (activeSale) {
      throw new Error(
        `Unit tidak dapat dihapus karena masih terdapat transaksi aktif atas nama "${activeSale.customer_nama || "Konsumen"}" (Status: ${activeSale.status}). Batalkan atau selesaikan transaksi terlebih dahulu.`,
      );
    }
    const label = target
      ? `${target.block_nama || ""} No ${target.no_unit}`.trim()
      : id;
    return remove("units", id, target, label);
  };

  // --- Marketing ---
  const addMarketerType = (mt: Omit<MarketerType, "id">) =>
    insert("marketer_types", mt);
  const deleteMarketerType = async (id: string) => {
    const target = marketerTypes.find((mt) => mt.id === id);

    // Hapus dulu data marketing_fees terkait agar tidak kena foreign key constraint
    const relatedFees = marketingFees.filter((f) => f.marketer_type_id === id);
    for (const fee of relatedFees) {
      await dbDelete("marketing_fees", fee.id, { skipTrash: true });
    }

    // Lepaskan relasi pada data marketers terkait
    const relatedMarketers = marketers.filter((m) => m.marketer_type_id === id);
    for (const m of relatedMarketers) {
      await dbUpdate("marketers", m.id, { marketer_type_id: null });
    }

    return remove("marketer_types", id, target, target?.nama_jenis);
  };
  const updateMarketingFees = async (
    marketerTypeId: string,
    updates: {
      kategori_unit: string;
      booking_fee: number | null;
      akad_fee: number | null;
    }[],
  ) => {
    for (const item of updates) {
      const existing = marketingFees.find(
        (f) =>
          f.marketer_type_id === marketerTypeId &&
          f.kategori_unit === item.kategori_unit,
      );
      if (existing) {
        await update("marketing_fees", existing.id, {
          booking_fee: item.booking_fee,
          akad_fee: item.akad_fee,
        });
      } else {
        await insert("marketing_fees", {
          marketer_type_id: marketerTypeId,
          kategori_unit: item.kategori_unit,
          booking_fee: item.booking_fee,
          akad_fee: item.akad_fee,
        });
      }
    }
  };
  const addMarketer = (m: Omit<Marketer, "id">) => insert("marketers", m);
  const updateMarketerData = (id: string, m: Partial<Marketer>) =>
    update("marketers", id, m);
  const deleteMarketerData = (id: string) => {
    const target = marketers.find((m) => m.id === id);
    return remove("marketers", id, target, target?.nama);
  };
  const addOnlineBooking = (ob: Omit<OnlineBooking, "id">) =>
    insert("online_bookings", ob);

  const convertBookingToSale = async (bookingId: string) => {
    await update("online_bookings", bookingId, { status: "Deal" });
    const booking = onlineBookings.find((b) => b.id === bookingId);
    if (!booking) return;
    const un = units.find((u) => u.id === booking.unit_id);
    await insert("sales", {
      customer_id: booking.customer_id,
      unit_id: booking.unit_id,
      tanggal_booking: booking.tanggal_booking,
      total_harga: un?.harga_dasar || 0,
      metode_bayar: "KPR",
      status: "Booking",
    });
    if (un) await update("units", un.id, { status: "Booking" });
  };

  // --- Gudang ---
  const addItem = (i: Omit<InventoryItem, "id">) => insert("items", i);
  const updateItem = (id: string, i: Partial<InventoryItem>) =>
    update("items", id, i);
  const deleteItem = (id: string) => {
    const target = items.find((i) => i.id === id);
    return remove("items", id, target, target?.nama_barang);
  };

  const addPurchase = async (p: any) => {
    const { items: poItems, ...purchaseData } = p;

    if (!purchaseData.no_po) {
      const now = new Date();
      const bulanRomawi = [
        "I",
        "II",
        "III",
        "IV",
        "V",
        "VI",
        "VII",
        "VIII",
        "IX",
        "X",
        "XI",
        "XII",
      ][now.getMonth()];
      const tahun = now.getFullYear();
      const matchingPos = purchases.filter(
        (item) =>
          item.no_po && item.no_po.includes(`/LSJ/PO/${bulanRomawi}/${tahun}`),
      );
      let maxSeq = 50;
      matchingPos.forEach((item) => {
        const seq = parseInt(item.no_po.split("/")[0], 10);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      });
      purchaseData.no_po = `${maxSeq + 1}/LSJ/PO/${bulanRomawi}/${tahun}`;
    }

    const subtotal = (poItems || []).reduce(
      (s: number, it: any) => s + (it.qty || 0) * (it.harga_satuan || 0),
      0,
    );
    purchaseData.total_harga =
      subtotal +
      (Number(purchaseData.biaya_pengiriman) || 0) +
      (Number(purchaseData.pajak) || 0);

    const created = await insert("purchases", purchaseData);

    if (poItems && poItems.length > 0) {
      for (const it of poItems) {
        await dbInsert("purchase_items", {
          purchase_id: created.id,
          item_id: it.item_id,
          qty: it.qty,
          harga_satuan: it.harga_satuan,
        });
      }
      await loadAll();
    }

    return created;
  };

  const updatePurchase = async (id: string, p: any) => {
    const { items: poItems, ...purchaseData } = p;

    if (poItems) {
      const subtotal = poItems.reduce(
        (s: number, it: any) => s + (it.qty || 0) * (it.harga_satuan || 0),
        0,
      );
      purchaseData.total_harga =
        subtotal +
        (Number(purchaseData.biaya_pengiriman) || 0) +
        (Number(purchaseData.pajak) || 0);
    }

    await update("purchases", id, purchaseData);

    if (poItems) {
      const existing = purchases.find((x) => x.id === id);
      if (existing?.items) {
        for (const oldItem of existing.items) {
          await dbDelete("purchase_items", oldItem.id, { skipTrash: true });
        }
      }
      for (const it of poItems) {
        await dbInsert("purchase_items", {
          purchase_id: id,
          item_id: it.item_id,
          qty: it.qty,
          harga_satuan: it.harga_satuan,
        });
      }
      await loadAll();
    }
  };

  const updatePurchaseStatus = (
    id: string,
    status: "Belum ditanggapi" | "Disetujui" | "Selesai" | "Ditolak",
  ) => update("purchases", id, { status });
  const deletePurchase = async (id: string) => {
    const target = purchases.find((p) => p.id === id);

    // Hapus dulu semua purchase_items terkait
    if (target?.items) {
      for (const it of target.items) {
        await dbDelete("purchase_items", it.id, { skipTrash: true });
      }
    }

    // Lepaskan referensi dari goods_in yang mungkin menunjuk ke PO ini,
    // supaya tidak kena foreign key constraint saat purchases dihapus.
    const relatedGoodsIn = goodsIn.filter((gi) => gi.purchase_id === id);
    for (const gi of relatedGoodsIn) {
      await dbUpdate("goods_in", gi.id, { purchase_id: null });
    }

    return remove("purchases", id, target, target?.no_po);
  };
  const addGoodsIn = async (gi: Omit<GoodsIn, "id">) => {
    const { items: giItems, no_po, ...dbData } = gi as any;
    if (dbData.purchase_id === "") dbData.purchase_id = null;
    await insert("goods_in", dbData);
    if (giItems) {
      for (const giItem of giItems) {
        const item = items.find((i) => i.id === giItem.item_id);
        if (item)
          await update("items", item.id, { stok: item.stok + giItem.qty });
      }
    }
  };

  const addGoodsOut = async (go: Omit<GoodsOut, "id">) => {
    const { items: goItems, unit_no, ...dbData } = go as any;
    await insert("goods_out", dbData);
    if (goItems) {
      for (const goItem of goItems) {
        const item = items.find((i) => i.id === goItem.item_id);
        if (item)
          await update("items", item.id, {
            stok: Math.max(0, item.stok - goItem.qty),
          });
      }
    }
  };

  // --- Keuangan ---
  const addCashBankAccount = (acc: Omit<CashBankAccount, "id">) =>
    insert("cash_bank_accounts", acc);
  const updateCashBankAccount = (id: string, acc: Partial<CashBankAccount>) =>
    update("cash_bank_accounts", id, acc);
  const deleteCashBankAccount = (id: string) => {
    const target = cashBankAccounts.find((a) => a.id === id);
    return remove("cash_bank_accounts", id, target, target?.nama_akun);
  };
  const addChartOfAccount = (coa: Omit<ChartOfAccount, "id">) =>
    insert("chart_of_accounts", coa);
  const updateChartOfAccount = (id: string, coa: Partial<ChartOfAccount>) =>
    update("chart_of_accounts", id, coa);
  const deleteChartOfAccount = (id: string) => {
    const target = chartOfAccounts.find((c) => c.id === id);
    return remove("chart_of_accounts", id, target, target?.nama_akun);
  };
  const addBankLoan = (bl: Omit<BankLoan, "id">) => insert("bank_loans", bl);
  const updateBankLoan = (id: string, bl: Partial<BankLoan>) =>
    update("bank_loans", id, bl);
  const deleteBankLoan = (id: string) => {
    const target = bankLoans.find((b) => b.id === id);
    return remove(
      "bank_loans",
      id,
      target,
      target ? `Pinjaman ${target.id}` : id,
    );
  };

  const addCashflowEntry = async (cfe: Omit<CashflowEntry, "id">) => {
    await insert("cashflow_entries", cfe);
    const acc = cashBankAccounts.find((a) => a.id === cfe.account_id);
    if (acc) {
      const delta = cfe.jenis === "Masuk" ? cfe.nominal : -cfe.nominal;
      await update("cash_bank_accounts", acc.id, { saldo: acc.saldo + delta });
    }
  };
  const updateCashflowEntry = (id: string, cfe: Partial<CashflowEntry>) =>
    update("cashflow_entries", id, cfe);
  const deleteCashflowEntry = (id: string) => {
    const target = cashflowEntries.find((c) => c.id === id);
    return remove("cashflow_entries", id, target, target?.keterangan || id);
  };

  const addMandorAdvance = (ma: Omit<MandorAdvance, "id">) =>
    insert("mandor_advances", ma);
  const updateMandorAdvance = (id: string, ma: Partial<MandorAdvance>) =>
    update("mandor_advances", id, ma);
  const deleteMandorAdvance = (id: string) => {
    const target = mandorAdvances.find((m) => m.id === id);
    return remove(
      "mandor_advances",
      id,
      target,
      target ? `Kasbon ${target.nama_mandor}` : id,
    );
  };

  // --- Progress Pekerjaan Mandor ---
  const addMandor = (m: Omit<Mandor, "id" | "created_at">) =>
    insert("mandors", m);
  const updateMandor = (id: string, m: Partial<Mandor>) =>
    update("mandors", id, m);
  const deleteMandor = (id: string) => {
    const target = mandors.find((m) => m.id === id);
    return remove("mandors", id, target, target?.nama_mandor);
  };

  const addOperationalExpense = (oe: Omit<OperationalExpense, "id">) =>
    insert("operational_expenses", oe);
  const addDisbursementRequest = (dr: Omit<DisbursementRequest, "id">) =>
    insert("disbursement_requests", dr);
  const updateDisbursementStatus = (
    id: string,
    status: "Diajukan" | "Disetujui" | "Dicairkan" | "Ditolak",
  ) => update("disbursement_requests", id, { status_approval: status });
  const addCompanyAsset = (ca: Omit<CompanyAsset, "id">) =>
    insert("company_assets", ca);
  const updateCompanyAsset = (id: string, ca: Partial<CompanyAsset>) =>
    update("company_assets", id, ca);
  const deleteCompanyAsset = (id: string) => {
    const target = companyAssets.find((c) => c.id === id);
    return remove("company_assets", id, target, target?.nama_aset);
  };

  // --- Penjualan ---
  const addSale = async (s: Omit<Sale, "id" | "created_at">) => {
    let saleData = { ...s };
    if (!saleData.no_penjualan) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const prefix = `INV/SALES/${year}/${month}/`;

      const matchingSales = sales.filter(
        (item) => item.no_penjualan && item.no_penjualan.startsWith(prefix),
      );
      let maxSeq = 0;
      matchingSales.forEach((item) => {
        const parts = item.no_penjualan!.split("/");
        const seqStr = parts[parts.length - 1];
        const seqNum = parseInt(seqStr, 10);
        if (!isNaN(seqNum) && seqNum > maxSeq) {
          maxSeq = seqNum;
        }
      });
      const urutan = String(maxSeq + 1).padStart(4, "0");
      saleData.no_penjualan = `${prefix}${urutan}`;
    }

    const dbData: Record<string, any> = {
      customer_id: saleData.customer_id,
      unit_id: saleData.unit_id,
      bank_id: saleData.bank_id || null,
      marketer_id: saleData.marketer_id || null,
      tanggal_booking: saleData.tanggal_booking,
      tanggal_transaksi: saleData.tanggal_transaksi || null,
      tanggal_akad: saleData.tanggal_akad || null,
      harga_kesepakatan: saleData.harga_kesepakatan || null,
      harga_jual_awal:
        saleData.harga_kesepakatan ||
        saleData.harga_jual_awal ||
        saleData.total_harga,
      potongan: saleData.diskon || saleData.potongan || 0,
      diskon: saleData.diskon || null,
      total_harga: saleData.total_harga,
      harga_jual_pajak: saleData.harga_jual_pajak || 0,
      booking_fee: saleData.booking_fee || 0,
      dp_nominal: saleData.dp_nominal || 0,
      metode_bayar: saleData.metode_bayar,
      kpr_status: saleData.kpr_status || null,
      status: saleData.status,
      komitmen_pembayaran: saleData.komitmen_pembayaran || null,
      marketing_user_id: saleData.marketing_user_id || null,
      no_penjualan: saleData.no_penjualan,
      kredit_pengajuan: saleData.kredit_pengajuan || 0,
      fee_marketer: saleData.fee_marketer || 0,
    };

    const inserted = await insert("sales", dbData);
    const statusMap: Record<string, Unit["status"]> = {
      Lunas: "Lunas",
      Akad: "Akad",
      DP: "DP",
      Booking: "Booking",
    };
    if (s.unit_id)
      await update("units", s.unit_id, {
        status: statusMap[s.status] || "Booking",
      });
    return inserted;
  };

  const updateSale = (id: string, s: Partial<Sale>) => update("sales", id, s);
  const updateSaleStatus = (id: string, status: Sale["status"]) =>
    update("sales", id, { status });
  const updateKprStatus = (id: string, kpr_status: Sale["kpr_status"]) =>
    update("sales", id, { kpr_status });

  const cancelSale = async (id: string) => {
    const sale = sales.find((s) => s.id === id);
    await update("sales", id, { status: "Batal" });
    if (sale?.unit_id)
      await update("units", sale.unit_id, { status: "Tersedia" });
  };

  const deleteSale = async (id: string) => {
    const target = sales.find((s) => s.id === id);
    if (target?.unit_id)
      await update("units", target.unit_id, { status: "Tersedia" });
    const label = target
      ? `${target.customer_nama || ""} - BLOK ${target.block_nama || ""} No ${target.unit_no || ""}`.trim()
      : id;
    return remove("sales", id, target, label);
  };

  const relocateUnit = async (
    saleId: string,
    newUnitId: string,
    newUnitNo: string,
  ) => {
    const sale = sales.find((s) => s.id === saleId);
    if (sale?.unit_id)
      await update("units", sale.unit_id, { status: "Tersedia" });
    await update("units", newUnitId, { status: sale?.status || "Booking" });
    await update("sales", saleId, { unit_id: newUnitId });
  };

  // --- Angsuran / Pembayaran Konsumen ---
  const addSalePayment = (p: Omit<SalePayment, "id" | "created_at">) =>
    insert("sale_payments", p);
  const updateSalePayment = (id: string, p: Partial<SalePayment>) =>
    update("sale_payments", id, p);
  const deleteSalePayment = (id: string) => {
    const target = salePayments.find((sp) => sp.id === id);
    return remove("sale_payments", id, target, target?.no_kwitansi || id);
  };

  // --- Biaya Tambahan ---
  const addSaleAdditionalCost = (
    c: Omit<SaleAdditionalCost, "id" | "created_at">,
  ) => insert("sale_additional_costs", c);
  const updateSaleAdditionalCost = (
    id: string,
    c: Partial<SaleAdditionalCost>,
  ) => update("sale_additional_costs", id, c);
  const deleteSaleAdditionalCost = (id: string) => {
    const target = saleAdditionalCosts.find((sac) => sac.id === id);
    return remove(
      "sale_additional_costs",
      id,
      target,
      target?.keterangan || id,
    );
  };

  // --- Potongan ---
  const addSaleDiscount = (d: Omit<SaleDiscount, "id" | "created_at">) =>
    insert("sale_discounts", d);
  const updateSaleDiscount = (id: string, d: Partial<SaleDiscount>) =>
    update("sale_discounts", id, d);
  const deleteSaleDiscount = (id: string) => {
    const target = saleDiscounts.find((sd) => sd.id === id);
    return remove("sale_discounts", id, target, target?.keterangan || id);
  };

  // --- Pengguna ---
  const toggleUserActive = (id: string) => {
    const u = users.find((u) => u.id === id);
    return update("users", id, { is_active: !u?.is_active });
  };
  const updateUser = (id: string, data: { nama: string; role: string }) =>
    update("users", id, data);

  return (
    <DataContext.Provider
      value={{
        currentUser,
        loading,
        companySettings,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        searchCustomers,
        banks,
        addBank,
        updateBank,
        deleteBank,
        salesSteps,
        addSalesStep,
        updateSalesStep,
        deleteSalesStep,
        certificateSteps,
        addCertificateStep,
        updateCertificateStep,
        deleteCertificateStep,
        priceItems,
        addPriceItem,
        updatePriceItem,
        deletePriceItem,
        locations,
        addLocation,
        updateLocation,
        deleteLocation,
        blocks,
        addBlock,
        updateBlock,
        deleteBlock,
        unitTypes,
        addUnitType,
        updateUnitType,
        deleteUnitType,
        subsidyTypes,
        addSubsidyType,
        updateSubsidyType,
        deleteSubsidyType,
        units,
        addUnit,
        updateUnit,
        deleteUnit,
        marketerTypes,
        addMarketerType,
        deleteMarketerType,
        marketingFees,
        updateMarketingFees,
        marketers,
        addMarketer,
        updateMarketerData,
        deleteMarketerData,
        onlineBookings,
        addOnlineBooking,
        convertBookingToSale,
        marketerRights,
        items,
        addItem,
        updateItem,
        deleteItem,
        purchases,
        addPurchase,
        updatePurchase,
        deletePurchase,
        updatePurchaseStatus,
        goodsIn,
        addGoodsIn,
        goodsOut,
        addGoodsOut,
        cashBankAccounts,
        addCashBankAccount,
        updateCashBankAccount,
        deleteCashBankAccount,
        chartOfAccounts,
        addChartOfAccount,
        updateChartOfAccount,
        deleteChartOfAccount,
        bankLoans,
        addBankLoan,
        updateBankLoan,
        deleteBankLoan,
        cashflowEntries,
        addCashflowEntry,
        updateCashflowEntry,
        deleteCashflowEntry,
        mandorAdvances,
        addMandorAdvance,
        updateMandorAdvance,
        deleteMandorAdvance,
        mandors,
        addMandor,
        updateMandor,
        deleteMandor,
        operationalExpenses,
        addOperationalExpense,
        disbursementRequests,
        addDisbursementRequest,
        updateDisbursementStatus,
        companyAssets,
        addCompanyAsset,
        updateCompanyAsset,
        deleteCompanyAsset,
        sales,
        addSale,
        updateSale,
        updateSaleStatus,
        updateKprStatus,
        cancelSale,
        deleteSale,
        relocateUnit,
        salePayments,
        addSalePayment,
        updateSalePayment,
        deleteSalePayment,
        saleAdditionalCosts,
        addSaleAdditionalCost,
        updateSaleAdditionalCost,
        deleteSaleAdditionalCost,
        saleDiscounts,
        addSaleDiscount,
        updateSaleDiscount,
        deleteSaleDiscount,
        users,
        toggleUserActive,
        updateUser: updateUser,
        trashItems,
        restoreFromTrash,
        permanentlyDeleteTrash,
        refresh: loadAll,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
}
