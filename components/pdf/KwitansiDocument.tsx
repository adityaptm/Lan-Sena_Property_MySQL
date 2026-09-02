import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";
import { formatRupiah, terbilang } from "@/lib/format";
import { LOGO_BASE64 } from "@/lib/logo-base64";

Font.register({
  family: "Arial Narrow",
  fonts: [
    { src: "/fonts/ArchivoNarrow-Regular.ttf" },
    { src: "/fonts/ArchivoNarrow-Bold.ttf", fontWeight: "bold" },
  ],
});

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "/fonts/ArchivoNarrow-Regular.ttf" },
    { src: "/fonts/ArchivoNarrow-Bold.ttf", fontWeight: "bold" },
  ],
});

Font.register({
  family: "Helvetica-Bold",
  src: "/fonts/ArchivoNarrow-Bold.ttf",
});

const KWITANSI_WIDTH = 680.315;
const KWITANSI_HEIGHT = 396.85;

const styles = StyleSheet.create({
  page: {
    paddingTop: 15,
    paddingLeft: 15,
    paddingRight: 35, // Disesuaikan agar area cetak di kanan lebih lega
    fontSize: 9,
    fontFamily: "Arial Narrow",
    lineHeight: 1.15,
  },
  // --- KOP SURAT ---
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 0.5,
    marginLeft: 0,
  },
  logoContainer: {
    width: 75,
    height: 75,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 75,
    height: 75,
    objectFit: "contain",
  },
  headerTextContainer: {
    alignItems: "flex-start",
  },
  companyName: {
    fontSize: 13.5,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  companyAddress: {
    fontSize: 7.5,
    textAlign: "left",
    color: "#333",
    lineHeight: 1.25,
  },
  headerLine: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#2563eb",
    marginTop: 0.2,
    marginBottom: 4,
  },

  // --- JUDUL ---
  titleContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  titleText: {
    fontSize: 10.5,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    color: "#000",
  },

  // --- DATA FIELDS ---
  fieldsContainer: {
    marginBottom: 2,
    paddingLeft: 5,
  },
  fieldRow: {
    flexDirection: "row",
    marginBottom: 2,
    alignItems: "flex-start",
  },
  labelCol: {
    width: 120,
    color: "#222",
  },
  colon: {
    width: 12,
    color: "#222",
    fontFamily: "Helvetica-Bold",
  },
  valueCol: {
    flex: 1,
    color: "#000",
  },
  valueBold: {
    fontFamily: "Helvetica-Bold",
  },
  sectionTitleRow: {
    marginTop: 3,
    marginBottom: 2,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: "#000",
  },

  // --- TTD SECTION ---
  ttdContainer: {
    marginTop: 8,
    paddingHorizontal: 0,
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
  },
  signatureBlockLeft: {
    alignItems: "center",
    width: 220,
  },
  signatureBlockRightContainer: {
    alignItems: "center",
    width: 220,
  },
  tanggalText: {
    fontSize: 10,
    textAlign: "center",
    width: "100%",
    color: "#000",
    marginBottom: 4,
  },
  signatureTitle: {
    fontSize: 10,
    marginBottom: 36,
    color: "#000",
    textAlign: "center",
    width: "100%",
  },
  signatureTitleLeft: {
    fontSize: 10,
    marginBottom: 36,
    color: "#000",
    textAlign: "center",
    width: "100%",
  },
  signatureName: {
    fontSize: 10,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    color: "#000",
    width: "100%",
  },
  signatureNameLeft: {
    fontSize: 10,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    color: "#000",
    width: "100%",
  },
});

interface KwitansiProps {
  payment?: any;
  sale?: any;
  unit?: any;
  customer?: any;
  petugasNama?: string;
  baseUrl?: string;
  logoSrc?: string;
}

