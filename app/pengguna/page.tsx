'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useData } from '@/lib/data-context';
import { UserPlus, ShieldCheck, CheckCircle, XCircle, Edit2 } from 'lucide-react';
import type { Column } from '@/components/ui/DataTable';
import type { UserProfile } from '@/types';

const ROLES = ['Super Admin', 'Admin', 'Marketing', 'Finance', 'Gudang', 'Viewer'];

export default function PenggunaPage() {
  const { users, currentUser, toggleUserActive, updateUser, refresh } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add user form
  const [form, setForm] = useState({ nama: '', email: '', password: '', role: 'Viewer' });

  const isSuperAdmin = currentUser?.role === 'Super Admin';

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal membuat user');
      setSuccess(`User ${form.nama} berhasil dibuat!`);
      setForm({ nama: '', email: '', password: '', role: 'Viewer' });
      await refresh();
      setTimeout(() => setShowAddModal(false), 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);
    setError('');
    try {
      await updateUser(selectedUser.id, { nama: selectedUser.nama, role: selectedUser.role });
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (user: UserProfile) => {
    if (!isSuperAdmin) return;
    if (user.id === currentUser?.id) { alert('Tidak bisa menonaktifkan akun sendiri!'); return; }
    await toggleUserActive(user.id);
  };

  const roleBadge = (role: string) => {
    if (role === 'Super Admin') return <Badge variant="sky">{role}</Badge>;
    if (role === 'Admin') return <Badge variant="teal">{role}</Badge>;
    if (role === 'Marketing') return <Badge variant="emerald">{role}</Badge>;
    if (role === 'Finance') return <Badge variant="amber">{role}</Badge>;
    if (role === 'Gudang') return <Badge variant="slate">{role}</Badge>;
    return <Badge variant="slate">{role}</Badge>;
  };

  const columns: Column<UserProfile>[] = [
    { header: 'Nama', accessorKey: 'nama', sortable: true },
    { header: 'Email', accessorKey: 'email', sortable: true },
    { header: 'Role', accessorKey: (row) => roleBadge(row.role) },
    {
      header: 'Status', accessorKey: (row) => (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md ${row.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
          {row.is_active ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          {row.is_active ? 'Aktif' : 'Nonaktif'}
        </span>
      )
    },
  ];

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Manajemen Pengguna</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kelola akun dan hak akses pengguna sistem</p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => { setShowAddModal(true); setError(''); setSuccess(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah User</span>
          </button>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-md text-sm text-orange-700 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Hanya Super Admin yang bisa mengelola pengguna sistem.</span>
        </div>
      )}

      <DataTable
        data={users}
        columns={columns}
        title="Daftar Pengguna"
        searchPlaceholder="Cari nama atau email..."
        exportFileName="Pengguna_Lansena"
        actions={isSuperAdmin ? (row) => (
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => { setSelectedUser({ ...row }); setShowEditModal(true); setError(''); }}
              className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md transition-colors flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
            {row.id !== currentUser?.id && (
              <button
                onClick={() => handleToggle(row)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors border ${row.is_active ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'}`}
              >
                {row.is_active ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
            )}
          </div>
        ) : undefined}
      />

      {/* Modal Tambah User */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Tambah Pengguna Baru">
        <form onSubmit={handleAddUser} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">{error}</div>}
          {success && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">{success}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Lengkap *</label>
              <input type="text" required value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email *</label>
              <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password *</label>
              <input type="password" required minLength={6} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Role *</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              {loading ? 'Membuat...' : 'Buat Akun'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit User */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Pengguna">
        {selectedUser && (
          <form onSubmit={handleUpdateUser} className="space-y-4">
            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">{error}</div>}
            
            <div>
              <p className="text-sm text-slate-600 mb-3">
                Mengubah profil untuk: <strong>{selectedUser.email}</strong>
              </p>
              
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={selectedUser.nama}
                  onChange={e => setSelectedUser(s => s ? { ...s, nama: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Role Baru</label>
                <select
                  value={selectedUser.role}
                  onChange={e => setSelectedUser(s => s ? { ...s, role: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">
                Batal
              </button>
              <button type="submit" disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50">
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </AppLayout>
  );
}
