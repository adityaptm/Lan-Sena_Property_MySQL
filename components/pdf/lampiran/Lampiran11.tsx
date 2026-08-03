import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { CompanySettings, Location } from '@/types';

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
  companySettings: CompanySettings | null;
  location: Location | null;
  tanggalCetak: string;
  cabangPKS: string;
  nomorPKS: string;
  tanggalPKS: string;
}

export const Lampiran11 = ({ companySettings, location, tanggalCetak, cabangPKS, nomorPKS, tanggalPKS }: Props) => {
  const comp = companySettings || {
    nama_perusahaan: 'PT LAN SENA JAYA',
    direktur_nama: 'ALAN SUHERLAN',
    direktur_nik: '-',
    direktur_jabatan: 'Direktur Utama',
    alamat_kantor: '-',
    telp_kantor: '-'
  };
  
  const locName = location?.nama_lokasi || 'Perumahan Benteng Mutiara Mas';

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.headerLeft}>
        <Text>LAMPIRAN 11</Text>
      </View>

      <Text style={styles.title}>SURAT PERNYATAAN PENYELESAIAN{'\n'}PRASARANA, SARANA & UTILITAS PERUMAHAN</Text>

      <Text style={styles.paragraph}>Yang bertanda tangan dibawah ini:</Text>

      <View style={styles.row}>
        <Text style={styles.labelColumn}>Nama</Text>
        <Text style={styles.colonColumn}>:</Text>
        <Text style={styles.valueColumn}>{comp.direktur_nama || '-'}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.labelColumn}>No. KTP</Text>
        <Text style={styles.colonColumn}>:</Text>
        <Text style={styles.valueColumn}>{comp.direktur_nik || '-'}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.labelColumn}>Alamat Kantor/Telp</Text>
        <Text style={styles.colonColumn}>:</Text>
        <Text style={styles.valueColumn}>{comp.alamat_kantor || '-'} / {comp.telp_kantor || '-'}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.labelColumn}>Jabatan</Text>
        <Text style={styles.colonColumn}>:</Text>
        <Text style={styles.valueColumn}>{comp.direktur_jabatan || '-'} yang mewakili {comp.nama_perusahaan || '-'}</Text>
      </View>

      <Text style={[styles.paragraph, { marginTop: 15 }]}>
        selaku pengembang pada proyek perumahan {locName}
      </Text>
      
      <Text style={styles.paragraph}>Menyatakan hal-hal sebagai berikut:</Text>

      <View style={styles.numberedList}>
        <Text style={styles.numbering}>1.</Text>
        <Text style={styles.listContent}>Bahwa rumah sejahtera yang dijual oleh {comp.nama_perusahaan} dan diserah terimakan kepada debitur Bank BTN pada saat akad kredit adalah dalam kondisi siap huni dan telah memenuhi persyaratan teknis keselamatan, keamanan dan kehandalan bangunan sesuai dengan ketentuan Pemerintah yang berlaku.</Text>
      </View>
      <View style={styles.numberedList}>
        <Text style={styles.numbering}>2.</Text>
        <Text style={styles.listContent}>Bahwa pada saat surat pernyataan ini ditandatangani, {comp.nama_perusahaan} telah menyerahkan bukti pembayaran biaya penyambungan listrik dari PLN dan jalan lingkungan telah dilakukan perkerasan badan jalan dan berfungsi.</Text>
      </View>
      <View style={styles.numberedList}>
        <Text style={styles.numbering}>3.</Text>
        <Text style={styles.listContent}>Bahwa {comp.nama_perusahaan} bersedia menyelesaikan jalan lingkungan paling lambat 3 (tiga) bulan sejak perjanjian kredit/akad pembayaran KPR Bersubsidi.</Text>
      </View>
      <View style={styles.numberedList}>
        <Text style={styles.numbering}>4.</Text>
        <View style={styles.listContent}>
          <Text>Bahwa {comp.nama_perusahaan} bersedia menyediakan dana jaminan kepada Bank BTN berupa dana yang ditahan (dana retensi) dengan rincian sebagai berikut :</Text>
          <View style={styles.subList}>
             <Text style={styles.subNumbering}>a.</Text>
             <Text style={{flex: 1}}>Dana yang ditahan untuk setiap debitur/unit rumah, berjumlah paling sedikit 2 (dua) kali nilai jalan lingkungan yang belum terselesaikan.</Text>
          </View>
          <View style={styles.subList}>
             <Text style={styles.subNumbering}>b.</Text>
             <Text style={{flex: 1}}>Nilai jalan lingkungan adalah berdasarkan penilaian (appraisal) Bank BTN.</Text>
          </View>
          <View style={styles.subList}>
             <Text style={styles.subNumbering}>c.</Text>
             <Text style={{flex: 1}}>Dana yang ditahan diambil dari hasil setiap pencairan KPR Bersubsidi untuk setiap debitur/unit rumah yang jalan lingkungan yang belum terselesaikan.</Text>
          </View>
        </View>
      </View>
      <View style={styles.numberedList}>
        <Text style={styles.numbering}>5.</Text>
        <Text style={styles.listContent}>Dalam hal {comp.nama_perusahaan} tidak dapat menyelesaikan kewajiban sebagaimana dimaksud butir 3 di atas maka bersedia dan menyetujui dana jaminan sebagaimana dimaksud butir 4 di atas digunakan oleh Bank BTN untuk memastikan kewajiban penyelesaian jalan lingkungan sesuai dengan ketentuan Pemerintah yang berlaku.</Text>
      </View>
      <View style={styles.numberedList}>
        <Text style={styles.numbering}>6.</Text>
        <Text style={styles.listContent}>Surat pernyataan ini adalah bagian yang tidak terpisahkan dari Perjanjian Kerjasama (PKS) dengan Bank BTN Kantor Cabang {cabangPKS || '...........................'} tentang Penyediaan Dukungan KPR BTN Bersubsidi Nomor {nomorPKS || '...........................'} tanggal {tanggalPKS || '...........................'}.</Text>
      </View>

      <Text style={[styles.paragraph, { marginTop: 15 }]}>
        Demikian surat pernyataan ini dibuat dengan sebenarnya tanpa paksaan dari pihak manapun dan apabila di kemudian hari pernyataan ini tidak benar, maka bersedia menerima konsekuensi sesuai dengan ketentuan Pemerintah dan Perundang-undangan yang berlaku.
      </Text>

      <Text style={styles.dateText}>Purwakarta, {tanggalCetak}</Text>

      <View style={{ alignItems: 'flex-end', marginTop: 10 }}>
        <View style={{ width: '40%', alignItems: 'center' }}>
          <Text>Yang membuat pernyataan,</Text>
          <View style={styles.signatureSpace}>
            <Text style={styles.materaiText}>Materai secukupnya</Text>
          </View>
          <Text style={styles.signatureName}>{comp.direktur_nama || '...........................'}</Text>
          <Text>{comp.direktur_jabatan || '...........................'}</Text>
        </View>
      </View>
    </Page>
  );
};
