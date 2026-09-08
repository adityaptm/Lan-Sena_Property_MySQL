import React from 'react';
import { Customer, Bank, Unit, Block, Location, Sale } from '@/types';
import { formatTanggalIndonesia, formatRupiah } from '@/lib/format';

export type BankPackageType = 'bjb_komersil' | 'bjb_update' | 'bri_update' | 'btn_update';

export interface BankKprDocData {
  sale?: Sale;
  customer: Customer;
  bank?: Bank;
  unit?: Unit;
  block?: Block;
  location?: Location;
}

export interface DocumentItemDef {
  id: string;
  code: string;
  title: string;
  component: React.FC<{ data: BankKprDocData; pageNum?: number; totalPages?: number }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER COMMONS
// ─────────────────────────────────────────────────────────────────────────────
function getCommons(data: BankKprDocData) {
  const { customer, unit, block, location, sale, bank } = data;
  const today = new Date();
  const todayStr = formatTanggalIndonesia(today);
  const currentYear = today.getFullYear().toString();

  const namaPemohon = (customer.nama || '').toUpperCase();
  const nikPemohon = customer.nik || '-';
  const tempatLahirPemohon = (customer.tempat_lahir || 'PURWAKARTA').toUpperCase();
  const tglLahirPemohon = customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-';
  const pekerjaanPemohon = (customer.pekerjaan || 'KARYAWAN SWASTA').toUpperCase();
  const alamatPemohon = (customer.alamat_ktp || customer.alamat || '-').toUpperCase();
  const noHpPemohon = customer.no_hp || (customer as any)?.no_telepon || '-';
  const gajiPemohon = customer.pendapatan_per_bulan ? formatRupiah(customer.pendapatan_per_bulan) : '................................';

  const namaPasangan = (customer.nama_pasangan || '').toUpperCase();
  const nikPasangan = (customer as any)?.nik_pasangan || '-';
  const tempatLahirPasangan = ((customer as any)?.tempat_lahir_pasangan || '-').toUpperCase();
  const tglLahirPasangan = (customer as any)?.tanggal_lahir_pasangan ? formatTanggalIndonesia((customer as any).tanggal_lahir_pasangan) : '-';
  const pekerjaanPasangan = ((customer as any)?.pekerjaan_pasangan || 'MENGURUS RUMAH TANGGA').toUpperCase();
  const alamatPasangan = ((customer as any)?.alamat_domisili_pasangan || (customer as any)?.alamat_domisili || customer.alamat_ktp || customer.alamat || '-').toUpperCase();

  const namaPerumahan = (location?.nama_lokasi || 'BENTENG MUTIARA MAS').toUpperCase();
  const blokUnit = `${block?.nama_blok || 'S22'} NO. ${unit?.no_unit || '09'}`.toUpperCase();
  const luasBangunan = unit?.luas_bangunan ? `${unit.luas_bangunan} m2` : '30 m2';
  const luasTanah = unit?.luas_tanah ? `${unit.luas_tanah} m2` : '60 m2';
  const luasGabung = `${unit?.luas_bangunan || '30'}/${unit?.luas_tanah || '60'} m2`;
  const alamatLokasi = location?.alamat || 'Perumahan Benteng Mutiara Mas, Kp. Babakan situ RT/RW : 04/02 Ds. Benteng Kec. Campaka Kab. Purwakarta';

  const hargaJualNominal = sale?.total_harga || unit?.harga_dasar || 166000000;
  const hargaJual = formatRupiah(hargaJualNominal);

  const dpTotalNominal = sale?.dp_nominal || 6000000;
  const dpTotal = formatRupiah(dpTotalNominal);

  const sbumNominal = 4000000;
  const sbumStr = formatRupiah(sbumNominal);

  const dpDibayarNominal = Math.max(0, dpTotalNominal - sbumNominal) || 2000000;
  const dpDibayar = formatRupiah(dpDibayarNominal);

  const pengembang = 'PT. LAN SENA JAYA';
  const direktur = 'ALAN SUHERLAN';

  const rekBtnDeveloper = '00036-01-30-999999-7';
  const rekBjbDeveloper = '00181-01-30-666-666-1';

  return {
    todayStr,
    currentYear,
    namaPemohon,
    nikPemohon,
    tempatLahirPemohon,
    tglLahirPemohon,
    pekerjaanPemohon,
    alamatPemohon,
    noHpPemohon,
    gajiPemohon,
    namaPasangan,
    nikPasangan,
    tempatLahirPasangan,
    tglLahirPasangan,
    pekerjaanPasangan,
    alamatPasangan,
    namaPerumahan,
    blokUnit,
    luasBangunan,
    luasTanah,
    luasGabung,
    alamatLokasi,
    hargaJual,
    dpTotal,
    dpDibayar,
    sbumStr,
    pengembang,
    direktur,
    rekBtnDeveloper,
    rekBjbDeveloper,
    bankNama: bank?.nama_bank || 'Bank BTN'
  };
}

// Komponen kotak materai berjarak aman agar tidak menutupi nama
const MateraiBox: React.FC<{ label?: string }> = ({ label = 'MATERAI 10.000' }) => (
  <div className="flex flex-col items-center justify-center my-2">
    <div className="w-28 h-16 border border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-slate-400 text-[7.5pt] leading-tight">
      <span className="font-semibold text-[7pt]">{label}</span>
      <span className="text-[6pt] text-slate-400 mt-0.5">Tempel di sini</span>
    </div>
    {/* Jarak vertikal aman 32px (h-8) agar materai fisik (3x3 cm) tidak menutupi teks nama */}
    <div className="h-8" />
  </div>
);

// Wrapper for an A4 Page with exact page-break styling and readable 10pt base font
export const PageWrapper: React.FC<{ children: React.ReactNode; pageNum?: number }> = ({ children }) => {
  return (
    <div className="kpr-page bg-white mx-auto shadow-md print:shadow-none border border-slate-200 print:border-none p-10 print:p-0 my-4 print:my-0 w-[210mm] min-h-[297mm] text-[10pt] leading-[1.4] text-black font-sans box-border relative flex flex-col justify-between">
      <div>{children}</div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. DOKUMEN BERSAMA (COMMON DOCUMENTS)
// ─────────────────────────────────────────────────────────────────────────────

// BAST (BERITA ACARA SERAH TERIMA)
export const DocBAST: React.FC<{ data: BankKprDocData; formatCode?: string }> = ({ data, formatCode = 'FORMAT H' }) => {
  const c = getCommons(data);
  return (
    <PageWrapper>
      <div className="text-center font-bold mb-4">
        <p className="text-xs uppercase tracking-wider">{formatCode}</p>
        <p className="text-base underline mt-0.5">BERITA ACARA SERAH TERIMA</p>
        <p className="text-base underline">RUMAH UMUM TAPAK</p>
      </div>

      <p className="text-justify mb-2">Nomor : _____</p>
      <p className="text-justify mb-2 leading-relaxed">
        Berdasarkan PPJB/AJB*) ........ No ........ Tanggal ........ telah dilakukan serah terima pada tanggal .................... dari :
        <br />
        <span className="font-semibold">{c.pengembang}</span>, selanjutnya disebut <span className="font-semibold">"Pihak Pertama"</span>;
      </p>

      <p className="font-semibold mb-1">Kepada pembeli :</p>
      <table className="w-full mb-3 text-[10pt]">
        <tbody>
          <tr><td className="w-6 py-0.5">1</td><td className="w-52">Nama</td><td className="w-3">:</td><td className="font-semibold">{c.namaPemohon}</td></tr>
          <tr><td className="py-0.5">2</td><td>NIK</td><td>:</td><td>{c.nikPemohon}</td></tr>
          <tr><td className="py-0.5 align-top">3</td><td className="align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPemohon}</td></tr>
          <tr><td className="py-0.5">4</td><td>No. Telp/ HP</td><td>:</td><td>{c.noHpPemohon}</td></tr>
        </tbody>
      </table>
      <p className="mb-2 italic text-[9pt]">Selanjutnya disebut "Pihak Kedua"</p>

      <p className="font-semibold mb-1">Atas 1 (satu) unit Rumah Umum Tapak pada lokasi sebagai berikut :</p>
      <table className="w-full mb-3 text-[10pt]">
        <tbody>
          <tr><td className="w-6 py-0.5">1</td><td className="w-52">Nama Perumahan</td><td className="w-3">:</td><td className="font-semibold">{c.namaPerumahan}</td></tr>
          <tr><td className="py-0.5">2</td><td>No. Rumah / Blok</td><td>:</td><td className="font-semibold">{c.blokUnit}</td></tr>
          <tr><td className="py-0.5">3</td><td>Luas Tanah dan Lantai Rumah</td><td>:</td><td>{c.luasGabung}</td></tr>
          <tr><td className="py-0.5">4</td><td>Alamat</td><td>:</td><td>{c.alamatLokasi}</td></tr>
          <tr><td className="py-0.5">5</td><td>Kota/ Kabupaten/ Provinsi</td><td>:</td><td>Purwakarta - Jawa Barat</td></tr>
        </tbody>
      </table>
      <p className="mb-2 italic text-[9pt]">selanjutnya disebut "Objek Serah Terima"</p>

      <p className="mb-1 font-semibold">Objek Serah Terima dengan kondisi laik fungsi dan dilengkapi dengan :</p>
      <ol className="list-decimal pl-5 space-y-0.5 mb-3 leading-relaxed">
        <li>Jaringan air bersih sudah berfungsi;</li>
        <li>Jaringan listrik sudah berfungsi;</li>
        <li>Jalan lingkungan sudah selesai dan berfungsi;</li>
        <li>Saluran/drainase lingkungan sudah selesai dan berfungsi;</li>
        <li>Saluran air limbah/air kotor rumah tangga sudah selesai dan berfungsi; dan</li>
        <li>Sarana pewadahan sampah individual dan tempat pembuangan sampah sementara.</li>
      </ol>

      <p className="text-justify mb-4">
        Demikian Berita Acara Serah Terima ini ditandatangani oleh kedua belah pihak dan dapat dipertanggungjawabkan.
      </p>

      <div className="grid grid-cols-2 gap-4 text-center mt-6">
        <div>
          <p className="font-semibold">PIHAK PERTAMA/ KUASA*)</p>
          <p className="font-semibold">{c.pengembang}</p>
          <div className="h-20" />
          <p className="font-bold underline">({c.direktur})</p>
          <p className="text-[8.5pt] text-slate-600">Tanda tangan dan Nama Pengembang</p>
        </div>
        <div>
          <p className="font-semibold">PIHAK KEDUA,</p>
          <div className="h-20" />
          <p className="font-bold underline">({c.namaPemohon})</p>
          <p className="text-[8.5pt] text-slate-600">Tanda tangan dan nama lengkap</p>
        </div>
      </div>
      <p className="text-[8.5pt] italic text-slate-500 mt-4">*) Pilih salah Satu</p>
    </PageWrapper>
  );
};

// SURAT PERNYATAAN PENGHASILAN
export const DocPernyataanPenghasilan: React.FC<{ data: BankKprDocData }> = ({ data }) => {
  const c = getCommons(data);
  return (
    <PageWrapper>
      <div className="text-center font-bold mb-6">
        <p className="text-base underline uppercase">SURAT PERNYATAAN PENGHASILAN</p>
      </div>

      <p className="mb-3">Yang bertandatangan di bawah ini :</p>

      <table className="w-full mb-4 text-[10pt]">
        <tbody>
          <tr><td className="w-48 py-1">Nama</td><td className="w-3">:</td><td className="font-semibold">{c.namaPemohon}</td></tr>
          <tr><td className="py-1">Tempat/tgl lahir</td><td>:</td><td>{c.tempatLahirPemohon}, {c.tglLahirPemohon}</td></tr>
          <tr><td className="py-1">Pekerjaan</td><td>:</td><td>{c.pekerjaanPemohon}</td></tr>
          <tr><td className="py-1">No. KTP/Passport</td><td>:</td><td>{c.nikPemohon}</td></tr>
          <tr><td className="py-1 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPemohon}</td></tr>
        </tbody>
      </table>

      <p className="text-justify mb-4 leading-relaxed">
        Menyatakan dengan sesungguhnya bahwa sampai saat surat pernyataan ini ditandatangani, saya menyatakan bahwa jumlah gaji/upah pokok saya adalah sebesar <span className="font-semibold">Rp. .................... (...........................................................................)</span> per bulan.
      </p>

      <p className="text-justify mb-8 leading-relaxed">
        Demikian surat pernyataan ini saya buat dengan sebenarnya tanpa paksaan dari pihak manapun dan apabila di kemudian hari pernyataan saya ini tidak benar, saya bersedia mengembalikan seluruh subsidi yang saya terima.
      </p>

      <div className="text-right mb-4">
        <p>Purwakarta, .................................... {c.currentYear}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center mt-4">
        <div>
          <p>Mengetahui:</p>
          <p className="font-semibold">Pimpinan Perusahaan/Instansi</p>
          <div className="h-24" />
          <p className="font-bold underline">( .................................................. )</p>
          <p className="text-[8.5pt] text-slate-600">Nama lengkap & jabatan</p>
        </div>
        <div>
          <p className="font-semibold">Yang membuat pernyataan,</p>
          <MateraiBox />
          <p className="font-bold underline">({c.namaPemohon})</p>
          <p className="text-[8.5pt] text-slate-600">Nama Lengkap</p>
        </div>
      </div>
      <p className="text-[8pt] italic text-slate-500 mt-6">*diberikan cap perusahaan/instansi</p>
    </PageWrapper>
  );
};

// SURAT PERNYATAAN TIDAK MEMILIKI RUMAH
export const DocTidakMemilikiRumah: React.FC<{ data: BankKprDocData }> = ({ data }) => {
  const c = getCommons(data);
  return (
    <PageWrapper>
      <div className="text-center font-bold mb-6">
        <p className="text-base underline uppercase">SURAT PERNYATAAN TIDAK MEMILIKI RUMAH</p>
      </div>

      <p className="mb-3">Yang bertandatangan di bawah ini :</p>

      <table className="w-full mb-4 text-[10pt]">
        <tbody>
          <tr><td className="w-48 py-1">Nama</td><td className="w-3">:</td><td className="font-semibold">{c.namaPemohon}</td></tr>
          <tr><td className="py-1">Tempat/Tgl lahir</td><td>:</td><td>{c.tempatLahirPemohon}, {c.tglLahirPemohon}</td></tr>
          <tr><td className="py-1">Pekerjaan</td><td>:</td><td>{c.pekerjaanPemohon}</td></tr>
          <tr><td className="py-1">No. KTP</td><td>:</td><td>{c.nikPemohon}</td></tr>
          <tr><td className="py-1 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPemohon}</td></tr>
        </tbody>
      </table>

      <p className="text-justify mb-3 leading-relaxed">
        menyatakan bahwa sampai dengan surat pernyataan ini dibuat tidak memiliki hak kepemilikan atas rumah.
      </p>

      <p className="text-justify mb-8 leading-relaxed">
        Demikian surat pernyataan ini saya buat dengan sebenarnya tanpa paksaan dari pihak manapun dan apabila di kemudian hari pernyataan saya ini tidak benar, saya bersedia mengembalikan Fasilitas Likuiditas Pembiayaan Perumahan yang saya terima.
      </p>

      <div className="text-right mb-4">
        <p>Purwakarta, .................................... {c.currentYear}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center mt-4">
        <div>
          <p>Mengetahui:</p>
          <p className="font-semibold">Kepala Desa/Lurah/Pimpinan Perusahaan/Instansi</p>
          <div className="h-24" />
          <p className="font-bold underline">( .................................................. )</p>
          <p className="text-[8.5pt] text-slate-600">Nama lengkap dan Jabatan</p>
        </div>
        <div>
          <p className="font-semibold">Yang membuat pernyataan,</p>
          <MateraiBox />
          <p className="font-bold underline">({c.namaPemohon})</p>
          <p className="text-[8.5pt] text-slate-600">Nama Lengkap</p>
        </div>
      </div>
      <p className="text-[8pt] italic text-slate-500 mt-6">*diberikan cap kelurahan/perusahaan/instansi</p>
    </PageWrapper>
  );
};

