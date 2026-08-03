import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  saleId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function UpdateBiayaTambahanForm({ saleId, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({ nominal: '0', keterangan: '' });
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const handleSave = async () => {
    const nominalNum = Number(form.nominal.replace(/\D/g, '')) || 0;
    if (nominalNum <= 0 || !form.keterangan) return;
    
    setSaving(true);
    const { error } = await supabase.from('sale_additional_costs').insert({
      sale_id: saleId,
      keterangan: form.keterangan,
      nominal: nominalNum
    });
    setSaving(false);
    
    if (!error) {
      onSuccess();
      onClose();
    } else {
      alert('Gagal menyimpan biaya tambahan.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="font-bold text-slate-800 text-lg mb-4">Update Biaya Tambahan</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Biaya Tambahan (Rp) *</label>
            <input type="text" value={form.nominal}
              onChange={e => setForm({...form, nominal: e.target.value.replace(/[^0-9]/g,'').replace(/\B(?=(\d{3})+(?!\d))/g,'.')})}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Keterangan Biaya Tambahan *</label>
            <textarea placeholder="Misal: Kelebihan tanah, Penambahan bangunan..." rows={3} value={form.keterangan}
              onChange={e => setForm({...form, keterangan: e.target.value})}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"></textarea>
          </div>
        </div>
        <div className="flex gap-2 mt-5 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-600 rounded font-semibold">Batal</button>
          <button onClick={handleSave} disabled={saving || !form.keterangan} className="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded font-semibold disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </div>
    </div>
  );
}
