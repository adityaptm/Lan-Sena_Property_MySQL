import React, { useState } from 'react';
import { Location, Block, Unit, Sale } from '@/types';

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
  currentUnit?: Unit;
  locations: Location[];
  blocks: Block[];
  units: Unit[];
  onClose: () => void;
  onSuccess: () => void;
}

export function PindahUnitForm({ sale, currentUnit, locations, blocks, units, onClose, onSuccess }: Props) {
  const [lokasiId, setLokasiId] = useState('');
  const [blokId, setBlokId] = useState('');
  const [showUnits, setShowUnits] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredBlocks = blocks.filter(b => b.location_id === lokasiId);

  const handleTampilkanUnit = () => {
    if (!lokasiId || !blokId) return;
    const filtered = units.filter(u => u.block_id === blokId && u.status === 'Tersedia');
    setAvailableUnits(filtered);
    setShowUnits(true);
    setSelectedUnitId('');
  };

  const handleSave = async () => {
    if (!selectedUnitId || !currentUnit) return;
    setSaving(true);
    
    try {
      // 1. Kembalikan unit lama ke Tersedia
      await dbRequest({
        action: 'update',
        table: 'units',
        filters: [{ type: 'eq', column: 'id', value: currentUnit.id }],
        data: { status: 'Tersedia' },
      });
      
      // 2. Set unit baru status mengikuti sale status
      const newUnitStatus = sale.status === 'Batal' ? 'Tersedia' : sale.status;
      await dbRequest({
        action: 'update',
        table: 'units',
        filters: [{ type: 'eq', column: 'id', value: selectedUnitId }],
        data: { status: newUnitStatus },
      });
      
      // 3. Update sale unit_id
      await dbRequest({
        action: 'update',
        table: 'sales',
        filters: [{ type: 'eq', column: 'id', value: sale.id }],
        data: { unit_id: selectedUnitId },
      });
      
      // 4. Catat histori
      const newUnit = units.find(u => u.id === selectedUnitId);
      const keterangan = `Pindah dari ${currentUnit.location_nama} Blok ${currentUnit.block_nama} No ${currentUnit.no_unit} ke ${newUnit?.location_nama} Blok ${newUnit?.block_nama} No ${newUnit?.no_unit}`;
      
      await dbRequest({
        action: 'insert',
        table: 'sale_step_history',
        data: {
          sale_id: sale.id,
          jenis_step: 'pindah_unit',
          status: 'Pindah Unit',
          keterangan: keterangan
        },
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      alert('Gagal pindah unit: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-slate-800 text-lg mb-4">Pindah Unit</h3>
        
        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded text-sm">
          <p className="text-slate-500 font-semibold mb-1">Unit Saat Ini:</p>
          <p className="font-bold text-slate-800">{currentUnit?.location_nama} - Blok {currentUnit?.block_nama} No. {currentUnit?.no_unit}</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Lokasi *</label>
            <select value={lokasiId} onChange={e => { setLokasiId(e.target.value); setBlokId(''); setShowUnits(false); }}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">** Pilih Lokasi</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.nama_lokasi}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Blok *</label>
            <select value={blokId} onChange={e => { setBlokId(e.target.value); setShowUnits(false); }} disabled={!lokasiId}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400">
              <option value="">{lokasiId ? "** Pilih Blok" : "** Pilih Lokasi Dahulu"}</option>
              {filteredBlocks.map(b => (
                <option key={b.id} value={b.id}>{b.nama_blok}</option>
              ))}
            </select>
          </div>
          
          <button onClick={handleTampilkanUnit} disabled={!lokasiId || !blokId} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded mt-2 disabled:opacity-50">
            TAMPILKAN UNIT
          </button>
        </div>
        
        {showUnits && (
          <div className="mt-4 border-t border-slate-200 pt-4">
            <label className="text-xs font-semibold text-slate-600 mb-2 block">Pilih Unit Baru:</label>
            {availableUnits.length === 0 ? (
              <p className="text-sm text-red-500 text-center py-2 bg-red-50 rounded">Tidak ada unit tersedia di blok ini.</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableUnits.map(u => (
                  <label key={u.id} className={`flex items-center gap-3 p-2 rounded border cursor-pointer ${selectedUnitId === u.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="new_unit" value={u.id} checked={selectedUnitId === u.id} onChange={() => setSelectedUnitId(u.id)} className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-bold text-sm text-slate-800">No. {u.no_unit}</p>
                      <p className="text-xs text-slate-500">{u.unit_type_nama}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 mt-5 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-600 rounded font-semibold">Batal</button>
          <button onClick={handleSave} disabled={saving || !selectedUnitId} className="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded font-semibold disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan & Konfirmasi'}</button>
        </div>
      </div>
    </div>
  );
}
