'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useData } from '@/lib/data-context';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const { currentUser, loading: authLoading, refresh } = useData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && currentUser) {
      router.replace('/');
    }
  }, [currentUser, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Email dan kata sandi harus diisi');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      let data: any = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch {}
      }
      
      if (!res.ok) {
        setErrorMsg(data?.error || 'Email atau kata sandi salah. Silakan periksa kembali.');
      } else {
        window.location.replace('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-[#F5F6F8] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 flex flex-col justify-center items-center p-4 relative transition-colors duration-200">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-[#151C2C] border border-slate-200 dark:border-[#243048] rounded-xl p-8 shadow-sm">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl mb-4 overflow-hidden p-1 bg-white border border-slate-100 shadow-sm">
            <img src="/logo.jpg" alt="PT. LAN SENA JAYA" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
            PT. LAN SENA JAYA
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sistem ERP Penjualan & Operasional
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm text-center">
            {errorMsg}
          </div>
        )}

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-[#243048]" />
          </div>
          <span className="relative px-3 bg-white dark:bg-[#151C2C] text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Login
          </span>
        </div>

        {/* Email Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Email Address / ID Login
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Masukkan ID"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#172033] border border-slate-300 dark:border-[#2D3B55] rounded-md text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 bg-white dark:bg-[#172033] border border-slate-300 dark:border-[#2D3B55] rounded-md text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
            >
              <span>{loading ? 'Memproses...' : 'Login'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <p className="text-xs text-slate-500 text-center mt-6">
          Belum punya akun? Hubungi Super Admin untuk mendapatkan akses.
        </p>
      </div>

      <p className="text-sm text-slate-500 mt-8 text-center">
        © 2026 Lansena Property System. All rights reserved.
      </p>
    </div>
  );
}
