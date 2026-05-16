export type GenerationStyle =
  | "realistic"
  | "anime"
  | "3d"
  | "cinematic"
  | "sketch"
  | "fantasy";

export type StyleOption = {
  id: GenerationStyle;
  label: string;
  emoji: string;
};

export const STYLE_OPTIONS: StyleOption[] = [
  { id: "realistic", label: "Realistic", emoji: "📷" },
  { id: "anime", label: "Anime", emoji: "🎌" },
  { id: "3d", label: "3D Render", emoji: "🎲" },
  { id: "cinematic", label: "Cinematic", emoji: "🎬" },
  { id: "sketch", label: "Sketch", emoji: "✏️" },
  { id: "fantasy", label: "Fantasy", emoji: "🔮" },
];

export type {
  ImageResult,
  RateLimitStatus,
  TrendingPrompt,
  GenerationError,
} from "@/backend";
