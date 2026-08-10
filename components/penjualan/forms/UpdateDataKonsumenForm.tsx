import React, { useState } from 'react';
import { Customer } from '@/types';
import { Lock, Unlock } from 'lucide-react';

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
  customer: Customer;
  onClose: () => void;
  onSuccess: () => void;
}

const LockedInput = ({ label, value, onChange, type = 'text', required = false, rows = 0, note = '' }: any) => {
  const [locked, setLocked] = useState(!!value); 
  
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-semibold text-slate-600 block">{label} {required && '*'}</label>
        <button type="button" onClick={() => setLocked(!locked)} className="text-slate-400 hover:text-slate-600 focus:outline-none" title={locked ? "Buka gembok untuk mengedit" : "Kunci input"}>
          {locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>
      </div>
      {rows > 0 ? (
        <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} disabled={locked} className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm disabled:bg-slate-100 disabled:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
      ) : type === 'select' ? (
        <select value={value} onChange={e => onChange(e.target.value)} disabled={locked} className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm disabled:bg-slate-100 disabled:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="Belum Menikah">Belum Menikah</option>
          <option value="Menikah">Menikah</option>
        </select>
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} disabled={locked} className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm disabled:bg-slate-100 disabled:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
      )}
      {note && <p className="text-[10px] text-slate-400 mt-1">{note}</p>}
    </div>
  );
};

