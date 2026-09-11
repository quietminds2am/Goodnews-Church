import { useEffect, useRef, useState } from "react";
import { RefreshCw, Save } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/admin/PageHeader";
import { ImageUploadField } from "../../components/admin/ImageUploadField";
import { Button } from "../../components/ui/Button";
import { SuccessBanner } from "../../components/ui/States";

const KEYS = {
  logoUrl: "email_header_logo_url",
  accentColor: "email_accent_color",
  footerNote: "email_footer_note",
} as const;

const DEFAULT_ACCENT = "#c96f22";

export default function EmailTemplateAdmin() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);
  const [footerNote, setFooterNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", Object.values(KEYS));
      for (const row of data ?? []) {
        if (row.key === KEYS.logoUrl) setLogoUrl((row.value as string) || null);
        if (row.key === KEYS.accentColor) setAccentColor((row.value as string) || DEFAULT_ACCENT);
        if (row.key === KEYS.footerNote) setFooterNote((row.value as string) || "");
      }
      setLoading(false);
    })();
  }, []);

  async function fetchPreview() {
    setPreviewLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    try {
      const res = await fetch("/api/preview-email-template", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ logoUrl, accentColor, footerNote }),
      });
      const body = await res.json();
      if (res.ok) setPreviewHtml(body.html);
    } finally {
      setPreviewLoading(false);
    }
  }

  // Live preview, debounced — re-renders (via the real send-time function,
  // see api/preview-email-template.ts) shortly after any field changes.
  useEffect(() => {
    if (loading) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchPreview, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoUrl, accentColor, footerNote, loading]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);

    const { error: upsertError } = await supabase.from("site_settings").upsert(
      [
        { key: KEYS.logoUrl, value: logoUrl },
        { key: KEYS.accentColor, value: accentColor },
        { key: KEYS.footerNote, value: footerNote },
      ],
      { onConflict: "key" }
    );

    setSaving(false);
    if (upsertError) {
      setError("Couldn't save your changes. Please try again.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
  }

  return (
    <>
      <PageHeader
        title="Email Template"
        description="Branding used by every outgoing email — campaigns, the subscriber welcome message, event reminders, and contact notifications. One template, everywhere email goes out."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card space-y-6 p-6">
          <ImageUploadField
            label="Header logo"
            bucket="brand-assets"
            value={logoUrl}
            onChange={setLogoUrl}
            hint="Shown in the dark header bar of every email. Falls back to the church's name as text if not set."
          />

          <div>
            <label className="label" htmlFor="accent-color">Accent color</label>
            <div className="flex items-center gap-3">
              <input
                id="accent-color"
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border border-ink-200"
              />
              <input
                type="text"
                className="input"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="#c96f22"
              />
            </div>
            <p className="mt-1 text-sm text-ink-400">Used for the top accent bar and every button in outgoing email.</p>
          </div>

          <div>
            <label className="label" htmlFor="footer-note">Footer note</label>
            <textarea
              id="footer-note"
              rows={3}
              className="input resize-y"
              value={footerNote}
              onChange={(e) => setFooterNote(e.target.value)}
              placeholder="e.g. RCCG Goodnews Area Youth Church HQ, Abekoko off Ilawe Rd, Ado-Ekiti"
            />
            <p className="mt-1 text-sm text-ink-400">
              Appears above the unsubscribe line in member-facing emails (campaigns, welcome, reminders) — not shown
              on internal contact-form notifications.
            </p>
          </div>

          {error && <p role="alert" className="text-sm text-danger-700">{error}</p>}
          {saved && <SuccessBanner message="Email template saved." />}

          <Button onClick={handleSave} loading={saving}>
            <Save className="h-4 w-4" aria-hidden /> Save changes
          </Button>
        </div>

        <div className="card flex flex-col overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
            <p className="text-sm font-semibold text-ink-900">Live preview</p>
            <button
              onClick={fetchPreview}
              disabled={previewLoading}
              className="flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-brand-600 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${previewLoading ? "animate-spin" : ""}`} aria-hidden />
              Refresh
            </button>
          </div>
          <div className="min-h-[520px] flex-1 bg-ink-50">
            {previewHtml ? (
              <iframe title="Email preview" srcDoc={previewHtml} className="h-[600px] w-full border-0" sandbox="" />
            ) : (
              <div className="flex h-[520px] items-center justify-center text-sm text-ink-400">
                {previewLoading ? "Rendering preview…" : "Preview will appear here."}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
