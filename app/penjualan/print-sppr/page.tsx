import PrintSpprClient from './PrintSpprClient';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    id?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <PrintSpprClient
      id={params.id}
    />
  );
}