import Map "mo:core/Map";
import RateLimitTypes "../types/ratelimit";
import CommonTypes "../types/common";

module {
  public type QuotaMap = Map.Map<CommonTypes.DeviceId, RateLimitTypes.DeviceQuota>;

  public let DAILY_LIMIT : Nat = 5;
  public let NANOS_PER_DAY : Int = 86_400_000_000_000;

  /// Get or create the quota record for a device
  public func getOrCreateQuota(
    quotas : QuotaMap,
    deviceId : CommonTypes.DeviceId,
    nowNanos : CommonTypes.Timestamp,
  ) : RateLimitTypes.DeviceQuota {
    switch (quotas.get(deviceId)) {
      case (?existing) {
        maybeResetWindow(existing, nowNanos);
        existing
      };
      case null {
        let quota : RateLimitTypes.DeviceQuota = {
          deviceId;
          var usedToday = 0;
          var bonusGenerations = 0;
          var windowStartNanos = nowNanos;
        };
        quotas.add(deviceId, quota);
        quota
      };
    }
  };

  /// Check if device can generate (respects daily limit + bonus)
  public func canGenerate(
    quotas : QuotaMap,
    deviceId : CommonTypes.DeviceId,
    nowNanos : CommonTypes.Timestamp,
  ) : Bool {
    let quota = getOrCreateQuota(quotas, deviceId, nowNanos);
    quota.usedToday < DAILY_LIMIT + quota.bonusGenerations;
  };

  /// Consume one generation slot for a device
  public func consumeGeneration(
    quotas : QuotaMap,
    deviceId : CommonTypes.DeviceId,
    nowNanos : CommonTypes.Timestamp,
  ) : () {
    let quota = getOrCreateQuota(quotas, deviceId, nowNanos);
    quota.usedToday := quota.usedToday + 1;
  };

  /// Add bonus generations from a watched ad
  public func addBonus(
    quotas : QuotaMap,
    deviceId : CommonTypes.DeviceId,
    nowNanos : CommonTypes.Timestamp,
  ) : () {
    let quota = getOrCreateQuota(quotas, deviceId, nowNanos);
    quota.bonusGenerations := quota.bonusGenerations + 1;
  };

  /// Build the public RateLimitStatus for a device
  public func getStatus(
    quotas : QuotaMap,
    deviceId : CommonTypes.DeviceId,
    nowNanos : CommonTypes.Timestamp,
  ) : RateLimitTypes.RateLimitStatus {
    let quota = getOrCreateQuota(quotas, deviceId, nowNanos);
    let totalAllowed = DAILY_LIMIT + quota.bonusGenerations;
    let used = quota.usedToday;
    let remaining : Nat = if (used >= totalAllowed) { 0 } else { totalAllowed - used };
    {
      remainingGenerations = remaining;
      dailyLimit = DAILY_LIMIT;
      resetTimeNanos = quota.windowStartNanos + NANOS_PER_DAY;
    }
  };

  /// Reset a device window if it has expired
  public func maybeResetWindow(
    quota : RateLimitTypes.DeviceQuota,
    nowNanos : CommonTypes.Timestamp,
  ) : () {
    if (nowNanos - quota.windowStartNanos > NANOS_PER_DAY) {
      quota.usedToday := 0;
      quota.bonusGenerations := 0;
      quota.windowStartNanos := nowNanos;
    };
  };
};
