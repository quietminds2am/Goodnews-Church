import { useEffect, useId } from "react";
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
  // Two components can both subscribe to the same table (e.g. two
  // <AdvertBanner> placements on one page) — each needs its own channel.
  // Supabase's realtime client reuses a channel by topic name, so two
  // hook instances sharing a bare `realtime:${table}` name collide the
  // moment the second one calls `.subscribe()`. useId() keeps every
  // instance's channel unique.
  const instanceId = useId();

  useEffect(() => {
    const channel = supabase
      .channel(`realtime:${table}:${instanceId}`)
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
  }, [table, instanceId, queryClient]);
}
