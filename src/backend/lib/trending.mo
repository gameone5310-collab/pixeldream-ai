import Map "mo:core/Map";
import TrendingTypes "../types/trending";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Order "mo:core/Order";

module {
  public type TrendingMap = Map.Map<Text, TrendingTypes.TrendingEntry>;

  public let TOP_N : Nat = 8;

  /// Record a prompt use and update its image URL
  public func recordUse(
    trendingMap : TrendingMap,
    promptText : Text,
    style : Text,
    imageUrl : Text,
    nowNanos : Int,
  ) : () {
    let key = promptText # ":" # style;
    switch (trendingMap.get(key)) {
      case (?existing) {
        existing.useCount := existing.useCount + 1;
        existing.imageUrl := imageUrl;
        existing.lastUpdatedNanos := nowNanos;
      };
      case null {
        let entry : TrendingTypes.TrendingEntry = {
          promptText;
          style;
          var useCount = 1;
          var imageUrl;
          var lastUpdatedNanos = nowNanos;
        };
        trendingMap.add(key, entry);
      };
    };
  };

  /// Get top N trending prompts, optionally filtered by style
  public func getTop(
    trendingMap : TrendingMap,
    style : ?Text,
    n : Nat,
  ) : [TrendingTypes.TrendingPrompt] {
    let filtered = trendingMap.entries()
      |> _.filter(func((_, e) : (Text, TrendingTypes.TrendingEntry)) : Bool {
        switch (style) {
          case null { true };
          case (?s) { e.style == s };
        }
      })
      |> _.map(func((_, e) : (Text, TrendingTypes.TrendingEntry)) : TrendingTypes.TrendingPrompt {
        { promptText = e.promptText; style = e.style; useCount = e.useCount; imageUrl = e.imageUrl }
      })
      |> _.toArray();
    let sorted = filtered.sort(func(a : TrendingTypes.TrendingPrompt, b : TrendingTypes.TrendingPrompt) : Order.Order {
      if (a.useCount > b.useCount) { #less } else if (a.useCount < b.useCount) { #greater } else { #equal }
    });
    if (sorted.size() <= n) { sorted } else { sorted.sliceToArray(0, n) };
  };
};
