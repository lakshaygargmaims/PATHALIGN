/** Minimal RFC-4180-style CSV parser (no external dependency). */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const text = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

export interface CsvResult {
  headers: string[];
  rows: Array<Record<string, string>>;
  errors: string[];
}

export function csvToObjects(input: string): CsvResult {
  const parsed = parseCsv(input);
  if (parsed.length < 2) {
    return { headers: [], rows: [], errors: ['CSV must contain a header row and at least one data row'] };
  }
  const headers = parsed[0]!.map((h) => h.trim());
  const errors: string[] = [];
  const rows: Array<Record<string, string>> = [];
  for (const [idx, r] of parsed.slice(1).entries()) {
    if (r.length !== headers.length) {
      errors.push(`Row ${idx + 2}: expected ${headers.length} columns, found ${r.length}`);
      continue;
    }
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = (r[i] ?? '').trim()));
    rows.push(obj);
  }
  return { headers, rows, errors };
}

export function toCsv(headers: string[], rows: ReadonlyArray<object>): string {
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(escape).join(',')];
  for (const r of rows) {
    const rec = r as Record<string, unknown>;
    lines.push(headers.map((h) => escape(rec[h])).join(','));
  }
  return lines.join('\n');
}