// SURAT PERNYATAAN TIDAK MEMILIKI PEKERJAAN (PASANGAN)
export const DocTidakBekerjaPasangan: React.FC<{ data: BankKprDocData }> = ({ data }) => {
  const c = getCommons(data);
  return (
    <PageWrapper>
      <div className="text-[9pt] italic text-slate-500 mb-2">[ Minta KOP SURAT DESA ]</div>
      <div className="text-center font-bold mb-6">
        <p className="text-base underline uppercase">SURAT PERNYATAAN TIDAK MEMILIKI PEKERJAAN</p>
        <p className="text-xs uppercase text-slate-700">(TIDAK BEKERJA / TIDAK MEMPUNYAI PEKERJAAN)</p>
      </div>

      <p className="mb-3">Yang bertanda-tangan di bawah ini :</p>

      <table className="w-full mb-4 text-[10pt]">
        <tbody>
          <tr><td className="w-48 py-1">Nama Lengkap</td><td className="w-3">:</td><td className="font-semibold">{c.namaPasangan || '...................................................'}</td></tr>
          <tr><td className="py-1">No KTP</td><td>:</td><td>{c.nikPasangan || '...................................................'}</td></tr>
          <tr><td className="py-1">Tempat/ Tgl lahir</td><td>:</td><td>{c.tempatLahirPasangan || '........'}, {c.tglLahirPasangan || '........'}</td></tr>
          <tr><td className="py-1">Pekerjaan</td><td>:</td><td>{c.pekerjaanPasangan}</td></tr>
          <tr><td className="py-1 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPasangan || c.alamatPemohon}</td></tr>
        </tbody>
      </table>

      <p className="text-justify mb-3 leading-relaxed">
        Dengan ini menyatakan bahwa selama ini <span className="font-semibold">tidak mempunyai pekerjaan / tidak bekerja.</span>
      </p>

      <p className="text-justify mb-8 leading-relaxed">
        Demikian Surat Pernyataan ini kami buat dengan sebenar-benarnya tanpa paksaan dari pihak manapun dan apabila dikemudian hari pernyataan saya tidak benar, saya bersedia mengembalikan seluruh subsidi yang saya terima.
      </p>

      <div className="text-right mb-4">
        <p>PURWAKARTA, .................................... {c.currentYear}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center mt-4">
        <div>
          <p>Mengetahui:</p>
          <p className="font-semibold">Kepala Kelurahan / Desa .........................</p>
          <div className="h-24" />
          <p className="font-bold underline">( .................................................. )</p>
          <p className="text-[8.5pt] text-slate-600">Nama Lengkap & Stempel</p>
        </div>
        <div>
          <p className="font-semibold">Yang membuat pernyataan,</p>
          <MateraiBox />
          <p className="font-bold underline">({c.namaPasangan || '...................................................'})</p>
          <p className="text-[8.5pt] text-slate-600">Nama Lengkap Pasangan</p>
        </div>
      </div>
    </PageWrapper>
  );
};

// LAMPIRAN BLOK UNIT YANG DI BIAYAI
export const DocBlokUnitDibiayai: React.FC<{ data: BankKprDocData }> = ({ data }) => {
  const c = getCommons(data);
  return (
    <PageWrapper>
      <div className="text-center font-bold mb-4">
        <p className="text-base underline uppercase">LAMPIRAN BLOK UNIT YANG DI BIAYAI</p>
      </div>

      <table className="w-full mb-4 text-[10pt]">
        <tbody>
          <tr><td className="w-56 py-0.5">NAMA PERUMAHAN</td><td className="w-3">:</td><td className="font-semibold">{c.namaPerumahan}</td></tr>
          <tr><td className="py-0.5">PENGEMBANG</td><td>:</td><td className="font-semibold">{c.pengembang}</td></tr>
          <tr><td className="py-0.5">KELURAHAN/DESA</td><td>:</td><td>BENTENG</td></tr>
          <tr><td className="py-0.5">KECAMATAN</td><td>:</td><td>CAMPAKA</td></tr>
          <tr><td className="py-0.5">KABUPATEN/KOTA</td><td>:</td><td>PURWAKARTA</td></tr>
          <tr><td className="py-0.5">PROVINSI</td><td>:</td><td>JAWA BARAT</td></tr>
          <tr><td className="py-0.5">ALAMAT LOKASI TERLETAK DI</td><td>:</td><td>Kp. Babakan situ RT/RW : 04/02</td></tr>
        </tbody>
      </table>

      <table className="w-full border-collapse border border-black text-center text-[9.5pt] mb-8">
        <thead>
          <tr className="bg-slate-100 font-bold">
            <th className="border border-black p-2 w-14">NO</th>
            <th className="border border-black p-2">BLOK/KAVLING</th>
            <th className="border border-black p-2">LUAS BANGUNAN</th>
            <th className="border border-black p-2">LUAS TANAH</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black p-2 font-bold">1</td>
            <td className="border border-black p-2 font-semibold text-left pl-4">{c.blokUnit}</td>
            <td className="border border-black p-2">{c.luasBangunan}</td>
            <td className="border border-black p-2">{c.luasTanah}</td>
          </tr>
          {[2, 3, 4, 5, 6, 7].map((num) => (
            <tr key={num}>
              <td className="border border-black p-2.5 text-slate-400">{num}</td>
              <td className="border border-black p-2.5"></td>
              <td className="border border-black p-2.5"></td>
              <td className="border border-black p-2.5"></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mt-12 pr-8">
        <div className="text-center w-72">
          <p className="font-semibold">CAP DEVELOPER & TTD</p>
          <div className="h-24" />
          <p className="font-bold underline">{c.direktur}</p>
          <p className="text-[9pt] text-slate-600">{c.pengembang}</p>
        </div>
      </div>
    </PageWrapper>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. DOKUMEN KHUSUS BANK BJB
// ─────────────────────────────────────────────────────────────────────────────

// FORMAT G - BJB KPR SEJAHTERA (PEMOHON & PASANGAN)
export const DocBjbFormatG: React.FC<{ data: BankKprDocData }> = ({ data }) => {
  const c = getCommons(data);
  return (
    <PageWrapper>
      <div className="text-center font-bold mb-2">
        <p className="text-xs uppercase tracking-wider">FORMAT G</p>
        <p className="text-sm underline">SURAT PERNYATAAN PEMOHON KPR SEJAHTERA</p>
      </div>

      <p className="mb-1 text-[9.5pt]">Yang bertandatangan di bawah ini :</p>

      {/* 1. Pemohon */}
      <table className="w-full mb-1 text-[9pt]">
        <tbody>
          <tr><td className="w-4 font-bold align-top">1</td><td className="w-40 py-0.5">Nama</td><td className="w-3">:</td><td className="font-semibold">{c.namaPemohon}</td></tr>
          <tr><td></td><td className="py-0.5">Tempat/ Tgl Lahir</td><td>:</td><td>{c.tempatLahirPemohon}, {c.tglLahirPemohon}</td></tr>
          <tr><td></td><td className="py-0.5">Pekerjaan</td><td>:</td><td>{c.pekerjaanPemohon}</td></tr>
          <tr><td></td><td className="py-0.5">No. KTP/ NIK</td><td>:</td><td>{c.nikPemohon}</td></tr>
          <tr><td></td><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPemohon}</td></tr>
        </tbody>
      </table>
      <p className="italic text-[8.5pt] pl-4 -mt-1 mb-1.5 font-medium">Selaku Pemohon</p>

      {/* 2. Pasangan */}
      <table className="w-full mb-1 text-[9pt]">
        <tbody>
          <tr><td className="w-4 font-bold align-top">2</td><td className="w-40 py-0.5">Nama</td><td className="w-3">:</td><td className="font-semibold">{c.namaPasangan || '...................................................'}</td></tr>
          <tr><td></td><td className="py-0.5">Tempat/ Tgl Lahir</td><td>:</td><td>{c.tempatLahirPasangan || '........'}, {c.tglLahirPasangan || '........'}</td></tr>
          <tr><td></td><td className="py-0.5">Pekerjaan</td><td>:</td><td>{c.pekerjaanPasangan}</td></tr>
          <tr><td></td><td className="py-0.5">No. KTP/ NIK</td><td>:</td><td>{c.nikPasangan || '...................................................'}</td></tr>
          <tr><td></td><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPasangan || c.alamatPemohon}</td></tr>
        </tbody>
      </table>
      <p className="italic text-[8.5pt] pl-4 -mt-1 mb-1.5 font-medium">Selaku suami/ istri *) Pemohon</p>

      <p className="font-semibold text-[9pt] mb-1">Menyatakan dengan sesungguhnya bahwa :</p>
      <div className="space-y-0.5 text-justify text-[8.5pt] leading-tight pl-2">
        <p>1. Saya memiliki gaji/upah pokok/penghasilan bersih/upah rata-rata*) per bulan sebesar <span className="font-semibold">{c.gajiPemohon}</span></p>
        <p>2. Saya dan (istri/suami*)) tidak memiliki hak kepemilikan atas rumah pada saat pengajuan pembiayaan KPR Bersubsidi.</p>
        <p>3. Saya dan (istri/suami*)) belum pernah menerima subsidi atau bantuan pembiayaan perumahan dari pemerintah terkait kredit/pembiayaan kepemilikan rumah dan pembangunan Rumah Swadaya.</p>
        <p>4. Saya membeli Rumah Umum Tapak/ Sarusun Umum dengan harga <span className="font-semibold">{c.hargaJual}</span> dari <span className="font-semibold">{c.pengembang}</span>.</p>
        <p>5. Saya dan (istri/suami*)) akan menggunakan Rumah Umum Tapak/ Sarusun Umum sebagai tempat tinggal saya dan/atau keluarga dalam kurun waktu paling lambat 1 (satu) tahun setelah serah terima rumah.</p>
        <p>6. Saya dan (istri/suami*)) tidak akan menyewakan/mengontrakkan, memperjualbelikan atau memindahtangankan dengan bentuk perbuatan hukum apapun, kecuali: penghunian telah melampaui 5 tahun (tapak)/20 tahun (sarusun), pindah tempat tinggal, meninggal dunia (pewarisan), atau untuk kepentingan bank penyalur Dana FLPP.</p>
        <p>7. Bahwa semua dokumen persyaratan yang disampaikan kepada bank penyalur Dana FLPP untuk memperoleh subsidi adalah benar dan dapat dipertanggungjawabkan keabsahannya.</p>
        <p>8. Apabila di kemudian hari pernyataan saya ini tidak benar dan/atau tidak saya penuhi, saya bersedia mengembalikan seluruh dana kemudahan dan/atau bantuan pembiayaan perumahan yang telah diperoleh melalui bank penyalur Dana FLPP dan bersedia dikenakan sanksi sesuai dengan ketentuan peraturan perundang-undangan.</p>
      </div>

      <p className="text-justify text-[8.5pt] mt-1.5 mb-1">
        Demikian Surat Pernyataan ini saya buat dengan sebenar-benarnya tanpa paksaan dari pihak manapun.
      </p>

      <div className="text-right text-[8.5pt] mb-1">
        <p>Purwakarta, .................................... {c.currentYear}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center text-[8.5pt]">
        <div>
          <p className="font-semibold">Menyetujui,</p>
          <div className="h-20" />
          <p className="font-bold underline">({c.namaPasangan || '...................................................'}*))</p>
          <p className="text-[8pt] text-slate-500">Nama Suami/Istri Pemohon</p>
        </div>
        <div>
          <p className="font-semibold">Yang Membuat Pernyataan,</p>
          <MateraiBox />
          <p className="font-bold underline">({c.namaPemohon})</p>
          <p className="text-[8pt] text-slate-500">Nama Pemohon</p>
        </div>
      </div>

      <div className="text-center text-[8.5pt] mt-1">
        <p>Mengetahui,</p>
        <p>(Pimpinan Instansi Tempat Bekerja/Kepala Desa/Lurah*))</p>
        <div className="h-8" />
        <p className="font-bold underline">( ................................................................ )</p>
        <p className="text-[8pt] text-slate-600">Nama lengkap dan stempel</p>
      </div>
      <p className="text-[7.5pt] italic text-slate-500">*) Pilih Salah Satu</p>
    </PageWrapper>
  );
};

// FORM Q - KANTOR CABANG (BJB PEMBAYARAN SBUM)
export const DocBjbFormQ: React.FC<{ data: BankKprDocData }> = ({ data }) => {
  const c = getCommons(data);
  return (
    <PageWrapper>
      <div className="text-right text-[9pt] mb-2 font-medium">
        Bandung, .................................... {c.currentYear}
      </div>
      <div className="font-bold text-[9.5pt] mb-3">
        <p className="text-xs">FORM Q - KANTOR CABANG</p>
        <p className="underline text-base mt-0.5">SURAT PERMOHONAN PEMBAYARAN SBUM</p>
      </div>

      <table className="w-full mb-3 text-[9.5pt]">
        <tbody>
          <tr><td className="w-28">Nomor</td><td className="w-3">:</td><td>............................................................</td></tr>
          <tr><td>Lampiran</td><td>:</td><td>1 (Satu) Berkas</td></tr>
        </tbody>
      </table>

      <div className="mb-3 text-[9.5pt]">
        <p className="font-semibold">Kepada Yth.</p>
        <p className="font-semibold">Pemimpin Divisi KPR & KKB</p>
        <p>Kantor Pusat bank bjb</p>
        <p>Jln. Naripan No 12-14</p>
        <p>Bandung 400111</p>
      </div>

      <p className="text-[9.5pt] mb-2">
        <span className="font-semibold">Perihal :</span> Permintaan Pembayaran Subsidi Bantuan Uang Muka Perumahan Tanggal Akad ................ sd ................ Bulan ................ Tahun {c.currentYear}.
      </p>

      <p className="text-justify text-[9.5pt] mb-2 leading-relaxed">
        Bersama ini kami mengajukan permintaan pembayaran subsidi bantuan uang muka perumahan untuk periode penerbitan/ penandatanganan Perjanjian Kredit dan/ atau akad bjb KPR Sejahtera FLPP dari pemohon sejak tanggal ____________ sampai dengan tanggal __________, dengan rincian sebagai berikut :
      </p>

      <p className="font-semibold text-[9.5pt] mb-1">Jumlah subsidi bunga kredit perumahan :</p>
      <table className="w-full border-collapse border border-black text-center text-[9pt] mb-3">
        <thead>
          <tr className="bg-slate-100 font-bold">
            <th className="border border-black p-1.5" rowSpan={2}>No</th>
            <th className="border border-black p-1.5" rowSpan={2}>Jenis KPR</th>
            <th className="border border-black p-1.5" colSpan={2}>Total KPR</th>
            <th className="border border-black p-1.5" colSpan={2}>Total SBUM Diminta</th>
          </tr>
          <tr className="bg-slate-100 font-bold">
            <th className="border border-black p-1.5">(unit)</th>
            <th className="border border-black p-1.5">(Rp.)</th>
            <th className="border border-black p-1.5">(unit)</th>
            <th className="border border-black p-1.5">(Rp.)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black p-1.5">1</td>
            <td className="border border-black p-1.5 text-left font-medium pl-2">KPR SSB Tapak</td>
            <td className="border border-black p-1.5">-</td>
            <td className="border border-black p-1.5">-</td>
            <td className="border border-black p-1.5">-</td>
            <td className="border border-black p-1.5">-</td>
          </tr>
          <tr>
            <td className="border border-black p-1.5">2</td>
            <td className="border border-black p-1.5 text-left font-medium pl-2">KPR Sejahtera Tapak</td>
            <td className="border border-black p-1.5">1</td>
            <td className="border border-black p-1.5">{c.hargaJual}</td>
            <td className="border border-black p-1.5">1</td>
            <td className="border border-black p-1.5">{c.sbumStr}</td>
          </tr>
          <tr className="font-bold bg-slate-50">
            <td className="border border-black p-1.5" colSpan={2}>Total</td>
            <td className="border border-black p-1.5">1</td>
            <td className="border border-black p-1.5">{c.hargaJual}</td>
            <td className="border border-black p-1.5">1</td>
            <td className="border border-black p-1.5">{c.sbumStr}</td>
          </tr>
        </tbody>
      </table>

      <div className="text-[9.5pt] mb-4">
        <p className="font-semibold">Lampiran terdiri dari :</p>
        <ol className="list-decimal pl-5 space-y-0.5">
          <li>Surat Pernyataan Verifikasi;</li>
          <li>Daftar Rekapitulasi Kelompok Sasaran BUM; dan</li>
          <li>Persyaratan lain jika ada.</li>
        </ol>
      </div>

      <p className="text-[9.5pt] mb-4">Demikian kami sampaikan, atas perhatiannya kami ucapkan terima kasih.</p>

      <div className="mt-4 text-[9.5pt]">
        <p className="font-semibold">PT. BANK PEMBANGUNAN DAERAH JAWA BARAT DAN BANTEN, Tbk.</p>
        <p>Kantor Cabang Purwakarta</p>
        <div className="h-16" />
        <p className="font-bold underline">( ................................................................ )</p>
      </div>

      <div className="mt-6 text-[8pt] text-slate-600">
        <p className="font-semibold">Tembusan Kepada Yth.</p>
        <p>1. Sekretaris Jendral Kementerian Pekerjaan Umum dan Perumahan Rakyat</p>
        <p>2. Direktur Jenderal Pembiayaan Perumahan</p>
      </div>
    </PageWrapper>
  );
};

