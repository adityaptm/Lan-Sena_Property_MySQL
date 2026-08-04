import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { formatRupiah, bulanKeRomawi } from '@/lib/format';

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

// Create styles
const styles = StyleSheet.create({
  page: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 30,
    paddingRight: 30,
    fontSize: 8.5,
    fontFamily: 'Arial Narrow',
    lineHeight: 1.3,
  },
  // --- Header / Kop Surat ---
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
    borderBottomColor: '#2563eb', // blue line as in image
    marginTop: 5,
    marginBottom: 10,
  },

  // --- Title ---
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

  // --- Content ---
  paragraphBold: {
    marginBottom: 5,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'left',
  },
  paragraph: {
    marginBottom: 5,
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

  // --- List ---
  listRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  bullet: {
    width: 15,
    textAlign: 'right',
    paddingRight: 5,
  },
  listItemText: {
    flex: 1,
    textAlign: 'justify',
  },
  subListRow: {
    flexDirection: 'row',
    marginBottom: 2,
    marginTop: 2,
  },
  subBullet: {
    width: 15,
    textAlign: 'right',
    paddingRight: 5,
  },
  boldText: {
    fontFamily: 'Helvetica-Bold',
  },

  // --- Signatures ---
  signatureContainer: {
    flexDirection: 'row',
    marginTop: 10,
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

export const SpprDocument = ({ sale, customer, unit, baseUrl }: any) => {
  const tanggalCetak = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  
  // Generate nomor surat: XXXX/KodeLokasi/SPPR/Bulan/Tahun
  const tanggalRef = sale.tanggal_booking ? new Date(sale.tanggal_booking) : new Date();
  const bulan = bulanKeRomawi(tanggalRef.getMonth() + 1);
  const tahun = tanggalRef.getFullYear();
  // Ambil urutan dari no_penjualan (INV/SALES/2026/07/0267) atau generate dari sale id
  let urutan = '0001';
  if (sale.no_penjualan) {
    const parts = sale.no_penjualan.split('/');
    urutan = parts[parts.length - 1] || '0001';
  }
  
  // Kode lokasi
  const kodeLokasi = unit?.location_kode_lokasi || sale?.kode_lokasi || 'BMM';
  
  const noSurat = `${urutan}/${kodeLokasi}/SPPR/${bulan}/${tahun}`;
  const isKPR = sale.metode_bayar === 'KPR';
  const kprAmount = isKPR ? (sale.total_harga - sale.dp_nominal) : 0;

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
          <Text style={styles.title}>SURAT PERNYATAAN PEMBELIAN RUMAH</Text>
          <Text style={styles.subtitle}>{noSurat}</Text>
        </View>

        {/* ISI 1 */}
        <Text style={styles.paragraphBold}>Yang bertanda tangan dibawah ini,</Text>
        
        <View style={styles.table}>
          <View style={styles.row}><Text style={styles.labelCell}>Nama</Text><Text style={styles.colonCell}>:</Text><Text style={styles.valueCellNormal}>{customer?.nama || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.labelCell}>Alamat</Text><Text style={styles.colonCell}>:</Text><Text style={styles.valueCellNormal}>{customer?.domisili || customer?.alamat || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.labelCell}>No. Telp/HP</Text><Text style={styles.colonCell}>:</Text><Text style={styles.valueCellNormal}>{customer?.no_hp || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.labelCell}>Pekerjaan</Text><Text style={styles.colonCell}>:</Text><Text style={styles.valueCellNormal}>{customer?.pekerjaan || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.labelCell}>Instansi</Text><Text style={styles.colonCell}>:</Text><Text style={styles.valueCellNormal}>{customer?.instansi || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.labelCell}>Alamat Kantor</Text><Text style={styles.colonCell}>:</Text><Text style={styles.valueCellNormal}>-</Text></View>
        </View>

        {/* ISI 2 */}
        <Text style={styles.paragraphBold}>
          Dengan ini menyatakan bahwa atas kemauan sendiri telah memesan 1 (satu) unit rumah berikut tanahnya dengan ketentuan sebagai berikut:
        </Text>

        <View style={styles.table}>
          <View style={styles.row}><Text style={styles.labelCell}>Lokasi</Text><Text style={styles.colonCell}>:</Text><Text style={styles.valueCellBold}>{unit?.location_nama || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.labelCell}>Blok/Kavling</Text><Text style={styles.colonCell}>:</Text><Text style={styles.valueCellBold}>{unit?.block_nama || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.labelCell}>Type</Text><Text style={styles.colonCell}>:</Text><Text style={styles.valueCellBold}>{unit?.unit_type_nama || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.labelCell}>Nomor Unit</Text><Text style={styles.colonCell}>:</Text><Text style={styles.valueCellBold}>{unit?.no_unit || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.labelCell}>Luas Tanah</Text><Text style={styles.colonCell}>:</Text><Text style={styles.valueCellBold}>{unit?.luas_tanah || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.labelCell}>Tanah Lebih / Harga</Text><Text style={styles.colonCell}>:</Text><Text style={styles.valueCellBold}></Text></View>
          <View style={styles.row}><Text style={styles.labelCell}>Jumlah Kewajiban / Uang Muka</Text><Text style={styles.colonCell}>:</Text><Text style={styles.valueCellBold}>{formatRupiah(sale?.total_harga || 0)} / {formatRupiah(sale?.dp_nominal || 0)}</Text></View>
        </View>

        <Text style={styles.paragraph}>
          Dengan ini menyatakan menyetujui syarat-syarat dengan ketentuan sebagai berikut:
        </Text>

        <View style={styles.listRow}>
          <Text style={styles.bullet}>1.</Text>
          <Text style={styles.listItemText}>Semua pembayaran sesuai waktu yang telah ditentukan, tanpa adanya pemberitahuan terlebih dahulu oleh <Text style={styles.boldText}>PIHAK PENJUAL.</Text></Text>
        </View>
        
        <View style={styles.listRow}>
          <Text style={styles.bullet}>2.</Text>
          <View style={styles.listItemText}>
            <Text style={{ textAlign: 'justify' }}>Apabila terjadi keterlambatan ataupun kelalaian atas kewajiban tersebut, kami bersedia mengikuti sanksi-sanksi sebagai berikut:</Text>
            
            <View style={styles.subListRow}>
              <Text style={styles.subBullet}>o</Text>
              <Text style={styles.listItemText}>Apabila ada penurunan kpr dari bank yang ditetapkan awal {formatRupiah(kprAmount)}, kekurangannya akad dibebankan ke penambahan uang muka</Text>
            </View>
            <View style={styles.subListRow}>
              <Text style={styles.subBullet}>o</Text>
              <Text style={styles.listItemText}>Dikenakan biaya administrasi keterlambatan sebesar 1.5% setiap hari dihitung dari seluruh kewajiban.</Text>
            </View>
            <View style={styles.subListRow}>
              <Text style={styles.subBullet}>o</Text>
              <Text style={styles.listItemText}>Apabila keterlambatan / kelalaian pembayaran angsuran kepada Developer lebih dari seluruh 30 hari kerja, maka surat bukti pemesanan {unit?.block_nama} No {unit?.no_unit} menjadi batal.</Text>
            </View>
            <View style={styles.subListRow}>
              <Text style={styles.subBullet}>o</Text>
              <Text style={styles.listItemText}>Apabila terjadi perubahan nama atau balik nama / pindah kavling yang telah dipesan maka pembeli dikenakan biaya administrasi sebesar Rp 500.000,- (sebelum akad kredit)</Text>
            </View>
            <View style={styles.subListRow}>
              <Text style={styles.subBullet}>o</Text>
              <Text style={styles.listItemText}>Apabila terjadi pembatalan sepihak ataupun pengunduran diri dari saya sebagai konsumen, maka saya bersedia dikenakan denda administrasi 10% dari uang yang sudah masuk dan Booking Fee hangus. Tetapi apabila terjadi penolakan dari pihak Bank maka uang kembali 100% dan Booking Fee hangus.</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.paragraph, { marginTop: 10 }]}>
          Demikian surat pernyataan ini dibuat, untuk melengkapi persyaratan KPR yang akan kami tandatangani.
        </Text>

        {/* TANDA TANGAN */}
        <View style={styles.signatureContainer}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureDate}> </Text>
            <View style={styles.signatureSpace} />
            <Text>Yang Menyatakan / Pembeli,</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureDate}>Purwakarta, {tanggalCetak}</Text>
            <View style={styles.signatureSpace} />
            <Text>Penjual,</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
