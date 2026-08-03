import PrintKomplenClient from './PrintKomplenClient';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    id?: string;
    tanggal?: string;
    penerima?: string;
    isi?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <PrintKomplenClient
      id={params.id}
      tanggal={params.tanggal}
      penerima={params.penerima}
      isi={params.isi}
    />
  );
}