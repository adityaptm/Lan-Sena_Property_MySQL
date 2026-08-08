'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardProgress } from '@/components/dashboard/DashboardProgress';

export default function DashboardProgressPage() {
  return (
    <AppLayout>
      <DashboardProgress />
    </AppLayout>
  );
}