// LAMPIRAN 7 BJB - KESEDIAAN PEMBAYARAN KEKURANGAN UANG MUKA
export const DocBjbLampiran7: React.FC<{ data: BankKprDocData }> = ({ data }) => {
  const c = getCommons(data);
  return (
    <PageWrapper>
      <div className="text-center font-bold mb-6">
        <p className="text-xs uppercase">LAMPIRAN 7</p>
        <p className="text-base underline uppercase mt-1">SURAT PERNYATAAN KESEDIAAN PEMBAYARAN KEKURANGAN UANG MUKA</p>
        <p className="text-xs uppercase text-slate-700">(JIKA SBUM TIDAK DIBAYARKAN OLEH SATKER KEMENPUPERA)</p>
      </div>

      <p className="mb-3">Dengan ini saya yang bertanda tangan dibawah ini :</p>

      <table className="w-full mb-4 text-[10pt]">
        <tbody>
          <tr><td className="w-48 py-1">Nama</td><td className="w-3">:</td><td className="font-semibold">{c.namaPemohon}</td></tr>
          <tr><td className="py-1 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPemohon}</td></tr>
          <tr><td className="py-1">No. KTP</td><td>:</td><td>{c.nikPemohon}</td></tr>
          <tr><td className="py-1">Pekerjaan</td><td>:</td><td>{c.pekerjaanPemohon}</td></tr>
        </tbody>
      </table>

      <p className="mb-4 text-justify leading-relaxed">
        Debitur atas Fasilitas : <span className="font-semibold">bjb KPR Sejahtera FLPP</span> dengan Nomor Perjanjian Kredit : ____________________ tanggal ______________
      </p>

      <p className="text-justify mb-8 leading-relaxed">
        Dengan ini menyatakan akan membayarkan kekurangan uang muka sejumlah <span className="font-bold">Rp. 4.000.000,- (empat juta rupiah)</span> dikarenakan tidak dibayarkannya Subsidi Bantuan Uang Muka (SBUM) dari Satker Kemenpupera maksimum 5 (lima) hari kerja sejak diberitakannya penolakan SBUM oleh Satker Kemenpupera.
      </p>

      <div className="flex justify-end mt-12 pr-12 text-center">
        <div>
          <p>Purwakarta, .................................... {c.currentYear}</p>
          <MateraiBox />
          <p className="font-bold underline">({c.namaPemohon})</p>
          <p className="text-[8.5pt] text-slate-600">Nama Debitur</p>
        </div>
      </div>
    </PageWrapper>
  );
};

// LAMPIRAN 6 BJB - SURAT KUASA PENDEBETAN SBUM
export const DocBjbLampiran6: React.FC<{ data: BankKprDocData }> = ({ data }) => {
  const c = getCommons(data);
  return (
    <PageWrapper>
      <div className="text-center font-bold mb-3">
        <p className="text-xs uppercase">LAMPIRAN 6</p>
        <p className="text-sm underline uppercase">SURAT KUASA PENDEBETAN SBUM</p>
        <p className="text-xs uppercase text-slate-700">Pemindahbukuan Pembayaran Kepada Pengembang</p>
      </div>

      <p className="text-[9.5pt] mb-1">Yang bertanda tangan dibawah ini :</p>
      <table className="w-full mb-2 text-[9pt]">
        <tbody>
          <tr><td className="w-44 py-0.5">Nama</td><td className="w-3">:</td><td className="font-semibold">{c.namaPemohon}</td></tr>
          <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPemohon}</td></tr>
          <tr><td className="py-0.5">Nomor KTP</td><td>:</td><td>{c.nikPemohon}</td></tr>
          <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{c.pekerjaanPemohon}</td></tr>
          <tr><td className="py-0.5">Debitur atas Fasilitas</td><td>:</td><td>bjb KPR Sejahtera FLPP</td></tr>
        </tbody>
      </table>
      <p className="text-[9pt] font-semibold mb-2">(Selanjutnya disebut PEMBERI KUASA)</p>

      <p className="text-[9pt] mb-1">PEMBERI KUASA adalah pemegang rekening Tabungan pada PT. Bank Pembangunan Daerah Jawa Barat dan Banten, Tbk. Sebagai berikut :</p>
      <table className="w-full mb-2 text-[9pt]">
        <tbody>
          <tr><td className="w-44 py-0.5">Nomor Rekening</td><td className="w-3">:</td><td>_____________________________________________________</td></tr>
          <tr><td className="py-0.5">Atas Nama</td><td>:</td><td className="font-semibold">{c.namaPemohon}</td></tr>
          <tr><td className="py-0.5">Kantor Cabang</td><td>:</td><td>Purwakarta</td></tr>
        </tbody>
      </table>
      <p className="text-[9pt] font-semibold mb-2">(Selanjutnya disebut REKENING PEMBERI KUASA)</p>

      <p className="text-justify text-[8.5pt] mb-2 leading-relaxed">
        Sehubung dengan Fasilitas bjb KPR Sejahtera FLPP yang diterima PEMBERI KUASA dari PT. Bank Pembangunan Daerah Jawa dan Banten, Tbk. Sesuai Perjanjian Kredit bjb KPR Sejahtera FLPP Nomor ________ tanggal ____________ , dengan ini memberi kuasa dengan hak substitusi kepada :
        <br />
        <span className="font-semibold">PT. Bank Pembangunan Daerah Jawa Barat dan Banten, Tbk.</span> Kantor Cabang Purwakarta (selanjutnya disebut <span className="font-semibold">PENERIMA KUASA</span>)
      </p>

      <p className="font-bold text-center text-[9pt] my-1">KHUSUS</p>
      <p className="text-justify text-[8.5pt] mb-2 leading-relaxed">
        Untuk memindahbukukan dana dari REKENING PEMBERI KUASA sebagai pembayaran sebagian Uang Muka (SBUM dari Pemerintah) sejumlah <span className="font-bold">Rp. 4.000.000,- (empat juta rupiah)</span>, sesuai dengan Perjanjian Kredit Nomor __________ tanggal _________ , surat kuasa ini berlaku terhitung sejak tanggal yang tercantum pada surat kuasa ini.
      </p>
      <p className="text-justify text-[8.5pt] mb-2 leading-relaxed">
        Surat Kuasa ini tidak dapat dicabut kembali dan tidak akan berakhir karena sebab-sebab yang ditentukan oleh pasal 1813, 1814 Kitab Undang-Undang Hukum Perdata Indonesia, ataupun dalam hal terjadinya perubahan pada nomor rekening dari REKENING PEMBERI KUASA, kecuali ada pencabutan tertulis dari PEMBERI KUASA (dalam hal SBUM tidak dibayarkan).
      </p>

      <div className="text-right text-[8.5pt] mb-2">
        <p>Purwakarta, .................................... {c.currentYear}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center text-[8.5pt]">
        <div>
          <p className="font-semibold">PENERIMA KUASA,</p>
          <p>PT. Bank Pembangunan Daerah Jawa Barat dan Banten, Tbk.</p>
          <div className="h-20" />
          <p className="font-bold underline">( ................................................................ )</p>
          <p className="text-[8pt] text-slate-600">Nama & Jabatan</p>
        </div>
        <div>
          <p className="font-semibold">PEMBERI KUASA,</p>
          <MateraiBox />
          <p className="font-bold underline">({c.namaPemohon})</p>
        </div>
      </div>

      <div className="text-center text-[8.5pt] mt-2">
        <p className="font-semibold">MENGETAHUI DAN MENYETUJUI</p>
        <div className="h-10" />
        <p className="font-bold underline">({c.namaPasangan || '...................................................'})</p>
        <p className="text-[8pt] text-slate-600">Nama Suami/Istri Pemohon</p>
      </div>
    </PageWrapper>
  );
};

// LAMPIRAN 3 BJB - SURAT PENGAKUAN KEKURANGAN BAYAR UANG MUKA
export const DocBjbLampiran3: React.FC<{ data: BankKprDocData }> = ({ data }) => {
  const c = getCommons(data);
  return (
    <PageWrapper>
      <div className="text-center font-bold mb-4">
        <p className="text-xs uppercase">LAMPIRAN 3</p>
        <p className="text-base underline uppercase mt-1">SURAT PENGAKUAN KEKURANGAN BAYAR UANG MUKA</p>
      </div>

      <p className="mb-2 text-[9.5pt]">Yang bertanda tangan dibawah ini :</p>
      <table className="w-full mb-3 text-[9.5pt]">
        <tbody>
          <tr><td className="w-48 py-0.5">Nama</td><td className="w-3">:</td><td className="font-semibold">{c.namaPemohon}</td></tr>
          <tr><td className="py-0.5">Tempat/ Tgl Lahir</td><td>:</td><td>{c.tempatLahirPemohon}, {c.tglLahirPemohon}</td></tr>
          <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{c.pekerjaanPemohon}</td></tr>
          <tr><td className="py-0.5">No. KTP</td><td>:</td><td>{c.nikPemohon}</td></tr>
          <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPemohon}</td></tr>
        </tbody>
      </table>

      <p className="text-justify text-[9.5pt] mb-3 leading-relaxed">
        Dengan ini menyatakan bahwa saya telah melakukan pembayaran uang muka sebesar <span className="font-semibold">{c.dpDibayar} (dua juta rupiah)</span> dan masih memiliki kekurangan bayar uang muka sebesar <span className="font-semibold">{c.sbumStr} (empat juta rupiah)</span> untuk pembelian rumah sejahtera tapak kepada:
      </p>

      <table className="w-full mb-3 text-[9.5pt]">
        <tbody>
          <tr><td className="w-56 py-0.5">Nama</td><td className="w-3">:</td><td className="font-semibold">{c.pengembang}</td></tr>
          <tr><td className="py-0.5">Alamat Rumah Yang Dibeli</td><td>:</td><td>{c.namaPerumahan} Blok {c.blokUnit}</td></tr>
          <tr><td className="py-0.5">Harga Jual Rumah</td><td>:</td><td className="font-semibold">{c.hargaJual}</td></tr>
          <tr><td className="py-0.5">Besaran Uang Muka</td><td>:</td><td>{c.dpTotal}</td></tr>
          <tr><td className="py-0.5">Bank Pelaksana</td><td>:</td><td>PT. Bank Pembangunan Daerah Jawa Barat dan Banten, Tbk. (bank bjb)</td></tr>
        </tbody>
      </table>

      <p className="text-justify text-[9.5pt] mb-4 leading-relaxed">
        Jika permohonan subsidi bantuan uang muka perumahan saya tidak disetujui, maka saya bersedia untuk membayar kekurangan uang muka pembelian rumah sejahtera tapak menggunakan dana sendiri.
      </p>

      <p className="text-[9.5pt] mb-4">Demikian kami sampaikan, atas perhatiannya kami ucapkan terima kasih.</p>

      <div className="text-right text-[9.5pt] mb-2">
        <p>Purwakarta, .................................... {c.currentYear}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center text-[9.5pt] mt-4">
        <div>
          <p className="font-semibold">Menyetujui</p>
          <p className="text-[8.5pt] text-slate-600">(Jabatan yang mewakili pengembang)</p>
          <div className="h-20 flex items-center justify-center text-[8pt] text-slate-400">
            <span>Ttd dan cap perusahaan</span>
          </div>
          <p className="font-bold underline">({c.direktur})</p>
          <p className="text-[8.5pt] text-slate-600">{c.pengembang}</p>
        </div>
        <div>
          <p className="font-semibold">Pemohon</p>
          <MateraiBox />
          <p className="font-bold underline">({c.namaPemohon})</p>
        </div>
      </div>
    </PageWrapper>
  );
};

// LAMPIRAN 2 BJB - PERMOHONAN SUBSIDI BANTUAN UANG MUKA
export const DocBjbLampiran2: React.FC<{ data: BankKprDocData }> = ({ data }) => {
  const c = getCommons(data);
  return (
    <PageWrapper>
      <div className="text-center font-bold mb-4">
        <p className="text-xs uppercase">LAMPIRAN 2</p>
        <p className="text-base underline uppercase mt-1">SURAT PERMOHONAN SUBSIDI BANTUAN UANG MUKA</p>
      </div>

      <div className="mb-3 text-[9.5pt]">
        <p className="font-semibold">Kepada Yth.</p>
        <p className="font-semibold">Kepala Satuan Kerja Direktorat Jenderal Pembiayaan Perumahan</p>
        <p>Kementerian Pekerjaan Umum dan Perumahan Rakyat</p>
        <p>Jalan Raden Patah 1 No. 1 Lantai 2 Wing 3</p>
        <p>Kebayoran Baru, Jakarta Selatan 12110</p>
      </div>

      <p className="text-[9.5pt] mb-2 font-semibold">Perihal : Permohonan Subsidi Bantuan Uang Muka</p>

      <p className="text-[9.5pt] mb-2">Saya yang bertanda tangan dibawah ini :</p>
      <table className="w-full mb-3 text-[9.5pt]">
        <tbody>
          <tr><td className="w-48 py-0.5">Nama</td><td className="w-3">:</td><td className="font-semibold">{c.namaPemohon}</td></tr>
          <tr><td className="py-0.5">Tempat/ Tgl Lahir</td><td>:</td><td>{c.tempatLahirPemohon}, {c.tglLahirPemohon}</td></tr>
          <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{c.pekerjaanPemohon}</td></tr>
          <tr><td className="py-0.5">No. KTP</td><td>:</td><td>{c.nikPemohon}</td></tr>
          <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPemohon}</td></tr>
        </tbody>
      </table>

      <p className="text-justify text-[9.5pt] mb-2">
        Mengajukan permohonan subsidi bantuan uang muka untuk pembelian rumah sejahtera tapak dengan keterangan sebagai berikut:
      </p>

      <table className="w-full mb-3 text-[9.5pt]">
        <tbody>
          <tr><td className="w-56 py-0.5">Nama Pengembang</td><td className="w-3">:</td><td className="font-semibold">{c.pengembang}</td></tr>
          <tr><td className="py-0.5">Alamat Rumah Yang Dibeli</td><td>:</td><td>{c.namaPerumahan} Blok {c.blokUnit}</td></tr>
          <tr><td className="py-0.5">Harga Jual Rumah</td><td>:</td><td className="font-semibold">{c.hargaJual}</td></tr>
          <tr><td className="py-0.5">Besaran Uang Muka</td><td>:</td><td>{c.dpTotal}</td></tr>
          <tr><td className="py-0.5">Bank Pelaksana</td><td>:</td><td>PT. Bank Pembangunan Daerah Jawa Barat dan Banten, Tbk. (bank bjb)</td></tr>
        </tbody>
      </table>

      <p className="text-justify text-[9.5pt] mb-3 leading-relaxed">
        Sebagai pertimbangan, bersama ini kami lampirkan dokumen fotokopi surat pengakuan kekurangan bayar uang muka pembelian rumah sejahtera tapak yang disetujui oleh <span className="font-semibold">{c.direktur}</span> *)
      </p>

      <p className="text-[9.5pt] mb-6">Demikian kami sampaikan, atas perhatiannya kami ucapkan terima kasih.</p>

      <div className="flex justify-end pr-12 text-center text-[9.5pt]">
        <div>
          <p>Purwakarta, .................................... {c.currentYear}</p>
          <p className="mt-1 font-semibold">Pemohon,</p>
          <div className="h-24" />
          <p className="font-bold underline">({c.namaPemohon})</p>
        </div>
      </div>
      <p className="text-[8pt] italic text-slate-500 mt-6">*) diisi dengan nama direktur atau yang mewakili pengembang</p>
    </PageWrapper>
  );
};

// SURAT PERNYATAAN PEMBATALAN DEBITUR FLPP
export const DocBjbPembatalanFlpp: React.FC<{ data: BankKprDocData }> = ({ data }) => {
  const c = getCommons(data);
  return (
    <PageWrapper>
      <div className="text-center font-bold mb-6">
        <p className="text-base underline uppercase">SURAT PERNYATAAN PEMBATALAN DEBITUR FLPP</p>
      </div>

      <p className="mb-3">Saya yang bertanda tangan dibawah ini :</p>
      <table className="w-full mb-4 text-[10pt]">
        <tbody>
          <tr><td className="w-48 py-1">Nama</td><td className="w-3">:</td><td className="font-semibold">{c.namaPemohon}</td></tr>
          <tr><td className="py-1">Tempat/ Tgl Lahir</td><td>:</td><td>{c.tempatLahirPemohon}, {c.tglLahirPemohon}</td></tr>
          <tr><td className="py-1">Pekerjaan</td><td>:</td><td>{c.pekerjaanPemohon}</td></tr>
          <tr><td className="py-1">No. KTP</td><td>:</td><td>{c.nikPemohon}</td></tr>
          <tr><td className="py-1 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPemohon}</td></tr>
        </tbody>
      </table>

      <p className="text-justify mb-4 leading-relaxed">
        Dengan ini menyatakan dengan benar bahwa saya membatalkan pengambilan rumah subsidi di Perumahan <span className="font-semibold">{c.namaPerumahan}</span> yang berlokasi di <span className="font-semibold">{c.alamatLokasi}</span> dikarenakan ...................................................................................................................................
      </p>

      <p className="text-justify mb-8 leading-relaxed">
        Apabila dikemudian hari terbukti bahwa surat pernyataan yang saya buat ini tidak benar, maka saya bertanggung jawab sepenuhnya dan sanggup diproses sesuai ketentuan yang berlaku.
      </p>

      <p className="text-justify mb-6">
        Demikian surat pernyataan ini saya buat untuk diketahui dan dipergunakan sebagaimana mestinya.
      </p>

      <div className="text-right mb-4">
        <p>Purwakarta, .................................... {c.currentYear}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center mt-4">
        <div>
          <p>Mengetahui,</p>
          <p className="font-semibold">PT BPD Jawa Barat dan Banten, Tbk.</p>
          <div className="h-24" />
          <p className="font-bold underline">( .................................................. )</p>
          <p className="text-[8.5pt] text-slate-600">(Nama Pejabat) (Jabatan)</p>
        </div>
        <div>
          <p className="font-semibold">Yang membuat pernyataan,</p>
          <MateraiBox />
          <p className="font-bold underline">({c.namaPemohon})</p>
        </div>
      </div>
    </PageWrapper>
  );
};

