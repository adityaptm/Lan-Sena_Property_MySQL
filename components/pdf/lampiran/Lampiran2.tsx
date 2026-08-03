import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Customer, Bank } from '@/types';
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
  subList: {
    flexDirection: 'row',
    marginTop: 5,
    marginBottom: 2,
  },
  subNumbering: {
    width: 20,
  },
  signatureContainer: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '40%',
    alignItems: 'center',
  },
  dateText: {
    textAlign: 'right',
    marginBottom: 10,
  },
  signatureSpace: {
    height: 60,
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
  },
  mengetahuiBox: {
    marginTop: 20,
  },
  mengetahuiTitle: {
    marginBottom: 50,
  },
  mengetahuiContent: {
    fontWeight: 'bold',
  }
});

interface Props {
  customer: Customer;
  bank?: Bank;
  tanggalCetak: string;
}

export const Lampiran2 = ({ customer, bank, tanggalCetak }: Props) => {
  const isMenikah = customer.status_pernikahan === 'Menikah';

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.headerLeft}>
        <Text>LAMPIRAN 2</Text>
      </View>

      <Text style={styles.title}>SURAT PERNYATAAN PENGHUNINAN RUMAH UMUM BERSUBSIDI</Text>

      <Text style={styles.paragraph}>Yang bertanda-tangan di bawah ini :</Text>

      <View style={styles.row}>
        <Text style={styles.labelColumn}>Nama Lengkap</Text>
        <Text style={styles.colonColumn}>:</Text>
        <Text style={styles.valueColumn}>{customer.nama}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.labelColumn}>No KTP</Text>
        <Text style={styles.colonColumn}>:</Text>
        <Text style={styles.valueColumn}>{customer.nik || '-'}</Text>
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
        <Text style={styles.labelColumn}>Alamat</Text>
        <Text style={styles.colonColumn}>:</Text>
        <Text style={styles.valueColumn}>{customer.alamat_ktp || customer.alamat || '-'}</Text>
      </View>

      <Text style={[styles.paragraph, { marginTop: 15 }]}>Selaku Debitur KPR Bersubsidi BTN menyatakan dengan sesungguhnya bahwa:</Text>

      <View style={styles.numberedList}>
        <Text style={styles.numbering}>1.</Text>
        <Text style={styles.listContent}>Saya telah memahami ketentuan penghunian rumah sejahtera sebagaimana dimaksud di dalam Peraturan Menteri Pekerjaan Umum dan Perumahan Rakyat.</Text>
      </View>
      <View style={styles.numberedList}>
        <Text style={styles.numbering}>2.</Text>
        <View style={styles.listContent}>
          <Text>Saya menyatakan bahwa :</Text>
          <View style={styles.subList}>
             <Text style={styles.subNumbering}>a.</Text>
             <Text style={{flex: 1}}>berpenghasilan tidak melebihi batas penghasilan kelompok sasaran KPR Bersubsidi;</Text>
          </View>
          <View style={styles.subList}>
             <Text style={styles.subNumbering}>b.</Text>
             <Text style={{flex: 1}}>saya dan istri/suami*) tidak memiliki rumah;</Text>
          </View>
          <View style={styles.subList}>
             <Text style={styles.subNumbering}>c.</Text>
             <Text style={{flex: 1}}>saya dan istri/suami*) tidak pernah menerima subsidi kepemilikan rumah.</Text>
          </View>
        </View>
      </View>
      <View style={styles.numberedList}>
        <Text style={styles.numbering}>3.</Text>
        <Text style={styles.listContent}>menggunakan sendiri dan menghuni rumah umum tapak atau sarusun umum sebagai tempat tinggal dalam jangka waktu paling lambat 1 (satu) tahun setelah serah terima rumah.</Text>
      </View>
      <View style={styles.numberedList}>
        <Text style={styles.numbering}>4.</Text>
        <Text style={styles.listContent}>tidak akan menyewakan dan/atau mengalihkan kepemilikan rumah umum tapak atau sarusun umum dengan bentuk perbuatan hukum apapun, kecuali sesuai dengan ketentuan Peraturan Menteri Pekerjaan Umum dan Perumahan Rakyat.</Text>
      </View>
      <View style={styles.numberedList}>
        <Text style={styles.numbering}>5.</Text>
        <Text style={styles.listContent}>Bahwa semua dokumen persyaratan yang disampaikan kepada Bank BTN untuk memperoleh KPR Bersubsidi BTN adalah benar dan dapat dipertanggungjawabkan keabsahaannya.</Text>
      </View>
      <View style={styles.numberedList}>
        <Text style={styles.numbering}>6.</Text>
        <Text style={styles.listContent}>Apabila di kemudian hari pernyataan ini tidak benar dan/atau tidak saya penuhi, saya bersedia dan memberikan kuasa kepada Bank BTN untuk menghentikan fasilitas KPR Bersubsidi BTN dan/atau mengubah menjadi KPR BTN Non-Subsidi, setelah Bank BTN menerima surat permintaan penghentian KPR Bersubsidi dari pihak yang berwenang.</Text>
      </View>
      <View style={styles.numberedList}>
        <Text style={styles.numbering}>7.</Text>
        <Text style={styles.listContent}>Saya bersedia untuk menanggung segala biaya yang meliputi biaya asuransi, biaya pengikatan agunan, dan biaya lainnya yang timbul atas penghentian KPR Bersubsidi BTN.</Text>
      </View>

      <Text style={[styles.paragraph, { marginTop: 15 }]}>Demikian surat pernyataan ini saya buat dengan sebenar-benarnya tanpa paksaan dari pihak manapun.</Text>

      <Text style={styles.dateText}>Purwakarta, {tanggalCetak}</Text>

      <View style={styles.signatureContainer}>
        <View style={styles.signatureBox}>
          <Text>Yang Menyetujui,</Text>
          <View style={styles.signatureSpace} />
          <Text style={styles.signatureName}>({isMenikah ? (customer.nama_pasangan || '...........................') : '...........................'})</Text>
        </View>
        <View style={styles.signatureBox}>
          <Text>Yang Membuat Pernyataan,</Text>
          <View style={styles.signatureSpace}>
            <Text style={styles.materaiText}>Materai secukupnya</Text>
          </View>
          <Text style={styles.signatureName}>({customer.nama || '...........................'})</Text>
        </View>
      </View>

      <View style={styles.mengetahuiBox}>
        <Text style={styles.mengetahuiTitle}>Mengetahui,</Text>
        <Text style={styles.mengetahuiContent}>PT. BANK TABUNGAN NEGARA (PERSERO) Tbk.</Text>
        <Text style={styles.mengetahuiContent}>KANTOR CABANG {bank?.cabang ? bank.cabang.toUpperCase() : '...........................'}</Text>
      </View>
    </Page>
  );
};
