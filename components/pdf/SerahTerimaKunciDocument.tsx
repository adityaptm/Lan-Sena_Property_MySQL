import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { LOGO_BASE64 } from '@/lib/logo-base64';

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
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 30,
    paddingRight: 30,
    fontSize: 10,
    fontFamily: 'Arial Narrow',
    lineHeight: 1.3,
  },
  // --- Header / Kop Surat ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  logoContainer: {
    width: 65,
    height: 65,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 65,
    height: 65,
    objectFit: 'contain',
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  companySubtitle: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  companyAddress: {
    fontSize: 9,
    textAlign: 'center',
    color: '#000',
  },
  headerLine: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    marginTop: 5,
    marginBottom: 10,
  },
  // --- Title ---
  titleContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    textDecoration: 'underline',
  },
  subTitle: {
    fontSize: 10.5,
    marginTop: 2,
    fontFamily: 'Helvetica-Bold',
  },
  // --- Content ---
  content: {
    marginTop: 6,
  },
  introText: {
    marginBottom: 8,
    fontFamily: 'Helvetica-Bold',
  },
  table: {
    marginVertical: 8,
    marginLeft: 15,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 80,
    fontFamily: 'Helvetica-Bold',
  },
  colon: {
    width: 10,
  },
  value: {
    flex: 1,
  },
  note: {
    marginVertical: 12,
    textAlign: 'justify',
  },
  noteBold: {
    fontFamily: 'Helvetica-Bold',
  },
  dateLocationContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: -50,
    marginTop: 12,
    marginBottom: 6,
  },
  dateLocationText: {
    width: 180,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  signatureBox: {
    width: 180,
    textAlign: 'center',
  },
  space: {
    height: 55,
  },
});

interface SerahTerimaKunciDocumentProps {
  sale?: any;
  customer?: any;
  unit?: any;
  nomorSurat?: string;
  tanggalSerahTerima?: string;
  yangMenyerahkan?: string;
  masaPemeliharaan?: string | number;
  catatanPemeliharaan?: string;
  baseUrl?: string;
  logoSrc?: string;
}

export function SerahTerimaKunciDocument({
  customer,
  unit,
  nomorSurat = '',
  tanggalSerahTerima,
  yangMenyerahkan = '',
  masaPemeliharaan = '100',
  catatanPemeliharaan = 'tidak merenovasi dan memperbaiki sendiri',
  baseUrl = '',
  logoSrc,
}: SerahTerimaKunciDocumentProps) {
  const formatTanggalIndo = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // 1. Ekstraksi Nama Customer
  const namaCustomer = customer?.nama || customer?.name || '-';

  // 2. Ekstraksi Data Unit
  const blokVal = unit?.block_nama || unit?.block || unit?.blok || '';
  const nomorVal = unit?.no_unit || unit?.number || unit?.unit_number || unit?.no || '';

  let blokNomor = '-';
  if (blokVal && nomorVal) {
    blokNomor = `${blokVal} No ${nomorVal}`;
  } else if (blokVal) {
    blokNomor = blokVal;
  } else if (nomorVal) {
    blokNomor = nomorVal;
  } else if (unit?.nama_unit) {
    blokNomor = unit.nama_unit;
  }

  // 3. Ekstraksi Tipe Unit
  const tipeUnit = unit?.unit_type_nama || unit?.type || unit?.tipe || '-';

  const resolvedLogo = logoSrc || LOGO_BASE64;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* KOP SURAT */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image src={resolvedLogo} style={styles.logo} />
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
          <Text style={styles.title}>TANDA TERIMA KUNCI</Text>
          {nomorSurat ? <Text style={styles.subTitle}>{nomorSurat}</Text> : null}
        </View>

        {/* ISI */}
        <View style={styles.content}>
          <Text style={styles.introText}>
            Telah diterima kunci rumah Perumahan Benteng Mutiara Mas :
          </Text>

          {/* TABLE DETAIL DATA */}
          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.label}>Nama</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{namaCustomer}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Blok / No</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{blokNomor}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Type</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{tipeUnit}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Kunci</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>Satu Set</Text>
            </View>
          </View>

 {/* KETENTUAN PEMELIHARAAN */}
<Text style={styles.note}>
  Masa pemeliharaan{' '}
  <Text style={styles.noteBold}>{masaPemeliharaan} hari sejak kunci rumah</Text>
  {' '}tersebut dengan catatan {catatanPemeliharaan}.
</Text>
          {/* TANGGAL - sejajar tepat di atas kolom "Yang Menerima" */}
          <View style={styles.dateLocationContainer}>
            <Text style={styles.dateLocationText}>
              Purwakarta, {formatTanggalIndo(tanggalSerahTerima)}
            </Text>
          </View>

          {/* TANDA TANGAN */}
          <View style={styles.signatureSection}>
            <View style={styles.signatureBox}>
              <Text>Yang Menyerahkan,</Text>
              <View style={styles.space} />
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>
                ( {yangMenyerahkan || '............................'} )
              </Text>
            </View>

            <View style={styles.signatureBox}>
              <Text>Yang Menerima,</Text>
              <View style={styles.space} />
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>
                ( {namaCustomer} )
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}