import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { Customer, Bank, Unit, Block, Location, Sale } from '@/types';
import { formatTanggalIndonesia, formatRupiah } from '@/lib/format';

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 32,
    paddingRight: 32,
    fontSize: 9,
    fontFamily: 'Helvetica',
    lineHeight: 1.3,
    color: '#111827',
  },
  headerDoc: {
    alignItems: 'center',
    marginBottom: 8,
  },
  docNumber: {
    fontSize: 9.5,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  docTitle: {
    fontSize: 10.5,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginTop: 1,
    marginBottom: 1,
  },
  docSubtitle: {
    fontSize: 8.5,
    textAlign: 'center',
    color: '#374151',
  },
  paragraph: {
    fontSize: 8.8,
    textAlign: 'justify',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginTop: 3,
    marginBottom: 2,
  },
  table: {
    marginTop: 2,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 1.8,
  },
  labelCell: {
    width: 140,
    fontSize: 8.8,
    color: '#374151',
  },
  colonCell: {
    width: 10,
    fontSize: 8.8,
  },
  valueCell: {
    flex: 1,
    fontSize: 8.8,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  valueCellNormal: {
    flex: 1,
    fontSize: 8.8,
    color: '#111827',
  },
  numCell: {
    width: 14,
    fontSize: 8.8,
  },
  listRow: {
    flexDirection: 'row',
    marginBottom: 1.5,
    paddingLeft: 10,
  },
  listNum: {
    width: 14,
    fontSize: 8.5,
  },
  listText: {
    flex: 1,
    fontSize: 8.5,
    textAlign: 'justify',
  },
  // Table for Lampiran 7
  gridTable: {
    borderWidth: 1,
    borderColor: '#000',
    marginTop: 4,
    marginBottom: 4,
  },
  gridRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  gridHeader: {
    backgroundColor: '#f3f4f6',
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    padding: 2.5,
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#000',
  },
  gridCell: {
    fontSize: 8,
    padding: 2,
    borderRightWidth: 1,
    borderColor: '#000',
  },
  gridCellCenter: {
    fontSize: 8,
    padding: 2,
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#000',
  },
  // Signature section
  signatureContainer: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    alignItems: 'center',
    textAlign: 'center',
  },
  signatureBoxCenter: {
    width: '100%',
    alignItems: 'center',
    textAlign: 'center',
    marginTop: 6,
  },
  signatureSpace: {
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  materaiBox: {
    borderWidth: 1,
    borderColor: '#9ca3af',
    borderStyle: 'dashed',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  materaiText: {
    fontSize: 7,
    color: '#6b7280',
  },
  signatureName: {
    fontSize: 8.8,
    fontFamily: 'Helvetica-Bold',
    textDecoration: 'underline',
  },
  footnote: {
    fontSize: 7.5,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 2,
  },
});

interface Props {
  no: number;
  sale?: Sale;
  customer?: Customer;
  bank?: Bank;
  unit?: Unit;
  block?: Block;
  location?: Location;
}

export function LampiranKprPdf({
  no,
  sale,
  customer,
  bank,
  unit,
  block,
  location,
}: Props) {
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
    <Document>
      {/* ── LAMPIRAN 1 (FORMAT PERSIS GAMBAR) ── */}
      {no === 1 && (
        <Page size="A4" style={[styles.page, { paddingTop: 16, paddingBottom: 16, fontSize: 8.2, lineHeight: 1.25 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', textDecoration: 'underline' }}>LAMPIRAN 1</Text>
            <Text style={{ fontSize: 8.5 }}>(Pemohon FLPP)</Text>
          </View>

          <Text style={{ fontSize: 10.5, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', textAlign: 'center', marginBottom: 8 }}>
            SURAT PERNYATAAN PENYERAHAN DATA
          </Text>

          <Text style={{ fontSize: 8.2, marginBottom: 2 }}>Saya, yang bertanda-tangan di bawah ini :</Text>

          <View style={[styles.table, { marginBottom: 2 }]}>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 120, fontSize: 8.2 }]}>Nama</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>{customer.nama}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 120, fontSize: 8.2 }]}>Tempat, Taggal Lahir</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>
                {customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}
              </Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 120, fontSize: 8.2 }]}>Pekerjaan</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>{customer.pekerjaan || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 120, fontSize: 8.2 }]}>NIK</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>{customer.nik || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 120, fontSize: 8.2 }]}>Alamat Domisili</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>{customer.alamat_domisili || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 120, fontSize: 8.2 }]}>Alamat Sesuai KTP</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>{customerAlamat}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 120, fontSize: 8.2 }]}>Nomor Telepon/HP</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>{customer.no_hp || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 120, fontSize: 8.2 }]}>Alamat email</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>{customer.email || ''}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 7.8, fontStyle: 'italic', marginBottom: 3 }}>Selaku Pemohon.</Text>

          <View style={[styles.table, { marginBottom: 2 }]}>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 120, fontSize: 8.2 }]}>Nama</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>{customer.nama_pasangan || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 120, fontSize: 8.2 }]}>Tempat/tgl lahir</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>
                {customer.tempat_lahir_pasangan || '-'}, {customer.tanggal_lahir_pasangan ? formatTanggalIndonesia(customer.tanggal_lahir_pasangan) : '-'}
              </Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 120, fontSize: 8.2 }]}>Pekerjaan</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>{customer.pekerjaan_pasangan || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 120, fontSize: 8.2 }]}>NIK</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>{customer.nik_pasangan || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 120, fontSize: 8.2 }]}>Alamat Domisili</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>{spouseAlamat || '-'}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 7.8, fontStyle: 'italic', marginBottom: 3 }}>Selaku suami/istri pemohon.</Text>

          <Text style={{ fontSize: 8, marginBottom: 2 }}>Bersama ini;</Text>
          <View style={{ marginBottom: 3 }}>
            <Text style={{ fontSize: 7.8, textAlign: 'justify', marginBottom: 1.5 }}>
              Menyatakan telah mengetahui, memahami dan menyanggupi untuk memenuhi seluruh ketentuan dan persyaratan Pusat Pengelolaan Dana Pembiayaan Perumahan (PPDPP) untuk mendapatkan fasilitas KPR Sejahtera.
            </Text>
            <Text style={{ fontSize: 7.8, textAlign: 'justify', marginBottom: 1.5 }}>
              Menyampaikan semua data pribadi (KTP, NPWP, Pas Photo) untuk mendapatkan fasilitas KPR Sejahtera dan semua data lainnya yang diperlukan oleh PPDPP melalui Bank BTN, serta menjamin bahwa semua data yang saya sampaikan tersebut adalah benar dan dapat dipertanggungjawabkan keabsahannya.
            </Text>
            <Text style={{ fontSize: 7.8, textAlign: 'justify', marginBottom: 1.5 }}>
              Memberikan kuasa kepada PPDPP untuk mengakses semua data pribadi saya yang terkait data FLPP yang ada di Bank BTN.
            </Text>
            <Text style={{ fontSize: 7.8, textAlign: 'justify', marginBottom: 1.5 }}>
              Apabila dikemudian hari pernyataan saya ini tidak benar dan/atau tidak saya penuhi, saya bersedia mengembalikan seluruh subsidi yang telah saya terima dari Pemerintah dan bersedia dikenakan sanksi sesuai dengan ketentuan peraturan perundang-undangan.
            </Text>
            <Text style={{ fontSize: 7.8, textAlign: 'justify', marginBottom: 1.5 }}>
              Memberikan persetujuan kepada Bank BTN untuk memberikan semua data pribadi saya yang terdapat di Bank BTN kepada PPDPP.
            </Text>
          </View>

          <Text style={{ fontSize: 8, textAlign: 'justify', marginBottom: 4 }}>
            Demikian surat pernyataan ini saya buat dengan sebenar-benarnya tanpa paksaan dari pihak manapun.
          </Text>

          <View style={{ marginTop: 2 }}>
            <Text style={{ textAlign: 'right', fontSize: 8, marginBottom: 2 }}>Purwakarta, .........................................</Text>
            <View style={styles.signatureContainer}>
              <View style={styles.signatureBox}>
                <Text style={{ fontSize: 8 }}>Yang Menyetujui,</Text>
                <View style={[styles.signatureSpace, { height: 32 }]} />
                <Text style={[styles.signatureName, { fontSize: 8.2 }]}>({customer.nama_pasangan || 'ILA ROKHMAH'})</Text>
              </View>
              <View style={styles.signatureBox}>
                <Text style={{ fontSize: 8 }}>Yang Membuat Pernyataan,</Text>
                <View style={[styles.signatureSpace, { height: 32 }]}>
                  <Text style={{ fontSize: 7, color: '#9ca3af' }}>Materai 10000</Text>
                </View>
                <Text style={[styles.signatureName, { fontSize: 8.2 }]}>({customer.nama})</Text>
              </View>
            </View>
          </View>
        </Page>
      )}

      {/* ── LAMPIRAN 2 (FORMAT PERSIS GAMBAR) ── */}
      {no === 2 && (
        <Page size="A4" style={[styles.page, { paddingTop: 16, paddingBottom: 16, fontSize: 8.2, lineHeight: 1.25 }]}>
          <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', marginBottom: 4 }}>
            LAMPIRAN 2
          </Text>

          <Text style={{ fontSize: 10.5, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', textAlign: 'center', marginBottom: 8 }}>
            SURAT PERNYATAAN PENGHUNINAN RUMAH UMUM BERSUBSIDI
          </Text>

          <Text style={{ fontSize: 8.2, marginBottom: 2 }}>Yang bertanda-tangan di bawah ini :</Text>

          <View style={[styles.table, { marginBottom: 3 }]}>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 130, fontSize: 8.2 }]}>Nama Lengkap</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>{customer.nama}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 130, fontSize: 8.2 }]}>No KTP</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>{customer.nik || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 130, fontSize: 8.2 }]}>Tempat, Tanggal Lahir</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>
                {customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}
              </Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 130, fontSize: 8.2 }]}>Pekerjaan</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>{customer.pekerjaan || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 130, fontSize: 8.2 }]}>Alamat</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>{customerAlamat}</Text>
            </View>
          </View>

          <Text style={{ fontSize: 8.2, marginBottom: 3 }}>
            Selaku Debitur KPR Bersubsidi BTN menyatakan dengan sesungguhnya bahwa:
          </Text>

          <View style={{ marginBottom: 3 }}>
            <View style={[styles.listRow, { marginBottom: 1.5 }]}>
              <Text style={[styles.listNum, { fontSize: 8 }]}>1.</Text>
              <Text style={[styles.listText, { fontSize: 8 }]}>
                Saya telah memahami ketentuan penghunian rumah sejahtera sebagaimana dimaksud di dalam Peraturan Menteri Pekerjaan Umum dan Perumahan Rakyat.
              </Text>
            </View>
            <View style={[styles.listRow, { marginBottom: 1.5 }]}>
              <Text style={[styles.listNum, { fontSize: 8 }]}>2.</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 8, marginBottom: 1 }}>Saya menyatakan bahwa :</Text>
                <View style={{ paddingLeft: 8 }}>
                  <Text style={{ fontSize: 7.8, marginBottom: 1 }}>o berpenghasilan tidak melebihi batas penghasilan kelompok sasaran KPR Bersubsidi;</Text>
                  <Text style={{ fontSize: 7.8, marginBottom: 1 }}>o saya dan istri/suami*) tidak memiliki rumah;</Text>
                  <Text style={{ fontSize: 7.8, marginBottom: 1 }}>o saya dan istri/suami*) tidak pernah menerima subsidi kepemilikan rumah.</Text>
                  <Text style={{ fontSize: 7.8, marginBottom: 1 }}>
                    o menggunakan sendiri dan menghuni rumah umum tapak atau sarusun umum sebagai tempat tinggal dalam jangka waktu paling lambat 1 (satu) tahun setelah serah terima rumah.
                  </Text>
                  <Text style={{ fontSize: 7.8, marginBottom: 1 }}>
                    o tidak akan menyewakan dan/atau mengalihkan kepemilikan rumah umum tapak atau sarusun umum dengan bentuk perbuatan hukum apapun, kecuali sesuai dengan ketentuan Peraturan Menteri Pekerjaan Umum dan Perumahan Rakyat.
                  </Text>
                </View>
              </View>
            </View>
            <View style={[styles.listRow, { marginBottom: 1.5 }]}>
              <Text style={[styles.listNum, { fontSize: 8 }]}>3.</Text>
              <Text style={[styles.listText, { fontSize: 8 }]}>
                Bahwa semua dokumen persyaratan yang disampaikan kepada Bank BTN untuk memperoleh KPR Bersubsidi BTN adalah benar dan dapat dipertanggungjawabkan keabsahaannya.
              </Text>
            </View>
            <View style={[styles.listRow, { marginBottom: 1.5 }]}>
              <Text style={[styles.listNum, { fontSize: 8 }]}>4.</Text>
              <Text style={[styles.listText, { fontSize: 8 }]}>
                Apabila di kemudian hari pernyataan ini tidak benar dan/atau tidak saya penuhi, saya bersedia dan memeberikan kuasa kepada Bank BTN untuk menghentikan fasilitas KPR Bersubsidi BTN dan/atau mengubah menjadi KPR BTN Non-Subsidi, setelah Bank BTN menerima surat permintaan penghentian KPR Bersubsidi dari pihak yang berwenang.
              </Text>
            </View>
            <View style={[styles.listRow, { marginBottom: 1.5 }]}>
              <Text style={[styles.listNum, { fontSize: 8 }]}>5.</Text>
              <Text style={[styles.listText, { fontSize: 8 }]}>
                Saya bersedia untuk menanggung segala biaya yang meliputi biaya asuransi, biaya pengikatan agunan, dan biaya lainnya yang timbul atas penghentian KPR Bersubsidi BTN
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 8, textAlign: 'justify', marginBottom: 4 }}>
            Demikian surat pernyataan ini saya buat dengan sebenar-benarnya tanpa paksaan dari pihak manapun.
          </Text>

          <View style={{ marginTop: 2 }}>
            <Text style={{ textAlign: 'right', fontSize: 8, marginBottom: 2 }}>Purwakarta, .........................................</Text>
            <View style={styles.signatureContainer}>
              <View style={styles.signatureBox}>
                <Text style={{ fontSize: 8 }}>Yang Menyetujui,</Text>
                <View style={[styles.signatureSpace, { height: 28 }]} />
                <Text style={[styles.signatureName, { fontSize: 8.2 }]}>({customer.nama_pasangan || 'ILA ROKHMAH'})</Text>
              </View>
              <View style={styles.signatureBox}>
                <Text style={{ fontSize: 8 }}>Yang Membuat Pernyataan,</Text>
                <View style={[styles.signatureSpace, { height: 28 }]}>
                  <Text style={{ fontSize: 7, color: '#9ca3af' }}>Materai secukupnya</Text>
                </View>
                <Text style={[styles.signatureName, { fontSize: 8.2 }]}>({customer.nama})</Text>
              </View>
            </View>

            <View style={[styles.signatureBoxCenter, { marginTop: 4 }]}>
              <Text style={{ fontSize: 8 }}>Mengetahui,</Text>
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>PT. BANK TABUNGAN NEGARA (PERSERO) tbk.</Text>
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>KANTOR CABANG {bank?.cabang ? bank.cabang.toUpperCase() : 'KARAWANG'}</Text>
            </View>
          </View>
          <Text style={[styles.footnote, { fontSize: 6.5 }]}>*) coret yang tidak perlu</Text>
        </Page>
      )}

      {/* ── LAMPIRAN 3 (FORMAT PERSIS GAMBAR) ── */}
      {no === 3 && (
        <Page size="A4" style={[styles.page, { paddingTop: 16, paddingBottom: 16, fontSize: 8.2, lineHeight: 1.25 }]}>
          <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', marginBottom: 4 }}>
            LAMPIRAN 3
          </Text>

          <Text style={{ fontSize: 10.5, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', textAlign: 'center', marginBottom: 8 }}>
            SURAT KUASA PENDEBATAN DANA
          </Text>

          <Text style={{ fontSize: 8.2, marginBottom: 2 }}>Yang bertanda-tangan di bawah ini :</Text>

          <View style={[styles.table, { marginBottom: 3 }]}>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 130, fontSize: 8.2 }]}>Nama Lengkap</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>{customer.nama}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 130, fontSize: 8.2 }]}>No KTP</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>{customer.nik || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 130, fontSize: 8.2 }]}>Tempat/tgl lahir</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>
                {customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}
              </Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 130, fontSize: 8.2 }]}>Pekerjaan</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>{customer.pekerjaan || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 130, fontSize: 8.2 }]}>Alamat</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>{customerAlamat}</Text>
            </View>
          </View>

          <Text style={{ fontSize: 8.2, textAlign: 'justify', marginBottom: 4 }}>
            yang dalam hal ini bertindak untuk dan atas nama sendiri, Selanjutnya disebut <strong>&quot;Pemberi Kuasa&quot;</strong>.
          </Text>

          <Text style={{ fontSize: 8.2, textAlign: 'justify', marginBottom: 4 }}>
            PT. Bank Tangunan Negara (Persero) Tbk, berkedudukan di Jalan Gajah Mada No. 01 Jakarta Pusat yang dalam hal ini diwakili oleh ........................................................... selaku ........................................................... di PT. Bank Tabungan Negara (Persero) Tbk. Kantor Cabang ............................................................ Selanjutnya disebut <strong>&quot;Penerima Kuasa&quot;</strong>.
          </Text>

          <Text style={{ fontSize: 8.2, textAlign: 'justify', marginBottom: 4 }}>
            Dengan ini Pemberi Kuasa memberi kuasa kepada Penerima Kuasa untuk melakukan pendebatan dana pada Nomor Rekening Tabungan Pemberi Kuasa dengan nomor {customer.nomor_rekening_kpr || '...........................................................'} atas nama {customer.nama || '...........................................................'} atas biaya asuransi, biaya pengikatan agunan, dan biaya lainnya yang timbul atas penghentian KPR Bersubsidi BTN.
          </Text>

          <Text style={{ fontSize: 8.2, textAlign: 'justify', marginBottom: 4 }}>
            Kuasa ini diberikan dengan Hak Substitusi, tidak dapat dicabut kembali dan tidak akan berakhir karena sebab-sebab yang tercantum dalam pasal 1813 Kitab Undang-undang 1 Hukum Perdata atau karena sebab apapun juga.
          </Text>

          <View style={{ marginTop: 6 }}>
            <Text style={{ textAlign: 'right', fontSize: 8, marginBottom: 2 }}>Purwakarta,..........................................</Text>
            <View style={styles.signatureContainer}>
              <View style={styles.signatureBox}>
                <Text style={{ fontSize: 8 }}>PENERIMA KUASA,</Text>
                <Text style={{ fontSize: 7.8 }}>PT. BANK TABUNGAN NEGARA (Persero) Tbk</Text>
                <Text style={{ fontSize: 7.8 }}>Kantor Cabang .........................</Text>
                <View style={[styles.signatureSpace, { height: 36 }]} />
                <Text style={{ fontSize: 8 }}>(.....................................................)</Text>
              </View>
              <View style={styles.signatureBox}>
                <Text style={{ fontSize: 8 }}>PEMBERI KUASA,</Text>
                <Text style={{ fontSize: 7.8 }}>&nbsp;</Text>
                <View style={[styles.signatureSpace, { height: 36 }]}>
                  <Text style={{ fontSize: 7, color: '#9ca3af' }}>Materai secukupnya</Text>
                </View>
                <Text style={[styles.signatureName, { fontSize: 8.2 }]}>({customer.nama})</Text>
              </View>
            </View>
          </View>
        </Page>
      )}

      {/* ── LAMPIRAN 5 (FORMAT PERSIS GAMBAR) ── */}
      {no === 5 && (
        <Page size="A4" style={[styles.page, { paddingTop: 16, paddingBottom: 16, fontSize: 8.2, lineHeight: 1.25 }]}>
          <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', marginBottom: 4 }}>
            LAMPIRAN 5
          </Text>

          <Text style={{ fontSize: 10.5, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', textAlign: 'center', marginBottom: 8 }}>
            SURAT PERNYATAAN PENYERAHAN SPT PPH
          </Text>

          <Text style={{ fontSize: 8.2, marginBottom: 2 }}>Yang bertanda-tangan di bawah ini :</Text>

          <View style={[styles.table, { marginBottom: 3 }]}>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 130, fontSize: 8.2 }]}>Nama</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>{customer.nama}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 130, fontSize: 8.2 }]}>Tempat, Tanggal Lahir</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>
                {customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}
              </Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 130, fontSize: 8.2 }]}>Pekerjaan</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>{customer.pekerjaan || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 130, fontSize: 8.2 }]}>No KTP</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>{customer.nik || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 130, fontSize: 8.2 }]}>Alamat</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>{customerAlamat}</Text>
            </View>
          </View>

          <Text style={{ fontSize: 8.2, marginBottom: 2 }}>Menyatakan hal-hal sebagai berikut:</Text>

          <View style={{ marginBottom: 3 }}>
            <View style={[styles.listRow, { marginBottom: 2 }]}>
              <Text style={[styles.listNum, { fontSize: 8 }]}>1.</Text>
              <Text style={[styles.listText, { fontSize: 8 }]}>
                Bahwa dikarenakan saya memiliki NPWP kurang dari 1 (satu) tahun pada saat pengajuan KPR Bersubsidi, maka saya belum dapat menyampaikan Surat Pemberitahuan Tahunan (SPT) Pajak Penghasilan (PPh) Orang Pribadi sebagai salah satu dokumen persyaratan pengajuan KPR Bersubsidi sebagaimana telah diatur oleh ketentuan Pemerintah.
              </Text>
            </View>
            <View style={[styles.listRow, { marginBottom: 2 }]}>
              <Text style={[styles.listNum, { fontSize: 8 }]}>2.</Text>
              <Text style={[styles.listText, { fontSize: 8 }]}>
                Bahwa saya bersedia menyampaikan dokumen SPT tahun berikutnya setelah akad kredit KPR Bersubsidi kepada Bank BTN.
              </Text>
            </View>
            <View style={[styles.listRow, { marginBottom: 2 }]}>
              <Text style={[styles.listNum, { fontSize: 8 }]}>3.</Text>
              <Text style={[styles.listText, { fontSize: 8 }]}>
                Bahwa saya bersedia menerima konsekuensi yang diberikan oleh Pemerintah dalam hal saya terlambat dan/atau tidak menyerahkan dokumen SPT tahun berikutnya setelah akad kredit KPR Bersubsidi kepada Bank BTN.
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 8, textAlign: 'justify', marginBottom: 4 }}>
            Demikian surat pernyataan ini saya buat dengan sebenarnya tanpa paksaan dari pihak manapun dan apabila di kemudian hari pernyataan saya ini tidak benar, saya bersedia mengembalikan seluruh subsidi yang saya terima.
          </Text>

          <View style={[styles.signatureContainer, { justifyContent: 'flex-end', marginTop: 8 }]}>
            <View style={[styles.signatureBox, { width: 180 }]}>
              <Text style={{ fontSize: 8 }}>Purwakarta, .........................................</Text>
              <Text style={{ fontSize: 8, marginTop: 1 }}>Yang Membuat Pernyataan,</Text>
              <View style={[styles.signatureSpace, { height: 38 }]}>
                <Text style={{ fontSize: 7, color: '#9ca3af' }}>Materai secukupnya</Text>
              </View>
              <Text style={[styles.signatureName, { fontSize: 8.5 }]}>({customer.nama})</Text>
            </View>
          </View>
        </Page>
      )}

      {/* ── LAMPIRAN 4 (FORMAT PERSIS GAMBAR) ── */}
      {no === 4 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.headerDoc}>
            <Text style={styles.docNumber}>LAMPIRAN 4</Text>
            <Text style={styles.docTitle}>BERITA ACARA SERAH TERIMA</Text>
            <Text style={styles.docTitle}>RUMAH SEJAHTERA TAPAK</Text>
            <Text style={styles.docSubtitle}>No ........................................</Text>
          </View>

          <Text style={styles.paragraph}>
            Berdasarkan PPJB/AJB*) No ..................... tanggal ........................................ telah dilakukan serah terima pada tanggal ........................................ dari Pengembang {pengembang}, selanjutnya disebut &quot;Pihak Pertama&quot;;
          </Text>

          <Text style={styles.sectionTitle}>Kepada pembeli :</Text>
          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Nama</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCell}>{customer.nama}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>NIK</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customer.nik || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Alamat</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customerAlamat}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>No Telp/HP</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customer.no_hp || '-'}</Text>
            </View>
          </View>
          <Text style={styles.paragraph}>selanjutnya disebut &quot;Pihak Kedua&quot;</Text>

          <Text style={styles.sectionTitle}>Atas 1 (satu) unit Rumah Umum Tapak pada lokasi sebagai berikut:</Text>
          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.numCell}>1</Text>
              <Text style={styles.labelCell}>Nama Perumahan</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCell}>{perumahanNama}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.numCell}>2</Text>
              <Text style={styles.labelCell}>No Rumah</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCell}>BLOK {unitBlok} No {unitNo}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.numCell}>3</Text>
              <Text style={styles.labelCell}>Luas Tanah dan Lantai Rumah</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{unitTipe}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.numCell}>4</Text>
              <Text style={styles.labelCell}>Alamat</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{unitAlamat}</Text>
            </View>
          </View>
          <Text style={styles.paragraph}>Selanjutnya disebut &quot;Obyek Serah Terima&quot;.</Text>

          <Text style={styles.sectionTitle}>Obyek Serah Terima dengan kondisi laik fungsi dan dilengkapi dengan:</Text>
          <View style={{ marginBottom: 3 }}>
            <View style={styles.listRow}>
              <Text style={styles.listNum}>-</Text>
              <Text style={styles.listText}>Jaringan air bersih sudah berfungsi;</Text>
            </View>
            <View style={styles.listRow}>
              <Text style={styles.listNum}>-</Text>
              <Text style={styles.listText}>Jaringan listrik sudah berfungsi;</Text>
            </View>
            <View style={styles.listRow}>
              <Text style={styles.listNum}>-</Text>
              <Text style={styles.listText}>Jalan lingkungan sudah selesai dan berfungsi;</Text>
            </View>
            <View style={styles.listRow}>
              <Text style={styles.listNum}>-</Text>
              <Text style={styles.listText}>Saluran air limbah/air kotor rumah tangga sudah selesai dan berfungsi; dan</Text>
            </View>
            <View style={styles.listRow}>
              <Text style={styles.listNum}>-</Text>
              <Text style={styles.listText}>Sarana pewadahan sampah individual dan tempat pembuangan sampah sementara.</Text>
            </View>
          </View>

          <Text style={styles.paragraph}>
            Demikian berita acara serah terima ini ditandatangani oleh kedua belah pihak dan dapat dipertanggungjawabkan.
          </Text>

          <View style={styles.signatureContainer}>
            <View style={styles.signatureBox}>
              <Text>Pihak Pertama/Kuasa*,</Text>
              <Text style={{ fontFamily: 'Helvetica-Bold', marginTop: 1 }}>{pengembang}</Text>
              <View style={styles.signatureSpace} />
              <Text>( ....................................... )</Text>
            </View>
            <View style={styles.signatureBox}>
              <Text>Pihak Kedua,</Text>
              <Text style={{ marginTop: 1 }}>&nbsp;</Text>
              <View style={styles.signatureSpace} />
              <Text style={styles.signatureName}>( {customer.nama} )</Text>
            </View>
          </View>
          <Text style={styles.footnote}>*) coret yang tidak perlu</Text>
        </Page>
      )}

      {/* ── LAMPIRAN 6 ── */}
      {no === 6 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.headerDoc}>
            <Text style={styles.docNumber}>LAMPIRAN 6</Text>
            <Text style={styles.docTitle}>
              SURAT PERNYATAAN PERSETUJUAN PENYALURAN KPR BERSUBSIDI TANPA MENGGUNAKAN SBUM
            </Text>
          </View>

          <Text style={styles.paragraph}>Saya, yang bertanda-tangan di bawah ini :</Text>

          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Nama</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCell}>{customer.nama}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>No KTP</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customer.nik || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Tempat/tgl lahir</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>
                {customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Pekerjaan</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customer.pekerjaan || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Alamat</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customerAlamat}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 8.5, fontStyle: 'italic', marginBottom: 3 }}>Selaku Pemohon.</Text>

          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Nama</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCell}>{customer.nama_pasangan || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>No KTP</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customer.nik_pasangan || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Tempat/tgl lahir</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>
                {customer.tempat_lahir_pasangan || '-'}, {customer.tanggal_lahir_pasangan ? formatTanggalIndonesia(customer.tanggal_lahir_pasangan) : '-'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Pekerjaan</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customer.pekerjaan_pasangan || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Alamat</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{spouseAlamat}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 8.5, fontStyle: 'italic', marginBottom: 5 }}>Selaku suami/istri pemohon.</Text>

          <Text style={styles.paragraph}>
            Menyatakan dengan sesungguhnya bahwa sehubungan dengan belum dilakukannya kerja sama penyaluran Subsidi Bantuan Uang Muka Perumahan (SBUM) tahun 2021 atas fasilitas Kredit Pemilikan Rumah (KPR) Bersubsidi yang Saya dan istri/suami ajukan maka Saya dan istri/suami mengetahui dan menyetujui bahwa penyaluran KPR Bersubsidi dimaksud atas pembelian rumah umum tapak pada proyek perumahan {perumahanNama} Cluster {unitTipe} Blok/No BLOK {unitBlok}/{unitNo} yang dikembangkan oleh {pengembang} tidak difasilitasi oleh SBUM.
          </Text>

          <Text style={styles.paragraph}>
            Demikian surat pernyataan ini saya buat dengan sebenarnya tanpa paksaan dari pihak manapun dan apabila dikemudian hari pernyataan saya ini tidak benar, saya bersedia mengembalikan seluruh subsidi yang saya terima.
          </Text>

          <View style={{ marginTop: 6 }}>
            <Text style={{ textAlign: 'right', fontSize: 8.5, marginBottom: 3 }}>Purwakarta, .........................................</Text>
            <View style={styles.signatureContainer}>
              <View style={styles.signatureBox}>
                <Text>Menyetujui,</Text>
                <View style={[styles.signatureSpace, { height: 36 }]} />
                <Text style={styles.signatureName}>( {customer.nama_pasangan || 'ILA ROKHMAH'} )</Text>
              </View>
              <View style={styles.signatureBox}>
                <Text>Membuat Pernyataan,</Text>
                <View style={[styles.signatureSpace, { height: 36 }]}>
                  <View style={styles.materaiBox}>
                    <Text style={styles.materaiText}>Materai 10000</Text>
                  </View>
                </View>
                <Text style={styles.signatureName}>( {customer.nama} )</Text>
              </View>
            </View>

            <View style={[styles.signatureBoxCenter, { marginTop: 6 }]}>
              <Text>Mengetahui,</Text>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>Pengembang PT LAN SENA JAYA</Text>
              <View style={{ height: 36 }} />
              <Text>(.........................................)</Text>
            </View>
          </View>
        </Page>
      )}

      {/* ── LAMPIRAN 7 ── */}
      {no === 7 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.headerDoc}>
            <Text style={[styles.docNumber, { textDecoration: 'underline' }]}>LAMPIRAN 7</Text>
            <Text style={[styles.docTitle, { textDecoration: 'underline' }]}>PERSYARATAN KELOMPOK SASARAN</Text>
          </View>

          <View style={styles.gridTable}>
            {/* Header Level 1 */}
            <View style={[styles.gridRow, { backgroundColor: '#e5e7eb' }]}>
              <Text style={[styles.gridHeader, { width: 24 }]}>NO</Text>
              <Text style={[styles.gridHeader, { flex: 1, textAlign: 'left', paddingLeft: 6 }]}>PERSYARATAN</Text>
              <Text style={[styles.gridHeader, { width: 140 }]}>KELOMPOK SASARAN</Text>
            </View>
            {/* Header Level 2 */}
            <View style={[styles.gridRow, { backgroundColor: '#f3f4f6' }]}>
              <Text style={[styles.gridHeader, { width: 24 }]}></Text>
              <Text style={[styles.gridHeader, { flex: 1 }]}></Text>
              <Text style={[styles.gridHeader, { width: 90 }]}>KAWIN</Text>
              <Text style={[styles.gridHeader, { width: 50 }]}>LAJANG</Text>
            </View>
            {/* Header Level 3 */}
            <View style={[styles.gridRow, { backgroundColor: '#f9fafb' }]}>
              <Text style={[styles.gridHeader, { width: 24 }]}></Text>
              <Text style={[styles.gridHeader, { flex: 1 }]}></Text>
              <Text style={[styles.gridHeader, { width: 45 }]}>PEMOHON</Text>
              <Text style={[styles.gridHeader, { width: 45 }]}>PASANGAN</Text>
              <Text style={[styles.gridHeader, { width: 50 }]}></Text>
            </View>

            {/* Rows */}
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
            ].map((r) => (
              <View key={r.no} style={styles.gridRow}>
                <Text style={[styles.gridCellCenter, { width: 24, fontFamily: 'Helvetica-Bold' }]}>{r.no}</Text>
                <Text style={[styles.gridCell, { flex: 1 }]}>{r.text}</Text>
                <Text style={[styles.gridCellCenter, { width: 45 }]}></Text>
                <Text style={[styles.gridCellCenter, { width: 45 }]}></Text>
                <Text style={[styles.gridCellCenter, { width: 50 }]}></Text>
              </View>
            ))}
          </View>

          <View style={{ marginTop: 6 }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>Catatan :</Text>
            <Text style={[styles.footnote, { marginBottom: 1 }]}>* dikecualikan untuk PNS/TNI/POLRI yang pindah domisili karena kepentingan dinas dan berlaku hanya sekali.</Text>
            <Text style={[styles.footnote, { marginBottom: 1 }]}>** berstatus kawin hanya dipersyaratkan suami/istri.</Text>
            <Text style={[styles.footnote, { marginBottom: 1 }]}>*** dikecualikan untuk penghasilan dibawah PTKP.</Text>
          </View>
        </Page>
      )}

      {/* ── LAMPIRAN 8 ── */}
      {no === 8 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.headerDoc}>
            <Text style={[styles.docNumber, { textDecoration: 'underline' }]}>LAMPIRAN 8</Text>
            <Text style={[styles.docTitle, { textDecoration: 'underline' }]}>SURAT PERMOHONAN SUBSIDI BANTUAN UANG MUKA</Text>
          </View>

          <View style={{ marginBottom: 4 }}>
            <Text style={{ fontSize: 8.5 }}>Kepada Yth :</Text>
            <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>Kepala Satuan Kerja Direktorat Jenderal Pembiayaan Perumahan</Text>
            <Text style={{ fontSize: 8.5 }}>Kementrian Pekerjaan Umum dan Perumahan Rakyat</Text>
            <Text style={{ fontSize: 8.5 }}>Jalan Raden Patah 1 No 1 Lantai 2 Wing 3.</Text>
            <Text style={{ fontSize: 8.5 }}>Kebayoran Baru, Jakarta Selatan 12110</Text>
            <Text style={{ fontSize: 8.5, marginTop: 3 }}>Perihal : Permohonan Subsidi Bantuan Uang Muka (SBUM)</Text>
          </View>

          <Text style={styles.paragraph}>Saya yang bertanda tangan dibawah ini :</Text>
          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Nama</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCell}>{customer.nama}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Tempat/tgl lahir</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Pekerjaan</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customer.pekerjaan || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>No KTP</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customer.nik || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Alamat</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customerAlamat}</Text>
            </View>
          </View>

          <Text style={styles.paragraph}>Mengajukan permohonan Subsidi Bantuan Uang Muka untuk pembelian rumah sejahtera tapak dengan keterangan sebagai berikut:</Text>
          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Nama Pengembang</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCell}>{pengembang}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Alamat Rumah Yang Dibeli</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{unitAlamat}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Harga Jual Rumah</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>Rp {hargaJual}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Besaran Uang Muka</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>Rp {uangMuka}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Bank Pelaksana</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{bankNama}</Text>
            </View>
          </View>

          <Text style={styles.paragraph}>
            Sebagai pertimbangan, bersama ini kami lampirkan dokumen fotokopi surat pengakuan kekurangan bayar uang muka pembelian rumah sejahtera tapak yang disetujui oleh ...........................................................*)
          </Text>
          <Text style={styles.paragraph}>
            Dengan surat permohonan ini saya menyatakan telah memahami dan tunduk pada ketentuan Pemerintah yang mengatur Subsidi Bantuan Uang Muka (SBUM). Apabila dikemudian hari saya tidak dapat menjalankan ketentuan Pemerintah tersebut diatas yang mengakibatkan Pemerintah mencabut semua kemudahan dan subsidi terkait kemudahan dalam perolehan rumah, saya bersedia mengembalikan semua kemudahan dan subsidi yang telah saya terima tersebut.
          </Text>
          <Text style={styles.paragraph}>Demikian kami sampaikan atas perhatiannya kami ucapkan terima kasih.</Text>

          <View style={[styles.signatureContainer, { justifyContent: 'flex-end', marginTop: 10 }]}>
            <View style={styles.signatureBox}>
              <Text>Purwakarta, .........................................</Text>
              <View style={styles.signatureSpace} />
              <Text style={styles.signatureName}>( {customer.nama} )</Text>
            </View>
          </View>
          <Text style={styles.footnote}>*) diisi dengan nama direktur atau yang mewakili pengembang dan nama perusahaan pengembang</Text>
        </Page>
      )}

      {/* ── LAMPIRAN 9 ── */}
      {no === 9 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.headerDoc}>
            <Text style={[styles.docNumber, { textDecoration: 'underline' }]}>LAMPIRAN 9</Text>
            <Text style={[styles.docTitle, { textDecoration: 'underline' }]}>SURAT PENGAKUAN KEKURANGAN BAYAR UANG MUKA</Text>
          </View>

          <Text style={styles.paragraph}>Saya, yang bertanda tangan di bawah ini :</Text>
          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Nama</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCell}>{customer.nama}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Tempat, Tanggal Lahir</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Pekerjaan</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customer.pekerjaan || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>No KTP</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customer.nik || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Alamat</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customerAlamat}</Text>
            </View>
          </View>

          <Text style={styles.paragraph}>
            Dengan ini menyatakan bahwa saya telah melakukan pembayaran uang muka sebesar Rp ....................................... (.............................................................. rupiah) dan masih memiliki kekurangan bayar uang muka sebesar Rp ....................................... (.............................................................. rupiah) untuk pembelian rumah sejahtera tapak kepada :
          </Text>

          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Nama</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCell}>{pengembang}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Alamat Rumah Yang Dibeli</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{unitAlamat}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Harga Jual Rumah</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>Rp {hargaJual}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Besaran Uang Muka</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>Rp {uangMuka}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Bank Pelaksana</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{bankNama}</Text>
            </View>
          </View>

          <Text style={styles.paragraph}>Demikian kami sampaikan, atas perhatiannya kami ucapkan terima kasih.</Text>

          <View style={{ marginTop: 8 }}>
            <Text style={{ textAlign: 'right', fontSize: 8.5, marginBottom: 3 }}>Purwakarta, .........................................</Text>
            <View style={styles.signatureContainer}>
              <View style={styles.signatureBox}>
                <Text>Menyetujui,</Text>
                <Text style={{ fontSize: 8, color: '#6b7280' }}>(Jabatan yang mewakili pengembang)</Text>
                <View style={styles.signatureSpace} />
                <Text>( .................................. )</Text>
              </View>
              <View style={styles.signatureBox}>
                <Text>Pemohon,</Text>
                <View style={styles.signatureSpace}>
                  <View style={styles.materaiBox}>
                    <Text style={styles.materaiText}>Materai secukupnya</Text>
                  </View>
                </View>
                <Text style={styles.signatureName}>( {customer.nama} )</Text>
              </View>
            </View>
          </View>
          <Text style={styles.footnote}>*) diisi dengan nama direktur atau yang mewakili pengembang dan nama perusahaan/pengembang</Text>
        </Page>
      )}

      {/* ── LAMPIRAN 10 ── */}
      {no === 10 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.headerDoc}>
            <Text style={[styles.docNumber, { textDecoration: 'underline' }]}>LAMPIRAN 10</Text>
            <Text style={[styles.docTitle, { textDecoration: 'underline' }]}>SURAT KETERANGAN PEMINDAHBUKUAN DANA SBUM</Text>
            <Text style={[styles.docSubtitle, { textDecoration: 'underline', fontFamily: 'Helvetica-Bold' }]}>(STANDING INSTRUCTION)</Text>
          </View>

          <Text style={styles.paragraph}>
            Sehubungan dengan permohonan dana Subsidi Bantuan Uang Muka (SBUM) kepada Kepala Satuan Kerja Direktorat Jenderal Pembiayaan Perumahan Kementerian Pekerjaan Umum dan Perumahan Rakyat, maka saya yang bertanda tangan dibawah ini :
          </Text>

          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Nama</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCell}>{customer.nama}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>NIK</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customer.nik || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Tempat, Tanggal Lahir</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Pekerjaan</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customer.pekerjaan || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Alamat</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customerAlamat}</Text>
            </View>
          </View>

          <Text style={styles.paragraph}>
            Dengan ini memberikan kuasa kepada PT. Bank Tabungan Negara (Persero) Tbk. Kantor Cabang {bank?.cabang || 'Purwakarta'} Untuk melakukan pemindahbukuan pencairan dana Subsidi Bantuan Uang Muka (SBUM) senilai Rp ............................................., - (..........................................................................................) untuk digunakan sebagai pengurangan pokok kredit/pembayaran kekurangan uang muka pembelian Rumah Umum Tapak *), kepada :
          </Text>

          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Nama Pengembang</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCell}>{pengembang}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Nomor Rekening</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCell}>00181-01-30-666-666-1</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Rekening Atas Nama</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCell}>{pengembang}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Pada Bank</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>Bank BTN Kantor Cabang/Kantor Kas {bank?.cabang || 'Purwakarta'}</Text>
            </View>
          </View>

          <Text style={styles.paragraph}>
            Demikian Standing Instruction ini dibuat tanpa adanya paksaan dari pihak manapun. Akibat apapun yang mungkin timbul dari paksaan penyaluran dana oleh PT. Bank Tabungan Negara (Persero) Tbk. Berdasarkan Standing Instruction ini adalah sepenuhnya menjadi tanggung jawab saya pribadi.
          </Text>

          <View style={{ marginTop: 8 }}>
            <View style={styles.signatureContainer}>
              <View style={styles.signatureBox}>
                <Text>Menyetujui</Text>
                <Text style={{ fontSize: 8 }}>PT. BANK TABUNGAN NEGARA (Persero) Tbk</Text>
                <Text style={{ fontSize: 8 }}>Kantor Cabang {bank?.cabang || 'Purwakarta'}</Text>
                <View style={styles.signatureSpace} />
                <Text>( ............................................................ )</Text>
                <Text style={{ fontSize: 7, color: '#6b7280' }}>Nama Lengkap, jabatan, Stempel</Text>
              </View>
              <View style={styles.signatureBox}>
                <Text>Purwakarta, .........................................</Text>
                <View style={styles.signatureSpace}>
                  <View style={styles.materaiBox}>
                    <Text style={styles.materaiText}>Materai secukupnya</Text>
                  </View>
                </View>
                <Text style={styles.signatureName}>( {customer.nama} )</Text>
                <Text style={{ fontSize: 7, color: '#6b7280' }}>Nama Lengkap Pembuat SI</Text>
              </View>
            </View>
          </View>
        </Page>
      )}

      {/* ── LAMPIRAN 12 ── */}
      {no === 12 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.headerDoc}>
            <Text style={[styles.docNumber, { textDecoration: 'underline' }]}>LAMPIRAN 12</Text>
            <Text style={[styles.docTitle, { textDecoration: 'underline' }]}>SURAT KUASA</Text>
          </View>

          <Text style={styles.paragraph}>Saya, yang bertanda-tangan di bawah ini :</Text>
          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Nama</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCell}>{customer.nama}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Tempat/tgl lahir</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Pekerjaan</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customer.pekerjaan || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>NIK</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customer.nik || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Alamat</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customerAlamat}</Text>
            </View>
          </View>
          <Text style={styles.paragraph}>yang dalam hal ini bertindak untuk dan atas nama sendiri. Selanjutnya disebut : <strong>PEMBERI KUASA</strong></Text>

          <Text style={styles.paragraph}>
            PT BANK TABUNGAN NEGARA (Persero) Tbk, berkedudukan di Jl. Gajah Mada No. 1 Jakarta Pusat yang dalam hal ini diwakili oleh ........................................................................ selaku ........................................................................ di PT. BANK TABUNGAN NEGARA (Persero) Kantor Cabang {bank?.cabang || 'Purwakarta'}. Selanjutnya disebut : <strong>PENERIMA KUASA</strong>.
          </Text>

          <Text style={styles.paragraph}>
            Dengan ini PEMBERI KUASA memberi kuasa kepada PENERIMA KUASA untuk melakukan pendebetan pada Nomor Rekening Tabungan PEMBERI KUASA: {customer.nomor_rekening_kpr || '..........................................'} atas biaya asuransi, biaya pengikatan agunan, dan biaya lainnya yang timbul atas penghentian KPR Bersubsidi yang disebabkan oleh dokumen pernyataan yang saya buat tidak benar dan/atau tidak saya penuhi dalam proses pengajuan KPR Bersubsidi pada Bank BTN.
          </Text>

          <Text style={styles.paragraph}>
            Kuasa ini diberikan dengan hak Substitusi, tidak dapat dicabut kembali dan tidak akan berakhir karena sebab - sebab yang tercantum dalam pasal 1813 Kitab Undang - Undang Hukum Perdata atau karena sebab apapun juga.
          </Text>

          <View style={{ marginTop: 12 }}>
            <Text style={{ textAlign: 'right', fontSize: 8.5, marginBottom: 4 }}>Purwakarta, .........................................</Text>
            <View style={styles.signatureContainer}>
              <View style={styles.signatureBox}>
                <Text>Penerima Kuasa</Text>
                <Text style={{ fontSize: 8 }}>PT. BANK TABUNGAN NEGARA (Persero) Tbk</Text>
                <Text style={{ fontSize: 8 }}>Kantor Cabang {bank?.cabang || 'Purwakarta'}</Text>
                <View style={styles.signatureSpace} />
                <Text>( ..................................................... )</Text>
              </View>
              <View style={styles.signatureBox}>
                <Text>Pemberi Kuasa,</Text>
                <View style={styles.signatureSpace}>
                  <View style={styles.materaiBox}>
                    <Text style={styles.materaiText}>Materai secukupnya</Text>
                  </View>
                </View>
                <Text style={styles.signatureName}>( {customer.nama} )</Text>
              </View>
            </View>
          </View>
        </Page>
      )}

      {/* ── LAMPIRAN 13 ── */}
      {no === 13 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.headerDoc}>
            <Text style={[styles.docNumber, { textDecoration: 'underline' }]}>LAMPIRAN 13</Text>
            <Text style={[styles.docTitle, { textDecoration: 'underline' }]}>SURAT PERNYATAAN</Text>
            <Text style={[styles.docTitle, { textDecoration: 'underline' }]}>PRASARANA, SARANA &amp; UTILITAS PERUMAHAN</Text>
          </View>

          <Text style={styles.paragraph}>Saya, yang bertanda-tangan di bawah ini :</Text>
          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Nama</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCell}>{customer.nama}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Tempat/tgl lahir</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Pekerjaan</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customer.pekerjaan || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>NIK</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customer.nik || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Alamat</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customerAlamat}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 8.5, fontStyle: 'italic', marginBottom: 3 }}>Selaku calon debitur.</Text>

          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Nama</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCell}>{customer.nama_pasangan || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Tempat/tgl lahir</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customer.tempat_lahir_pasangan || '-'}, {customer.tanggal_lahir_pasangan ? formatTanggalIndonesia(customer.tanggal_lahir_pasangan) : '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Pekerjaan</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customer.pekerjaan_pasangan || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>NIK</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customer.nik_pasangan || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Alamat</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{spouseAlamat}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 8.5, fontStyle: 'italic', marginBottom: 4 }}>Selaku suami/istri pemohon.</Text>

          <Text style={styles.sectionTitle}>Menyatakan hal-hal sebagai berikut:</Text>
          <View style={{ marginBottom: 3 }}>
            <View style={styles.listRow}>
              <Text style={styles.listNum}>1.</Text>
              <Text style={styles.listText}>
                Saya telah mempertimbangkan dengan baik dan tanpa paksaan dari pihak manapun sebelum memutuskan untuk membeli 1 (satu) unit Rumah Sejahtera Tapak/Satuan Rumah Sejahtera Susun*) dari pengembang/developer {pengembang}
              </Text>
            </View>
            <View style={styles.listRow}>
              <Text style={styles.listNum}>2.</Text>
              <Text style={styles.listText}>
                Saya telah mengetahui dan bersedia menerima kondisi Rumah Sejahtera Tapak/Satuan Rumah Sejahtera Susun*) beserta dengan kondisi Prasarana, Sarana &amp; Utilitas (PSU) dengan rincian sebagai berikut:
              </Text>
            </View>
            <View style={[styles.listRow, { paddingLeft: 22 }]}>
              <Text style={styles.listNum}>-</Text>
              <Text style={styles.listText}>Telah ada bukti pembayaran biaya penyambunga listrik dari PLN.</Text>
            </View>
            <View style={[styles.listRow, { paddingLeft: 22 }]}>
              <Text style={styles.listNum}>-</Text>
              <Text style={styles.listText}>Telah tersedia sumber air yang berfungsi.</Text>
            </View>
            <View style={[styles.listRow, { paddingLeft: 22 }]}>
              <Text style={styles.listNum}>-</Text>
              <Text style={styles.listText}>Badan jalan telah dilakukan pengerasan.</Text>
            </View>
            <View style={[styles.listRow, { paddingLeft: 22 }]}>
              <Text style={styles.listNum}>-</Text>
              <Text style={styles.listText}>Saluran/drainase lingkungan telah tergali.</Text>
            </View>
            <View style={styles.listRow}>
              <Text style={styles.listNum}>3.</Text>
              <Text style={styles.listText}>
                Saya tidak akan mengkaitkan kondisi Prasarana, Sarana &amp; Utilitas (PSU) dengan kewajiban pembayaran angsuran KPR BTN Bersubsidi.*)
              </Text>
            </View>
          </View>

          <Text style={styles.paragraph}>
            Demikian surat pernyataan ini saya buat dengan sebenar-benarnya tanpa paksaan dari pihak manapun.
          </Text>

          <View style={{ marginTop: 6 }}>
            <Text style={{ textAlign: 'right', fontSize: 8.5, marginBottom: 2 }}>Purwakarta, .........................................</Text>
            <View style={styles.signatureContainer}>
              <View style={styles.signatureBox}>
                <Text>Menyetujui,</Text>
                <View style={styles.signatureSpace} />
                <Text style={styles.signatureName}>( {customer.nama_pasangan || 'ILA ROKHMAH'} )</Text>
              </View>
              <View style={styles.signatureBox}>
                <Text>Yang membuat pernyataan,</Text>
                <View style={styles.signatureSpace}>
                  <View style={styles.materaiBox}>
                    <Text style={styles.materaiText}>Materai secukupnya</Text>
                  </View>
                </View>
                <Text style={styles.signatureName}>( {customer.nama} )</Text>
              </View>
            </View>
          </View>
          <Text style={styles.footnote}>*) Pilih salah satu</Text>
        </Page>
      )}

      {/* ── LAMPIRAN 14 ── */}
      {no === 14 && (
        <Page size="A4" style={[styles.page, { paddingTop: 16, paddingBottom: 16 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', textDecoration: 'underline' }}>LAMPIRAN 14</Text>
            <Text style={{ fontSize: 7.5 }}>(Format Internal Bank)</Text>
          </View>
          <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', textAlign: 'center', marginBottom: 4 }}>
            SURAT PERNYATAAN PEMOHON KPR BERSUBSIDI BTN
          </Text>

          <Text style={{ fontSize: 8, marginBottom: 2 }}>Yang bertanda-tangan di bawah ini :</Text>
          <View style={[styles.table, { marginBottom: 2 }]}>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { fontSize: 8, width: 110 }]}>Nama Lengkap</Text>
              <Text style={[styles.colonCell, { fontSize: 8 }]}>:</Text>
              <Text style={[styles.valueCell, { fontSize: 8 }]}>{customer.nama}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { fontSize: 8, width: 110 }]}>No KTP</Text>
              <Text style={[styles.colonCell, { fontSize: 8 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8 }]}>{customer.nik || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { fontSize: 8, width: 110 }]}>Tempat/Tgl lahir</Text>
              <Text style={[styles.colonCell, { fontSize: 8 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8 }]}>{customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { fontSize: 8, width: 110 }]}>Pekerjaan</Text>
              <Text style={[styles.colonCell, { fontSize: 8 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8 }]}>{customer.pekerjaan || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { fontSize: 8, width: 110 }]}>Alamat</Text>
              <Text style={[styles.colonCell, { fontSize: 8 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8 }]}>{customerAlamat}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 7.5, fontStyle: 'italic', marginBottom: 2 }}>Selaku pemohon.</Text>

          <View style={[styles.table, { marginBottom: 2 }]}>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { fontSize: 8, width: 110 }]}>Nama Lengkap</Text>
              <Text style={[styles.colonCell, { fontSize: 8 }]}>:</Text>
              <Text style={[styles.valueCell, { fontSize: 8 }]}>{customer.nama_pasangan || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { fontSize: 8, width: 110 }]}>No KTP</Text>
              <Text style={[styles.colonCell, { fontSize: 8 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8 }]}>{customer.nik_pasangan || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { fontSize: 8, width: 110 }]}>Tempat/Tgl lahir</Text>
              <Text style={[styles.colonCell, { fontSize: 8 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8 }]}>{customer.tempat_lahir_pasangan || '-'}, {customer.tanggal_lahir_pasangan ? formatTanggalIndonesia(customer.tanggal_lahir_pasangan) : '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { fontSize: 8, width: 110 }]}>Pekerjaan</Text>
              <Text style={[styles.colonCell, { fontSize: 8 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8 }]}>{customer.pekerjaan_pasangan || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { fontSize: 8, width: 110 }]}>Alamat</Text>
              <Text style={[styles.colonCell, { fontSize: 8 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8 }]}>{spouseAlamat}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 7.5, fontStyle: 'italic', marginBottom: 3 }}>Selaku suami/istri pemohon.</Text>

          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>Menyatakan dengan sesungguhnya:</Text>
          <View style={{ marginBottom: 2 }}>
            <View style={styles.listRow}>
              <Text style={[styles.listNum, { fontSize: 7.8 }]}>1.</Text>
              <Text style={[styles.listText, { fontSize: 7.8 }]}>
                Saya selaku pemohon memiliki gaji/upah pokok/penghasilan bersih/upah rata-rata*) perbulan sebesar Rp {formatRupiah(customer.pendapatan_per_bulan || 0)} (.............................................................. rupiah).
              </Text>
            </View>
            <View style={styles.listRow}>
              <Text style={[styles.listNum, { fontSize: 7.8 }]}>2.</Text>
              <Text style={[styles.listText, { fontSize: 7.8 }]}>Saya dan istri/suami*) tidak memiliki hak kepemilikan atas rumah pada saat pengajuan pembiayaan KPR Bersubsidi BTN.</Text>
            </View>
            <View style={styles.listRow}>
              <Text style={[styles.listNum, { fontSize: 7.8 }]}>3.</Text>
              <Text style={[styles.listText, { fontSize: 7.8 }]}>Saya dan istri/suami*) belum pernah menerima subsidi atau bantuan pembiayaan perumahan dari pemerintah terkait kredit/pembiayaan kepemilikan rumah dan/atau pembangunan rumah swadaya.</Text>
            </View>
            <View style={styles.listRow}>
              <Text style={[styles.listNum, { fontSize: 7.8 }]}>4.</Text>
              <Text style={[styles.listText, { fontSize: 7.8 }]}>Saya membeli Rumah Umum Tapak/Sarusun Umum dengan harga Rp {hargaJual} (.............................................................. rupiah) dari pengembang {pengembang}.</Text>
            </View>
            <View style={styles.listRow}>
              <Text style={[styles.listNum, { fontSize: 7.8 }]}>5.</Text>
              <Text style={[styles.listText, { fontSize: 7.8 }]}>Saya dan istri/suami*) akan menggunakan Rumah Umum Tapak/Sarusun Umum sebagai tempat tinggal saya dan/atau keluarga dalam kurun waktu paling lambat 1 (satu) tahun setelah terima rumah.</Text>
            </View>
            <View style={styles.listRow}>
              <Text style={[styles.listNum, { fontSize: 7.8 }]}>6.</Text>
              <Text style={[styles.listText, { fontSize: 7.8 }]}>
                Saya dan istri/suami*) tidak akan menyewakan/mengontrakkan, memperjual-belikan atau memindahtangankan dengan bentuk perbuatan hukum apapun, kecuali : penghunian telah melampaui 5 tahun (tapak)/20 tahun (sarusun), pindah tempat tinggal sesuai regulasi, pewarisan, atau penyelesaian kredit bermasalah Bank BTN.
              </Text>
            </View>
            <View style={styles.listRow}>
              <Text style={[styles.listNum, { fontSize: 7.8 }]}>7.</Text>
              <Text style={[styles.listText, { fontSize: 7.8 }]}>Bersedia melakukan aktivasi ulang QR Code sesuai tata cara yang ditentukan PPDPP dan/atau Satuan Kerja Kementerian PUPR setiap tahun ke-5 sejak akad.</Text>
            </View>
            <View style={styles.listRow}>
              <Text style={[styles.listNum, { fontSize: 7.8 }]}>8.</Text>
              <Text style={[styles.listText, { fontSize: 7.8 }]}>Bersedia memindahkan domisili kependudukan dalam KTP ke alamat agunan paling lambat 1 (satu) tahun sejak akad KPR Bersubsidi BTN.</Text>
            </View>
            <View style={styles.listRow}>
              <Text style={[styles.listNum, { fontSize: 7.8 }]}>9.</Text>
              <Text style={[styles.listText, { fontSize: 7.8 }]}>Semua dokumen persyaratan yang disampaikan kepada Bank BTN adalah benar dan dapat dipertanggungjawabkan keabsahannya.</Text>
            </View>
            <View style={styles.listRow}>
              <Text style={[styles.listNum, { fontSize: 7.8 }]}>10.</Text>
              <Text style={[styles.listText, { fontSize: 7.8 }]}>Apabila di kemudian hari pernyataan saya tidak benar, saya bersedia mengembalikan seluruh subsidi yang diterima dan dikenakan sanksi perundang-undangan.</Text>
            </View>
          </View>

          <Text style={{ fontSize: 7.8, marginBottom: 3 }}>Demikian surat pernyataan ini saya buat dengan sebenar-benarnya tanpa paksaan dari pihak manapun.</Text>

          <View style={{ marginTop: 4 }}>
            <Text style={{ textAlign: 'right', fontSize: 7.8, marginBottom: 2 }}>Purwakarta, .........................................</Text>
            <View style={[styles.signatureContainer, { marginTop: 3 }]}>
              <View style={styles.signatureBox}>
                <Text style={{ fontSize: 7.8 }}>Menyetujui,</Text>
                <View style={[styles.signatureSpace, { height: 28 }]} />
                <Text style={[styles.signatureName, { fontSize: 8 }]}>({customer.nama_pasangan || 'ILA ROKHMAH'})</Text>
              </View>
              <View style={styles.signatureBox}>
                <Text style={{ fontSize: 7.8 }}>Yang membuat pernyataan,</Text>
                <View style={[styles.signatureSpace, { height: 28 }]}>
                  <View style={styles.materaiBox}>
                    <Text style={[styles.materaiText, { fontSize: 6.5 }]}>Materai secukupnya</Text>
                  </View>
                </View>
                <Text style={[styles.signatureName, { fontSize: 8 }]}>({customer.nama})</Text>
              </View>
            </View>

            <View style={[styles.signatureBoxCenter, { marginTop: 3 }]}>
              <Text style={{ fontSize: 7.8 }}>Mengetahui,</Text>
              <Text style={{ fontSize: 7.5 }}>Pimpinan Tempat Bekerja/Kepala Desa/Lurah* ......................................</Text>
              <View style={{ height: 24 }} />
              <Text style={{ fontSize: 7.8 }}>( ...................................... )</Text>
            </View>
          </View>
          <Text style={[styles.footnote, { fontSize: 6.5 }]}>*) Coret salah yang tidak perlu</Text>
        </Page>
      )}

      {/* ── LAMPIRAN 11 (SURAT PERNYATAAN PENYELESAIAN PSU - FORMAT PERSIS GAMBAR) ── */}
      {no === 11 && (
        <Page size="A4" style={[styles.page, { paddingTop: 16, paddingBottom: 16, fontSize: 8.2, lineHeight: 1.25 }]}>
          <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', marginBottom: 6 }}>
            LAMPIRAN 11
          </Text>

          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 10.5, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', textAlign: 'center' }}>
              SURAT PERNYATAAN PENYELESAIAN
            </Text>
            <Text style={{ fontSize: 10.5, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', textAlign: 'center' }}>
              PRASARANA, SARANA &amp; UTILITAS PERUMAHAN
            </Text>
          </View>

          <Text style={{ fontSize: 8.2, marginBottom: 3 }}>Yang bertanda tangan dibawah ini:</Text>

          <View style={[styles.table, { marginBottom: 3 }]}>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 110, fontSize: 8.2 }]}>Nama</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>ALAN SUHERLAN</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 110, fontSize: 8.2 }]}>No. KTP</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>3214120810690001</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 110, fontSize: 8.2 }]}>Alamat Kantor/Telp</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.2 }]}>
                Perumahan Benteng Mutiara Mas Ruko No. 16 Kp babakan Situ 04/02 / 0264-8308460
              </Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 110, fontSize: 8.2 }]}>Jabatan</Text>
              <Text style={[styles.colonCell, { fontSize: 8.2 }]}>:</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 8.2 }}>Direktur Utama yang mewakili PT LAN SENA JAYA</Text>
                <Text style={{ fontSize: 8.2 }}>selaku pengembang pada proyek perumahan Benteng Mutiara Mas</Text>
              </View>
            </View>
          </View>

          <Text style={{ fontSize: 8.2, marginBottom: 2 }}>Menyatakan hal-hal sebagai berikut:</Text>

          <View style={{ marginBottom: 2 }}>
            <View style={[styles.listRow, { marginBottom: 2 }]}>
              <Text style={[styles.listNum, { fontSize: 8 }]}>1.</Text>
              <Text style={[styles.listText, { fontSize: 8 }]}>
                Bahwa rumah sejahtera yang dijual oleh PT. LAN SENA JAYA dan diserah terimakan kepada debitur Bank BTN pada saat akad kredit adalah dalam kondisi siap huni dan telah memenuhi persyaratan teknis keselamatan, keamanan dan kehandalan bangunan sesuai dengan ketentuan Pemerintah yang berlaku.
              </Text>
            </View>
            <View style={[styles.listRow, { marginBottom: 2 }]}>
              <Text style={[styles.listNum, { fontSize: 8 }]}>2.</Text>
              <Text style={[styles.listText, { fontSize: 8 }]}>
                Bahwa pada saat surat pernyataan ini ditandatangani, PT LAN SENA JAYA telah menyerahkan bukti pembayaran biaya penyambungan listrik dari PLN dan jalan lingkungan telah dilakukan perkerasan badan jalan dan berfungsi.
              </Text>
            </View>
            <View style={[styles.listRow, { marginBottom: 2 }]}>
              <Text style={[styles.listNum, { fontSize: 8 }]}>3.</Text>
              <Text style={[styles.listText, { fontSize: 8 }]}>
                Bahwa PT LAN SENA JAYA bersedia menyelesaikan jalan lingkungan paling lambat 3 (tiga) bulan sejak perjanjian kredit/akad pembayaran KPR Bersubsidi.
              </Text>
            </View>
            <View style={[styles.listRow, { marginBottom: 2 }]}>
              <Text style={[styles.listNum, { fontSize: 8 }]}>4.</Text>
              <Text style={[styles.listText, { fontSize: 8 }]}>
                Bahwa PT LAN SENA JAYA bersedia menyediakan dana jaminan kepada Bank BTN berupa dana yang ditahan (dana retensi) dengan rincian sebagai berikut :
              </Text>
            </View>
            <View style={[styles.listRow, { paddingLeft: 22, marginBottom: 1 }]}>
              <Text style={[styles.listNum, { fontSize: 7.8 }]}>1.</Text>
              <Text style={[styles.listText, { fontSize: 7.8 }]}>
                Dana yang ditahan untuk setiap debit/unit rumah, berjumlah paling sedikit 2 (dua) kali nilai jalan lingkungan yang belum terselesaikan.
              </Text>
            </View>
            <View style={[styles.listRow, { paddingLeft: 22, marginBottom: 1 }]}>
              <Text style={[styles.listNum, { fontSize: 7.8 }]}>2.</Text>
              <Text style={[styles.listText, { fontSize: 7.8 }]}>
                Nilai jalan lingkungan adalah berdasarkan penilaian (appraisal) Bank BTN.
              </Text>
            </View>
            <View style={[styles.listRow, { paddingLeft: 22, marginBottom: 1 }]}>
              <Text style={[styles.listNum, { fontSize: 7.8 }]}>3.</Text>
              <Text style={[styles.listText, { fontSize: 7.8 }]}>
                Dana yang ditahan diambil dari hasil setiap pencairan KPR Bersubsidi untuk setiap debit/unit rumah yang jalan lingkungan yang belum terselesaikan.
              </Text>
            </View>
            <View style={[styles.listRow, { marginBottom: 2 }]}>
              <Text style={[styles.listNum, { fontSize: 8 }]}>5.</Text>
              <Text style={[styles.listText, { fontSize: 8 }]}>
                Dalam hal PT. LAN SENA JAYA tidak dapat menyelesaikan kewajiban sebagaimana dimaksud butir 3 di atas maka bersedia dan menyetujui dana jaminan sebagaimana dimaksud butir 4 di atas digunakan oleh Bank BTN untuk memastikan kewajiban penyelesaian jalan lingkungan dengan sesuai dengan ketentuan Pemerintah yang berlaku.
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 8, textAlign: 'justify', marginBottom: 3 }}>
            Surat pernyataan ini adalah bagian yang tidak terpisahkan dari Perjanjian Kerjasama (PKS) dengan Bank BTN Kantor Cabang ............................ tentang Penyediaan Dukungan KPR BTN Bersubsidi Nomor ..................................................................... tanggal ...................................
          </Text>

          <Text style={{ fontSize: 8, textAlign: 'justify', marginBottom: 4 }}>
            Demikian surat pernyataan ini dibuat dengan sebenarnya tanpa paksaan dari pihak manapun dan apabila di kemudian hari pernyataan ini tidak benar, maka bersedia menerima konsekuensi sesuai dengan ketentuan Pemerintah dan Perundang-undangan yang berlaku.
          </Text>

          <View style={[styles.signatureContainer, { justifyContent: 'flex-end', marginTop: 4 }]}>
            <View style={[styles.signatureBox, { width: 180 }]}>
              <Text style={{ fontSize: 8 }}>Purwakarta, .........................................</Text>
              <Text style={{ fontSize: 8, marginTop: 1 }}>Yang membuat pernyataan,</Text>
              <View style={[styles.signatureSpace, { height: 34 }]}>
                <Text style={{ fontSize: 7, color: '#9ca3af' }}>Materai secukupnya</Text>
              </View>
              <Text style={[styles.signatureName, { fontSize: 8.5 }]}>ALAN SUHERLAN</Text>
              <Text style={{ fontSize: 8, marginTop: 1 }}>Direktur</Text>
            </View>
          </View>
        </Page>
      )}

      {/* ── LAMPIRAN 15 (FORMAT KEMENTRIAN PUPR - PERSIS GAMBAR) ── */}
      {no === 15 && (
        <Page size="A4" style={[styles.page, { paddingTop: 14, paddingBottom: 14, paddingLeft: 28, paddingRight: 28, fontSize: 7.2, lineHeight: 1.18 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', textDecoration: 'underline' }}>LAMPIRAN 15</Text>
            <Text style={{ fontSize: 7.5 }}>(Format Kementrian PUPR)</Text>
          </View>

          <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', textAlign: 'center', marginBottom: 4 }}>
            SURAT PERNYATAAN PEMOHON KPR BERSUBSIDI BTN
          </Text>

          <Text style={{ fontSize: 7.2, marginBottom: 1 }}>Yang bertanda-tangan di bawah ini :</Text>

          <View style={[styles.table, { marginBottom: 1 }]}>
            <View style={[styles.row, { marginBottom: 0.8 }]}>
              <Text style={[styles.labelCell, { width: 110, fontSize: 7.2 }]}>Nama Lengkap</Text>
              <Text style={[styles.colonCell, { fontSize: 7.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 7.2 }]}>{customer.nama}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 0.8 }]}>
              <Text style={[styles.labelCell, { width: 110, fontSize: 7.2 }]}>No KTP</Text>
              <Text style={[styles.colonCell, { fontSize: 7.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 7.2 }]}>{customer.nik || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 0.8 }]}>
              <Text style={[styles.labelCell, { width: 110, fontSize: 7.2 }]}>Tempat/Tgl lahir</Text>
              <Text style={[styles.colonCell, { fontSize: 7.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 7.2 }]}>
                {customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}
              </Text>
            </View>
            <View style={[styles.row, { marginBottom: 0.8 }]}>
              <Text style={[styles.labelCell, { width: 110, fontSize: 7.2 }]}>Pekerjaan</Text>
              <Text style={[styles.colonCell, { fontSize: 7.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 7.2 }]}>{customer.pekerjaan || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 0.8 }]}>
              <Text style={[styles.labelCell, { width: 110, fontSize: 7.2 }]}>Alamat</Text>
              <Text style={[styles.colonCell, { fontSize: 7.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 7.2 }]}>{customerAlamat}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 7, fontStyle: 'italic', marginBottom: 2 }}>Selaku pemohon.</Text>

          <View style={[styles.table, { marginBottom: 1 }]}>
            <View style={[styles.row, { marginBottom: 0.8 }]}>
              <Text style={[styles.labelCell, { width: 110, fontSize: 7.2 }]}>Nama Lengkap</Text>
              <Text style={[styles.colonCell, { fontSize: 7.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 7.2 }]}>{customer.nama_pasangan || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 0.8 }]}>
              <Text style={[styles.labelCell, { width: 110, fontSize: 7.2 }]}>No KTP</Text>
              <Text style={[styles.colonCell, { fontSize: 7.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 7.2 }]}>{customer.nik_pasangan || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 0.8 }]}>
              <Text style={[styles.labelCell, { width: 110, fontSize: 7.2 }]}>Tempat/Tgl lahir</Text>
              <Text style={[styles.colonCell, { fontSize: 7.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 7.2 }]}>
                {customer.tempat_lahir_pasangan || '-'}, {customer.tanggal_lahir_pasangan ? formatTanggalIndonesia(customer.tanggal_lahir_pasangan) : '-'}
              </Text>
            </View>
            <View style={[styles.row, { marginBottom: 0.8 }]}>
              <Text style={[styles.labelCell, { width: 110, fontSize: 7.2 }]}>Pekerjaan</Text>
              <Text style={[styles.colonCell, { fontSize: 7.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 7.2 }]}>{customer.pekerjaan_pasangan || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 0.8 }]}>
              <Text style={[styles.labelCell, { width: 110, fontSize: 7.2 }]}>Alamat</Text>
              <Text style={[styles.colonCell, { fontSize: 7.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 7.2 }]}>{spouseAlamat}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 7, fontStyle: 'italic', marginBottom: 2 }}>Selaku suami/istri pemohon.</Text>

          <Text style={{ fontSize: 7.2, marginBottom: 1 }}>Menyatakan dengan sesungguhnya:</Text>
          <View style={{ marginBottom: 2 }}>
            <View style={[styles.listRow, { marginBottom: 1 }]}>
              <Text style={[styles.listNum, { fontSize: 7.2 }]}>1.</Text>
              <Text style={[styles.listText, { fontSize: 7.2 }]}>
                Saya selaku pemohon memiliki gaji/upah pokok/penghasil bersih/upah rata-rata*) perbulan sebesar
                {'\n'}Rp ......................................... (.............................................................. rupiah)
              </Text>
            </View>
            <View style={[styles.listRow, { marginBottom: 1 }]}>
              <Text style={[styles.listNum, { fontSize: 7.2 }]}>2.</Text>
              <Text style={[styles.listText, { fontSize: 7.2 }]}>
                Saya dan istri/suami*) tidak memiliki hak kepemilikan atas rumah pada saat pengajuan pembiayaan KPR Bersubsidi BTN.
              </Text>
            </View>
            <View style={[styles.listRow, { marginBottom: 1 }]}>
              <Text style={[styles.listNum, { fontSize: 7.2 }]}>3.</Text>
              <Text style={[styles.listText, { fontSize: 7.2 }]}>
                Saya dan istri/suami*) belum pernah menerima subsidi atau bantuan pembiayaan perumahan dari pemerintah terkait kredit/pembiayaan kepemilikan rumah dan/atau pembangunan rumah swadaya.
              </Text>
            </View>
            <View style={[styles.listRow, { marginBottom: 1 }]}>
              <Text style={[styles.listNum, { fontSize: 7.2 }]}>4.</Text>
              <Text style={[styles.listText, { fontSize: 7.2 }]}>
                Saya membeli Rumah Umum Tapak/Sarusun Umum dengan harga Rp. ......................................... (.............................................................. rupiah) dari pengembang {pengembang}
              </Text>
            </View>
            <View style={[styles.listRow, { marginBottom: 1 }]}>
              <Text style={[styles.listNum, { fontSize: 7.2 }]}>5.</Text>
              <Text style={[styles.listText, { fontSize: 7.2 }]}>
                Saya dan istri/suami*) akan menggunakan Rumah Umum Tapak/Sarusun Umum sebagai tempat tinggal saya dan/atau keluarga dalam kurun waktu paling lambat 1 (satu) tahun setelah terima rumah.
              </Text>
            </View>
            <View style={[styles.listRow, { marginBottom: 1 }]}>
              <Text style={[styles.listNum, { fontSize: 7.2 }]}>6.</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 7.2 }}>
                  Saya dan istri/suami*) tidak akan menyewakan/mengontrakkan, memperjual-belikan atau memindahtangankan dengan bentuk perbuatan hukum apapun, kecuali :
                </Text>
                <View style={{ paddingLeft: 6, marginTop: 0.5 }}>
                  <Text style={{ fontSize: 6.8 }}>o Penghunian telah melampaui 5 (lima) tahun untuk Rumah Umum Tapak.</Text>
                  <Text style={{ fontSize: 6.8 }}>o Penghunian telah melampaui 20 (dua puluh) tahun untuk Sarusun Umum.</Text>
                  <Text style={{ fontSize: 6.8 }}>o Pindah tempat tinggal sesuai ketentuan peraturan perundang-undangan.</Text>
                  <Text style={{ fontSize: 6.8 }}>o Meninggal dunia (pewarisan), atau</Text>
                  <Text style={{ fontSize: 6.8 }}>o Untuk kepentingan Bank BTN dalam rangka penyelesaian kredit bermasalah.</Text>
                </View>
              </View>
            </View>
            <View style={[styles.listRow, { marginBottom: 1 }]}>
              <Text style={[styles.listNum, { fontSize: 7.2 }]}>7.</Text>
              <Text style={[styles.listText, { fontSize: 7.2 }]}>
                Bahwa semua dokumen persyaratan yang disampaikan kepada Bank BTN untuk memperoleh fasilitas subsidi adalah benar dan dapat dipertanggungjawabkan keabsahaannya baik secara formil maupun materil.
              </Text>
            </View>
            <View style={[styles.listRow, { marginBottom: 1 }]}>
              <Text style={[styles.listNum, { fontSize: 7.2 }]}>8.</Text>
              <Text style={[styles.listText, { fontSize: 7.2 }]}>
                Apabila di kemudian hari pernyataan saya tidak benar dan/atau tidak saya penuhi, saya bersedia mengembalikan seluruh subsidi yang telah saya terima dari pemerintah dan bersedia dikenakan sanksi sesuai dengan ketentuan peraturan perundang-undangan.
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 7, textAlign: 'justify', marginBottom: 2 }}>
            Demikian surat pernyataan ini saya buat dengan sebenar-benarnya tanpa paksaan dari pihak manapun.
          </Text>

          <View style={{ marginTop: 1 }}>
            <Text style={{ textAlign: 'right', fontSize: 7.2, marginBottom: 1 }}>Purwakarta, .........................................</Text>
            <View style={styles.signatureContainer}>
              <View style={styles.signatureBox}>
                <Text style={{ fontSize: 7.2 }}>Menyetujui,</Text>
                <View style={[styles.signatureSpace, { height: 22 }]} />
                <Text style={[styles.signatureName, { fontSize: 7.5 }]}>({customer.nama_pasangan || 'ILA ROKHMAH'})</Text>
              </View>
              <View style={styles.signatureBox}>
                <Text style={{ fontSize: 7.2 }}>Yang membuat pernyataan,</Text>
                <View style={[styles.signatureSpace, { height: 22 }]}>
                  <Text style={{ fontSize: 6.5, color: '#9ca3af' }}>Materai secukupnya</Text>
                </View>
                <Text style={[styles.signatureName, { fontSize: 7.5 }]}>({customer.nama})</Text>
              </View>
            </View>

            <View style={[styles.signatureBoxCenter, { marginTop: 2 }]}>
              <Text style={{ fontSize: 7 }}>Mengetahui,</Text>
              <Text style={{ fontSize: 7 }}>Pimpinan Tempat Bekerja/Kepala Desa/Lurah* ......................................</Text>
              <View style={{ height: 18 }} />
              <Text style={{ fontSize: 7 }}>(......................................)</Text>
            </View>
          </View>
          <Text style={[styles.footnote, { fontSize: 6, marginTop: 1 }]}>*) Coret salah yang tidak perlu</Text>
        </Page>
      )}

      {/* ── LAMPIRAN 16 (CALON DEBITUR KPR BERSUBSIDI BTN - PERSIS GAMBAR) ── */}
      {no === 16 && (
        <Page size="A4" style={[styles.page, { paddingTop: 14, paddingBottom: 14, paddingLeft: 28, paddingRight: 28, fontSize: 7.2, lineHeight: 1.18 }]}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', marginBottom: 2 }}>
            LAMPIRAN 16
          </Text>

          <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', textAlign: 'center', marginBottom: 4 }}>
            SURAT PERNYATAAN CALON DEBITUR KPR BERSUBSIDI BTN
          </Text>

          <Text style={{ fontSize: 7, textAlign: 'justify', marginBottom: 2 }}>
            Berkenaan dengan persetujuan Kredit Kepemilikan Rumah Bersubsidi di BTN (KPR, Bersubsidi BTN) yang disampaikan PT. Bank Tabungan Negara (Persero) Tbk. (Bank BTN) melalui Surat Penegasan Persetujuan Pemeberian Krdit (SP3K) No ..................................... Tanggal ..................................... Kami yang bertanda tangan dibawah ini :
          </Text>

          <View style={[styles.table, { marginBottom: 1 }]}>
            <View style={[styles.row, { marginBottom: 0.8 }]}>
              <Text style={[styles.labelCell, { width: 110, fontSize: 7.2 }]}>Nama Lengkap</Text>
              <Text style={[styles.colonCell, { fontSize: 7.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 7.2 }]}>{customer.nama}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 0.8 }]}>
              <Text style={[styles.labelCell, { width: 110, fontSize: 7.2 }]}>No KTP</Text>
              <Text style={[styles.colonCell, { fontSize: 7.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 7.2 }]}>{customer.nik || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 0.8 }]}>
              <Text style={[styles.labelCell, { width: 110, fontSize: 7.2 }]}>Tempat/Tgl lahir</Text>
              <Text style={[styles.colonCell, { fontSize: 7.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 7.2 }]}>
                {customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}
              </Text>
            </View>
            <View style={[styles.row, { marginBottom: 0.8 }]}>
              <Text style={[styles.labelCell, { width: 110, fontSize: 7.2 }]}>Pekerjaan</Text>
              <Text style={[styles.colonCell, { fontSize: 7.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 7.2 }]}>{customer.pekerjaan || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 0.8 }]}>
              <Text style={[styles.labelCell, { width: 110, fontSize: 7.2 }]}>Alamat</Text>
              <Text style={[styles.colonCell, { fontSize: 7.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 7.2 }]}>{customerAlamat}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 7, fontStyle: 'italic', marginBottom: 2 }}>Selaku calon debitur.</Text>

          <View style={[styles.table, { marginBottom: 1 }]}>
            <View style={[styles.row, { marginBottom: 0.8 }]}>
              <Text style={[styles.labelCell, { width: 110, fontSize: 7.2 }]}>Nama Lengkap</Text>
              <Text style={[styles.colonCell, { fontSize: 7.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 7.2 }]}>{customer.nama_pasangan || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 0.8 }]}>
              <Text style={[styles.labelCell, { width: 110, fontSize: 7.2 }]}>No KTP</Text>
              <Text style={[styles.colonCell, { fontSize: 7.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 7.2 }]}>{customer.nik_pasangan || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 0.8 }]}>
              <Text style={[styles.labelCell, { width: 110, fontSize: 7.2 }]}>Tempat/Tgl lahir</Text>
              <Text style={[styles.colonCell, { fontSize: 7.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 7.2 }]}>
                {customer.tempat_lahir_pasangan || '-'}, {customer.tanggal_lahir_pasangan ? formatTanggalIndonesia(customer.tanggal_lahir_pasangan) : '-'}
              </Text>
            </View>
            <View style={[styles.row, { marginBottom: 0.8 }]}>
              <Text style={[styles.labelCell, { width: 110, fontSize: 7.2 }]}>Pekerjaan</Text>
              <Text style={[styles.colonCell, { fontSize: 7.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 7.2 }]}>{customer.pekerjaan_pasangan || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 0.8 }]}>
              <Text style={[styles.labelCell, { width: 110, fontSize: 7.2 }]}>Alamat</Text>
              <Text style={[styles.colonCell, { fontSize: 7.2 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 7.2 }]}>{spouseAlamat}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 7, fontStyle: 'italic', marginBottom: 2 }}>Selaku suami/istri calon debitur.</Text>

          <Text style={{ fontSize: 7.2, marginBottom: 1 }}>Menyatakan dengan sesungguhnya:</Text>
          <View style={{ marginBottom: 2 }}>
            <View style={[styles.listRow, { marginBottom: 1 }]}>
              <Text style={[styles.listNum, { fontSize: 7.2 }]}>1.</Text>
              <Text style={[styles.listText, { fontSize: 7.2 }]}>
                Telah melaksanan setiap proses permohonan KPR Bersubsidi BTN sesuai dengan ketentuan Bank BTN dan menyetujui SP3K dimaksud berdasarkan itikad baik, dalam keadaan bebas, mandiri dan tidak dibawah tekanan maupun pengaruh dari pihak lain (independency).
              </Text>
            </View>
            <View style={[styles.listRow, { marginBottom: 1 }]}>
              <Text style={[styles.listNum, { fontSize: 7.2 }]}>2.</Text>
              <Text style={[styles.listText, { fontSize: 7.2 }]}>
                Telah menerima dan memahami dengan baik setiap penjelasan yang disampaikan Bank BTN mengenai fasilitas KPR Bersubsidi BTN, hak dan kewajiban kami sebagai Debitur serta kewajiban lainnya sesuai ketentuan peraturan perundang-undangan.
              </Text>
            </View>
            <View style={[styles.listRow, { marginBottom: 1 }]}>
              <Text style={[styles.listNum, { fontSize: 7.2 }]}>3.</Text>
              <Text style={[styles.listText, { fontSize: 7.2 }]}>
                Bersedia melakukan aktivasi ualng QR Code setiap tahun hinggan ke 5 (lima) sejak akad KPR Bersubsidi BTN sesuai dengan ketentuan pemerintah.
              </Text>
            </View>
            <View style={[styles.listRow, { marginBottom: 1 }]}>
              <Text style={[styles.listNum, { fontSize: 7.2 }]}>4.</Text>
              <Text style={[styles.listText, { fontSize: 7.2 }]}>
                Bersedia memindahkan domisili kependudukan dalam KTP ke alamat Agunan paling lambat 1 (satu) tahun sejak akad KPR Bersubsidi BTN.
              </Text>
            </View>
            <View style={[styles.listRow, { marginBottom: 1 }]}>
              <Text style={[styles.listNum, { fontSize: 7.2 }]}>5.</Text>
              <Text style={[styles.listText, { fontSize: 7.2 }]}>
                Seluruh dokumen persyaratan yang disampaikan kepada Bank BTN untuk memperoleh fasilitas subsidi adalah benar dan dapat dipertanggungjawabkan keabsahannya baik secara formil maupun materil.
              </Text>
            </View>
            <View style={[styles.listRow, { marginBottom: 1 }]}>
              <Text style={[styles.listNum, { fontSize: 7.2 }]}>6.</Text>
              <Text style={[styles.listText, { fontSize: 7.2 }]}>
                Bersedia untuk menanggung segala biaya yang meliputi biaya asuransi , biaya pengikatan agunan, dan biaya lainnya yang timbul karena terjadinya penghentian KPR Bersubsidi BTN dan/atau perubahan/konversi menjadi KPR Non-subsidi.
              </Text>
            </View>
            <View style={[styles.listRow, { marginBottom: 1 }]}>
              <Text style={[styles.listNum, { fontSize: 7.2 }]}>7.</Text>
              <Text style={[styles.listText, { fontSize: 7.2 }]}>
                Tidak akan menjanjikan atau memberikan sesuatu baik secara langsung dan tidak langsung, baik atas inisiatif sendiri maupun orang lain, baik dengan menggunakan sarana elektronik atau tanpa sarana elektronik, baik dalam bentuk uang atau bukan seperti hadiah, cinderamata, komisi, pinjaman tanpa bunga, tiket perjalanan, fasilitas penginapan, perjalanan wisata, pengobatan cuma-cuma, hiburan dari fasilitas lainnya atau bentuk lainnya kepada setiap pejabat dan/atau pegawai Bank BTN termasuk anggota keluarga intinya.
              </Text>
            </View>
            <View style={[styles.listRow, { marginBottom: 1 }]}>
              <Text style={[styles.listNum, { fontSize: 7.2 }]}>8.</Text>
              <Text style={[styles.listText, { fontSize: 7.2 }]}>
                Apabila di kemudian hari diketahui bahwa pernyataan kami ini dan pernyataan lainnya yang kami sampaikan kepada Bank BTN tidak benar dan/atau tidak saya penuhi, maka saya bersedia mengembalikan seluruh subsidi yang telah saya terima dari pemerintah, bersedia dikenakan sanksi sesuai dengan ketentuan peraturan perundang-undangan dan bersedia mengubah/mengkonversi menjadi KPR Non-subsidi.
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 7, textAlign: 'justify', marginBottom: 2 }}>
            Demikian surat pernyataan ini saya buat dengan sebenar-benarnya tanpa paksaan dari pihak manapun.
          </Text>

          <View style={{ marginTop: 1 }}>
            <Text style={{ textAlign: 'right', fontSize: 7.2, marginBottom: 1 }}>Purwakarta, .........................................</Text>
            <View style={styles.signatureContainer}>
              <View style={styles.signatureBox}>
                <Text style={{ fontSize: 7.2 }}>Menyetujui,</Text>
                <View style={[styles.signatureSpace, { height: 22 }]} />
                <Text style={[styles.signatureName, { fontSize: 7.5 }]}>({customer.nama_pasangan || 'ILA ROKHMAH'})</Text>
              </View>
              <View style={styles.signatureBox}>
                <Text style={{ fontSize: 7.2 }}>Yang membuat pernyataan,</Text>
                <View style={[styles.signatureSpace, { height: 22 }]}>
                  <Text style={{ fontSize: 6.5, color: '#9ca3af' }}>Materai secukupnya</Text>
                </View>
                <Text style={[styles.signatureName, { fontSize: 7.5 }]}>({customer.nama})</Text>
              </View>
            </View>

            <View style={[styles.signatureBoxCenter, { marginTop: 2 }]}>
              <Text style={{ fontSize: 7 }}>Mengetahui,</Text>
              <Text style={{ fontSize: 7 }}>Pimpinan Tempat Bekerja/Kepala Desa/Lurah* ......................................</Text>
              <View style={{ height: 18 }} />
              <Text style={{ fontSize: 7 }}>(......................................)</Text>
            </View>
          </View>
          <Text style={[styles.footnote, { fontSize: 6, marginTop: 1 }]}>*) Coret salah yang tidak perlu</Text>
        </Page>
      )}

      {/* ── LAMPIRAN 17 (SURAT KUASA - FORMAT PERSIS GAMBAR) ── */}
      {no === 17 && (
        <Page size="A4" style={[styles.page, { paddingTop: 13, paddingBottom: 13, paddingLeft: 28, paddingRight: 28, fontSize: 6.9, lineHeight: 1.15 }]}>
          <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', marginBottom: 2 }}>
            LAMPIRAN 17
          </Text>

          <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', textAlign: 'center', marginBottom: 4 }}>
            SURAT KUASA
          </Text>

          <Text style={{ fontSize: 6.9, marginBottom: 1 }}>Yang bertanda-tangan di bawah ini :</Text>

          <View style={{ flexDirection: 'row', marginBottom: 2 }}>
            <Text style={{ width: 14, fontSize: 6.9 }}>I.</Text>
            <View style={{ flex: 1 }}>
              <View style={[styles.table, { marginTop: 0, marginBottom: 1 }]}>
                <View style={[styles.row, { marginBottom: 0.5 }]}>
                  <Text style={[styles.labelCell, { width: 125, fontSize: 6.9 }]}>Nama Lengkap</Text>
                  <Text style={[styles.colonCell, { fontSize: 6.9 }]}>:</Text>
                  <Text style={[styles.valueCellNormal, { fontSize: 6.9 }]}>{customer.nama}</Text>
                </View>
                <View style={[styles.row, { marginBottom: 0.5 }]}>
                  <Text style={[styles.labelCell, { width: 125, fontSize: 6.9 }]}>No KTP</Text>
                  <Text style={[styles.colonCell, { fontSize: 6.9 }]}>:</Text>
                  <Text style={[styles.valueCellNormal, { fontSize: 6.9 }]}>{customer.nik || '-'}</Text>
                </View>
                <View style={[styles.row, { marginBottom: 0.5 }]}>
                  <Text style={[styles.labelCell, { width: 125, fontSize: 6.9 }]}>Tempat/Tgl lahir</Text>
                  <Text style={[styles.colonCell, { fontSize: 6.9 }]}>:</Text>
                  <Text style={[styles.valueCellNormal, { fontSize: 6.9 }]}>
                    {customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}
                  </Text>
                </View>
                <View style={[styles.row, { marginBottom: 0.5 }]}>
                  <Text style={[styles.labelCell, { width: 125, fontSize: 6.9 }]}>Pekerjaan</Text>
                  <Text style={[styles.colonCell, { fontSize: 6.9 }]}>:</Text>
                  <Text style={[styles.valueCellNormal, { fontSize: 6.9 }]}>{customer.pekerjaan || '-'}</Text>
                </View>
                <View style={[styles.row, { marginBottom: 0.5 }]}>
                  <Text style={[styles.labelCell, { width: 125, fontSize: 6.9 }]}>Alamat</Text>
                  <Text style={[styles.colonCell, { fontSize: 6.9 }]}>:</Text>
                  <Text style={[styles.valueCellNormal, { fontSize: 6.9 }]}>{customerAlamat}</Text>
                </View>
                <View style={[styles.row, { marginBottom: 0.5 }]}>
                  <Text style={[styles.labelCell, { width: 125, fontSize: 6.9 }]}>Nomor Rekening Simpanan</Text>
                  <Text style={[styles.colonCell, { fontSize: 6.9 }]}>:</Text>
                  <Text style={[styles.valueCellNormal, { fontSize: 6.9 }]}>{(customer as any)?.nomor_rekening_kpr || ''}</Text>
                </View>
                <View style={[styles.row, { marginBottom: 0.5 }]}>
                  <Text style={[styles.labelCell, { width: 125, fontSize: 6.9 }]}>No. SP3K</Text>
                  <Text style={[styles.colonCell, { fontSize: 6.9 }]}>:</Text>
                  <Text style={[styles.valueCellNormal, { fontSize: 6.9 }]}></Text>
                </View>
                <View style={[styles.row, { marginBottom: 0.5 }]}>
                  <Text style={[styles.labelCell, { width: 125, fontSize: 6.9 }]}>Tanggal Akad KPR Bersubsidi</Text>
                  <Text style={[styles.colonCell, { fontSize: 6.9 }]}>:</Text>
                  <Text style={[styles.valueCellNormal, { fontSize: 6.9 }]}></Text>
                </View>
                <View style={[styles.row, { marginBottom: 0.5 }]}>
                  <Text style={[styles.labelCell, { width: 125, fontSize: 6.9 }]}>No Rekening KPR Bersubsidi</Text>
                  <Text style={[styles.colonCell, { fontSize: 6.9 }]}>:</Text>
                  <Text style={[styles.valueCellNormal, { fontSize: 6.9 }]}></Text>
                </View>
              </View>
              <Text style={{ fontSize: 6.9, marginTop: 1 }}>
                Dalam hal ini bertindak untuk atas nama sendiri, selanjutnya disebut <Text style={{ fontFamily: 'Helvetica-Bold' }}>"Pemberi Kuasa"</Text>.
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', marginBottom: 2 }}>
            <Text style={{ width: 14, fontSize: 6.9 }}>II.</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 6.9, textAlign: 'justify' }}>
                PT. Bank Tabungan Negara (Persero) tbk. (Bank BTN), berkedudukan di Jalan Gajah Mada No. 01 Jakarta Pusat yang dalam hal ini diwakili oleh ........................................ selaku ........................................ pada Bank BTN Kantor Cabang ........................................
                {'\n'}Selanjutnya disebut <Text style={{ fontFamily: 'Helvetica-Bold' }}>"Penerima Kuasa"</Text>.
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 6.9, textAlign: 'justify', marginBottom: 2 }}>
            Dengan ini <Text style={{ fontFamily: 'Helvetica-Bold' }}>Pemberi Kuasa</Text> memberikan <Text style={{ fontFamily: 'Helvetica-Bold' }}>Kuasa khusus</Text> kepada <Text style={{ fontFamily: 'Helvetica-Bold' }}>Penerima Kuasa</Text> untuk melakukan hal-hal sebagai berikut:
          </Text>

          <View style={{ marginBottom: 1 }}>
            <View style={[styles.listRow, { marginBottom: 1 }]}>
              <Text style={[styles.listNum, { width: 12, fontSize: 6.8 }]}>1.</Text>
              <Text style={[styles.listText, { fontSize: 6.8 }]}>
                Membayarkan sejumlah dana kepada Penjual/Pengembang dari hasil pencairan kredit yang diterima oleh <Text style={{ fontFamily: 'Helvetica-Bold' }}>Pemberi Kuasa</Text> dari Bank BTN untuk pembayaran lunas harga jual rumah beserta lahan sesuai dengan tujuan pemberian kredit.
              </Text>
            </View>
            <View style={[styles.listRow, { marginBottom: 1 }]}>
              <Text style={[styles.listNum, { width: 12, fontSize: 6.8 }]}>2.</Text>
              <Text style={[styles.listText, { fontSize: 6.8 }]}>
                Melakukan pemindahbukuan pencairan dana Subsidi Bantuan Uang Muka (SBUM)/Dana Bantuan Pembiayaan Perumahan Berbasis Tabungan (BP2BT)* dari rekening simpanan milik <Text style={{ fontFamily: 'Helvetica-Bold' }}>Pemberi Kuasa</Text> di Bank BTN sebagaimana tersebut diatas senilai Rp .............................. - (..........................................) untuk digunakan sebagai pengurang pokok kredit/pembayaran kekurangan uang muka pembelian Rumah Umum Tapak dalam hal Pemeberi Kuasa mendapatkan fasilitas SBUM/Dana BP2BT*.
              </Text>
            </View>
            <View style={[styles.listRow, { marginBottom: 1 }]}>
              <Text style={[styles.listNum, { width: 12, fontSize: 6.8 }]}>3.</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 6.8 }}>
                  Pembayaran dan pemindahbukuan dana sebagaimana dimaksud bada butir 1 dan butir 2 ditujukan kepada :
                </Text>
                <View style={{ marginTop: 0.5, marginBottom: 0.5 }}>
                  <View style={[styles.row, { marginBottom: 0.5 }]}>
                    <Text style={{ width: 110, fontSize: 6.8 }}>Nama Pengembang</Text>
                    <Text style={{ width: 8, fontSize: 6.8 }}>:</Text>
                    <Text style={{ fontSize: 6.8, fontFamily: 'Helvetica-Bold' }}>PT. LAN SENA JAYA</Text>
                  </View>
                  <View style={[styles.row, { marginBottom: 0.5 }]}>
                    <Text style={{ width: 110, fontSize: 6.8 }}>Nomor Rekening</Text>
                    <Text style={{ width: 8, fontSize: 6.8 }}>:</Text>
                    <Text style={{ fontSize: 6.8 }}>00181-01-30-666-666-1</Text>
                  </View>
                  <View style={[styles.row, { marginBottom: 0.5 }]}>
                    <Text style={{ width: 110, fontSize: 6.8 }}>Rekening Atas Nama</Text>
                    <Text style={{ width: 8, fontSize: 6.8 }}>:</Text>
                    <Text style={{ fontSize: 6.8 }}>PT. LAN SENA JAYA</Text>
                  </View>
                  <View style={[styles.row, { marginBottom: 0.5 }]}>
                    <Text style={{ width: 110, fontSize: 6.8 }}>Pada Bank</Text>
                    <Text style={{ width: 8, fontSize: 6.8 }}>:</Text>
                    <Text style={{ fontSize: 6.8 }}>Bank BTN Kantor Cabang/Kantor Cabang Pembantu/Kantor Kas* ........................................</Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={[styles.listRow, { marginBottom: 1 }]}>
              <Text style={[styles.listNum, { width: 12, fontSize: 6.8 }]}>4.</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 6.8 }}>
                  Memblokir, mendebat dan/atau memindahbukuan dana rekening dari rekening simpanan milik <Text style={{ fontFamily: 'Helvetica-Bold' }}>Pemberi Kuasa</Text> di Bank BTN sebagaimana tersebut di atas untuk keperluan pembayaran:
                </Text>
                <Text style={{ fontSize: 6.6, paddingLeft: 6 }}>a. Biaya proses dan/atau realisasi kredit;</Text>
                <Text style={{ fontSize: 6.6, paddingLeft: 6 }}>b. Angsuran kredit yang meliputi pokok, bunga, denda, dan biaya lainnya; dan</Text>
                <Text style={{ fontSize: 6.6, paddingLeft: 6 }}>c. Biaya asuransi, pengikatan angunan, dan biaya lainya yang timbul karna terjadinya penghentian KP4 Bersubsidi BTN dan/atau perubahan/konversi menjadi KPR Non-subsidi.</Text>
              </View>
            </View>
            <View style={[styles.listRow, { marginBottom: 1 }]}>
              <Text style={[styles.listNum, { width: 12, fontSize: 6.8 }]}>5.</Text>
              <Text style={[styles.listText, { fontSize: 6.8 }]}>
                Pembayaran, pemindahbukuan, pemblokiran, dan/atau pendebatan dana sebagaimana dimaksud pada butir 1 s.d butir 4 diatas dapat dilakukan oleh Bank BTN secara manual, otomatis dan/atau mekanisme transaksi lainnya yang berlaku di Bank BTN.</Text>
            </View>
          </View>

          <Text style={{ fontSize: 6.8, textAlign: 'justify', marginBottom: 2 }}>
            Demikian Surat Kuasa ini dibuat dengan Hak Substitusi, dan tidak dapat dicabut kembali seta tidak akan berakhir karena sebab-sebab yang tercantum dalam Pasal 1813 Kitab Undang-Undang Hukum Perdata atau karena sebab apaupun juga.
          </Text>

          <View style={{ marginTop: 2 }}>
            <Text style={{ textAlign: 'right', fontSize: 6.9, marginBottom: 1 }}>Purwakarta, .........................................</Text>
            <View style={styles.signatureContainer}>
              <View style={styles.signatureBox}>
                <Text style={{ fontSize: 6.9, fontFamily: 'Helvetica-Bold' }}>PENERIMA KUASA,</Text>
                <Text style={{ fontSize: 6.7 }}>PT BANK TABUNGAN NEGARA (PERSERO) Tbk.</Text>
                <Text style={{ fontSize: 6.7 }}>KANTOR CABANG ................................</Text>
                <View style={[styles.signatureSpace, { height: 26 }]} />
                <Text style={{ fontSize: 6.9 }}>( .............................................. )</Text>
              </View>
              <View style={styles.signatureBox}>
                <Text style={{ fontSize: 6.9, fontFamily: 'Helvetica-Bold' }}>PEMBERI KUASA,</Text>
                <View style={[styles.signatureSpace, { height: 26 }]}>
                  <View style={styles.materaiBox}>
                    <Text style={[styles.materaiText, { fontSize: 6 }]}>Materai secukupnya</Text>
                  </View>
                </View>
                <Text style={[styles.signatureName, { fontSize: 7.2 }]}>({customer.nama})</Text>
              </View>
            </View>
          </View>
          <Text style={[styles.footnote, { fontSize: 6, marginTop: 1 }]}>*) Coret yang tidak perlu</Text>
        </Page>
      )}

      {/* ── LAMPIRAN 18 (STANDING INSTRUCTION - FORMAT PERSIS GAMBAR) ── */}
      {no === 18 && (
        <Page size="A4" style={[styles.page, { paddingTop: 16, paddingBottom: 16, fontSize: 8, lineHeight: 1.25 }]}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', marginBottom: 4 }}>
            LAMPIRAN 18
          </Text>

          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', textAlign: 'center' }}>
              SURAT KETERANGAN PEMINDAHBUKUAN DANA SBUM
            </Text>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', textAlign: 'center' }}>
              (STANDING INSTRUCTION)
            </Text>
          </View>

          <Text style={{ fontSize: 8, marginBottom: 4 }}>
            Sehubungan dengan pencairan Subsidi Bantuan Uang Muka (SBUM) kepada Debitur KPR Bersubsidi, maka saya yang bertanda tangan di bawah ini :
          </Text>

          <View style={[styles.table, { marginBottom: 4 }]}>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 130, fontSize: 8 }]}>Nama Pengembang</Text>
              <Text style={[styles.colonCell, { fontSize: 8 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8 }]}>PT. LAN SENA JAYA</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 130, fontSize: 8 }]}>Nomor Rekening</Text>
              <Text style={[styles.colonCell, { fontSize: 8 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8 }]}>00181-01-30-666-666-1</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 130, fontSize: 8 }]}>Rekening Atas Nama</Text>
              <Text style={[styles.colonCell, { fontSize: 8 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8 }]}>PT. LAN SENA JAYA</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 130, fontSize: 8 }]}>Pada Bank</Text>
              <Text style={[styles.colonCell, { fontSize: 8 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8 }]}>
                Bank BTN Kantor Cabang/Kantor Cabang/Kantor Kas
                {'\n'}..................................................................
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 8, textAlign: 'justify', marginBottom: 4 }}>
            Dengan ini memberikan kuasa kepada PT. Bank Tabungan Negara (Persero) Tbk. Kantor Cabang .................................................. Untuk melakukan pemindahbukuan pencairan dana Subsidi Bantuan Uang Muka (SBUM) senilai Rp .................................................., - ............................................................................................ untuk digunakan sebagai pengganti tambahan uang muka pembelian Rumah Umum Tapak *), kepada :
          </Text>

          <View style={[styles.table, { marginBottom: 4 }]}>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 130, fontSize: 8 }]}>Nama</Text>
              <Text style={[styles.colonCell, { fontSize: 8 }]}>:</Text>
              <Text style={[styles.valueCell, { fontSize: 8 }]}>{customer.nama}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 130, fontSize: 8 }]}>NIK</Text>
              <Text style={[styles.colonCell, { fontSize: 8 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8 }]}>{customer.nik || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 130, fontSize: 8 }]}>Nomor Rekening</Text>
              <Text style={[styles.colonCell, { fontSize: 8 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8 }]}>{(customer as any)?.nomor_rekening_kpr || ''}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 130, fontSize: 8 }]}>Rekening Atas Nama</Text>
              <Text style={[styles.colonCell, { fontSize: 8 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8 }]}>{customer.nama}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1 }]}>
              <Text style={[styles.labelCell, { width: 130, fontSize: 8 }]}>Pada Bank</Text>
              <Text style={[styles.colonCell, { fontSize: 8 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8 }]}>Bank BTN Kantor Cabang/Kantor Cabang/Kantor Kas ..........................................................</Text>
            </View>
          </View>

          <Text style={{ fontSize: 8, textAlign: 'justify', marginBottom: 8 }}>
            Demikian <Text style={{ fontStyle: 'italic' }}>Standing Instruction</Text> ini dibuat tanpa adanya paksaan dari pihak manapun. Akibat apapun yang mungkin timbul dari paksaan penyaluran dana oleh PT. Bank Tabungan Negara (Persero) Tbk. Berdasarkan <Text style={{ fontStyle: 'italic' }}>Standing Instruction</Text> ini adalah sepenuhnya menjadi tanggung jawab saya pribadi.
          </Text>

          <View style={[styles.signatureContainer, { marginTop: 10 }]}>
            <View style={styles.signatureBox}>
              <Text style={{ fontSize: 8 }}>Menyetujui,</Text>
              <Text style={{ fontSize: 8 }}>PT. BANK TABUNGAN NEGARA (PERSERO) Tbk</Text>
              <Text style={{ fontSize: 8 }}>KANTOR CABANG ............................................</Text>
              <View style={[styles.signatureSpace, { height: 38 }]} />
              <Text style={{ fontSize: 8 }}>(....................................................)</Text>
              <Text style={{ fontSize: 7, fontStyle: 'italic', color: '#4b5563' }}>Nama Lengkap, jabatan, Stempel</Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={{ fontSize: 8 }}>Purwakarta, .........................................</Text>
              <Text style={{ fontSize: 7.5, color: '#4b5563' }}>Kota/Kabupaten, tanggal bulan tahun,</Text>
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>PEMBUAT STANDING INSTRUCTION</Text>
              <View style={[styles.signatureSpace, { height: 34 }]}>
                <View style={styles.materaiBox}>
                  <Text style={styles.materaiText}>Materai secukupnya</Text>
                </View>
              </View>
              <Text style={{ fontSize: 8 }}>(....................................................)</Text>
              <Text style={{ fontSize: 7, fontStyle: 'italic', color: '#4b5563' }}>Nama Lengkap Pembuat SI</Text>
            </View>
          </View>
        </Page>
      )}

      {/* ── LAMPIRAN 19 (SURAT PERNYATAAN TIDAK MEMILIKI RUMAH - FORMAT PERSIS GAMBAR) ── */}
      {no === 19 && (
        <Page size="A4" style={[styles.page, { paddingTop: 20, paddingBottom: 20, fontSize: 8.5, lineHeight: 1.3 }]}>
          <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', marginBottom: 6 }}>
            LAMPIRAN 19
          </Text>

          <Text style={{ fontSize: 10.5, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', textAlign: 'center', marginBottom: 12 }}>
            SURAT PERNYATAAN TIDAK MEMILIKI RUMAH
          </Text>

          <Text style={{ fontSize: 8.5, marginBottom: 4 }}>Yang bertanda-tangan di bawah ini :</Text>

          <View style={[styles.table, { marginBottom: 6 }]}>
            <View style={[styles.row, { marginBottom: 1.5 }]}>
              <Text style={[styles.labelCell, { width: 120, fontSize: 8.5 }]}>Nama</Text>
              <Text style={[styles.colonCell, { fontSize: 8.5 }]}>:</Text>
              <Text style={[styles.valueCell, { fontSize: 8.5 }]}>{customer.nama}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1.5 }]}>
              <Text style={[styles.labelCell, { width: 120, fontSize: 8.5 }]}>Tempat/tgl lahir</Text>
              <Text style={[styles.colonCell, { fontSize: 8.5 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.5 }]}>
                {customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}
              </Text>
            </View>
            <View style={[styles.row, { marginBottom: 1.5 }]}>
              <Text style={[styles.labelCell, { width: 120, fontSize: 8.5 }]}>Pekerjaan</Text>
              <Text style={[styles.colonCell, { fontSize: 8.5 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.5 }]}>{customer.pekerjaan || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1.5 }]}>
              <Text style={[styles.labelCell, { width: 120, fontSize: 8.5 }]}>No KTP/Passport</Text>
              <Text style={[styles.colonCell, { fontSize: 8.5 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.5 }]}>{customer.nik || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1.5 }]}>
              <Text style={[styles.labelCell, { width: 120, fontSize: 8.5 }]}>Alamat</Text>
              <Text style={[styles.colonCell, { fontSize: 8.5 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.5 }]}>{customerAlamat}</Text>
            </View>
          </View>

          <Text style={{ fontSize: 8.5, textAlign: 'justify', marginBottom: 4 }}>
            menyatakan bahwa sampai dengan surat pernyataan ini dibuat tidak memiliki hak kepemilikan atas rumah.
          </Text>
          <Text style={{ fontSize: 8.5, textAlign: 'justify', marginBottom: 12 }}>
            Demikian surat pernyataan ini saya buat dengan sebenarnya tanpa paksaan dari pihak manapun dan apabila di kemudian hari pernyataan saya ini tidak benar, saya bersedia mengembalikan Fasilitas Likuiditas Pembiayaan Perumahan yang saya terima.
          </Text>

          <View style={{ marginTop: 8 }}>
            <Text style={{ textAlign: 'right', fontSize: 8.5, marginBottom: 4 }}>Purwakarta, .........................................</Text>
            <View style={styles.signatureContainer}>
              <View style={styles.signatureBox}>
                <Text style={{ fontSize: 8.5 }}>Mengetahui:</Text>
                <Text style={{ fontSize: 8 }}>Kepala Desa/Lurah/Pimpinan Perusahaan/Instansi</Text>
                <View style={[styles.signatureSpace, { height: 42 }]} />
                <Text style={{ fontSize: 8.5 }}>(....................................................)</Text>
              </View>
              <View style={styles.signatureBox}>
                <Text style={{ fontSize: 8.5 }}>Yang membuat pernyataan,</Text>
                <View style={[styles.signatureSpace, { height: 42 }]}>
                  <View style={styles.materaiBox}>
                    <Text style={styles.materaiText}>Materai 10000</Text>
                  </View>
                </View>
                <Text style={[styles.signatureName, { fontSize: 8.5 }]}>({customer.nama})</Text>
              </View>
            </View>
            <Text style={[styles.footnote, { fontSize: 7, marginTop: 12 }]}>*diberikan cap perusahaan/instansi</Text>
          </View>
        </Page>
      )}

      {/* ── LAMPIRAN 20 (SURAT PERNYATAAN TIDAK BEKERJA - FORMAT PERSIS GAMBAR) ── */}
      {no === 20 && (
        <Page size="A4" style={[styles.page, { paddingTop: 20, paddingBottom: 20, fontSize: 8.5, lineHeight: 1.3 }]}>
          <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', marginBottom: 6 }}>
            LAMPIRAN 20
          </Text>

          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 10.5, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', textAlign: 'center' }}>
              SURAT PERNYATAAN TIDAK BEKERJA / TIDAK MEMPUNYAI
            </Text>
            <Text style={{ fontSize: 10.5, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', textAlign: 'center' }}>
              PENGHASILAN
            </Text>
          </View>

          <Text style={{ fontSize: 8.5, marginBottom: 4 }}>Yang bertanda-tangan di bawah ini :</Text>

          <View style={[styles.table, { marginBottom: 6 }]}>
            <View style={[styles.row, { marginBottom: 1.5 }]}>
              <Text style={[styles.labelCell, { width: 120, fontSize: 8.5 }]}>Nama</Text>
              <Text style={[styles.colonCell, { fontSize: 8.5 }]}>:</Text>
              <Text style={[styles.valueCell, { fontSize: 8.5 }]}>{customer.nama_pasangan || 'ILA ROKHMAH'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1.5 }]}>
              <Text style={[styles.labelCell, { width: 120, fontSize: 8.5 }]}>No KTP</Text>
              <Text style={[styles.colonCell, { fontSize: 8.5 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.5 }]}>{customer.nik_pasangan || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1.5 }]}>
              <Text style={[styles.labelCell, { width: 120, fontSize: 8.5 }]}>Tempat Lahir</Text>
              <Text style={[styles.colonCell, { fontSize: 8.5 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.5 }]}>{customer.tempat_lahir_pasangan || '-'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1.5 }]}>
              <Text style={[styles.labelCell, { width: 120, fontSize: 8.5 }]}>Tanggal Lahir</Text>
              <Text style={[styles.colonCell, { fontSize: 8.5 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.5 }]}>
                {customer.tanggal_lahir_pasangan ? formatTanggalIndonesia(customer.tanggal_lahir_pasangan) : '-'}
              </Text>
            </View>
            <View style={[styles.row, { marginBottom: 1.5 }]}>
              <Text style={[styles.labelCell, { width: 120, fontSize: 8.5 }]}>Pekerjaan</Text>
              <Text style={[styles.colonCell, { fontSize: 8.5 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.5 }]}>{customer.pekerjaan_pasangan || 'MENGURUS RUMAH TANGGA'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1.5 }]}>
              <Text style={[styles.labelCell, { width: 120, fontSize: 8.5 }]}>Alamat</Text>
              <Text style={[styles.colonCell, { fontSize: 8.5 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.5 }]}>{spouseAlamat}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 1.5 }]}>
              <Text style={[styles.labelCell, { width: 120, fontSize: 8.5 }]}>Nomor Telepon/HP</Text>
              <Text style={[styles.colonCell, { fontSize: 8.5 }]}>:</Text>
              <Text style={[styles.valueCellNormal, { fontSize: 8.5 }]}>{customer.no_hp_pasangan || '-'}</Text>
            </View>
          </View>

          <Text style={{ fontSize: 8.5, textAlign: 'justify', marginBottom: 4 }}>
            Dengan ini menyatakan bahwa selama ini <Text style={{ fontFamily: 'Helvetica-Bold' }}>tidak mempunyai pekerjaan / tidak bekerja.</Text>
          </Text>
          <Text style={{ fontSize: 8.5, textAlign: 'justify', marginBottom: 12 }}>
            Demikian Surat Pernyataan ini kami buat dengan sebenar-benarnya tanpa paksaan dari pihak manapun dan apabila dikemudian hari pernyataan saya tidak benar, saya bersedia mengembalikan seluruh subsidi yang saya terima.
          </Text>

          <View style={{ marginTop: 8 }}>
            <Text style={{ textAlign: 'right', fontSize: 8.5, marginBottom: 4 }}>Purwakarta, .........................................</Text>
            <View style={styles.signatureContainer}>
              <View style={styles.signatureBox}>
                <Text style={{ fontSize: 8.5 }}>Mengetahui,</Text>
                <Text style={{ fontSize: 8 }}>Kepala Kelurahan ..............................</Text>
                <View style={[styles.signatureSpace, { height: 42 }]} />
                <Text style={{ fontSize: 8.5 }}>(....................................................)</Text>
              </View>
              <View style={styles.signatureBox}>
                <Text style={{ fontSize: 8.5 }}>Yang membuat pernyataan,</Text>
                <View style={[styles.signatureSpace, { height: 42 }]}>
                  <View style={styles.materaiBox}>
                    <Text style={styles.materaiText}>Materai 10.000</Text>
                  </View>
                </View>
                <Text style={[styles.signatureName, { fontSize: 8.5 }]}>({customer.nama_pasangan || 'ILA ROKHMAH'})</Text>
              </View>
            </View>
          </View>
        </Page>
      )}

      {/* ── LAMPIRAN 21 (KETETAPAN WAKTU UNTUK VERIFIKASI - FORMAT PERSIS GAMBAR) ── */}
      {no === 21 && (
        <Page size="A4" style={[styles.page, { paddingTop: 18, paddingBottom: 18, fontSize: 8, lineHeight: 1.25 }]}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', marginBottom: 4 }}>
            LAMPIRAN 21
          </Text>

          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', textAlign: 'center', marginBottom: 10 }}>
            KETETAPAN WAKTU UNTUK VERIFIKASI
          </Text>

          {/* Section 1: PERUMAHAN & BLOK */}
          <View style={{ marginBottom: 4 }}>
            <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>{perumahanNama.toUpperCase()}</Text>
            <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>BLOK : BLOK {unitBlok} No {unitNo}</Text>
          </View>

          {/* Table 1: BLOK / CONSUMER */}
          <View style={[styles.gridTable, { marginBottom: 8 }]}>
            <View style={styles.gridRow}>
              <Text style={[styles.gridHeader, { width: '8%' }]}>NO</Text>
              <Text style={[styles.gridHeader, { width: '32%' }]}>NAMA</Text>
              <Text style={[styles.gridHeader, { width: '20%' }]}>NO.TLP</Text>
              <View style={{ width: '20%', borderRightWidth: 1, borderColor: '#000' }}>
                <Text style={[styles.gridHeader, { borderRightWidth: 0, paddingBottom: 1 }]}>JAM BISA DIHUBUNGI</Text>
                <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#000' }}>
                  <Text style={[styles.gridHeader, { width: '50%', borderRightWidth: 1 }]}>1</Text>
                  <Text style={[styles.gridHeader, { width: '50%', borderRightWidth: 0 }]}>2</Text>
                </View>
              </View>
              <Text style={[styles.gridHeader, { width: '20%', borderRightWidth: 0 }]}>KETERANGAN</Text>
            </View>
            {/* Row 1: Debitur */}
            <View style={styles.gridRow}>
              <Text style={[styles.gridCellCenter, { width: '8%' }]}>1</Text>
              <Text style={[styles.gridCell, { width: '32%' }]}>{customer.nama}</Text>
              <Text style={[styles.gridCell, { width: '20%' }]}>{customer.no_hp || (customer as any)?.no_telepon || '-'}</Text>
              <Text style={[styles.gridCell, { width: '10%' }]}></Text>
              <Text style={[styles.gridCell, { width: '10%' }]}></Text>
              <Text style={[styles.gridCell, { width: '20%', borderRightWidth: 0 }]}></Text>
            </View>
            {/* Row 2: Pasangan */}
            <View style={[styles.gridRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.gridCellCenter, { width: '8%' }]}></Text>
              <Text style={[styles.gridCell, { width: '32%' }]}>{customer.nama_pasangan || ''}</Text>
              <Text style={[styles.gridCell, { width: '20%' }]}>{customer.no_hp_pasangan || ''}</Text>
              <Text style={[styles.gridCell, { width: '10%' }]}></Text>
              <Text style={[styles.gridCell, { width: '10%' }]}></Text>
              <Text style={[styles.gridCell, { width: '20%', borderRightWidth: 0 }]}></Text>
            </View>
          </View>

          {/* Section 2: INSTANSI PEKERJAAN */}
          <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>
            INSTANSI PEKERJAAN (KANTOR TEMPAT KERJA)
          </Text>
          <View style={[styles.gridTable, { marginBottom: 8 }]}>
            <View style={styles.gridRow}>
              <Text style={[styles.gridHeader, { width: '8%' }]}>NO</Text>
              <Text style={[styles.gridHeader, { width: '32%' }]}>NAMA</Text>
              <Text style={[styles.gridHeader, { width: '20%' }]}>NO.TLP</Text>
              <View style={{ width: '20%', borderRightWidth: 1, borderColor: '#000' }}>
                <Text style={[styles.gridHeader, { borderRightWidth: 0, paddingBottom: 1 }]}>JAM BISA DIHUBUNGI</Text>
                <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#000' }}>
                  <Text style={[styles.gridHeader, { width: '50%', borderRightWidth: 1 }]}>1</Text>
                  <Text style={[styles.gridHeader, { width: '50%', borderRightWidth: 0 }]}>2</Text>
                </View>
              </View>
              <Text style={[styles.gridHeader, { width: '20%', borderRightWidth: 0 }]}>KETERANGAN</Text>
            </View>
            {/* Row 1 */}
            <View style={styles.gridRow}>
              <Text style={[styles.gridCellCenter, { width: '8%' }]}>1</Text>
              <Text style={[styles.gridCell, { width: '32%' }]}>{(customer as any)?.instansi || (customer as any)?.nama_perusahaan || ''}</Text>
              <Text style={[styles.gridCell, { width: '20%' }]}>{(customer as any)?.telepon_kantor || ''}</Text>
              <Text style={[styles.gridCell, { width: '10%' }]}></Text>
              <Text style={[styles.gridCell, { width: '10%' }]}></Text>
              <Text style={[styles.gridCell, { width: '20%', borderRightWidth: 0 }]}></Text>
            </View>
            {/* Row 2 */}
            <View style={[styles.gridRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.gridCellCenter, { width: '8%' }]}></Text>
              <Text style={[styles.gridCell, { width: '32%' }]}></Text>
              <Text style={[styles.gridCell, { width: '20%' }]}></Text>
              <Text style={[styles.gridCell, { width: '10%' }]}></Text>
              <Text style={[styles.gridCell, { width: '10%' }]}></Text>
              <Text style={[styles.gridCell, { width: '20%', borderRightWidth: 0 }]}></Text>
            </View>
          </View>

          {/* Section 3: CONTACT EMERGENCY */}
          <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>
            CONTACT EMERGENCY
          </Text>
          <View style={[styles.gridTable, { marginBottom: 4 }]}>
            <View style={styles.gridRow}>
              <Text style={[styles.gridHeader, { width: '8%' }]}>NO</Text>
              <Text style={[styles.gridHeader, { width: '32%' }]}>NAMA</Text>
              <Text style={[styles.gridHeader, { width: '20%' }]}>NO.TLP</Text>
              <View style={{ width: '20%', borderRightWidth: 1, borderColor: '#000' }}>
                <Text style={[styles.gridHeader, { borderRightWidth: 0, paddingBottom: 1 }]}>JAM BISA DIHUBUNGI</Text>
                <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#000' }}>
                  <Text style={[styles.gridHeader, { width: '50%', borderRightWidth: 1 }]}>1</Text>
                  <Text style={[styles.gridHeader, { width: '50%', borderRightWidth: 0 }]}>2</Text>
                </View>
              </View>
              <Text style={[styles.gridHeader, { width: '20%', borderRightWidth: 0 }]}>KETERANGAN SAUDARA-ALAMAT LENGKAP</Text>
            </View>
            {/* Row 1 */}
            <View style={[styles.gridRow, { minHeight: 36 }]}>
              <Text style={[styles.gridCellCenter, { width: '8%' }]}>1</Text>
              <Text style={[styles.gridCell, { width: '32%' }]}>{(customer as any)?.emergency_nama || ''}</Text>
              <Text style={[styles.gridCell, { width: '20%' }]}>{(customer as any)?.emergency_hp || (customer as any)?.emergency_telepon || ''}</Text>
              <Text style={[styles.gridCell, { width: '10%' }]}></Text>
              <Text style={[styles.gridCell, { width: '10%' }]}></Text>
              <Text style={[styles.gridCell, { width: '20%', borderRightWidth: 0 }]}>
                Keterangan : {(customer as any)?.emergency_hubungan ? `${(customer as any).emergency_hubungan} ` : ''}{(customer as any)?.emergency_alamat || ''}
              </Text>
            </View>
            {/* Row 2 */}
            <View style={[styles.gridRow, { borderBottomWidth: 0, minHeight: 36 }]}>
              <Text style={[styles.gridCellCenter, { width: '8%' }]}>2</Text>
              <Text style={[styles.gridCell, { width: '32%' }]}></Text>
              <Text style={[styles.gridCell, { width: '20%' }]}></Text>
              <Text style={[styles.gridCell, { width: '10%' }]}></Text>
              <Text style={[styles.gridCell, { width: '10%' }]}></Text>
              <Text style={[styles.gridCell, { width: '20%', borderRightWidth: 0 }]}>Keterangan : </Text>
            </View>
          </View>
        </Page>
      )}

      {/* ── FALLBACK FOR UNEXPECTED NO ── */}
      {![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].includes(no) && (
        <Page size="A4" style={styles.page}>
          <View style={styles.headerDoc}>
            <Text style={styles.docNumber}>LAMPIRAN {no}</Text>
            <Text style={styles.docTitle}>DOKUMEN KPR PERSYARATAN</Text>
          </View>

          <Text style={styles.paragraph}>Yang bertanda tangan di bawah ini menerangkan bahwa :</Text>

          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Nama Konsumen</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCell}>{customer.nama}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>NIK</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customer.nik || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Pekerjaan / Instansi</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customer.pekerjaan || '-'} {customer.instansi ? `(${customer.instansi})` : ''}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Alamat KTP</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{customerAlamat}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Unit Rumah</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCell}>{perumahanNama} - BLOK {unitBlok} No {unitNo} (Tipe {unitTipe})</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Pengembang</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{pengembang}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Bank Pelaksana</Text>
              <Text style={styles.colonCell}>:</Text>
              <Text style={styles.valueCellNormal}>{bankNama}</Text>
            </View>
          </View>

          <View style={{ marginVertical: 6 }}>
            <Text style={styles.paragraph}>
              Menyatakan dengan sesungguhnya bahwa seluruh data, keterangan, dan berkas administrasi yang saya sampaikan untuk pengajuan fasilitas Kredit Pemilikan Rumah (KPR) Bersubsidi Sejahtera Tapak di {perumahanNama} adalah benar dan dapat dipertanggungjawabkan sesuai ketentuan peraturan perundang-undangan.
            </Text>
            <Text style={styles.paragraph}>
              Apabila di kemudian hari ditemukan data yang tidak benar atau melanggar ketentuan bantuan subsidi perumahan MBR, saya bersedia menerima sanksi hukum serta mengembalikan seluruh fasilitas bantuan subsidi yang telah diterima ke kas negara.
            </Text>
          </View>

          <View style={styles.signatureContainer}>
            <View style={styles.signatureBox}>
              <Text>Mengetahui,</Text>
              <Text style={{ fontFamily: 'Helvetica-Bold', marginTop: 1 }}>{pengembang}</Text>
              <View style={styles.signatureSpace} />
              <Text>( ....................................... )</Text>
            </View>
            <View style={styles.signatureBox}>
              <Text>Purwakarta, {todayStr}</Text>
              <Text style={{ marginTop: 1 }}>Yang Membuat Pernyataan,</Text>
              <View style={styles.signatureSpace}>
                <View style={styles.materaiBox}>
                  <Text style={styles.materaiText}>Materai 10.000</Text>
                </View>
              </View>
              <Text style={styles.signatureName}>( {customer.nama} )</Text>
            </View>
          </View>
        </Page>
      )}
    </Document>
  );
}
