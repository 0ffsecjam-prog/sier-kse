import ExcelJS from "exceljs";

export interface ColumnMapping<T> {
  key: keyof T;
  aliases: string[];
  required?: boolean;
}

export interface ParsedRow<T> {
  row: number;
  data: T;
}

export interface ImportPreview<T> {
  ok: ParsedRow<T>[];
  errors: { row: number; message: string }[];
  headersFound: string[];
}

function normalizeHeader(s: string): string {
  return s
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export async function parseXlsxBuffer<T>(
  buffer: Buffer | ArrayBuffer,
  mapping: ColumnMapping<T>[],
  validate: (row: Record<string, unknown>) => { ok: true; data: T } | { ok: false; error: string },
): Promise<ImportPreview<T>> {
  const wb = new ExcelJS.Workbook();
  // exceljs accepts ArrayBuffer-like input
  await wb.xlsx.load(buffer as ArrayBuffer);
  const ws = wb.worksheets[0];
  if (!ws) {
    return { ok: [], errors: [{ row: 0, message: "El archivo está vacío." }], headersFound: [] };
  }

  const headerRow = ws.getRow(1);
  const headers: { col: number; header: string; normalized: string }[] = [];
  headerRow.eachCell((cell, col) => {
    const v = cell.value;
    if (v == null) return;
    headers.push({ col, header: String(v), normalized: normalizeHeader(String(v)) });
  });

  const headerNormSet = new Set(headers.map((h) => h.normalized));
  const colByKey = new Map<keyof T, number>();
  const headerByKey = new Map<keyof T, string>();

  for (const m of mapping) {
    const normAliases = m.aliases.map(normalizeHeader);
    const match = headers.find((h) => normAliases.includes(h.normalized));
    if (match) {
      colByKey.set(m.key, match.col);
      headerByKey.set(m.key, match.header);
    }
  }

  const missingRequired = mapping
    .filter((m) => m.required && !colByKey.has(m.key))
    .map((m) => m.aliases[0]);

  const errors: { row: number; message: string }[] = [];
  const ok: ParsedRow<T>[] = [];

  if (missingRequired.length > 0) {
    return {
      ok: [],
      errors: [
        {
          row: 1,
          message: `Faltan columnas requeridas: ${missingRequired.join(", ")}. Encontradas: ${Array.from(headerNormSet).join(", ")}`,
        },
      ],
      headersFound: Array.from(headerNormSet),
    };
  }

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj: Record<string, unknown> = {};
    let hasAny = false;
    for (const [key, col] of colByKey.entries()) {
      const cell = row.getCell(col);
      let value: unknown = cell.value;
      if (value && typeof value === "object" && "result" in (value as object)) {
        value = (value as { result: unknown }).result;
      }
      if (value && typeof value === "object" && "text" in (value as object)) {
        value = (value as { text: unknown }).text;
      }
      if (value !== null && value !== undefined && value !== "") hasAny = true;
      obj[key as string] = value;
    }
    if (!hasAny) return;

    const result = validate(obj);
    if (result.ok) {
      ok.push({ row: rowNumber, data: result.data });
    } else {
      errors.push({ row: rowNumber, message: result.error });
    }
  });

  return { ok, errors, headersFound: Array.from(headerNormSet) };
}
