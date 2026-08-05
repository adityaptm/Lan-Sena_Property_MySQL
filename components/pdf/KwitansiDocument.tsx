import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { formatRupiah, terbilang } from '@/lib/format';

Font.register({
  family: 'Arial Narrow',
  fonts: [
    { src: '/fonts/ArchivoNarrow-Regular.ttf' },
    { src: '/fonts/ArchivoNarrow-Bold.ttf', fontWeight: 'bold' }
  ]
});

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: '/fonts/ArchivoNarrow-Regular.ttf' },
    { src: '/fonts/ArchivoNarrow-Bold.ttf', fontWeight: 'bold' }
  ]
});

Font.register({
  family: 'Helvetica-Bold',
  src: '/fonts/ArchivoNarrow-Bold.ttf'
});

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 30,
    paddingLeft: 40,
    paddingRight: 40,
    fontSize: 10,
    fontFamily: 'Arial Narrow',
    lineHeight: 1.4,
  },
  // --- KOP SURAT ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  logoContainer: {
    width: 75,
    marginRight: 10,
  },
  logo: { width: '100%' },
  headerTextContainer: { alignItems: 'center' },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  companySubtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  companyAddress: {
    fontSize: 8.5,
    textAlign: 'center',
    color: '#333',
  },
  headerLine: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    marginTop: 6,
    marginBottom: 16,
  },

  // --- JUDUL ---
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  titleText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.2,
    color: '#000',
  },

  // --- DATA FIELDS (Tanpa Tabel / Polos dengan Kolon) ---
  fieldsContainer: {
    marginBottom: 20,
    paddingLeft: 5,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  labelCol: {
    width: 130,
    color: '#222',
  },
  colon: {
    width: 15,
    color: '#222',
    fontFamily: 'Helvetica-Bold',
  },
  valueCol: {
    flex: 1,
    color: '#000',
  },
  valueBold: {
    fontFamily: 'Helvetica-Bold',
  },
  sectionTitleRow: {
    marginTop: 4,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#000',
  },

  // --- TTD SECTION ---
  ttdContainer: {
    marginTop: 30,
    paddingHorizontal: 10,
  },
  tanggalText: {
    textAlign: 'right',
    fontSize: 9.5,
    marginBottom: 10,
    marginRight: 40,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBlockLeft: {
    alignItems: 'center',
    width: 180,
  },
  signatureBlockRight: {
    alignItems: 'center',
    width: 180,
  },
  signatureTitle: {
    fontSize: 9.5,
    marginBottom: 50,
  },
  signatureName: {
    fontSize: 9.5,
    textAlign: 'center',
  },
});

interface KwitansiProps {
  payment?: any;
  sale?: any;
  unit?: any;
  customer?: any;
  petugasNama?: string;
  baseUrl?: string;
}

function formatTanggalLong(dateStr?: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return `${days[d.getDay()]}, ${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatKotaTanggal(dateStr?: string): string {
  if (!dateStr) return 'Purwakarta';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Purwakarta';
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return `Purwakarta, ${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function KwitansiDocument({ payment, unit, customer, petugasNama = 'FAHRUL ROZI', baseUrl = '' }: KwitansiProps) {
  const logoSrc = `${baseUrl}/logo.jpg`;

  const noKwitansi = payment?.no_kwitansi || '-';
  const nominal = Number(payment?.nominal) || 0;
  const deskripsi = payment?.deskripsi || '-';
  const tanggal = payment?.tanggal || '';

  const namaKonsumen = (customer?.nama || customer?.name || payment?.diterima_dari || '').toUpperCase();
  const namaPenyetor = (payment?.diterima_dari || customer?.nama || customer?.name || '').toUpperCase();
  const namaPetugas = (petugasNama || 'FAHRUL ROZI').toUpperCase();

  const unitText = unit?.no_unit 
    ? `${unit.no_unit} ${unit.unit_type_nama ? `(${unit.unit_type_nama})` : ''}` 
    : '-';

  const lokasiText = [
    unit?.location_nama || 'Benteng Mutiara Mas',
    unit?.block_nama ? `BLOK ${unit.block_nama}` : '',
  ].filter(Boolean).join(' ');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* KOP SURAT */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image src={logoSrc} style={styles.logo} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.companyName}>PT LAN SENA JAYA</Text>
            <Text style={styles.companySubtitle}>DEVELOPER &amp; CONTRACTOR</Text>
            <Text style={styles.companyAddress}>
              Perum Benteng Mutiara Mas Ruko No. 16 Babakan Situ 004/002
            </Text>
            <Text style={styles.companyAddress}>
              Desa Benteng Kec. Cempaka Kab. Purwakarta (0264) - 8308450 Jawa Barat
            </Text>
            <Text style={styles.companyAddress}>41181</Text>
          </View>
        </View>
        <View style={styles.headerLine} />

        {/* JUDUL */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>KWITANSI PEMBAYARAN UNIT</Text>
        </View>

        {/* LIST FIELD BIASA (TANPA TABEL) */}
        <View style={styles.fieldsContainer}>
          <View style={styles.fieldRow}>
            <Text style={styles.labelCol}>No Kwitansi</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={[styles.valueCol, styles.valueBold]}>{noKwitansi}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.labelCol}>Tgl Pembayaran</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={[styles.valueCol, styles.valueBold]}>{formatTanggalLong(tanggal)}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.labelCol}>Telah Diterima Dari</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={[styles.valueCol, styles.valueBold]}>{namaPenyetor}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.labelCol}>Sebesar</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={[styles.valueCol, styles.valueBold]}>Rp {formatRupiah(nominal)}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.labelCol}>Terbilang</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={[styles.valueCol, styles.valueBold]}>{terbilang(nominal)}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.labelCol}>Keterangan</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={[styles.valueCol, styles.valueBold]}>{deskripsi.toUpperCase()}</Text>
          </View>

          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Untuk</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.labelCol}>Unit</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={[styles.valueCol, styles.valueBold]}>{unitText}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.labelCol}>Lokasi</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={[styles.valueCol, styles.valueBold]}>{lokasiText}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.labelCol}>Konsumen</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={[styles.valueCol, styles.valueBold]}>{namaKonsumen}</Text>
          </View>
        </View>

        {/* TTD */}
        <View style={styles.ttdContainer}>
          <Text style={styles.tanggalText}>{formatKotaTanggal(tanggal)}</Text>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBlockLeft}>
              <Text style={styles.signatureTitle}>Penyetor,</Text>
              <Text style={styles.signatureName}>({namaPenyetor})</Text>
            </View>
            <View style={styles.signatureBlockRight}>
              <Text style={styles.signatureTitle}>Petugas,</Text>
              <Text style={styles.signatureName}>({namaPetugas})</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}