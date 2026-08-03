'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { Badge } from '@/components/ui/Badge';
import { Printer, Home, CheckCircle, Clock } from 'lucide-react';

export default function SummaryUnitPage() {
  const { units, locations } = useData();

  const total = units.length;
  const tersedia = units.filter((u) => u.status === 'Tersedia').length;
  const booking = units.filter((u) => u.status === 'Booking').length;
  const dp = units.filter((u) => u.status === 'DP').length;
  const akad = units.filter((u) => u.status === 'Akad').length;
  const lunas = units.filter((u) => u.status === 'Lunas').length;

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Laporan Summary Stok Unit</h1>
          <p className="text-xs text-slate-400 mt-1">Ringkasan ketersediaan dan tingkat keterisian (occupancy) perumahan</p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-semibold border border-slate-300 transition"
        >
          <Printer className="w-4 h-4 text-blue-600" />
          <span>Cetak PDF Summary</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        <div className="p-4 bg-white/60 border border-slate-200 rounded-md text-center">
          <p className="text-xs text-slate-400 uppercase font-semibold">Total Unit</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{total}</p>
        </div>
        <div className="p-4 bg-white/60 border border-slate-200 rounded-md text-center">
          <p className="text-xs text-sky-600 uppercase font-semibold">Tersedia</p>
          <p className="text-2xl font-bold text-sky-600 mt-1">{tersedia}</p>
        </div>
        <div className="p-4 bg-white/60 border border-slate-200 rounded-md text-center">
          <p className="text-xs text-orange-600 uppercase font-semibold">Booking</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{booking}</p>
        </div>
        <div className="p-4 bg-white/60 border border-slate-200 rounded-md text-center">
          <p className="text-xs text-orange-400 uppercase font-semibold">Terbayar DP</p>
          <p className="text-2xl font-bold text-orange-400 mt-1">{dp}</p>
        </div>
        <div className="p-4 bg-white/60 border border-slate-200 rounded-md text-center">
          <p className="text-xs text-blue-600 uppercase font-semibold">Akad Kredit</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{akad}</p>
        </div>
        <div className="p-4 bg-white/60 border border-slate-200 rounded-md text-center">
          <p className="text-xs text-green-600 uppercase font-semibold">Lunas</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{lunas}</p>
        </div>
      </div>

      {/* Breakdown per Location Table */}
      <div className="bg-white/60 border border-slate-200 rounded-md p-6 shadow-xl  space-y-4">
        <h3 className="font-bold text-slate-800 text-base">Rincian Per Proyek Perumahan</h3>

        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-white text-xs uppercase font-semibold text-slate-400 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nama Perumahan</th>
                <th className="py-3 px-4 text-center">Total Unit</th>
                <th className="py-3 px-4 text-center">Tersedia</th>
                <th className="py-3 px-4 text-center">Terjual / Booking</th>
                <th className="py-3 px-4 text-right">Persentase Terjual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {locations.map((loc) => {
                const locUnits = units.filter((u) => u.location_nama === loc.nama_lokasi);
                const locTotal = locUnits.length || 1;
                const locTerjual = locUnits.filter((u) => u.status !== 'Tersedia').length;
                const locTersedia = locUnits.filter((u) => u.status === 'Tersedia').length;
                const percentage = Math.round((locTerjual / locTotal) * 100);

                return (
                  <tr key={loc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">{loc.nama_lokasi}</td>
                    <td className="py-3 px-4 text-center font-bold">{locTotal}</td>
                    <td className="py-3 px-4 text-center text-sky-600 font-semibold">{locTersedia}</td>
                    <td className="py-3 px-4 text-center text-green-600 font-semibold">{locTerjual}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 font-bold text-xs">
                        {percentage}% Sold
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
