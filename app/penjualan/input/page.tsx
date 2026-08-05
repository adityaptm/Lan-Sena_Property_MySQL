'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { CheckCircle2, Search, ExternalLink } from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import { createClient } from '@/lib/supabase/client';
import type { Customer, Unit } from '@/types';

// Urutan alami supaya "2" tampil sebelum "10" (bukan urutan teks biasa)
function naturalSort<T>(arr: T[], getKey: (item: T) => string): T[] {
  return [...arr].sort((a, b) =>
    getKey(a).localeCompare(getKey(b), undefined, { numeric: true, sensitivity: 'base' })
  );
}

export default function InputPenjualanPage() {
  const router = useRouter();
  const { customers, units, marketers, banks, locations, blocks, addSale, searchCustomers } = useData();
  const supabase = createClient();

  // --- State pencarian Customer ---
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const customerBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = customerQuery.trim();
    if (q.length < 2) {
      setCustomerResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const result = await searchCustomers(q);
      setCustomerResults(result);
    }, 300);
    return () => clearTimeout(timeout);
  }, [customerQuery, searchCustomers]);

  // Tutup dropdown hasil pencarian kalau klik di luar box-nya
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (customerBoxRef.current && !customerBoxRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePickCustomer = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setCustomerQuery(c.nama);
    setShowCustomerDropdown(false);
  };

  const handleCustomerQueryChange = (val: string) => {
    setCustomerQuery(val);
    setSelectedCustomerId(''); // ketik manual = dianggap customer baru sampai pilih dari list lagi
    setShowCustomerDropdown(true);
  };

  // --- State cascading Perumahan > Blok > No Unit ---
  const [locationId, setLocationId] = useState('');
  const [blockId, setBlockId] = useState('');
  const [unitId, setUnitId] = useState('');

  const filteredBlocks = useMemo(
    () => naturalSort(blocks.filter((b) => b.location_id === locationId), (b) => b.nama_blok),
    [blocks, locationId]
  );

  const availableUnitsInBlock = useMemo(() => {
    const filtered = units.filter(
      (u) => u.block_id === blockId && (u.status === 'Tersedia' || u.status === 'Booking')
    );
    return naturalSort(filtered, (u) => u.no_unit || '');
  }, [units, blockId]);

  const selectedUnit: Unit | undefined = useMemo(
    () => units.find((u) => u.id === unitId),
    [units, unitId]
  );

  const handleLocationChange = (val: string) => {
    setLocationId(val);
    setBlockId('');
    setUnitId('');
  };

  const handleBlockChange = (val: string) => {
    setBlockId(val);
    setUnitId('');
  };

  // --- Form utama ---
  const [formData, setFormData] = useState({
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

  // Begitu unit dipilih, auto-isi harga, DP, booking fee dari data master unit
  const handleUnitChange = (val: string) => {
    setUnitId(val);
    const u = units.find((x) => x.id === val);
    if (u) {
      setFormData((prev) => ({
        ...prev,
        harga_kesepakatan: u.harga_dasar || 0,
        dp_nominal: u.uang_muka || 0,
        booking_fee: u.booking_fee || 0,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!unitId) {
      alert('Silakan pilih Perumahan, Blok, dan No Unit terlebih dahulu.');
      return;
    }
    if (!selectedCustomerId && !customerQuery.trim()) {
      alert('Silakan pilih atau ketik nama customer.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Resolve Customer ID (pakai yang dipilih dari pencarian, atau bikin baru dari nama yang diketik)
      let custId = selectedCustomerId;
      let custNama = customerQuery.trim();

      if (!custId) {
        const dummyNik = '0000000000000000-' + Math.floor(Math.random() * 10000);
        const { data, error } = await supabase
          .from('customers')
          .insert({
            nama: custNama,
            nik: dummyNik,
            alamat: '-',
            no_hp: '-',
          })
          .select()
          .single();
        if (error) throw error;
        custId = data?.id;
      } else {
        const existing = customers.find((c) => c.id === custId) || customerResults.find((c) => c.id === custId);
        if (existing) custNama = existing.nama;
      }

      // 2. Resolve Marketer ID
      let markId = marketers.find(
        (m) => (m.nama || '').toLowerCase() === formData.marketer_nama.toLowerCase()
      )?.id;

      if (!markId && formData.marketer_nama) {
        const { data, error } = await supabase
          .from('marketers')
          .insert({ nama: formData.marketer_nama, no_hp: '-' })
          .select()
          .single();
        if (!error) markId = data?.id;
      }

      // 3. Resolve Bank ID
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
            .insert({ nama_bank: formData.bank_nama, cabang: 'Pusat', pic_nama: '-', pic_hp: '-' })
            .select()
            .single();
          if (!error) {
            bankId = data?.id;
            finalBankNama = formData.bank_nama;
          }
        }
      }

      // 4. Simpan Transaksi Penjualan (unit_id sudah pasti valid, tidak ada lagi create-unit di sini)
      await addSale({
        customer_id: custId || '',
        customer_nama: custNama,
        unit_id: unitId,
        unit_no: selectedUnit?.no_unit,
        block_nama: selectedUnit?.block_nama,
        location_nama: selectedUnit?.location_nama,
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
          {/* Section 1: Customer */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider border-b border-slate-200 pb-2">
              1. Identitas Pembeli
            </h3>

            <div className="relative" ref={customerBoxRef}>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Cari / Ketik Nama Customer *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ketik minimal 2 huruf untuk cari customer..."
                  value={customerQuery}
                  onChange={(e) => handleCustomerQueryChange(e.target.value)}
                  onFocus={() => setShowCustomerDropdown(true)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>

              {showCustomerDropdown && customerQuery.trim().length >= 2 && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
                  {customerResults.length === 0 ? (
                    <div className="px-3.5 py-3 text-xs text-slate-400">
                      Tidak ditemukan — lanjutkan ketik nama untuk buat customer baru.
                    </div>
                  ) : (
                    customerResults.map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => handlePickCustomer(c)}
                        className="w-full text-left px-3.5 py-2 hover:bg-blue-50 border-b border-slate-100 last:border-0"
                      >
                        <div className="text-sm font-semibold text-slate-800">{c.nama}</div>
                        <div className="text-xs text-slate-500">{c.no_hp}</div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {selectedCustomerId && (
                <p className="text-[11px] text-emerald-600 mt-1">
                  ✓ Customer sudah ada di database, tidak akan dibuat data baru.
                </p>
              )}
            </div>
          </div>

          {/* Section 2: Unit Rumah (cascading dari master data) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">
                2. Pilih Unit Rumah
              </h3>
              <Link
                href="/unit-rumah"
                target="_blank"
                className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
              >
                <span>+ Unit belum ada? Tambah di sini</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Perumahan *
                </label>
                <select
                  required
                  value={locationId}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Perumahan --</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.nama_lokasi}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Blok *
                </label>
                <select
                  required
                  disabled={!locationId}
                  value={blockId}
                  onChange={(e) => handleBlockChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">{locationId ? '-- Pilih Blok --' : 'Pilih Perumahan dulu'}</option>
                  {filteredBlocks.map((b) => (
                    <option key={b.id} value={b.id}>{b.nama_blok}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  No Unit *
                </label>
                <select
                  required
                  disabled={!blockId}
                  value={unitId}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">{blockId ? '-- Pilih No Unit --' : 'Pilih Blok dulu'}</option>
                  {availableUnitsInBlock.map((u) => (
                    <option key={u.id} value={u.id}>
                      No {u.no_unit} — {u.status}
                    </option>
                  ))}
                </select>
                {blockId && availableUnitsInBlock.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    Tidak ada unit tersedia di blok ini.
                  </p>
                )}
              </div>
            </div>

            {selectedUnit && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-md p-3 text-xs">
                <div>
                  <span className="block text-slate-400">Tipe Unit</span>
                  <span className="font-semibold text-slate-700">{selectedUnit.unit_type_nama || '-'}</span>
                </div>
                <div>
                  <span className="block text-slate-400">Jenis Rumah</span>
                  <span className="font-semibold text-slate-700">{selectedUnit.subsidy_type_nama || '-'}</span>
                </div>
                <div>
                  <span className="block text-slate-400">Harga Dasar</span>
                  <span className="font-semibold text-slate-700">{formatRupiah(selectedUnit.harga_dasar || 0)}</span>
                </div>
              </div>
            )}

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

          {/* Section 3: Skema Pembiayaan & Harga */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider border-b border-slate-200 pb-2">
              3. Skema Pembayaran & Harga Transaksi
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Skema Pembayaran *
                </label>
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

            {formData.metode_bayar === 'KPR' && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <span className="block text-[11px] text-blue-500 font-semibold mb-0.5">
                  Maksimal Kredit (Plafon KPR Unit Ini)
                </span>
                <span className="text-sm font-bold text-blue-700">
                  {selectedUnit ? formatRupiah(selectedUnit.maksimal_kredit || 0) : 'Pilih unit terlebih dahulu'}
                </span>
                <p className="text-[10px] text-blue-400 mt-1">
                  Cek sebelum isi Harga Kesepakatan.
                </p>
              </div>
            )}

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
                  <span className="text-[10px] text-slate-400 font-normal ml-1">(otomatis dari unit, bisa diedit)</span>
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
                  <span className="text-[10px] text-slate-400 font-normal ml-1">(otomatis dari unit, bisa diedit)</span>
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