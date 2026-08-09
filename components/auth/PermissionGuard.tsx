'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { Lock, AlertTriangle } from 'lucide-react';

interface PermissionGuardProps {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showError?: boolean;
}

export function PermissionGuard({ 
  resource, 
  action, 
  children, 
  fallback = null, 
  showError = false 
}: PermissionGuardProps) {
  const { canAccess } = useAuth();

  if (!canAccess(resource, action)) {
    if (showError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Akses Terbatas</h3>
          <p className="text-sm text-slate-600 text-center max-w-md">
            Anda tidak memiliki izin untuk melakukan tindakan "{action}" pada "{resource}". 
            Hubungi administrator jika perlu akses.
          </p>
        </div>
      );
    }
    return fallback;
  }

  return <>{children}</>;
}

export function RoleInfo() {
  const { user } = useAuth();
  
  const roleLabels = {
    super_admin: 'Super Admin',
    admin: 'Administrator', 
    marketing: 'Marketing',
    finance: 'Finance',
    gudang: 'Gudang',
    viewer: 'Viewer'
  };

  const roleColors = {
    super_admin: 'bg-gradient-to-r from-purple-600 to-indigo-600',
    admin: 'bg-gradient-to-r from-blue-600 to-blue-700',
    marketing: 'bg-gradient-to-r from-green-600 to-emerald-600', 
    finance: 'bg-gradient-to-r from-yellow-600 to-orange-600',
    gudang: 'bg-gradient-to-r from-teal-600 to-cyan-600',
    viewer: 'bg-gradient-to-r from-slate-600 to-slate-700'
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm">
      <div className={`px-2 py-1 rounded-full ${roleColors[user.role]}`}>
        {roleLabels[user.role]}
      </div>
      <span className="text-slate-600">{user.name}</span>
    </div>
  );
}