// SURAT PERNYATAAN CALON DEBITUR MENGENAI URUTAN FASILITAS KREDIT (LTV BJB)
export const DocBjbUrutanFasilitasKredit: React.FC<{ data: BankKprDocData }> = ({ data }) => {
  const c = getCommons(data);
  return (
    <PageWrapper>
      <div className="text-center font-bold mb-2">
        <p className="text-xs uppercase">SURAT PERNYATAAN CALON DEBITUR</p>
        <p className="text-sm underline uppercase">MENGENAI URUTAN FASILITAS KREDIT</p>
      </div>

      <p className="text-[9pt] mb-1">Kami yang bertandatangan di bawah ini :</p>
      <table className="w-full mb-1 text-[8.5pt]">
        <tbody>
          <tr><td className="w-44 py-0.5 font-semibold">Nama Calon Debitur</td><td className="w-3">:</td><td className="font-semibold">{c.namaPemohon}</td></tr>
          <tr><td className="py-0.5">Tempat/ Tgl Lahir</td><td>:</td><td>{c.tempatLahirPemohon}, {c.tglLahirPemohon}</td></tr>
          <tr><td className="py-0.5">No. KTP</td><td>:</td><td>{c.nikPemohon}</td></tr>
          <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPemohon}</td></tr>
          <tr><td className="py-0.5 font-semibold pt-1">Nama Suami/ Istri</td><td>:</td><td className="font-semibold pt-1">{c.namaPasangan || '...................................................'}</td></tr>
          <tr><td className="py-0.5">Tempat/ Tgl Lahir</td><td>:</td><td>{c.tempatLahirPasangan || '........'}, {c.tglLahirPasangan || '........'}</td></tr>
          <tr><td className="py-0.5">No. KTP</td><td>:</td><td>{c.nikPasangan || '...................................................'}</td></tr>
          <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPasangan || c.alamatPemohon}</td></tr>
        </tbody>
      </table>

      <p className="text-[8.5pt] mb-1">
        Adalah suami-istri berdasarkan Buku Nikah (atau yang disamakan dengan itu) Nomor : ________________ tanggal ___________
      </p>
      <p className="text-[8.5pt] font-semibold mb-0.5">Dengan ini menyatakan bahwa :</p>
      <ol className="list-decimal pl-4 space-y-0.5 text-justify text-[8pt] leading-tight">
        <li>Telah mengajukan permohonan fasilitas bjb KPR sebagaimana tercantum pada Formulir Aplikasi bjb KPR tanggal _________________</li>
        <li>Telah membaca dan memahami seluruh persyaratan dan ketentuan yang berlaku dalam hal pengajuan fasilitas kredit bjb KPR pada PT. Bank Pembangunan Daerah Jawa Barat dan Banten, Tbk. (bank bjb);</li>
        <li>Saat ini sedang menikmati fasilitas kredit atau pembiayaan Konsumtif beragun Properti sebagai berikut :</li>
      </ol>

      <table className="w-full border-collapse border border-black text-center text-[7.5pt] my-1">
        <thead>
          <tr className="bg-slate-100 font-bold">
            <th className="border border-black p-0.5 w-6">No</th>
            <th className="border border-black p-0.5">Atas Nama*)</th>
            <th className="border border-black p-0.5">Jenis Kredit</th>
            <th className="border border-black p-0.5">Maksimum Kredit**)</th>
            <th className="border border-black p-0.5">Jangka Waktu</th>
            <th className="border border-black p-0.5">Angsuran Perbulan</th>
            <th className="border border-black p-0.5">Nama Bank</th>
          </tr>
        </thead>
        <tbody>
          <tr><td className="border border-black p-1">1</td><td className="border border-black p-1">-</td><td className="border border-black p-1">-</td><td className="border border-black p-1">-</td><td className="border border-black p-1">-</td><td className="border border-black p-1">-</td><td className="border border-black p-1">-</td></tr>
        </tbody>
      </table>

      <div className="space-y-0.5 text-justify text-[8pt] leading-tight">
        <p>4. Sedang mengajukan permohonan fasilitas kredit/pembiayaan beragun properti pada Bank ...................................... dengan pengajuan kredit sebesar Rp. ......................................</p>
        <p>5. Bersedia melaksanakan langkah-langkah yang ditetapkan oleh bank bjb terkait LTV Bank Indonesia.</p>
        <p>6. Sehubungan dengan hal tersebut, saya bersedia menandatangani Perjanjian Kredit, menyetujui pencairan kredit, dan melakukan pembayaran angsuran bjb KPR.</p>
      </div>

      <p className="text-justify text-[8pt] mt-1 mb-1">
        Demikian Surat Pernyataan ini dibuat dengan sebenarnya sesuai dengan keadaan yang sebenarnya, tanpa paksaan atau tekanan dari pihak manapun.
      </p>

      <div className="text-right text-[8pt] mb-1">
        <p>Purwakarta, .................................... {c.currentYear}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center text-[8pt]">
        <div>
          <p className="font-semibold">Yang Membuat Pernyataan,</p>
          <MateraiBox />
          <p className="font-bold underline">({c.namaPemohon})</p>
        </div>
        <div>
          <p className="font-semibold">Suami/ Istri Pemohon,</p>
          <div className="h-20" />
          <p className="font-bold underline">({c.namaPasangan || '...................................................'})</p>
        </div>
      </div>
    </PageWrapper>
  );
};

// CHECKLIST DOKUMEN BJB KPR
export const DocBjbChecklist: React.FC<{ data: BankKprDocData; isKomersil?: boolean }> = ({ isKomersil = false }) => {
  return (
    <PageWrapper>
      <div className="text-center font-bold mb-4">
        <p className="text-base underline uppercase">CHECKLIST DOKUMEN bjb KPR {isKomersil ? 'KOMERSIL' : 'Sejahtera FLPP'}</p>
        <p className="text-xs uppercase text-slate-700">{isKomersil ? 'Dokumen Pengajuan KPR Non-Subsidi' : 'Dokumen FLPP dan Dokumen SBUM'}</p>
      </div>

      <table className="w-full border-collapse border border-black text-[9pt] mb-6">
        <thead>
          <tr className="bg-slate-100 font-bold text-center">
            <th className="border border-black p-1.5 w-8">No</th>
            <th className="border border-black p-1.5">Dokumen</th>
            <th className="border border-black p-1.5 w-14">Ada</th>
            <th className="border border-black p-1.5 w-16">Tidak Ada</th>
            <th className="border border-black p-1.5 w-64">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          <tr className="font-semibold bg-slate-50"><td className="border border-black p-1.5 text-center">1</td><td className="border border-black p-1.5" colSpan={4}>Dokumen Pengajuan {isKomersil ? 'Komersil' : 'FLPP'}</td></tr>
          <tr><td className="border border-black p-1.5 text-center">a</td><td className="border border-black p-1.5">Format E : Surat Pernyataan Penghasilan</td><td className="border border-black p-1.5 text-center font-bold">v</td><td className="border border-black p-1.5"></td><td className="border border-black p-1.5">Memakai kop surat perusahaan</td></tr>
          <tr><td className="border border-black p-1.5 text-center">b</td><td className="border border-black p-1.5">Format F : Surat Pernyataan Tidak Memiliki Rumah (debitur & pasangan)</td><td className="border border-black p-1.5 text-center font-bold">v</td><td className="border border-black p-1.5"></td><td className="border border-black p-1.5">Memakai kop surat kelurahan</td></tr>
          <tr><td className="border border-black p-1.5 text-center">c</td><td className="border border-black p-1.5">Format G : Surat Pernyataan Pemohon KPR Sejahtera</td><td className="border border-black p-1.5 text-center font-bold">v</td><td className="border border-black p-1.5"></td><td className="border border-black p-1.5">Di ttd pejabat instansi / kelurahan</td></tr>
          <tr><td className="border border-black p-1.5 text-center">d</td><td className="border border-black p-1.5">Format H : Berita Acara Serah Terima Rumah Umum Tapak</td><td className="border border-black p-1.5 text-center font-bold">v</td><td className="border border-black p-1.5"></td><td className="border border-black p-1.5">Kop Pengembang, ttd & stempel</td></tr>
          <tr><td className="border border-black p-1.5 text-center">e</td><td className="border border-black p-1.5">Lampiran Blok Unit yang dibiayai</td><td className="border border-black p-1.5 text-center font-bold">v</td><td className="border border-black p-1.5"></td><td className="border border-black p-1.5">Kop pengembang, materai & stempel</td></tr>
          <tr><td className="border border-black p-1.5 text-center">f</td><td className="border border-black p-1.5">Surat Pernyataan Tidak Memiliki Pekerjaan (Pasangan)</td><td className="border border-black p-1.5 text-center font-bold">v</td><td className="border border-black p-1.5"></td><td className="border border-black p-1.5">Memakai kop kelurahan</td></tr>
          <tr><td className="border border-black p-1.5 text-center">g</td><td className="border border-black p-1.5">Surat Pernyataan Pembatalan Debitur FLPP</td><td className="border border-black p-1.5 text-center font-bold">v</td><td className="border border-black p-1.5"></td><td className="border border-black p-1.5">Format bjb</td></tr>

          <tr className="font-semibold bg-slate-50"><td className="border border-black p-1.5 text-center">2</td><td className="border border-black p-1.5" colSpan={4}>Dokumen Lainnya</td></tr>
          <tr><td className="border border-black p-1.5 text-center">a</td><td className="border border-black p-1.5">Bukti telah membayar uang muka</td><td className="border border-black p-1.5 text-center font-bold">v</td><td className="border border-black p-1.5"></td><td className="border border-black p-1.5">Bukti setor/pinbuk ke rek Pengembang</td></tr>
          <tr><td className="border border-black p-1.5 text-center">b</td><td className="border border-black p-1.5">Bukti dan Dokumentasi OTS</td><td className="border border-black p-1.5 text-center font-bold">v</td><td className="border border-black p-1.5"></td><td className="border border-black p-1.5">Bukti kunjungan dan foto OTS</td></tr>
          <tr><td className="border border-black p-1.5 text-center">c</td><td className="border border-black p-1.5">Surat Pernyataan Urutan Fasilitas Kredit (LTV)</td><td className="border border-black p-1.5 text-center font-bold">v</td><td className="border border-black p-1.5"></td><td className="border border-black p-1.5">Ditandatangani debitur & pasangan</td></tr>

          {!isKomersil && (
            <>
              <tr className="font-semibold bg-slate-50"><td className="border border-black p-1.5 text-center">3</td><td className="border border-black p-1.5" colSpan={4}>Dokumen Pengajuan SBUM</td></tr>
              <tr><td className="border border-black p-1.5 text-center">a</td><td className="border border-black p-1.5">Lampiran 2 : Surat Permohonan Subsidi Bantuan Uang Muka</td><td className="border border-black p-1.5 text-center font-bold">v</td><td className="border border-black p-1.5"></td><td className="border border-black p-1.5">Ditujukan ke Ditjen KemenPUPR</td></tr>
              <tr><td className="border border-black p-1.5 text-center">b</td><td className="border border-black p-1.5">Lampiran 3 : Surat Pengakuan Kekurangan Bayar Uang Muka</td><td className="border border-black p-1.5 text-center font-bold">v</td><td className="border border-black p-1.5"></td><td className="border border-black p-1.5">Di ttd dan stempel Pengembang</td></tr>
              <tr><td className="border border-black p-1.5 text-center">c</td><td className="border border-black p-1.5">Lampiran 6 : Surat Kuasa Pendebetan SBUM</td><td className="border border-black p-1.5 text-center font-bold">v</td><td className="border border-black p-1.5"></td><td className="border border-black p-1.5">Di ttd oleh Pemimpin Cabang & Debitur</td></tr>
              <tr><td className="border border-black p-1.5 text-center">d</td><td className="border border-black p-1.5">Lampiran 7 : Surat Pernyataan Kesediaan Pembayaran Kekurangan UM</td><td className="border border-black p-1.5 text-center font-bold">v</td><td className="border border-black p-1.5"></td><td className="border border-black p-1.5">Materai 10.000</td></tr>
              <tr><td className="border border-black p-1.5 text-center">e</td><td className="border border-black p-1.5">Form Q : Surat Permohonan Pembayaran SBUM</td><td className="border border-black p-1.5 text-center font-bold">v</td><td className="border border-black p-1.5"></td><td className="border border-black p-1.5">Dari Cabang ke Divisi KPR Pusat</td></tr>
            </>
          )}
        </tbody>
      </table>

      <div className="grid grid-cols-2 gap-4 text-center text-[9pt] mt-8">
        <div>
          <p>Petugas Verifikasi KPR,</p>
          <div className="h-20" />
          <p className="font-bold underline">( ................................................................ )</p>
        </div>
        <div>
          <p>Pemimpin Cabang / Manager,</p>
          <div className="h-20" />
          <p className="font-bold underline">( ................................................................ )</p>
        </div>
      </div>
    </PageWrapper>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. DOKUMEN KHUSUS BANK BRI (BRI UPDATE)
// ─────────────────────────────────────────────────────────────────────────────

// SURAT PERNYATAAN PEMOHON KPR BERSUBSIDI (KHUSUS BANK BRI)
export const DocBriPernyataanPemohon: React.FC<{ data: BankKprDocData }> = ({ data }) => {
  const c = getCommons(data);
  return (
    <PageWrapper>
      <div className="text-center font-bold mb-3">
        <p className="text-sm underline uppercase">SURAT PERNYATAAN PEMOHON KPR BERSUBSIDI</p>
        <p className="text-xs uppercase text-slate-700">(BANK BRI)</p>
      </div>

      <p className="mb-1 text-[9pt]">Yang bertanda-tangan di bawah ini :</p>
      <table className="w-full mb-1 text-[9pt]">
        <tbody>
          <tr><td className="w-44 py-0.5">Nama Lengkap</td><td className="w-3">:</td><td className="font-semibold">{c.namaPemohon}</td></tr>
          <tr><td className="py-0.5">No KTP</td><td>:</td><td>{c.nikPemohon}</td></tr>
          <tr><td className="py-0.5">Tempat/ Tgl lahir</td><td>:</td><td>{c.tempatLahirPemohon}, {c.tglLahirPemohon}</td></tr>
          <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{c.pekerjaanPemohon}</td></tr>
          <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPemohon}</td></tr>
        </tbody>
      </table>
      <p className="italic text-[8.5pt] pl-4 -mt-1 mb-1.5 font-medium">Selaku pemohon.</p>

      <table className="w-full mb-1 text-[9pt]">
        <tbody>
          <tr><td className="w-44 py-0.5">Nama Lengkap</td><td className="w-3">:</td><td className="font-semibold">{c.namaPasangan || '...................................................'}</td></tr>
          <tr><td className="py-0.5">No KTP</td><td>:</td><td>{c.nikPasangan || '...................................................'}</td></tr>
          <tr><td className="py-0.5">Tempat/ Tgl lahir</td><td>:</td><td>{c.tempatLahirPasangan || '........'}, {c.tglLahirPasangan || '........'}</td></tr>
          <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{c.pekerjaanPasangan}</td></tr>
          <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPasangan || c.alamatPemohon}</td></tr>
        </tbody>
      </table>
      <p className="italic text-[8.5pt] pl-4 -mt-1 mb-1.5 font-medium">Selaku suami/istri pemohon.</p>

      <p className="font-semibold text-[9pt] mb-1">Menyatakan dengan sesungguhnya bahwa :</p>
      <div className="space-y-0.5 text-justify text-[8.5pt] leading-tight pl-2">
        <p>1. Saya selaku pemohon memiliki gaji/upah pokok/penghasil bersih/upah rata-rata*) perbulan sebesar <span className="font-semibold">{c.gajiPemohon}</span></p>
        <p>2. Saya dan istri/suami*) tidak memiliki hak kepemilikan atas rumah pada saat pengajuan pembiayaan KPR Bersubsidi.</p>
        <p>3. Saya dan istri/suami*) belum pernah menerima subsidi atau bantuan pembiayaan perumahan dari pemerintah terkait kredit/pembiayaan kepemilikan rumah dan/atau pembangunan rumah swadaya.</p>
        <p>4. Saya membeli Rumah Umum Tapak/Sarusun Umum dengan harga <span className="font-semibold">{c.hargaJual}</span> dari pengembang <span className="font-semibold">{c.pengembang}</span>.</p>
        <p>5. Saya dan istri/suami*) akan menggunakan Rumah Umum Tapak/Sarusun Umum sebagai tempat tinggal saya dan/atau keluarga dalam kurun waktu paling lambat 1 (satu) tahun setelah terima rumah.</p>
        <p>6. Saya dan istri/suami*) tidak akan menyewakan/mengontrakkan, memperjual-belikan atau memindahtangankan dengan bentuk perbuatan hukum apapun, kecuali : penghunian telah melampaui 5 tahun (tapak)/20 tahun (sarusun), pindah tempat tinggal, meninggal dunia (pewarisan), atau <span className="font-bold underline">Untuk kepentingan Bank BRI dalam rangka penyelesaian kredit atau pembiayaan bermasalah.</span></p>
        <p>7. Bahwa semua dokumen persyaratan yang disampaikan kepada Bank Pelaksana untuk memperoleh fasilitas subsidi adalah benar dan dapat dipertanggungjawabkan keabsahannya baik secara formil maupun materil.</p>
        <p>8. Apabila di kemudian hari pernyataan saya tidak benar dan/atau tidak saya penuhi, saya bersedia mengembalikan seluruh subsidi yang telah saya terima dari pemerintah dan bersedia dikenakan sanksi sesuai dengan ketentuan peraturan perundang-undangan.</p>
      </div>

      <p className="text-justify text-[8.5pt] mt-1.5 mb-1">
        Demikian surat pernyataan ini saya buat dengan sebenar-benarnya tanpa paksaan dari pihak manapun.
      </p>

      <div className="text-right text-[8.5pt] mb-1">
        <p>Purwakarta, .................................... {c.currentYear}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center text-[8.5pt]">
        <div>
          <p className="font-semibold">Menyetujui,</p>
          <div className="h-20" />
          <p className="font-bold underline">({c.namaPasangan || '...................................................'})</p>
          <p className="text-[8pt] text-slate-500">Nama Suami/Istri Pemohon</p>
        </div>
        <div>
          <p className="font-semibold">Yang membuat pernyataan,</p>
          <MateraiBox />
          <p className="font-bold underline">({c.namaPemohon})</p>
          <p className="text-[8pt] text-slate-500">Nama Pemohon</p>
        </div>
      </div>

      <div className="text-center text-[8.5pt] mt-1">
        <p>Mengetahui,</p>
        <p>Pimpinan Tempat Bekerja/ Kepala Desa/Lurah* ......................................</p>
        <div className="h-10" />
        <p className="font-bold underline">( ................................................................ )</p>
      </div>
      <p className="text-[7.5pt] italic text-slate-500">*) Coret salah satu yang tidak perlu</p>
    </PageWrapper>
  );
};

