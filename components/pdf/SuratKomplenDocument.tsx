import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

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
    padding: 40,
    fontSize: 10,
    fontFamily: 'Arial Narrow',
    lineHeight: 1.5,
    color: '#000000',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textDecoration: 'underline',
  },
  content: {
    marginTop: 10,
    marginBottom: 15,
  },
  table: {
    marginVertical: 10,
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
  complaintTitle: {
    fontFamily: 'Helvetica-Bold',
    marginTop: 10,
    marginBottom: 5,
  },
  complaintList: {
    marginLeft: 15,
    marginBottom: 15,
  },
  complaintItem: {
    flexDirection: 'row',
    marginBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#cccccc',
    paddingBottom: 2,
    minHeight: 20,
  },
  itemNumber: {
    width: 20,
  },
  itemText: {
    flex: 1,
  },
  dateLocation: {
    marginTop: 15,
    marginBottom: 30,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  signatureBox: {
    width: 180,
    textAlign: 'center',
  },
  space: {
    height: 60,
  },
});

interface SuratKomplenDocumentProps {
  sale?: any;
  customer?: any;
  unit?: any;
  tanggalKomplen?: string;
  penerimaKomplen?: string;
  isiKomplen?: string;
  baseUrl?: string;
}

export function SuratKomplenDocument({
  customer,
  unit,
  tanggalKomplen,
  penerimaKomplen = '',
  isiKomplen = '',
}: SuratKomplenDocumentProps) {
  // Format Tanggal ke Bahasa Indonesia
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

  // 2. Ekstraksi Data Unit (Mendukung fleksibilitas penamaan properti DB)
  const blokVal = unit?.block_nama || unit?.block || unit?.blok || '';
  const nomorVal = unit?.no_unit || unit?.number || unit?.unit_number || unit?.no || '';
  
  // Kombinasi Blok dan Nomor Unit
  let blokNomor = '-';
  if (blokVal && nomorVal) {
    blokNomor = `${blokVal} No ${nomorVal}`;
  } else if (blokVal) {
    blokNomor = blokVal;
  } else if (nomorVal) {
    blokNomor = nomorVal;
  }

  // Parse isi komplen: pisahkan dengan koma atau newline
  const inputItems = isiKomplen
    ? isiKomplen.split(/,|\n/).map((s) => s.trim()).filter((s) => s)
    : [];

  // Penuhi minimal 10 item komplain
  const komplenItems = [...inputItems];
  while (komplenItems.length < 10) {
    komplenItems.push('');
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* JUDUL */}
        <View style={styles.header}>
          <Text style={styles.title}>SURAT KOMPLEN</Text>
        </View>

        {/* ISI */}
        <View style={styles.content}>
          {/* DETAIL DATA */}
          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.label}>Nama</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{namaCustomer}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Blok/No</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{blokNomor}</Text>
            </View>
          </View>

          <Text style={styles.complaintTitle}>Mengajukan Komplen Mengenai :</Text>

          {/* LIST KOMPLAIN (1 s/d 10) */}
          <View style={styles.complaintList}>
            {komplenItems.map((item, index) => (
              <View key={index} style={styles.complaintItem}>
                <Text style={styles.itemNumber}>{index + 1}.</Text>
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* LOKASI DAN TANGGAL */}
          <Text style={styles.dateLocation}>
            Purwakarta, {formatTanggalIndo(tanggalKomplen)}
          </Text>

          {/* TANDA TANGAN */}
          <View style={styles.signatureSection}>
            <View style={styles.signatureBox}>
              <Text>Yang Menerima,</Text>
              <View style={styles.space} />
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>
                ( {penerimaKomplen || '............................'} )
              </Text>
            </View>

            <View style={styles.signatureBox}>
              <Text>Yang Mengajukan,</Text>
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
