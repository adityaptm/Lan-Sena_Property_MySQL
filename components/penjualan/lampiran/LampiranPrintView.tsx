import React from 'react';
import { Customer, Bank, Unit, Block, Location, Sale } from '@/types';
import { formatTanggalIndonesia, formatRupiah } from '@/lib/format';

export interface LampiranDataProps {
  no: number;
  sale?: Sale;
  customer?: Customer;
  bank?: Bank;
  unit?: Unit;
  block?: Block;
  location?: Location;
}

export function LampiranPrintView({
  no,
  sale,
  customer,
  bank,
  unit,
  block,
  location,
}: LampiranDataProps) {
  if (!customer) return null;

  const todayStr = formatTanggalIndonesia(new Date());
  const pengembang = "PT. LAN SENA JAYA";
  const perumahanNama = location?.nama_lokasi || "Benteng Mutiara Mas";
  const unitBlok = block?.nama_blok || "-";
  const unitNo = unit?.no_unit || "-";
  const unitTipe = unit?.unit_type_nama || (unit?.luas_bangunan && unit?.luas_tanah ? `${unit.luas_bangunan}/${unit.luas_tanah}` : "30/60");
  const unitAlamat = location?.alamat || "Kp Babakan Situ RT/RW 004/002 Ds Benteng Kec. Campaka Kab. Purwakarta";
  const customerAlamat = customer.alamat_ktp || customer.alamat || "-";
  const spouseAlamat = customer.alamat_domisili_pasangan || customer.alamat_domisili || customerAlamat;
  const isMenikah = customer.status_pernikahan === 'Menikah' || !!customer.nama_pasangan;
  const bankNama = bank?.nama_bank ? `${bank.nama_bank} ${bank.cabang ? 'KC ' + bank.cabang : ''}` : 'Bank BTN KC Purwakarta';
  const hargaJual = formatRupiah(sale?.total_harga || unit?.harga_dasar || 0);
  const uangMuka = formatRupiah(sale?.dp_nominal ?? (sale as any)?.uang_muka ?? unit?.uang_muka ?? 0);

  return (
    <div id="printable-lampiran-container" className="a4-document text-black leading-tight text-[9.5pt] font-sans">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 12mm 15mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            font-size: 9pt !important;
            line-height: 1.25 !important;
          }
          header, aside, nav, .no-print, .modal-backdrop, .action-bar {
            display: none !important;
          }
          #printable-lampiran-container {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
          }
          .page-single {
            max-height: 100vh !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* ── LAMPIRAN 1 (SURAT PERNYATAAN PENYERAHAN DATA) ── */}
      {no === 1 && (
        <div className="page-single space-y-2 text-[8.5pt] leading-tight">
          <div className="flex justify-between items-center">
            <span className="font-bold underline text-xs">LAMPIRAN 1</span>
            <span className="text-[8.5pt]">(Pemohon FLPP)</span>
          </div>

          <div className="text-center font-bold">
            <p className="text-sm underline tracking-wide">SURAT PERNYATAAN PENYERAHAN DATA</p>
          </div>

          <p>Saya, yang bertanda-tangan di bawah ini :</p>

          <table className="w-full text-[8.5pt]">
            <tbody>
              <tr><td className="w-36 py-0.5">Nama</td><td className="w-4">:</td><td>{customer.nama}</td></tr>
              <tr><td className="py-0.5">Tempat, Taggal Lahir</td><td>:</td><td>{customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}</td></tr>
              <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{customer.pekerjaan || '-'}</td></tr>
              <tr><td className="py-0.5">NIK</td><td>:</td><td>{customer.nik || '-'}</td></tr>
              <tr><td className="py-0.5">Alamat Domisili</td><td>:</td><td>{customer.alamat_domisili || '-'}</td></tr>
              <tr><td className="py-0.5 align-top">Alamat Sesuai KTP</td><td className="align-top">:</td><td className="align-top">{customerAlamat}</td></tr>
              <tr><td className="py-0.5">Nomor Telepon/HP</td><td>:</td><td>{customer.no_hp || '-'}</td></tr>
              <tr><td className="py-0.5">Alamat email</td><td>:</td><td>{customer.email || ''}</td></tr>
            </tbody>
          </table>
          <p className="text-[8pt] italic -mt-1">Selaku Pemohon.</p>

          <table className="w-full text-[8.5pt] mt-1">
            <tbody>
              <tr><td className="w-36 py-0.5">Nama</td><td className="w-4">:</td><td>{customer.nama_pasangan || '-'}</td></tr>
              <tr><td className="py-0.5">Tempat/tgl lahir</td><td>:</td><td>{customer.tempat_lahir_pasangan || '-'}, {customer.tanggal_lahir_pasangan ? formatTanggalIndonesia(customer.tanggal_lahir_pasangan) : '-'}</td></tr>
              <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{customer.pekerjaan_pasangan || '-'}</td></tr>
              <tr><td className="py-0.5">NIK</td><td>:</td><td>{customer.nik_pasangan || '-'}</td></tr>
              <tr><td className="py-0.5 align-top">Alamat Domisili</td><td className="align-top">:</td><td className="align-top">{spouseAlamat || '-'}</td></tr>
            </tbody>
          </table>
          <p className="text-[8pt] italic -mt-1">Selaku suami/istri pemohon.</p>

          <p className="font-medium pt-1">Bersama ini;</p>
          <div className="space-y-1 text-justify text-[8pt] leading-snug">
            <p>Menyatakan telah mengetahui, memahami dan menyanggupi untuk memenuhi seluruh ketentuan dan persyaratan Pusat Pengelolaan Dana Pembiayaan Perumahan (PPDPP) untuk mendapatkan fasilitas KPR Sejahtera.</p>
            <p>Menyampaikan semua data pribadi (KTP, NPWP, Pas Photo) untuk mendapatkan fasilitas KPR Sejahtera dan semua data lainnya yang diperlukan oleh PPDPP melalui Bank BTN, serta menjamin bahwa semua data yang saya sampaikan tersebut adalah benar dan dapat dipertanggungjawabkan keabsahannya.</p>
            <p>Memberikan kuasa kepada PPDPP untuk mengakses semua data pribadi saya yang terkait data FLPP yang ada di Bank BTN.</p>
            <p>Apabila dikemudian hari pernyataan saya ini tidak benar dan/atau tidak saya penuhi, saya bersedia mengembalikan seluruh subsidi yang telah saya terima dari Pemerintah dan bersedia dikenakan sanksi sesuai dengan ketentuan peraturan perundang-undangan.</p>
            <p>Memberikan persetujuan kepada Bank BTN untuk memberikan semua data pribadi saya yang terdapat di Bank BTN kepada PPDPP.</p>
          </div>

          <p className="text-justify text-[8pt] pt-1">Demikian surat pernyataan ini saya buat dengan sebenar-benarnya tanpa paksaan dari pihak manapun.</p>

          <div className="pt-2">
            <p className="text-right text-[8.5pt] mb-1">Purwakarta, .........................................</p>
            <div className="grid grid-cols-2 gap-4 text-center text-[8.5pt]">
              <div>
                <p>Yang Menyetujui,</p>
                <div className="h-12" />
                <p className="font-semibold underline">({customer.nama_pasangan || 'ILA ROKHMAH'})</p>
              </div>
              <div>
                <p>Yang Membuat Pernyataan,</p>
                <div className="h-12 flex items-center justify-center text-[7.5pt] text-slate-400">
                  <span className="border border-dashed border-slate-400 px-1.5 py-0.5 rounded">Materai 10000</span>
                </div>
                <p className="font-semibold underline">({customer.nama})</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LAMPIRAN 2 (SURAT PERNYATAAN PENGHUNINAN RUMAH UMUM BERSUBSIDI) ── */}
      {no === 2 && (
        <div className="page-single space-y-2 text-[8.5pt] leading-tight">
          <div className="text-left">
            <span className="font-bold underline text-xs">LAMPIRAN 2</span>
          </div>

          <div className="text-center font-bold">
            <p className="text-xs uppercase underline tracking-wide">SURAT PERNYATAAN PENGHUNINAN RUMAH UMUM BERSUBSIDI</p>
          </div>

          <p>Yang bertanda-tangan di bawah ini :</p>

          <table className="w-full text-[8.5pt]">
            <tbody>
              <tr><td className="w-36 py-0.5">Nama Lengkap</td><td className="w-4">:</td><td>{customer.nama}</td></tr>
              <tr><td className="py-0.5">No KTP</td><td>:</td><td>{customer.nik || '-'}</td></tr>
              <tr><td className="py-0.5">Tempat, Tanggal Lahir</td><td>:</td><td>{customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}</td></tr>
              <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{customer.pekerjaan || '-'}</td></tr>
              <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{customerAlamat}</td></tr>
            </tbody>
          </table>

          <p>Selaku Debitur KPR Bersubsidi BTN menyatakan dengan sesungguhnya bahwa:</p>

          <div className="space-y-1 text-justify text-[8pt] leading-snug">
            <div className="flex gap-2">
              <span className="w-4 flex-shrink-0">1.</span>
              <p>Saya telah memahami ketentuan penghunian rumah sejahtera sebagaimana dimaksud di dalam Peraturan Menteri Pekerjaan Umum dan Perumahan Rakyat.</p>
            </div>
            <div className="flex gap-2">
              <span className="w-4 flex-shrink-0">2.</span>
              <div>
                <p>Saya menyatakan bahwa :</p>
                <div className="pl-3 space-y-0.5 mt-0.5">
                  <p>o berpenghasilan tidak melebihi batas penghasilan kelompok sasaran KPR Bersubsidi;</p>
                  <p>o saya dan istri/suami*) tidak memiliki rumah;</p>
                  <p>o saya dan istri/suami*) tidak pernah menerima subsidi kepemilikan rumah.</p>
                  <p>o menggunakan sendiri dan menghuni rumah umum tapak atau sarusun umum sebagai tempat tinggal dalam jangka waktu paling lambat 1 (satu) tahun setelah serah terima rumah.</p>
                  <p>o tidak akan menyewakan dan/atau mengalihkan kepemilikan rumah umum tapak atau sarusun umum dengan bentuk perbuatan hukum apapun, kecuali sesuai dengan ketentuan Peraturan Menteri Pekerjaan Umum dan Perumahan Rakyat.</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="w-4 flex-shrink-0">3.</span>
              <p>Bahwa semua dokumen persyaratan yang disampaikan kepada Bank BTN untuk memperoleh KPR Bersubsidi BTN adalah benar dan dapat dipertanggungjawabkan keabsahaannya.</p>
            </div>
            <div className="flex gap-2">
              <span className="w-4 flex-shrink-0">4.</span>
              <p>Apabila di kemudian hari pernyataan ini tidak benar dan/atau tidak saya penuhi, saya bersedia dan memeberikan kuasa kepada Bank BTN untuk menghentikan fasilitas KPR Bersubsidi BTN dan/atau mengubah menjadi KPR BTN Non-Subsidi, setelah Bank BTN menerima surat permintaan penghentian KPR Bersubsidi dari pihak yang berwenang.</p>
            </div>
            <div className="flex gap-2">
              <span className="w-4 flex-shrink-0">5.</span>
              <p>Saya bersedia untuk menanggung segala biaya yang meliputi biaya asuransi, biaya pengikatan agunan, dan biaya lainnya yang timbul atas penghentian KPR Bersubsidi BTN</p>
            </div>
          </div>

          <p className="text-justify text-[8pt] pt-1">Demikian surat pernyataan ini saya buat dengan sebenar-benarnya tanpa paksaan dari pihak manapun.</p>

          <div className="pt-1">
            <p className="text-right text-[8.5pt] mb-1">Purwakarta, .........................................</p>
            <div className="grid grid-cols-2 gap-4 text-center text-[8.5pt]">
              <div>
                <p>Yang Menyetujui,</p>
                <div className="h-10" />
                <p className="font-semibold underline">({customer.nama_pasangan || 'ILA ROKHMAH'})</p>
              </div>
              <div>
                <p>Yang Membuat Pernyataan,</p>
                <div className="h-10 flex items-center justify-center text-[7.5pt] text-slate-400">
                  <span className="border border-dashed border-slate-400 px-1.5 py-0.5 rounded">Materai secukupnya</span>
                </div>
                <p className="font-semibold underline">({customer.nama})</p>
              </div>
            </div>

            <div className="text-center text-[8pt] mt-2">
              <p>Mengetahui,</p>
              <p className="font-bold">PT. BANK TABUNGAN NEGARA (PERSERO) tbk.</p>
              <p className="font-bold">KANTOR CABANG {bank?.cabang ? bank.cabang.toUpperCase() : 'KARAWANG'}</p>
            </div>
            <p className="text-[7pt] italic text-slate-500">*) coret yang tidak perlu</p>
          </div>
        </div>
      )}

      {/* ── LAMPIRAN 3 (SURAT KUASA PENDEBATAN DANA) ── */}
      {no === 3 && (
        <div className="page-single space-y-2 text-[8.5pt] leading-tight">
          <div className="text-left">
            <span className="font-bold underline text-xs">LAMPIRAN 3</span>
          </div>

          <div className="text-center font-bold">
            <p className="text-sm underline tracking-wide">SURAT KUASA PENDEBATAN DANA</p>
          </div>

          <p>Yang bertanda-tangan di bawah ini :</p>

          <table className="w-full text-[8.5pt]">
            <tbody>
              <tr><td className="w-36 py-0.5">Nama Lengkap</td><td className="w-4">:</td><td>{customer.nama}</td></tr>
              <tr><td className="py-0.5">No KTP</td><td>:</td><td>{customer.nik || '-'}</td></tr>
              <tr><td className="py-0.5">Tempat/tgl lahir</td><td>:</td><td>{customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}</td></tr>
              <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{customer.pekerjaan || '-'}</td></tr>
              <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{customerAlamat}</td></tr>
            </tbody>
          </table>

          <div className="space-y-2 text-justify text-[8.5pt] leading-normal pt-1">
            <p>yang dalam hal ini bertindak untuk dan atas nama sendiri, Selanjutnya disebut <strong>&quot;Pemberi Kuasa&quot;</strong>.</p>
            <p>PT. Bank Tangunan Negara (Persero) Tbk, berkedudukan di Jalan Gajah Mada No. 01 Jakarta Pusat yang dalam hal ini diwakili oleh ........................................................... selaku ........................................................... di PT. Bank Tabungan Negara (Persero) Tbk. Kantor Cabang ............................................................ Selanjutnya disebut <strong>&quot;Penerima Kuasa&quot;</strong>.</p>
            <p>Dengan ini Pemberi Kuasa memberi kuasa kepada Penerima Kuasa untuk melakukan pendebatan dana pada Nomor Rekening Tabungan Pemberi Kuasa dengan nomor {customer.nomor_rekening_kpr || '...........................................................'} atas nama {customer.nama || '...........................................................'} atas biaya asuransi, biaya pengikatan agunan, dan biaya lainnya yang timbul atas penghentian KPR Bersubsidi BTN.</p>
            <p>Kuasa ini diberikan dengan Hak Substitusi, tidak dapat dicabut kembali dan tidak akan berakhir karena sebab-sebab yang tercantum dalam pasal 1813 Kitab Undang-undang 1 Hukum Perdata atau karena sebab apapun juga.</p>
          </div>

          <div className="pt-3">
            <p className="text-right text-[8.5pt] mb-1">Purwakarta,..........................................</p>
            <div className="grid grid-cols-2 gap-4 text-center text-[8.5pt]">
              <div>
                <p className="font-semibold">PENERIMA KUASA,</p>
                <p className="text-[8pt]">PT. BANK TABUNGAN NEGARA (Persero) Tbk</p>
                <p className="text-[8pt]">Kantor Cabang .........................</p>
                <div className="h-12" />
                <p>(.....................................................)</p>
              </div>
              <div>
                <p className="font-semibold">PEMBERI KUASA,</p>
                <p className="text-[8pt]">&nbsp;</p>
                <div className="h-12 flex items-center justify-center text-[7.5pt] text-slate-400">
                  <span className="border border-dashed border-slate-400 px-1.5 py-0.5 rounded">Materai secukupnya</span>
                </div>
                <p className="font-semibold underline">({customer.nama})</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LAMPIRAN 5 (SURAT PERNYATAAN PENYERAHAN SPT PPH) ── */}
      {no === 5 && (
        <div className="page-single space-y-2 text-[8.5pt] leading-tight">
          <div className="text-left">
            <span className="font-bold underline text-xs">LAMPIRAN 5</span>
          </div>

          <div className="text-center font-bold">
            <p className="text-sm underline tracking-wide">SURAT PERNYATAAN PENYERAHAN SPT PPH</p>
          </div>

          <p>Yang bertanda-tangan di bawah ini :</p>

          <table className="w-full text-[8.5pt]">
            <tbody>
              <tr><td className="w-36 py-0.5">Nama</td><td className="w-4">:</td><td>{customer.nama}</td></tr>
              <tr><td className="py-0.5">Tempat, Tanggal Lahir</td><td>:</td><td>{customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}</td></tr>
              <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{customer.pekerjaan || '-'}</td></tr>
              <tr><td className="py-0.5">No KTP</td><td>:</td><td>{customer.nik || '-'}</td></tr>
              <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{customerAlamat}</td></tr>
            </tbody>
          </table>

          <p className="font-medium pt-1">Menyatakan hal-hal sebagai berikut:</p>

          <div className="space-y-1.5 text-justify text-[8pt] leading-snug">
            <div className="flex gap-2">
              <span className="w-4 flex-shrink-0">1.</span>
              <p>Bahwa dikarenakan saya memiliki NPWP kurang dari 1 (satu) tahun pada saat pengajuan KPR Bersubsidi, maka saya belum dapat menyampaikan Surat Pemberitahuan Tahunan (SPT) Pajak Penghasilan (PPh) Orang Pribadi sebagai salah satu dokumen persyaratan pengajuan KPR Bersubsidi sebagaimana telah diatur oleh ketentuan Pemerintah.</p>
            </div>
            <div className="flex gap-2">
              <span className="w-4 flex-shrink-0">2.</span>
              <p>Bahwa saya bersedia menyampaikan dokumen SPT tahun berikutnya setelah akad kredit KPR Bersubsidi kepada Bank BTN.</p>
            </div>
            <div className="flex gap-2">
              <span className="w-4 flex-shrink-0">3.</span>
              <p>Bahwa saya bersedia menerima konsekuensi yang diberikan oleh Pemerintah dalam hal saya terlambat dan/atau tidak menyerahkan dokumen SPT tahun berikutnya setelah akad kredit KPR Bersubsidi kepada Bank BTN.</p>
            </div>
          </div>

          <p className="text-justify text-[8pt] pt-1">
            Demikian surat pernyataan ini saya buat dengan sebenarnya tanpa paksaan dari pihak manapun dan apabila di kemudian hari pernyataan saya ini tidak benar, saya bersedia mengembalikan seluruh subsidi yang saya terima.
          </p>

          <div className="pt-3 flex justify-end">
            <div className="w-60 text-center text-[8.5pt]">
              <p>Purwakarta, .........................................</p>
              <p className="mt-0.5">Yang Membuat Pernyataan,</p>
              <div className="h-12 flex items-center justify-center text-[7.5pt] text-slate-400">
                <span className="border border-dashed border-slate-400 px-1.5 py-0.5 rounded">Materai secukupnya</span>
              </div>
              <p className="font-semibold underline">({customer.nama})</p>
            </div>
          </div>
        </div>
      )}

      {/* ── LAMPIRAN 4 ── */}
      {no === 4 && (
        <div className="page-single space-y-2.5">
          <div className="text-center font-bold">
            <p className="text-xs">LAMPIRAN 4</p>
            <p className="text-sm">BERITA ACARA SERAH TERIMA</p>
            <p className="text-sm">RUMAH SEJAHTERA TAPAK</p>
            <p className="text-xs font-normal">No ........................................</p>
          </div>

          <p className="text-justify text-[9pt]">
            Berdasarkan PPJB/AJB*) No ..................... tanggal ........................................ telah dilakukan serah terima pada tanggal ........................................ dari Pengembang {pengembang}, selanjutnya disebut <strong>&quot;Pihak Pertama&quot;</strong>;
          </p>

          <div>
            <p className="font-semibold text-[9pt]">Kepada pembeli :</p>
            <table className="w-full text-[9pt] mt-0.5">
              <tbody>
                <tr><td className="w-32 py-0.5">Nama</td><td className="w-4">:</td><td className="font-semibold">{customer.nama}</td></tr>
                <tr><td className="py-0.5">NIK</td><td>:</td><td>{customer.nik || '-'}</td></tr>
                <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{customerAlamat}</td></tr>
                <tr><td className="py-0.5">No Telp/HP</td><td>:</td><td>{customer.no_hp || '-'}</td></tr>
              </tbody>
            </table>
            <p className="text-[9pt] mt-0.5">selanjutnya disebut <strong>&quot;Pihak Kedua&quot;</strong></p>
          </div>

          <div>
            <p className="text-[9pt]">Atas 1 (satu) unit Rumah Umum Tapak pada lokasi sebagai berikut:</p>
            <table className="w-full text-[9pt] mt-0.5">
              <tbody>
                <tr><td className="w-6">1</td><td className="w-48 py-0.5">Nama Perumahan</td><td className="w-4">:</td><td className="font-semibold">{perumahanNama}</td></tr>
                <tr><td>2</td><td className="py-0.5">No Rumah</td><td>:</td><td className="font-semibold">BLOK {unitBlok} No {unitNo}</td></tr>
                <tr><td>3</td><td className="py-0.5">Luas Tanah dan Lantai Rumah</td><td>:</td><td>{unitTipe}</td></tr>
                <tr><td className="align-top">4</td><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{unitAlamat}</td></tr>
              </tbody>
            </table>
            <p className="text-[9pt] mt-0.5">Selanjutnya disebut <strong>&quot;Obyek Serah Terima&quot;</strong>.</p>
          </div>

          <div>
            <p className="text-[9pt]">Obyek Serah Terima dengan kondisi laik fungsi dan dilengkapi dengan:</p>
            <ol className="list-decimal pl-5 text-[8.5pt] space-y-0.5 mt-0.5">
              <li>Jaringan air bersih sudah berfungsi;</li>
              <li>Jaringan listrik sudah berfungsi;</li>
              <li>Jalan lingkungan sudah selesai dan berfungsi;</li>
              <li>Saluran air limbah/air kotor rumah tangga sudah selesai dan berfungsi; dan</li>
              <li>Sarana pewadahan sampah individual dan tempat pembuangan sampah sementara.</li>
            </ol>
          </div>

          <p className="text-justify text-[9pt]">
            Demikian berita acara serah terima ini ditandatangani oleh kedua belah pihak dan dapat dipertanggungjawabkan.
          </p>

          <div className="pt-2 text-[9pt]">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p>Pihak Pertama/Kuasa*,</p>
                <p className="font-semibold mt-0.5">{pengembang}</p>
                <div className="h-14" />
                <p>( ....................................... )</p>
              </div>
              <div>
                <p>Pihak Kedua,</p>
                <p className="mt-0.5">&nbsp;</p>
                <div className="h-14" />
                <p className="font-semibold underline">( {customer.nama} )</p>
              </div>
            </div>
            <p className="text-[7.5pt] italic text-slate-500 mt-1">*) coret yang tidak perlu</p>
          </div>
        </div>
      )}

      {/* ── LAMPIRAN 6 ── */}
      {no === 6 && (
        <div className="page-single space-y-2">
          <div className="text-center font-bold">
            <p className="text-xs">LAMPIRAN 6</p>
            <p className="text-xs uppercase max-w-lg mx-auto">
              SURAT PERNYATAAN PERSETUJUAN PENYALURAN KPR BERSUBSIDI TANPA MENGGUNAKAN SBUM
            </p>
          </div>

          <p className="text-[9pt]">Saya, yang bertanda-tangan di bawah ini :</p>
          <table className="w-full text-[8.5pt]">
            <tbody>
              <tr><td className="w-36 py-0.5">Nama</td><td className="w-4">:</td><td className="font-semibold">{customer.nama}</td></tr>
              <tr><td className="py-0.5">No KTP</td><td>:</td><td>{customer.nik || '-'}</td></tr>
              <tr><td className="py-0.5">Tempat/tgl lahir</td><td>:</td><td>{customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}</td></tr>
              <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{customer.pekerjaan || '-'}</td></tr>
              <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{customerAlamat}</td></tr>
            </tbody>
          </table>
          <p className="text-[8.5pt] italic">Selaku Pemohon.</p>

          <table className="w-full text-[8.5pt]">
            <tbody>
              <tr><td className="w-36 py-0.5">Nama</td><td className="w-4">:</td><td className="font-semibold">{customer.nama_pasangan || '-'}</td></tr>
              <tr><td className="py-0.5">No KTP</td><td>:</td><td>{customer.nik_pasangan || '-'}</td></tr>
              <tr><td className="py-0.5">Tempat/tgl lahir</td><td>:</td><td>{customer.tempat_lahir_pasangan || '-'}, {customer.tanggal_lahir_pasangan ? formatTanggalIndonesia(customer.tanggal_lahir_pasangan) : '-'}</td></tr>
              <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{customer.pekerjaan_pasangan || '-'}</td></tr>
              <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{spouseAlamat}</td></tr>
            </tbody>
          </table>
          <p className="text-[8.5pt] italic">Selaku suami/istri pemohon.</p>

          <p className="text-justify text-[8.5pt] leading-relaxed">
            Menyatakan dengan sesungguhnya bahwa sehubungan dengan belum dilakukannya kerja sama penyaluran Subsidi Bantuan Uang Muka Perumahan (SBUM) tahun 2021 atas fasilitas Kredit Pemilikan Rumah (KPR) Bersubsidi yang Saya dan istri/suami ajukan maka Saya dan istri/suami mengetahui dan menyetujui bahwa penyaluran KPR Bersubsidi dimaksud atas pembelian rumah umum tapak pada proyek perumahan <strong>{perumahanNama}</strong> Cluster <strong>{unitTipe}</strong> Blok/No <strong>BLOK {unitBlok}/{unitNo}</strong> yang dikembangkan oleh <strong>{pengembang}</strong> tidak difasilitasi oleh SBUM.
          </p>

          <p className="text-justify text-[8.5pt] leading-relaxed">
            Demikian surat pernyataan ini saya buat dengan sebenarnya tanpa paksaan dari pihak manapun dan apabila dikemudian hari pernyataan saya ini tidak benar, saya bersedia mengembalikan seluruh subsidi yang saya terima.
          </p>

          <div className="pt-1 text-[8.5pt]">
            <p className="text-right mb-1">Purwakarta, .........................................</p>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p>Menyetujui,</p>
                <div className="h-12" />
                <p className="font-semibold underline">( {customer.nama_pasangan || 'ILA ROKHMAH'} )</p>
              </div>
              <div>
                <p>Membuat Pernyataan,</p>
                <div className="h-12 flex items-center justify-center text-[7.5pt] text-slate-400">
                  <span className="border border-dashed border-slate-400 px-2 py-0.5 rounded">Materai 10000</span>
                </div>
                <p className="font-semibold underline">( {customer.nama} )</p>
              </div>
            </div>

            <div className="text-center mt-3">
              <p>Mengetahui,</p>
              <p className="font-semibold">Pengembang PT LAN SENA JAYA</p>
              <div className="h-12" />
              <p>( ................................................. )</p>
            </div>
          </div>
        </div>
      )}

      {/* ── LAMPIRAN 7 ── */}
      {no === 7 && (
        <div className="page-single space-y-2.5">
          <div className="text-center font-bold">
            <p className="text-xs underline">LAMPIRAN 7</p>
            <p className="text-sm underline">PERSYARATAN KELOMPOK SASARAN</p>
          </div>

          <table className="w-full text-[8pt] border-collapse border border-black">
            <thead>
              <tr className="bg-slate-100 text-center font-bold">
                <th rowSpan={3} className="border border-black px-1.5 py-1 w-8">NO</th>
                <th rowSpan={3} className="border border-black px-2 py-1 text-left">PERSYARATAN</th>
                <th colSpan={3} className="border border-black px-2 py-1">KELOMPOK SASARAN</th>
              </tr>
              <tr className="bg-slate-100 text-center font-bold">
                <th colSpan={2} className="border border-black px-2 py-0.5">KAWIN</th>
                <th rowSpan={2} className="border border-black px-2 py-0.5 w-16">LAJANG</th>
              </tr>
              <tr className="bg-slate-100 text-center font-bold">
                <th className="border border-black px-2 py-0.5 w-20">PEMOHON</th>
                <th className="border border-black px-2 py-0.5 w-20">PASANGAN</th>
              </tr>
            </thead>
            <tbody>
              {[
                { no: 1, text: "Kartu Tanda Penduduk (KTP)" },
                { no: 2, text: "Kartu Keluarga (KK)" },
                { no: 3, text: "Akta Nikah" },
                { no: 4, text: "Tidak memeiliki rumah *" },
                { no: 5, text: "Belum pernah menerima subsidi perolehan rumah berupa pemilikan rumah dari Pemerintah *" },
                { no: 6, text: "Nomor Pokok Wajib Pajak (NPWP) **" },
                { no: 7, text: "SPT tahunan PPh Orang Pribadi sesuai peraturan perundang-undangan ***" },
                { no: 8, text: "Penghasilan tidak melebihi batas penghasilan yang ditentukan **" },
                { no: 9, text: "Surat Pemesanan Rumah dari Pengembang yang paling sedikit memuat harga jual rumah dan alamat rumah" },
                { no: 10, text: "Surat pernyataan Pemohon" },
              ].map((row) => (
                <tr key={row.no} className="hover:bg-slate-50">
                  <td className="border border-black px-1.5 py-0.5 text-center font-semibold">{row.no}</td>
                  <td className="border border-black px-2 py-0.5">{row.text}</td>
                  <td className="border border-black px-2 py-0.5 text-center"></td>
                  <td className="border border-black px-2 py-0.5 text-center"></td>
                  <td className="border border-black px-2 py-0.5 text-center"></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-[7.5pt] text-slate-700 space-y-0.5 mt-3">
            <p className="font-semibold">Catatan :</p>
            <p>* dikecualikan untuk PNS/TNI/POLRI yang pindah domisili karena kepentingan dinas dan berlaku hanya sekali.</p>
            <p>** berstatus kawin hanya dipersyaratkan suami/istri.</p>
            <p>*** dikecualikan untuk penghasilan dibawah PTKP.</p>
          </div>
        </div>
      )}

      {/* ── LAMPIRAN 8 ── */}
      {no === 8 && (
        <div className="page-single space-y-2">
          <div className="text-center font-bold">
            <p className="text-xs underline">LAMPIRAN 8</p>
            <p className="text-sm underline">SURAT PERMOHONAN SUBSIDI BANTUAN UANG MUKA</p>
          </div>

          <div className="text-[8.5pt]">
            <p>Kepada Yth :</p>
            <p className="font-semibold">Kepala Satuan Kerja Direktorat Jenderal Pembiayaan Perumahan</p>
            <p>Kementrian Pekerjaan Umum dan Perumahan Rakyat</p>
            <p>Jalan Raden Patah 1 No 1 Lantai 2 Wing 3.</p>
            <p>Kebayoran Baru, Jakarta Selatan 12110</p>
            <p className="mt-1">Perihal : Permohonan Subsidi Bantuan Uang Muka (SBUM)</p>
          </div>

          <p className="text-[8.5pt]">Saya yang bertanda tangan dibawah ini :</p>
          <table className="w-full text-[8.5pt]">
            <tbody>
              <tr><td className="w-36 py-0.5">Nama</td><td className="w-4">:</td><td className="font-semibold">{customer.nama}</td></tr>
              <tr><td className="py-0.5">Tempat/tgl lahir</td><td>:</td><td>{customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}</td></tr>
              <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{customer.pekerjaan || '-'}</td></tr>
              <tr><td className="py-0.5">No KTP</td><td>:</td><td>{customer.nik || '-'}</td></tr>
              <tr><td className="py-0.5">Alamat</td><td>:</td><td>{customerAlamat}</td></tr>
            </tbody>
          </table>

          <p className="text-[8.5pt]">Mengajukan permohonan Subsidi Bantuan Uang Muka untuk pembelian rumah sejahtera tapak dengan keterangan sebagai berikut:</p>
          <table className="w-full text-[8.5pt]">
            <tbody>
              <tr><td className="w-36 py-0.5">Nama Pengembang</td><td className="w-4">:</td><td className="font-semibold">{pengembang}</td></tr>
              <tr><td className="py-0.5">Alamat Rumah Yang Dibeli</td><td>:</td><td>{unitAlamat}</td></tr>
              <tr><td className="py-0.5">Harga Jual Rumah</td><td>:</td><td>Rp {hargaJual}</td></tr>
              <tr><td className="py-0.5">Besaran Uang Muka</td><td>:</td><td>Rp {uangMuka}</td></tr>
              <tr><td className="py-0.5">Bank Pelaksana</td><td>:</td><td>{bankNama}</td></tr>
            </tbody>
          </table>

          <p className="text-justify text-[8.5pt]">
            Sebagai pertimbangan, bersama ini kami lampirkan dokumen fotokopi surat pengakuan kekurangan bayar uang muka pembelian rumah sejahtera tapak yang disetujui oleh ...........................................................*)
          </p>
          <p className="text-justify text-[8.5pt]">
            Dengan surat permohonan ini saya menyatakan telah memahami dan tunduk pada ketentuan Pemerintah yang mengatur Subsidi Bantuan Uang Muka (SBUM). Apabila dikemudian hari saya tidak dapat menjalankan ketentuan Pemerintah tersebut diatas yang mengakibatkan Pemerintah mencabut semua kemudahan dan subsidi terkait kemudahan dalam perolehan rumah, saya bersedia mengembalikan semua kemudahan dan subsidi yang telah saya terima tersebut.
          </p>
          <p className="text-[8.5pt]">Demikian kami sampaikan atas perhatiannya kami ucapkan terima kasih.</p>

          <div className="pt-2 text-[8.5pt] flex justify-end">
            <div className="text-center w-60">
              <p>Purwakarta, .........................................</p>
              <div className="h-14" />
              <p className="font-semibold underline">( {customer.nama} )</p>
            </div>
          </div>
          <p className="text-[7.5pt] italic text-slate-500">*) diisi dengan nama direktur atau yang mewakili pengembang dan nama perusahaan pengembang</p>
        </div>
      )}

      {/* ── LAMPIRAN 9 ── */}
      {no === 9 && (
        <div className="page-single space-y-2.5">
          <div className="text-center font-bold">
            <p className="text-xs underline">LAMPIRAN 9</p>
            <p className="text-sm underline">SURAT PENGAKUAN KEKURANGAN BAYAR UANG MUKA</p>
          </div>

          <p className="text-[9pt]">Saya, yang bertanda tangan di bawah ini :</p>
          <table className="w-full text-[9pt]">
            <tbody>
              <tr><td className="w-36 py-0.5">Nama</td><td className="w-4">:</td><td className="font-semibold">{customer.nama}</td></tr>
              <tr><td className="py-0.5">Tempat, Tanggal Lahir</td><td>:</td><td>{customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}</td></tr>
              <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{customer.pekerjaan || '-'}</td></tr>
              <tr><td className="py-0.5">No KTP</td><td>:</td><td>{customer.nik || '-'}</td></tr>
              <tr><td className="py-0.5">Alamat</td><td>:</td><td>{customerAlamat}</td></tr>
            </tbody>
          </table>

          <p className="text-justify text-[9pt]">
            Dengan ini menyatakan bahwa saya telah melakukan pembayaran uang muka sebesar Rp ....................................... (.............................................................. rupiah) dan masih meliliki kekurangan bayar uang muka sebesar Rp ....................................... (.............................................................. rupiah) untuk pembelian rumah sejahtera tapak kepada :
          </p>

          <table className="w-full text-[9pt]">
            <tbody>
              <tr><td className="w-36 py-0.5">Nama</td><td className="w-4">:</td><td className="font-semibold">{pengembang}</td></tr>
              <tr><td className="py-0.5">Alamat Rumah Yang Dibeli</td><td>:</td><td>{unitAlamat}</td></tr>
              <tr><td className="py-0.5">Harga Jual Rumah</td><td>:</td><td>Rp {hargaJual}</td></tr>
              <tr><td className="py-0.5">Besaran Uang Muka</td><td>:</td><td>Rp {uangMuka}</td></tr>
              <tr><td className="py-0.5">Bank Pelaksana</td><td>:</td><td>{bankNama}</td></tr>
            </tbody>
          </table>

          <p className="text-[9pt]">Demikian kami sampaikan, atas perhatiannya kami ucapkan terima kasih.</p>

          <div className="pt-2 text-[9pt]">
            <p className="text-right mb-1">Purwakarta, .........................................</p>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p>Menyetujui,</p>
                <p className="text-[8pt] text-slate-500">(Jabatan yang mewakili pengembang)</p>
                <div className="h-14" />
                <p>( .................................. )</p>
              </div>
              <div>
                <p>Pemohon,</p>
                <div className="h-14 flex items-center justify-center text-[8pt] text-slate-400">
                  <span className="border border-dashed border-slate-400 px-2 py-0.5 rounded">Materai secukupnya</span>
                </div>
                <p className="font-semibold underline">( {customer.nama} )</p>
              </div>
            </div>
            <p className="text-[7.5pt] italic text-slate-500 mt-2">*) diisi dengan nama direktur atau yang mewakili pengembang dan nama perusahaan/pengembang</p>
          </div>
        </div>
      )}

      {/* ── LAMPIRAN 10 ── */}
      {no === 10 && (
        <div className="page-single space-y-2">
          <div className="text-center font-bold">
            <p className="text-xs underline">LAMPIRAN 10</p>
            <p className="text-sm underline">SURAT KETERANGAN PEMINDAHBUKUAN DANA SBUM</p>
            <p className="text-xs font-bold underline">(STANDING INSTRUCTION)</p>
          </div>

          <p className="text-justify text-[8.5pt]">
            Sehubungan dengan permohonan dana Subsidi Bantuan Uang Muka (SBUM) kepada Kepala Satuan Kerja Derktorat Jendral Pembiayaan Perumahan Kementrian Pekerjaan Umum dan Perumahan Rakyat, maka saya yang bertanda yangan dibawah ini :
          </p>

          <table className="w-full text-[8.5pt]">
            <tbody>
              <tr><td className="w-36 py-0.5">Nama</td><td className="w-4">:</td><td className="font-semibold">{customer.nama}</td></tr>
              <tr><td className="py-0.5">NIK</td><td>:</td><td>{customer.nik || '-'}</td></tr>
              <tr><td className="py-0.5">Tempat, Tanggal Lahir</td><td>:</td><td>{customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}</td></tr>
              <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{customer.pekerjaan || '-'}</td></tr>
              <tr><td className="py-0.5">Alamat</td><td>:</td><td>{customerAlamat}</td></tr>
            </tbody>
          </table>

          <p className="text-justify text-[8.5pt]">
            Dengan ini memberikan kuasa kepada PT. Bank Tabungan Negara (Persero) Tbk. Kantor Cabang {bank?.cabang || 'Purwakarta'} Untuk melakukan pemindahbukuan pencairan dana Subsidi Bantuan Uang Muka (SBUM) senilai Rp ............................................., - (..........................................................................................) untuk digunakan sebagai pengurangan pokok kredit/pembayaran kekurangan uang muka pembelian Rumah Umum Tapak *), kepada :
          </p>

          <table className="w-full text-[8.5pt]">
            <tbody>
              <tr><td className="w-36 py-0.5">Nama Pengembang</td><td className="w-4">:</td><td className="font-semibold">{pengembang}</td></tr>
              <tr><td className="py-0.5">Nomor Rekening</td><td>:</td><td className="font-bold">00181-01-30-666-666-1</td></tr>
              <tr><td className="py-0.5">Rekening Atas Nama</td><td>:</td><td className="font-bold">{pengembang}</td></tr>
              <tr><td className="py-0.5">Pada Bank</td><td>:</td><td>Bank BTN Kantor Cabang/Kantor Kas {bank?.cabang || 'Purwakarta'}</td></tr>
            </tbody>
          </table>

          <p className="text-justify text-[8.5pt]">
            Demikian Standing Instruction ini dibuat tanpa adanya paksaan dari pihak manapun. Akibat apapun yang mungkin timbul dari paksaan penyaluran dana oleh PT. Bank Tabungan Negara (Persero) Tbk. Berdasarkan Standing Instruction ini adalah sepenuhnya menjadi tanggung jawab saya pribadi.
          </p>

          <div className="pt-2 text-[8.5pt]">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p>Menyetujui</p>
                <p className="font-semibold">PT. BANK TABUNGAN NEGARA (Persero) Tbk</p>
                <p>Kantor Cabang {bank?.cabang || 'Purwakarta'}</p>
                <div className="h-12" />
                <p>( ............................................................ )</p>
                <p className="text-[7pt] text-slate-500">Nama Lengkap, jabatan, Stempel</p>
              </div>
              <div>
                <p>Purwakarta, .........................................</p>
                <div className="h-12 flex items-center justify-center text-[7.5pt] text-slate-400">
                  <span className="border border-dashed border-slate-400 px-2 py-0.5 rounded">Materai secukupnya</span>
                </div>
                <p className="font-semibold underline">( {customer.nama} )</p>
                <p className="text-[7pt] text-slate-500">Nama Lengkap Pembuat SI</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LAMPIRAN 12 ── */}
      {no === 12 && (
        <div className="page-single space-y-2.5">
          <div className="text-center font-bold">
            <p className="text-xs underline">LAMPIRAN 12</p>
            <p className="text-sm underline">SURAT KUASA</p>
          </div>

          <p className="text-[9pt]">Saya, yang bertanda-tangan di bawah ini :</p>
          <table className="w-full text-[9pt]">
            <tbody>
              <tr><td className="w-36 py-0.5">Nama</td><td className="w-4">:</td><td className="font-semibold">{customer.nama}</td></tr>
              <tr><td className="py-0.5">Tempat/tgl lahir</td><td>:</td><td>{customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}</td></tr>
              <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{customer.pekerjaan || '-'}</td></tr>
              <tr><td className="py-0.5">NIK</td><td>:</td><td>{customer.nik || '-'}</td></tr>
              <tr><td className="py-0.5">Alamat</td><td>:</td><td>{customerAlamat}</td></tr>
            </tbody>
          </table>
          <p className="text-[9pt]">yang dalam hal ini bertindak untuk dan atas nama sendiri. Selanjutnya disebut : <strong>PEMBERI KUASA</strong></p>

          <p className="text-justify text-[9pt]">
            PT BANK TABUNGAN NEGARA (Persero) Tbk, berkedudukan di Jl. gajah Mada No. 1 jakarta Pusat yang dalam hal ini diwakili oleh ........................................................................ selaku ........................................................................ di PT. BANK TABUNGAN NEGARA (Persero) Kantor Cabang {bank?.cabang || 'Purwakarta'}. Selanjutnya disebut : <strong>PENERIMA KUASA</strong>.
          </p>

          <p className="text-justify text-[9pt]">
            Dengan ini PEMBERI KUASA memberi kuasa kepada PENERIMA KUASA untuk melakukan pendebetan pada Nomor Rekening Tabungan PEMBERI KUASA: {customer.nomor_rekening_kpr || '..........................................'} atas biaya asuransi, biaya pengikatan agunan, dan biaya lainnya yang timbul atas penghentian KPR Bersubsidi yang disebabkan oleh dokumen pernyataan yang saya buat tidak benar dan/atau tidak saya penuhi dalam proses pengajuan KPR Bersubsidi pada Bank BTN.
          </p>

          <p className="text-justify text-[9pt]">
            Kuasa ini diberikan dengan hak Substitusi, tidak dapat dicabut kembali dan tidak akan berakhir karena sebab - sebab yang tercantum dalam pasal 1813 Kitab Undang - Undang Hukum Perdata atau karena sebab apapun juga.
          </p>

          <div className="pt-3 text-[9pt]">
            <p className="text-right mb-1">Purwakarta, .........................................</p>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p>Penerima Kuasa</p>
                <p className="font-semibold">PT. BANK TABUNGAN NEGARA (Persero) Tbk</p>
                <p>Kantor Cabang {bank?.cabang || 'Purwakarta'}</p>
                <div className="h-14" />
                <p>( ..................................................... )</p>
              </div>
              <div>
                <p>Pemberi Kuasa,</p>
                <div className="h-14 flex items-center justify-center text-[7.5pt] text-slate-400">
                  <span className="border border-dashed border-slate-400 px-2 py-0.5 rounded">Materai secukupnya</span>
                </div>
                <p className="font-semibold underline">( {customer.nama} )</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LAMPIRAN 13 ── */}
      {no === 13 && (
        <div className="page-single space-y-2">
          <div className="text-center font-bold">
            <p className="text-xs underline">LAMPIRAN 13</p>
            <p className="text-sm underline">SURAT PERNYATAAN</p>
            <p className="text-sm underline">PRASARANA, SARANA &amp; UTILITAS PERUMAHAN</p>
          </div>

          <p className="text-[8.5pt]">Saya, yang bertanda-tangan di bawah ini :</p>
          <table className="w-full text-[8.5pt]">
            <tbody>
              <tr><td className="w-36 py-0.5">Nama</td><td className="w-4">:</td><td className="font-semibold">{customer.nama}</td></tr>
              <tr><td className="py-0.5">Tempat/tgl lahir</td><td>:</td><td>{customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}</td></tr>
              <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{customer.pekerjaan || '-'}</td></tr>
              <tr><td className="py-0.5">NIK</td><td>:</td><td>{customer.nik || '-'}</td></tr>
              <tr><td className="py-0.5">Alamat</td><td>:</td><td>{customerAlamat}</td></tr>
            </tbody>
          </table>
          <p className="text-[8.5pt] italic">Selaku calon debitur.</p>

          <table className="w-full text-[8.5pt]">
            <tbody>
              <tr><td className="w-36 py-0.5">Nama</td><td className="w-4">:</td><td className="font-semibold">{customer.nama_pasangan || '-'}</td></tr>
              <tr><td className="py-0.5">Tempat/tgl lahir</td><td>:</td><td>{customer.tempat_lahir_pasangan || '-'}, {customer.tanggal_lahir_pasangan ? formatTanggalIndonesia(customer.tanggal_lahir_pasangan) : '-'}</td></tr>
              <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{customer.pekerjaan_pasangan || '-'}</td></tr>
              <tr><td className="py-0.5">NIK</td><td>:</td><td>{customer.nik_pasangan || '-'}</td></tr>
              <tr><td className="py-0.5">Alamat</td><td>:</td><td>{spouseAlamat}</td></tr>
            </tbody>
          </table>
          <p className="text-[8.5pt] italic">Selaku suami/istri pemohon.</p>

          <p className="font-semibold text-[8.5pt]">Menyatakan hal-hal sebagai berikut:</p>
          <div className="space-y-1 text-[8.5pt]">
            <p>1. Saya telah mempertimbangkan dengan baik dan tanpa paksaan dari pihak manapun sebelum memutuskan untuk membeli 1 (satu) unit Rumah Sejahtera Tapak/Satuan Rumah Sejahtera Susun*) dari pengembang/developer {pengembang}</p>
            <p>2. Saya telah mengetahui dan bersedia menerima kondisi Rumah Sejahtera Tapak/Satuan Rumah Sejahtera Susun*) beserta dengan kondisi Prasarana, Sarana &amp; Utilitas (PSU) dengan rincian sebagai berikut:</p>
            <ul className="list-disc pl-6 space-y-0.5 text-[8pt]">
              <li>Telah ada bukti pembayaran biaya penyambunga listrik dari PLN.</li>
              <li>Telah tersedia sumber air yang berfungsi.</li>
              <li>Badan jalan telah dilakukan pengerasan.</li>
              <li>Saluran/drainase lingkungan telah tergali.</li>
            </ul>
            <p>3. Saya tidak akan mengkaitkan kondisi Prasarana, Sarana &amp; Utilitas (PSU) dengan kewajiban pembayaran angsuran KPR BTN Bersubsidi.*)</p>
          </div>

          <p className="text-justify text-[8.5pt]">
            Demikian surat pernyataan ini saya buat dengan sebenar-benarnya tanpa paksaan dari pihak manapun.
          </p>

          <div className="pt-2 text-[8.5pt]">
            <p className="text-right mb-1">Purwakarta, .........................................</p>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p>Menyetujui,</p>
                <div className="h-12" />
                <p className="font-semibold underline">( {customer.nama_pasangan || 'ILA ROKHMAH'} )</p>
              </div>
              <div>
                <p>Yang membuat pernyataan,</p>
                <div className="h-12 flex items-center justify-center text-[7.5pt] text-slate-400">
                  <span className="border border-dashed border-slate-400 px-2 py-0.5 rounded">Materai secukupnya</span>
                </div>
                <p className="font-semibold underline">( {customer.nama} )</p>
              </div>
            </div>
            <p className="text-[7.5pt] italic text-slate-500 mt-1">*) Pilih salah satu</p>
          </div>
        </div>
      )}

      {/* ── LAMPIRAN 14 ── */}
      {no === 14 && (
        <div className="page-single space-y-1.5 text-[8pt]">
          <div className="flex justify-between items-center">
            <span className="font-bold underline text-xs">LAMPIRAN 14</span>
            <span className="text-[7.5pt]">(Format Internal Bank)</span>
          </div>

          <div className="text-center font-bold">
            <p className="text-xs uppercase underline tracking-wide">SURAT PERNYATAAN PEMOHON KPR BERSUBSIDI BTN</p>
          </div>

          <p>Yang bertanda-tangan di bawah ini :</p>
          <table className="w-full text-[7.5pt]">
            <tbody>
              <tr><td className="w-32 py-0.2">Nama Lengkap</td><td className="w-4">:</td><td className="font-semibold">{customer.nama}</td></tr>
              <tr><td className="py-0.2">No KTP</td><td>:</td><td>{customer.nik || '-'}</td></tr>
              <tr><td className="py-0.2">Tempat/Tgl lahir</td><td>:</td><td>{customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}</td></tr>
              <tr><td className="py-0.2">Pekerjaan</td><td>:</td><td>{customer.pekerjaan || '-'}</td></tr>
              <tr><td className="py-0.2">Alamat</td><td>:</td><td>{customerAlamat}</td></tr>
            </tbody>
          </table>
          <p className="italic text-[7pt]">Selaku pemohon.</p>

          <table className="w-full text-[7.5pt]">
            <tbody>
              <tr><td className="w-32 py-0.2">Nama Lengkap</td><td className="w-4">:</td><td className="font-semibold">{customer.nama_pasangan || '-'}</td></tr>
              <tr><td className="py-0.2">No KTP</td><td>:</td><td>{customer.nik_pasangan || '-'}</td></tr>
              <tr><td className="py-0.2">Tempat/Tgl lahir</td><td>:</td><td>{customer.tempat_lahir_pasangan || '-'}, {customer.tanggal_lahir_pasangan ? formatTanggalIndonesia(customer.tanggal_lahir_pasangan) : '-'}</td></tr>
              <tr><td className="py-0.2">Pekerjaan</td><td>:</td><td>{customer.pekerjaan_pasangan || '-'}</td></tr>
              <tr><td className="py-0.2">Alamat</td><td>:</td><td>{spouseAlamat}</td></tr>
            </tbody>
          </table>
          <p className="italic text-[7pt]">Selaku suami/istri pemohon.</p>

          <p className="font-semibold">Menyatakan dengan sesungguhnya:</p>
          <ol className="list-decimal pl-4 space-y-0.5 text-[7.2pt]">
            <li>Saya selaku pemohon memiliki gaji/upah pokok/penghasil bersih/upah rata-rata*) perbulan sebesar Rp {formatRupiah(customer.pendapatan_per_bulan || 0)} (.............................................................. rupiah).</li>
            <li>Saya dan istri/suami*) tidak memiliki hak kepemilikan atas rumah pada saat pengajuan pembiayaan KPR Bersubsidi BTN.</li>
            <li>Saya dan istri/suami*) belum pernah menerima subsidi atau bantuan pembiayaan perumahan dari pemerintah terkait kredit/pembiayaan kepemilikan rumah dan/atau pembangunan rumah swadaya.</li>
            <li>Saya membeli Rumah Umum Tapak/Sarusun Umum dengan harga Rp {hargaJual} (.............................................................. rupiah) dari pengembang {pengembang}.</li>
            <li>Saya dan istri/suami*) akan menggunakan Rumah Umum Tapak/Sarusun Umum sebagai tempat tinggal saya dan/atau keluarga dalam kurun waktu paling lambat 1 (satu) tahun setelah terima rumah.</li>
            <li>
              Saya dan istri/suami*) tidak akan menyewakan/mengontrakkan, memperjual-belikan atau memindahtangankan dengan bentuk perbuatan hukum apapun, kecuali : penghunian telah melampaui 5 tahun (tapak)/20 tahun (sarusun), pindah tempat tinggal sesuai regulasi, pewarisan, atau penyelesaian kredit bermasalah Bank BTN.
            </li>
            <li>Bersedia melakukan aktivasi ulang QR Code sesuai tata cara yang ditentukan PPDPP dan/atau Satuan Kerja Kementrian PUPR setiap tahun ke 5 (lima) sejak akad.</li>
            <li>Bersedia memindahkan domisili kependudukan dalam KTP ke alamat agunan paling lambat 1 (satu) tahun sejak akad KPR Bersubsidi BTN.</li>
            <li>Semua dokumen persyaratan yang disampaikan kepada Bank BTN adalah benar dan dapat dipertanggungjawabkan keabsahannya.</li>
            <li>Apabila di kemudian hari pernyataan saya tidak benar, saya bersedia mengembalikan seluruh subsidi yang diterima dan dikenakan sanksi perundang-undangan.</li>
          </ol>

          <p className="text-[7.5pt]">Demikian surat pernyataan ini saya buat dengan sebenar-benarnya tanpa paksaan dari pihak manapun.</p>

          <div className="pt-1 text-[7.5pt]">
            <p className="text-right mb-0.5">Purwakarta, .........................................</p>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p>Menyetujui,</p>
                <div className="h-8" />
                <p className="font-semibold underline">({customer.nama_pasangan || 'ILA ROKHMAH'})</p>
              </div>
              <div>
                <p>Yang membuat pernyataan,</p>
                <div className="h-8 flex items-center justify-center text-[6.5pt] text-slate-400">
                  <span className="border border-dashed border-slate-400 px-1.5 py-0.2 rounded">Materai secukupnya</span>
                </div>
                <p className="font-semibold underline">({customer.nama})</p>
              </div>
            </div>

            <div className="text-center mt-1">
              <p>Mengetahui,</p>
              <p className="text-[7pt]">Pimpinan Tempat Bekerja/Kepala Desa/Lurah* ......................................</p>
              <div className="h-6" />
              <p>( ...................................... )</p>
            </div>
            <p className="text-[6.5pt] italic text-slate-500">*) Coret salah yang tidak perlu</p>
          </div>
        </div>
      )}

      {/* ── LAMPIRAN 11 (SURAT PERNYATAAN PENYELESAIAN PSU - FORMAT PERSIS GAMBAR) ── */}
      {no === 11 && (
        <div className="page-single space-y-2 text-[8.5pt]">
          <p className="font-bold underline text-[9.5pt]">LAMPIRAN 11</p>

          <div className="text-center font-bold text-[10.5pt] mb-3">
            <p className="underline">SURAT PERNYATAAN PENYELESAIAN</p>
            <p className="underline">PRASARANA, SARANA &amp; UTILITAS PERUMAHAN</p>
          </div>

          <p>Yang bertanda tangan dibawah ini:</p>

          <table className="w-full text-[8.5pt]">
            <tbody>
              <tr><td className="w-36 py-0.5">Nama</td><td className="w-4">:</td><td className="font-semibold">ALAN SUHERLAN</td></tr>
              <tr><td className="py-0.5">No. KTP</td><td>:</td><td>3214120810690001</td></tr>
              <tr><td className="py-0.5 align-top">Alamat Kantor/Telp</td><td className="align-top">:</td><td className="align-top">Perumahan Benteng Mutiara Mas Ruko No. 16 Kp babakan Situ 04/02 / 0264-8308460</td></tr>
              <tr>
                <td className="py-0.5 align-top">Jabatan</td>
                <td className="align-top">:</td>
                <td className="align-top">
                  <p>Direktur Utama yang mewakili PT LAN SENA JAYA</p>
                  <p>selaku pengembang pada proyek perumahan Benteng Mutiara Mas</p>
                </td>
              </tr>
            </tbody>
          </table>

          <p className="font-semibold mt-2">Menyatakan hal-hal sebagai berikut:</p>
          <div className="space-y-1 text-[8.5pt]">
            <p className="text-justify">
              1. Bahwa rumah sejahtera yang dijual oleh PT. LAN SENA JAYA dan diserah terimakan kepada debitur Bank BTN pada saat akad kredit adalah dalam kondisi siap huni dan telah memenuhi persyaratan teknis keselamatan, keamanan dan kehandalan bangunan sesuai dengan ketentuan Pemerintah yang berlaku.
            </p>
            <p className="text-justify">
              2. Bahwa pada saat surat pernyataan ini ditandatangani, PT LAN SENA JAYA telah menyerahkan bukti pembayaran biaya penyambungan listrik dari PLN dan jalan lingkungan telah dilakukan perkerasan badan jalan dan berfungsi.
            </p>
            <p className="text-justify">
              3. Bahwa PT LAN SENA JAYA bersedia menyelesaikan jalan lingkungan paling lambat 3 (tiga) bulan sejak perjanjian kredit/akad pembayaran KPR Bersubsidi.
            </p>
            <div>
              <p className="text-justify">
                4. Bahwa PT LAN SENA JAYA bersedia menyediakan dana jaminan kepada Bank BTN berupa dana yang ditahan (dana retensi) dengan rincian sebagai berikut :
              </p>
              <div className="pl-6 space-y-0.5 text-[8pt]">
                <p>1. Dana yang ditahan untuk setiap debit/unit rumah, berjumlah paling sedikit 2 (dua) kali nilai jalan lingkungan yang belum terselesaikan.</p>
                <p>2. Nilai jalan lingkungan adalah berdasarkan penilaian <em>(appraisal)</em> Bank BTN.</p>
                <p>3. Dana yang ditahan diambil dari hasil setiap pencairan KPR Bersubsidi untuk setiap debit/unit rumah yang jalan lingkungan yang belum terselesaikan.</p>
              </div>
            </div>
            <p className="text-justify">
              5. Dalam hal PT. LAN SENA JAYA tidak dapat menyelesaikan kewajiban sebagaimana dimaksud butir 3 di atas maka bersedia dan menyetujui dana jaminan sebagaimana dimaksud butir 4 di atas digunakan oleh Bank BTN untuk memastikan kewajiban penyelesaian jalan lingkungan dengan sesuai dengan ketentuan Pemerintah yang berlaku.
            </p>
          </div>

          <p className="text-justify text-[8.5pt]">
            Surat pernyataan ini adalah bagian yang tidak terpisahkan dari Perjanjian Kerjasama (PKS) dengan Bank BTN Kantor Cabang ............................ tentang Penyediaan Dukungan KPR BTN Bersubsidi Nomor ..................................................................... tanggal ...................................
          </p>

          <p className="text-justify text-[8.5pt]">
            Demikian surat pernyataan ini dibuat dengan sebenarnya tanpa paksaan dari pihak manapun dan apabila di kemudian hari pernyataan ini tidak benar, maka bersedia menerima konsekuensi sesuai dengan ketentuan Pemerintah dan Perundang-undangan yang berlaku.
          </p>

          <div className="pt-2 text-[8.5pt] flex justify-end">
            <div className="text-center w-64">
              <p>Purwakarta, .........................................</p>
              <p className="mt-0.5">Yang membuat pernyataan,</p>
              <div className="h-14 flex items-center justify-center text-[7.5pt] text-slate-400">
                <span>Materai secukupnya</span>
              </div>
              <p className="font-bold underline text-[9pt]">ALAN SUHERLAN</p>
              <p className="mt-0.5">Direktur</p>
            </div>
          </div>
        </div>
      )}

      {/* ── LAMPIRAN 15 (FORMAT KEMENTRIAN PUPR) ── */}
      {no === 15 && (
        <div className="page-single space-y-1.5 text-[8pt] leading-tight">
          <div className="flex justify-between items-center">
            <span className="font-bold underline text-xs">LAMPIRAN 15</span>
            <span className="text-[7.5pt]">(Format Kementrian PUPR)</span>
          </div>

          <div className="text-center font-bold">
            <p className="text-xs uppercase underline tracking-wide">SURAT PERNYATAAN PEMOHON KPR BERSUBSIDI BTN</p>
          </div>

          <p>Yang bertanda-tangan di bawah ini :</p>

          <table className="w-full text-[8pt]">
            <tbody>
              <tr><td className="w-32 py-0.5">Nama Lengkap</td><td className="w-4">:</td><td className="font-semibold">{customer.nama}</td></tr>
              <tr><td className="py-0.5">No KTP</td><td>:</td><td>{customer.nik || '-'}</td></tr>
              <tr><td className="py-0.5">Tempat/Tgl lahir</td><td>:</td><td>{customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}</td></tr>
              <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{customer.pekerjaan || '-'}</td></tr>
              <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{customerAlamat}</td></tr>
            </tbody>
          </table>
          <p className="text-[7.5pt] italic -mt-1">Selaku pemohon.</p>

          <table className="w-full text-[8pt] mt-0.5">
            <tbody>
              <tr><td className="w-32 py-0.5">Nama Lengkap</td><td className="w-4">:</td><td className="font-semibold">{customer.nama_pasangan || '-'}</td></tr>
              <tr><td className="py-0.5">No KTP</td><td>:</td><td>{customer.nik_pasangan || '-'}</td></tr>
              <tr><td className="py-0.5">Tempat/Tgl lahir</td><td>:</td><td>{customer.tempat_lahir_pasangan || '-'}, {customer.tanggal_lahir_pasangan ? formatTanggalIndonesia(customer.tanggal_lahir_pasangan) : '-'}</td></tr>
              <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{customer.pekerjaan_pasangan || '-'}</td></tr>
              <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{spouseAlamat}</td></tr>
            </tbody>
          </table>
          <p className="text-[7.5pt] italic -mt-1">Selaku suami/istri pemohon.</p>

          <p className="font-medium pt-0.5">Menyatakan dengan sesungguhnya:</p>
          <div className="space-y-1 text-justify text-[7.5pt] leading-snug">
            <div className="flex gap-2">
              <span className="w-4 flex-shrink-0">1.</span>
              <div>
                Saya selaku pemohon memiliki gaji/upah pokok/penghasil bersih/upah rata-rata*) perbulan sebesar
                <br />
                <strong>Rp ......................................... (.............................................................. rupiah)</strong>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="w-4 flex-shrink-0">2.</span>
              <p>Saya dan istri/suami*) tidak memiliki hak kepemilikan atas rumah pada saat pengajuan pembiayaan KPR Bersubsidi BTN.</p>
            </div>
            <div className="flex gap-2">
              <span className="w-4 flex-shrink-0">3.</span>
              <p>Saya dan istri/suami*) belum pernah menerima subsidi atau bantuan pembiayaan perumahan dari pemerintah terkait kredit/pembiayaan kepemilikan rumah dan/atau pembangunan rumah swadaya.</p>
            </div>
            <div className="flex gap-2">
              <span className="w-4 flex-shrink-0">4.</span>
              <p>Saya membeli Rumah Umum Tapak/Sarusun Umum dengan harga <strong>Rp. ......................................... (.............................................................. rupiah)</strong> dari pengembang {pengembang}</p>
            </div>
            <div className="flex gap-2">
              <span className="w-4 flex-shrink-0">5.</span>
              <p>Saya dan istri/suami*) akan menggunakan Rumah Umum Tapak/Sarusun Umum sebagai tempat tinggal saya dan/atau keluarga dalam kurun waktu paling lambat 1 (satu) tahun setelah terima rumah.</p>
            </div>
            <div className="flex gap-2">
              <span className="w-4 flex-shrink-0">6.</span>
              <div>
                <p>Saya dan istri/suami*) tidak akan menyewakan/mengontrakkan, memperjual-belikan atau memindahtangankan dengan bentuk perbuatan hukum apapun, kecuali :</p>
                <div className="pl-3 space-y-0.5 mt-0.5">
                  <p>o Penghunian telah melampaui 5 (lima) tahun untuk Rumah Umum Tapak.</p>
                  <p>o Penghunian telah melampaui 20 (dua puluh) tahun untuk Sarusun Umum.</p>
                  <p>o Pindah tempat tinggal sesuai ketentuan peraturan perundang-undangan.</p>
                  <p>o Meninggal dunia (pewarisan), atau</p>
                  <p>o Untuk kepentingan Bank BTN dalam rangka penyelesaian kredit bermasalah.</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="w-4 flex-shrink-0">7.</span>
              <p>Bahwa semua dokumen persyaratan yang disampaikan kepada Bank BTN untuk memperoleh fasilitas subsidi adalah benar dan dapat dipertanggungjawabkan keabsahaannya baik secara formil maupun materil.</p>
            </div>
            <div className="flex gap-2">
              <span className="w-4 flex-shrink-0">8.</span>
              <p>Apabila di kemudian hari pernyataan saya tidak benar dan/atau tidak saya penuhi, saya bersedia mengembalikan seluruh subsidi yang telah saya terima dari pemerintah dan bersedia dikenakan sanksi sesuai dengan ketentuan peraturan perundang-undangan.</p>
            </div>
          </div>

          <p className="text-justify text-[7.5pt] pt-0.5">Demikian surat pernyataan ini saya buat dengan sebenar-benarnya tanpa paksaan dari pihak manapun.</p>

          <div className="pt-1">
            <p className="text-right text-[7.5pt] mb-1">Purwakarta, .........................................</p>
            <div className="grid grid-cols-2 gap-4 text-center text-[7.5pt]">
              <div>
                <p>Menyetujui,</p>
                <div className="h-10" />
                <p className="font-semibold underline">({customer.nama_pasangan || 'ILA ROKHMAH'})</p>
              </div>
              <div>
                <p>Yang membuat pernyataan,</p>
                <div className="h-10 flex items-center justify-center text-[7pt] text-slate-400">
                  <span className="border border-dashed border-slate-400 px-1.5 py-0.5 rounded">Materai secukupnya</span>
                </div>
                <p className="font-semibold underline">({customer.nama})</p>
              </div>
            </div>

            <div className="text-center text-[7.5pt] mt-2">
              <p>Mengetahui,</p>
              <p>Pimpinan Tempat Bekerja/Kepala Desa/Lurah* ......................................</p>
              <div className="h-10" />
              <p>(......................................)</p>
            </div>
            <p className="text-[6.5pt] italic text-slate-500">*) Coret salah yang tidak perlu</p>
          </div>
        </div>
      )}

      {/* ── LAMPIRAN 16 (SURAT PERNYATAAN CALON DEBITUR KPR BERSUBSIDI BTN) ── */}
      {no === 16 && (
        <div className="page-single space-y-1.5 text-[8pt] leading-tight">
          <div className="text-left">
            <span className="font-bold underline text-xs">LAMPIRAN 16</span>
          </div>

          <div className="text-center font-bold">
            <p className="text-xs uppercase underline tracking-wide">SURAT PERNYATAAN CALON DEBITUR KPR BERSUBSIDI BTN</p>
          </div>

          <p className="text-justify text-[7.5pt]">
            Berkenaan dengan persetujuan Kredit Kepemilikan Rumah Bersubsidi di BTN (KPR, Bersubsidi BTN) yang disampaikan PT. Bank Tabungan Negara (Persero) Tbk. (Bank BTN) melalui Surat Penegasan Persetujuan Pemeberian Krdit (SP3K) No ..................................... Tanggal ..................................... Kami yang bertanda tangan dibawah ini :
          </p>

          <table className="w-full text-[8pt]">
            <tbody>
              <tr><td className="w-32 py-0.5">Nama Lengkap</td><td className="w-4">:</td><td className="font-semibold">{customer.nama}</td></tr>
              <tr><td className="py-0.5">No KTP</td><td>:</td><td>{customer.nik || '-'}</td></tr>
              <tr><td className="py-0.5">Tempat/Tgl lahir</td><td>:</td><td>{customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}</td></tr>
              <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{customer.pekerjaan || '-'}</td></tr>
              <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{customerAlamat}</td></tr>
            </tbody>
          </table>
          <p className="text-[7.5pt] italic -mt-1">Selaku calon debitur.</p>

          <table className="w-full text-[8pt] mt-0.5">
            <tbody>
              <tr><td className="w-32 py-0.5">Nama Lengkap</td><td className="w-4">:</td><td className="font-semibold">{customer.nama_pasangan || '-'}</td></tr>
              <tr><td className="py-0.5">No KTP</td><td>:</td><td>{customer.nik_pasangan || '-'}</td></tr>
              <tr><td className="py-0.5">Tempat/Tgl lahir</td><td>:</td><td>{customer.tempat_lahir_pasangan || '-'}, {customer.tanggal_lahir_pasangan ? formatTanggalIndonesia(customer.tanggal_lahir_pasangan) : '-'}</td></tr>
              <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{customer.pekerjaan_pasangan || '-'}</td></tr>
              <tr><td className="py-0.5 align-top">Alamat</td><td className="align-top">:</td><td className="align-top">{spouseAlamat}</td></tr>
            </tbody>
          </table>
          <p className="text-[7.5pt] italic -mt-1">Selaku suami/istri calon debitur.</p>

          <p className="font-medium pt-0.5">Menyatakan dengan sesungguhnya:</p>
          <div className="space-y-1 text-justify text-[7.5pt] leading-snug">
            <div className="flex gap-2">
              <span className="w-4 flex-shrink-0">1.</span>
              <p>Telah melaksanan setiap proses permohonan KPR Bersubsidi BTN sesuai dengan ketentuan Bank BTN dan menyetujui SP3K dimaksud berdasarkan itikad baik, dalam keadaan bebas, mandiri dan tidak dibawah tekanan maupun pengaruh dari pihak lain (independency).</p>
            </div>
            <div className="flex gap-2">
              <span className="w-4 flex-shrink-0">2.</span>
              <p>Telah menerima dan memahami dengan baik setiap penjelasan yang disampaikan Bank BTN mengenai fasilitas KPR Bersubsidi BTN, hak dan kewajiban kami sebagai Debitur serta kewajiban lainnya sesuai ketentuan peraturan perundang-undangan.</p>
            </div>
            <div className="flex gap-2">
              <span className="w-4 flex-shrink-0">3.</span>
              <p>Bersedia melakukan aktivasi ualng QR Code setiap tahun hinggan ke 5 (lima) sejak akad KPR Bersubsidi BTN sesuai dengan ketentuan pemerintah.</p>
            </div>
            <div className="flex gap-2">
              <span className="w-4 flex-shrink-0">4.</span>
              <p>Bersedia memindahkan domisili kependudukan dalam KTP ke alamat Agunan paling lambat 1 (satu) tahun sejak akad KPR Bersubsidi BTN.</p>
            </div>
            <div className="flex gap-2">
              <span className="w-4 flex-shrink-0">5.</span>
              <p>Seluruh dokumen persyaratan yang disampaikan kepada Bank BTN untuk memperoleh fasilitas subsidi adalah benar dan dapat dipertanggungjawabkan keabsahannya baik secara formil maupun materil.</p>
            </div>
            <div className="flex gap-2">
              <span className="w-4 flex-shrink-0">6.</span>
              <p>Bersedia untuk menanggung segala biaya yang meliputi biaya asuransi , biaya pengikatan agunan, dan biaya lainnya yang timbul karena terjadinya penghentian KPR Bersubsidi BTN dan/atau perubahan/konversi menjadi KPR Non-subsidi.</p>
            </div>
            <div className="flex gap-2">
              <span className="w-4 flex-shrink-0">7.</span>
              <p>Tidak akan menjanjikan atau memberikan sesuatu baik secara langsung dan tidak langsung, baik atas inisiatif sendiri maupun orang lain, baik dengan menggunakan sarana elektronik atau tanpa sarana elektronik, baik dalam bentuk uang atau bukan seperti hadiah, cinderamata, komisi, pinjaman tanpa bunga, tiket perjalanan, fasilitas penginapan, perjalanan wisata, pengobatan cuma-cuma, hiburan dari fasilitas lainnya atau bentuk lainnya kepada setiap pejabat dan/atau pegawai Bank BTN termasuk anggota keluarga intinya.</p>
            </div>
            <div className="flex gap-2">
              <span className="w-4 flex-shrink-0">8.</span>
              <p>Apabila di kemudian hari diketahui bahwa pernyataan kami ini dan pernyataan lainnya yang kami sampaikan kepada Bank BTN tidak benar dan/atau tidak saya penuhi, maka saya bersedia mengembalikan seluruh subsidi yang telah saya terima dari pemerintah, bersedia dikenakan sanksi sesuai dengan ketentuan peraturan perundang-undangan dan bersedia mengubah/mengkonversi menjadi KPR Non-subsidi.</p>
            </div>
          </div>

          <p className="text-justify text-[7.5pt] pt-0.5">Demikian surat pernyataan ini saya buat dengan sebenar-benarnya tanpa paksaan dari pihak manapun.</p>

          <div className="pt-1">
            <p className="text-right text-[7.5pt] mb-1">Purwakarta, .........................................</p>
            <div className="grid grid-cols-2 gap-4 text-center text-[7.5pt]">
              <div>
                <p>Menyetujui,</p>
                <div className="h-10" />
                <p className="font-semibold underline">({customer.nama_pasangan || 'ILA ROKHMAH'})</p>
              </div>
              <div>
                <p>Yang membuat pernyataan,</p>
                <div className="h-10 flex items-center justify-center text-[7pt] text-slate-400">
                  <span className="border border-dashed border-slate-400 px-1.5 py-0.5 rounded">Materai secukupnya</span>
                </div>
                <p className="font-semibold underline">({customer.nama})</p>
              </div>
            </div>

            <div className="text-center text-[7.5pt] mt-2">
              <p>Mengetahui,</p>
              <p>Pimpinan Tempat Bekerja/Kepala Desa/Lurah* ......................................</p>
              <div className="h-10" />
              <p>(......................................)</p>
            </div>
            <p className="text-[6.5pt] italic text-slate-500">*) Coret salah yang tidak perlu</p>
          </div>
        </div>
      )}

      {/* ── LAMPIRAN 17 (SURAT KUASA) ── */}
      {no === 17 && (
        <div className="page-single text-[7pt] leading-[1.2] space-y-1.5">
          <p className="font-bold underline text-[8.5pt]">LAMPIRAN 17</p>
          <p className="font-bold underline text-[9.5pt] text-center">SURAT KUASA</p>

          <p>Yang bertanda-tangan di bawah ini :</p>

          <div className="flex gap-2">
            <span className="w-4 font-medium flex-shrink-0">I.</span>
            <div className="flex-1 space-y-1">
              <table className="w-full">
                <tbody>
                  <tr><td className="w-40 py-0.5">Nama Lengkap</td><td className="w-3">:</td><td className="font-semibold">{customer.nama}</td></tr>
                  <tr><td className="py-0.5">No KTP</td><td>:</td><td>{customer.nik || '-'}</td></tr>
                  <tr><td className="py-0.5">Tempat/Tgl lahir</td><td>:</td><td>{customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}</td></tr>
                  <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{customer.pekerjaan || '-'}</td></tr>
                  <tr><td className="py-0.5">Alamat</td><td>:</td><td>{customerAlamat}</td></tr>
                  <tr><td className="py-0.5">Nomor Rekening Simpanan</td><td>:</td><td>{(customer as any)?.nomor_rekening_kpr || ''}</td></tr>
                  <tr><td className="py-0.5">No. SP3K</td><td>:</td><td></td></tr>
                  <tr><td className="py-0.5">Tanggal Akad KPR Bersubsidi</td><td>:</td><td></td></tr>
                  <tr><td className="py-0.5">No Rekening KPR Bersubsidi</td><td>:</td><td></td></tr>
                </tbody>
              </table>
              <p>Dalam hal ini bertindak untuk atas nama sendiri, selanjutnya disebut <span className="font-bold">"Pemberi Kuasa"</span>.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <span className="w-4 font-medium flex-shrink-0">II.</span>
            <div className="flex-1 text-justify">
              <p>
                PT. Bank Tabungan Negara (Persero) tbk. (Bank BTN), berkedudukan di Jalan Gajah Mada No. 01 Jakarta Pusat yang dalam hal ini diwakili oleh ........................................ selaku ........................................ pada Bank BTN Kantor Cabang ........................................
                <br />Selanjutnya disebut <span className="font-bold">"Penerima Kuasa"</span>.
              </p>
            </div>
          </div>

          <p className="text-justify">
            Dengan ini <span className="font-bold">Pemberi Kuasa</span> memberikan <span className="font-bold">Kuasa khusus</span> kepada <span className="font-bold">Penerima Kuasa</span> untuk melakukan hal-hal sebagai berikut:
          </p>

          <div className="space-y-1 text-justify">
            <div className="flex gap-2">
              <span className="w-3 flex-shrink-0">1.</span>
              <p>Membayarkan sejumlah dana kepada Penjual/Pengembang dari hasil pencairan kredit yang diterima oleh <span className="font-bold">Pemberi Kuasa</span> dari Bank BTN untuk pembayaran lunas harga jual rumah beserta lahan sesuai dengan tujuan pemberian kredit.</p>
            </div>
            <div className="flex gap-2">
              <span className="w-3 flex-shrink-0">2.</span>
              <p>Melakukan pemindahbukuan pencairan dana Subsidi Bantuan Uang Muka (SBUM)/Dana Bantuan Pembiayaan Perumahan Berbasis Tabungan (BP2BT)* dari rekening simpanan milik <span className="font-bold">Pemberi Kuasa</span> di Bank BTN sebagaimana tersebut diatas senilai Rp .............................. - (..........................................) untuk digunakan sebagai pengurang pokok kredit/pembayaran kekurangan uang muka pembelian Rumah Umum Tapak dalam hal Pemeberi Kuasa mendapatkan fasilitas SBUM/Dana BP2BT*.</p>
            </div>
            <div className="flex gap-2">
              <span className="w-3 flex-shrink-0">3.</span>
              <div className="flex-1">
                <p>Pembayaran dan pemindahbukuan dana sebagaimana dimaksud bada butir 1 dan butir 2 ditujukan kepada :</p>
                <div className="pl-2 py-0.5 space-y-0.5">
                  <div className="flex"><span className="w-36">Nama Pengembang</span><span className="w-3">:</span><span className="font-semibold">PT. LAN SENA JAYA</span></div>
                  <div className="flex"><span className="w-36">Nomor Rekening</span><span className="w-3">:</span><span>00181-01-30-666-666-1</span></div>
                  <div className="flex"><span className="w-36">Rekening Atas Nama</span><span className="w-3">:</span><span>PT. LAN SENA JAYA</span></div>
                  <div className="flex"><span className="w-36">Pada Bank</span><span className="w-3">:</span><span>Bank BTN Kantor Cabang/Kantor Cabang Pembantu/Kantor Kas* ........................................</span></div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="w-3 flex-shrink-0">4.</span>
              <div className="flex-1">
                <p>Memblokir, mendebat dan/atau memindahbukuan dana rekening dari rekening simpanan milik <span className="font-bold">Pemberi Kuasa</span> di Bank BTN sebagaimana tersebut di atas untuk keperluan pembayaran:</p>
                <p className="pl-3">a. Biaya proses dan/atau realisasi kredit;</p>
                <p className="pl-3">b. Angsuran kredit yang meliputi pokok, bunga, denda, dan biaya lainnya; dan</p>
                <p className="pl-3">c. Biaya asuransi, pengikatan angunan, dan biaya lainya yang timbul karna terjadinya penghentian KP4 Bersubsidi BTN dan/atau perubahan/konversi menjadi KPR Non-subsidi.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="w-3 flex-shrink-0">5.</span>
              <p>Pembayaran, pemindahbukuan, pemblokiran, dan/atau pendebatan dana sebagaimana dimaksud pada butir 1 s.d butir 4 diatas dapat dilakukan oleh Bank BTN secara manual, otomatis dan/atau mekanisme transaksi lainnya yang berlaku di Bank BTN.</p>
            </div>
          </div>

          <p className="text-justify pt-1">
            Demikian Surat Kuasa ini dibuat dengan Hak Substitusi, dan tidak dapat dicabut kembali seta tidak akan berakhir karena sebab-sebab yang tercantum dalam Pasal 1813 Kitab Undang-Undang Hukum Perdata atau karena sebab apaupun juga.
          </p>

          <div className="pt-1">
            <p className="text-right mb-1">Purwakarta, .........................................</p>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="font-bold">PENERIMA KUASA,</p>
                <p>PT BANK TABUNGAN NEGARA (PERSERO) Tbk.</p>
                <p>KANTOR CABANG ................................</p>
                <div className="h-10" />
                <p>( .............................................. )</p>
              </div>
              <div>
                <p className="font-bold">PEMBERI KUASA,</p>
                <div className="h-10 flex items-center justify-center text-[6.5pt] text-slate-400">
                  <span className="border border-dashed border-slate-400 px-1.5 py-0.5 rounded">Materai secukupnya</span>
                </div>
                <p className="font-bold underline">({customer.nama})</p>
              </div>
            </div>
            <p className="text-[6.5pt] italic text-slate-500 mt-1">*) Coret yang tidak perlu</p>
          </div>
        </div>
      )}

      {/* ── LAMPIRAN 18 (STANDING INSTRUCTION) ── */}
      {no === 18 && (
        <div className="page-single text-[8pt] leading-[1.25] space-y-2.5">
          <p className="font-bold underline text-[9pt]">LAMPIRAN 18</p>
          <div className="text-center font-bold underline text-[10pt]">
            <p>SURAT KETERANGAN PEMINDAHBUKUAN DANA SBUM</p>
            <p>(STANDING INSTRUCTION)</p>
          </div>

          <p className="pt-1">Sehubungan dengan pencairan Subsidi Bantuan Uang Muka (SBUM) kepada Debitur KPR Bersubsidi, maka saya yang bertanda tangan di bawah ini :</p>

          <table className="w-full">
            <tbody>
              <tr><td className="w-44 py-0.5">Nama Pengembang</td><td className="w-3">:</td><td className="font-semibold">PT. LAN SENA JAYA</td></tr>
              <tr><td className="py-0.5">Nomor Rekening</td><td>:</td><td>00181-01-30-666-666-1</td></tr>
              <tr><td className="py-0.5">Rekening Atas Nama</td><td>:</td><td>PT. LAN SENA JAYA</td></tr>
              <tr>
                <td className="py-0.5 align-top">Pada Bank</td>
                <td className="align-top">:</td>
                <td>Bank BTN Kantor Cabang/Kantor Cabang/Kantor Kas<br />..................................................................</td>
              </tr>
            </tbody>
          </table>

          <p className="text-justify pt-1">
            Dengan ini memberikan kuasa kepada PT. Bank Tabungan Negara (Persero) Tbk. Kantor Cabang .................................................. Untuk melakukan pemindahbukuan pencairan dana Subsidi Bantuan Uang Muka (SBUM) senilai Rp .................................................., - ............................................................................................ untuk digunakan sebagai pengganti tambahan uang muka pembelian Rumah Umum Tapak *), kepada :
          </p>

          <table className="w-full">
            <tbody>
              <tr><td className="w-44 py-0.5">Nama</td><td className="w-3">:</td><td className="font-semibold">{customer.nama}</td></tr>
              <tr><td className="py-0.5">NIK</td><td>:</td><td>{customer.nik || '-'}</td></tr>
              <tr><td className="py-0.5">Nomor Rekening</td><td>:</td><td>{(customer as any)?.nomor_rekening_kpr || ''}</td></tr>
              <tr><td className="py-0.5">Rekening Atas Nama</td><td>:</td><td>{customer.nama}</td></tr>
              <tr><td className="py-0.5">Pada Bank</td><td>:</td><td>Bank BTN Kantor Cabang/Kantor Cabang/Kantor Kas ..........................................................</td></tr>
            </tbody>
          </table>

          <p className="text-justify pt-1">
            Demikian <em>Standing Instruction</em> ini dibuat tanpa adanya paksaan dari pihak manapun. Akibat apapun yang mungkin timbul dari paksaan penyaluran dana oleh PT. Bank Tabungan Negara (Persero) Tbk. Berdasarkan <em>Standing Instruction</em> ini adalah sepenuhnya menjadi tanggung jawab saya pribadi.
          </p>

          <div className="pt-3">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p>Menyetujui,</p>
                <p>PT. BANK TABUNGAN NEGARA (PERSERO) Tbk</p>
                <p>KANTOR CABANG ............................................</p>
                <div className="h-14" />
                <p>(....................................................)</p>
                <p className="text-[7pt] italic text-slate-500">Nama Lengkap, jabatan, Stempel</p>
              </div>
              <div>
                <p>Purwakarta, .........................................</p>
                <p className="text-[7.5pt] text-slate-500">Kota/Kabupaten, tanggal bulan tahun,</p>
                <p className="font-bold">PEMBUAT STANDING INSTRUCTION</p>
                <div className="h-14 flex items-center justify-center text-[7pt] text-slate-400">
                  <span className="border border-dashed border-slate-400 px-1.5 py-0.5 rounded">Materai secukupnya</span>
                </div>
                <p>(....................................................)</p>
                <p className="text-[7pt] italic text-slate-500">Nama Lengkap Pembuat SI</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LAMPIRAN 19 (SURAT PERNYATAAN TIDAK MEMILIKI RUMAH) ── */}
      {no === 19 && (
        <div className="page-single text-[8.5pt] leading-[1.3] space-y-3">
          <p className="font-bold underline text-[9.5pt]">LAMPIRAN 19</p>
          <p className="font-bold underline text-[10.5pt] text-center">SURAT PERNYATAAN TIDAK MEMILIKI RUMAH</p>

          <p className="pt-1">Yang bertanda-tangan di bawah ini :</p>

          <table className="w-full">
            <tbody>
              <tr><td className="w-40 py-0.5">Nama</td><td className="w-3">:</td><td className="font-semibold">{customer.nama}</td></tr>
              <tr><td className="py-0.5">Tempat/tgl lahir</td><td>:</td><td>{customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}</td></tr>
              <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{customer.pekerjaan || '-'}</td></tr>
              <tr><td className="py-0.5">No KTP/Passport</td><td>:</td><td>{customer.nik || '-'}</td></tr>
              <tr><td className="py-0.5">Alamat</td><td>:</td><td>{customerAlamat}</td></tr>
            </tbody>
          </table>

          <p className="text-justify pt-1">
            menyatakan bahwa sampai dengan surat pernyataan ini dibuat tidak memiliki hak kepemilikan atas rumah.
          </p>
          <p className="text-justify">
            Demikian surat pernyataan ini saya buat dengan sebenarnya tanpa paksaan dari pihak manapun dan apabila di kemudian hari pernyataan saya ini tidak benar, saya bersedia mengembalikan Fasilitas Likuiditas Pembiayaan Perumahan yang saya terima.
          </p>

          <div className="pt-3">
            <p className="text-right mb-1">Purwakarta, .........................................</p>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p>Mengetahui:</p>
                <p>Kepala Desa/Lurah/Pimpinan Perusahaan/Instansi</p>
                <div className="h-16" />
                <p>(....................................................)</p>
              </div>
              <div>
                <p>Yang membuat pernyataan,</p>
                <div className="h-16 flex items-center justify-center text-[7.5pt] text-slate-400">
                  <span className="border border-dashed border-slate-400 px-2 py-0.5 rounded">Materai 10000</span>
                </div>
                <p className="font-semibold underline">({customer.nama})</p>
              </div>
            </div>
            <p className="text-[7pt] italic text-slate-500 mt-3">*diberikan cap perusahaan/instansi</p>
          </div>
        </div>
      )}

      {/* ── LAMPIRAN 20 (SURAT PERNYATAAN TIDAK BEKERJA) ── */}
      {no === 20 && (
        <div className="page-single text-[8.5pt] leading-[1.3] space-y-3">
          <p className="font-bold underline text-[9.5pt]">LAMPIRAN 20</p>
          <div className="text-center font-bold underline text-[10.5pt]">
            <p>SURAT PERNYATAAN TIDAK BEKERJA / TIDAK MEMPUNYAI</p>
            <p>PENGHASILAN</p>
          </div>

          <p className="pt-1">Yang bertanda-tangan di bawah ini :</p>

          <table className="w-full">
            <tbody>
              <tr><td className="w-40 py-0.5">Nama</td><td className="w-3">:</td><td className="font-semibold">{customer.nama_pasangan || 'ILA ROKHMAH'}</td></tr>
              <tr><td className="py-0.5">No KTP</td><td>:</td><td>{customer.nik_pasangan || '-'}</td></tr>
              <tr><td className="py-0.5">Tempat Lahir</td><td>:</td><td>{customer.tempat_lahir_pasangan || '-'}</td></tr>
              <tr><td className="py-0.5">Tanggal Lahir</td><td>:</td><td>{customer.tanggal_lahir_pasangan ? formatTanggalIndonesia(customer.tanggal_lahir_pasangan) : '-'}</td></tr>
              <tr><td className="py-0.5">Pekerjaan</td><td>:</td><td>{customer.pekerjaan_pasangan || 'MENGURUS RUMAH TANGGA'}</td></tr>
              <tr><td className="py-0.5">Alamat</td><td>:</td><td>{spouseAlamat}</td></tr>
              <tr><td className="py-0.5">Nomor Telepon/HP</td><td>:</td><td>{customer.no_hp_pasangan || '-'}</td></tr>
            </tbody>
          </table>

          <p className="text-justify pt-1">
            Dengan ini menyatakan bahwa selama ini <span className="font-bold">tidak mempunyai pekerjaan / tidak bekerja.</span>
          </p>
          <p className="text-justify">
            Demikian Surat Pernyataan ini kami buat dengan sebenar-benarnya tanpa paksaan dari pihak manapun dan apabila dikemudian hari pernyataan saya tidak benar, saya bersedia mengembalikan seluruh subsidi yang saya terima.
          </p>

          <div className="pt-3">
            <p className="text-right mb-1">Purwakarta, .........................................</p>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p>Mengetahui,</p>
                <p>Kepala Kelurahan ..............................</p>
                <div className="h-16" />
                <p>(....................................................)</p>
              </div>
              <div>
                <p>Yang membuat pernyataan,</p>
                <div className="h-16 flex items-center justify-center text-[7.5pt] text-slate-400">
                  <span className="border border-dashed border-slate-400 px-2 py-0.5 rounded">Materai 10.000</span>
                </div>
                <p className="font-semibold underline">({customer.nama_pasangan || 'ILA ROKHMAH'})</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LAMPIRAN 21 (KETETAPAN WAKTU UNTUK VERIFIKASI) ── */}
      {no === 21 && (
        <div className="page-single text-[8pt] leading-[1.25] space-y-2.5">
          <p className="font-bold underline text-[9pt]">LAMPIRAN 21</p>
          <p className="font-bold underline text-[10pt] text-center">KETETAPAN WAKTU UNTUK VERIFIKASI</p>

          {/* Section 1: PERUMAHAN & BLOK */}
          <div className="font-bold text-[8.5pt]">
            <p>{perumahanNama.toUpperCase()}</p>
            <p>BLOK : BLOK {unitBlok} No {unitNo}</p>
          </div>

          {/* Table 1: BLOK / CONSUMER */}
          <table className="w-full border-collapse border border-black text-center text-[8pt]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-black p-1 w-[8%]">NO</th>
                <th className="border border-black p-1 w-[32%]">NAMA</th>
                <th className="border border-black p-1 w-[20%]">NO.TLP</th>
                <th className="border border-black p-0 w-[20%]">
                  <div className="border-b border-black p-0.5">JAM BISA DIHUBUNGI</div>
                  <div className="grid grid-cols-2">
                    <span className="border-r border-black p-0.5">1</span>
                    <span className="p-0.5">2</span>
                  </div>
                </th>
                <th className="border border-black p-1 w-[20%]">KETERANGAN</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1">1</td>
                <td className="border border-black p-1 text-left font-medium">{customer.nama}</td>
                <td className="border border-black p-1">{customer.no_hp || (customer as any)?.no_telepon || '-'}</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
              </tr>
              <tr>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1 text-left">{customer.nama_pasangan || ''}</td>
                <td className="border border-black p-1">{customer.no_hp_pasangan || ''}</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
              </tr>
            </tbody>
          </table>

          {/* Section 2: INSTANSI PEKERJAAN */}
          <p className="font-bold text-[8.5pt] pt-1">INSTANSI PEKERJAAN (KANTOR TEMPAT KERJA)</p>
          <table className="w-full border-collapse border border-black text-center text-[8pt]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-black p-1 w-[8%]">NO</th>
                <th className="border border-black p-1 w-[32%]">NAMA</th>
                <th className="border border-black p-1 w-[20%]">NO.TLP</th>
                <th className="border border-black p-0 w-[20%]">
                  <div className="border-b border-black p-0.5">JAM BISA DIHUBUNGI</div>
                  <div className="grid grid-cols-2">
                    <span className="border-r border-black p-0.5">1</span>
                    <span className="p-0.5">2</span>
                  </div>
                </th>
                <th className="border border-black p-1 w-[20%]">KETERANGAN</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1">1</td>
                <td className="border border-black p-1 text-left">{(customer as any)?.instansi || (customer as any)?.nama_perusahaan || ''}</td>
                <td className="border border-black p-1">{(customer as any)?.telepon_kantor || ''}</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
              </tr>
              <tr>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1 text-left"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
              </tr>
            </tbody>
          </table>

          {/* Section 3: CONTACT EMERGENCY */}
          <p className="font-bold text-[8.5pt] pt-1">CONTACT EMERGENCY</p>
          <table className="w-full border-collapse border border-black text-center text-[8pt]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-black p-1 w-[8%]">NO</th>
                <th className="border border-black p-1 w-[32%]">NAMA</th>
                <th className="border border-black p-1 w-[20%]">NO.TLP</th>
                <th className="border border-black p-0 w-[20%]">
                  <div className="border-b border-black p-0.5">JAM BISA DIHUBUNGI</div>
                  <div className="grid grid-cols-2">
                    <span className="border-r border-black p-0.5">1</span>
                    <span className="p-0.5">2</span>
                  </div>
                </th>
                <th className="border border-black p-1 w-[20%]">KETERANGAN SAUDARA-ALAMAT LENGKAP</th>
              </tr>
            </thead>
            <tbody>
              <tr className="h-10">
                <td className="border border-black p-1">1</td>
                <td className="border border-black p-1 text-left font-medium">{(customer as any)?.emergency_nama || ''}</td>
                <td className="border border-black p-1">{(customer as any)?.emergency_hp || (customer as any)?.emergency_telepon || ''}</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1 text-left align-top">
                  Keterangan : {(customer as any)?.emergency_hubungan ? `${(customer as any).emergency_hubungan} ` : ''}{(customer as any)?.emergency_alamat || ''}
                </td>
              </tr>
              <tr className="h-10">
                <td className="border border-black p-1">2</td>
                <td className="border border-black p-1 text-left font-medium"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1 text-left align-top">Keterangan : </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── FALLBACK FOR UNEXPECTED NO ── */}
      {![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].includes(no) && (
        <div className="page-single space-y-3">
          <div className="text-center font-bold">
            <p className="text-xs">LAMPIRAN {no}</p>
            <p className="text-sm uppercase max-w-xl mx-auto">DOKUMEN KPR PERSYARATAN</p>
          </div>

          <p className="text-[9pt]">Yang bertanda tangan di bawah ini menerangkan bahwa :</p>

          <table className="w-full text-[9pt]">
            <tbody>
              <tr><td className="w-36 py-0.5">Nama Konsumen</td><td className="w-4">:</td><td className="font-semibold">{customer.nama}</td></tr>
              <tr><td className="py-0.5">NIK</td><td>:</td><td>{customer.nik || '-'}</td></tr>
              <tr><td className="py-0.5">Pekerjaan / Instansi</td><td>:</td><td>{customer.pekerjaan || '-'} {customer.instansi ? `(${customer.instansi})` : ''}</td></tr>
              <tr><td className="py-0.5">Alamat KTP</td><td>:</td><td>{customerAlamat}</td></tr>
              <tr><td className="py-0.5">Unit Rumah</td><td>:</td><td className="font-semibold">{perumahanNama} - BLOK {unitBlok} No {unitNo} (Tipe {unitTipe})</td></tr>
              <tr><td className="py-0.5">Pengembang</td><td>:</td><td>{pengembang}</td></tr>
              <tr><td className="py-0.5">Bank Pelaksana</td><td>:</td><td>{bankNama}</td></tr>
            </tbody>
          </table>

          <div className="text-justify text-[9pt] leading-relaxed space-y-2">
            <p>
              Menyatakan dengan sesungguhnya bahwa seluruh data, keterangan, dan berkas administrasi yang saya sampaikan untuk pengajuan fasilitas Kredit Pemilikan Rumah (KPR) Bersubsidi Sejahtera Tapak di {perumahanNama} adalah benar dan dapat dipertanggungjawabkan sesuai ketentuan peraturan perundang-undangan.
            </p>
            <p>
              Apabila di kemudian hari ditemukan data yang tidak benar atau melanggar ketentuan bantuan subsidi perumahan MBR, saya bersedia menerima sanksi hukum serta mengembalikan seluruh fasilitas bantuan subsidi yang telah diterima ke kas negara.
            </p>
          </div>

          <div className="pt-3 text-[9pt] flex justify-between">
            <div className="text-center w-52">
              <p>Mengetahui,</p>
              <p className="font-semibold">{pengembang}</p>
              <div className="h-14" />
              <p>( ....................................... )</p>
            </div>
            <div className="text-center w-52">
              <p>Purwakarta, {todayStr}</p>
              <p>Yang Membuat Pernyataan,</p>
              <div className="h-14 flex items-center justify-center text-[8pt] text-slate-400">
                <span className="border border-dashed border-slate-400 px-2 py-0.5 rounded">Materai 10.000</span>
              </div>
              <p className="font-semibold underline">( {customer.nama} )</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
