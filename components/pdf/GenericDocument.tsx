import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { LOGO_BASE64 } from '@/lib/logo-base64';

const styles = StyleSheet.create({
  page: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 30,
    paddingRight: 30,
    fontSize: 9.5,
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoContainer: {
    width: 90,
    height: 90,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 90,
    height: 90,
    objectFit: 'contain',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#000',
    marginBottom: 4,
  },
  companySubtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#333',
    marginBottom: 4,
  },
  companyAddress: {
    fontSize: 8,
    textAlign: 'center',
    color: '#555',
  },
  headerLine: {
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a8a',
    marginTop: 5,
    marginBottom: 15,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    textDecoration: 'underline',
    textTransform: 'uppercase',
  },
  content: {
    marginBottom: 20,
    textAlign: 'justify',
  },
  signatureContainer: {
    flexDirection: 'row',
    marginTop: 40,
    justifyContent: 'space-between',
    paddingLeft: 15,
    paddingRight: 15,
  },
  signatureBlock: {
    alignItems: 'center',
    width: 200,
  },
  signatureDate: {
    marginBottom: 10,
  },
  signatureSpace: {
    height: 45,
  },
  signatureName: {
    fontFamily: 'Helvetica-Bold',
    textDecoration: 'underline',
  },
});

export const GenericDocument = ({ sale, customer, unit, type, baseUrl, logoSrc }: any) => {
  const tanggalCetak = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  
  let title = 'DOKUMEN PENJUALAN';
  let bodyText = `Dokumen ini terkait dengan Penjualan untuk Konsumen atas nama ${customer?.nama || '-'} pada unit Blok ${unit?.block_nama || '-'} No ${unit?.no_unit || '-'}.`;

  if (type === 'persyaratan') {
    title = 'CEKLIST PERSYARATAN KPR';
    bodyText = `Dokumen ini digunakan sebagai checklist persyaratan administrasi KPR untuk Konsumen atas nama ${customer?.nama || '-'} pada unit Blok ${unit?.block_nama || '-'} No ${unit?.no_unit || '-'}.\n\n(Draft detail persyaratan menyusul)`;
  } else if (type === 'serah-terima') {
    title = 'BERITA ACARA SERAH TERIMA KUNCI';
    bodyText = `Telah dilakukan serah terima kunci unit rumah Blok ${unit?.block_nama || '-'} No ${unit?.no_unit || '-'} kepada Konsumen atas nama ${customer?.nama || '-'}.\n\n(Draft detail berita acara menyusul)`;
  } else if (type === 'komplen') {
    title = 'SURAT KOMPLAIN KONSUMEN';
    bodyText = `Formulir komplain untuk keluhan konsumen atas nama ${customer?.nama || '-'} pada unit Blok ${unit?.block_nama || '-'} No ${unit?.no_unit || '-'}.\n\n(Draft detail komplain menyusul)`;
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image src={logoSrc || LOGO_BASE64} style={styles.logo} />
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

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
        </View>

        <Text style={styles.content}>
          {bodyText}
        </Text>

        <View style={styles.signatureContainer}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureDate}> </Text>
            <Text>Konsumen,</Text>
            <View style={styles.signatureSpace} />
            <Text style={styles.signatureName}>{customer?.nama || '...........................................'}</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureDate}>Cilegon, {tanggalCetak}</Text>
            <Text>Manajemen,</Text>
            <View style={styles.signatureSpace} />
            <Text style={styles.signatureName}>PT LAN SENA JAYA</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
