'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'super_admin' | 'admin' | 'marketing' | 'finance' | 'gudang' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  users: User[];
  addUser: (userData: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, userData: Partial<User>) => void;
  deleteUser: (id: string) => void;
  canAccess: (resource: string, action: 'create' | 'read' | 'update' | 'delete') => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Default users untuk testing
const defaultUsers: User[] = [
  {
    id: 'user-1',
    name: 'Super Admin',
    email: 'superadmin@lansena.com',
    role: 'super_admin',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-2', 
    name: 'Admin User',
    email: 'admin@lansena.com',
    role: 'admin',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-3',
    name: 'Marketing User',
    email: 'marketing@lansena.com', 
    role: 'marketing',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-4',
    name: 'Finance User',
    email: 'finance@lansena.com',
    role: 'finance', 
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-5',
    name: 'Gudang User',
    email: 'gudang@lansena.com',
    role: 'gudang',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-6',
    name: 'Viewer User', 
    email: 'viewer@lansena.com',
    role: 'viewer',
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(defaultUsers);

  useEffect(() => {
    // Auto login sebagai Super Admin untuk development
    const superAdmin = defaultUsers.find(u => u.role === 'super_admin');
    if (superAdmin) {
      setUser(superAdmin);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulasi login - dalam production gunakan API authentication
    const foundUser = users.find(u => u.email === email && u.active);
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...userData } : u));
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // RBAC Permission System
  const canAccess = (resource: string, action: 'create' | 'read' | 'update' | 'delete'): boolean => {
    if (!user) return false;

    const permissions: Record<UserRole, Record<string, string[]>> = {
      super_admin: {
        // Super Admin memiliki akses penuh ke semua resource
        users: ['create', 'read', 'update', 'delete'],
        gudang_stok: ['create', 'read', 'update', 'delete'],
        gudang_masuk: ['create', 'read', 'update', 'delete'], 
        gudang_keluar: ['create', 'read', 'update', 'delete'],
        purchase: ['create', 'read', 'update', 'delete'],
        penjualan: ['create', 'read', 'update', 'delete'],
        marketing: ['create', 'read', 'update', 'delete'],
        keuangan: ['create', 'read', 'update', 'delete'],
        kontak: ['create', 'read', 'update', 'delete'],
        laporan: ['create', 'read', 'update', 'delete'],
        pengaturan: ['create', 'read', 'update', 'delete'],
      },
      admin: {
        // Admin bisa CRUD operasional & manage user kecuali Super Admin
        users: ['create', 'read', 'update', 'delete'],
        gudang_stok: ['create', 'read', 'update', 'delete'],
        gudang_masuk: ['create', 'read', 'update', 'delete'],
        gudang_keluar: ['create', 'read', 'update', 'delete'],
        purchase: ['create', 'read', 'update', 'delete'],
        penjualan: ['create', 'read', 'update', 'delete'],
        marketing: ['create', 'read', 'update', 'delete'],
        keuangan: ['create', 'read', 'update', 'delete'],
        kontak: ['create', 'read', 'update', 'delete'],
        laporan: ['create', 'read', 'update', 'delete'],
        pengaturan: ['read', 'update'],
      },
      marketing: {
        // Marketing hanya baca data penjualan, booking & prospek
        penjualan: ['read'],
        marketing: ['read'],
        kontak: ['read'],
        laporan: ['read'],
      },
      finance: {
        // Finance hanya baca laporan keuangan & pencairan
        keuangan: ['read'],
        laporan: ['read'],
      },
      gudang: {
        // Gudang hanya baca stok & material gudang
        gudang_stok: ['read'],
        gudang_masuk: ['read'],
        gudang_keluar: ['read'],
        purchase: ['read'],
      },
      viewer: {
        // Viewer hanya bisa lihat ringkasan dashboard
        dashboard: ['read'],
      },
    };

    const userPermissions = permissions[user.role];
    const resourcePermissions = userPermissions?.[resource];
    
    return resourcePermissions?.includes(action) || false;
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    users,
    addUser,
    updateUser,
    deleteUser,
    canAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}