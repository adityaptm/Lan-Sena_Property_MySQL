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
  sectionSpace: {
    marginTop: 15,
    marginBottom: 10,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '40%',
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

export const Lampiran1 = ({ customer, tanggalCetak }: Props) => {
  const isMenikah = customer.status_pernikahan === 'Menikah';

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.headerLeft}>
        <Text>LAMPIRAN 1</Text>
        <Text>(Pemohon FLPP)</Text>
      </View>

      <Text style={styles.title}>SURAT PERNYATAAN PENYERAHAN DATA</Text>

      <Text style={styles.paragraph}>Saya, yang bertanda-tangan di bawah ini :</Text>

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
        <Text style={styles.labelColumn}>NIK</Text>
        <Text style={styles.colonColumn}>:</Text>
        <Text style={styles.valueColumn}>{customer.nik || '-'}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.labelColumn}>Alamat Domisili</Text>
        <Text style={styles.colonColumn}>:</Text>
        <Text style={styles.valueColumn}>{customer.alamat_domisili || customer.domisili || '-'}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.labelColumn}>Alamat Sesuai KTP</Text>
        <Text style={styles.colonColumn}>:</Text>
        <Text style={styles.valueColumn}>{customer.alamat_ktp || customer.alamat || '-'}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.labelColumn}>Nomor Telepon/HP</Text>
        <Text style={styles.colonColumn}>:</Text>
        <Text style={styles.valueColumn}>{customer.no_hp || '-'}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.labelColumn}>Alamat email</Text>
        <Text style={styles.colonColumn}>:</Text>
        <Text style={styles.valueColumn}>{customer.email || '-'}</Text>
      </View>
      <Text style={[styles.paragraph, { marginTop: 5 }]}>Selaku Pemohon.</Text>

      {isMenikah && (
        <View style={styles.sectionSpace}>
          <View style={styles.row}>
            <Text style={styles.labelColumn}>Nama</Text>
            <Text style={styles.colonColumn}>:</Text>
            <Text style={styles.valueColumn}>{customer.nama_pasangan || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelColumn}>Tempat/tgl lahir</Text>
            <Text style={styles.colonColumn}>:</Text>
            <Text style={styles.valueColumn}>
              {customer.tempat_lahir_pasangan || '-'}, {customer.tanggal_lahir_pasangan ? formatTanggalIndonesia(new Date(customer.tanggal_lahir_pasangan)) : '-'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelColumn}>Pekerjaan</Text>
            <Text style={styles.colonColumn}>:</Text>
            <Text style={styles.valueColumn}>{customer.pekerjaan_pasangan || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelColumn}>NIK</Text>
            <Text style={styles.colonColumn}>:</Text>
            <Text style={styles.valueColumn}>{customer.nik_pasangan || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelColumn}>Alamat Domisili</Text>
            <Text style={styles.colonColumn}>:</Text>
            <Text style={styles.valueColumn}>{customer.alamat_domisili_pasangan || '-'}</Text>
          </View>
          <Text style={[styles.paragraph, { marginTop: 5 }]}>Selaku suami/istri pemohon.</Text>
        </View>
      )}

      <Text style={[styles.paragraph, { marginTop: 15 }]}>Bersama ini;</Text>
      
      <View style={styles.numberedList}>
        <Text style={styles.numbering}>1.</Text>
        <Text style={styles.listContent}>Menyatakan telah mengetahui, memahami dan menyanggupi untuk memenuhi seluruh ketentuan dan persyaratan Pusat Pengelolaan Dana Pembiayaan Perumahan (PPDPP) untuk mendapatkan fasilitas KPR Sejahtera.</Text>
      </View>
      <View style={styles.numberedList}>
        <Text style={styles.numbering}>2.</Text>
        <Text style={styles.listContent}>Menyampaikan semua data pribadi (KTP, NPWP, Pas Photo) untuk mendapatkan fasilitas KPR Sejahtera dan semua data lainnya yang diperlukan oleh PPDPP melalui Bank BTN, serta menjamin bahwa semua data yang saya sampaikan tersebut adalah benar dan dapat dipertanggungjawabkan keabsahannya.</Text>
      </View>
      <View style={styles.numberedList}>
        <Text style={styles.numbering}>3.</Text>
        <Text style={styles.listContent}>Memberikan kuasa kepada PPDPP untuk mengakses semua data pribadi saya yang terkait data FLPP yang ada di Bank BTN.</Text>
      </View>
      <View style={styles.numberedList}>
        <Text style={styles.numbering}>4.</Text>
        <Text style={styles.listContent}>Apabila dikemudian hari pernyataan saya ini tidak benar dan/atau tidak saya penuhi, saya bersedia mengembalikan seluruh subsidi yang telah saya terima dari Pemerintah dan bersedia dikenakan sanksi sesuai dengan ketentuan peraturan perundang-undangan.</Text>
      </View>
      <View style={styles.numberedList}>
        <Text style={styles.numbering}>5.</Text>
        <Text style={styles.listContent}>Memberikan persetujuan kepada Bank BTN untuk memberikan semua data pribadi saya yang terdapat di Bank BTN kepada PPDPP.</Text>
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
            <Text style={styles.materaiText}>Materai 6000</Text>
          </View>
          <Text style={styles.signatureName}>({customer.nama || '...........................'})</Text>
        </View>
      </View>
    </Page>
  );
};
