import PrintKprClient from './PrintKprClient';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    id?: string;
    lampiran5?: string;
    pejabat?: string;
    jabatan_pejabat?: string;
    cabang_pks?: string;
    no_pks?: string;
    tgl_pks?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <PrintKprClient
      id={params.id}
      lampiran5={params.lampiran5}
      pejabat={params.pejabat}
      jabatan_pejabat={params.jabatan_pejabat}
      cabang_pks={params.cabang_pks}
      no_pks={params.no_pks}
      tgl_pks={params.tgl_pks}
    />
  );
}