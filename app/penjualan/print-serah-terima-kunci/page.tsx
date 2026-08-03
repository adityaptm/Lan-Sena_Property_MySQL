import PrintSerahTerimaKunciClient from './PrintSerahTerimaKunciClient';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    id?: string;
    tanggal?: string;
    penyerah?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <PrintSerahTerimaKunciClient
      id={params.id}
      tanggal={params.tanggal}
      penyerah={params.penyerah}
    />
  );
}