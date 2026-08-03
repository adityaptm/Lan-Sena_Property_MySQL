import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Customer } from '@/types';
import { formatTanggalIndonesia } from '@/lib/format';

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.5,
  },
  headerLeft: {
    fontSize: 11,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    textDecoration: 'underline',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  labelColumn: {
    width: 150,
  },
  colonColumn: {
    width: 15,
  },
  valueColumn: {
    flex: 1,
  },
  paragraph: {
    marginBottom: 8,
    textAlign: 'justify',
  },
  numberedList: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  numbering: {
    width: 25,
  },
  listContent: {
    flex: 1,
    textAlign: 'justify',
  },
  signatureContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  dateText: {
    textAlign: 'right',
    marginBottom: 20,
  },
  signatureSpace: {
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  materaiText: {
    fontSize: 9,
    color: '#666',
  },
  signatureName: {
    fontWeight: 'bold',
    textDecoration: 'underline',
  }
});

interface Props {
  customer: Customer;
  tanggalCetak: string;
}

export const Lampiran5 = ({ customer, tanggalCetak }: Props) => {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.headerLeft}>
        <Text>LAMPIRAN 5</Text>
      </View>

      <Text style={styles.title}>SURAT PERNYATAAN PENYERAHAN SPT PPH</Text>

      <Text style={styles.paragraph}>Yang bertanda-tangan di bawah ini :</Text>

      <View style={styles.row}>
        <Text style={styles.labelColumn}>Nama</Text>
        <Text style={styles.colonColumn}>:</Text>
        <Text style={styles.valueColumn}>{customer.nama}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.labelColumn}>Tempat, Tanggal Lahir</Text>
        <Text style={styles.colonColumn}>:</Text>
        <Text style={styles.valueColumn}>
          {customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(new Date(customer.tanggal_lahir)) : '-'}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.labelColumn}>Pekerjaan</Text>
        <Text style={styles.colonColumn}>:</Text>
        <Text style={styles.valueColumn}>{customer.pekerjaan || '-'}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.labelColumn}>No KTP</Text>
        <Text style={styles.colonColumn}>:</Text>
        <Text style={styles.valueColumn}>{customer.nik || '-'}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.labelColumn}>Alamat</Text>
        <Text style={styles.colonColumn}>:</Text>
        <Text style={styles.valueColumn}>{customer.alamat_ktp || customer.alamat || '-'}</Text>
      </View>

      <Text style={[styles.paragraph, { marginTop: 15 }]}>Menyatakan hal-hal sebagai berikut:</Text>

      <View style={styles.numberedList}>
        <Text style={styles.numbering}>1.</Text>
        <Text style={styles.listContent}>Bahwa dikarenakan saya memiliki NPWP kurang dari 1 (satu) tahun pada saat pengajuan KPR Bersubsidi, maka saya belum dapat menyampaikan Surat Pemberitahuan Tahunan (SPT) Pajak Penghasilan (PPh) Orang Pribadi sebagai salah satu dokumen persyaratan pengajuan KPR Bersubsidi sebagaimana telah diatur oleh ketentuan Pemerintah.</Text>
      </View>
      <View style={styles.numberedList}>
        <Text style={styles.numbering}>2.</Text>
        <Text style={styles.listContent}>Bahwa saya bersedia menyampaikan dokumen SPT tahun berikutnya setelah akad kredit KPR Bersubsidi kepada Bank BTN.</Text>
      </View>
      <View style={styles.numberedList}>
        <Text style={styles.numbering}>3.</Text>
        <Text style={styles.listContent}>Bahwa saya bersedia menerima konsekuensi yang diberikan oleh Pemerintah dalam hal saya terlambat dan/atau tidak menyerahkan dokumen SPT tahun berikutnya setelah akad kredit KPR Bersubsidi kepada Bank BTN.</Text>
      </View>

      <Text style={[styles.paragraph, { marginTop: 15 }]}>
        Demikian surat pernyataan ini saya buat dengan sebenarnya tanpa paksaan dari pihak manapun dan apabila di kemudian hari pernyataan saya ini tidak benar, saya bersedia mengembalikan seluruh subsidi yang saya terima.
      </Text>

      <Text style={styles.dateText}>Purwakarta, {tanggalCetak}</Text>

      <View style={{ alignItems: 'flex-end', marginTop: 10 }}>
        <View style={{ width: '40%', alignItems: 'center' }}>
          <Text>Yang Membuat Pernyataan,</Text>
          <View style={styles.signatureSpace}>
            <Text style={styles.materaiText}>Materai secukupnya</Text>
          </View>
          <Text style={styles.signatureName}>({customer.nama || '...........................'})</Text>
        </View>
      </View>
    </Page>
  );
};
