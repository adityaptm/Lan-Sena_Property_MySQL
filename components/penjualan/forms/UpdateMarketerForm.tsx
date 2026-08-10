import React, { useState } from 'react';
import { Marketer, Sale, MarketerRight } from '@/types';
import { formatRupiah } from '@/lib/format';

// Helper to query /api/db
async function dbRequest(body: any): Promise<any> {
  const res = await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Database error');
  return json.data;
}

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

  const handleSave = async () => {
    if (!selectedMarketerId) return;
    setSaving(true);
    
    try {
      // 1. Update sale marketer_id
      await dbRequest({
        action: 'update',
        table: 'sales',
        filters: [{ type: 'eq', column: 'id', value: sale.id }],
        data: { marketer_id: selectedMarketerId },
      });
      
      // 2. Tandai marketer lama sebagai riwayat
      if (currentMarketerRight) {
        await dbRequest({
          action: 'update',
          table: 'marketer_rights',
          filters: [{ type: 'eq', column: 'id', value: currentMarketerRight.id }],
          data: { is_history: true },
        });
      }
      
      // 3. Buat entry baru di marketer_rights
      const mkt = marketers.find(m => m.id === selectedMarketerId);
      if (mkt) {
        await dbRequest({
          action: 'insert',
          table: 'marketer_rights',
          data: {
            marketer_id: mkt.id,
            sale_id: sale.id,
            persen_fee: 0,
            nominal_fee: Number(feeNominal.replace(/\D/g, '')) || 0,
            status_pencairan: 'Belum'
          },
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      alert('Gagal menyimpan: ' + error.message);
    } finally {
      setSaving(false);
    }
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