// SURAT PERNYATAAN STATUS KEPEMILIKAN RUMAH (BRI)
export const DocBriStatusKepemilikanRumah: React.FC<{ data: BankKprDocData }> = ({ data }) => {
  const c = getCommons(data);
  return (
    <PageWrapper>
      <div className="text-center font-bold mb-6">
        <p className="text-base underline uppercase">SURAT PERNYATAAN STATUS KEPEMILIKAN RUMAH</p>
      </div>

      <p className="mb-3">Saya/kami yang bertandatangan di bawah ini :</p>

      <table className="w-full border-collapse border border-black text-[9.5pt] mb-6">
        <thead>
          <tr className="bg-slate-100 font-bold text-center">
            <th className="border border-black p-2.5 w-52">Keterangan</th>
            <th className="border border-black p-2.5">Pemohon Utama</th>
            <th className="border border-black p-2.5">Pemohon Pendamping (Pasangan)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black p-2 font-medium">Nama</td>
            <td className="border border-black p-2 font-bold">{c.namaPemohon}</td>
            <td className="border border-black p-2">{c.namaPasangan || '-'}</td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-medium">No KTP</td>
            <td className="border border-black p-2">{c.nikPemohon}</td>
            <td className="border border-black p-2">{c.nikPasangan || '-'}</td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-medium">Tempat/Tanggal Lahir</td>
            <td className="border border-black p-2">{c.tempatLahirPemohon}, {c.tglLahirPemohon}</td>
            <td className="border border-black p-2">{c.tempatLahirPasangan ? `${c.tempatLahirPasangan}, ${c.tglLahirPasangan}` : '-'}</td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-medium">Pekerjaan</td>
            <td className="border border-black p-2">{c.pekerjaanPemohon}</td>
            <td className="border border-black p-2">{c.pekerjaanPasangan}</td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-medium">Alamat</td>
            <td className="border border-black p-2">{c.alamatPemohon}</td>
            <td className="border border-black p-2">{c.alamatPasangan || c.alamatPemohon}</td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-medium">Nomor Telepon</td>
            <td className="border border-black p-2">{c.noHpPemohon}</td>
            <td className="border border-black p-2">-</td>
          </tr>
        </tbody>
      </table>

      <p className="font-semibold mb-2">Dengan ini menyatakan bahwa kami, secara sendiri maupun Bersama-sama :</p>
      <ol className="list-disc pl-6 space-y-2 text-justify mb-6 leading-relaxed">
        <li>Tidak memiliki hak kepemilikan secara hukum atas Rumah Tapak Umum atau Sarusun;</li>
        <li>Hanya memiliki Rumah satu-satunya pada Alamat tersebut di atas dengan kondisi tidak layak huni; atau</li>
        <li>Memiliki tanah dengan alas hak yang sah dan tidak dalam sengketa untuk Pembangunan Rumah Swadaya.</li>
      </ol>

      <p className="text-justify mb-8">
        Demikian surat pernyataan ini dibuat dengan sebenar-benarnya.
      </p>

      <div className="flex justify-end pr-12 text-center">
        <div>
          <p>Purwakarta, .................................... {c.currentYear}</p>
          <p className="font-semibold mt-1">Pemohon,</p>
          <div className="h-24" />
          <p className="font-bold underline">({c.namaPemohon})</p>
        </div>
      </div>
    </PageWrapper>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. DOKUMEN KHUSUS BANK BTN (BTN UPDATE 2026)
// ─────────────────────────────────────────────────────────────────────────────

// LAMPIRAN III BTN - PERSETUJUAN PENYALURAN KPR SEJAHTERA FLPP TA 2026
export const DocBtnLampiran3: React.FC<{ data: BankKprDocData }> = ({ data }) => {
  const c = getCommons(data);
  return (
    <PageWrapper>
      <div className="text-center font-bold mb-3">
        <p className="text-xs uppercase tracking-wider">Lampiran III</p>
        <p className="text-base underline uppercase">SURAT PERNYATAAN PERSETUJUAN</p>
        <p className="text-base underline uppercase">PENYALURAN KPR SEJAHTERA FLPP TA 2026</p>
      </div>

      <p className="text-[9.5pt] mb-1">Yang bertanda tangan di bawah ini:</p>
      <table className="w-full mb-1 text-[9pt]">
        <tbody>
          <tr><td className="w-44 py-0.5">Nama Lengkap</td><td className="w-3">:</td><td className="font-semibold">{c.namaPemohon}</td></tr>
          <tr><td className="py-0.5">No. KTP</td><td>:</td><td>{c.nikPemohon}</td></tr>
          <tr><td className="py-0.5">Tempat, Tanggal Lahir</td><td>:</td><td>{c.tempatLahirPemohon}, {c.tglLahirPemohon}</td></tr>
          <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{c.pekerjaanPemohon}</td></tr>
          <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPemohon}</td></tr>
        </tbody>
      </table>
      <p className="italic text-[8.5pt] pl-4 -mt-1 mb-1.5 font-medium">Selaku pemohon.</p>

      <table className="w-full mb-1 text-[9pt]">
        <tbody>
          <tr><td className="w-44 py-0.5">Nama Lengkap</td><td className="w-3">:</td><td className="font-semibold">{c.namaPasangan || '...................................................'}</td></tr>
          <tr><td className="py-0.5">No. KTP</td><td>:</td><td>{c.nikPasangan || '...................................................'}</td></tr>
          <tr><td className="py-0.5">Tempat, Tanggal Lahir</td><td>:</td><td>{c.tempatLahirPasangan || '........'}, {c.tglLahirPasangan || '........'}</td></tr>
          <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{c.pekerjaanPasangan}</td></tr>
          <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPasangan || c.alamatPemohon}</td></tr>
        </tbody>
      </table>
      <p className="italic text-[8.5pt] pl-4 -mt-1 mb-1.5 font-medium">Selaku istri/suami* pemohon.</p>

      <p className="text-justify text-[9pt] mb-2 leading-relaxed">
        Menyatakan dengan sesungguhnya bahwa sehubungan dengan kerja sama penyaluran Subsidi Bantuan Uang Muka Perumahan (SBUM) Tahun 2026 masih dalam proses kajian internal Kementerian PUPR, maka atas fasilitas Kredit Pemilikan Rumah (KPR) Sejahtera FLPP yang Saya dan istri/suami* ajukan maka Saya dan istri/suami*:
      </p>

      <ol className="list-decimal pl-4 space-y-1.5 text-justify text-[9pt] leading-snug mb-3">
        <li>
          Mengetahui dan menyetujui bahwa penyaluran KPR Sejahtera FLPP TA 2026 dimaksud atas pembelian rumah umum tapak pada proyek <span className="font-semibold">{c.namaPerumahan} Blok/No {c.blokUnit}</span> yang dikembangkan oleh <span className="font-semibold">{c.pengembang}</span> dengan fasilitas SBUM yang akan dibayarkan apabila telah dapat ditagihkan dan sesuai dengan ketentuan pada PKS SBUM TA 2025.
        </li>
        <li>
          Bersedia dilakukan pemblokiran dana sebesar <span className="font-bold">Rp. 4.000.000,-/Rp. 10.000.000,- *)</span> dan bersedia untuk dilakukan pemindahbukuan atas dana tersebut ke Rekening Developer dengan Nomor Rekening: <span className="font-bold">{c.rekBtnDeveloper}</span> atas nama <span className="font-bold">{c.pengembang}</span> sebagai pengganti Dana SBUM apabila fasilitas SBUM tidak dapat ditagihkan kepada Satker PUPR.
        </li>
      </ol>

      <p className="text-justify text-[9pt] mb-3 leading-relaxed">
        Demikian surat pernyataan ini saya buat dengan sebenarnya tanpa paksaan dari pihak manapun dan apabila di kemudian hari pernyataan saya ini tidak benar, saya bersedia mengembalikan seluruh subsidi yang saya terima.
      </p>

      <div className="text-right text-[9pt] mb-1">
        <p>Purwakarta, .................................... {c.currentYear}</p>
        <p className="text-[8pt] text-slate-500">Kota/Kabupaten, tanggal bulan tahun</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center text-[9pt]">
        <div>
          <p className="font-semibold">Menyetujui,</p>
          <div className="h-20" />
          <p className="font-bold underline">({c.namaPasangan || '...................................................'})</p>
          <p className="text-[8pt] text-slate-500">Nama Lengkap Suami/Istri*</p>
        </div>
        <div>
          <p className="font-semibold">Yang Membuat Pernyataan,</p>
          <MateraiBox />
          <p className="font-bold underline">({c.namaPemohon})</p>
          <p className="text-[8pt] text-slate-500">Nama Lengkap Pemohon</p>
        </div>
      </div>

      <div className="text-center text-[9pt] mt-2">
        <p>Mengetahui,</p>
        <p className="font-semibold">Pengembang {c.pengembang}</p>
        <div className="h-10" />
        <p className="font-bold underline">({c.direktur})</p>
        <p className="text-[8pt] text-slate-600">Nama Lengkap, Jabatan dan Stempel</p>
      </div>
      <p className="text-[8pt] italic text-slate-500">*) coret salah yang tidak perlu</p>
    </PageWrapper>
  );
};

// LAMPIRAN IV BTN - SURAT PERNYATAAN DEVELOPER
export const DocBtnLampiran4: React.FC<{ data: BankKprDocData }> = ({ data }) => {
  const c = getCommons(data);
  return (
    <PageWrapper>
      <div className="text-center font-bold mb-4">
        <p className="text-xs uppercase">Lampiran IV</p>
        <p className="text-base underline uppercase mt-1">SURAT PERNYATAAN DEVELOPER</p>
      </div>

      <p className="mb-2 text-[10pt]">Yang bertanda tangan di bawah ini:</p>
      <table className="w-full mb-3 text-[10pt]">
        <tbody>
          <tr><td className="w-44 py-1">Nama Lengkap</td><td className="w-3">:</td><td className="font-semibold">{c.direktur}</td></tr>
          <tr><td className="py-1">No. KTP</td><td>:</td><td>3214120810690001</td></tr>
          <tr><td className="py-1">Jabatan</td><td>:</td><td className="font-semibold">DIREKTUR UTAMA</td></tr>
          <tr><td className="py-1">Nama Developer</td><td>:</td><td className="font-semibold">{c.pengembang}</td></tr>
          <tr><td className="py-1 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">KP. MELONG RT/RW. 024/005 KEL/DESA. JAMBELAER KEC. DAWUAN KAB. SUBANG</td></tr>
        </tbody>
      </table>

      <p className="font-semibold text-[10pt] mb-2">Dengan ini menyatakan bahwa debitur:</p>
      <table className="w-full mb-4 text-[10pt]">
        <tbody>
          <tr><td className="w-44 py-1">Nama Lengkap</td><td className="w-3">:</td><td className="font-semibold">{c.namaPemohon}</td></tr>
          <tr><td className="py-1">No. KTP</td><td>:</td><td>{c.nikPemohon}</td></tr>
          <tr><td className="py-1">Alamat Perumahan</td><td>:</td><td className="font-semibold">{c.namaPerumahan} Blok ({c.blokUnit})</td></tr>
        </tbody>
      </table>

      <p className="text-justify text-[10pt] mb-4 leading-relaxed">
        Melaksanakan akad kredit di Bank BTN dengan kondisi saat ini fasilitas SBUM akan dibayarkan apabila telah dapat ditagihkan dan sesuai dengan ketentuan pada PKS SBUM TA 2025. Sehubungan dengan hal tersebut kami menyatakan tidak akan mengaitkan pembayaran SBUM debitur dimaksud kepada Bank BTN.
      </p>

      <p className="text-justify text-[10pt] mb-8 leading-relaxed">
        Demikian surat pernyataan ini dibuat dengan sebenar-benarnya tanpa paksaan dari pihak manapun.
      </p>

      <div className="text-right text-[10pt] mb-2">
        <p>Purwakarta, .................................... {c.currentYear}</p>
        <p className="text-[8.5pt] text-slate-500">Kota/Kabupaten, tanggal bulan tahun</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center text-[10pt] mt-4">
        <div>
          <p className="font-semibold">Menyetujui,</p>
          <div className="h-24" />
          <p className="font-bold underline">( .................................................. )</p>
          <p className="text-[8.5pt] text-slate-600">Nama Lengkap Developer</p>
        </div>
        <div>
          <p className="font-semibold">Yang Menyatakan,</p>
          <div className="h-24 flex items-center justify-center text-[8pt] text-slate-400">
            <span>Stempel Developer & TTD</span>
          </div>
          <p className="font-bold underline">({c.direktur})</p>
          <p className="text-[8.5pt] text-slate-600">Direktur Utama {c.pengembang}</p>
        </div>
      </div>
      <p className="text-[8pt] italic text-slate-500 mt-6">*) coret salah yang tidak perlu</p>
    </PageWrapper>
  );
};

// LAMPIRAN VII BTN - PENYERAHAN SPT PPH
export const DocBtnLampiran7: React.FC<{ data: BankKprDocData }> = ({ data }) => {
  const c = getCommons(data);
  return (
    <PageWrapper>
      <div className="text-center font-bold mb-6">
        <p className="text-xs uppercase">Lampiran VII</p>
        <p className="text-base underline uppercase mt-1">SURAT PERNYATAAN PENYERAHAN SPT PPH</p>
      </div>

      <p className="mb-3">Yang bertanda tangan di bawah ini:</p>
      <table className="w-full mb-4 text-[10pt]">
        <tbody>
          <tr><td className="w-48 py-1">Nama Lengkap</td><td className="w-3">:</td><td className="font-semibold">{c.namaPemohon}</td></tr>
          <tr><td className="py-1">No. KTP</td><td>:</td><td>{c.nikPemohon}</td></tr>
          <tr><td className="py-1">Tempat, Tanggal Lahir</td><td>:</td><td>{c.tempatLahirPemohon}, {c.tglLahirPemohon}</td></tr>
          <tr><td className="py-1">Pekerjaan</td><td>:</td><td>{c.pekerjaanPemohon}</td></tr>
          <tr><td className="py-1 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPemohon}</td></tr>
        </tbody>
      </table>

      <p className="font-semibold mb-2">Menyatakan hal-hal sebagai berikut:</p>
      <ol className="list-decimal pl-6 space-y-2 text-justify mb-6 leading-relaxed">
        <li>
          Bahwa dikarenakan saya memiliki Nomor Pokok Wajib Pajak (NPWP) kurang dari 1 (satu) tahun pada saat pengajuan KPR Bersubsidi BTN, maka saya belum dapat menyampaikan Surat Pemberitahuan Tahunan (SPT) Pajak Penghasilan (PPh) Orang Pribadi sebagai salah satu dokumen persyaratan pengajuan KPR Bersubsidi BTN sebagaimana telah diatur pada ketentuan Pemerintah.
        </li>
        <li>
          Bahwa saya bersedia menyampaikan dokumen SPT PPh tahun berikutnya setelah akad kredit KPR Bersubsidi BTN kepada Bank BTN.
        </li>
        <li>
          Bahwa saya bersedia menerima konsekuensi yang diberikan oleh Pemerintah dalam hal saya terlambat dan/atau tidak menyerahkan dokumen SPT PPh tahun berikutnya setelah akad kredit KPR Bersubsidi kepada Bank BTN.
        </li>
      </ol>

      <p className="text-justify mb-8 leading-relaxed">
        Demikian surat pernyataan ini saya buat dengan sebenarnya tanpa paksaan dari pihak manapun dan apabila di kemudian hari pernyataan saya ini tidak benar, saya bersedia mengembalikan seluruh subsidi yang saya terima.
      </p>

      <div className="flex justify-end pr-12 text-center">
        <div>
          <p>Purwakarta, .................................... {c.currentYear}</p>
          <p className="text-[8.5pt] text-slate-500">Kota/Kabupaten, tanggal bulan tahun</p>
          <div className="h-24" />
          <p className="font-bold underline">({c.namaPemohon})</p>
          <p className="text-[8.5pt] text-slate-600">Nama Lengkap</p>
        </div>
      </div>
    </PageWrapper>
  );
};

