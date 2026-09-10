import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useRealtimeInvalidate } from "./useRealtimeInvalidate";
import type { BrandAsset, BrandAssetType } from "../types/database";

// Seeded from the artwork supplied for this project. These render
// immediately even before the `brand_assets` table has rows, and are
// superseded the moment an admin uploads/manages assets of the same type
// from Admin → Brand Assets (see supabase/seed.sql to load them for real).
export const DEFAULT_MEMBER_LOGOS: BrandAsset[] = [
  {
    id: "default-goodnews-creative-media",
    name: "Goodnews Creative Media",
    type: "member_logo",
    image_url: "/assets/brand/goodnews-creative-media.png",
    active: true,
    uploaded_by: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "default-swizz-fashion-collections",
    name: "Swizz Fashion Collections",
    type: "member_logo",
    image_url: "/assets/brand/swizz-fashion-collections.png",
    active: true,
    uploaded_by: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "default-foundershub",
    name: "FoundersHub",
    type: "member_logo",
    image_url: "/assets/brand/foundershub.png",
    active: true,
    uploaded_by: null,
    created_at: new Date().toISOString(),
  },
];

export function useBrandAssets(type?: BrandAssetType) {
  useRealtimeInvalidate("brand_assets", [["brand_assets", type]]);

  return useQuery({
    queryKey: ["brand_assets", type],
    queryFn: async (): Promise<BrandAsset[]> => {
      let query = supabase.from("brand_assets").select("*").eq("active", true).order("created_at", { ascending: false });
      if (type) query = query.eq("type", type);
      const { data, error } = await query;
      if (error) throw error;
      const rows = (data ?? []) as BrandAsset[];
      if (rows.length === 0 && (type === "member_logo" || !type)) {
        return type ? DEFAULT_MEMBER_LOGOS : DEFAULT_MEMBER_LOGOS;
      }
      return rows;
    },
  });
}
