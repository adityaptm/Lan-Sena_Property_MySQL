'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { PlusCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { formatRupiah, parseRupiah } from '@/lib/format';
import { createClient } from '@/lib/supabase/client';

export default function InputPenjualanPage() {
  const router = useRouter();
  const { customers, units, marketers, banks, addSale } = useData();
  const supabase = createClient();

  const availableUnits = units.filter((u) => u.status === 'Tersedia' || u.status === 'Booking');

  const [formData, setFormData] = useState({
    customer_nama: '',
    unit_no: '',
    marketer_nama: '',
    metode_bayar: 'KPR' as 'KPR' | 'Cash Bertahap' | 'Cash Keras',
    bank_nama: 'Mandiri',
    harga_kesepakatan: 0,
    diskon: 0,
    booking_fee: 0,
    dp_nominal: 0,
    status: 'DP' as 'Booking' | 'DP' | 'Akad' | 'Lunas',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalHarga = formData.harga_kesepakatan - formData.diskon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // 1. Resolve Customer ID
      let custId = customers.find(c => c.nama.toLowerCase() === formData.customer_nama.toLowerCase())?.id;
      if (!custId) {
        const dummyNik = '0000000000000000-' + Math.floor(Math.random() * 10000);
        const { data, error } = await supabase.from('customers').insert({ 
          nama: formData.customer_nama, 
          nik: dummyNik,
          alamat: '-',
          no_hp: '-' 
        }).select().single();
        if (error) throw error;
        custId = data?.id;
      }
      
      // 2. Resolve Unit ID
      let unitItem = units.find(u => u.no_unit.toLowerCase() === formData.unit_no.toLowerCase());
      let unitId = unitItem?.id;
      if (!unitId) {
        const { data, error } = await supabase.from('units').insert({ 
          no_unit: formData.unit_no, 
          harga_dasar: formData.harga_kesepakatan,
          status: 'Booking'
        }).select().single();
        if (error) throw error;
        unitId = data?.id;
        unitItem = data as any;
      }
      
      // 3. Resolve Marketer ID
      let markId = marketers.find(m => m.nama.toLowerCase() === formData.marketer_nama.toLowerCase())?.id;
      if (!markId && formData.marketer_nama) {
        const { data, error } = await supabase.from('marketers').insert({ 
          nama: formData.marketer_nama,
          no_hp: '-'
        }).select().single();
        if (!error) markId = data?.id;
      }
      
      // 4. Resolve Bank ID
      let bankId = undefined;
      let finalBankNama = undefined;
      if (formData.metode_bayar === 'KPR') {
        const bankRecord = banks.find(b => b.nama_bank.toLowerCase() === formData.bank_nama.toLowerCase());
        if (bankRecord) {
           bankId = bankRecord.id;
           finalBankNama = bankRecord.nama_bank;
        } else {
           const { data, error } = await supabase.from('banks').insert({ 
             nama_bank: formData.bank_nama, 
             cabang: 'Pusat',
             pic_nama: '-',
             pic_hp: '-'
           }).select().single();
           if (!error) {
              bankId = data?.id;
              finalBankNama = formData.bank_nama;
           }
        }
      }

      await addSale({
        customer_id: custId || '',
        customer_nama: formData.customer_nama,
        unit_id: unitId || '',
        unit_no: formData.unit_no,
        location_nama: unitItem?.location_nama || '-',
        marketer_id: markId,
        marketer_nama: formData.marketer_nama,
        metode_bayar: formData.metode_bayar,
        bank_id: bankId,
        bank_nama: finalBankNama,
        harga_kesepakatan: formData.harga_kesepakatan,
        diskon: formData.diskon,
        total_harga: totalHarga,
        booking_fee: formData.booking_fee,
        dp_nominal: formData.dp_nominal,
        status: formData.status,
        kpr_status: formData.metode_bayar === 'KPR' ? 'Berkas Lengkap' : undefined,
        tanggal_booking: new Date().toISOString().slice(0, 10),
      });

      router.push('/penjualan/daftar');
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan data. Cek console log.');
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Form Input Penjualan Unit</h1>
          <p className="text-xs text-slate-400 mt-1">Pencatatan Surat Pemesanan Rumah (SPR) & kesepakatan transaksi baru</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/60 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm  space-y-6">
          {/* Section 1: Customer & Unit */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider border-b border-slate-200 pb-2">
              1. Identitas Pembeli & Unit Rumah
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pilih Customer Pembeli *</label>
                <input
                  type="text"
                  required
                  list="customers-list"
                  placeholder="Ketik nama customer..."
                  value={formData.customer_nama}
                  onChange={(e) => setFormData({ ...formData, customer_nama: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <datalist id="customers-list">
                  {customers.map((c) => <option key={c.id} value={c.nama} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pilih Unit Perumahan *</label>
                <input
                  type="text"
                  required
                  list="units-list"
                  placeholder="Ketik nomor unit..."
                  value={formData.unit_no}
                  onChange={(e) => {
                    const typed = e.target.value;
                    const u = units.find((x) => x.no_unit.toLowerCase() === typed.toLowerCase());
                    setFormData({
                      ...formData,
                      unit_no: typed,
                      harga_kesepakatan: u ? u.harga_dasar : formData.harga_kesepakatan,
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <datalist id="units-list">
                  {availableUnits.map((u) => (
                    <option key={u.id} value={u.no_unit}>{u.location_nama} - Rp {u.harga_dasar.toLocaleString('id-ID')}</option>
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Marketer / Sales Agent *</label>
              <input
                type="text"
                required
                list="marketers-list"
                placeholder="Ketik nama marketer..."
                value={formData.marketer_nama}
                onChange={(e) => setFormData({ ...formData, marketer_nama: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <datalist id="marketers-list">
                {marketers.map((m) => <option key={m.id} value={m.nama} />)}
              </datalist>
            </div>
          </div>

          {/* Section 2: Skema Pembiayaan & Harga */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider border-b border-slate-200 pb-2">
              2. Skema Pembayaran & Harga Transaksi
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Skema Pembayaran *</label>
                <select
                  value={formData.metode_bayar}
                  onChange={(e) => setFormData({ ...formData, metode_bayar: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
                >
                  <option value="KPR">KPR (Kredit Pemilikan Rumah)</option>
                  <option value="Cash Bertahap">Cash Bertahap (Inhouse)</option>
                  <option value="Cash Keras">Cash Keras (Pelunasan)</option>
                </select>
              </div>

              {formData.metode_bayar === 'KPR' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pilih Bank Pengaju KPR</label>
                  <select
                    value={formData.bank_nama}
                    onChange={(e) => setFormData({ ...formData, bank_nama: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
                  >
                    <option value="Mandiri">Mandiri</option>
                    <option value="BTN">BTN</option>
                    <option value="BRI">BRI</option>
                    <option value="BJB">BJB</option>
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Harga Kesepakatan (Rp) *</label>
                <input
                  type="text"
                  required
                  value={formatRupiah(formData.harga_kesepakatan)}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, harga_kesepakatan: Number(cleanVal) || 0 });
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm font-semibold text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Diskon / Potongan (Rp)</label>
                <input
                  type="text"
                  value={formatRupiah(formData.diskon)}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, diskon: Number(cleanVal) || 0 });
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Total Harga Net (Rp)</label>
                <input
                  type="text"
                  readOnly
                  value={`Rp ${totalHarga.toLocaleString('id-ID')}`}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold text-green-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Booking Fee (Rp)</label>
                <input
                  type="text"
                  value={formatRupiah(formData.booking_fee)}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, booking_fee: Number(cleanVal) || 0 });
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Uang Muka (DP) (Rp)</label>
                <input
                  type="text"
                  value={formatRupiah(formData.dp_nominal)}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, dp_nominal: Number(cleanVal) || 0 });
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status Transaksi Initial</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
                >
                  <option value="Booking">Booking Fee Only</option>
                  <option value="DP">Terbayar DP</option>
                  <option value="Akad">Sudah Akad KPR</option>
                  <option value="Lunas">Lunas Cash</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={() => router.push('/penjualan/daftar')}
              className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-md text-xs font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-sm transition shadow-sm ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Transaction Penjualan'}</span>
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
