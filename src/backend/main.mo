import Map "mo:core/Map";
import Time "mo:core/Time";
import ImagegenLib "lib/imagegen";
import RateLimitLib "lib/ratelimit";
import TrendingLib "lib/trending";
import ImagegenApi "mixins/imagegen-api";

actor {
  let state = { var isProcessing = false };
  let cache : ImagegenLib.ImageCache = Map.empty();
  let quotas : RateLimitLib.QuotaMap = Map.empty();
  let trendingMap : TrendingLib.TrendingMap = Map.empty();

  // Seed 8 trending prompts on initialization
  do {
    let nowNanos = Time.now();
    let seeds : [(Text, Text)] = [
      ("A majestic dragon flying over a fantasy castle at sunset", "fantasy"),
      ("Anime girl with silver hair in a cherry blossom garden", "anime"),
      ("Cinematic portrait of a cyberpunk street market at night", "cinematic"),
      ("Realistic 3D render of a futuristic sports car on a mountain road", "3d"),
      ("Watercolor sketch of a cozy coffee shop in Paris", "sketch"),
      ("Epic space battle with starships near a nebula", "cinematic"),
      ("Cute chibi anime warrior princess with glowing sword", "anime"),
      ("Photorealistic forest cabin in autumn with fog and golden light", "realistic"),
    ];
    for ((prompt, style) in seeds.values()) {
      let encodedPrompt = prompt;
      let imageUrl = "https://image.pollinations.ai/prompt/" # encodedPrompt # "?model=flux&width=512&height=512&nologo=true&seed=42";
      TrendingLib.recordUse(trendingMap, prompt, style, imageUrl, nowNanos);
    };
  };

  include ImagegenApi(state, cache, quotas, trendingMap);
};
