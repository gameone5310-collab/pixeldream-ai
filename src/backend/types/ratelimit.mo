import Common "common";

module {
  public type RateLimitStatus = {
    remainingGenerations : Nat;
    dailyLimit : Nat;
    resetTimeNanos : Common.Timestamp;
  };

  public type DeviceQuota = {
    deviceId : Common.DeviceId;
    var usedToday : Nat;
    var bonusGenerations : Nat;
    var windowStartNanos : Common.Timestamp;
  };
};
