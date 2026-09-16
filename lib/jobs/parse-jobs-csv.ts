// Minimal RFC4180-ish CSV parser — no new dependency for a one-off,
// personal bulk-import feature. Handles quoted fields, embedded commas,
// and doubled-quote escaping ("" inside a quoted field), which the
// sample jobs.csv actually uses (quoted titles containing commas).
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(field);
      field = "";
    } else {
      field += char;
    }
  }
  fields.push(field);
  return fields;
}

// Splits on newlines outside quotes, since a quoted field can legally
// contain a literal newline.
function splitCsvRows(text: string): string[] {
  const rows: string[] = [];
  let row = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') inQuotes = !inQuotes;
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (row.trim().length > 0) rows.push(row);
      row = "";
      if (char === "\r" && text[i + 1] === "\n") i++;
    } else {
      row += char;
    }
  }
  if (row.trim().length > 0) rows.push(row);
  return rows;
}

export interface CsvJobRow {
  title: string;
  company: string | null;
  location: string | null;
  sourceUrl: string;
}

export interface ParsedJobsCsv {
  rows: CsvJobRow[];
  skipped: number;
}

// Column names this import actually uses — everything else in the CSV
// (job_id, posted, posted_text, ...) is ignored, not stored.
const REQUIRED_COLUMNS = ["title", "url"] as const;

export function parseJobsCsv(text: string): ParsedJobsCsv | { error: string } {
  const csvRows = splitCsvRows(text);
  if (csvRows.length < 2) return { error: "That CSV has no data rows." };

  const header = parseCsvLine(csvRows[0]).map((h) => h.trim().toLowerCase());
  for (const col of REQUIRED_COLUMNS) {
    if (!header.includes(col)) {
      return { error: `CSV is missing a required "${col}" column.` };
    }
  }

  const titleIdx = header.indexOf("title");
  const companyIdx = header.indexOf("company");
  const locationIdx = header.indexOf("location");
  const urlIdx = header.indexOf("url");

  const rows: CsvJobRow[] = [];
  let skipped = 0;

  for (const line of csvRows.slice(1)) {
    const fields = parseCsvLine(line);
    const title = fields[titleIdx]?.trim();
    const sourceUrl = fields[urlIdx]?.trim();
    if (!title || !sourceUrl) {
      skipped++;
      continue;
    }
    rows.push({
      title,
      company: companyIdx >= 0 ? (fields[companyIdx]?.trim() ?? null) || null : null,
      location: locationIdx >= 0 ? (fields[locationIdx]?.trim() ?? null) || null : null,
      sourceUrl,
    });
  }

  return { rows, skipped };
}
