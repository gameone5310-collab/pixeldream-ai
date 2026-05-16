import Map "mo:core/Map";
import ImagegenTypes "../types/imagegen";
import CommonTypes "../types/common";
import Time "mo:core/Time";
import Iter "mo:core/Iter";

module {
  public type ImageCache = Map.Map<Text, ImagegenTypes.CacheEntry>;

  /// Generate a cache key from prompt + style
  public func cacheKey(prompt : Text, style : Text) : Text {
    prompt # ":" # style;
  };

  /// Look up a cached image result by prompt+style key
  public func getCached(
    cache : ImageCache,
    prompt : Text,
    style : Text,
  ) : ?ImagegenTypes.ImageResult {
    let key = cacheKey(prompt, style);
    switch (cache.get(key)) {
      case null { null };
      case (?entry) {
        let nowNanos = Time.now();
        if (isCacheValid(entry, nowNanos)) {
          ?{
            imageId = entry.imageId;
            imageUrl = entry.imageUrl;
            prompt = entry.prompt;
            style = entry.style;
            timestamp = entry.timestamp;
            isCached = true;
          }
        } else {
          null
        }
      };
    }
  };

  /// Store a new image result in cache
  public func putCache(
    cache : ImageCache,
    entry : ImagegenTypes.CacheEntry,
  ) : () {
    let key = cacheKey(entry.prompt, entry.style);
    cache.add(key, entry);
  };

  /// Check if a cache entry is still within TTL (7 days)
  public func isCacheValid(entry : ImagegenTypes.CacheEntry, nowNanos : CommonTypes.Timestamp) : Bool {
    let ttl : Int = 604_800_000_000_000; // 7 days in nanoseconds
    nowNanos - entry.timestamp < ttl;
  };

  /// Evict expired entries from the cache
  public func evictExpired(cache : ImageCache, nowNanos : CommonTypes.Timestamp) : () {
    let expiredKeys = cache.entries()
      |> _.filter(func((_, entry) : (Text, ImagegenTypes.CacheEntry)) : Bool {
        not isCacheValid(entry, nowNanos)
      })
      |> _.map(func((k, _) : (Text, ImagegenTypes.CacheEntry)) : Text { k })
      |> _.toArray();
    for (key in expiredKeys.values()) {
      cache.remove(key);
    };
  };
};
