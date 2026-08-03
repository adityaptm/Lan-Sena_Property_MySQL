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
    marginBottom: 10,
    textAlign: 'justify',
  },
  signatureContainer: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
  },
  dateText: {
    textAlign: 'right',
    marginBottom: 20,
  },
  signatureSpace: {
    height: 70,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 5,
  },
  materaiText: {
    fontSize: 9,
    color: '#666',
  },
  signatureName: {
    fontWeight: 'bold',
  }
});

interface Props {
  customer: Customer;
  bank?: Bank;
  tanggalCetak: string;
  namaPejabatBank: string;
  jabatanPejabatBank: string;
}

export const Lampiran3 = ({ customer, bank, tanggalCetak, namaPejabatBank, jabatanPejabatBank }: Props) => {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.headerLeft}>
        <Text>LAMPIRAN 3</Text>
      </View>

      <Text style={styles.title}>SURAT KUASA PENDEBETAN DANA</Text>

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
        <Text style={styles.labelColumn}>Tempat/tgl lahir</Text>
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

      <Text style={[styles.paragraph, { marginTop: 15 }]}>
        yang dalam hal ini bertindak untuk dan atas nama sendiri, Selanjutnya disebut "Pemberi Kuasa".
      </Text>

      <Text style={styles.paragraph}>
        PT. Bank Tabungan Negara (Persero) Tbk, berkedudukan di Jalan Gajah Mada No. 01 Jakarta Pusat yang dalam hal ini diwakili oleh {namaPejabatBank || '...........................'} selaku {jabatanPejabatBank || '...........................'} di PT. Bank Tabungan Negara (Persero) Tbk. Kantor Cabang {bank?.cabang || '...........................'}. Selanjutnya disebut "Penerima Kuasa".
      </Text>

      <Text style={styles.paragraph}>
        Dengan ini Pemberi Kuasa memberi kuasa kepada Penerima Kuasa untuk melakukan pendebetan dana pada Nomor Rekening Tabungan Pemberi Kuasa dengan nomor {customer.nomor_rekening_kpr || '...........................'} atas nama {customer.nama || '...........................'} atas biaya asuransi, biaya pengikatan agunan, dan biaya lainnya yang timbul atas penghentian KPR Bersubsidi BTN.
      </Text>

      <Text style={styles.paragraph}>
        Kuasa ini diberikan dengan Hak Substitusi, tidak dapat dicabut kembali dan tidak akan berakhir karena sebab-sebab yang tercantum dalam pasal 1813 Kitab Undang-undang Hukum Perdata atau karena sebab apapun juga.
      </Text>

      <Text style={styles.dateText}>Purwakarta, {tanggalCetak}</Text>

      <View style={styles.signatureContainer}>
        <View style={styles.signatureBox}>
          <Text>PENERIMA KUASA,</Text>
          <Text>PT. BANK TABUNGAN NEGARA (Persero) Tbk</Text>
          <Text>Kantor Cabang {bank?.cabang || '...........................'}</Text>
          <View style={styles.signatureSpace} />
          <Text style={styles.signatureName}>({namaPejabatBank || '...........................'})</Text>
        </View>
        <View style={[styles.signatureBox, { alignItems: 'center' }]}>
          <Text>PEMBERI KUASA,</Text>
          <Text> </Text>
          <Text> </Text>
          <View style={styles.signatureSpace}>
            <Text style={styles.materaiText}>Materai secukupnya</Text>
          </View>
          <Text style={[styles.signatureName, { textDecoration: 'underline' }]}>({customer.nama || '...........................'})</Text>
        </View>
      </View>
    </Page>
  );
};
