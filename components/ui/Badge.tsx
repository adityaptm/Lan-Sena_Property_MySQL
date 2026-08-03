'use client';

import React from 'react';

interface BadgeProps {
  variant?: 'emerald' | 'teal' | 'amber' | 'rose' | 'sky' | 'indigo' | 'purple' | 'slate';
  children: React.ReactNode;
}

export function Badge({ variant = 'teal', children }: BadgeProps) {
  const variantStyles = {
    emerald: 'bg-green-50 text-green-700 border-green-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    amber: 'bg-orange-50 text-orange-700 border-orange-200',
    rose: 'bg-red-50 text-red-700 border-red-200',
    sky: 'bg-sky-50 text-sky-700 border-sky-200',
    indigo: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
  }[variant];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variantStyles} tracking-wide`}
    >
      {children}
    </span>
  );
}