// LAMPIRAN X BTN - SURAT PERNYATAAN VERIFIKASI
export const DocBtnLampiran10: React.FC<{ data: BankKprDocData }> = ({ data }) => {
  const c = getCommons(data);
  return (
    <PageWrapper>
      <div className="text-center font-bold mb-3">
        <p className="text-xs uppercase">Lampiran X</p>
        <p className="text-base underline uppercase">SURAT PERNYATAAN VERIFIKASI</p>
      </div>

      <p className="text-[9.5pt] mb-1">Yang bertanda tangan di bawah ini :</p>
      <table className="w-full mb-2 text-[9.5pt]">
        <tbody>
          <tr><td className="w-40 py-0.5">Nama</td><td className="w-3">:</td><td>............................................................</td></tr>
          <tr><td className="py-0.5">NIK / NIP</td><td>:</td><td>............................................................</td></tr>
          <tr><td className="py-0.5">Jabatan</td><td>:</td><td>............................................................</td></tr>
          <tr><td className="py-0.5">Alamat Kantor</td><td>:</td><td>Bank BTN Kantor Cabang Purwakarta</td></tr>
          <tr><td className="py-0.5">No. Telp./Fax.</td><td>:</td><td>............................................................</td></tr>
        </tbody>
      </table>

      <p className="font-bold text-center text-[10pt] my-1">MENYATAKAN</p>

      <div className="space-y-1.5 text-justify text-[9pt] leading-snug">
        <p>1. Telah melaksanakan verifikasi dokumen Kelompok Sasaran KPR Sejahtera sebanyak 1 (Satu) Pemohon atas nama <span className="font-semibold">{c.namaPemohon}</span>.</p>
        <p>2. Bahwa verifikasi dilakukan berupa verifikasi administrasi untuk memastikan ketetapan sasaran dan pemenuhan ketentuan KPR Sejahtera.</p>
        <p>3. Bahwa verifikasi administrasi meliputi kelengkapan SPR, identitas, slip gaji sah, NPWP, surat pernyataan pemohon, kesesuaian harga rumah umum tapak, dan analisa kemampuan mengangsur pemohon.</p>
        <p>4. Pemberian KPR KPR Sejahtera telah melalui prosedur pemeriksaan administrasi dan wawancara terhadap pemohon.</p>
        <p>5. Berdasarkan hal-hal tersebut, maka pemohon telah memenuhi syarat sebagai Kelompok Sasaran KPR Sejahtera dan layak diberikan dana FLPP/SBUM*).</p>
        <p>6. Seluruh dokumen persyaratan pemohon sesuai dengan aslinya dan dapat dipertanggungjawabkan.</p>
      </div>

      <p className="text-justify text-[9pt] mt-3 mb-2">
        Demikian surat pernyataan ini saya buat dengan sebenar-benarnya tanpa paksaan dari pihak manapun.
      </p>

      <div className="mt-4 text-[9.5pt]">
        <p>Purwakarta, .................................... {c.currentYear}</p>
        <p className="font-semibold">PT. BANK TABUNGAN NEGARA (PERSERO) Tbk.</p>
        <p>KANTOR CABANG PURWAKARTA</p>
        <div className="h-16" />
        <p className="font-bold underline">( ................................................................ )</p>
        <p className="text-[8.5pt] text-slate-600">Nama Lengkap, Jabatan dan Stempel</p>
      </div>
      <p className="text-[8pt] italic text-slate-500 mt-2">*) coret yang tidak perlu</p>
    </PageWrapper>
  );
};

// LAMPIRAN XI BTN - SURAT KUASA (REKENING DEVELOPER)
export const DocBtnLampiran11Kuasa: React.FC<{ data: BankKprDocData }> = ({ data }) => {
  const c = getCommons(data);
  return (
    <PageWrapper>
      <div className="text-center font-bold mb-3">
        <p className="text-xs uppercase">Lampiran XI</p>
        <p className="text-base underline uppercase">SURAT KUASA</p>
      </div>

      <p className="text-[9.5pt] mb-1">Yang bertanda tangan di bawah ini:</p>
      <table className="w-full mb-1 text-[9pt]">
        <tbody>
          <tr><td className="w-44 py-0.5">Nama Lengkap</td><td className="w-3">:</td><td className="font-semibold">{c.namaPemohon}</td></tr>
          <tr><td className="py-0.5">No. KTP</td><td>:</td><td>{c.nikPemohon}</td></tr>
          <tr><td className="py-0.5">Tempat, Tanggal Lahir</td><td>:</td><td>{c.tempatLahirPemohon}, {c.tglLahirPemohon}</td></tr>
          <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{c.pekerjaanPemohon}</td></tr>
          <tr><td className="py-0.5">No. Telepon/HP</td><td>:</td><td>{c.noHpPemohon}</td></tr>
          <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPemohon}</td></tr>
          <tr><td className="py-0.5">Nomor Rekening Tabungan</td><td>:</td><td>............................................................</td></tr>
        </tbody>
      </table>
      <p className="text-[9pt] italic pl-2 mb-2 font-medium">yang dalam hal ini bertindak untuk dan atas nama sendiri. Selanjutnya disebut <span className="font-bold">"Pemberi Kuasa"</span>.</p>

      <p className="text-justify text-[8.5pt] mb-1 leading-relaxed">
        PT. Bank Tabungan Negara (Persero) Tbk., berkedudukan di Jalan Gajah Mada No. 01 Jakarta Pusat yang dalam hal ini diwakili oleh ........................................ selaku ........................................ di PT. Bank Tabungan Negara (Persero) Tbk. Kantor Cabang Purwakarta. Selanjutnya disebut <span className="font-bold">"Penerima Kuasa"</span>.
      </p>

      <p className="font-bold text-center text-[9pt] my-0.5">KHUSUS</p>
      <p className="text-[8.5pt] mb-1">dengan ini Pemberi Kuasa memberikan kuasa kepada Penerima Kuasa untuk dapat melakukan hal-hal sebagai berikut:</p>

      <div className="space-y-1 text-justify text-[8.5pt] leading-tight pl-2">
        <p>1. Membayarkan sejumlah dana kepada Penjual/Pengembang dari hasil pencairan kredit yang diterima oleh Pemberi Kuasa dari Bank BTN untuk pembayaran lunas harga jual rumah beserta lahan sesuai dengan tujuan pemberian kredit.</p>
        <p>2. Melakukan pemindahbukuan pencairan dana Subsidi Bantuan Uang Muka (SBUM) dari rekening simpanan milik Pemberi Kuasa di Bank BTN senilai <span className="font-semibold">{c.sbumStr}</span> untuk digunakan sebagai pengurang pokok kredit/pembayaran kekurangan uang muka pembelian Rumah Umum Tapak.</p>
        <div className="pl-3">
          <p className="font-semibold">3. Pembayaran dan pemindahbukuan dana ditujukan kepada:</p>
          <table className="w-full">
            <tbody>
              <tr><td className="w-40">Nama Pengembang</td><td className="w-3">:</td><td className="font-semibold">{c.pengembang}</td></tr>
              <tr><td>Nomor Rekening</td><td>:</td><td className="font-bold">{c.rekBtnDeveloper}</td></tr>
              <tr><td>Rekening Atas Nama</td><td>:</td><td className="font-semibold">{c.pengembang}</td></tr>
              <tr><td>Pada Bank</td><td>:</td><td>Bank BTN Kantor Cabang Purwakarta</td></tr>
            </tbody>
          </table>
        </div>
        <p>4. Memblokir, mendebet dan/atau memindahbukukan dana untuk biaya proses/realisasi, angsuran kredit pokok/bunga/denda, dan biaya asuransi/pengikatan agunan.</p>
        <p>5. Transaksi dapat dilakukan oleh Bank BTN secara manual, otomatis dan/atau mekanisme transaksi yang berlaku di Bank BTN.</p>
      </div>

      <p className="text-justify text-[8.5pt] mt-2 mb-2 leading-relaxed">
        Demikian Surat Kuasa ini dibuat dan tidak dapat dicabut kembali serta tidak akan berakhir karena sebab – sebab yang tercantum dalam Pasal 1813 Kitab Undang – Undang Hukum Perdata atau karena sebab apapun juga.
      </p>

      <div className="grid grid-cols-2 gap-4 text-center text-[8.5pt] mt-2">
        <div>
          <p className="font-bold">PENERIMA KUASA</p>
          <p>PT. BANK TABUNGAN NEGARA (PERSERO) Tbk.</p>
          <p>KANTOR CABANG PURWAKARTA</p>
          <div className="h-20" />
          <p className="font-bold underline">( ................................................................ )</p>
        </div>
        <div>
          <p>Purwakarta, .................................... {c.currentYear}</p>
          <p className="font-bold">PEMBERI KUASA</p>
          <MateraiBox />
          <p className="font-bold underline">({c.namaPemohon})</p>
        </div>
      </div>
      <p className="text-[8pt] italic text-slate-500">*) coret yang tidak perlu</p>
    </PageWrapper>
  );
};

// LAMPIRAN XIII BTN - PERMOHONAN SBUM (KEMENPUPR)
export const DocBtnLampiran13: React.FC<{ data: BankKprDocData }> = ({ data }) => {
  const c = getCommons(data);
  return (
    <PageWrapper>
      <div className="text-center font-bold mb-4">
        <p className="text-xs uppercase">LAMPIRAN XIII</p>
        <p className="text-base underline uppercase mt-1">Surat Permohonan Subsidi Bantuan Uang Muka</p>
      </div>

      <div className="mb-3 text-[9.5pt]">
        <p className="font-semibold">Kepada Yth:</p>
        <p className="font-semibold">Kepala Satuan Kerja Direktorat Jenderal Pembiayaan Infrastruktur Pekerjaan Umum dan Perumahan</p>
        <p>Kementerian Pekerjaan Umum dan Perumahan Rakyat</p>
        <p>Jalan Raden Patah 1 No 1 Gedung B Lantai 3</p>
        <p>Kebayoran Baru, Jakarta Selatan 12110</p>
      </div>

      <p className="text-[9.5pt] mb-2 font-semibold">Perihal : Permohonan Subsidi Bantuan Uang Muka Perumahan</p>

      <p className="text-[9.5pt] mb-2">Saya yang bertanda tangan di bawah ini:</p>
      <table className="w-full mb-3 text-[9.5pt]">
        <tbody>
          <tr><td className="w-48 py-0.5">Nama</td><td className="w-3">:</td><td className="font-semibold">{c.namaPemohon}</td></tr>
          <tr><td className="py-0.5">Tempat, Tanggal Lahir</td><td>:</td><td>{c.tempatLahirPemohon}, {c.tglLahirPemohon}</td></tr>
          <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{c.pekerjaanPemohon}</td></tr>
          <tr><td className="py-0.5">No. KTP</td><td>:</td><td>{c.nikPemohon}</td></tr>
          <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPemohon}</td></tr>
        </tbody>
      </table>

      <p className="text-justify text-[9.5pt] mb-2">
        mengajukan permohonan Subsidi Bantuan Uang Muka perumahan untuk pembelian Rumah Sejahtera Tapak dengan keterangan sebagai berikut:
      </p>

      <table className="w-full mb-3 text-[9.5pt]">
        <tbody>
          <tr><td className="w-56 py-0.5">Nama Pengembang</td><td className="w-3">:</td><td className="font-semibold">{c.pengembang}</td></tr>
          <tr><td className="py-0.5">Alamat Rumah yang Dibeli</td><td>:</td><td>{c.namaPerumahan} Blok {c.blokUnit}</td></tr>
          <tr><td className="py-0.5">Harga Jual Rumah</td><td>:</td><td className="font-semibold">{c.hargaJual}</td></tr>
          <tr><td className="py-0.5">Besaran Uang Muka</td><td>:</td><td>{c.dpTotal}</td></tr>
          <tr><td className="py-0.5">Bank Pelaksana</td><td>:</td><td>Bank BTN Kantor Cabang Purwakarta</td></tr>
        </tbody>
      </table>

      <p className="text-justify text-[9.5pt] mb-3 leading-relaxed">
        Sebagai pertimbangan, bersama ini kami lampirkan dokumen fotokopi surat pengakuan kekurangan bayar uang muka pembelian Rumah Sejahtera Tapak yang disetujui oleh <span className="font-semibold">{c.direktur}</span>*)
      </p>

      <p className="text-[9.5pt] mb-6">Demikian kami sampaikan, atas perhatiannya kami ucapkan terima kasih.</p>

      <div className="flex justify-end pr-12 text-center text-[9.5pt]">
        <div>
          <p>Purwakarta, .................................... {c.currentYear}</p>
          <p className="text-[8.5pt] text-slate-500">Kota/Kabupaten, tanggal bulan tahun</p>
          <p className="mt-1 font-semibold">PEMOHON</p>
          <div className="h-24" />
          <p className="font-bold underline">({c.namaPemohon})</p>
          <p className="text-[8.5pt] text-slate-600">Nama Lengkap</p>
        </div>
      </div>
      <p className="text-[8pt] italic text-slate-500 mt-6">*) diisi nama direktur/atau yang mewakili pengembang</p>
    </PageWrapper>
  );
};

// LAMPIRAN XIV BTN - PENGAKUAN KEKURANGAN BAYAR UANG MUKA
export const DocBtnLampiran14: React.FC<{ data: BankKprDocData }> = ({ data }) => {
  const c = getCommons(data);
  return (
    <PageWrapper>
      <div className="text-center font-bold mb-4">
        <p className="text-xs uppercase">LAMPIRAN XIV</p>
        <p className="text-base underline uppercase mt-1">Surat Pengakuan Kekurangan Bayar Uang Muka</p>
      </div>

      <p className="mb-2 text-[9.5pt]">Saya yang bertanda tangan di bawah ini:</p>
      <table className="w-full mb-3 text-[9.5pt]">
        <tbody>
          <tr><td className="w-48 py-0.5">Nama</td><td className="w-3">:</td><td className="font-semibold">{c.namaPemohon}</td></tr>
          <tr><td className="py-0.5">Tempat, Tanggal Lahir</td><td>:</td><td>{c.tempatLahirPemohon}, {c.tglLahirPemohon}</td></tr>
          <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{c.pekerjaanPemohon}</td></tr>
          <tr><td className="py-0.5">No. KTP</td><td>:</td><td>{c.nikPemohon}</td></tr>
          <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPemohon}</td></tr>
        </tbody>
      </table>

      <p className="text-justify text-[9.5pt] mb-3 leading-relaxed">
        Dengan ini menyatakan bahwa saya telah melakukan pembayaran uang muka sebesar <span className="font-semibold">{c.dpDibayar} (Dua Juta Rupiah)</span> dan masih memiliki kekurangan bayar uang muka sebesar <span className="font-semibold">{c.sbumStr} (Empat Juta Rupiah)</span> untuk pembelian Rumah Sejahtera Tapak kepada:
      </p>

      <table className="w-full mb-3 text-[9.5pt]">
        <tbody>
          <tr><td className="w-56 py-0.5">Nama</td><td className="w-3">:</td><td className="font-semibold">{c.pengembang}</td></tr>
          <tr><td className="py-0.5">Alamat Rumah yang Dibeli</td><td>:</td><td>{c.namaPerumahan} Blok {c.blokUnit}</td></tr>
          <tr><td className="py-0.5">Harga Jual Rumah</td><td>:</td><td className="font-semibold">{c.hargaJual}</td></tr>
          <tr><td className="py-0.5">Besaran Uang Muka</td><td>:</td><td>{c.dpTotal}</td></tr>
          <tr><td className="py-0.5">Bank Pelaksana</td><td>:</td><td>Bank BTN Kantor Cabang Purwakarta</td></tr>
        </tbody>
      </table>

      <p className="text-justify text-[9.5pt] mb-4 leading-relaxed">
        Jika permohonan SBUM saya tidak disetujui, maka saya bersedia untuk membayar kekurangan uang muka pembelian rumah sejahtera tapak menggunakan dana sendiri.
      </p>

      <p className="text-[9.5pt] mb-4">Demikian kami sampaikan, atas perhatiannya kami ucapkan terima kasih.</p>

      <div className="grid grid-cols-2 gap-4 text-center text-[9.5pt] mt-6">
        <div>
          <p className="font-semibold">Menyetujui,</p>
          <p className="text-[8.5pt] text-slate-600">(Jabatan yang mewakili pengembang)</p>
          <div className="h-20 flex items-center justify-center text-[8pt] text-slate-400">
            <span>Stempel & TTD Pengembang</span>
          </div>
          <p className="font-bold underline">({c.direktur})</p>
          <p className="text-[8.5pt] text-slate-600">{c.pengembang}</p>
        </div>
        <div>
          <p>Purwakarta, .................................... {c.currentYear}</p>
          <p className="font-semibold">PEMOHON</p>
          <MateraiBox />
          <p className="font-bold underline">({c.namaPemohon})</p>
          <p className="text-[8.5pt] text-slate-600">Nama Lengkap</p>
        </div>
      </div>
    </PageWrapper>
  );
};

