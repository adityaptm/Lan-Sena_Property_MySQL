import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { formatRupiah, bulanKeRomawi } from '@/lib/format';

const styles = StyleSheet.create({
  page: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 30,
    paddingRight: 30,
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    lineHeight: 1.3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  logoContainer: {
    width: 120,
    marginRight: 10,
  },
  logo: {
    width: '100%',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  companySubtitle: {
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  companyAddress: {
    fontSize: 7.5,
    textAlign: 'center',
    color: '#000',
  },
  headerLine: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    marginTop: 5,
    marginBottom: 10,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  subtitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginTop: 2,
  },
  paragraph: {
    marginBottom: 5,
    textAlign: 'justify',
  },
  paragraphBold: {
    marginBottom: 5,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'left',
  },
  table: {
    marginBottom: 8,
    paddingLeft: 0,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  labelCell: {
    width: 140,
  },
  colonCell: {
    width: 10,
  },
  valueCellNormal: {
    flex: 1,
    textTransform: 'uppercase',
  },
  valueCellBold: {
    flex: 1,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  signatureContainer: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
    paddingLeft: 15,
    paddingRight: 15,
  },
  signatureBlock: {
    alignItems: 'center',
    width: 200,
  },
  signatureDate: {
    marginBottom: 5,
  },
  signatureSpace: {
    height: 45,
  },
});

export const SerahTerimaKunciDocument = ({ sale, customer, unit, tanggalSerahTerima, yangMenyerahkan, baseUrl }: any) => {
  const tanggalST = tanggalSerahTerima ? new Date(tanggalSerahTerima) : new Date();
  const tanggalCetak = tanggalST.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

  // Nomor surat: XXXX/KodeLokasi/STK/Bulan/Tahun
  const bulan = bulanKeRomawi(tanggalST.getMonth() + 1);
  const tahun = tanggalST.getFullYear();
  let urutan = '0001';
  if (sale?.no_penjualan) {
    const parts = sale.no_penjualan.split('/');
    urutan = parts[parts.length - 1] || '0001';
  }
  const kodeLokasi = unit?.location_kode_lokasi || 'BMM';
  const noSurat = `${urutan}/${kodeLokasi}/STK/${bulan}/${tahun}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* KOP SURAT */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image src={`${baseUrl}/logo.jpg`} style={styles.logo} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.companyName}>PT LAN SENA JAYA</Text>
            <Text style={styles.companySubtitle}>DEVELOPER & CONTRACTOR</Text>
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
          <Text style={styles.title}>BERITA ACARA SERAH TERIMA KUNCI</Text>
          <Text style={styles.subtitle}>{noSurat}</Text>
        </View>

        <Text style={styles.paragraph}>
          Pada hari ini, {tanggalCetak}, yang bertanda tangan di bawah ini:
        </Text>

        <Text style={styles.paragraphBold}>Pihak Pertama (Yang Menyerahkan):</Text>
        <View style={styles.table}>
          <View style={styles.row}><Text style={styles.labelCell}>Nama</Text><Text style={styles.colonCell}>:</Text><Text style={styles.valueCellBold}>{yangMenyerahkan || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.labelCell}>Jabatan</Text><Text style={styles.colonCell}>:</Text><Text style={styles.valueCellNormal}>PT LAN SENA JAYA</Text></View>
        </View>

        <Text style={styles.paragraphBold}>Pihak Kedua (Yang Menerima):</Text>
        <View style={styles.table}>
          <View style={styles.row}><Text style={styles.labelCell}>Nama</Text><Text style={styles.colonCell}>:</Text><Text style={styles.valueCellBold}>{customer?.nama || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.labelCell}>Alamat</Text><Text style={styles.colonCell}>:</Text><Text style={styles.valueCellNormal}>{customer?.domisili || customer?.alamat || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.labelCell}>No. Telp/HP</Text><Text style={styles.colonCell}>:</Text><Text style={styles.valueCellNormal}>{customer?.no_hp || '-'}</Text></View>
        </View>

        <Text style={styles.paragraph}>
          Dengan ini Pihak Pertama menyerahkan kunci rumah kepada Pihak Kedua atas unit rumah dengan rincian sebagai berikut:
        </Text>

        <View style={styles.table}>
          <View style={styles.row}><Text style={styles.labelCell}>Lokasi</Text><Text style={styles.colonCell}>:</Text><Text style={styles.valueCellBold}>{unit?.location_nama || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.labelCell}>Blok/Kavling</Text><Text style={styles.colonCell}>:</Text><Text style={styles.valueCellBold}>{unit?.block_nama || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.labelCell}>Nomor Unit</Text><Text style={styles.colonCell}>:</Text><Text style={styles.valueCellBold}>{unit?.no_unit || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.labelCell}>Tipe</Text><Text style={styles.colonCell}>:</Text><Text style={styles.valueCellBold}>{unit?.unit_type_nama || '-'}</Text></View>
        </View>

        <Text style={styles.paragraph}>
          Pihak Kedua telah menerima kunci rumah tersebut di atas dalam keadaan baik dan lengkap. Dengan ditandatanganinya berita acara ini, maka segala kerusakan dan/atau kehilangan atas unit rumah tersebut menjadi tanggung jawab Pihak Kedua.
        </Text>

        <Text style={styles.paragraph}>
          Demikian berita acara ini dibuat dan ditandatangani oleh kedua belah pihak dalam keadaan sadar dan tanpa paksaan dari pihak manapun.
        </Text>

        {/* TANDA TANGAN */}
        <View style={styles.signatureContainer}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureDate}>Yang Menyerahkan,</Text>
            <View style={styles.signatureSpace} />
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{yangMenyerahkan || '____________________'}</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureDate}>Yang Menerima,</Text>
            <View style={styles.signatureSpace} />
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{customer?.nama || '____________________'}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
