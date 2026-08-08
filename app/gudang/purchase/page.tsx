'use client';

import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { Search, Plus, Edit, Eye, Printer, Trash2, FileText, CheckCircle2 } from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import * as XLSX from 'xlsx';

interface PurchaseItemRow {
  namaBarang: string;
  qty: number;
  satuan: string;
  harga: number;
}

interface PurchaseOrderRecord {
  id: string;
  poNumber: string;
  tanggal: string;
  admin: string;
  tokoTujuan: string;
  alamatToko?: string;
  teleponToko?: string;
  lokasi: string;
  blok: string;
  catatan: string;
  termin: string;
  biayaPengiriman: number;
  pajak: number;
  metodePembayaran: string;
  status: 'Belum ditanggapi' | 'Disetujui' | 'Selesai' | 'Ditolak';
  penerima: string;
  alamatKirim: string;
  items: PurchaseItemRow[];
}

export default function PurchasePage() {
  const { purchases, addPurchase } = useData();

  const [searchQuery, setSearchQuery] = useState('');

  // Initial mock data combined with store data to mirror exact user example
  const [localPurchases, setLocalPurchases] = useState<PurchaseOrderRecord[]>([
    {
      id: 'po-001',
      poNumber: '51/LSJ/PO/XI/2025',
      tanggal: '19/11/2025',
      admin: 'FAHRUL ROZI',
      tokoTujuan: 'PT. TRIPILAR ABADI BANGUN PERSADA',
      alamatToko: 'Jl. Syaikh Kuro, Telagasari, Karawang Timur',
      teleponToko: '-',
      lokasi: 'Benteng Mutiara Mas',
      blok: 'BLOK P30',
      catatan: 'CASH',
      termin: '30 HARI',
      biayaPengiriman: 0,
      pajak: 0,
      metodePembayaran: 'Transfer',
      status: 'Belum ditanggapi',
      penerima: 'Tasam (081282749555)',
      alamatKirim: 'DESA BENTENG - PURWAKARTA',
      items: [
        {
          namaBarang: 'Semen Patriot',
          qty: 200,
          satuan: 'Pcs',
          harga: 41000,
        },
      ],
    },
    {
      id: 'po-002',
      poNumber: '52/LSJ/PO/XI/2025',
      tanggal: '20/11/2025',
      admin: 'FAHRUL ROZI',
      tokoTujuan: 'TB. JAYA BERSAMA',
      alamatToko: 'Jl. Raya Cempaka No. 45 Purwakarta',
      teleponToko: '081234567890',
      lokasi: 'Benteng Mutiara Mas',
      blok: 'BLOK A2',
      catatan: 'TEMPO 1 BULAN',
      termin: '30 HARI',
      biayaPengiriman: 50000,
      pajak: 0,
      metodePembayaran: 'Transfer, Cash',
      status: 'Disetujui',
      penerima: 'Tasam (081282749555)',
      alamatKirim: 'DESA BENTENG - PURWAKARTA',
      items: [
        {
          namaBarang: 'Abu batu',
          qty: 5,
          satuan: 'Rit',
          harga: 1110000,
        },
      ],
    },
  ]);

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const [selectedPo, setSelectedPo] = useState<PurchaseOrderRecord | null>(null);

  // Form Fields State
  const [formState, setFormState] = useState<{
    id?: string;
    tanggal: string;
    lokasi: string;
    blok: string;
    tokoTujuan: string;
    catatan: string;
    termin: string;
    biayaPengiriman: number;
    metodePembayaran: string;
    admin: string;
    status: PurchaseOrderRecord['status'];
    items: PurchaseItemRow[];
  }>({
    tanggal: '19/11/2025',
    lokasi: 'Benteng Mutiara Mas',
    blok: 'BLOK P30',
    tokoTujuan: 'PT. TRIPILAR ABADI BANGUN PERSADA',
    catatan: 'CASH',
    termin: '30 HARI',
    biayaPengiriman: 0,
    metodePembayaran: 'Transfer',
    admin: 'FAHRUL ROZI',
    status: 'Belum ditanggapi',
    items: [
      {
        namaBarang: 'Semen Patriot',
        qty: 200,
        satuan: 'Pcs',
        harga: 41000,
      },
    ],
  });

  const filteredPurchases = useMemo(() => {
    return localPurchases.filter(
      (p) =>
        p.tokoTujuan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.lokasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.blok.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.admin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [localPurchases, searchQuery]);

  const handleOpenAdd = () => {
    const nextId = `po-00${localPurchases.length + 1}`;
    setFormState({
      id: nextId,
      tanggal: new Date().toLocaleDateString('id-ID'),
      lokasi: 'Benteng Mutiara Mas',
      blok: 'BLOK P30',
      tokoTujuan: 'PT. TRIPILAR ABADI BANGUN PERSADA',
      catatan: 'CASH',
      termin: '30 HARI',
      biayaPengiriman: 0,
      metodePembayaran: 'Transfer',
      admin: 'FAHRUL ROZI',
      status: 'Belum ditanggapi',
      items: [
        {
          namaBarang: 'Semen Patriot',
          qty: 200,
          satuan: 'Pcs',
          harga: 41000,
        },
      ],
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (po: PurchaseOrderRecord) => {
    setFormState({
      id: po.id,
      tanggal: po.tanggal,
      lokasi: po.lokasi,
      blok: po.blok,
      tokoTujuan: po.tokoTujuan,
      catatan: po.catatan,
      termin: po.termin,
      biayaPengiriman: po.biayaPengiriman,
      metodePembayaran: po.metodePembayaran,
      admin: po.admin,
      status: po.status,
      items: [...po.items],
    });
    setIsFormOpen(true);
  };

  const handleOpenDetail = (po: PurchaseOrderRecord) => {
    setSelectedPo(po);
    setIsDetailOpen(true);
  };

  const handleOpenPrint = (po: PurchaseOrderRecord) => {
    setSelectedPo(po);
    setIsPrintOpen(true);
  };

  const handleAddItemRow = () => {
    setFormState((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          namaBarang: '',
          qty: 1,
          satuan: 'Pcs',
          harga: 0,
        },
      ],
    }));
  };

  const handleRemoveItemRow = (idx: number) => {
    setFormState((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const handleSaveData = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.tokoTujuan || !formState.tanggal) return;

    if (formState.id) {
      setLocalPurchases((prev) =>
        prev.map((p) =>
          p.id === formState.id
            ? {
                ...p,
                tanggal: formState.tanggal,
                lokasi: formState.lokasi,
                blok: formState.blok,
                tokoTujuan: formState.tokoTujuan,
                catatan: formState.catatan,
                termin: formState.termin,
                biayaPengiriman: Number(formState.biayaPengiriman),
                metodePembayaran: formState.metodePembayaran,
                admin: formState.admin,
                status: formState.status,
                items: formState.items,
              }
            : p
        )
      );
    } else {
      const newPo: PurchaseOrderRecord = {
        id: `po-${Date.now()}`,
        poNumber: `${localPurchases.length + 51}/LSJ/PO/XI/2025`,
        tanggal: formState.tanggal,
        admin: formState.admin,
        tokoTujuan: formState.tokoTujuan,
        alamatToko: 'Jl. Syaikh Kuro, Telagasari, Karawang Timur',
        teleponToko: '-',
        lokasi: formState.lokasi,
        blok: formState.blok,
        catatan: formState.catatan,
        termin: formState.termin,
        biayaPengiriman: Number(formState.biayaPengiriman),
        pajak: 0,
        metodePembayaran: formState.metodePembayaran,
        status: formState.status,
        penerima: 'Tasam (081282749555)',
        alamatKirim: 'DESA BENTENG - PURWAKARTA',
        items: formState.items,
      };
      setLocalPurchases((prev) => [newPo, ...prev]);
    }

    setIsFormOpen(false);
  };

  const handleExportExcel = () => {
    const data = filteredPurchases.map((p) => ({
      Tanggal: p.tanggal,
      'Dibuat Oleh': p.admin,
      'Toko Tujuan': p.tokoTujuan,
      Lokasi: `${p.lokasi} Blok ${p.blok}`,
      Catatan: p.catatan,
      Status: p.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar_Purchase');
    XLSX.writeFile(workbook, 'Daftar_Purchase_Lansena.xlsx');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Daftar Purchase</h1>
            <p className="text-xs text-slate-400 mt-1">Pencatatan &amp; pengelolaan Purchase Order (PO) material proyek</p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition shadow-md self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Purchase Order</span>
          </button>
        </div>

        {/* Main Purchase Table Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Show</span>
              <select className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Dibuat Oleh</th>
                  <th className="py-3 px-4">Toko Tujuan</th>
                  <th className="py-3 px-4">Lokasi</th>
                  <th className="py-3 px-4">Catatan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">Tidak ada purchase order ditemukan.</td>
                  </tr>
                ) : (
                  filteredPurchases.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium">{po.tanggal}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{po.admin}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{po.tokoTujuan}</td>
                      <td className="py-3 px-4">{po.lokasi} {po.blok}</td>
                      <td className="py-3 px-4 font-semibold text-slate-600">{po.catatan}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            po.status === 'Disetujui' || po.status === 'Selesai'
                              ? 'bg-emerald-100 text-emerald-700'
                              : po.status === 'Ditolak'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(po)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold inline-flex items-center gap-1 transition"
                            title="Detail Purchase"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>Detail</span>
                          </button>
                          <button
                            onClick={() => handleOpenEdit(po)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold inline-flex items-center gap-1 transition"
                            title="Edit Form"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleOpenPrint(po)}
                            className="px-2.5 py-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded text-xs font-bold inline-flex items-center gap-1 transition shadow-sm"
                            title="Print PO"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus Purchase Order (${po.poNumber}) ke ${po.tokoTujuan}?`)) {
                                setLocalPurchases((prev) => prev.filter((item) => item.id !== po.id));
                              }
                            }}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-xs font-semibold inline-flex items-center gap-1 transition border border-rose-200"
                            title="Hapus Purchase"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 1. Form Edit / Add Purchase Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-lg font-bold text-slate-800">Form Purchase</h2>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  [X]
                </button>
              </div>

              <form onSubmit={handleSaveData} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tanggal *</label>
                    <input
                      type="text"
                      required
                      value={formState.tanggal}
                      onChange={(e) => setFormState({ ...formState, tanggal: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="19/11/2025"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Admin</label>
                    <input
                      type="text"
                      value={formState.admin}
                      onChange={(e) => setFormState({ ...formState, admin: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Lokasi</label>
                    <input
                      type="text"
                      value={formState.lokasi}
                      onChange={(e) => setFormState({ ...formState, lokasi: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Benteng Mutiara Mas"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Blok</label>
                    <input
                      type="text"
                      value={formState.blok}
                      onChange={(e) => setFormState({ ...formState, blok: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="BLOK P30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Toko Tujuan</label>
                    <input
                      type="text"
                      required
                      value={formState.tokoTujuan}
                      onChange={(e) => setFormState({ ...formState, tokoTujuan: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="PT. TRIPILAR ABADI BANGUN PERSADA"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Catatan</label>
                    <input
                      type="text"
                      value={formState.catatan}
                      onChange={(e) => setFormState({ ...formState, catatan: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="CASH"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Termin</label>
                    <input
                      type="text"
                      value={formState.termin}
                      onChange={(e) => setFormState({ ...formState, termin: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="30 HARI"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Biaya Pengiriman</label>
                    <input
                      type="number"
                      value={formState.biayaPengiriman}
                      onChange={(e) => setFormState({ ...formState, biayaPengiriman: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Status</label>
                    <select
                      value={formState.status}
                      onChange={(e) => setFormState({ ...formState, status: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                    >
                      <option value="Belum ditanggapi">Belum ditanggapi</option>
                      <option value="Disetujui">Disetujui</option>
                      <option value="Selesai">Selesai</option>
                      <option value="Ditolak">Ditolak</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Metode Pembayaran</label>
                  <input
                    type="text"
                    value={formState.metodePembayaran}
                    onChange={(e) => setFormState({ ...formState, metodePembayaran: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Transfer"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    *) Gunakan tanda koma (,) jika metode pembayaran lebih dari satu
                  </p>
                </div>

                {/* Sub Table Item Purchase */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Daftar Item Barang *</label>
                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded text-[11px] inline-flex items-center gap-1 border border-blue-200"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Item</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formState.items.map((it, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <div className="col-span-5">
                          <input
                            type="text"
                            placeholder="Nama Barang"
                            value={it.namaBarang}
                            onChange={(e) => {
                              const updated = [...formState.items];
                              updated[idx].namaBarang = e.target.value;
                              setFormState({ ...formState, items: updated });
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            placeholder="Qty"
                            value={it.qty}
                            onChange={(e) => {
                              const updated = [...formState.items];
                              updated[idx].qty = Number(e.target.value);
                              setFormState({ ...formState, items: updated });
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Satuan"
                            value={it.satuan}
                            onChange={(e) => {
                              const updated = [...formState.items];
                              updated[idx].satuan = e.target.value;
                              setFormState({ ...formState, items: updated });
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            placeholder="Harga"
                            value={it.harga}
                            onChange={(e) => {
                              const updated = [...formState.items];
                              updated[idx].harga = Number(e.target.value);
                              setFormState({ ...formState, items: updated });
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                          />
                        </div>
                        <div className="col-span-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-lg transition shadow-md"
                  >
                    Save Data
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. Detail Purchase Modal */}
        {isDetailOpen && selectedPo && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-6 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Daftar Purchase</h2>
                  <p className="text-xs text-blue-600 font-semibold mt-0.5">Detail Purchase</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  Tutup [X]
                </button>
              </div>

              {/* Informasi Purchase */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-1">Informasi Purchase</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p><span className="font-semibold text-slate-500 inline-block w-28">Tanggal:</span> <span className="font-mono">{selectedPo.tanggal}</span></p>
                  <p><span className="font-semibold text-slate-500 inline-block w-28">Dibuat Oleh:</span> <span className="font-bold text-slate-800">{selectedPo.admin}</span></p>
                  <p><span className="font-semibold text-slate-500 inline-block w-28">Untuk Lokasi:</span> <span className="font-semibold text-slate-800">{selectedPo.lokasi} {selectedPo.blok}</span></p>
                  <p><span className="font-semibold text-slate-500 inline-block w-28">Catatan:</span> <span>{selectedPo.catatan}</span></p>
                  <p><span className="font-semibold text-slate-500 inline-block w-28">Status:</span> <span className="font-bold text-emerald-600">{selectedPo.status}</span></p>
                </div>
              </div>

              {/* Daftar Item Purchase */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-800 text-sm">Daftar Item Purchase</h3>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-100 font-bold text-slate-700 uppercase border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-12 text-center">No</th>
                        <th className="p-3">Nama Barang</th>
                        <th className="p-3 text-center">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedPo.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-center font-bold text-slate-500">{idx + 1}.</td>
                          <td className="p-3 font-bold text-slate-800">{item.namaBarang}</td>
                          <td className="p-3 text-center font-bold text-blue-600 font-mono">{item.qty} {item.satuan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Official Print Purchase Order Modal */}
        {isPrintOpen && selectedPo && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-8 space-y-6 text-slate-900 animate-in fade-in zoom-in duration-200 my-8">
              {/* Modal Actions */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
                <p className="text-xs text-slate-500 font-bold">Pratinjau Print Purchase Order</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-md transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak PO</span>
                  </button>
                  <button
                    onClick={() => setIsPrintOpen(false)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                  >
                    Tutup [X]
                  </button>
                </div>
              </div>

              {/* PRINT CONTENT BODY */}
              <div className="p-4 bg-white font-sans text-xs text-slate-900 leading-normal space-y-4">
                {/* Official Kop Surat */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                  <div className="flex items-center gap-3">
                    <img src="/logo.jpg" alt="Logo" className="h-16 w-auto object-contain" />
                    <div>
                      <h1 className="text-xl font-black text-slate-900 tracking-wider">PT LAN SENA JAYA</h1>
                      <p className="text-xs font-bold text-slate-800 tracking-wider">DEVELOPER &amp; CONTRACTOR</p>
                      <p className="text-[10px] text-slate-600">Perum Benteng Mutiara Mas Ruko No. 16 Babakan Situ 004/002</p>
                      <p className="text-[10px] text-slate-600">Desa Benteng Kec. Cempaka Kab. Purwakarta (0264) - 8308450 Jawa Barat 41181</p>
                    </div>
                  </div>
                </div>

                {/* Document Title */}
                <div className="text-center py-2">
                  <h2 className="text-base font-extrabold tracking-widest text-slate-900 uppercase underline decoration-2 underline-offset-4">PURCHASE ORDER</h2>
                </div>

                {/* Header Grid Information */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/80 p-3.5 rounded-lg border border-slate-300">
                  <div className="space-y-1">
                    <p><span className="font-semibold text-slate-600 inline-block w-24">Kepada:</span> <span className="font-bold">{selectedPo.tokoTujuan}</span></p>
                    <p><span className="font-semibold text-slate-600 inline-block w-24">Alamat:</span> <span>{selectedPo.alamatToko || 'Jl. Syaikh Kuro, Telagasari, Karawang Timur'}</span></p>
                    <p><span className="font-semibold text-slate-600 inline-block w-24">Telepon:</span> <span>{selectedPo.teleponToko || '-'}</span></p>
                  </div>
                  <div className="space-y-1">
                    <p><span className="font-semibold text-slate-600 inline-block w-24">PO Number:</span> <span className="font-bold font-mono">{selectedPo.poNumber}</span></p>
                    <p><span className="font-semibold text-slate-600 inline-block w-24">Tanggal:</span> <span>Rabu, 19 November 2025</span></p>
                    <p><span className="font-semibold text-slate-600 inline-block w-24">Proyek:</span> <span className="font-bold">{selectedPo.lokasi}</span></p>
                    <p><span className="font-semibold text-slate-600 inline-block w-24">Termin:</span> <span className="font-bold">{selectedPo.catatan}</span></p>
                    <p><span className="font-semibold text-slate-600 inline-block w-24">Penerima:</span> <span>{selectedPo.penerima}</span></p>
                    <p><span className="font-semibold text-slate-600 inline-block w-24">Alamat Kirim:</span> <span>{selectedPo.alamatKirim}</span></p>
                  </div>
                </div>

                {/* A. Bahan Material Table */}
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">A. Bahan Material</h4>
                  <table className="w-full border-collapse border border-slate-300 text-xs">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
                        <th className="border border-slate-300 p-2 w-10 text-center">No</th>
                        <th className="border border-slate-300 p-2 text-left">Description</th>
                        <th className="border border-slate-300 p-2 w-16 text-center">Qty</th>
                        <th className="border border-slate-300 p-2 w-20 text-center">Satuan</th>
                        <th className="border border-slate-300 p-2 w-28 text-right">Harga</th>
                        <th className="border border-slate-300 p-2 w-32 text-right">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPo.items.map((it, idx) => {
                        const jumlah = it.qty * it.harga;
                        return (
                          <tr key={idx}>
                            <td className="border border-slate-300 p-2 text-center">{idx + 1}.</td>
                            <td className="border border-slate-300 p-2 font-bold">{it.namaBarang}</td>
                            <td className="border border-slate-300 p-2 text-center font-bold">{it.qty}</td>
                            <td className="border border-slate-300 p-2 text-center">{it.satuan}</td>
                            <td className="border border-slate-300 p-2 text-right font-mono">{it.harga.toLocaleString('id-ID')}</td>
                            <td className="border border-slate-300 p-2 text-right font-mono font-bold">Rp{jumlah.toLocaleString('id-ID')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      {(() => {
                        const subtotal = selectedPo.items.reduce((s, i) => s + i.qty * i.harga, 0);
                        const grandTotal = subtotal + (selectedPo.pajak || 0) + (selectedPo.biayaPengiriman || 0);
                        return (
                          <>
                            <tr>
                              <td colSpan={5} className="border border-slate-300 p-2 text-right font-bold bg-slate-50">Subtotal</td>
                              <td className="border border-slate-300 p-2 text-right font-mono font-bold bg-slate-50">Rp{subtotal.toLocaleString('id-ID')}</td>
                            </tr>
                            <tr>
                              <td colSpan={5} className="border border-slate-300 p-2 text-right font-bold bg-slate-50">Pajak</td>
                              <td className="border border-slate-300 p-2 text-right font-mono font-bold bg-slate-50">Rp{(selectedPo.pajak || 0).toLocaleString('id-ID')}</td>
                            </tr>
                            <tr>
                              <td colSpan={5} className="border border-slate-300 p-2 text-right font-bold bg-slate-50">Biaya Pengiriman</td>
                              <td className="border border-slate-300 p-2 text-right font-mono font-bold bg-slate-50">Rp{(selectedPo.biayaPengiriman || 0).toLocaleString('id-ID')}</td>
                            </tr>
                            <tr className="font-extrabold text-sm">
                              <td colSpan={5} className="border border-slate-300 p-2 text-right uppercase bg-slate-100">Total</td>
                              <td className="border border-slate-300 p-2 text-right font-mono bg-slate-100 text-blue-700">Rp{grandTotal.toLocaleString('id-ID')}</td>
                            </tr>
                          </>
                        );
                      })()}
                    </tfoot>
                  </table>
                </div>

                {/* B. Sistem Pembayaran */}
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">B. Sistem Pembayaran</h4>
                  <table className="w-full border-collapse border border-slate-300 text-xs">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
                        <th className="border border-slate-300 p-2 w-10 text-center">No</th>
                        <th className="border border-slate-300 p-2 text-left">Metode Pembayaran</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPo.metodePembayaran.split(',').map((metode, idx) => (
                        <tr key={idx}>
                          <td className="border border-slate-300 p-2 text-center">{idx + 1}.</td>
                          <td className="border border-slate-300 p-2 font-semibold">{metode.trim()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Official Signatures Block */}
                <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs">
                  <div>
                    <p className="font-bold text-slate-800">Received by</p>
                    <div className="h-16 flex items-end justify-center">
                      <p className="text-[10px] text-slate-400 italic">Official Stamp &amp; Signature</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Prepared by</p>
                    <div className="h-16 flex items-end justify-center">
                      <p className="font-bold text-slate-900 underline">Deni Suhendar</p>
                    </div>
                    <p className="text-[11px] text-slate-500 font-semibold">Purchasing</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Approved by</p>
                    <div className="h-16 flex items-end justify-center">
                      <p className="font-bold text-slate-900 underline">Alan Suherlan</p>
                    </div>
                    <p className="text-[11px] text-slate-500 font-semibold">Director</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
