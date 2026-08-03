'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Unit } from '@/types';
import { Plus, Edit3, Trash2, Home, Settings, Layers } from 'lucide-react';
import { formatRupiah, parseRupiah } from '@/lib/format';

export default function UnitRumahPage() {
  const {
    units,
    locations,
    blocks,
    unitTypes,
    subsidyTypes,
    salesSteps,
    certificateSteps,
    priceItems,
    addUnit,
    updateUnit,
    deleteUnit,
    addSalesStep,
    addCertificateStep,
    addPriceItem,
    addLocation,
    addBlock,
    addUnitType,
    addSubsidyType,
  } = useData();

  const [activeTab, setActiveTab] = useState<'units' | 'master'>('units');
  const [masterSubTab, setMasterSubTab] = useState<
    'salesStep' | 'certStep' | 'priceItem' | 'location' | 'block' | 'unitType' | 'subsidyType'
  >('salesStep');

  // Modal Unit State
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);

  const [unitForm, setUnitForm] = useState({
    no_unit: '',
    block_nama: '',
    unit_type_nama: '',
    kategori_kpr: 'Subsidi',
    sales_step_nama: 'Kantor',
    certificate_step_id: '',
    harga_dasar: 450000000,
    status: 'Tersedia' as Unit['status'],
  });

  // Modal Master Add State
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [masterFormText, setMasterFormText] = useState('');
  const [masterFormExtra, setMasterFormExtra] = useState({
    luas_tanah: 72,
    luas_bangunan: 36,
    nominal: 10000000,
    location_id: '',
    alamat: '',
  });

  const openAddUnitModal = () => {
    setEditingUnitId(null);
    setUnitForm({
      no_unit: '',
      block_nama: '',
      unit_type_nama: '',
      kategori_kpr: 'Subsidi',
      sales_step_nama: 'Kantor',
      certificate_step_id: certificateSteps[0]?.id || '',
      harga_dasar: 450000000,
      status: 'Tersedia',
    });
    setIsUnitModalOpen(true);
  };

  const openEditUnitModal = (u: Unit) => {
    setEditingUnitId(u.id);
    setUnitForm({
      no_unit: u.no_unit,
      block_nama: u.block_nama || '',
      unit_type_nama: u.unit_type_nama || '',
      kategori_kpr: u.subsidy_type_nama || 'Subsidi',
      sales_step_nama: u.sales_step_nama || 'Kantor',
      certificate_step_id: u.certificate_step_id || '',
      harga_dasar: u.harga_dasar,
      status: u.status,
    });
    setIsUnitModalOpen(true);
  };

  const handleUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitForm.no_unit) return;

    if (editingUnitId) {
      updateUnit(editingUnitId, unitForm);
    } else {
      addUnit(unitForm);
    }
    setIsUnitModalOpen(false);
  };

  const handleMasterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterFormText) return;

    if (masterSubTab === 'salesStep') {
      addSalesStep({ nama_step: masterFormText, urutan: salesSteps.length + 1 });
    } else if (masterSubTab === 'certStep') {
      addCertificateStep({ nama_step: masterFormText, urutan: certificateSteps.length + 1 });
    } else if (masterSubTab === 'priceItem') {
      addPriceItem({ nama_item: masterFormText, nominal: masterFormExtra.nominal });
    } else if (masterSubTab === 'location') {
      addLocation({ nama_lokasi: masterFormText, alamat: masterFormExtra.alamat || 'Alamat lokasi' });
    } else if (masterSubTab === 'block') {
      addBlock({ location_id: masterFormExtra.location_id || locations[0]?.id, nama_blok: masterFormText });
    } else if (masterSubTab === 'unitType') {
      addUnitType({
        nama_type: masterFormText,
        luas_tanah: masterFormExtra.luas_tanah,
        luas_bangunan: masterFormExtra.luas_bangunan,
      });
    } else if (masterSubTab === 'subsidyType') {
      addSubsidyType({ nama_type: masterFormText, keterangan: 'Skema pembiayaan' });
    }

    setMasterFormText('');
    setIsMasterModalOpen(false);
  };

  const unitColumns: Column<Unit>[] = [
    {
      header: 'No. Unit',
      accessorKey: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold font-mono text-xs">
            {r.no_unit}
          </div>
          <span className="font-bold text-slate-800">{r.no_unit}</span>
        </div>
      ),
      sortable: true,
    },
    { header: 'Lokasi Perumahan', accessorKey: (r) => r.location_nama || '-', sortable: true },
    { header: 'Blok', accessorKey: (r) => r.block_nama || '-', sortable: true },
    { header: 'Tipe Rumah', accessorKey: (r) => r.unit_type_nama || '-', sortable: true },
    { header: 'Kategori KPR', accessorKey: (r) => r.subsidy_type_nama || '-', sortable: true },
    {
      header: 'Harga Dasar',
      accessorKey: (r) => <span className="font-semibold">Rp {r.harga_dasar.toLocaleString('id-ID')}</span>,
      sortable: true,
    },
    {
      header: 'Step Penjualan',
      accessorKey: (r) => (
        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          {r.sales_step_nama || '-'}
        </span>
      ),
      sortable: true,
    },
    {
      header: 'Step Sertifikat',
      accessorKey: (r) => (
        <span className="text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-300">
          {r.certificate_step_nama || '-'}
        </span>
      ),
      sortable: true,
    },
    {
      header: 'Status Unit',
      accessorKey: (r) => (
        <Badge
          variant={
            r.status === 'Tersedia'
              ? 'sky'
              : r.status === 'Booking' || r.status === 'DP'
              ? 'amber'
              : 'emerald'
          }
        >
          {r.status}
        </Badge>
      ),
      sortable: true,
    },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Data Unit Properti</h1>
          <p className="text-xs text-slate-400 mt-1">Tabel utama komposit data unit rumah beserta referensi master data</p>
        </div>

        {/* Top View Selector Tabs */}
        <div className="flex items-center p-1 bg-white border border-slate-200 rounded-md w-fit">
          <button
            onClick={() => setActiveTab('units')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition ${
              activeTab === 'units'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Tabel Utama Unit</span>
          </button>
          <button
            onClick={() => setActiveTab('master')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition ${
              activeTab === 'master'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Kelola Master Data</span>
          </button>
        </div>
      </div>

      {activeTab === 'units' ? (
        <DataTable
          title="Tabel Gabungan Unit Rumah"
          data={units}
          columns={unitColumns}
          searchPlaceholder="Cari no. unit, lokasi, tipe, status..."
          exportFileName="Data_Unit_Lansena"
          headerAction={
            <button
              onClick={openAddUnitModal}
              className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-sm transition shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Unit Rumah</span>
            </button>
          }
          actions={(row) => (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => openEditUnitModal(row)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition"
                title="Edit Unit"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={async () => {
                  if (!window.confirm(`Hapus unit ${row.no_unit}? Pastikan tidak ada transaksi aktif.`)) return;
                  try {
                    await deleteUnit(row.id);
                  } catch (err: any) {
                    alert(err.message || 'Gagal menghapus unit. Cek apakah masih ada transaksi terkait.');
                  }
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-50 transition"
                title="Hapus Unit"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      ) : (
        <div className="bg-white/60 border border-slate-200 rounded-md p-6 shadow-xl  space-y-6">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
            {[
              { id: 'salesStep', label: 'Step Penjualan' },
              { id: 'certStep', label: 'Step Sertifikat' },
              { id: 'priceItem', label: 'Item Harga' },
              { id: 'location', label: 'Lokasi Perumahan' },
              { id: 'block', label: 'Blok Perumahan' },
              { id: 'unitType', label: 'Type Unit' },
              { id: 'subsidyType', label: 'Type Subsidi' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMasterSubTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
                  masterSubTab === tab.id
                    ? 'bg-blue-50 text-blue-600 border border-teal-500/40'
                    : 'bg-white/60 text-slate-400 hover:text-slate-700 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 capitalize">Master {masterSubTab}</h3>
            <button
              onClick={() => {
                setMasterFormText('');
                setIsMasterModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-blue-600 rounded-md text-xs font-bold transition border border-slate-300"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Master Item</span>
            </button>
          </div>

          {/* Master Item List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {masterSubTab === 'salesStep' &&
              salesSteps.map((s) => (
                <div key={s.id} className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs flex justify-between items-center">
                  <span className="font-semibold text-slate-700">{s.nama_step}</span>
                  <span className="text-slate-500 font-mono">Urutan: {s.urutan}</span>
                </div>
              ))}

            {masterSubTab === 'certStep' &&
              certificateSteps.map((c) => (
                <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs flex justify-between items-center">
                  <span className="font-semibold text-slate-700">{c.nama_step}</span>
                  <span className="text-slate-500 font-mono">Urutan: {c.urutan}</span>
                </div>
              ))}

            {masterSubTab === 'priceItem' &&
              priceItems.map((p) => (
                <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs flex justify-between items-center">
                  <span className="font-semibold text-slate-700">{p.nama_item}</span>
                  <span className="text-blue-600 font-bold">Rp {p.nominal.toLocaleString('id-ID')}</span>
                </div>
              ))}

            {masterSubTab === 'location' &&
              locations.map((l) => (
                <div key={l.id} className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-1">
                  <p className="font-bold text-slate-700">{l.nama_lokasi}</p>
                  <p className="text-slate-400 text-[11px]">{l.alamat}</p>
                </div>
              ))}

            {masterSubTab === 'block' &&
              blocks.map((b) => (
                <div key={b.id} className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs flex justify-between items-center">
                  <span className="font-semibold text-slate-700">{b.nama_blok}</span>
                  <span className="text-slate-400 text-[11px]">{b.location_nama}</span>
                </div>
              ))}

            {masterSubTab === 'unitType' &&
              unitTypes.map((t) => (
                <div key={t.id} className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-1">
                  <p className="font-bold text-slate-700">{t.nama_type}</p>
                  <p className="text-slate-400 text-[11px]">Luas Tanah: {t.luas_tanah}m² | Bangunan: {t.luas_bangunan}m²</p>
                </div>
              ))}

            {masterSubTab === 'subsidyType' &&
              subsidyTypes.map((s) => (
                <div key={s.id} className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-1">
                  <p className="font-bold text-slate-700">{s.nama_type}</p>
                  <p className="text-slate-400 text-[11px]">{s.keterangan}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Modal Add / Edit Unit */}
      <Modal
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        title={editingUnitId ? 'Edit Unit Rumah' : 'Tambah Unit Rumah Baru'}
      >
        <form onSubmit={handleUnitSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nomor Unit *</label>
              <input
                type="text"
                required
                value={unitForm.no_unit}
                onChange={(e) => setUnitForm({ ...unitForm, no_unit: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
                placeholder="Contoh: A-01"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Harga Dasar (Rp) *</label>
              <input
                type="text"
                required
                value={formatRupiah(unitForm.harga_dasar)}
                onChange={(e) => {
                  const cleanVal = e.target.value.replace(/\D/g, '');
                  setUnitForm({ ...unitForm, harga_dasar: Number(cleanVal) || 0 });
                }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Blok Perumahan *</label>
              <input
                type="text"
                required
                value={unitForm.block_nama}
                onChange={(e) => setUnitForm({ ...unitForm, block_nama: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
                placeholder="Contoh: Blok A"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tipe Unit *</label>
              <input
                type="text"
                required
                value={unitForm.unit_type_nama}
                onChange={(e) => setUnitForm({ ...unitForm, unit_type_nama: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
                placeholder="Contoh: 36/72"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Kategori KPR</label>
              <select
                value={unitForm.kategori_kpr}
                onChange={(e) => setUnitForm({ ...unitForm, kategori_kpr: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              >
                <option value="Subsidi">Subsidi</option>
                <option value="Komersil">Komersil</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Status Unit</label>
              <select
                value={unitForm.status}
                onChange={(e) => setUnitForm({ ...unitForm, status: e.target.value as any })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              >
                <option value="Tersedia">Tersedia</option>
                <option value="Booking">Booking</option>
                <option value="DP">DP</option>
                <option value="Akad">Akad</option>
                <option value="Lunas">Lunas</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Step Penjualan</label>
              <select
                value={unitForm.sales_step_nama}
                onChange={(e) => setUnitForm({ ...unitForm, sales_step_nama: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              >
                <option value="Kantor">Kantor</option>
                <option value="BTN">BTN</option>
                <option value="BRI">BRI</option>
                <option value="BJB">BJB</option>
                <option value="Mandiri">Mandiri</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Step Sertifikat</label>
              <select
                value={unitForm.certificate_step_id}
                onChange={(e) => setUnitForm({ ...unitForm, certificate_step_id: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              >
                {certificateSteps.map((cs) => (
                  <option key={cs.id} value={cs.id}>
                    {cs.nama_step}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsUnitModalOpen(false)}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-md text-xs font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-xs transition shadow-md"
            >
              Simpan Unit
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Add Master Data */}
      <Modal
        isOpen={isMasterModalOpen}
        onClose={() => setIsMasterModalOpen(false)}
        title={`Tambah Master Data (${masterSubTab})`}
      >
        <form onSubmit={handleMasterSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nama / Judul *</label>
            <input
              type="text"
              required
              value={masterFormText}
              onChange={(e) => setMasterFormText(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              placeholder="Masukkan nama master item..."
            />
          </div>

          {masterSubTab === 'unitType' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Luas Tanah (m²)</label>
                <input
                  type="number"
                  value={masterFormExtra.luas_tanah}
                  onChange={(e) => setMasterFormExtra({ ...masterFormExtra, luas_tanah: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Luas Bangunan (m²)</label>
                <input
                  type="number"
                  value={masterFormExtra.luas_bangunan}
                  onChange={(e) => setMasterFormExtra({ ...masterFormExtra, luas_bangunan: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none"
                />
              </div>
            </div>
          )}

          {masterSubTab === 'priceItem' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nominal (Rp)</label>
              <input
                type="number"
                value={masterFormExtra.nominal}
                onChange={(e) => setMasterFormExtra({ ...masterFormExtra, nominal: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsMasterModalOpen(false)}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-md text-xs font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-xs transition shadow-md"
            >
              Simpan Master
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
