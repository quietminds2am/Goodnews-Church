import { useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { supabase } from "../../lib/supabase";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

interface Props {
  label: string;
  bucket: string;
  value: string | null;
  onChange: (url: string | null) => void;
  hint?: string;
}

export function ImageUploadField({ label, bucket, value, onChange, hint }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);

    // Never trust the file extension alone — validate the actual MIME type
    // and enforce a hard size cap before anything reaches storage.
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please upload a JPG, PNG, WebP, or SVG image.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

    setUploading(false);

    if (uploadError) {
      setError("Upload failed. Please try again.");
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    onChange(data.publicUrl);
  }

  return (
    <div>
      <label className="label">{label}</label>
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="" className="h-32 w-auto rounded border border-ink-200 object-contain bg-ink-50 p-2" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-danger-500 text-white hover:bg-danger-700"
            aria-label="Remove image"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center justify-center gap-2 rounded border-2 border-dashed border-ink-200 bg-ink-50 px-6 py-8 text-ink-500 hover:border-brand-400 hover:text-brand-600 disabled:opacity-60"
        >
          <UploadCloud className="h-6 w-6" aria-hidden />
          <span className="text-sm font-medium">{uploading ? "Uploading…" : "Click to upload an image"}</span>
          <span className="text-xs text-ink-400">JPG, PNG, WebP or SVG — up to 5MB</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      {hint && !error && <p className="mt-1 text-sm text-ink-400">{hint}</p>}
      {error && <p role="alert" className="field-error">{error}</p>}
    </div>
  );
}
