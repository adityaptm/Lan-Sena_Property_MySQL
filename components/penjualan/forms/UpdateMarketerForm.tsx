import React, { useState } from 'react';
import { createClient } from '@/lib/sql/client';
import { Marketer, Sale, MarketerRight } from '@/types';
import { formatRupiah } from '@/lib/format';

interface Props {
  sale: Sale;
  currentMarketer?: Marketer;
  currentMarketerRight?: MarketerRight;
  marketers: Marketer[];
  onClose: () => void;
  onSuccess: () => void;
}

export function UpdateMarketerForm({ sale, currentMarketer, currentMarketerRight, marketers, onClose, onSuccess }: Props) {
  const [selectedMarketerId, setSelectedMarketerId] = useState('');
  const [feeNominal, setFeeNominal] = useState('');
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const handleSave = async () => {
    if (!selectedMarketerId) return;
    setSaving(true);
    
    // 1. Update sale marketer_id
    await supabase.from('sales').update({ marketer_id: selectedMarketerId }).eq('id', sale.id);
    
    // 2. Tandai marketer lama sebagai riwayat (misal update status_pencairan 'Batal' atau bikin record baru)
    // As per instruction: "tandai record lama sebagai riwayat (jangan dihapus, biar histori komisi tetap ada)"
    if (currentMarketerRight) {
       await supabase.from('marketer_rights').update({ is_history: true }).eq('id', currentMarketerRight.id);
    }
    
    // 3. Buat entry baru di marketer_rights
    const mkt = marketers.find(m => m.id === selectedMarketerId);
    if (mkt) {
      await supabase.from('marketer_rights').insert({
        marketer_id: mkt.id,
        sale_id: sale.id,
        persen_fee: 0, // default atau input manual
        nominal_fee: Number(feeNominal.replace(/\D/g, '')) || 0,
        status_pencairan: 'Belum'
      });
    }

    setSaving(false);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="font-bold text-slate-800 text-lg mb-4">Update Marketer</h3>
        
        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded text-sm">
          <p className="text-slate-500 font-semibold mb-1">Marketer Sebelumnya:</p>
          <p className="font-bold text-slate-800">{currentMarketer?.nama || 'Belum ada'}</p>
          {currentMarketerRight && (
            <p className="text-slate-600 mt-1">Fee: {formatRupiah(currentMarketerRight.nominal_fee)}</p>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-600">Marketer Baru *</label>
              <button className="text-xs text-blue-600 font-bold hover:underline bg-blue-50 px-2 py-0.5 rounded border border-blue-200">+ Marketer Baru</button>
            </div>
            <select value={selectedMarketerId} onChange={e => setSelectedMarketerId(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">** Pilih Marketer Baru</option>
              {marketers.map(m => (
                <option key={m.id} value={m.id}>{m.nama} ({m.marketer_type_nama})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Nominal Fee Baru (Rp)</label>
            <input type="text" placeholder="Input manual atau kosongkan untuk default" value={feeNominal}
              onChange={e => setFeeNominal(e.target.value.replace(/[^0-9]/g,'').replace(/\B(?=(\d{3})+(?!\d))/g,'.'))}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
        
        <div className="flex gap-2 mt-5 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-600 rounded font-semibold">Batal</button>
          <button onClick={handleSave} disabled={saving || !selectedMarketerId} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </div>
    </div>
  );
}
