import { Suspense } from 'react';
import CashflowClient from './CashflowClient';

export default function CashflowPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CashflowClient />
    </Suspense>
  );
}