export function UpdateDataKonsumenForm({ customer, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    nama: customer.nama || '',
    tempat_lahir: customer.tempat_lahir || '',
    tanggal_lahir: customer.tanggal_lahir || '',
    nik: customer.nik || '',
    no_hp: customer.no_hp || '',
    email: customer.email || '',
    alamat: customer.alamat_ktp || customer.alamat || '',
    domisili: customer.alamat_domisili || customer.domisili || '',
    pekerjaan: customer.pekerjaan || '',
    instansi: customer.instansi || '',
    pendapatan_per_bulan: customer.pendapatan_per_bulan || '',
    npwp: customer.npwp || '',
    status_pernikahan: customer.status_pernikahan || 'Belum Menikah',
    nama_pasangan: customer.nama_pasangan || '',
    tempat_lahir_pasangan: customer.tempat_lahir_pasangan || '',
    tanggal_lahir_pasangan: customer.tanggal_lahir_pasangan || '',
    pekerjaan_pasangan: customer.pekerjaan_pasangan || '',
    nik_pasangan: customer.nik_pasangan || '',
    alamat_domisili_pasangan: customer.alamat_domisili_pasangan || '',
    bank_rekening_kpr: customer.bank_rekening_kpr || '',
    nomor_rekening_kpr: customer.nomor_rekening_kpr || ''
  });
  const [saving, setSaving] = useState(false);

  const isMenikah = form.status_pernikahan === 'Menikah';

  const handleSave = async () => {
    if (!form.nama || !form.tanggal_lahir || !form.nik || !form.no_hp || !form.alamat) {
      alert('Mohon lengkapi data wajib (*)');
      return;
    }
    
    setSaving(true);
    try {
      await dbRequest({
        action: 'update',
        table: 'customers',
        filters: [{ type: 'eq', column: 'id', value: customer.id }],
        data: {
          nama: form.nama,
          tempat_lahir: form.tempat_lahir,
          tanggal_lahir: form.tanggal_lahir,
          nik: form.nik,
          no_hp: form.no_hp,
          email: form.email,
          alamat: form.alamat, 
          alamat_ktp: form.alamat,
          domisili: form.domisili,
          alamat_domisili: form.domisili,
          pekerjaan: form.pekerjaan,
          instansi: form.instansi,
          pendapatan_per_bulan: Number(String(form.pendapatan_per_bulan).replace(/\D/g, '')) || 0,
          npwp: form.npwp,
          status_pernikahan: form.status_pernikahan,
          nama_pasangan: isMenikah ? form.nama_pasangan : null,
          tempat_lahir_pasangan: isMenikah ? form.tempat_lahir_pasangan : null,
          tanggal_lahir_pasangan: isMenikah ? form.tanggal_lahir_pasangan : null,
          pekerjaan_pasangan: isMenikah ? form.pekerjaan_pasangan : null,
          nik_pasangan: isMenikah ? form.nik_pasangan : null,
          alamat_domisili_pasangan: isMenikah ? form.alamat_domisili_pasangan : null,
          bank_rekening_kpr: form.bank_rekening_kpr,
          nomor_rekening_kpr: form.nomor_rekening_kpr
        },
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      alert('Gagal mengupdate data konsumen: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-slate-800 text-lg mb-4">Update Data Konsumen</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-blue-700 border-b pb-1">Data Pribadi</h4>
            <LockedInput label="Nama" value={form.nama} onChange={(v: string) => setForm({...form, nama: v})} required />
            
            <div className="grid grid-cols-2 gap-3">
              <LockedInput label="Tempat Lahir" value={form.tempat_lahir} onChange={(v: string) => setForm({...form, tempat_lahir: v})} />
              <LockedInput label="Tanggal Lahir" type="date" value={form.tanggal_lahir} onChange={(v: string) => setForm({...form, tanggal_lahir: v})} required />
            </div>
            
            <LockedInput label="NIK" value={form.nik} onChange={(v: string) => setForm({...form, nik: v})} required />
            
            <div className="grid grid-cols-2 gap-3">
              <LockedInput label="No. Handphone" value={form.no_hp} onChange={(v: string) => setForm({...form, no_hp: v})} required />
              <LockedInput label="Email" type="email" value={form.email} onChange={(v: string) => setForm({...form, email: v})} />
            </div>
            
            <LockedInput label="Alamat KTP" rows={2} value={form.alamat} onChange={(v: string) => setForm({...form, alamat: v})} required />
            <LockedInput label="Alamat Domisili / Kantor" rows={2} value={form.domisili} onChange={(v: string) => setForm({...form, domisili: v})} />
            
            <div className="grid grid-cols-2 gap-3">
              <LockedInput label="Pekerjaan" value={form.pekerjaan} onChange={(v: string) => setForm({...form, pekerjaan: v})} />
              <LockedInput label="Institusi" value={form.instansi} onChange={(v: string) => setForm({...form, instansi: v})} />
            </div>
            
            <LockedInput label="Pendapatan per Bulan" value={form.pendapatan_per_bulan} onChange={(v: string) => setForm({...form, pendapatan_per_bulan: v.replace(/[^0-9]/g,'').replace(/\B(?=(\d{3})+(?!\d))/g,'.')})} />
            <LockedInput label="NPWP" value={form.npwp} onChange={(v: string) => setForm({...form, npwp: v})} />
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-blue-700 border-b pb-1">Data Tambahan</h4>
            <LockedInput label="Sudah Menikah?" type="select" value={form.status_pernikahan} onChange={(v: string) => setForm({...form, status_pernikahan: v})} />
            
            {isMenikah && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 shadow-inner">
                <p className="text-xs text-blue-600 font-bold mb-2 uppercase tracking-wide">Data Pasangan (Suami/Istri)</p>
                <LockedInput label="Nama Pasangan" value={form.nama_pasangan} onChange={(v: string) => setForm({...form, nama_pasangan: v})} />
                
                <div className="grid grid-cols-2 gap-3">
                  <LockedInput label="Tempat Lahir" value={form.tempat_lahir_pasangan} onChange={(v: string) => setForm({...form, tempat_lahir_pasangan: v})} />
                  <LockedInput label="Tanggal Lahir" type="date" value={form.tanggal_lahir_pasangan} onChange={(v: string) => setForm({...form, tanggal_lahir_pasangan: v})} />
                </div>
                
                <LockedInput label="Pekerjaan Pasangan" value={form.pekerjaan_pasangan} onChange={(v: string) => setForm({...form, pekerjaan_pasangan: v})} />
                <LockedInput label="NIK Pasangan" value={form.nik_pasangan} onChange={(v: string) => setForm({...form, nik_pasangan: v})} />
                <LockedInput label="Alamat Domisili Pasangan" rows={2} value={form.alamat_domisili_pasangan} onChange={(v: string) => setForm({...form, alamat_domisili_pasangan: v})} />
              </div>
            )}
            
            <h4 className="font-semibold text-blue-700 border-b pb-1 mt-6">Data Rekening KPR</h4>
            <div className="grid grid-cols-2 gap-3">
              <LockedInput label="Bank Rekening" value={form.bank_rekening_kpr} onChange={(v: string) => setForm({...form, bank_rekening_kpr: v})} />
              <LockedInput label="Nomor Rekening" value={form.nomor_rekening_kpr} onChange={(v: string) => setForm({...form, nomor_rekening_kpr: v})} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8 justify-end pt-5 border-t border-slate-200">
          <button onClick={onClose} className="px-5 py-2.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold transition">Batal</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold transition disabled:opacity-50 shadow-sm">{saving ? 'Menyimpan...' : 'Simpan Data'}</button>
        </div>
      </div>
    </div>
  );
}
