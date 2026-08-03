import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  saleId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CetakSerahTerimaKunciForm({ saleId, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({ tanggal: '', yang_menyerahkan: '' });
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const handleSave = async () => {
    if (!form.tanggal || !form.yang_menyerahkan) return;
    setSaving(true);
    
    // Open window before async to bypass popup blocker
    const newWindow = window.open('about:blank', '_blank');
    
    const { error } = await supabase.from('sale_key_handovers').insert({
      sale_id: saleId,
      tanggal_serah_terima: form.tanggal,
      yang_menyerahkan: form.yang_menyerahkan
    });
    setSaving(false);
    
    if (!error) {
      onSuccess();
      if (newWindow) {
        newWindow.location.href = `/penjualan/print-serah-terima-kunci?id=${saleId}&tanggal=${form.tanggal}&penyerah=${encodeURIComponent(form.yang_menyerahkan)}`;
      }
      onClose();
    } else {
      if (newWindow) newWindow.close();
      alert('Gagal menyimpan data serah terima kunci.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="font-bold text-slate-800 text-lg mb-4">Cetak Berita Acara Serah Terima Kunci</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Tanggal Serah Terima Kunci *</label>
            <input type="date" value={form.tanggal}
              onChange={e => setForm({...form, tanggal: e.target.value})}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Yang Menyerahkan Kunci *</label>
            <input type="text" placeholder="Nama staf/marketer" value={form.yang_menyerahkan}
              onChange={e => setForm({...form, yang_menyerahkan: e.target.value})}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex gap-2 mt-5 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-600 rounded font-semibold">Batal</button>
          <button onClick={handleSave} disabled={saving || !form.tanggal || !form.yang_menyerahkan} className="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded font-semibold disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </div>
    </div>
  );
}
