import { createActor } from "@/backend";
import type { RateLimitStatus } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { useDeviceId } from "./useDeviceId";

export function useRateLimit() {
  const { actor, isFetching } = useActor(createActor);
  const deviceId = useDeviceId();

  return useQuery<RateLimitStatus | null>({
    queryKey: ["rateLimit", deviceId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getRateLimitStatus(deviceId);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