// STANDING INSTRUCTION BTN
export const DocBtnStandingInstruction: React.FC<{ data: BankKprDocData }> = ({ data }) => {
  const c = getCommons(data);
  return (
    <PageWrapper>
      <div className="text-center font-bold mb-4">
        <p className="text-base underline uppercase">STANDING INSTRUCTION</p>
        <p className="text-xs uppercase text-slate-700">(Perintah Pemindahbukuan)</p>
      </div>

      <p className="text-justify text-[9.5pt] mb-3 leading-relaxed">
        Sehubungan dengan permohonan dana Subsidi Bantuan Uang Muka (SBUM) kepada Kepala Satuan Kerja Direktorat Jenderal Pembiayaan Perumahan Kementerian Pekerjaan Umum dan Perumahan Rakyat, maka saya yang bertanda tangan dibawah ini :
      </p>

      <table className="w-full mb-3 text-[9.5pt]">
        <tbody>
          <tr><td className="w-48 py-0.5">Nama</td><td className="w-3">:</td><td className="font-semibold">{c.namaPemohon}</td></tr>
          <tr><td className="py-0.5">NIK</td><td>:</td><td>{c.nikPemohon}</td></tr>
          <tr><td className="py-0.5">Tempat, Tanggal Lahir</td><td>:</td><td>{c.tempatLahirPemohon}, {c.tglLahirPemohon}</td></tr>
          <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{c.pekerjaanPemohon}</td></tr>
          <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPemohon}</td></tr>
        </tbody>
      </table>

      <p className="text-justify text-[9.5pt] mb-3 leading-relaxed">
        Dengan ini memberikan kuasa kepada <span className="font-semibold">PT. Bank Tabungan Negara (Persero) Tbk. Kantor Cabang Purwakarta</span> Untuk melakukan pemindahbukuan pencairan dana Subsidi Bantuan Uang Muka (SBUM) senilai <span className="font-bold">{c.sbumStr} (Empat Juta Rupiah)</span> untuk digunakan sebagai pengurang pokok kredit atau pembayaran kekurangan uang muka pembelian rumah sejahtera*), kepada :
      </p>

      <table className="w-full mb-4 text-[9.5pt]">
        <tbody>
          <tr><td className="w-48 py-0.5">Nama Pengembang</td><td className="w-3">:</td><td className="font-semibold">{c.pengembang}</td></tr>
          <tr><td className="py-0.5">Nomor Rekening</td><td>:</td><td className="font-bold">{c.rekBtnDeveloper}</td></tr>
          <tr><td className="py-0.5">Rekening Atas Nama</td><td>:</td><td className="font-semibold">{c.pengembang}</td></tr>
          <tr><td className="py-0.5">Pada Bank</td><td>:</td><td>Bank BTN Kantor Cabang Purwakarta</td></tr>
        </tbody>
      </table>

      <p className="text-justify text-[9.5pt] mb-6 leading-relaxed">
        Demikian Standing Instruction ini dibuat tanpa adanya paksaan dari pihak manapun. Akibat apapun yang mungkin timbul dari paksaan penyaluran dana oleh PT. Bank Tabungan Negara (Persero) Tbk. Berdasarkan Standing Instruction ini adalah sepenuhnya menjadi tanggung jawab saya.
      </p>

      <div className="grid grid-cols-2 gap-4 text-center text-[9.5pt] mt-6">
        <div>
          <p className="font-semibold">Menyetujui,</p>
          <p>PT. BANK TABUNGAN NEGARA (PERSERO) Tbk</p>
          <p>KANTOR CABANG PURWAKARTA</p>
          <div className="h-20" />
          <p className="font-bold underline">( ................................................................ )</p>
          <p className="text-[8.5pt] text-slate-600">Nama Lengkap, jabatan, Stempel</p>
        </div>
        <div>
          <p>Purwakarta, .................................... {c.currentYear}</p>
          <p className="font-semibold">Yang Membuat Standing Instruction</p>
          <MateraiBox />
          <p className="font-bold underline">({c.namaPemohon})</p>
          <p className="text-[8.5pt] text-slate-600">Nama Lengkap Pembuat SI</p>
        </div>
      </div>
      <p className="text-[8pt] italic text-slate-500 mt-6">*) Pilih salah satu</p>
    </PageWrapper>
  );
};

// SURAT KUASA PENDEBETAN DANA BTN
export const DocBtnKuasaPendebetanDana: React.FC<{ data: BankKprDocData }> = ({ data }) => {
  const c = getCommons(data);
  return (
    <PageWrapper>
      <div className="text-center font-bold mb-6">
        <p className="text-base underline uppercase">SURAT KUASA PENDEBETAN DANA</p>
        <p className="text-xs uppercase text-slate-700">(BANK BTN)</p>
      </div>

      <p className="mb-3">Yang bertanda tangan di bawah ini :</p>
      <table className="w-full mb-4 text-[10pt]">
        <tbody>
          <tr><td className="w-48 py-1">Nama Lengkap</td><td className="w-3">:</td><td className="font-semibold">{c.namaPemohon}</td></tr>
          <tr><td className="py-1">No KTP</td><td>:</td><td>{c.nikPemohon}</td></tr>
          <tr><td className="py-1">Tempat, tgl lahir</td><td>:</td><td>{c.tempatLahirPemohon}, {c.tglLahirPemohon}</td></tr>
          <tr><td className="py-1">Pekerjaan</td><td>:</td><td>{c.pekerjaanPemohon}</td></tr>
          <tr><td className="py-1 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPemohon}</td></tr>
        </tbody>
      </table>
      <p className="italic text-[9pt] pl-4 -mt-2 mb-4 font-medium">yang dalam hal ini bertindak untuk dan atas nama sendiri, Selanjutnya disebut <span className="font-bold">"Pemberi Kuasa"</span>.</p>

      <p className="text-justify mb-4 leading-relaxed">
        PT. Bank Tabungan Negara (Persero) Tbk, berkedudukan di Jalan Gajah Mada No. 01 Jakarta Pusat yang dalam hal ini diwakili oleh ........................................... selaku ........................................... di PT. Bank Tabungan Negara (Persero) Tbk. Kantor Cabang Purwakarta Selanjutnya disebut <span className="font-bold">"Penerima Kuasa"</span>.
      </p>

      <p className="text-justify mb-4 leading-relaxed">
        Dengan ini Pemberi Kuasa memberi kuasa kepada Penerima Kuasa untuk melakukan pendebetan dana pada Nomor Rekening Tabungan Pemberi Kuasa dengan nomor ........................................... atas nama ........................................... atas biaya asuransi, biaya pengikatan agunan, dan biaya lainnya yang timbul atas penghentian KPR Bersubsidi BTN.
      </p>

      <p className="text-justify mb-8 leading-relaxed">
        Kuasa ini diberikan dengan Hak Substitusi, tidak dapat dicabut kembali dan tidak akan berakhir karena sebab-sebab yang tercantum dalam pasal 1813 Kitab Undang-undang Hukum Perdata atau karena sebab apapun juga.
      </p>

      <div className="grid grid-cols-2 gap-4 text-center mt-4">
        <div>
          <p className="font-bold">PENERIMA KUASA,</p>
          <p>PT. BANK TABUNGAN NEGARA (Persero) Tbk</p>
          <p>Kantor Cabang Purwakarta</p>
          <div className="h-20" />
          <p className="font-bold underline">( .................................................. )</p>
        </div>
        <div>
          <p>Purwakarta, .................................... {c.currentYear}</p>
          <p className="font-bold">PEMBERI KUASA,</p>
          <MateraiBox />
          <p className="font-bold underline">({c.namaPemohon})</p>
        </div>
      </div>
    </PageWrapper>
  );
};

// SURAT PERNYATAAN PENGHUNIAN RUMAH UMUM BERSUBSIDI BTN
export const DocBtnPenghunianRumah: React.FC<{ data: BankKprDocData }> = ({ data }) => {
  const c = getCommons(data);
  return (
    <PageWrapper>
      <div className="text-center font-bold mb-4">
        <p className="text-base underline uppercase">SURAT PERNYATAAN PENGHUNIAN RUMAH UMUM BERSUBSIDI</p>
        <p className="text-xs uppercase text-slate-700">(BANK BTN)</p>
      </div>

      <p className="mb-2 text-[9.5pt]">Yang bertanda tangan di bawah ini :</p>
      <table className="w-full mb-3 text-[9.5pt]">
        <tbody>
          <tr><td className="w-48 py-0.5">Nama Lengkap</td><td className="w-3">:</td><td className="font-semibold">{c.namaPemohon}</td></tr>
          <tr><td className="py-0.5">No. KTP</td><td>:</td><td>{c.nikPemohon}</td></tr>
          <tr><td className="py-0.5">Tempat, Tanggal Lahir</td><td>:</td><td>{c.tempatLahirPemohon}, {c.tglLahirPemohon}</td></tr>
          <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{c.pekerjaanPemohon}</td></tr>
          <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPemohon}</td></tr>
        </tbody>
      </table>

      <p className="font-semibold text-[9.5pt] mb-1">Selaku Debitur KPR Bersubsidi BTN menyatakan dengan sesungguhnya bahwa:</p>
      <div className="space-y-1 text-justify text-[9pt] leading-snug pl-2">
        <p>1. Saya telah memahami ketentuan penghunian rumah sejahtera sebagaimana dimaksud di dalam Peraturan Menteri PUPR.</p>
        <p>2. Saya menyatakan bahwa : berpenghasilan tidak melebihi batas, saya dan istri/suami*) tidak memiliki rumah, tidak pernah menerima subsidi, menggunakan sendiri dan menghuni rumah dalam jangka waktu paling lambat 1 tahun setelah serah terima, dan tidak akan menyewakan/mengalihkan kepemilikan.</p>
        <p>3. Bahwa semua dokumen persyaratan yang disampaikan kepada Bank BTN untuk memperoleh KPR Bersubsidi BTN adalah benar dan dapat dipertanggungjawabkan keabsahannya.</p>
        <p>4. Apabila di kemudian hari pernyataan ini tidak benar dan/atau tidak saya penuhi, saya bersedia dan memberikan kuasa kepada Bank BTN untuk menghentikan fasilitas KPR Bersubsidi BTN dan/atau mengubah menjadi KPR BTN Non-Subsidi.</p>
        <p>5. Saya bersedia menanggung segala biaya asuransi, pengikatan agunan, dan biaya lainnya yang timbul atas penghentian KPR Bersubsidi BTN.</p>
      </div>

      <p className="text-justify text-[9pt] mt-3 mb-2">
        Demikian surat pernyataan ini saya buat dengan sebenar-benarnya tanpa paksaan dari pihak manapun.
      </p>

      <div className="text-right text-[9pt] mb-1">
        <p>Purwakarta, .................................... {c.currentYear}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center text-[9pt]">
        <div>
          <p className="font-semibold">Yang Menyetujui,</p>
          <div className="h-20" />
          <p className="font-bold underline">({c.namaPasangan || '...................................................'})</p>
          <p className="text-[8pt] text-slate-500">Nama Pasangan suami/istri</p>
        </div>
        <div>
          <p className="font-semibold">Yang Membuat Pernyataan,</p>
          <MateraiBox />
          <p className="font-bold underline">({c.namaPemohon})</p>
        </div>
      </div>

      <div className="text-center text-[9pt] mt-2">
        <p>Mengetahui,</p>
        <p className="font-semibold">PT. BANK TABUNGAN NEGARA (PERSERO) tbk.</p>
        <p>KANTOR CABANG PURWAKARTA</p>
        <div className="h-10" />
        <p className="font-bold underline">( ................................................................ )</p>
      </div>
      <p className="text-[8pt] italic text-slate-500">*) coret yang tidak perlu</p>
    </PageWrapper>
  );
};

// LAMPIRAN VI BTN - SURAT PERNYATAAN PEMOHON KPR BERSUBSIDI (FORMAT PUPR)
export const DocBtnLampiran6PUPR: React.FC<{ data: BankKprDocData }> = ({ data }) => {
  const c = getCommons(data);
  return (
    <PageWrapper>
      <div className="text-center font-bold mb-2">
        <p className="text-xs uppercase">Lampiran VI</p>
        <p className="text-sm underline uppercase">SURAT PERNYATAAN PEMOHON KPR BERSUBSIDI</p>
        <p className="text-xs uppercase text-slate-700">(FORMAT KEMENTERIAN PUPR)</p>
      </div>

      <p className="text-[9pt] mb-1">Yang bertanda tangan di bawah ini:</p>
      <table className="w-full mb-1 text-[9pt]">
        <tbody>
          <tr><td className="w-44 py-0.5">Nama Lengkap</td><td className="w-3">:</td><td className="font-semibold">{c.namaPemohon}</td></tr>
          <tr><td className="py-0.5">Tempat/Tanggal Lahir</td><td>:</td><td>{c.tempatLahirPemohon}, {c.tglLahirPemohon}</td></tr>
          <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{c.pekerjaanPemohon}</td></tr>
          <tr><td className="py-0.5">No. KTP/NIK</td><td>:</td><td>{c.nikPemohon}</td></tr>
          <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPemohon}</td></tr>
        </tbody>
      </table>
      <p className="italic text-[8.5pt] pl-4 -mt-1 mb-1.5 font-medium">Selaku Pemohon.</p>

      <table className="w-full mb-1 text-[9pt]">
        <tbody>
          <tr><td className="w-44 py-0.5">Nama Lengkap</td><td className="w-3">:</td><td className="font-semibold">{c.namaPasangan || '...................................................'}</td></tr>
          <tr><td className="py-0.5">Tempat/Tanggal Lahir</td><td>:</td><td>{c.tempatLahirPasangan || '........'}, {c.tglLahirPasangan || '........'}</td></tr>
          <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{c.pekerjaanPasangan}</td></tr>
          <tr><td className="py-0.5">No. KTP/NIK</td><td>:</td><td>{c.nikPasangan || '...................................................'}</td></tr>
          <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPasangan || c.alamatPemohon}</td></tr>
        </tbody>
      </table>
      <p className="italic text-[8.5pt] pl-4 -mt-1 mb-1.5 font-medium">Selaku suami/istri* pemohon.</p>

      <p className="font-semibold text-[9pt] mb-1">Menyatakan dengan sesungguhnya bahwa:</p>
      <div className="space-y-0.5 text-justify text-[8.5pt] leading-tight pl-2">
        <p>1. Saya memiliki gaji/upah pokok/penghasilan bersih per bulan sebesar <span className="font-semibold">{c.gajiPemohon}</span></p>
        <p>2. Saya dan (istri/suami*)) tidak memiliki hak kepemilikan atas rumah pada saat pengajuan pembiayaan KPR Bersubsidi.</p>
        <p>3. Saya dan (istri/suami*)) belum pernah menerima subsidi atau bantuan pembiayaan perumahan dari pemerintah.</p>
        <p>4. Saya membeli Rumah Umum Tapak dengan harga <span className="font-semibold">{c.hargaJual}</span> dari <span className="font-semibold">{c.pengembang}</span>.</p>
        <p>5. Saya dan (istri/suami*)) akan menggunakan rumah sebagai tempat tinggal dalam kurun waktu paling lambat 1 tahun setelah serah terima.</p>
        <p>6. Saya dan (istri/suami*)) tidak akan menyewakan/memindahtangankan kecuali telah melampaui 5 tahun (tapak), pindah tempat tinggal, warisan, atau untuk kepentingan Bank BTN.</p>
        <p>7. Bahwa semua dokumen yang disampaikan kepada Bank BTN adalah benar dan dapat dipertanggungjawabkan.</p>
        <p>8. Apabila pernyataan tidak benar, bersedia mengembalikan seluruh dana subsidi dan dikenakan sanksi perundang-undangan.</p>
      </div>

      <p className="text-justify text-[8.5pt] mt-1.5 mb-1">
        Demikian surat pernyataan ini saya buat dengan sebenar-benarnya tanpa paksaan dari pihak manapun.
      </p>

      <div className="text-right text-[8.5pt] mb-1">
        <p>Purwakarta, .................................... {c.currentYear}</p>
        <p className="text-[8pt] text-slate-500">Kota/Kabupaten, tanggal bulan tahun</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center text-[8.5pt]">
        <div>
          <p>Menyetujui,</p>
          <div className="h-20" />
          <p className="font-bold underline">({c.namaPasangan || '...................................................'})</p>
          <p className="text-[8pt] text-slate-500">Nama Lengkap Suami/Istri*</p>
        </div>
        <div>
          <p>Yang membuat pernyataan,</p>
          <MateraiBox />
          <p className="font-bold underline">({c.namaPemohon})</p>
          <p className="text-[8pt] text-slate-500">Nama Lengkap Pemohon</p>
        </div>
      </div>

      <div className="text-center text-[8.5pt] mt-1">
        <p>Mengetahui,</p>
        <p>Pimpinan Tempat Bekerja/Kepala Desa/Lurah* ......................................</p>
        <div className="h-8" />
        <p className="font-bold underline">( ................................................................ )</p>
      </div>
      <p className="text-[7.5pt] italic text-slate-500">*) coret salah yang tidak perlu</p>
    </PageWrapper>
  );
};

