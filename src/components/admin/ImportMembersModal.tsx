import { useState } from "react";
import Papa from "papaparse";
import { UploadCloud, ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Modal } from "./Modal";
import { Button } from "../ui/Button";
import { SuccessBanner } from "../ui/States";

interface TargetField {
  key: "full_name" | "email" | "phone" | "date_of_birth" | "gender" | "department";
  label: string;
  required: boolean;
  guesses: string[];
}

const TARGET_FIELDS: TargetField[] = [
  { key: "full_name", label: "Full Name", required: true, guesses: ["full name", "name"] },
  { key: "email", label: "Email", required: true, guesses: ["email"] },
  { key: "phone", label: "Phone", required: false, guesses: ["phone", "number", "mobile"] },
  { key: "date_of_birth", label: "Date of Birth", required: false, guesses: ["birth", "dob"] },
  { key: "gender", label: "Gender", required: false, guesses: ["gender", "sex"] },
  { key: "department", label: "Department", required: false, guesses: ["department", "dept", "unit"] },
];

const NOT_MAPPED = "";

function guessColumn(headers: string[], guesses: string[]): string {
  const lower = headers.map((h) => h.toLowerCase());
  for (const guess of guesses) {
    const idx = lower.findIndex((h) => h.includes(guess));
    if (idx !== -1) return headers[idx];
  }
  return NOT_MAPPED;
}

type Step = "pick" | "map" | "result";

export function ImportMembersModal({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: () => void }) {
  const [step, setStep] = useState<Step>("pick");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setStep("pick");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setParseError(null);
    setResult(null);
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleFile(file: File) {
    setParseError(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const fields = results.meta.fields ?? [];
        if (fields.length === 0 || results.data.length === 0) {
          setParseError("Couldn't find any rows in that file. Check it's a CSV export with a header row.");
          return;
        }
        const guessed: Record<string, string> = {};
        for (const field of TARGET_FIELDS) {
          guessed[field.key] = guessColumn(fields, field.guesses);
        }
        setHeaders(fields);
        setRows(results.data);
        setMapping(guessed);
        setStep("map");
      },
      error: () => setParseError("Couldn't read that file. Please export a CSV and try again."),
    });
  }

  const canImport = mapping.full_name !== NOT_MAPPED && mapping.email !== NOT_MAPPED;

  async function handleImport() {
    setImporting(true);
    setError(null);

    const mappedRows = rows.map((row) => {
      const out: Record<string, string> = {};
      for (const field of TARGET_FIELDS) {
        const header = mapping[field.key];
        if (header && header !== NOT_MAPPED) out[field.key] = row[header] ?? "";
      }
      return out;
    });

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    try {
      const res = await fetch("/api/import-members", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rows: mappedRows }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Import failed.");
      setResult(body);
      setStep("result");
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Import Members" size="lg">
      {step === "pick" && (
        <div className="space-y-4">
          <p className="text-sm text-ink-500">
            Upload a CSV export (e.g. from a Google Form) — you'll be able to match its columns to the right fields
            on the next step, whatever the column headers are called.
          </p>
          <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded border-2 border-dashed border-ink-200 bg-ink-50 px-6 py-10 text-ink-500 hover:border-brand-400 hover:text-brand-600">
            <UploadCloud className="h-6 w-6" aria-hidden />
            <span className="text-sm font-medium">Click to choose a CSV file</span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
          </label>
          {parseError && <p role="alert" className="field-error">{parseError}</p>}
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
          </div>
        </div>
      )}

      {step === "map" && (
        <div className="space-y-5">
          <p className="text-sm text-ink-500">
            Found {rows.length} row{rows.length === 1 ? "" : "s"}. Match each field to a column from your file — Full
            Name and Email are required, everything else is optional.
          </p>
          <div className="space-y-3">
            {TARGET_FIELDS.map((field) => (
              <div key={field.key} className="flex items-center gap-3">
                <label className="w-36 shrink-0 text-sm font-medium text-ink-700">
                  {field.label}
                  {field.required && <span className="text-danger-500"> *</span>}
                </label>
                <select
                  className="input"
                  value={mapping[field.key] ?? NOT_MAPPED}
                  onChange={(e) => setMapping((m) => ({ ...m, [field.key]: e.target.value }))}
                >
                  <option value={NOT_MAPPED}>— Not mapped —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {error && <p role="alert" className="text-sm text-danger-700">{error}</p>}

          <div className="flex justify-between pt-2">
            <Button type="button" variant="outline" onClick={() => setStep("pick")}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> Back
            </Button>
            <Button type="button" onClick={handleImport} loading={importing} disabled={!canImport}>
              Import {rows.length} row{rows.length === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      )}

      {step === "result" && result && (
        <div className="space-y-4">
          <SuccessBanner
            message={`Imported ${result.imported} member${result.imported === 1 ? "" : "s"}.${
              result.skipped ? ` ${result.skipped} skipped (already exist).` : ""
            }${result.failed ? ` ${result.failed} failed (missing name or invalid email).` : ""}`}
          />
          <div className="flex justify-end">
            <Button onClick={handleClose}>Done</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
