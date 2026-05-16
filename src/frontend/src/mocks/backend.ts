import type { backendInterface } from "../backend";

export const mockBackend: backendInterface = {
  generateImage: async (prompt: string, style: string, _deviceId: string) => ({
    __kind__: "ok",
    ok: {
      isCached: false,
      style,
      imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux&width=512&height=512&nologo=true&seed=42`,
      timestamp: BigInt(Date.now()) * BigInt(1_000_000),
      prompt,
      imageId: "mock-image-id-001",
    },
  }),

  getRateLimitStatus: async (_deviceId: string) => ({
    remainingGenerations: BigInt(5),
    dailyLimit: BigInt(10),
    resetTimeNanos: BigInt(Date.now() + 86400000) * BigInt(1_000_000),
  }),

  getTrendingPrompts: async (_style: string | null) => [
    {
      useCount: BigInt(142),
      promptText: "A majestic dragon flying over a fantasy castle at sunset",
      style: "fantasy",
      imageUrl: "https://image.pollinations.ai/prompt/A%20majestic%20dragon%20flying%20over%20a%20fantasy%20castle%20at%20sunset?model=flux&width=512&height=512&nologo=true&seed=42",
    },
    {
      useCount: BigInt(98),
      promptText: "Anime girl with silver hair in a cherry blossom garden",
      style: "anime",
      imageUrl: "https://image.pollinations.ai/prompt/Anime%20girl%20with%20silver%20hair%20in%20a%20cherry%20blossom%20garden?model=flux&width=512&height=512&nologo=true&seed=42",
    },
    {
      useCount: BigInt(76),
      promptText: "Cinematic portrait of a cyberpunk street market at night",
      style: "cinematic",
      imageUrl: "https://image.pollinations.ai/prompt/Cinematic%20portrait%20of%20a%20cyberpunk%20street%20market%20at%20night?model=flux&width=512&height=512&nologo=true&seed=42",
    },
    {
      useCount: BigInt(64),
      promptText: "Realistic 3D render of a futuristic sports car on a mountain road",
      style: "3d",
      imageUrl: "https://image.pollinations.ai/prompt/Realistic%203D%20render%20of%20a%20futuristic%20sports%20car%20on%20a%20mountain%20road?model=flux&width=512&height=512&nologo=true&seed=42",
    },
  ],

  recordAdWatch: async (_deviceId: string, _adType: string) => true,

  transform: async (input) => ({
    status: BigInt(200),
    body: new Uint8Array(),
    headers: [],
  }),
};
