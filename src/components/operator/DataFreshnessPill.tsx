import { useMemo, useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function timeAgo(ts?: number) {
  if (!ts) return "—";
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 10) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  return `${hr}h ago`;
}

export function DataFreshnessPill({
  queryKeys,
  staleAfterSeconds = 60,
}: {
  queryKeys: string[][];
  staleAfterSeconds?: number;
}) {
  const qc = useQueryClient();
  const [tick, setTick] = useState(0);

  // Subscribe to query cache changes to detect fetching state
  useEffect(() => {
    const unsubscribe = qc.getQueryCache().subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, [qc]);

  // Re-render every 10s to update the "ago" text
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  // Check if any queries are currently fetching
  const isFetching = useMemo(() => {
    return queryKeys.some((key) => {
      const state = qc.getQueryState(key);
      return state?.fetchStatus === "fetching";
    });
  }, [qc, queryKeys, tick]);

  const newest = useMemo(() => {
    let max = 0;
    for (const key of queryKeys) {
      const state = qc.getQueryState(key);
      const t = state?.dataUpdatedAt ?? 0;
      if (t > max) max = t;
    }
    return max || undefined;
  }, [qc, queryKeys, tick]);

  const ageSec = newest ? Math.floor((Date.now() - newest) / 1000) : undefined;
  const isStale = ageSec !== undefined && ageSec > staleAfterSeconds;

  const handleRefresh = useCallback(() => {
    queryKeys.forEach((key) => qc.invalidateQueries({ queryKey: key }));
  }, [qc, queryKeys]);

  return (
    <div className="flex items-center gap-1">
      <Badge 
        variant={isFetching ? "secondary" : isStale ? "destructive" : "secondary"} 
        className="text-xs font-normal"
      >
        {isFetching ? (
          <>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Refreshing…
          </>
        ) : (
          <>
            {isStale ? "Stale" : "Fresh"} • {timeAgo(newest)}
          </>
        )}
      </Badge>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={handleRefresh}
        disabled={isFetching}
        title="Refresh data (Alt+R)"
      >
        <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );
}
