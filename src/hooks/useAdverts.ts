import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useRealtimeInvalidate } from "./useRealtimeInvalidate";
import type { Advert, AdvertPlacement } from "../types/database";

export function useAdverts(placement: AdvertPlacement) {
  useRealtimeInvalidate("adverts", [["adverts", placement]]);

  return useQuery({
    queryKey: ["adverts", placement],
    queryFn: async (): Promise<Advert[]> => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("adverts")
        .select("*")
        .eq("placement", placement)
        .eq("active", true)
        .or(`start_date.is.null,start_date.lte.${today}`)
        .or(`end_date.is.null,end_date.gte.${today}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Advert[];
    },
  });
}
