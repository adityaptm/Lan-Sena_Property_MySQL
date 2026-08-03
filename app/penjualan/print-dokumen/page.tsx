import PrintDokumenClient from './PrintDokumenClient';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    id?: string;
    type?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <PrintDokumenClient
      id={params.id}
      type={params.type}
    />
  );
}