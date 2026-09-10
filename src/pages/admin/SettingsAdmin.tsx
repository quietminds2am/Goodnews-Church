import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2, Save } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import type { SiteSettings, SocialLink } from "../../types/database";
import { PageHeader } from "../../components/admin/PageHeader";
import { TextField } from "../../components/ui/Field";
import { Button } from "../../components/ui/Button";
import { SuccessBanner } from "../../components/ui/States";
import { ImageUploadField } from "../../components/admin/ImageUploadField";

const SOCIAL_PLATFORMS: SocialLink["platform"][] = ["instagram", "facebook", "youtube", "tiktok", "x", "whatsapp", "other"];

export default function SettingsAdmin() {
  const { settings, refresh } = useSiteSettings();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ogImage, setOgImage] = useState<string | null>(settings.og_image_url);

  const { register, control, handleSubmit, reset } = useForm<SiteSettings>({ defaultValues: settings });

  const serviceTimes = useFieldArray({ control, name: "service_times" });
  const socials = useFieldArray({ control, name: "socials" });

  useEffect(() => {
    reset(settings);
    setOgImage(settings.og_image_url);
  }, [settings, reset]);

  async function onSubmit(values: SiteSettings) {
    setSaving(true);
    setSaved(false);
    setError(null);

    const finalValues: SiteSettings = { ...values, og_image_url: ogImage };
    const rows = Object.entries(finalValues).map(([key, value]) => ({ key, value }));

    const { error: upsertError } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });

    setSaving(false);
    if (upsertError) {
      setError("Couldn't save settings. Please try again.");
      return;
    }
    setSaved(true);
    await refresh();
    setTimeout(() => setSaved(false), 4000);
  }

  return (
    <>
      <PageHeader title="Site Settings" description="These details power the header, footer, SEO tags, and structured data across the site." />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <section className="card space-y-5 p-6">
          <h2 className="font-semibold text-ink-900">Church Details</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Full church name" required {...register("church_name")} />
            <TextField label="Short display name" required {...register("church_short_name")} />
            <TextField label="Pastor's name" required {...register("pastor_name")} />
            <TextField label="Pastor's title" required {...register("pastor_title")} />
          </div>
          <TextField label="Tagline" required {...register("tagline")} />
        </section>

        <section className="card space-y-5 p-6">
          <h2 className="font-semibold text-ink-900">Contact & Location</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Address" required {...register("address")} />
            <TextField label="City" required {...register("city")} />
            <TextField label="Country" required {...register("country")} />
            <TextField label="Phone number" required {...register("phone")} />
            <TextField label="Email address" type="email" required {...register("email")} />
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink-900">Service Times</h2>
            <Button type="button" variant="ghost" onClick={() => serviceTimes.append({ label: "", time: "" })}>
              <Plus className="h-4 w-4" aria-hidden /> Add
            </Button>
          </div>
          {serviceTimes.fields.map((field, i) => (
            <div key={field.id} className="flex flex-col gap-3 rounded border border-ink-100 p-3 sm:flex-row sm:items-center">
              <input className="input" placeholder="Label (e.g. Sunday Worship Service)" {...register(`service_times.${i}.label` as const)} />
              <input className="input" placeholder="Time (e.g. Sundays, 8:00 AM – 10:30 AM)" {...register(`service_times.${i}.time` as const)} />
              <button type="button" onClick={() => serviceTimes.remove(i)} className="rounded p-2 text-danger-500 hover:bg-danger-50" aria-label="Remove service time">
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
        </section>

        <section className="card space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink-900">Social Media Links</h2>
            <Button type="button" variant="ghost" onClick={() => socials.append({ platform: "instagram", url: "", label: "" })}>
              <Plus className="h-4 w-4" aria-hidden /> Add
            </Button>
          </div>
          {socials.fields.map((field, i) => (
            <div key={field.id} className="flex flex-col gap-3 rounded border border-ink-100 p-3 sm:flex-row sm:items-center">
              <select className="input sm:w-40" {...register(`socials.${i}.platform` as const)}>
                {SOCIAL_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
              <input className="input flex-1" placeholder="https://..." {...register(`socials.${i}.url` as const)} />
              <input className="input sm:w-40" placeholder="Label" {...register(`socials.${i}.label` as const)} />
              <button type="button" onClick={() => socials.remove(i)} className="rounded p-2 text-danger-500 hover:bg-danger-50" aria-label="Remove social link">
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
        </section>

        <section className="card space-y-5 p-6">
          <h2 className="font-semibold text-ink-900">SEO Defaults</h2>
          <TextField label="Default page title" required {...register("seo_default_title")} />
          <div>
            <label className="label" htmlFor="seo_default_description">Default meta description</label>
            <textarea id="seo_default_description" rows={3} className="input resize-y" {...register("seo_default_description")} />
          </div>
          <ImageUploadField label="Default social share image (Open Graph)" bucket="brand-assets" value={ogImage} onChange={setOgImage} />
        </section>

        {error && <p role="alert" className="text-sm text-danger-700">{error}</p>}
        {saved && <SuccessBanner message="Settings saved successfully." />}

        <Button type="submit" loading={saving}>
          <Save className="h-4 w-4" aria-hidden /> Save all settings
        </Button>
      </form>
    </>
  );
}
