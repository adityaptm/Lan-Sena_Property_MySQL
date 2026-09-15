'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 w-9 h-9 ${className}`} />
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
        isDark
          ? 'text-amber-400 hover:text-amber-300 hover:bg-slate-800 bg-slate-800/80 border border-slate-700 shadow-xs'
          : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100 bg-white border border-slate-200 shadow-2xs'
      } ${className}`}
      title={isDark ? 'Mode Gelap aktif. Klik untuk Mode Terang' : 'Mode Terang aktif. Klik untuk Mode Gelap'}
      aria-label="Ganti Tema"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-600" />
      )}
      {showLabel && (
        <span className="text-xs font-semibold">
          {isDark ? 'Mode Terang' : 'Mode Gelap'}
        </span>
      )}
    </button>
  );
}
