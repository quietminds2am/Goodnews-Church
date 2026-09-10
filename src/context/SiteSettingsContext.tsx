import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { SiteSettings } from "../types/database";

// Sensible defaults so the site renders correctly even before an admin has
// visited Settings, and so we never hardcode church details in components —
// everything here is editable from the admin panel and backed by the
// `site_settings` table (see supabase/migrations/0001_init.sql).
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  church_name: "RCCG Goodnews Area Youth Church HQ",
  church_short_name: "Goodnews Youth Church",
  pastor_name: "Dr. Onifade David Kayode",
  pastor_title: "Pastor in Charge",
  pastor_bio:
    "Pastor Dr. Onifade David Kayode leads Goodnews Area Youth Church HQ with a heart for raising young people in faith, character, and purpose. Under his leadership, the church has grown into a vibrant community devoted to sound teaching, genuine worship, and discipleship for the next generation.",
  pastor_photo_url: null,
  tagline: "A house of faith, family, and purpose for every young person.",
  address: "Goodnews Area, Lagos",
  city: "Lagos",
  country: "Nigeria",
  phone: "+234 800 000 0000",
  email: "info@goodnewsyouthchurch.org",
  service_times: [
    { label: "Sunday Worship Service", time: "Sundays, 8:00 AM – 10:30 AM" },
    { label: "Midweek Bible Study", time: "Wednesdays, 6:00 PM – 7:30 PM" },
    { label: "House Fellowship", time: "Fridays, 6:00 PM – 7:30 PM" },
  ],
  socials: [
    { platform: "instagram", url: "https://instagram.com/", label: "@goodnewsyouthchurch" },
    { platform: "facebook", url: "https://facebook.com/", label: "Goodnews Youth Church" },
    { platform: "youtube", url: "https://youtube.com/", label: "Goodnews Youth Church" },
  ],
  seo_default_title: "RCCG Goodnews Area Youth Church HQ",
  seo_default_description:
    "Join RCCG Goodnews Area Youth Church HQ for Sunday worship, midweek programs, and community events under Pastor Dr. Onifade David Kayode.",
  og_image_url: null,
};

interface SiteSettingsState {
  settings: SiteSettings;
  loading: boolean;
  usingDefaults: boolean;
  refresh: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsState | undefined>(undefined);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [usingDefaults, setUsingDefaults] = useState(true);

  async function fetchSettings() {
    setLoading(true);
    const { data, error } = await supabase.from("site_settings").select("key, value");
    if (error || !data || data.length === 0) {
      setSettings(DEFAULT_SITE_SETTINGS);
      setUsingDefaults(true);
      setLoading(false);
      return;
    }
    const merged = { ...DEFAULT_SITE_SETTINGS };
    for (const row of data as { key: string; value: unknown }[]) {
      if (row.key in merged) {
        // @ts-expect-error — key is validated against DEFAULT_SITE_SETTINGS above
        merged[row.key] = row.value;
      }
    }
    setSettings(merged);
    setUsingDefaults(false);
    setLoading(false);
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  const value = useMemo<SiteSettingsState>(
    () => ({ settings, loading, usingDefaults, refresh: fetchSettings }),
    [settings, loading, usingDefaults]
  );

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings(): SiteSettingsState {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error("useSiteSettings must be used within a SiteSettingsProvider");
  return ctx;
}
