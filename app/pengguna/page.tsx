'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useData } from '@/lib/data-context';
import { UserPlus, ShieldCheck, CheckCircle, XCircle, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import type { Column } from '@/components/ui/DataTable';
import type { UserProfile } from '@/types';

// Role yang bisa dipilih oleh masing-masing level akses
const ALL_ROLES = ['Super Admin', 'Programmer', 'Admin', 'Marketing', 'Finance', 'Gudang', 'Viewer'];
const ADMIN_ROLES = ['Admin', 'Marketing', 'Finance', 'Gudang', 'Viewer']; // Admin tidak bisa assign Super Admin

export default function PenggunaPage() {
  const { users, currentUser, toggleUserActive, updateUser, refresh } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Add user form
  const [form, setForm] = useState({ nama: '', email: '', password: '', role: 'Viewer' });

  const isSuperAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Programmer';
  const isAdmin = currentUser?.role === 'Admin';
  // Baik Super Admin, Programmer maupun Admin bisa mengelola user
  const canManage = isSuperAdmin || isAdmin;

  // Role list berdasarkan role caller
  const availableRoles = isSuperAdmin ? ALL_ROLES : ADMIN_ROLES;

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
      const finalEmail = json.email || form.email;
      setSuccess(`Akun ${form.nama} berhasil dibuat! Email login: ${finalEmail}`);
      setForm({ nama: '', email: '', password: '', role: 'Viewer' });
      await refresh();
      setTimeout(() => setShowAddModal(false), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [editPassword, setEditPassword] = useState('');

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          nama: selectedUser.nama,
          role: selectedUser.role,
          password: editPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memperbarui user');

      setSuccess('Data pengguna & kata sandi berhasil diperbarui.');
      setEditPassword('');
      await refresh();
      setTimeout(() => { setShowEditModal(false); setSelectedUser(null); setSuccess(''); }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (user: UserProfile) => {
    if (!canManage) return;
    if (user.id === currentUser?.id) { alert('Tidak bisa menonaktifkan akun sendiri!'); return; }
    // Admin tidak bisa menonaktifkan Super Admin
    if (isAdmin && user.role === 'Super Admin') { alert('Admin tidak dapat menonaktifkan akun Super Admin.'); return; }
    await toggleUserActive(user.id);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menghapus user');
      setShowDeleteModal(false);
      setSelectedUser(null);
      await refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const roleBadge = (role: string) => {
    if (role === 'Super Admin') return <Badge variant="sky">{role}</Badge>;
    if (role === 'Programmer') return <Badge variant="sky">{role}</Badge>;
    if (role === 'Admin') return <Badge variant="teal">{role}</Badge>;
    if (role === 'Marketing') return <Badge variant="emerald">{role}</Badge>;
    if (role === 'Finance') return <Badge variant="amber">{role}</Badge>;
    if (role === 'Gudang') return <Badge variant="slate">{role}</Badge>;
    return <Badge variant="slate">{role}</Badge>;
  };

  // Tentukan apakah bisa melakukan aksi pada baris tertentu
  const canActOn = (row: UserProfile) => {
    if (row.id === currentUser?.id) return false; // tidak bisa ubah diri sendiri
    if (isAdmin && row.role === 'Super Admin') return false; // Admin tidak bisa ubah Super Admin
    if (isAdmin && row.role === 'Programmer') return false; // Admin tidak bisa ubah Programmer
    return true;
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
        {canManage && (
          <button
            onClick={() => { setShowAddModal(true); setError(''); setSuccess(''); setForm({ nama: '', email: '', password: '', role: 'Viewer' }); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah User</span>
          </button>
        )}
      </div>

      {!canManage && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-md text-sm text-orange-700 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Hanya Super Admin dan Admin yang bisa mengelola pengguna sistem.</span>
        </div>
      )}

      {/* Keterangan hak akses per role */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
        {[
          { role: 'Super Admin', color: 'sky', desc: 'Akses penuh: semua CRUD, termasuk manajemen semua user.' },
          { role: 'Admin', color: 'teal', desc: 'CRUD data operasional & manajemen user (kecuali Super Admin).' },
          { role: 'Marketing', color: 'emerald', desc: 'Baca saja: data penjualan, booking, & prospek.' },
          { role: 'Finance', color: 'amber', desc: 'Baca saja: laporan keuangan & pencairan.' },
          { role: 'Gudang', color: 'slate', desc: 'Baca saja: stok & material gudang.' },
          { role: 'Viewer', color: 'slate', desc: 'Hanya bisa melihat ringkasan dashboard.' },
        ].map(({ role, desc }) => (
          <div key={role} className="flex items-start gap-2 p-3 bg-white border border-slate-200 rounded-lg text-xs">
            {roleBadge(role)}
            <span className="text-slate-500 leading-relaxed">{desc}</span>
          </div>
        ))}
      </div>

      <DataTable
        data={users}
        columns={columns}
        title="Daftar Pengguna"
        searchPlaceholder="Cari nama atau email..."
        exportFileName="Pengguna_Lansena"
        actions={canManage ? (row) => (
          <div className="flex items-center gap-2 justify-end">
            {canActOn(row) && (
              <>
                <button
                  onClick={() => { setSelectedUser({ ...row }); setShowEditModal(true); setError(''); setSuccess(''); }}
                  className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleToggle(row)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors border ${row.is_active ? 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100' : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'}`}
                >
                  {row.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                {canManage && (
                  <button
                    onClick={() => { setSelectedUser(row); setShowDeleteModal(true); setError(''); }}
                    className="p-1.5 text-xs font-medium bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                    title="Hapus User"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}
            {!canActOn(row) && (
              <span className="text-xs text-slate-400 italic">
                {row.id === currentUser?.id ? 'Akun Anda' : 'Tidak bisa diubah'}
              </span>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Role *</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email / ID Login *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Ketik nama atau email lengkap (mis: budi atau budi@gmail.com)"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {form.email && !form.email.includes('@') && (
              <p className="text-[11px] text-blue-600 mt-1">
                ℹ️ Akan disimpan sebagai: <strong>{form.email.toLowerCase().trim()}@lansena.id</strong>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
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
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setError(''); setSuccess(''); }} title="Edit Pengguna">
        {selectedUser && (
          <form onSubmit={handleUpdateUser} className="space-y-4">
            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">{error}</div>}
            {success && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">{success}</div>}

            <p className="text-sm text-slate-500">
              Email login: <strong className="text-slate-700">{selectedUser.email}</strong>
            </p>

            <div>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Role</label>
              <select
                value={selectedUser.role}
                onChange={e => setSelectedUser(s => s ? { ...s, role: e.target.value } : null)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Reset / Ganti Kata Sandi (Opsional)</label>
              <input
                type="text"
                placeholder="Kosongkan jika tidak ingin me-reset password"
                value={editPassword}
                onChange={e => setEditPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Gunakan fitur ini jika pegawai lupa password akun mereka.</p>
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

      {/* Modal Konfirmasi Hapus User */}
      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setError(''); }} title="Hapus Pengguna">
        {selectedUser && (
          <div className="space-y-4">
            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">{error}</div>}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-semibold mb-1">⚠️ Perhatian — Tindakan ini tidak bisa dibatalkan!</p>
              <p className="text-sm text-red-600">
                Akun <strong>{selectedUser.nama}</strong> ({selectedUser.email}) akan dihapus secara permanen dari sistem.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setShowDeleteModal(false); setError(''); }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">
                Batal
              </button>
              <button onClick={handleDeleteConfirm} disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                {loading ? 'Menghapus...' : 'Ya, Hapus Akun'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}