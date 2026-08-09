import crypto from "crypto";
import { query } from "@/lib/db";

/** Tabel yang tidak perlu masuk trash (child rows / trash itu sendiri). */
export const TRASH_EXCLUDED_TABLES = new Set([
  "trash",
  "purchase_items",
  "goods_in_items",
  "goods_out_items",
  "unit_price_items",
]);

/** Saat hapus parent, snapshot child rows ikut disimpan untuk restore. */
export const TRASH_CHILD_TABLES: Record<
  string,
  { table: string; fk: string }[]
> = {
  purchases: [{ table: "purchase_items", fk: "purchase_id" }],
  goods_in: [{ table: "goods_in_items", fk: "goods_in_id" }],
  goods_out: [{ table: "goods_out_items", fk: "goods_out_id" }],
};

const LABEL_FIELDS = [
  "nama",
  "nama_barang",
  "nama_bank",
  "nama_step",
  "nama_item",
  "nama_lokasi",
  "nama_blok",
  "nama_type",
  "nama_mandor",
  "nama_aset",
  "nama_akun",
  "no_po",
  "no_penjualan",
  "no_kwitansi",
  "no_unit",
  "keterangan",
  "email",
];

export function deriveRecordLabel(
  table: string,
  row: Record<string, any>,
): string {
  for (const field of LABEL_FIELDS) {
    const value = row[field];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }

  if (table === "units" && row.no_unit) {
    return `Unit ${row.no_unit}`;
  }

  return row.id ? String(row.id) : "Record";
}

export async function buildTrashSnapshot(
  table: string,
  row: Record<string, any>,
): Promise<Record<string, any>> {
  const snapshot = { ...row };
  const childDefs = TRASH_CHILD_TABLES[table];

  if (childDefs?.length) {
    const childRecords: Record<string, any[]> = {};
    for (const { table: childTable, fk } of childDefs) {
      const children = await query(
        `SELECT * FROM \`${childTable}\` WHERE \`${fk}\` = ?`,
        [row.id],
      );
      if (children.length > 0) {
        childRecords[childTable] = children;
      }
    }
    if (Object.keys(childRecords).length > 0) {
      snapshot._child_records = childRecords;
    }
  }

  return snapshot;
}

export async function archiveToTrash(
  table: string,
  row: Record<string, any>,
  session?: { id?: string; nama?: string; email?: string },
  recordLabel?: string,
) {
  const snapshot = await buildTrashSnapshot(table, row);
  const label = recordLabel || deriveRecordLabel(table, row);

  await query(
    `INSERT INTO \`trash\` (\`id\`, \`source_table\`, \`record_id\`, \`record_label\`, \`record_data\`, \`deleted_by\`, \`deleted_by_nama\`) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      crypto.randomUUID(),
      table,
      row.id,
      label,
      JSON.stringify(snapshot),
      session?.id || null,
      session?.nama || session?.email || "System",
    ],
  );
}

export async function restoreTrashRecord(item: {
  source_table: string;
  record_id: string;
  record_data: string;
}) {
  let parsed: Record<string, any>;
  try {
    parsed = JSON.parse(item.record_data);
  } catch {
    throw new Error("Data trash rusak/tidak bisa dibaca.");
  }

  const childRecords = parsed._child_records as
    | Record<string, any[]>
    | undefined;
  delete parsed._child_records;

  parsed.id = item.record_id;

  const columns = Object.keys(parsed);
  const colNames = columns.map((c) => `\`${c}\``).join(", ");
  const placeholders = columns.map(() => "?").join(", ");
  const values = columns.map((c) => {
    const v = parsed[c];
    if (v !== null && typeof v === "object") return JSON.stringify(v);
    return v ?? null;
  });

  await query(
    `INSERT INTO \`${item.source_table}\` (${colNames}) VALUES (${placeholders})`,
    values,
  );

  if (childRecords) {
    for (const [childTable, rows] of Object.entries(childRecords)) {
      for (const childRow of rows) {
        const childCols = Object.keys(childRow);
        const childColNames = childCols.map((c) => `\`${c}\``).join(", ");
        const childPlaceholders = childCols.map(() => "?").join(", ");
        const childValues = childCols.map((c) => {
          const v = childRow[c];
          if (v !== null && typeof v === "object") return JSON.stringify(v);
          return v ?? null;
        });

        await query(
          `INSERT INTO \`${childTable}\` (${childColNames}) VALUES (${childPlaceholders})`,
          childValues,
        );
      }
    }
  }
}
