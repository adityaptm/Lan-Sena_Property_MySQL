'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { CheckCircle2 } from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import { createClient } from '@/lib/supabase/client';

export default function InputPenjualanPage() {
  const router = useRouter();
  const { customers, units, marketers, banks, locations, blocks, unitTypes, subsidyTypes, addSale } = useData();
  const supabase = createClient();

  const availableUnits = units.filter((u) => u.status === 'Tersedia' || u.status === 'Booking');

  const [formData, setFormData] = useState({
    customer_nama: '',
    unit_blok: '',
    unit_no: '',
    unit_type: '30/60',
    subsidy_type: 'Subsidi',
    marketer_nama: '',
    metode_bayar: 'KPR' as 'KPR' | 'Cash Bertahap' | 'Cash Keras',
    bank_nama: 'Mandiri',
    harga_kesepakatan: 0,
    diskon: 0,
    booking_fee: 0,
    dp_nominal: 0,
    status: 'DP' as 'Booking' | 'DP' | 'Akad' | 'Lunas',
  });

  const [unitSearchInput, setUnitSearchInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalHarga = formData.harga_kesepakatan - formData.diskon;

  const handleUnitChange = (typedValue: string) => {
    setUnitSearchInput(typedValue);

    const foundUnit = units.find((u) => {
      const fullLabel = `${u.block_nama || ''} ${u.no_unit || ''}`.trim().toLowerCase();
      const unitNoOnly = (u.no_unit || '').toLowerCase();
      const target = typedValue.toLowerCase().trim();

      return fullLabel === target || unitNoOnly === target;
    });

    if (foundUnit) {
      setFormData((prev) => ({
        ...prev,
        unit_no: foundUnit.no_unit || '',
        unit_blok: foundUnit.block_nama || prev.unit_blok,
        unit_type: foundUnit.unit_type_nama || prev.unit_type,
        harga_kesepakatan: foundUnit.harga_dasar || prev.harga_kesepakatan,
      }));
      return;
    }

    const match = typedValue.match(/(?:blok\s*)?([a-z0-9\-\s]+?)\s*(?:no\.?|nomor|\/)?\s*([0-9]+[a-z]?)$/i);

    if (match) {
      const rawBlok = match[1].trim();
      const rawNo = match[2].trim();

      const formattedBlok = rawBlok.toUpperCase().startsWith('BLOK')
        ? rawBlok
        : `Blok ${rawBlok}`;

      setFormData((prev) => ({
        ...prev,
        unit_blok: formattedBlok,
        unit_no: rawNo,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        unit_no: typedValue,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let custId = customers.find(
        (c) => (c.nama || '').toLowerCase() === formData.customer_nama.toLowerCase()
      )?.id;

      if (!custId) {
        const dummyNik = '0000000000000000-' + Math.floor(Math.random() * 10000);
        const { data, error } = await supabase
          .from('customers')
          .insert({
            nama: formData.customer_nama,
            nik: dummyNik,
            alamat: '-',
            no_hp: '-',
          })
          .select()
          .single();
        if (error) throw error;
        custId = data?.id;
      }

      let unitItem = units.find(
        (u) =>
          (u.no_unit || '').toLowerCase() === formData.unit_no.toLowerCase() &&
          (u.block_nama || '').toLowerCase() === formData.unit_blok.toLowerCase()
      );
      let unitId = unitItem?.id;

      if (!unitId) {
        let locationId = locations[0]?.id;
        if (!locationId) {
          const { data: newLoc, error } = await supabase
            .from('locations')
            .insert({ nama_lokasi: 'Perumahan Benteng Mutiara Mas', alamat: '-' })
            .select()
            .single();
          if (error) throw error;
          locationId = newLoc.id;
        }

        const blockRecord = blocks.find(
          (b) => b.nama_blok.toLowerCase() === formData.unit_blok.toLowerCase()
        );
        let blockId = blockRecord?.id;
        if (!blockId) {
          const { data: newBlock, error } = await supabase
            .from('blocks')
            .insert({ nama_blok: formData.unit_blok, location_id: locationId })
            .select()
            .single();
          if (error) throw error;
          blockId = newBlock.id;
        }

        const unitTypeRecord = unitTypes.find(
          (t) => t.nama_type.toLowerCase() === formData.unit_type.toLowerCase()
        );
        let unitTypeId = unitTypeRecord?.id;
        if (!unitTypeId) {
          const typeMatch = formData.unit_type.match(/(\d+)\s*\/\s*(\d+)/);
          const luasBangunan = typeMatch ? parseInt(typeMatch[1]) : 36;
          const luasTanah = typeMatch ? parseInt(typeMatch[2]) : 72;
          const { data: newType, error } = await supabase
            .from('unit_types')
            .insert({
              nama_type: formData.unit_type,
              luas_tanah: luasTanah,
              luas_bangunan: luasBangunan,
            })
            .select()
            .single();
          if (error) throw error;
          unitTypeId = newType.id;
        }

        let subsidyTypeId = subsidyTypes.find(
          (s) => s.nama_type.toLowerCase() === formData.subsidy_type.toLowerCase()
        )?.id;
        if (!subsidyTypeId) {
          const { data: newSub, error } = await supabase
            .from('subsidy_types')
            .insert({ nama_type: formData.subsidy_type, keterangan: 'Kategori KPR' })
            .select()
            .single();
          if (error) throw error;
          subsidyTypeId = newSub.id;
        }

        const { data, error } = await supabase
          .from('units')
          .insert({
            no_unit: formData.unit_no,
            block_id: blockId,
            unit_type_id: unitTypeId,
            subsidy_type_id: subsidyTypeId,
            harga_dasar: formData.harga_kesepakatan,
            status: 'Booking',
          })
          .select()
          .single();
        if (error) throw error;
        unitId = data?.id;
        unitItem = data as any;
      }

      let markId = marketers.find(
        (m) => (m.nama || '').toLowerCase() === formData.marketer_nama.toLowerCase()
      )?.id;

      if (!markId && formData.marketer_nama) {
        const { data, error } = await supabase
          .from('marketers')
          .insert({
            nama: formData.marketer_nama,
            no_hp: '-',
          })
          .select()
          .single();
        if (!error) markId = data?.id;
      }

      let bankId: string | undefined = undefined;
      let finalBankNama: string | undefined = undefined;
      if (formData.metode_bayar === 'KPR') {
        const bankRecord = banks.find(
          (b) => (b.nama_bank || '').toLowerCase() === formData.bank_nama.toLowerCase()
        );
        if (bankRecord) {
          bankId = bankRecord.id;
          finalBankNama = bankRecord.nama_bank;
        } else {
          const { data, error } = await supabase
            .from('banks')
            .insert({
              nama_bank: formData.bank_nama,
              cabang: 'Pusat',
              pic_nama: '-',
              pic_hp: '-',
            })
            .select()
            .single();
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
        block_nama: formData.unit_blok,
        location_nama: unitItem?.location_nama || 'Perumahan Benteng Mutiara Mas',
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
    } catch (err: any) {
      console.error(err);
      alert(`Terjadi kesalahan saat menyimpan data: ${err?.message || 'Cek console log.'}`);
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Form Input Penjualan Unit
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pencatatan Surat Pemesanan Rumah (SPR) & kesepakatan transaksi baru
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/60 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
        >
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider border-b border-slate-200 pb-2">
              1. Identitas Pembeli & Unit Rumah
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Nama Customer Pembeli *
              </label>
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
                {customers.map((c) => (
                  <option key={c.id} value={c.nama || ''} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Jenis Rumah *
                </label>
                <select
                  value={formData.subsidy_type}
                  onChange={(e) => setFormData({ ...formData, subsidy_type: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Subsidi">Subsidi</option>
                  <option value="Komersil">Komersil</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Pilih / Ketik Unit *
                </label>
                <input
                  type="text"
                  required
                  list="units-list"
                  placeholder="Contoh: Blok 24 No 02"
                  value={unitSearchInput}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <datalist id="units-list">
                  {availableUnits.map((u) => {
                    const displayBlok = u.block_nama ? `${u.block_nama} ` : '';
                    const displayNo = u.no_unit ? `No ${u.no_unit}` : '';
                    const fullValue = `${displayBlok}${displayNo}`.trim();
                    const tipeText = u.unit_type_nama ? ` (Type ${u.unit_type_nama})` : '';
                    const hargaText = u.harga_dasar
                      ? ` - Rp ${u.harga_dasar.toLocaleString('id-ID')}`
                      : '';

                    return (
                      <option key={u.id} value={fullValue}>
                        {`${fullValue}${tipeText}${hargaText}`}
                      </option>
                    );
                  })}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Tipe Unit *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 30/60"
                  value={formData.unit_type}
                  onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Marketer / Sales Agent *
              </label>
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
                {marketers.map((m) => (
                  <option key={m.id} value={m.nama || ''} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider border-b border-slate-200 pb-2">
              2. Skema Pembayaran & Harga Transaksi
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Skema Pembayaran *
                </label>
                <select
                  value={formData.metode_bayar}
                  onChange={(e) =>
                    setFormData({ ...formData, metode_bayar: e.target.value as any })
                  }
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
                >
                  <option value="KPR">KPR (Kredit Pemilikan Rumah)</option>
                  <option value="Cash Bertahap">Cash Bertahap (Inhouse)</option>
                  <option value="Cash Keras">Cash Keras (Pelunasan)</option>
                </select>
              </div>

              {formData.metode_bayar === 'KPR' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Pilih Bank Pengaju KPR
                  </label>
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
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Harga Kesepakatan (Rp) *
                </label>
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
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Diskon / Potongan (Rp)
                </label>
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
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Total Harga Net (Rp)
                </label>
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
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Booking Fee (Rp)
                </label>
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
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Uang Muka (DP) (Rp)
                </label>
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
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Status Transaksi Initial
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as any })
                  }
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
              className={`flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-sm transition shadow-sm ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi Penjualan'}</span>
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}