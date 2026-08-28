"use client";

import React from "react";
import { Customer } from "@/types";
import { FullAddress } from "@/components/ui/FullAddress";
import { formatRupiah, formatDateId } from "@/lib/format";
import {
  X,
  User,
  Briefcase,
  MapPin,
  Heart,
  FileText,
  Phone,
  Edit3,
  ExternalLink,
  CreditCard,
  Upload,
} from "lucide-react";

interface Props {
  customer: Customer;
  onClose: () => void;
  onEdit: () => void;
  onUploadDokumen?: () => void;
}

function toWaNumber(rawPhone: string) {
  const digits = rawPhone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("62")) return digits;
  return `62${digits}`;
}

export function DetailKonsumenModal({
  customer,
  onClose,
  onEdit,
  onUploadDokumen,
}: Props) {
  const isMenikah =
    customer.status_pernikahan === "Sudah Menikah" ||
    !!customer.nama_pasangan;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-150 my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              {customer.nama?.charAt(0).toUpperCase() || "K"}
            </div>
            <div>
              <h3 className="font-bold text-base tracking-wide">
                Detail Lengkap Konsumen
              </h3>
              <p className="text-xs text-teal-100 font-medium">
                {customer.nama}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
          {/* Section 1: Identitas Diri */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center gap-2 text-teal-700 font-bold border-b border-slate-200 pb-2 text-xs uppercase tracking-wider">
              <User className="w-4 h-4" />
              <span>Identitas Diri</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
              <div>
                <span className="text-slate-500 text-xs block">Nama Lengkap</span>
                <span className="font-bold text-slate-800">
                  {customer.nama || "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">NIK / No. KTP</span>
                <span className="font-mono font-semibold text-slate-800">
                  {customer.nik || "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">No. WhatsApp / HP</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-bold text-slate-800">
                    {customer.no_hp || "-"}
                  </span>
                  {customer.no_hp && (
                    <a
                      href={`https://wa.me/${toWaNumber(customer.no_hp)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-2 py-0.5 rounded font-semibold transition"
                    >
                      <Phone className="w-3 h-3" /> Chat WA
                    </a>
                  )}
                </div>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Email</span>
                <span className="text-slate-800 font-medium">
                  {customer.email || "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Tempat & Tanggal Lahir</span>
                <span className="text-slate-800 font-medium">
                  {customer.tempat_lahir || "-"}{" "}
                  {customer.tanggal_lahir
                    ? `· ${formatDateId(customer.tanggal_lahir)}`
                    : ""}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">NPWP</span>
                <span className="font-mono text-slate-800 font-medium">
                  {customer.npwp || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Pekerjaan & Keuangan */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center gap-2 text-teal-700 font-bold border-b border-slate-200 pb-2 text-xs uppercase tracking-wider">
              <Briefcase className="w-4 h-4" />
              <span>Pekerjaan & Keuangan</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
              <div>
                <span className="text-slate-500 text-xs block">Nama Instansi / Perusahaan</span>
                <span className="font-bold text-slate-900 text-sm">
                  {customer.instansi || "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Pekerjaan / Jabatan</span>
                <span className="font-semibold text-slate-800">
                  {customer.pekerjaan || "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Pendapatan per Bulan</span>
                <span className="font-bold text-emerald-700">
                  {customer.pendapatan_per_bulan
                    ? `Rp ${formatRupiah(customer.pendapatan_per_bulan)}`
                    : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Alamat KTP & Domisili */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center gap-2 text-teal-700 font-bold border-b border-slate-200 pb-2 text-xs uppercase tracking-wider">
              <MapPin className="w-4 h-4" />
              <span>Alamat KTP & Domisili</span>
            </div>
            <div className="space-y-2.5">
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">Alamat KTP Lengkap</span>
                <div className="font-medium text-slate-800 leading-relaxed bg-white border border-slate-200 rounded-md p-2.5">
                  <FullAddress
                    kelurahanId={customer.kelurahan_id}
                    kampungDusun={customer.kampung_dusun}
                    rt={customer.rt}
                    rw={customer.rw}
                    fallback={customer.alamat_ktp || customer.alamat || "-"}
                  />
                </div>
              </div>
              {customer.alamat_domisili && (
                <div>
                  <span className="text-slate-500 text-xs block mb-0.5">Alamat Domisili</span>
                  <div className="font-medium text-slate-800 leading-relaxed bg-white border border-slate-200 rounded-md p-2.5">
                    {customer.alamat_domisili}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Status Pernikahan & Biodata Pasangan */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center gap-2 text-teal-700 font-bold border-b border-slate-200 pb-2 text-xs uppercase tracking-wider">
              <Heart className="w-4 h-4" />
              <span>Status Pernikahan & Biodata Pasangan</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
              <div>
                <span className="text-slate-500 text-xs block">Status Pernikahan</span>
                <span className="font-bold text-slate-800">
                  {customer.status_pernikahan || "Belum Menikah"}
                </span>
              </div>
              {isMenikah && (
                <>
                  <div>
                    <span className="text-slate-500 text-xs block">Nama Pasangan</span>
                    <span className="font-bold text-slate-800">
                      {customer.nama_pasangan || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block">NIK Pasangan</span>
                    <span className="font-mono text-slate-800 font-medium">
                      {customer.nik_pasangan || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block">Tempat & Tgl Lahir Pasangan</span>
                    <span className="text-slate-800 font-medium">
                      {customer.tempat_lahir_pasangan || "-"}{" "}
                      {customer.tanggal_lahir_pasangan
                        ? `· ${formatDateId(customer.tanggal_lahir_pasangan)}`
                        : ""}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block">Pekerjaan Pasangan</span>
                    <span className="text-slate-800 font-medium">
                      {customer.pekerjaan_pasangan || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block">No. HP Pasangan</span>
                    <span className="text-slate-800 font-medium">
                      {customer.no_hp_pasangan || "-"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 5: Rekening KPR & Berkas */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2 text-teal-700 font-bold text-xs uppercase tracking-wider">
                <CreditCard className="w-4 h-4" />
                <span>Rekening KPR & Berkas Dokumen</span>
              </div>
              {onUploadDokumen && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onUploadDokumen();
                  }}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Berkas
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
              <div>
                <span className="text-slate-500 text-xs block">Bank Rekening KPR</span>
                <span className="font-bold text-slate-800">
                  {customer.bank_rekening_kpr || "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Nomor Rekening KPR</span>
                <span className="font-mono font-semibold text-slate-800">
                  {customer.nomor_rekening_kpr || "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Scan KTP</span>
                {customer.scan_ktp_url ? (
                  <a
                    href={customer.scan_ktp_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold mt-0.5"
                  >
                    <FileText className="w-3.5 h-3.5" /> Lihat Berkas KTP <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-slate-400">Belum diupload</span>
                )}
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Scan KK</span>
                {customer.scan_kk_url ? (
                  <a
                    href={customer.scan_kk_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold mt-0.5"
                  >
                    <FileText className="w-3.5 h-3.5" /> Lihat Berkas KK <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-slate-400">Belum diupload</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onEdit();
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-bold transition shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Data Konsumen
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
