import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useRealtimeInvalidate } from "./useRealtimeInvalidate";
import type { EventRow, EventStatus } from "../types/database";

export function useEvents(status: EventStatus | "all", limit?: number) {
  useRealtimeInvalidate("events", [["events"], ["event"]]);

  return useQuery({
    queryKey: ["events", status, limit],
    queryFn: async (): Promise<EventRow[]> => {
      let query = supabase.from("events").select("*").order("event_date", { ascending: status === "upcoming" });
      if (status !== "all") query = query.eq("status", status);
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as EventRow[];
    },
  });
}

export function useEvent(slug: string | undefined) {
  useRealtimeInvalidate("events", [["event"]]);

  return useQuery({
    queryKey: ["event", slug],
    enabled: Boolean(slug),
    queryFn: async (): Promise<EventRow | null> => {
      const { data, error } = await supabase.from("events").select("*").eq("slug", slug as string).maybeSingle();
      if (error) throw error;
      return (data as EventRow) ?? null;
    },
  });
}