// LAMPIRAN XI BTN - SURAT PERNYATAAN CALON DEBITUR BTN (INTERNAL SP3K)
export const DocBtnLampiran11Internal: React.FC<{ data: BankKprDocData }> = ({ data }) => {
  const c = getCommons(data);
  return (
    <PageWrapper>
      <div className="text-center font-bold mb-2">
        <p className="text-xs uppercase">Lampiran XI</p>
        <p className="text-sm underline uppercase">SURAT PERNYATAAN PEMOHON KPR BERSUBSIDI BTN</p>
        <p className="text-xs uppercase text-slate-700">(FORMAT INTERNAL BANK BTN)</p>
      </div>

      <p className="text-justify text-[8.5pt] mb-2 leading-tight">
        Berkenaan dengan persetujuan Kredit Pemilikan Rumah Bersubsidi BTN (KPR Bersubsidi BTN) yang disampaikan PT Bank Tabungan Negara (Persero) Tbk (Bank BTN) melalui Surat Persetujuan Pemberian Kredit (SP3K) No ........................................... tanggal ..........................................., kami yang bertanda tangan dibawah ini:
      </p>

      <table className="w-full mb-1 text-[8.5pt]">
        <tbody>
          <tr><td className="w-40 py-0.5">Nama Lengkap</td><td className="w-3">:</td><td className="font-semibold">{c.namaPemohon}</td></tr>
          <tr><td className="py-0.5">No. KTP</td><td>:</td><td>{c.nikPemohon}</td></tr>
          <tr><td className="py-0.5">Tempat, Tanggal Lahir</td><td>:</td><td>{c.tempatLahirPemohon}, {c.tglLahirPemohon}</td></tr>
          <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{c.pekerjaanPemohon}</td></tr>
          <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPemohon}</td></tr>
        </tbody>
      </table>
      <p className="italic text-[8pt] pl-4 -mt-1 mb-1 font-medium">Selaku Calon Debitur.</p>

      <table className="w-full mb-1 text-[8.5pt]">
        <tbody>
          <tr><td className="w-40 py-0.5">Nama Lengkap</td><td className="w-3">:</td><td className="font-semibold">{c.namaPasangan || '...................................................'}</td></tr>
          <tr><td className="py-0.5">No. KTP</td><td>:</td><td>{c.nikPasangan || '...................................................'}</td></tr>
          <tr><td className="py-0.5">Tempat, Tanggal Lahir</td><td>:</td><td>{c.tempatLahirPasangan || '........'}, {c.tglLahirPasangan || '........'}</td></tr>
          <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{c.pekerjaanPasangan}</td></tr>
          <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{c.alamatPasangan || c.alamatPemohon}</td></tr>
        </tbody>
      </table>
      <p className="italic text-[8pt] pl-4 -mt-1 mb-1 font-medium">Selaku suami/istri* Calon Debitur.</p>

      <p className="font-semibold text-[8.5pt] mb-0.5">Menyatakan dengan sesungguhnya bahwa:</p>
      <div className="space-y-0.5 text-justify text-[8pt] leading-tight pl-2">
        <p>1. Telah melaksanakan setiap proses permohonan KPR Bersubsidi BTN sesuai ketentuan Bank BTN secara bebas dan mandiri.</p>
        <p>2. Telah memahami hak dan kewajiban sebagai Debitur sesuai penjelasan Bank BTN.</p>
        <p>3. Bersedia melakukan aktivasi ulang QR Code setiap tahun hingga tahun ke-5 sejak akad KPR Bersubsidi BTN.</p>
        <p>4. Bersedia menyerahkan data pribadi (KTP, NPWP) untuk fasilitas KPR Sejahtera.</p>
        <p>5. Bersedia menyerahkan dokumen bukti pelaporan Pajak (SPT PPh).</p>
        <p>6. Seluruh dokumen yang disampaikan adalah benar dan dapat dipertanggungjawabkan formil maupun material.</p>
        <p>7. Bersedia menanggung biaya asuransi, pengikatan agunan, dan biaya lain atas penghentian subsidi/konversi.</p>
        <p>8. Tidak akan menjanjikan atau memberikan sesuatu/gratifikasi kepada pejabat atau pegawai Bank BTN.</p>
        <p>9. Apabila tidak benar, bersedia mengembalikan seluruh subsidi dan mengubah/mengkonversi menjadi KPR Non-Subsidi.</p>
      </div>

      <p className="text-justify text-[8pt] mt-1 mb-1">
        Demikian surat pernyataan ini saya buat dengan sebenar-benarnya tanpa paksaan dari pihak manapun.
      </p>

      <div className="text-right text-[8pt] mb-1">
        <p>Purwakarta, .................................... {c.currentYear}</p>
        <p className="text-[7.5pt] text-slate-500">Kota/Kabupaten, tanggal bulan tahun</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center text-[8pt]">
        <div>
          <p>Menyetujui,</p>
          <div className="h-20" />
          <p className="font-bold underline">({c.namaPasangan || '...................................................'})</p>
          <p className="text-[7.5pt] text-slate-500">Nama Lengkap Suami/Istri*</p>
        </div>
        <div>
          <p>Yang Membuat Pernyataan,</p>
          <MateraiBox />
          <p className="font-bold underline">({c.namaPemohon})</p>
          <p className="text-[7.5pt] text-slate-500">Nama Lengkap Pemohon</p>
        </div>
      </div>

      <div className="text-center text-[8pt] mt-1">
        <p>Mengetahui,</p>
        <p>Pimpinan Tempat Bekerja/Kepala Desa/Lurah* ......................................</p>
        <div className="h-8" />
        <p className="font-bold underline">( ................................................................ )</p>
      </div>
      <p className="text-[7.5pt] italic text-slate-500">*) coret salah yang tidak perlu</p>
    </PageWrapper>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. REGISTRY DAFTAR DOKUMEN PER PAKET BANK
// ─────────────────────────────────────────────────────────────────────────────

export const BJB_KOMERSIL_DOCS: DocumentItemDef[] = [
  { id: 'bjb_kom_1', code: 'LTV', title: 'Surat Pernyataan Calon Debitur Mengenai Urutan Fasilitas Kredit', component: DocBjbUrutanFasilitasKredit },
  { id: 'bjb_kom_2', code: 'BAST', title: 'Berita Acara Serah Terima (BAST) Rumah Umum Tapak', component: (props) => <DocBAST {...props} formatCode="BERITA ACARA SERAH TERIMA" /> },
  { id: 'bjb_kom_3', code: 'PENGHASILAN', title: 'Surat Pernyataan Penghasilan', component: DocPernyataanPenghasilan },
  { id: 'bjb_kom_4', code: 'RUMAH', title: 'Surat Pernyataan Tidak Memiliki Rumah', component: DocTidakMemilikiRumah },
  { id: 'bjb_kom_5', code: 'PASANGAN', title: 'Surat Pernyataan Tidak Memiliki Pekerjaan (Pasangan)', component: DocTidakBekerjaPasangan },
  { id: 'bjb_kom_6', code: 'BLOK', title: 'Lampiran Blok Unit Yang Dibiayai', component: DocBlokUnitDibiayai },
  { id: 'bjb_kom_7', code: 'CHECKLIST', title: 'Checklist Dokumen bjb KPR Komersil', component: (props) => <DocBjbChecklist {...props} isKomersil={true} /> },
];

export const BJB_UPDATE_DOCS: DocumentItemDef[] = [
  { id: 'bjb_upd_1', code: 'FORMAT G', title: 'Format G : Surat Pernyataan Pemohon KPR Sejahtera', component: DocBjbFormatG },
  { id: 'bjb_upd_2', code: 'FORMAT H', title: 'Format H : Berita Acara Serah Terima Rumah Umum Tapak', component: (props) => <DocBAST {...props} formatCode="FORMAT H" /> },
  { id: 'bjb_upd_3', code: 'FORM Q', title: 'Form Q - Kantor Cabang : Surat Permohonan Pembayaran SBUM', component: DocBjbFormQ },
  { id: 'bjb_upd_4', code: 'LAMPIRAN 7', title: 'Lampiran 7 : Surat Pernyataan Kesediaan Pembayaran Kekurangan Uang Muka', component: DocBjbLampiran7 },
  { id: 'bjb_upd_5', code: 'LAMPIRAN 6', title: 'Lampiran 6 : Surat Kuasa Pendebetan SBUM', component: DocBjbLampiran6 },
  { id: 'bjb_upd_6', code: 'LAMPIRAN 3', title: 'Lampiran 3 : Surat Pengakuan Kekurangan Bayar Uang Muka', component: DocBjbLampiran3 },
  { id: 'bjb_upd_7', code: 'LAMPIRAN 2', title: 'Lampiran 2 : Surat Permohonan Subsidi Bantuan Uang Muka', component: DocBjbLampiran2 },
  { id: 'bjb_upd_8', code: 'BATAL FLPP', title: 'Surat Pernyataan Pembatalan Debitur FLPP', component: DocBjbPembatalanFlpp },
  { id: 'bjb_upd_9', code: 'BLOK', title: 'Lampiran Blok Unit Yang Dibiayai', component: DocBlokUnitDibiayai },
  { id: 'bjb_upd_10', code: 'LTV', title: 'Surat Pernyataan Calon Debitur Mengenai Urutan Fasilitas Kredit', component: DocBjbUrutanFasilitasKredit },
  { id: 'bjb_upd_11', code: 'CHECKLIST', title: 'Checklist Dokumen bjb KPR Sejahtera FLPP', component: (props) => <DocBjbChecklist {...props} isKomersil={false} /> },
  { id: 'bjb_upd_12', code: 'PENGHASILAN', title: 'Surat Pernyataan Penghasilan', component: DocPernyataanPenghasilan },
  { id: 'bjb_upd_13', code: 'RUMAH', title: 'Surat Pernyataan Tidak Memiliki Rumah', component: DocTidakMemilikiRumah },
  { id: 'bjb_upd_14', code: 'PASANGAN', title: 'Surat Pernyataan Tidak Memiliki Pekerjaan (Pasangan)', component: DocTidakBekerjaPasangan },
];

export const BRI_UPDATE_DOCS: DocumentItemDef[] = [
  { id: 'bri_upd_1', code: 'PERNYATAAN BRI', title: 'Surat Pernyataan Pemohon KPR Bersubsidi (Bank BRI)', component: DocBriPernyataanPemohon },
  { id: 'bri_upd_2', code: 'SBUM', title: 'Surat Permohonan Subsidi Bantuan Uang Muka (SBUM KemenPUPR)', component: DocBjbLampiran2 },
  { id: 'bri_upd_3', code: 'KEKURANGAN UM', title: 'Surat Pengakuan Kekurangan Bayar Uang Muka', component: DocBjbLampiran3 },
  { id: 'bri_upd_4', code: 'STATUS RUMAH', title: 'Surat Pernyataan Status Kepemilikan Rumah', component: DocBriStatusKepemilikanRumah },
  { id: 'bri_upd_5', code: 'RUMAH', title: 'Surat Pernyataan Tidak Memiliki Rumah', component: DocTidakMemilikiRumah },
  { id: 'bri_upd_6', code: 'PENGHASILAN', title: 'Surat Pernyataan Penghasilan', component: DocPernyataanPenghasilan },
  { id: 'bri_upd_7', code: 'PASANGAN', title: 'Surat Pernyataan Tidak Bekerja / Tidak Mempunyai Pekerjaan (Pasangan)', component: DocTidakBekerjaPasangan },
  { id: 'bri_upd_8', code: 'BAST', title: 'Berita Acara Serah Terima Rumah Umum Tapak', component: (props) => <DocBAST {...props} formatCode="BERITA ACARA SERAH TERIMA" /> },
  { id: 'bri_upd_9', code: 'BLOK', title: 'Lampiran Blok Unit Yang Dibiayai', component: DocBlokUnitDibiayai },
];

export const BTN_UPDATE_DOCS: DocumentItemDef[] = [
  { id: 'btn_upd_1', code: 'LAMPIRAN III', title: 'Lampiran III : Surat Pernyataan Persetujuan Penyaluran KPR Sejahtera FLPP TA 2026', component: DocBtnLampiran3 },
  { id: 'btn_upd_2', code: 'LAMPIRAN IV', title: 'Lampiran IV : Surat Pernyataan Developer (PT. LAN SENA JAYA)', component: DocBtnLampiran4 },
  { id: 'btn_upd_3', code: 'LAMPIRAN VII', title: 'Lampiran VII : Surat Pernyataan Penyerahan SPT PPH', component: DocBtnLampiran7 },
  { id: 'btn_upd_4', code: 'LAMPIRAN VIII', title: 'Lampiran VIII : Berita Acara Serah Terima Rumah Umum Tapak (BAST)', component: (props) => <DocBAST {...props} formatCode="LAMPIRAN VIII" /> },
  { id: 'btn_upd_5', code: 'LAMPIRAN X', title: 'Lampiran X : Surat Pernyataan Verifikasi Bank BTN', component: DocBtnLampiran10 },
  { id: 'btn_upd_6', code: 'LAMPIRAN XI', title: 'Lampiran XI : Surat Kuasa (Rek Developer PT. LAN SENA JAYA)', component: DocBtnLampiran11Kuasa },
  { id: 'btn_upd_7', code: 'LAMPIRAN XIII', title: 'Lampiran XIII : Surat Permohonan Subsidi Bantuan Uang Muka (SBUM)', component: DocBtnLampiran13 },
  { id: 'btn_upd_8', code: 'LAMPIRAN XIV', title: 'Lampiran XIV : Surat Pengakuan Kekurangan Bayar Uang Muka', component: DocBtnLampiran14 },
  { id: 'btn_upd_9', code: 'STANDING INSTRUCTION', title: 'Standing Instruction (Perintah Pemindahbukuan SBUM)', component: DocBtnStandingInstruction },
  { id: 'btn_upd_10', code: 'KUASA DEBET', title: 'Surat Kuasa Pendebetan Dana', component: DocBtnKuasaPendebetanDana },
  { id: 'btn_upd_11', code: 'PENGHUNIAN', title: 'Surat Pernyataan Penghunian Rumah Umum Bersubsidi', component: DocBtnPenghunianRumah },
  { id: 'btn_upd_12', code: 'RUMAH', title: 'Surat Pernyataan Tidak Memiliki Rumah', component: DocTidakMemilikiRumah },
  { id: 'btn_upd_13', code: 'PENGHASILAN', title: 'Surat Pernyataan Penghasilan', component: DocPernyataanPenghasilan },
  { id: 'btn_upd_14', code: 'PASANGAN', title: 'Surat Pernyataan Tidak Bekerja / Tidak Mempunyai Pekerjaan (Pasangan)', component: DocTidakBekerjaPasangan },
  { id: 'btn_upd_15', code: 'LAMPIRAN VI', title: 'Lampiran VI : Surat Pernyataan Pemohon KPR Bersubsidi (Format PUPR)', component: DocBtnLampiran6PUPR },
  { id: 'btn_upd_16', code: 'LAMPIRAN XI SP3K', title: 'Lampiran XI : Surat Pernyataan Pemohon KPR Bersubsidi BTN (Internal SP3K)', component: DocBtnLampiran11Internal },
  { id: 'btn_upd_17', code: 'BLOK', title: 'Lampiran Blok Unit Yang Dibiayai', component: DocBlokUnitDibiayai },
];

export const BANK_PACKAGES_CONFIG: Record<BankPackageType, { title: string; subtitle: string; color: string; docs: DocumentItemDef[] }> = {
  bjb_komersil: {
    title: 'bjb komersil',
    subtitle: 'KPR Non-Subsidi / Komersil bank bjb',
    color: 'bg-blue-600',
    docs: BJB_KOMERSIL_DOCS
  },
  bjb_update: {
    title: 'bjb update',
    subtitle: 'KPR Sejahtera FLPP / Subsidi bank bjb',
    color: 'bg-emerald-600',
    docs: BJB_UPDATE_DOCS
  },
  bri_update: {
    title: 'bri update',
    subtitle: 'KPR Sejahtera FLPP / Subsidi Bank BRI',
    color: 'bg-orange-600',
    docs: BRI_UPDATE_DOCS
  },
  btn_update: {
    title: 'btn update',
    subtitle: 'KPR Sejahtera FLPP / Subsidi Bank BTN 2026',
    color: 'bg-purple-600',
    docs: BTN_UPDATE_DOCS
  }
};
