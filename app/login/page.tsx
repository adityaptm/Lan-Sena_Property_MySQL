'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent, isSignUp: boolean) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Email dan kata sandi harus diisi');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
          setErrorMsg(signUpError.message === 'Email signups are disabled'
            ? 'Pendaftaran dinonaktifkan. Buka Supabase → Auth → Configuration → aktifkan "Allow new users to sign up".'
            : signUpError.message);
        } else {
          // Auto-login setelah daftar (bypass email confirmation)
          const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
          if (loginErr) {
            setSuccessMsg('Akun dibuat! Sekarang silakan tekan Login.');
          } else {
            window.location.href = '/';
          }
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setErrorMsg(error.message === 'Email not confirmed'
            ? 'Email belum dikonfirmasi. Buka Supabase → Auth → Email → matikan "Confirm email".'
            : error.message === 'Invalid login credentials'
            ? 'Email atau password salah.'
            : error.message);
        } else {
          window.location.href = '/';
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#F5F6F8] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded mb-4 overflow-hidden p-1 bg-white border border-slate-100 shadow-sm">
            <img src="/logo.jpg" alt="PT. LAN SENA JAYA" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            PT. LAN SENA JAYA
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sistem ERP Penjualan & Operasional
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm text-center">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm text-center">
            {successMsg}
          </div>
        )}

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative px-3 bg-white text-slate-500 text-xs font-semibold uppercase tracking-wider">
            Login
          </span>
        </div>

        {/* Email Fallback Form */}
          <form className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="admin@lansenaproperty.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
              type="button"
              onClick={(e) => handleAuth(e, false)}
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
