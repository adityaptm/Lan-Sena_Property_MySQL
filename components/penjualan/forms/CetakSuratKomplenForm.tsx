import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  saleId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CetakSuratKomplenForm({ saleId, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({ tanggal: '', penerima: '', isi_komplen: '' });
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const handleSave = async () => {
    if (!form.tanggal || !form.penerima || !form.isi_komplen) return;
    setSaving(true);
    
    // Open window before async to bypass popup blocker
    const newWindow = window.open('about:blank', '_blank');
    
    const { error } = await supabase.from('sale_complaints').insert({
      sale_id: saleId,
      tanggal_komplen: form.tanggal,
      penerima_komplen: form.penerima,
      isi_komplen: form.isi_komplen
    });
    setSaving(false);
    
    if (!error) {
      onSuccess();
      if (newWindow) {
        newWindow.location.href = `/penjualan/print-komplen?id=${saleId}&tanggal=${form.tanggal}&penerima=${encodeURIComponent(form.penerima)}&isi=${encodeURIComponent(form.isi_komplen)}`;
      }
      onClose();
    } else {
      if (newWindow) newWindow.close();
      alert('Gagal menyimpan data komplain.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="font-bold text-slate-800 text-lg mb-4">Cetak Surat Komplen</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Tanggal Komplen *</label>
            <input type="date" value={form.tanggal}
              onChange={e => setForm({...form, tanggal: e.target.value})}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Penerima Komplen *</label>
            <input type="text" placeholder="Nama staf yang menerima" value={form.penerima}
              onChange={e => setForm({...form, penerima: e.target.value})}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Isi Komplen *</label>
            <textarea placeholder="Tuliskan keluhan konsumen..." rows={3} value={form.isi_komplen}
              onChange={e => setForm({...form, isi_komplen: e.target.value})}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"></textarea>
            <p className="text-[10px] text-blue-600 mt-1 italic">*Jika komplen lebih dari satu, pisahkan dengan tanda koma (,)</p>
          </div>
        </div>
        <div className="flex gap-2 mt-5 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-600 rounded font-semibold">Batal</button>
          <button onClick={handleSave} disabled={saving || !form.tanggal || !form.penerima || !form.isi_komplen} className="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded font-semibold disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </div>
    </div>
  );
}
