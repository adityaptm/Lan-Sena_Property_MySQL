import React, { useState } from 'react';

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
  saleId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CetakSerahTerimaKunciForm({ saleId, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    nomor_surat: '0111/BAST-KC/LSJ/08/2026',
    tanggal: new Date().toISOString().split('T')[0],
    yang_menyerahkan: '',
    masa_pemeliharaan_hari: 100,
    catatan: 'tidak merenovasi dan memperbaiki sendiri',
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.tanggal || !form.yang_menyerahkan || !form.nomor_surat) return;
    setSaving(true);
    
    // Buka window kosong lebih awal untuk mencegah popup blocker
    const newWindow = window.open('about:blank', '_blank');
    
    try {
      await dbRequest({
        action: 'insert',
        table: 'sale_key_handovers',
        data: {
          sale_id: saleId,
          nomor_surat: form.nomor_surat,
          tanggal_serah_terima: form.tanggal,
          yang_menyerahkan: form.yang_menyerahkan,
          masa_pemeliharaan_hari: form.masa_pemeliharaan_hari,
          catatan: form.catatan,
        },
      });

      onSuccess();
      if (newWindow) {
        const queryParams = new URLSearchParams({
          id: saleId,
          nomor: form.nomor_surat,
          tanggal: form.tanggal,
          penyerah: form.yang_menyerahkan,
          pemeliharaan: form.masa_pemeliharaan_hari.toString(),
          catatan: form.catatan,
        }).toString();

        newWindow.location.href = `/penjualan/print-serah-terima-kunci?${queryParams}`;
      }
      onClose();
    } catch (error: any) {
      if (newWindow) newWindow.close();
      alert(`Gagal menyimpan data serah terima kunci: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="font-bold text-slate-800 text-lg mb-4">TANDA TERIMA KUNCI</h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Nomor Surat *</label>
            <input 
              type="text" 
              placeholder="0111/BAST-KC/LSJ/08/2026"
              value={form.nomor_surat}
              onChange={e => setForm({ ...form, nomor_surat: e.target.value })}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Tanggal Serah Terima *</label>
            <input 
              type="date" 
              value={form.tanggal}
              onChange={e => setForm({ ...form, tanggal: e.target.value })}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Yang Menyerahkan Kunci *</label>
            <input 
              type="text" 
              placeholder="Nama staf/marketer" 
              value={form.yang_menyerahkan}
              onChange={e => setForm({ ...form, yang_menyerahkan: e.target.value })}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Masa Pemeliharaan (Hari)</label>
            <input 
              type="number" 
              value={form.masa_pemeliharaan_hari}
              onChange={e => setForm({ ...form, masa_pemeliharaan_hari: Number(e.target.value) })}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Catatan Pemeliharaan</label>
            <input 
              type="text" 
              value={form.catatan}
              onChange={e => setForm({ ...form, catatan: e.target.value })}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5 justify-end">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-600 rounded font-semibold"
          >
            Batal
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving || !form.tanggal || !form.yang_menyerahkan || !form.nomor_surat} 
            className="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded font-semibold disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}
