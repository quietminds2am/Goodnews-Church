import { useEffect } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

/**
 * Subscribes to Postgres changes on `table` (via Supabase Realtime — the
 * table must be added to the `supabase_realtime` publication, see
 * supabase/migrations/0007_realtime.sql) and invalidates the given
 * react-query keys whenever a row is inserted/updated/deleted, so anyone
 * already on the page sees new/edited/removed content without a refresh.
 *
 * Call alongside the existing `useQuery` in a data hook — it doesn't fetch
 * anything itself, it just tells react-query "this is stale, go refetch."
 */
export function useRealtimeInvalidate(table: string, queryKeys: QueryKey[]) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`realtime:${table}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        for (const key of queryKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- queryKeys is expected to be a stable literal at each call site
  }, [table, queryClient]);
}
