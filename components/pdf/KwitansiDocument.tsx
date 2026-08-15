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

const KWITANSI_WIDTH = 680.315;
const KWITANSI_HEIGHT = 396.85;

const styles = StyleSheet.create({
  page: {
    paddingTop: 38, 
    paddingLeft: 35,
    paddingRight: 85, // Ditambah agar TTD Petugas bergeser ke kiri dan tidak terpotong
    fontSize: 9,
    fontFamily: 'Arial Narrow',
    lineHeight: 1.15,
  },
  // --- KOP SURAT ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 2,
    marginLeft: 0,
  },
  logoContainer: {
    width: 70,
    marginRight: 10,
  },
  logo: { 
    width: '100%',
    objectFit: 'contain',
  },
  headerTextContainer: { 
    alignItems: 'flex-start' 
  },
  companyName: {
    fontSize: 13.5,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  companySubtitle: {
    fontSize: 8.5,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  companyAddress: {
    fontSize: 7.5,
    textAlign: 'left',
    color: '#333',
    lineHeight: 1.25,
  },
  headerLine: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#2563eb',
    marginTop: 4,
    marginBottom: 4,
  },

  // --- JUDUL ---
  titleContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  titleText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    color: '#000',
  },

  // --- DATA FIELDS ---
  fieldsContainer: {
    marginBottom: 2,
    paddingLeft: 5,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 1.5,
    alignItems: 'flex-start',
  },
  labelCol: {
    width: 120,
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
    marginTop: 1,
    marginBottom: 1,
  },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: '#000',
  },

  // --- TTD SECTION ---
  ttdContainer: {
    marginTop: 6,
    paddingHorizontal: 0, // Dihilangkan padding horizontal internal agar presisi dengan margin page
  },
  tanggalContainer: {
    alignItems: 'center',
    width: 180, // Dikecilkan sedikit agar muat sempurna di kanan
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  tanggalText: {
    fontSize: 8.5,
    textAlign: 'center',
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
    width: 180, // Dikecilkan dari 200 ke 180 agar tidak keluar dari margin kanan
  },
  signatureTitle: {
    fontSize: 8.5,
    marginBottom: 40,
  },
  signatureName: {
    fontSize: 8.5,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
  },
});

interface KwitansiProps {
  payment?: any;
  sale?: any;
  unit?: any;
  customer?: any;
  petugasNama?: string;
  baseUrl?: string;
  logoSrc?: string;
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

export function KwitansiDocument({ payment, unit, customer, petugasNama = 'FAHRUL ROZI', baseUrl = '', logoSrc }: KwitansiProps) {
  const resolvedLogo = logoSrc || `${baseUrl}/logo.jpg`;

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
            {resolvedLogo ? <Image src={resolvedLogo} style={styles.logo} /> : null}
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.companyName}>PT LAN SENA JAYA</Text>
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

        {/* LIST FIELD BIASA */}
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
          <View style={styles.tanggalContainer}>
            <Text style={styles.tanggalText}>{formatKotaTanggal(tanggal)}</Text>
          </View>
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