"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useData } from "@/lib/data-context";
import {
  FileSpreadsheet,
  Printer,
  Search,
  ExternalLink,
  UserCheck,
  Landmark,
  HardHat,
  Receipt,
} from "lucide-react";
import { formatRupiah } from "@/lib/format";
import * as XLSX from "xlsx";

interface EntityDetail {
  type: "customer" | "bank" | "mandor" | "operasional";
  id: string;
  nama: string;
  instansi: string;
  no_hp: string;
  alamat: string;
  perusahaanHutang: number;
  diaHutang: number;
  kasbonMandor: Array<{ tanggal: string; sisa: number }>;
  operasional: Array<{ tanggal: string; keterangan: string; sisa: number }>;
  penjualanUnit: Array<{
    id: string;
    tanggal: string;
    unit: string;
    komitmen: string;
    sisa: number;
  }>;
}

export default function LaporanHutangPiutangPage() {
  const {
    sales,
    salePayments,
    saleAdditionalCosts,
    saleDiscounts,
    customers,
    banks,
    bankLoans,
    mandorAdvances,
    operationalExpenses,
    units,
  } = useData();

  // Search states for tables
  const [searchKasbon, setSearchKasbon] = useState("");
  const [searchCash, setSearchCash] = useState("");
  const [searchKprCust, setSearchKprCust] = useState("");
  const [searchKprBank, setSearchKprBank] = useState("");
  const [searchOperasional, setSearchOperasional] = useState("");

  // Selected Detail for Drill-down modal/view
  const [selectedEntity, setSelectedEntity] = useState<EntityDetail | null>(
    null,
  );

  // --- Helper Calculations per Sale ---
  const saleCalculations = useMemo(() => {
    const map = new Map<
      string,
      {
        totalTagihan: number;
        totalBayar: number;
        sisa: number;
        terakhirBayar: string;
      }
    >();

    sales.forEach((s) => {
      const payments = salePayments.filter((p) => p.sale_id === s.id);
      const addCosts = saleAdditionalCosts.filter((c) => c.sale_id === s.id);
      const discounts = saleDiscounts.filter((d) => d.sale_id === s.id);

      const totalBayar = payments.reduce((sum, p) => sum + (p.nominal || 0), 0);
      const totalAddCosts = addCosts.reduce(
        (sum, c) => sum + (c.nominal || 0),
        0,
      );
      const totalDisc = discounts.reduce((sum, d) => sum + (d.nominal || 0), 0);

      const totalTagihan = (s.total_harga || 0) + totalAddCosts - totalDisc;
      const sisa = totalTagihan - totalBayar;

      let terakhirBayar = "-";
      if (payments.length > 0) {
        const sortedDates = [...payments].sort(
          (a, b) =>
            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime(),
        );
        terakhirBayar = sortedDates[0].tanggal;
      }

      map.set(s.id, { totalTagihan, totalBayar, sisa, terakhirBayar });
    });

    return map;
  }, [sales, salePayments, saleAdditionalCosts, saleDiscounts]);

  // --- 1. Kasbon Mandor ---
  const kasbonList = useMemo(() => {
    const grouped: Record<
      string,
      {
        nama: string;
        no_hp: string;
        instansi: string;
        merekaHutang: number;
        perusahaanHutang: number;
      }
    > = {};

    mandorAdvances.forEach((ma) => {
      const key = ma.nama_mandor || "Mandor Tanpa Nama";
      if (!grouped[key]) {
        grouped[key] = {
          nama: key,
          no_hp: "-",
          instansi: "MANDOR",
          merekaHutang: 0,
          perusahaanHutang: 0,
        };
      }
      const nominal = ma.nominal || 0;
      if (ma.status !== "Lunas") {
        if (nominal >= 0) {
          grouped[key].merekaHutang += nominal;
        } else {
          grouped[key].perusahaanHutang += Math.abs(nominal);
        }
      }
    });

    return Object.values(grouped);
  }, [mandorAdvances]);

  const filteredKasbon = useMemo(() => {
    return kasbonList.filter(
      (item) =>
        item.nama.toLowerCase().includes(searchKasbon.toLowerCase()) ||
        item.instansi.toLowerCase().includes(searchKasbon.toLowerCase()),
    );
  }, [kasbonList, searchKasbon]);

  const totalKasbonMereka = useMemo(
    () => filteredKasbon.reduce((acc, curr) => acc + curr.merekaHutang, 0),
    [filteredKasbon],
  );
  const totalKasbonPerusahaan = useMemo(
    () => filteredKasbon.reduce((acc, curr) => acc + curr.perusahaanHutang, 0),
    [filteredKasbon],
  );

  // --- 2. Penjualan Unit Cash ---
  const cashSalesList = useMemo(() => {
    const activeCashSales = sales.filter(
      (s) =>
        s.status !== "Batal" &&
        s.metode_bayar &&
        s.metode_bayar.toLowerCase().includes("cash"),
    );

    return activeCashSales.map((s) => {
      const cust = customers.find((c) => c.id === s.customer_id);
      const calc = saleCalculations.get(s.id) || {
        totalTagihan: 0,
        totalBayar: 0,
        sisa: 0,
        terakhirBayar: "-",
      };

      const sisa = calc.sisa;
      const merekaHutang = sisa > 0 ? sisa : 0;
      const perusahaanHutang = sisa < 0 ? Math.abs(sisa) : 0;

      return {
        saleId: s.id,
        customerId: s.customer_id,
        user: cust?.nama || s.customer_nama || "Tanpa Nama",
        noTelp: cust?.no_hp || "-",
        instansi: cust?.instansi || "-",
        alamat: cust?.alamat_ktp || cust?.alamat || "-",
        terakhirBayar: calc.terakhirBayar,
        merekaHutang,
        perusahaanHutang,
      };
    });
  }, [sales, customers, saleCalculations]);

  const filteredCashSales = useMemo(() => {
    return cashSalesList.filter(
      (item) =>
        item.user.toLowerCase().includes(searchCash.toLowerCase()) ||
        item.noTelp.includes(searchCash) ||
        item.instansi.toLowerCase().includes(searchCash.toLowerCase()),
    );
  }, [cashSalesList, searchCash]);

  const totalCashMereka = useMemo(
    () => filteredCashSales.reduce((acc, curr) => acc + curr.merekaHutang, 0),
    [filteredCashSales],
  );
  const totalCashPerusahaan = useMemo(
    () =>
      filteredCashSales.reduce((acc, curr) => acc + curr.perusahaanHutang, 0),
    [filteredCashSales],
  );

  // --- 3. Penjualan Unit KPR (Cust) ---
  const kprCustSalesList = useMemo(() => {
    const activeKprSales = sales.filter(
      (s) =>
        s.status !== "Batal" &&
        s.metode_bayar &&
        s.metode_bayar.toUpperCase() === "KPR" &&
        !(s.kpr_status || "").toUpperCase().includes("REJECT"),
    );

    return activeKprSales.map((s) => {
      const cust = customers.find((c) => c.id === s.customer_id);
      const calc = saleCalculations.get(s.id) || {
        totalTagihan: 0,
        totalBayar: 0,
        sisa: 0,
        terakhirBayar: "-",
      };

      const kreditDisetujui = s.kredit_pengajuan || 0;
      const tagihanKonsumen = Math.max(0, calc.totalTagihan - kreditDisetujui);
      const sisaKonsumen = tagihanKonsumen - calc.totalBayar;

      const merekaHutang = sisaKonsumen > 0 ? sisaKonsumen : 0;
      const perusahaanHutang = sisaKonsumen < 0 ? Math.abs(sisaKonsumen) : 0;

      return {
        saleId: s.id,
        customerId: s.customer_id,
        user: cust?.nama || s.customer_nama || "Tanpa Nama",
        noTelp: cust?.no_hp || "-",
        instansi: cust?.instansi || "-",
        alamat: cust?.alamat_ktp || cust?.alamat || "-",
        terakhirBayar: calc.terakhirBayar,
        merekaHutang,
        perusahaanHutang,
      };
    });
  }, [sales, customers, saleCalculations]);

  const filteredKprCust = useMemo(() => {
    return kprCustSalesList.filter(
      (item) =>
        item.user.toLowerCase().includes(searchKprCust.toLowerCase()) ||
        item.noTelp.includes(searchKprCust) ||
        item.instansi.toLowerCase().includes(searchKprCust.toLowerCase()),
    );
  }, [kprCustSalesList, searchKprCust]);

  const totalKprCustMereka = useMemo(
    () => filteredKprCust.reduce((acc, curr) => acc + curr.merekaHutang, 0),
    [filteredKprCust],
  );
  const totalKprCustPerusahaan = useMemo(
    () => filteredKprCust.reduce((acc, curr) => acc + curr.perusahaanHutang, 0),
    [filteredKprCust],
  );

  // --- 4. Penjualan Unit KPR (Bank) ---
  const kprBankList = useMemo(() => {
    const bankGroup: Record<
      string,
      {
        bankId: string;
        user: string;
        noTelp: string;
        instansi: string;
        alamat: string;
        merekaHutang: number;
        perusahaanHutang: number;
      }
    > = {};

    banks.forEach((b) => {
      bankGroup[b.id] = {
        bankId: b.id,
        user: b.nama_bank + (b.cabang ? ` ${b.cabang}` : ""),
        noTelp: b.pic_hp || "-",
        instansi: b.pic_nama || "BANK",
        alamat: `Bank ${b.nama_bank} - Cabang ${b.cabang || "Pusat"}`,
        merekaHutang: 0,
        perusahaanHutang: 0,
      };
    });

    sales.forEach((s) => {
      // Piutang ke Bank dihitung dari sales.kpr_status, yang disinkronkan
      // otomatis dari halaman Detail Penjualan > Approval Pengajuan KPR:
      // ACCEPTED -> kpr_status = 'SP3K' (lalu bisa lanjut manual ke 'Akad').
      // 'ACCEPTED' literal disisakan untuk kompatibilitas data lama, tapi
      // sumber kebenarannya sekarang selalu 'SP3K' / 'Akad'.
      if (
        s.status !== "Batal" &&
        s.metode_bayar === "KPR" &&
        s.bank_id &&
        bankGroup[s.bank_id] &&
        !(s.kpr_status || "").toUpperCase().includes("REJECT")
      ) {
        const nominalKpr = s.kredit_pengajuan || 0;
        if (
          s.kpr_status === "Akad" ||
          s.kpr_status === "ACCEPTED" ||
          s.kpr_status === "SP3K"
        ) {
          bankGroup[s.bank_id].merekaHutang += nominalKpr;
        }
      }
    });

    bankLoans.forEach((bl: any) => {
      if (bl.bank_id && bankGroup[bl.bank_id]) {
        const sisaPokok = bl.sisa_pokok || bl.nominal || 0;
        bankGroup[bl.bank_id].perusahaanHutang += sisaPokok;
      }
    });

    return Object.values(bankGroup).filter(
      (b) => b.merekaHutang > 0 || b.perusahaanHutang > 0,
    );
  }, [banks, sales, bankLoans]);

  const filteredKprBank = useMemo(() => {
    return kprBankList.filter(
      (item) =>
        item.user.toLowerCase().includes(searchKprBank.toLowerCase()) ||
        item.noTelp.includes(searchKprBank) ||
        item.instansi.toLowerCase().includes(searchKprBank.toLowerCase()),
    );
  }, [kprBankList, searchKprBank]);

  const totalKprBankMereka = useMemo(
    () => filteredKprBank.reduce((acc, curr) => acc + curr.merekaHutang, 0),
    [filteredKprBank],
  );
  const totalKprBankPerusahaan = useMemo(
    () => filteredKprBank.reduce((acc, curr) => acc + curr.perusahaanHutang, 0),
    [filteredKprBank],
  );

  // --- 5. Operasional ---
  const operasionalList = useMemo(() => {
    const grouped: Record<
      string,
      {
        user: string;
        noTelp: string;
        instansi: string;
        alamat: string;
        merekaHutang: number;
        perusahaanHutang: number;
      }
    > = {};

    operationalExpenses.forEach((oe) => {
      const userKey = oe.keterangan || oe.kategori || "Operasional General";
      if (!grouped[userKey]) {
        grouped[userKey] = {
          user: userKey,
          noTelp: "-",
          instansi: oe.kategori || "Biaya Operasional",
          alamat: "-",
          merekaHutang: 0,
          perusahaanHutang: 0,
        };
      }
      const nominal = oe.nominal || 0;
      if (nominal >= 0) {
        grouped[userKey].perusahaanHutang += nominal;
      } else {
        grouped[userKey].merekaHutang += Math.abs(nominal);
      }
    });

    return Object.values(grouped);
  }, [operationalExpenses]);

  const filteredOperasional = useMemo(() => {
    return operasionalList.filter(
      (item) =>
        item.user.toLowerCase().includes(searchOperasional.toLowerCase()) ||
        item.instansi.toLowerCase().includes(searchOperasional.toLowerCase()),
    );
  }, [operasionalList, searchOperasional]);

  const totalOperasionalMereka = useMemo(
    () => filteredOperasional.reduce((acc, curr) => acc + curr.merekaHutang, 0),
    [filteredOperasional],
  );
  const totalOperasionalPerusahaan = useMemo(
    () =>
      filteredOperasional.reduce((acc, curr) => acc + curr.perusahaanHutang, 0),
    [filteredOperasional],
  );

  // --- Summary Top Cards ---
  const grandTotalMerekaHutang = useMemo(() => {
    return (
      totalKasbonMereka +
      totalCashMereka +
      totalKprCustMereka +
      totalKprBankMereka +
      totalOperasionalMereka
    );
  }, [
    totalKasbonMereka,
    totalCashMereka,
    totalKprCustMereka,
    totalKprBankMereka,
    totalOperasionalMereka,
  ]);

  const grandTotalPerusahaanHutang = useMemo(() => {
    return (
      totalKasbonPerusahaan +
      totalCashPerusahaan +
      totalKprCustPerusahaan +
      totalKprBankPerusahaan +
      totalOperasionalPerusahaan
    );
  }, [
    totalKasbonPerusahaan,
    totalCashPerusahaan,
    totalKprCustPerusahaan,
    totalKprBankPerusahaan,
    totalOperasionalPerusahaan,
  ]);

  // --- Drill Down Click Handler ---
  const handleOpenDetail = (
    name: string,
    type: "customer" | "bank" | "mandor" | "operasional",
    specificCustId?: string,
    specificBankId?: string,
  ) => {
    let instansi = "-";
    let no_hp = "-";
    let alamat = "-";
    let diaHutang = 0;
    let perusahaanHutang = 0;

    let custObj = customers.find(
      (c) =>
        c.nama.toLowerCase() === name.toLowerCase() || c.id === specificCustId,
    );
    let bankObj = banks.find(
      (b) =>
        (b.nama_bank + (b.cabang ? ` ${b.cabang}` : "")).toLowerCase() ===
          name.toLowerCase() || b.id === specificBankId,
    );

    if (custObj) {
      name = custObj.nama;
      instansi = custObj.instansi || "-";
      no_hp = custObj.no_hp || "-";
      alamat = custObj.alamat_ktp || custObj.alamat || "-";
    } else if (bankObj) {
      name = bankObj.nama_bank + (bankObj.cabang ? ` ${bankObj.cabang}` : "");
      instansi = bankObj.pic_nama || "BANK";
      no_hp = bankObj.pic_hp || "-";
      alamat = `Bank ${bankObj.nama_bank} - Cabang ${bankObj.cabang || "Pusat"}`;
    }

    const userMandor = mandorAdvances
      .filter((ma) => ma.nama_mandor.toLowerCase() === name.toLowerCase())
      .map((ma) => ({ tanggal: ma.tanggal, sisa: ma.nominal }));

    const userOperasional = operationalExpenses
      .filter(
        (oe) =>
          (oe.keterangan &&
            oe.keterangan.toLowerCase().includes(name.toLowerCase())) ||
          (oe.kategori &&
            oe.kategori.toLowerCase().includes(name.toLowerCase())),
      )
      .map((oe) => ({
        tanggal: oe.tanggal,
        keterangan: oe.keterangan || oe.kategori,
        sisa: oe.nominal,
      }));

    const userSales = sales
      .filter((s) => {
        if (custObj && s.customer_id === custObj.id) return true;
        if (bankObj && s.bank_id === bankObj.id) return true;
        if (
          s.customer_nama &&
          s.customer_nama.toLowerCase() === name.toLowerCase()
        )
          return true;
        return false;
      })
      .map((s) => {
        const calc = saleCalculations.get(s.id) || { sisa: 0 };
        const unitItem = units.find((u) => u.id === s.unit_id);
        const unitLabel = `${unitItem?.location_nama || "Perumahan"} BLOK ${unitItem?.block_nama || ""} No ${unitItem?.no_unit || ""}`;

        return {
          id: s.id,
          tanggal: s.tanggal_booking || s.created_at.slice(0, 10),
          unit: unitLabel,
          komitmen: s.komitmen_pembayaran || "Sesuai SPPR",
          sisa: calc.sisa,
        };
      });

    userSales.forEach((us) => {
      if (us.sisa > 0) diaHutang += us.sisa;
      else if (us.sisa < 0) perusahaanHutang += Math.abs(us.sisa);
    });

    userMandor.forEach((um) => {
      if (um.sisa > 0) diaHutang += um.sisa;
      else if (um.sisa < 0) perusahaanHutang += Math.abs(um.sisa);
    });

    userOperasional.forEach((uo) => {
      if (uo.sisa > 0) perusahaanHutang += uo.sisa;
      else if (uo.sisa < 0) diaHutang += Math.abs(uo.sisa);
    });

    setSelectedEntity({
      type,
      id: custObj?.id || bankObj?.id || name,
      nama: name,
      instansi,
      no_hp,
      alamat,
      perusahaanHutang,
      diaHutang,
      kasbonMandor: userMandor,
      operasional: userOperasional,
      penjualanUnit: userSales,
    });
  };

  const handleExportExcelAll = () => {
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(filteredKasbon),
      "Kasbon_Mandor",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(filteredCashSales),
      "Penjualan_Cash",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(filteredKprCust),
      "KPR_Konsumen",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(filteredKprBank),
      "KPR_Bank",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(filteredOperasional),
      "Operasional",
    );

    XLSX.writeFile(wb, "Laporan_Hutang_Piutang_Lansena.xlsx");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Laporan Hutang Piutang
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Rekapitulasi piutang konsumen, kasbon mandor, hutang bank &amp;
              operasional perusahaan
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-semibold border border-slate-300 transition"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              <span>Print Data</span>
            </button>
            <button
              onClick={handleExportExcelAll}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-md text-xs transition shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Big KPI Totals Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <UserCheck className="w-36 h-36 text-white" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-wider opacity-90">
              Mereka Hutang (Piutang)
            </p>
            <p className="text-3xl sm:text-4xl font-extrabold mt-2 tracking-tight">
              {formatRupiah(grandTotalMerekaHutang)}
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl text-white shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Landmark className="w-36 h-36 text-white" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-wider opacity-90">
              Perusahaan Hutang (Kewajiban)
            </p>
            <p className="text-3xl sm:text-4xl font-extrabold mt-2 tracking-tight">
              {formatRupiah(grandTotalPerusahaanHutang)}
            </p>
          </div>
        </div>

        {/* Detail Drilldown Modal */}
        {selectedEntity && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 space-y-6 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    List Hutang Piutang
                  </h2>
                  <p className="text-xs text-slate-400">
                    Detail rincian tagihan &amp; kewajiban per pengguna / bank
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEntity(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  Tutup [X]
                </button>
              </div>

              {/* Entity Profile Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-700">
                <div className="space-y-1.5">
                  <p>
                    <span className="font-semibold text-slate-500 inline-block w-28">
                      Nama:
                    </span>{" "}
                    <span className="font-bold text-slate-800 text-sm">
                      {selectedEntity.nama}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500 inline-block w-28">
                      Instansi:
                    </span>{" "}
                    <span>{selectedEntity.instansi}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500 inline-block w-28">
                      No Handphone:
                    </span>{" "}
                    <span className="font-mono">{selectedEntity.no_hp}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500 inline-block w-28">
                      Alamat:
                    </span>{" "}
                    <span>{selectedEntity.alamat}</span>
                  </p>
                </div>
                <div className="flex flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
                  <div className="bg-red-50 border border-red-200 p-2.5 rounded-md">
                    <p className="text-slate-500 font-semibold text-[11px]">
                      Perusahaan Hutang
                    </p>
                    <p className="text-lg font-bold text-red-600">
                      {formatRupiah(selectedEntity.perusahaanHutang)}
                    </p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-md">
                    <p className="text-slate-500 font-semibold text-[11px]">
                      Dia Hutang (Mereka Hutang)
                    </p>
                    <p className="text-lg font-bold text-emerald-600">
                      {formatRupiah(selectedEntity.diaHutang)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sub Table 1: Kasbon Mandor */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-amber-500" />
                  <span>Kasbon Mandor</span>
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left text-slate-600">
                    <thead className="bg-slate-100 font-semibold text-slate-500">
                      <tr>
                        <th className="p-2.5">Tgl Transaksi</th>
                        <th className="p-2.5 text-right">Sisa Kasbon</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedEntity.kasbonMandor.length === 0 ? (
                        <tr>
                          <td
                            colSpan={2}
                            className="p-3 text-center text-slate-400"
                          >
                            Tidak ada data kasbon mandor.
                          </td>
                        </tr>
                      ) : (
                        selectedEntity.kasbonMandor.map((km, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5">{km.tanggal}</td>
                            <td className="p-2.5 text-right font-bold text-slate-800">
                              {formatRupiah(km.sisa)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sub Table 2: Operasional */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-sky-500" />
                  <span>Operasional</span>
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left text-slate-600">
                    <thead className="bg-slate-100 font-semibold text-slate-500">
                      <tr>
                        <th className="p-2.5">Tgl Transaksi</th>
                        <th className="p-2.5">Keterangan</th>
                        <th className="p-2.5 text-right">Sisa Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedEntity.operasional.length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            className="p-3 text-center text-slate-400"
                          >
                            Tidak ada data operasional.
                          </td>
                        </tr>
                      ) : (
                        selectedEntity.operasional.map((op, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5">{op.tanggal}</td>
                            <td className="p-2.5">{op.keterangan}</td>
                            <td className="p-2.5 text-right font-bold text-slate-800">
                              {formatRupiah(op.sisa)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sub Table 3: Penjualan Unit */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  <span>Penjualan Unit</span>
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left text-slate-600">
                    <thead className="bg-slate-100 font-semibold text-slate-500">
                      <tr>
                        <th className="p-2.5">Tgl Transaksi</th>
                        <th className="p-2.5">Unit</th>
                        <th className="p-2.5">Komitmen Pembayaran</th>
                        <th className="p-2.5 text-right">Sisa Nominal</th>
                        <th className="p-2.5 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedEntity.penjualanUnit.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-3 text-center text-slate-400"
                          >
                            Tidak ada transaksi penjualan unit.
                          </td>
                        </tr>
                      ) : (
                        selectedEntity.penjualanUnit.map((pu) => (
                          <tr key={pu.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-medium">{pu.tanggal}</td>
                            <td className="p-2.5 font-bold text-slate-800">
                              {pu.unit}
                            </td>
                            <td className="p-2.5 text-slate-500">
                              {pu.komitmen}
                            </td>
                            <td className="p-2.5 text-right font-bold text-emerald-600">
                              {formatRupiah(pu.sisa)}
                            </td>
                            <td className="p-2.5 text-center">
                              <Link
                                href={`/penjualan/daftar/${pu.id}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold transition shadow-sm"
                              >
                                <span>Detail</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TABLE 1: Kasbon Mandor */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Kasbon Mandor
              </h3>
              <p className="text-xs text-slate-400">
                Rekapitulasi sisa kasbon mandor proyek
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchKasbon}
                onChange={(e) => setSearchKasbon(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">No Telp</th>
                  <th className="py-2.5 px-4">Institusi</th>
                  <th className="py-2.5 px-4 text-right">Mereka Hutang</th>
                  <th className="py-2.5 px-4 text-right">Perusahaan Hutang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredKasbon.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      Belum ada data kasbon mandor.
                    </td>
                  </tr>
                ) : (
                  filteredKasbon.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <button
                          onClick={() => handleOpenDetail(item.nama, "mandor")}
                          className="font-bold text-blue-600 hover:underline text-left"
                        >
                          {item.nama}
                        </button>
                      </td>
                      <td className="py-2.5 px-4">{item.no_hp}</td>
                      <td className="py-2.5 px-4">{item.instansi}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-600">
                        {formatRupiah(item.merekaHutang)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-rose-600">
                        {formatRupiah(item.perusahaanHutang)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
                <tr>
                  <td colSpan={3} className="py-3 px-4 uppercase text-xs">
                    Total Kasbon Mandor
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-600">
                    {formatRupiah(totalKasbonMereka)}
                  </td>
                  <td className="py-3 px-4 text-right text-rose-600">
                    {formatRupiah(totalKasbonPerusahaan)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* TABLE 2: Penjualan Unit Cash */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Penjualan Unit Cash
              </h3>
              <p className="text-xs text-slate-400">
                Daftar sisa tagihan penjualan unit metode Cash / Cash Bertahap
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchCash}
                onChange={(e) => setSearchCash(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">No Telp</th>
                  <th className="py-2.5 px-4">Institusi</th>
                  <th className="py-2.5 px-4 text-center">Terakhir Bayar</th>
                  <th className="py-2.5 px-4 text-right">Mereka Hutang</th>
                  <th className="py-2.5 px-4 text-right">Perusahaan Hutang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCashSales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      Belum ada data penjualan unit cash.
                    </td>
                  </tr>
                ) : (
                  filteredCashSales.map((item) => (
                    <tr
                      key={item.saleId}
                      className="hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <button
                          onClick={() =>
                            handleOpenDetail(
                              item.user,
                              "customer",
                              item.customerId,
                            )
                          }
                          className="font-bold text-blue-600 hover:underline text-left"
                        >
                          {item.user}
                        </button>
                      </td>
                      <td className="py-2.5 px-4">{item.noTelp}</td>
                      <td className="py-2.5 px-4">{item.instansi}</td>
                      <td className="py-2.5 px-4 text-center font-mono">
                        {item.terakhirBayar}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-600">
                        {formatRupiah(item.merekaHutang)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-rose-600">
                        {formatRupiah(item.perusahaanHutang)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
                <tr>
                  <td colSpan={4} className="py-3 px-4 uppercase text-xs">
                    Total Penjualan Unit Cash
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-600">
                    {formatRupiah(totalCashMereka)}
                  </td>
                  <td className="py-3 px-4 text-right text-rose-600">
                    {formatRupiah(totalCashPerusahaan)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* TABLE 3: Penjualan Unit KPR (Cust) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Penjualan Unit KPR (Cust)
              </h3>
              <p className="text-xs text-slate-400">
                Tagihan porsi konsumen (DP / sisa non-KPR) untuk transaksi KPR
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchKprCust}
                onChange={(e) => setSearchKprCust(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">No Telp</th>
                  <th className="py-2.5 px-4">Institusi</th>
                  <th className="py-2.5 px-4 text-center">Terakhir Bayar</th>
                  <th className="py-2.5 px-4 text-right">Mereka Hutang</th>
                  <th className="py-2.5 px-4 text-right">Perusahaan Hutang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredKprCust.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      Belum ada data piutang KPR konsumen.
                    </td>
                  </tr>
                ) : (
                  filteredKprCust.map((item) => (
                    <tr
                      key={item.saleId}
                      className="hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <button
                          onClick={() =>
                            handleOpenDetail(
                              item.user,
                              "customer",
                              item.customerId,
                            )
                          }
                          className="font-bold text-blue-600 hover:underline text-left"
                        >
                          {item.user}
                        </button>
                      </td>
                      <td className="py-2.5 px-4">{item.noTelp}</td>
                      <td className="py-2.5 px-4">{item.instansi}</td>
                      <td className="py-2.5 px-4 text-center font-mono">
                        {item.terakhirBayar}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-600">
                        {formatRupiah(item.merekaHutang)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-rose-600">
                        {formatRupiah(item.perusahaanHutang)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
                <tr>
                  <td colSpan={4} className="py-3 px-4 uppercase text-xs">
                    Total Penjualan Unit KPR (Cust)
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-600">
                    {formatRupiah(totalKprCustMereka)}
                  </td>
                  <td className="py-3 px-4 text-right text-rose-600">
                    {formatRupiah(totalKprCustPerusahaan)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* TABLE 4: Penjualan Unit KPR (Bank) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Penjualan Unit KPR (Bank)
              </h3>
              <p className="text-xs text-slate-400">
                Plafon akad KPR yang akan / sedang diproses pencairannya oleh
                Bank
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchKprBank}
                onChange={(e) => setSearchKprBank(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">No Telp</th>
                  <th className="py-2.5 px-4">Institusi</th>
                  <th className="py-2.5 px-4 text-right">Mereka Hutang</th>
                  <th className="py-2.5 px-4 text-right">Perusahaan Hutang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredKprBank.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      Belum ada data KPR Bank.
                    </td>
                  </tr>
                ) : (
                  filteredKprBank.map((item) => (
                    <tr
                      key={item.bankId}
                      className="hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <button
                          onClick={() =>
                            handleOpenDetail(
                              item.user,
                              "bank",
                              undefined,
                              item.bankId,
                            )
                          }
                          className="font-bold text-blue-600 hover:underline text-left"
                        >
                          {item.user}
                        </button>
                      </td>
                      <td className="py-2.5 px-4">{item.noTelp}</td>
                      <td className="py-2.5 px-4">{item.instansi}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-600">
                        {formatRupiah(item.merekaHutang)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-rose-600">
                        {formatRupiah(item.perusahaanHutang)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
                <tr>
                  <td colSpan={3} className="py-3 px-4 uppercase text-xs">
                    Total Penjualan Unit KPR (Bank)
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-600">
                    {formatRupiah(totalKprBankMereka)}
                  </td>
                  <td className="py-3 px-4 text-right text-rose-600">
                    {formatRupiah(totalKprBankPerusahaan)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* TABLE 5: Operasional */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Operasional
              </h3>
              <p className="text-xs text-slate-400">
                Kewajiban &amp; piutang pengeluaran operasional proyek
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchOperasional}
                onChange={(e) => setSearchOperasional(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">No Telp</th>
                  <th className="py-2.5 px-4">Institusi</th>
                  <th className="py-2.5 px-4 text-right">Mereka Hutang</th>
                  <th className="py-2.5 px-4 text-right">Perusahaan Hutang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOperasional.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      Belum ada data hutang operasional.
                    </td>
                  </tr>
                ) : (
                  filteredOperasional.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <button
                          onClick={() =>
                            handleOpenDetail(item.user, "operasional")
                          }
                          className="font-bold text-blue-600 hover:underline text-left"
                        >
                          {item.user}
                        </button>
                      </td>
                      <td className="py-2.5 px-4">{item.noTelp}</td>
                      <td className="py-2.5 px-4">{item.instansi}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-600">
                        {formatRupiah(item.merekaHutang)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-rose-600">
                        {formatRupiah(item.perusahaanHutang)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
                <tr>
                  <td colSpan={3} className="py-3 px-4 uppercase text-xs">
                    Total Operasional
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-600">
                    {formatRupiah(totalOperasionalMereka)}
                  </td>
                  <td className="py-3 px-4 text-right text-rose-600">
                    {formatRupiah(totalOperasionalPerusahaan)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
