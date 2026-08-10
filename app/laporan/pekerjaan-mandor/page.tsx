'use client';

import React, { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { FileSpreadsheet, Printer, HardHat, Plus, Edit3, Trash2 } from 'lucide-react';
import { formatRupiah, formatDateId } from '@/lib/format';
import * as XLSX from 'xlsx';

function formatRibuan(raw: string): string {
  return raw.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export default function LaporanPekerjaanMandorPage() {
  const {
    mandorAdvances,
    mandors,
    currentUser,
    addMandor,
    updateMandor,
    deleteMandor,
    addMandorAdvance,
    updateMandorAdvance,
    deleteMandorAdvance,
  } = useData();

  // CRUD dibuka untuk semua pengguna / admin di halaman ini
  const isSuperAdmin = true;

  const totalKasbon = useMemo(
    () => mandorAdvances.reduce((s, ma) => s + (ma.nominal || 0), 0),
    [mandorAdvances]
  );

  const totalPekerjaan = useMemo(() => mandors.reduce((s, m) => s + (m.total_pekerjaan || 0), 0), [mandors]);
  const totalSelesai = useMemo(() => mandors.reduce((s, m) => s + (m.selesai || 0), 0), [mandors]);
  const totalBelumSelesai = useMemo(() => mandors.reduce((s, m) => s + (m.belum_selesai || 0), 0), [mandors]);

  const handleExportExcel = () => {
    const data = mandorAdvances.map((ma, i) => ({
      No: i + 1,
      'Nama Mandor': (ma as any).mandor_nama || (ma as any).nama_mandor || '-',
      Nominal: ma.nominal || 0,
      Keterangan: ma.keterangan || '-',
      Tanggal: (ma as any).tanggal || (ma as any).created_at || '-',
      Status: (ma as any).status || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pekerjaan_Mandor');
    XLSX.writeFile(workbook, 'Laporan_Pekerjaan_Mandor_Lansena.xlsx');
  };

  const handleExportMandorExcel = () => {
    const data = mandors.map((m, i) => ({
      No: i + 1,
      'Nama Mandor': m.nama_mandor,
      Spesialis: m.spesialis || '-',
      'Total Pekerjaan': m.total_pekerjaan,
      'Belum Selesai': m.belum_selesai,
      Selesai: m.selesai,
      'Persen Selesai': m.total_pekerjaan > 0 ? `${Math.round((m.selesai / m.total_pekerjaan) * 100)}%` : '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Progress_Mandor');
    XLSX.writeFile(workbook, 'Progress_Pekerjaan_Mandor_Lansena.xlsx');
  };

  // --- Modal & form state: Mandor ---
  const [isMandorModalOpen, setIsMandorModalOpen] = useState(false);
  const [editingMandorId, setEditingMandorId] = useState<string | null>(null);
  const [mandorForm, setMandorForm] = useState({
    nama_mandor: '',
    spesialis: '',
    total_pekerjaan: '0',
    selesai: '0',
    belum_selesai: '0',
  });
  const [savingMandor, setSavingMandor] = useState(false);

  const openAddMandorModal = () => {
    setEditingMandorId(null);
    setMandorForm({ nama_mandor: '', spesialis: '', total_pekerjaan: '0', selesai: '0', belum_selesai: '0' });
    setIsMandorModalOpen(true);
  };

  const openEditMandorModal = (m: any) => {
    setEditingMandorId(m.id);
    setMandorForm({
      nama_mandor: m.nama_mandor || '',
      spesialis: m.spesialis || '',
      total_pekerjaan: String(m.total_pekerjaan ?? 0),
      selesai: String(m.selesai ?? 0),
      belum_selesai: String(m.belum_selesai ?? 0),
    });
    setIsMandorModalOpen(true);
  };

  const handleSaveMandor = async () => {
    if (!mandorForm.nama_mandor.trim()) {
      alert('Nama Mandor wajib diisi.');
      return;
    }
    setSavingMandor(true);
    try {
      const payload = {
        nama_mandor: mandorForm.nama_mandor.trim(),
        spesialis: mandorForm.spesialis.trim(),
        total_pekerjaan: Number(mandorForm.total_pekerjaan) || 0,
        selesai: Number(mandorForm.selesai) || 0,
        belum_selesai: Number(mandorForm.belum_selesai) || 0,
      };
      if (editingMandorId) {
        await updateMandor(editingMandorId, payload);
      } else {
        await addMandor(payload);
      }
      setIsMandorModalOpen(false);
    } catch (err: any) {
      alert(err?.message || 'Gagal menyimpan data mandor.');
    } finally {
      setSavingMandor(false);
    }
  };

  const handleDeleteMandor = async (m: any) => {
    if (!window.confirm(`Hapus mandor "${m.nama_mandor}"? Pastikan tidak ada kasbon yang masih terkait.`)) return;
    try {
      await deleteMandor(m.id);
    } catch (err: any) {
      const raw = String(err?.message || err || '');
      const isFk = /foreign key constraint fails/i.test(raw) || err?.code === 'ER_ROW_IS_REFERENCED_2' || err?.code === '23503';
      alert(
        isFk
          ? `Mandor "${m.nama_mandor}" tidak bisa dihapus karena masih punya data kasbon terkait. Hapus/pindahkan dulu kasbon-nya sebelum menghapus mandor ini.`
          : (raw || 'Gagal menghapus mandor.')
      );
    }
  };

  // --- Modal & form state: Kasbon Mandor ---
  const [isKasbonModalOpen, setIsKasbonModalOpen] = useState(false);
  const [editingKasbonId, setEditingKasbonId] = useState<string | null>(null);
  const [kasbonForm, setKasbonForm] = useState({
    nama_mandor: '',
    nominal: '',
    keterangan: '',
    tanggal: new Date().toISOString().slice(0, 10),
    status: 'Belum Lunas',
  });
  const [savingKasbon, setSavingKasbon] = useState(false);

  const openAddKasbonModal = () => {
    setEditingKasbonId(null);
    setKasbonForm({
      nama_mandor: mandors[0]?.nama_mandor || '',
      nominal: '',
      keterangan: '',
      tanggal: new Date().toISOString().slice(0, 10),
      status: 'Belum Lunas',
    });
    setIsKasbonModalOpen(true);
  };

  const openEditKasbonModal = (ma: any) => {
    setEditingKasbonId(ma.id);
    setKasbonForm({
      nama_mandor: ma.nama_mandor || ma.mandor_nama || '',
      nominal: String(ma.nominal ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
      keterangan: ma.keterangan || '',
      tanggal: (ma.tanggal || ma.created_at || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
      status: ma.status || 'Belum Lunas',
    });
    setIsKasbonModalOpen(true);
  };

  const handleSaveKasbon = async () => {
    if (!kasbonForm.nama_mandor || !kasbonForm.nominal || !kasbonForm.tanggal) {
      alert('Mandor, Nominal, dan Tanggal wajib diisi.');
      return;
    }
    setSavingKasbon(true);
    try {
      // Kolom di tabel mandor_advances: id, nama_mandor, tanggal, nominal,
      // keterangan, status, created_at — tidak ada mandor_id/mandor_nama,
      // jadi yang disimpan langsung nama mandornya sebagai teks.
      const payload = {
        nama_mandor: kasbonForm.nama_mandor,
        nominal: Number(kasbonForm.nominal.replace(/\D/g, '')) || 0,
        keterangan: kasbonForm.keterangan.trim(),
        tanggal: kasbonForm.tanggal,
        status: kasbonForm.status as 'Belum Lunas' | 'Lunas',
      };
      if (editingKasbonId) {
        await updateMandorAdvance(editingKasbonId, payload);
      } else {
        await addMandorAdvance(payload);
      }
      setIsKasbonModalOpen(false);
    } catch (err: any) {
      alert(err?.message || 'Gagal menyimpan data kasbon.');
    } finally {
      setSavingKasbon(false);
    }
  };

  const handleDeleteKasbon = async (ma: any) => {
    if (!window.confirm('Hapus data kasbon ini?')) return;
    try {
      await deleteMandorAdvance(ma.id);
    } catch (err: any) {
      alert(err?.message || 'Gagal menghapus kasbon.');
    }
  };

  const kasbonColumns: Column<any>[] = [
    {
      header: 'Nama Mandor',
      accessorKey: (r: any) => <span className="font-bold text-slate-800">{r.mandor_nama || r.nama_mandor || '-'}</span>,
      sortable: true,
    },
    {
      header: 'Nominal Kasbon',
      accessorKey: (r: any) => <span className="font-bold text-green-600">{formatRupiah(r.nominal || 0)}</span>,
      sortable: true,
    },
    {
      header: 'Keterangan',
      accessorKey: (r: any) => r.keterangan || '-',
    },
    {
      header: 'Tanggal',
      accessorKey: (r: any) => formatDateId(r.tanggal || r.created_at),
      sortable: true,
    },
    {
      header: 'Status',
      accessorKey: (r: any) => {
        const status = r.status || 'Belum Lunas';
        const color = status === 'Lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
        return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>{status}</span>;
      },
    },
  ];

  const mandorColumns: Column<any>[] = [
    {
      header: 'Nama Mandor',
      accessorKey: (r: any) => <span className="font-bold text-slate-800">{r.nama_mandor}</span>,
      sortable: true,
    },
    {
      header: 'Spesialis',
      accessorKey: (r: any) => <span className="text-slate-600">{r.spesialis || '-'}</span>,
    },
    {
      header: 'Total Pekerjaan',
      accessorKey: (r: any) => <span className="font-semibold text-slate-800">{r.total_pekerjaan}</span>,
      sortable: true,
    },
    {
      header: 'Belum Selesai',
      accessorKey: (r: any) => <span className="font-semibold text-amber-600">{r.belum_selesai}</span>,
      sortable: true,
    },
    {
      header: 'Selesai',
      accessorKey: (r: any) => <span className="font-semibold text-emerald-600">{r.selesai}</span>,
      sortable: true,
    },
    {
      header: 'Progress',
      accessorKey: (r: any) => {
        const persen = r.total_pekerjaan > 0 ? Math.round((r.selesai / r.total_pekerjaan) * 100) : 0;
        return (
          <div className="flex items-center gap-2 w-32">
            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${persen}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-600 w-9 text-right">{persen}%</span>
          </div>
        );
      },
    },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Laporan Pekerjaan Mandor</h1>
          <p className="text-xs text-slate-400 mt-1">
            Rekapitulasi kasbon mandor &amp; progress pekerjaan di perumahan
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
        </div>
      </div>

      {/* Summary KPI Gabungan */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
        <div className="p-4 bg-white/60 border border-slate-200 rounded-md text-center">
          <p className="text-xs text-slate-400 uppercase font-semibold">Total Transaksi Kasbon</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{mandorAdvances.length}</p>
        </div>
        <div className="p-4 bg-white/60 border border-slate-200 rounded-md text-center">
          <p className="text-xs text-orange-600 uppercase font-semibold">Total Kasbon Keluar</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{formatRupiah(totalKasbon)}</p>
        </div>
        <div className="p-4 bg-white/60 border border-slate-200 rounded-md text-center">
          <p className="text-xs text-slate-400 uppercase font-semibold">Total Pekerjaan</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totalPekerjaan}</p>
        </div>
        <div className="p-4 bg-white/60 border border-slate-200 rounded-md text-center">
          <p className="text-xs text-emerald-600 uppercase font-semibold">Pekerjaan Selesai</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{totalSelesai} <span className="text-sm text-slate-400 font-normal">/ {totalBelumSelesai} belum</span></p>
        </div>
      </div>

      {/* Section: Progress Pekerjaan per Mandor */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <HardHat className="w-4 h-4 text-blue-600" /> Progress Pekerjaan per Mandor
          </h2>
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <button
                onClick={openAddMandorModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-xs transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Mandor</span>
              </button>
            )}
            <button
              onClick={handleExportMandorExcel}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-md text-xs transition shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>
        <DataTable
          title=""
          data={mandors}
          columns={mandorColumns}
          searchPlaceholder="Cari nama mandor, spesialis..."
          exportFileName="Progress_Pekerjaan_Mandor_Lansena"
          actions={
            isSuperAdmin
              ? (row: any) => (
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEditMandorModal(row)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition"
                      title="Edit Mandor"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMandor(row)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-50 transition"
                      title="Hapus Mandor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              : undefined
          }
        />
      </div>

      {/* Section: Daftar Kasbon Mandor */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-slate-700">Daftar Kasbon Mandor</h2>
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <button
                onClick={openAddKasbonModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-xs transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Kasbon</span>
              </button>
            )}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-md text-xs transition shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>
        <DataTable
          title=""
          data={mandorAdvances}
          columns={kasbonColumns}
          searchPlaceholder="Cari nama mandor, keterangan..."
          exportFileName="Kasbon_Mandor_Lansena"
          actions={
            isSuperAdmin
              ? (row: any) => (
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEditKasbonModal(row)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition"
                      title="Edit Kasbon"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteKasbon(row)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-50 transition"
                      title="Hapus Kasbon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              : undefined
          }
        />
      </div>

      {/* Modal Tambah/Edit Mandor — super_admin saja */}
      {isMandorModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-slate-800 text-lg mb-4">
              {editingMandorId ? 'Edit Mandor' : 'Tambah Mandor Baru'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Nama Mandor *</label>
                <input
                  type="text"
                  value={mandorForm.nama_mandor}
                  onChange={e => setMandorForm({ ...mandorForm, nama_mandor: e.target.value })}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Spesialis</label>
                <input
                  type="text"
                  placeholder="Contoh: Struktur, Finishing, dll"
                  value={mandorForm.spesialis}
                  onChange={e => setMandorForm({ ...mandorForm, spesialis: e.target.value })}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Total Pekerjaan</label>
                  <input
                    type="number"
                    min={0}
                    value={mandorForm.total_pekerjaan}
                    onChange={e => setMandorForm({ ...mandorForm, total_pekerjaan: e.target.value })}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Selesai</label>
                  <input
                    type="number"
                    min={0}
                    value={mandorForm.selesai}
                    onChange={e => setMandorForm({ ...mandorForm, selesai: e.target.value })}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Belum Selesai</label>
                  <input
                    type="number"
                    min={0}
                    value={mandorForm.belum_selesai}
                    onChange={e => setMandorForm({ ...mandorForm, belum_selesai: e.target.value })}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setIsMandorModalOpen(false)} className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded font-semibold">Batal</button>
              <button onClick={handleSaveMandor} disabled={savingMandor} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold disabled:opacity-50">
                {savingMandor ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah/Edit Kasbon — super_admin saja */}
      {isKasbonModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-slate-800 text-lg mb-4">
              {editingKasbonId ? 'Edit Kasbon Mandor' : 'Tambah Kasbon Mandor'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Mandor *</label>
                <select
                  value={kasbonForm.nama_mandor}
                  onChange={e => setKasbonForm({ ...kasbonForm, nama_mandor: e.target.value })}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Mandor --</option>
                  {mandors.map((m: any) => (
                    <option key={m.id} value={m.nama_mandor}>{m.nama_mandor}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Tanggal *</label>
                <input
                  type="date"
                  value={kasbonForm.tanggal}
                  onChange={e => setKasbonForm({ ...kasbonForm, tanggal: e.target.value })}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Nominal Kasbon (Rp) *</label>
                <input
                  type="text"
                  placeholder="Contoh: 1.500.000"
                  value={kasbonForm.nominal}
                  onChange={e => setKasbonForm({ ...kasbonForm, nominal: formatRibuan(e.target.value) })}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Keterangan</label>
                <input
                  type="text"
                  placeholder="Untuk keperluan apa..."
                  value={kasbonForm.keterangan}
                  onChange={e => setKasbonForm({ ...kasbonForm, keterangan: e.target.value })}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Status</label>
                <select
                  value={kasbonForm.status}
                  onChange={e => setKasbonForm({ ...kasbonForm, status: e.target.value })}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Belum Lunas">Belum Lunas</option>
                  <option value="Lunas">Lunas</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setIsKasbonModalOpen(false)} className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded font-semibold">Batal</button>
              <button onClick={handleSaveKasbon} disabled={savingKasbon} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold disabled:opacity-50">
                {savingKasbon ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}