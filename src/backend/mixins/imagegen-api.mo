import Map "mo:core/Map";
import Time "mo:core/Time";
import Char "mo:core/Char";
import ImagegenTypes "../types/imagegen";
import RateLimitTypes "../types/ratelimit";
import TrendingTypes "../types/trending";
import CommonTypes "../types/common";
import ImagegenLib "../lib/imagegen";
import RateLimitLib "../lib/ratelimit";
import TrendingLib "../lib/trending";
import ModerationLib "../lib/moderation";
import OutCall "mo:caffeineai-http-outcalls/outcall";

mixin (
  state : { var isProcessing : Bool },
  cache : ImagegenLib.ImageCache,
  quotas : RateLimitLib.QuotaMap,
  trendingMap : TrendingLib.TrendingMap,
) {
  /// Transform callback required by the IC for HTTP outcalls.
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  /// URL-encode a prompt text for use in URLs
  func urlEncode(text : Text) : Text {
    text.flatMap(func(c : Char) : Text {
      let code = c.toNat32();
      if (
        (code >= 65 and code <= 90) or  // A-Z
        (code >= 97 and code <= 122) or // a-z
        (code >= 48 and code <= 57) or  // 0-9
        c == '-' or c == '_' or c == '.' or c == '~'
      ) {
        c.toText()
      } else if (c == ' ') {
        "%20"
      } else {
        let hi = c.toNat32() / 16;
        let lo = c.toNat32() % 16;
        let hexChar = func(n : Nat32) : Text {
          if (n < 10) { Char.fromNat32(n + 48).toText() }
          else { Char.fromNat32(n - 10 + 65).toText() }
        };
        "%" # hexChar(hi) # hexChar(lo)
      }
    })
  };

  /// Generate an image for the given prompt and style.
  /// Returns a cached result instantly if available; otherwise calls the API.
  /// Enforces rate limiting and content moderation before calling the API.
  public func generateImage(
    prompt : Text,
    style : Text,
    deviceId : CommonTypes.DeviceId,
  ) : async { #ok : ImagegenTypes.ImageResult; #err : ImagegenTypes.GenerationError } {
    // Check queue lock
    if (state.isProcessing) {
      return #err(#QueueFull);
    };

    // Content moderation
    if (not ModerationLib.isAllowed(prompt)) {
      return #err(#ContentViolation);
    };

    // Check cache first
    let nowNanos = Time.now();
    switch (ImagegenLib.getCached(cache, prompt, style)) {
      case (?cached) {
        TrendingLib.recordUse(trendingMap, prompt, style, cached.imageUrl, nowNanos);
        return #ok(cached);
      };
      case null {};
    };

    // Rate limit check
    if (not RateLimitLib.canGenerate(quotas, deviceId, nowNanos)) {
      return #err(#RateLimited);
    };

    // Set queue lock
    state.isProcessing := true;

    // Build API URL — use the image URL directly (frontend renders via <img src>)
    let seed = nowNanos.toText();
    let encodedPrompt = urlEncode(prompt);
    let styleParam = if (style == "anime") { "&style=anime" }
      else if (style == "cinematic") { "&style=cinematic" }
      else if (style == "3d") { "&style=3d" }
      else if (style == "sketch") { "&style=sketch" }
      else if (style == "fantasy") { "&style=fantasy" }
      else { "" };
    let imageUrl = "https://gen.pollinations.ai/image/" # encodedPrompt
      # "?model=flux&width=512&height=512&nologo=true&seed=" # seed # styleParam;

    // Call the API once — no retry to avoid rate limit (anonymous tier: 15s per request)
    let result = try {
      let _response = await OutCall.httpGetRequest(imageUrl, [], transform);
      #ok(imageUrl)
    } catch (_) {
      #err("Image generation failed. Please try again in a moment.")
    };

    state.isProcessing := false;

    switch (result) {
      case (#err(msg)) { #err(#ApiError(msg)) };
      case (#ok(url)) {
        let imageId = encodedPrompt # "-" # seed;
        let entry : ImagegenTypes.CacheEntry = {
          imageId;
          imageUrl = url;
          prompt;
          style;
          timestamp = nowNanos;
        };
        ImagegenLib.putCache(cache, entry);
        TrendingLib.recordUse(trendingMap, prompt, style, url, nowNanos);
        RateLimitLib.consumeGeneration(quotas, deviceId, nowNanos);
        #ok({
          imageId;
          imageUrl = url;
          prompt;
          style;
          timestamp = nowNanos;
          isCached = false;
        })
      };
    }
  };

  /// Return the current rate-limit status for a device.
  public query func getRateLimitStatus(
    deviceId : CommonTypes.DeviceId,
  ) : async RateLimitTypes.RateLimitStatus {
    let nowNanos = Time.now();
    RateLimitLib.getStatus(quotas, deviceId, nowNanos);
  };

  /// Return up to 8 trending prompts, optionally filtered by style.
  public query func getTrendingPrompts(
    style : ?Text,
  ) : async [TrendingTypes.TrendingPrompt] {
    TrendingLib.getTop(trendingMap, style, TrendingLib.TOP_N);
  };

  /// Record that a device watched an ad (rewarded or hd_download).
  /// Grants 1 bonus generation.
  public func recordAdWatch(
    deviceId : CommonTypes.DeviceId,
    adType : Text,
  ) : async Bool {
    if (adType == "rewarded") {
      let nowNanos = Time.now();
      RateLimitLib.addBonus(quotas, deviceId, nowNanos);
    };
    true;
  };
};
