// app/api/penjualan/detail/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "ID Penjualan diperlukan" },
      { status: 400 },
    );
  }

  try {
    const [additionalCosts, payments, kprSubmissions, discounts, stepHistory] =
      await Promise.all([
        query("SELECT * FROM sale_additional_costs WHERE sale_id = ?", [id]),
        query(
          "SELECT * FROM sale_payments WHERE sale_id = ? ORDER BY tanggal DESC",
          [id],
        ),
        query(
          "SELECT * FROM sale_kpr_submissions WHERE sale_id = ? ORDER BY tanggal DESC",
          [id],
        ),
        query("SELECT * FROM sale_discounts WHERE sale_id = ?", [id]),
        query(
          `SELECT h.*, u.nama AS changed_by_nama 
         FROM sale_step_histories h 
         LEFT JOIN users u ON h.changed_by = u.id 
         WHERE h.sale_id = ? 
         ORDER BY h.created_at DESC`,
          [id],
        ),
      ]);

    return NextResponse.json({
      additionalCosts,
      payments,
      kprSubmissions,
      discounts,
      stepHistory,
    });
  } catch (error: any) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan pada server database" },
      { status: 500 },
    );
  }
}
