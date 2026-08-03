import React, { useState } from 'react';
import { Customer, Bank } from '@/types';
import { formatTanggalIndonesia } from '@/lib/format';

interface Props {
  saleId: string;
  customer: Customer;
  bank: Bank | undefined;
  onClose: () => void;
}

export function CetakPersyaratanKprForm({ saleId, customer, bank, onClose }: Props) {
  const [form, setForm] = useState({
    sertakanLampiran5: !customer.npwp || customer.npwp.length < 5, // simple default heuristic
    namaPejabatBank: '',
    jabatanPejabatBank: bank?.jabatan_pic || 'Kepala Cabang',
    cabangPKS: bank?.cabang || '',
    nomorPKS: '',
    tanggalPKS: ''
  });

  const handlePrint = () => {
    // Generate URL parameters
    const params = new URLSearchParams({
      id: saleId,
      lampiran5: form.sertakanLampiran5 ? '1' : '0',
      pejabat: form.namaPejabatBank,
      jabatan_pejabat: form.jabatanPejabatBank,
      cabang_pks: form.cabangPKS,
      no_pks: form.nomorPKS,
      tgl_pks: form.tanggalPKS
    });
    
    window.open(`/penjualan/print-kpr?${params.toString()}`, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-slate-800 text-lg mb-4">Cetak Persyaratan KPR Bersubsidi</h3>
        <p className="text-sm text-slate-600 mb-5">
          Lengkapi form di bawah ini untuk mencetak dokumen persyaratan (Lampiran 1, 2, 3, 5, 11).
        </p>
        
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded flex items-start gap-3">
            <input 
              type="checkbox" 
              id="lamp5" 
              checked={form.sertakanLampiran5}
              onChange={e => setForm({...form, sertakanLampiran5: e.target.checked})}
              className="mt-1"
            />
            <div>
              <label htmlFor="lamp5" className="text-sm font-semibold text-blue-900 block cursor-pointer">Sertakan Lampiran 5?</label>
              <p className="text-xs text-blue-700">Surat Pernyataan Penyerahan SPT PPh. Hanya dicetak jika NPWP konsumen berusia di bawah 1 tahun.</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-semibold text-slate-700 text-sm mb-3">Data Bank (Lampiran 3)</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Nama Pejabat Bank</label>
                <input type="text" value={form.namaPejabatBank} onChange={e => setForm({...form, namaPejabatBank: e.target.value})} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Contoh: Budi Santoso" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Jabatan Pejabat Bank</label>
                <input type="text" value={form.jabatanPejabatBank} onChange={e => setForm({...form, jabatanPejabatBank: e.target.value})} className="w-full border rounded px-3 py-1.5 text-sm" />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-semibold text-slate-700 text-sm mb-3">Data PKS Bank BTN (Lampiran 11)</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Kantor Cabang PKS</label>
                <input type="text" value={form.cabangPKS} onChange={e => setForm({...form, cabangPKS: e.target.value})} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Misal: Purwakarta" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Nomor PKS</label>
                  <input type="text" value={form.nomorPKS} onChange={e => setForm({...form, nomorPKS: e.target.value})} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Nomor surat PKS" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Tanggal PKS</label>
                  <input type="text" value={form.tanggalPKS} onChange={e => setForm({...form, tanggalPKS: e.target.value})} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Contoh: 12 Januari 2024" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6 justify-end pt-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold">Batal</button>
          <button onClick={handlePrint} className="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded font-semibold">Cetak Dokumen</button>
        </div>
      </div>
    </div>
  );
}