function formatTanggalLong(dateStr?: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  return `${days[d.getDay()]}, ${d.getDate().toString().padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatKotaTanggal(dateStr?: string): string {
  if (!dateStr) return "Purwakarta";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Purwakarta";
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  return `Purwakarta, ${d.getDate().toString().padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function KwitansiDocument({
  payment,
  unit,
  customer,
  petugasNama = "FAHRUL ROZI",
  logoSrc,
}: KwitansiProps) {
  const resolvedLogo = logoSrc || LOGO_BASE64;

  const noKwitansi = payment?.no_kwitansi || "-";
  const nominal = Number(payment?.nominal) || 0;
  const deskripsi = payment?.deskripsi || "-";
  const tanggal = payment?.tanggal || "";

  const namaKonsumen = (
    customer?.nama ||
    customer?.name ||
    payment?.diterima_dari ||
    ""
  ).toUpperCase();
  const namaPenyetor = (
    payment?.diterima_dari ||
    customer?.nama ||
    customer?.name ||
    ""
  ).toUpperCase();
  const namaPetugas = (petugasNama || "FAHRUL ROZI").toUpperCase();

  const unitText = unit?.no_unit
    ? `${unit.no_unit} ${unit.unit_type_nama ? `(${unit.unit_type_nama})` : ""}`
    : "-";

  const lokasiText = [
    unit?.location_nama || "Benteng Mutiara Mas",
    unit?.block_nama ? `BLOK ${unit.block_nama}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Document>
      <Page size={[KWITANSI_WIDTH, KWITANSI_HEIGHT]} style={styles.page}>
        {/* KOP SURAT */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image src={resolvedLogo} style={styles.logo} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.companyName}>PT LAN SENA JAYA</Text>
            <Text style={styles.companyAddress}>
              Perum Benteng Mutiara Mas Ruko No. 16 Babakan Situ 004/002
            </Text>
            <Text style={styles.companyAddress}>
              Desa Benteng Kec. Cempaka Kab. Purwakarta (0264) - 8308450 Jawa
              Barat 41181
            </Text>
          </View>
        </View>
        <View style={styles.headerLine} />

        {/* JUDUL */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>KWITANSI PEMBAYARAN UNIT</Text>
        </View>

        {/* LIST FIELD */}
        <View style={styles.fieldsContainer}>
          <View style={styles.fieldRow}>
            <Text style={styles.labelCol}>No Kwitansi</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={[styles.valueCol, styles.valueBold]}>
              {noKwitansi}
            </Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.labelCol}>Tgl Pembayaran</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={[styles.valueCol, styles.valueBold]}>
              {formatTanggalLong(tanggal)}
            </Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.labelCol}>Telah Diterima Dari</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={[styles.valueCol, styles.valueBold]}>
              {namaPenyetor}
            </Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.labelCol}>Sebesar</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={[styles.valueCol, styles.valueBold]}>
              Rp {formatRupiah(nominal)}
            </Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.labelCol}>Terbilang</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={[styles.valueCol, styles.valueBold]}>
              {terbilang(nominal)}
            </Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.labelCol}>Keterangan</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={[styles.valueCol, styles.valueBold]}>
              {deskripsi.toUpperCase()}
            </Text>
          </View>

          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Untuk</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.labelCol}>Unit</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={[styles.valueCol, styles.valueBold]}>{unitText}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.labelCol}>Lokasi</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={[styles.valueCol, styles.valueBold]}>
              {lokasiText}
            </Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.labelCol}>Konsumen</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={[styles.valueCol, styles.valueBold]}>
              {namaKonsumen}
            </Text>
          </View>
        </View>

        {/* TTD SECTION */}
        <View style={styles.ttdContainer}>
          <View style={styles.signatureRow}>
            {/* KIRI: PENYETOR */}
            <View style={styles.signatureBlockLeft}>
              <View style={{ height: 14 }} />
              <Text style={styles.signatureTitleLeft}>Penyetor,</Text>
              <Text style={styles.signatureNameLeft}>({namaPenyetor})</Text>
            </View>

            {/* KANAN: TANGGAL & PETUGAS */}
            <View style={styles.signatureBlockRightContainer}>
              <Text style={styles.tanggalText}>
                {formatKotaTanggal(tanggal)}
              </Text>
              <Text style={styles.signatureTitle}>Petugas,</Text>
              <Text style={styles.signatureName}>({namaPetugas})</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
