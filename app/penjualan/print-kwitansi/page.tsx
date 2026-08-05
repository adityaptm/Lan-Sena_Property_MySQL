import { Suspense } from 'react';
import PrintKwitansiClient from './PrintKwitansiClient';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Memuat...</p>
        </div>
      }
    >
      <PrintKwitansiClient />
    </Suspense>
  );
}
