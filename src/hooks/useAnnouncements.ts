import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useRealtimeInvalidate } from "./useRealtimeInvalidate";
import type { Announcement } from "../types/database";

export function useAnnouncements(limit?: number) {
  useRealtimeInvalidate("announcements", [["announcements"]]);

  return useQuery({
    queryKey: ["announcements", limit],
    queryFn: async (): Promise<Announcement[]> => {
      // `status = 'published'` alone isn't enough to respect scheduling — a
      // published row with a future `publish_at` should stay hidden until
      // that moment. Gating on both is what makes "schedule for later"
      // actually work instead of publishing immediately.
      const now = new Date().toISOString();
      let query = supabase
        .from("announcements")
        .select("*")
        .eq("status", "published")
        .or(`publish_at.is.null,publish_at.lte.${now}`)
        .order("publish_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Announcement[];
    },
  });
}
