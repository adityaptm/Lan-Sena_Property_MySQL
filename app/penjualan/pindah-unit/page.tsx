'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

export default function PindahUnitPage() {
  const router = useRouter();
  const { sales, units, relocateUnit } = useData();

  const activeSales = sales.filter((s) => s.status !== 'Batal' && s.status !== 'Lunas');
  const availableUnits = units.filter((u) => u.status === 'Tersedia');

  const [saleId, setSaleId] = useState(activeSales[0]?.id || '');
  const [newUnitId, setNewUnitId] = useState(availableUnits[0]?.id || units[0]?.id || '');
  const [alasan, setAlasan] = useState('Keinginan konsumen pindah ke posisi hook');

  const selectedSale = sales.find((s) => s.id === saleId);
  const selectedNewUnit = units.find((u) => u.id === newUnitId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleId || !newUnitId || !selectedNewUnit) return;

    relocateUnit(saleId, newUnitId, selectedNewUnit.no_unit, alasan);
    router.push(`/penjualan/daftar/${saleId}`);
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Form Pindah Unit Rumah</h1>
          <p className="text-xs text-slate-400 mt-1">Pengalihan booking / DP konsumen dari unit lama ke unit baru</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/60 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm  space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pilih Transaksi Konsumen *</label>
            <select
              value={saleId}
              onChange={(e) => setSaleId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
            >
              {activeSales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.customer_nama} — Unit Lama: {s.unit_no} ({s.location_nama})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pilih Unit Baru yang Tersedia *</label>
            <select
              value={newUnitId}
              onChange={(e) => setNewUnitId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
            >
              {availableUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  Unit {u.no_unit} - {u.location_nama} (Harga: Rp {u.harga_dasar.toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Alasan Kepindahan Unit</label>
            <textarea
              rows={3}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => router.push('/penjualan/daftar')}
              className="px-5 py-2.5 bg-slate-50 text-slate-600 rounded-md text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-md text-sm transition shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Proses Pindah Unit</span>
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
