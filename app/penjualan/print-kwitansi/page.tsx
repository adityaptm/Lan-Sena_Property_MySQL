import PrintKwitansiClient from './PrintKwitansiClient';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    payment_id?: string;
    sale_id?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <PrintKwitansiClient
      paymentId={params.payment_id}
      saleId={params.sale_id}
    />
  );
}
