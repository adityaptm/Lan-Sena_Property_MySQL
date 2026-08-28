'use client';

import React, { useState } from 'react';
import { Customer } from '@/types';
import { Upload, X, CheckCircle2, FileText, Trash2, ExternalLink, AlertCircle } from 'lucide-react';

interface Props {
  customer: Customer;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadDokumenKonsumenModal({ customer, onClose, onSuccess }: Props) {
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [kkFile, setKkFile] = useState<File | null>(null);
  const [currentKtpUrl, setCurrentKtpUrl] = useState<string | null>(customer.scan_ktp_url || null);
  const [currentKkUrl, setCurrentKkUrl] = useState<string | null>(customer.scan_kk_url || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadSingleFile = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: fd,
    });
    const json = await res.json();
    if (!res.ok || !json.url) {
      throw new Error(json.error || 'Gagal mengupload file.');
    }
    return json.url;
  };

  const handleSave = async () => {
    setUploading(true);
    setError(null);
    try {
      let newKtpUrl = currentKtpUrl;
      let newKkUrl = currentKkUrl;

      if (ktpFile) {
        newKtpUrl = await uploadSingleFile(ktpFile);
      }
      if (kkFile) {
        newKkUrl = await uploadSingleFile(kkFile);
      }

      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          table: 'customers',
          filters: [{ type: 'eq', column: 'id', value: customer.id }],
          data: {
            scan_ktp_url: newKtpUrl,
            scan_kk_url: newKkUrl,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal menyimpan data ke database.');
      }

      alert('Dokumen KTP & KK berhasil disimpan!');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan saat mengunggah dokumen.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="bg-teal-600 px-5 py-4 flex items-center justify-between text-white">
          <div>
            <h3 className="font-bold text-base">Upload Dokumen KTP & KK</h3>
            <p className="text-xs text-teal-100 mt-0.5">
              Konsumen: <span className="font-semibold text-white">{customer.nama}</span> (NIK: {customer.nik || '-'})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-teal-100 hover:text-white hover:bg-teal-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload KTP */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Dokumen Scan KTP</span>
              </label>
              {currentKtpUrl && !ktpFile && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Tersedia
                </span>
              )}
            </div>

            {currentKtpUrl && !ktpFile ? (
              <div className="bg-white border border-slate-200 rounded-md p-3 flex items-center justify-between gap-3 text-xs">
                <a
                  href={currentKtpUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 font-semibold text-blue-600 hover:underline truncate"
                >
                  <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="truncate">Lihat File KTP Saat Ini</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
                <button
                  type="button"
                  onClick={() => setCurrentKtpUrl(null)}
                  className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded text-xs font-semibold shrink-0 flex items-center gap-1"
                  title="Ganti atau hapus KTP"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Ganti
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-teal-500 bg-white rounded-lg p-4 cursor-pointer transition">
                  <Upload className="w-6 h-6 text-slate-400 mb-1.5" />
                  <span className="text-xs font-semibold text-slate-700">
                    {ktpFile ? ktpFile.name : 'Pilih file scan KTP (JPG, PNG, PDF)'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {ktpFile ? `${(ktpFile.size / 1024).toFixed(1)} KB` : 'Klik untuk memilih file'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setKtpFile(e.target.files[0]);
                    }}
                    className="hidden"
                  />
                </label>
                {ktpFile && (
                  <button
                    type="button"
                    onClick={() => setKtpFile(null)}
                    className="text-xs text-red-500 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    <X className="w-3 h-3" /> Batalkan pilihan file KTP
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Upload KK */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Dokumen Scan KK (Kartu Keluarga)</span>
              </label>
              {currentKkUrl && !kkFile && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Tersedia
                </span>
              )}
            </div>

            {currentKkUrl && !kkFile ? (
              <div className="bg-white border border-slate-200 rounded-md p-3 flex items-center justify-between gap-3 text-xs">
                <a
                  href={currentKkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 font-semibold text-blue-600 hover:underline truncate"
                >
                  <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="truncate">Lihat File KK Saat Ini</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
                <button
                  type="button"
                  onClick={() => setCurrentKkUrl(null)}
                  className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded text-xs font-semibold shrink-0 flex items-center gap-1"
                  title="Ganti atau hapus KK"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Ganti
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-teal-500 bg-white rounded-lg p-4 cursor-pointer transition">
                  <Upload className="w-6 h-6 text-slate-400 mb-1.5" />
                  <span className="text-xs font-semibold text-slate-700">
                    {kkFile ? kkFile.name : 'Pilih file scan KK (JPG, PNG, PDF)'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {kkFile ? `${(kkFile.size / 1024).toFixed(1)} KB` : 'Klik untuk memilih file'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setKkFile(e.target.files[0]);
                    }}
                    className="hidden"
                  />
                </label>
                {kkFile && (
                  <button
                    type="button"
                    onClick={() => setKkFile(null)}
                    className="text-xs text-red-500 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    <X className="w-3 h-3" /> Batalkan pilihan file KK
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={uploading}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            {uploading ? (
              <span>Mengunggah...</span>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Simpan Berkas Dokumen</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
