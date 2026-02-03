/**
 * Parse CSV content into array of objects
 * Handles quoted fields, commas in values, and various line endings
 */
export function parseCSV<T extends Record<string, string>>(
  content: string,
  requiredHeaders: string[]
): { data: T[]; errors: string[] } {
  const errors: string[] = [];
  const lines = content.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length === 0) {
    return { data: [], errors: ["CSV file is empty"] };
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());

  // Validate required headers
  for (const required of requiredHeaders) {
    if (!headers.includes(required.toLowerCase())) {
      errors.push(`Missing required header: ${required}`);
    }
  }

  if (errors.length > 0) {
    return { data: [], errors };
  }

  // Parse data rows
  const data: T[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) {
      errors.push(`Row ${i + 1}: column count mismatch`);
      continue;
    }

    const row = {} as T;
    for (let j = 0; j < headers.length; j++) {
      (row as Record<string, string>)[headers[j]] = values[j].trim();
    }
    data.push(row);
  }

  return { data, errors };
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++; // Skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current);

  return result;
}

/**
 * Escape a value for CSV output
 */
export function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generate a secure random token for direct access links
 */
export function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  const randomValues = new Uint8Array(24);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < 24; i++) {
    token += chars[randomValues[i] % chars.length];
  }
  return token;
}
