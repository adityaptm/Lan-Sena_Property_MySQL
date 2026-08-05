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

// Ukuran Kwitansi: 24 cm x 14 cm (1 cm = 28.3465 pt)
// Width = 24 * 28.3465 = 680.315 pt
// Height = 14 * 28.3465 = 396.85 pt
// Karena WIDTH > HEIGHT, halaman otomatis landscape tanpa perlu prop `orientation`.
const KWITANSI_WIDTH = 680.315;
const KWITANSI_HEIGHT = 396.85;

const styles = StyleSheet.create({
  page: {
    paddingTop: 15,
    paddingBottom: 15,
    paddingLeft: 30,
    paddingRight: 30,
    fontSize: 9.5,
    fontFamily: 'Arial Narrow',
    lineHeight: 1.3,
  },
  // --- KOP SURAT ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoContainer: {
    width: 65,
    marginRight: 10,
  },
  logo: { width: '100%' },
  headerTextContainer: { alignItems: 'center' },
  companyName: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 1,
  },
  companySubtitle: {
    fontSize: 9.5,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 1,
  },
  companyAddress: {
    fontSize: 8,
    textAlign: 'center',
    color: '#333',
  },
  headerLine: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    marginTop: 4,
    marginBottom: 10,
  },

  // --- JUDUL ---
  titleContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  titleText: {
    fontSize: 11.5,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.2,
    color: '#000',
  },

  // --- DATA FIELDS (Tanpa Tabel / Polos dengan Kolon) ---
  fieldsContainer: {
    marginBottom: 8,
    paddingLeft: 5,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 3.5,
    alignItems: 'flex-start',
  },
  labelCol: {
    width: 125,
    color: '#222',
  },
  colon: {
    width: 12,
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
    marginTop: 2,
    marginBottom: 2,
  },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    color: '#000',
  },

  // --- TTD SECTION ---
  ttdContainer: {
    marginTop: 8,
    paddingHorizontal: 10,
  },
  tanggalText: {
    textAlign: 'right',
    fontSize: 9,
    marginBottom: 4,
    marginRight: 30,
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
    fontSize: 9,
    marginBottom: 32,
  },
  signatureName: {
    fontSize: 9,
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
      <Page size={[KWITANSI_WIDTH, KWITANSI_HEIGHT]} style={styles.page}>
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
              Desa Benteng Kec. Cempaka Kab. Purwakarta (0264) - 8308450 Jawa Barat 41181
            </Text>
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