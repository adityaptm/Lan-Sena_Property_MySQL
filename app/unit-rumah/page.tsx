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
    updateSalesStep,
    deleteSalesStep,
    addCertificateStep,
    updateCertificateStep,
    deleteCertificateStep,
    addPriceItem,
    updatePriceItem,
    deletePriceItem,
    addLocation,
    updateLocation,
    deleteLocation,
    addBlock,
    updateBlock,
    deleteBlock,
    addUnitType,
    updateUnitType,
    deleteUnitType,
    addSubsidyType,
    updateSubsidyType,
    deleteSubsidyType,
  } = useData();

  const [editingMasterId, setEditingMasterId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'units' | 'master'>('units');
  const [masterSubTab, setMasterSubTab] = useState<
    'salesStep' | 'certStep' | 'priceItem' | 'location' | 'block' | 'unitType' | 'subsidyType'
  >('salesStep');

  // Modal Unit State
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);

  const [unitForm, setUnitForm] = useState({
    no_unit: '',
    location_id: '',
    block_id: '',
    block_nama: '',
    unit_type_nama: '30/60',
    kategori_kpr: 'Subsidi',
    sales_step_nama: 'Kantor',
    certificate_step_id: '',
    harga_dasar: 0,
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
    kode_lokasi: '',
  });

  const openAddUnitModal = () => {
    setEditingUnitId(null);
    setUnitForm({
      no_unit: '',
      location_id: locations[0]?.id || '',
      block_id: '',
      block_nama: '',
      unit_type_nama: '30/60',
      kategori_kpr: 'Subsidi',
      sales_step_nama: 'Kantor',
      certificate_step_id: certificateSteps[0]?.id || '',
      harga_dasar: 0,
      status: 'Tersedia',
    });
    setIsUnitModalOpen(true);
  };

  const openEditUnitModal = (u: Unit) => {
    setEditingUnitId(u.id);
    const foundBlock = blocks.find(b => b.nama_blok === u.block_nama);
    setUnitForm({
      no_unit: u.no_unit,
      location_id: foundBlock?.location_id || '',
      block_id: foundBlock?.id || '',
      block_nama: u.block_nama || '',
      unit_type_nama: u.unit_type_nama || '30/60',
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

  const handleMasterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingMasterId) {
        if (masterSubTab === 'salesStep') {
          await updateSalesStep(editingMasterId, { nama_step: masterFormText });
        } else if (masterSubTab === 'certStep') {
          await updateCertificateStep(editingMasterId, { nama_step: masterFormText });
        } else if (masterSubTab === 'priceItem') {
          await updatePriceItem(editingMasterId, { nama_item: masterFormText, nominal: masterFormExtra.nominal });
        } else if (masterSubTab === 'location') {
          await updateLocation(editingMasterId, { nama_lokasi: masterFormText, alamat: masterFormExtra.alamat || masterFormText, kode_lokasi: masterFormExtra.kode_lokasi });
        } else if (masterSubTab === 'block') {
          await updateBlock(editingMasterId, { location_id: masterFormExtra.location_id, nama_blok: masterFormText });
        } else if (masterSubTab === 'unitType') {
          const typeMatch = masterFormText.match(/(\d+)\s*\/\s*(\d+)/);
          const lb = typeMatch ? parseInt(typeMatch[1]) : masterFormExtra.luas_bangunan;
          const lt = typeMatch ? parseInt(typeMatch[2]) : masterFormExtra.luas_tanah;
          await updateUnitType(editingMasterId, { nama_type: masterFormText, luas_tanah: lt, luas_bangunan: lb });
        } else if (masterSubTab === 'subsidyType') {
          await updateSubsidyType(editingMasterId, { nama_type: masterFormText });
        }
      } else {
        if (masterSubTab === 'salesStep') {
          await addSalesStep({ nama_step: masterFormText, urutan: salesSteps.length + 1 });
        } else if (masterSubTab === 'certStep') {
          await addCertificateStep({ nama_step: masterFormText, urutan: certificateSteps.length + 1 });
        } else if (masterSubTab === 'priceItem') {
          if (!masterFormText) return;
          await addPriceItem({ nama_item: masterFormText, nominal: masterFormExtra.nominal });
        } else if (masterSubTab === 'location') {
          if (!masterFormText) return;
          await addLocation({ nama_lokasi: masterFormText, alamat: masterFormExtra.alamat || masterFormText, kode_lokasi: masterFormExtra.kode_lokasi });
        } else if (masterSubTab === 'block') {
          if (!masterFormText || !masterFormExtra.location_id) { alert('Pilih Perumahan terlebih dahulu!'); return; }
          await addBlock({ location_id: masterFormExtra.location_id, nama_blok: masterFormText });
        } else if (masterSubTab === 'unitType') {
          if (!masterFormText) return;
          const typeMatch = masterFormText.match(/(\d+)\s*\/\s*(\d+)/);
          const lb = typeMatch ? parseInt(typeMatch[1]) : masterFormExtra.luas_bangunan;
          const lt = typeMatch ? parseInt(typeMatch[2]) : masterFormExtra.luas_tanah;
          await addUnitType({ nama_type: masterFormText, luas_tanah: lt, luas_bangunan: lb });
        } else if (masterSubTab === 'subsidyType') {
          if (!masterFormText) return;
          await addSubsidyType({ nama_type: masterFormText, keterangan: 'Skema pembiayaan' });
        }
      }

      setIsMasterModalOpen(false);
      setEditingMasterId(null);
      setMasterFormText('');
      setMasterFormExtra({ luas_tanah: 72, luas_bangunan: 36, nominal: 10000000, location_id: '', alamat: '', kode_lokasi: '' });
    } catch (err: any) {
      alert('Gagal menyimpan master data: ' + err.message);
    }
  };

  const openEditMasterModal = (tab: typeof masterSubTab, item: any) => {
    setEditingMasterId(item.id);
    setMasterSubTab(tab);
    if (tab === 'salesStep' || tab === 'certStep') {
      setMasterFormText(item.nama_step || '');
      setMasterFormExtra(prev => ({ ...prev }));
    } else if (tab === 'priceItem') {
      setMasterFormText(item.nama_item || '');
      setMasterFormExtra(prev => ({ ...prev, nominal: item.nominal || 0 }));
    } else if (tab === 'location') {
      setMasterFormText(item.nama_lokasi || '');
      setMasterFormExtra(prev => ({ ...prev, alamat: item.alamat || '', kode_lokasi: item.kode_lokasi || '' }));
    } else if (tab === 'block') {
      setMasterFormText(item.nama_blok || '');
      setMasterFormExtra(prev => ({ ...prev, location_id: item.location_id || '' }));
    } else if (tab === 'unitType') {
      setMasterFormText(item.nama_type || '');
      setMasterFormExtra(prev => ({ ...prev, luas_tanah: item.luas_tanah || 0, luas_bangunan: item.luas_bangunan || 0 }));
    } else if (tab === 'subsidyType') {
      setMasterFormText(item.nama_type || '');
    }
    setIsMasterModalOpen(true);
  };

  const handleDeleteMaster = async (tab: typeof masterSubTab, id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus master data ini?')) return;
    try {
      if (tab === 'salesStep') await deleteSalesStep(id);
      else if (tab === 'certStep') await deleteCertificateStep(id);
      else if (tab === 'priceItem') await deletePriceItem(id);
      else if (tab === 'location') await deleteLocation(id);
      else if (tab === 'block') await deleteBlock(id);
      else if (tab === 'unitType') await deleteUnitType(id);
      else if (tab === 'subsidyType') await deleteSubsidyType(id);
    } catch (err: any) {
      alert('Gagal menghapus master data: ' + (err.message || 'terkait data lain.'));
    }
  };

  const unitColumns: Column<Unit>[] = [
    {
  header: 'No. Unit',
  accessorKey: (r) => (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
        <Home className="w-4 h-4" />
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
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setMasterSubTab('location');
                  setMasterFormText('');
                  setMasterFormExtra({ luas_tanah: 72, luas_bangunan: 36, nominal: 10000000, location_id: '', alamat: '', kode_lokasi: '' });
                  setIsMasterModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md text-xs transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Perumahan Baru</span>
              </button>
              <button
                onClick={() => {
                  setMasterSubTab('block');
                  setMasterFormText('');
                  setMasterFormExtra({ luas_tanah: 72, luas_bangunan: 36, nominal: 10000000, location_id: locations[0]?.id || '', alamat: '', kode_lokasi: '' });
                  setIsMasterModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-md text-xs transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Blok Baru</span>
              </button>
              <button
                onClick={openAddUnitModal}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-xs transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Unit Rumah</span>
              </button>
            </div>
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
                setEditingMasterId(null);
                setMasterFormText('');
                setMasterFormExtra({ luas_tanah: 72, luas_bangunan: 36, nominal: 10000000, location_id: locations[0]?.id || '', alamat: '', kode_lokasi: '' });
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
                <div key={s.id} className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs flex justify-between items-center group hover:bg-slate-100/80 transition shadow-sm">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700">{s.nama_step}</span>
                    <span className="text-slate-500 font-mono">Urutan: {s.urutan}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditMasterModal('salesStep', s)}
                      className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-white border border-slate-200 transition"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMaster('salesStep', s.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-white border border-slate-200 transition"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

            {masterSubTab === 'certStep' &&
              certificateSteps.map((c) => (
                <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs flex justify-between items-center group hover:bg-slate-100/80 transition shadow-sm">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700">{c.nama_step}</span>
                    <span className="text-slate-500 font-mono">Urutan: {c.urutan}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditMasterModal('certStep', c)}
                      className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-white border border-slate-200 transition"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMaster('certStep', c.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-white border border-slate-200 transition"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

            {masterSubTab === 'priceItem' &&
              priceItems.map((p) => (
                <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs flex justify-between items-center group hover:bg-slate-100/80 transition shadow-sm">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700">{p.nama_item}</span>
                    <span className="text-blue-600 font-bold">Rp {p.nominal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditMasterModal('priceItem', p)}
                      className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-white border border-slate-200 transition"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMaster('priceItem', p.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-white border border-slate-200 transition"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

            {masterSubTab === 'location' &&
              locations.map((l) => (
                <div key={l.id} className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs flex justify-between items-start group hover:bg-slate-100/80 transition shadow-sm">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-700">{l.nama_lokasi} {l.kode_lokasi ? `(${l.kode_lokasi})` : ''}</p>
                    <p className="text-slate-400 text-[11px]">{l.alamat}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 ml-2">
                    <button
                      onClick={() => openEditMasterModal('location', l)}
                      className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-white border border-slate-200 transition"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMaster('location', l.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-white border border-slate-200 transition"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

            {masterSubTab === 'block' &&
              blocks.map((b) => (
                <div key={b.id} className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs flex justify-between items-center group hover:bg-slate-100/80 transition shadow-sm">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700">{b.nama_blok}</span>
                    <span className="text-slate-400 text-[11px]">{b.location_nama}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditMasterModal('block', b)}
                      className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-white border border-slate-200 transition"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMaster('block', b.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-white border border-slate-200 transition"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

            {masterSubTab === 'unitType' &&
              unitTypes.map((t) => (
                <div key={t.id} className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs flex justify-between items-start group hover:bg-slate-100/80 transition shadow-sm">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-700">{t.nama_type}</p>
                    <p className="text-slate-400 text-[11px]">Luas Tanah: {t.luas_tanah}m² \| Bangunan: {t.luas_bangunan}m²</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 ml-2">
                    <button
                      onClick={() => openEditMasterModal('unitType', t)}
                      className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-white border border-slate-200 transition"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMaster('unitType', t.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-white border border-slate-200 transition"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

            {masterSubTab === 'subsidyType' &&
              subsidyTypes.map((s) => (
                <div key={s.id} className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs flex justify-between items-start group hover:bg-slate-100/80 transition shadow-sm">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-700">{s.nama_type}</p>
                    <p className="text-slate-400 text-[11px]">{s.keterangan}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 ml-2">
                    <button
                      onClick={() => openEditMasterModal('subsidyType', s)}
                      className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-white border border-slate-200 transition"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMaster('subsidyType', s.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-white border border-slate-200 transition"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
              <label className="block text-xs font-semibold text-slate-600 mb-1">Perumahan / Lokasi *</label>
              <select
                required
                value={unitForm.location_id}
                onChange={(e) => {
                  const locId = e.target.value;
                  setUnitForm({ ...unitForm, location_id: locId, block_id: '', block_nama: '' });
                }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              >
                <option value="">-- Pilih Perumahan --</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.nama_lokasi}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Blok Perumahan *</label>
              <select
                required
                value={unitForm.block_id}
                onChange={(e) => {
                  const bid = e.target.value;
                  const b = blocks.find(x => x.id === bid);
                  setUnitForm({ ...unitForm, block_id: bid, block_nama: b ? b.nama_blok : '' });
                }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              >
                <option value="">-- Pilih Blok --</option>
                {blocks.filter(b => b.location_id === unitForm.location_id).map((b) => (
                  <option key={b.id} value={b.id}>{b.nama_blok}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tipe Unit *</label>
              <select
                required
                value={unitForm.unit_type_nama}
                onChange={(e) => setUnitForm({ ...unitForm, unit_type_nama: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              >
                <option value="30/60">30/60</option>
                <option value="36/72">36/72</option>
                <option value="45/78">45/78</option>
                <option value="70/70">70/70</option>
                <option value="67/67">67/67</option>
                <option value="45/54">45/54</option>
                <option value="Ruko">Ruko</option>
              </select>
            </div>
            <div>
              {/* Spacer or any other field */}
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
        title={editingMasterId ? `Edit Master Data (${masterSubTab})` : `Tambah Master Data (${masterSubTab})`}
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

          {/* Location: Alamat & Kode Lokasi */}
          {masterSubTab === 'location' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Lokasi / Alamat *</label>
                <textarea
                  rows={2}
                  value={masterFormExtra.alamat}
                  onChange={(e) => setMasterFormExtra({ ...masterFormExtra, alamat: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none"
                  placeholder="Alamat lengkap perumahan..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Kode Lokasi (untuk nomor surat, contoh: BMM)</label>
                <input
                  type="text"
                  value={masterFormExtra.kode_lokasi}
                  onChange={(e) => setMasterFormExtra({ ...masterFormExtra, kode_lokasi: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none"
                  placeholder="Contoh: BMM"
                  maxLength={5}
                />
              </div>
            </>
          )}

          {/* Block: dropdown pilih Perumahan */}
          {masterSubTab === 'block' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Perumahan *</label>
              <select
                required
                value={masterFormExtra.location_id}
                onChange={(e) => setMasterFormExtra({ ...masterFormExtra, location_id: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none"
              >
                <option value="">-- Pilih Perumahan --</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.nama_lokasi}</option>
                ))}
              </select>
            </div>
          )}

          {/* UnitType: preset dropdown + luas manual untuk Ruko */}
          {masterSubTab === 'unitType' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Pilih Tipe *</label>
                <select
                  required
                  value={masterFormText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMasterFormText(val);
                    const m = val.match(/(\d+)\s*\/\s*(\d+)/);
                    if (m) setMasterFormExtra({ ...masterFormExtra, luas_bangunan: parseInt(m[1]), luas_tanah: parseInt(m[2]) });
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none"
                >
                  <option value="">-- Pilih Tipe --</option>
                  <option value="30/60">30/60</option>
                  <option value="36/72">36/72</option>
                  <option value="45/78">45/78</option>
                  <option value="70/70">70/70</option>
                  <option value="67/67">67/67</option>
                  <option value="45/54">45/54</option>
                  <option value="Ruko">Ruko</option>
                </select>
              </div>
              {masterFormText === 'Ruko' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Luas Tanah (m²)</label>
                    <input type="number" value={masterFormExtra.luas_tanah}
                      onChange={(e) => setMasterFormExtra({ ...masterFormExtra, luas_tanah: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Luas Bangunan (m²)</label>
                    <input type="number" value={masterFormExtra.luas_bangunan}
                      onChange={(e) => setMasterFormExtra({ ...masterFormExtra, luas_bangunan: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none" />
                  </div>
                </div>
              )}
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
