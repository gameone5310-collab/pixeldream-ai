import { createActor } from "@/backend";
import type { ImageResult, TrendingPrompt } from "@/backend";
import { AdSlot } from "@/components/AdSlot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeviceId } from "@/hooks/useDeviceId";
import { useRateLimit } from "@/hooks/useRateLimit";
import { STYLE_OPTIONS } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  Play,
  RefreshCw,
  Share2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────
type ErrorKind = "ContentViolation" | "RateLimited" | "QueueFull" | "ApiError";

interface GenerationState {
  result: ImageResult | null;
  errorKind: ErrorKind | null;
  errorMessage: string | null;
}

// ────────────────────────────────────────────────
// Rewarded Ad Modal
// ────────────────────────────────────────────────
interface RewardedAdModalProps {
  open: boolean;
  onClose: () => void;
  onUnlocked: () => void;
  deviceId: string;
}

function RewardedAdModal({
  open,
  onClose,
  onUnlocked,
  deviceId,
}: RewardedAdModalProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [watching, setWatching] = useState(false);
  const [done, setDone] = useState(false);
  const { actor } = useActor(createActor);

  const startAd = useCallback(() => {
    setWatching(true);
    setCountdown(5);
    const iv = setInterval(() => {
      setCountdown((c) => {
        if (c === null || c <= 1) {
          clearInterval(iv);
          (async () => {
            if (actor) await actor.recordAdWatch(deviceId, "rewarded");
            setDone(true);
            setWatching(false);
          })();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, [actor, deviceId]);

  const handleClaim = () => {
    onUnlocked();
    setDone(false);
    setWatching(false);
    setCountdown(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !watching) {
          setDone(false);
          setCountdown(null);
          onClose();
        }
      }}
    >
      <DialogContent
        className="max-w-sm mx-4 rounded-2xl"
        data-ocid="rewarded_ad.dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-center font-display text-lg">
            {done ? "🎉 Generation Unlocked!" : "Watch a Short Ad"}
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            {done
              ? "You've earned 1 extra generation. Enjoy!"
              : "Watch a 5-second ad to unlock another free generation."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {!watching && !done && (
            <div className="w-full h-28 rounded-xl bg-muted/50 border border-dashed border-border flex items-center justify-center">
              <span className="text-xs text-muted-foreground">
                Ad preview area
              </span>
            </div>
          )}

          {watching && countdown !== null && countdown > 0 && (
            <div className="w-full h-28 rounded-xl gradient-hero border border-border flex flex-col items-center justify-center gap-2">
              <span className="text-3xl font-display font-bold text-foreground">
                {countdown}
              </span>
              <span className="text-xs text-muted-foreground">Ad playing…</span>
            </div>
          )}

          {done && (
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-700" />
            </div>
          )}

          {!watching && !done && (
            <Button
              type="button"
              className="w-full gradient-primary text-primary-foreground font-semibold rounded-xl h-11"
              onClick={startAd}
              data-ocid="rewarded_ad.watch_button"
            >
              <Play className="w-4 h-4 mr-2" /> Watch Ad (5s)
            </Button>
          )}

          {done && (
            <Button
              type="button"
              className="w-full gradient-primary text-primary-foreground font-semibold rounded-xl h-11"
              onClick={handleClaim}
              data-ocid="rewarded_ad.claim_button"
            >
              <Sparkles className="w-4 h-4 mr-2" /> Claim &amp; Generate
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            className="text-xs text-muted-foreground"
            onClick={onClose}
            data-ocid="rewarded_ad.close_button"
            disabled={watching}
          >
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────
export function HomePage() {
  const deviceId = useDeviceId();
  const { actor, isFetching: actorLoading } = useActor(createActor);
  const queryClient = useQueryClient();
  const { data: rateLimit } = useRateLimit();

  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string>("realistic");
  const [gen, setGen] = useState<GenerationState>({
    result: null,
    errorKind: null,
    errorMessage: null,
  });
  const [showAdModal, setShowAdModal] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);

  // Trending prompts query
  const { data: trendingPrompts, isLoading: trendingLoading } = useQuery<
    TrendingPrompt[]
  >({
    queryKey: ["trending", selectedStyle],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTrendingPrompts(null);
    },
    enabled: !!actor && !actorLoading,
    staleTime: 60_000,
  });

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not ready");
      const res = await actor.generateImage(
        prompt.trim(),
        selectedStyle,
        deviceId,
      );
      return res;
    },
    onSuccess: (res) => {
      if (res.__kind__ === "ok") {
        setGen({ result: res.ok, errorKind: null, errorMessage: null });

        queryClient.invalidateQueries({ queryKey: ["rateLimit"] });
        setTimeout(
          () =>
            resultRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            }),
          100,
        );
      } else {
        const err = res.err;
        const kind = err.__kind__ as ErrorKind;
        const msg =
          kind === "ApiError" && "ApiError" in err
            ? (err as { __kind__: "ApiError"; ApiError: string }).ApiError
            : null;
        setGen({ result: null, errorKind: kind, errorMessage: msg });
        if (kind === "RateLimited") setShowAdModal(true);
      }
    },
    onError: () => {
      setGen({
        result: null,
        errorKind: "ApiError",
        errorMessage: "Unexpected error. Please try again.",
      });
    },
  });

  const remaining = rateLimit ? Number(rateLimit.remainingGenerations) : null;
  const dailyLimit = rateLimit ? Number(rateLimit.dailyLimit) : null;
  const canGenerate = prompt.trim().length > 0 && !!actor && !actorLoading;

  const handleGenerate = () => {
    if (!canGenerate) return;
    setGen({ result: null, errorKind: null, errorMessage: null });
    generateMutation.mutate();
  };

  const handleShare = async () => {
    if (!gen.result) return;
    const url = `${window.location.origin}?prompt=${encodeURIComponent(gen.result.prompt)}&style=${gen.result.style}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleDownload = () => {
    if (!gen.result) return;
    const a = document.createElement("a");
    a.href = gen.result.imageUrl;
    a.download = `pixeldream-${gen.result.imageId}.png`;
    a.click();
  };

  const handleTrendingClick = (tp: TrendingPrompt) => {
    setPrompt(tp.promptText);
    setSelectedStyle(tp.style);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const styleLabel =
    STYLE_OPTIONS.find((s) => s.id === selectedStyle)?.label ?? selectedStyle;

  return (
    <div className="max-w-xl mx-auto px-4 pb-12">
      {/* ── Hero ── */}
      <section
        className="gradient-hero -mx-4 px-4 pt-8 pb-7 mb-6"
        data-ocid="hero.section"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 chip-accent rounded-full px-3 py-1 text-xs font-semibold mb-1">
            <Sparkles className="w-3 h-3" /> Free · No Login · Instant
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground leading-tight">
            Turn your words into{" "}
            <span className="text-gradient">stunning AI art</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Free, instant, no login required. Just type a prompt and create.
          </p>
        </div>
      </section>

      {/* ── Generator Card ── */}
      <section
        className="bg-card rounded-2xl border border-border shadow-elevated p-4 space-y-4"
        data-ocid="generator.section"
      >
        {/* Prompt textarea */}
        <div className="space-y-1.5">
          <label
            className="text-xs font-semibold text-foreground/70 uppercase tracking-wider"
            htmlFor="prompt-input"
          >
            Your Prompt
          </label>
          <div className="relative">
            <textarea
              id="prompt-input"
              data-ocid="prompt.textarea"
              className="w-full min-h-[120px] rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-smooth"
              placeholder="A futuristic cityscape at sunset, neon lights reflecting on wet streets, cinematic lighting…"
              maxLength={500}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <span
              className={`absolute bottom-2.5 right-3 text-[10px] font-mono ${
                prompt.length > 450
                  ? "text-destructive"
                  : "text-muted-foreground/50"
              }`}
            >
              {prompt.length}/500
            </span>
          </div>
        </div>

        {/* Style selector */}
        <fieldset className="space-y-2 border-none p-0 m-0">
          <legend className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
            Style
          </legend>
          <div className="flex flex-wrap gap-2">
            {STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                data-ocid={`style.${opt.id}_chip`}
                onClick={() => setSelectedStyle(opt.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-smooth ${
                  selectedStyle === opt.id
                    ? "gradient-primary text-primary-foreground border-transparent shadow-elevated"
                    : "bg-muted/50 text-foreground/70 border-border hover:border-primary/40 hover:text-foreground"
                }`}
                aria-pressed={selectedStyle === opt.id}
              >
                <span aria-hidden>{opt.emoji}</span> {opt.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Rate limit indicator */}
        {remaining !== null && dailyLimit !== null && (
          <div
            className="flex items-center gap-1.5 text-xs"
            data-ocid="rate_limit.indicator"
          >
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                remaining > 2
                  ? "bg-emerald-500"
                  : remaining > 0
                    ? "bg-amber-400"
                    : "bg-destructive"
              }`}
            />
            <span
              className={
                remaining === 0 ? "text-destructive" : "text-muted-foreground"
              }
            >
              {remaining > 0
                ? `${remaining} of ${dailyLimit} free generations remaining today`
                : "Daily limit reached — watch an ad to continue"}
            </span>
          </div>
        )}

        {/* Generate button */}
        <button
          type="button"
          data-ocid="generate.primary_button"
          disabled={!canGenerate || generateMutation.isPending}
          onClick={handleGenerate}
          className="w-full sm:max-w-sm sm:mx-auto sm:block h-12 rounded-xl gradient-primary text-primary-foreground font-display font-semibold text-base shadow-elevated transition-smooth hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Image ⚡ Fast
            </>
          )}
        </button>
      </section>

      {/* ── Image Result / Skeleton ── */}
      {(generateMutation.isPending || gen.result || gen.errorKind) && (
        <section
          ref={resultRef}
          className="mt-5 bg-card rounded-2xl border border-border shadow-elevated overflow-hidden"
          data-ocid="result.section"
        >
          {/* Loading skeleton */}
          {generateMutation.isPending && (
            <div className="p-4 space-y-3" data-ocid="result.loading_state">
              <Skeleton className="w-full aspect-square rounded-xl" />
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
            </div>
          )}

          {/* Error states */}
          {!generateMutation.isPending && gen.errorKind && (
            <div
              className="p-5 flex flex-col items-center gap-3 text-center"
              data-ocid="result.error_state"
            >
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              {gen.errorKind === "ContentViolation" && (
                <>
                  <p className="font-semibold text-foreground">
                    Prompt Not Allowed
                  </p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Your prompt was flagged by our safety filter. Please try a
                    different description.
                  </p>
                </>
              )}
              {gen.errorKind === "RateLimited" && (
                <>
                  <p className="font-semibold text-foreground">
                    Daily Limit Reached
                  </p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    You've used all your free generations for today. Watch a
                    short ad to unlock more.
                  </p>
                  <Button
                    type="button"
                    className="gradient-primary text-primary-foreground rounded-xl"
                    onClick={() => setShowAdModal(true)}
                    data-ocid="result.watch_ad_button"
                  >
                    <Play className="w-4 h-4 mr-2" /> Watch Ad to Continue
                  </Button>
                </>
              )}
              {(gen.errorKind === "QueueFull" ||
                gen.errorKind === "ApiError") && (
                <>
                  <p className="font-semibold text-foreground">Service Busy</p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    {gen.errorMessage ??
                      "Our servers are handling high demand. Please try again in a moment."}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={handleGenerate}
                    data-ocid="result.retry_button"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" /> Try Again
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Success state */}
          {!generateMutation.isPending && gen.result && (
            <div data-ocid="result.success_state">
              <div className="relative">
                <img
                  src={gen.result.imageUrl}
                  alt={gen.result.prompt}
                  className="w-full aspect-square object-cover"
                  loading="lazy"
                />
                {gen.result.isCached && (
                  <span className="absolute top-3 right-3 chip-accent text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    ⚡ Cached
                  </span>
                )}
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <p className="flex-1 text-sm text-foreground/80 leading-snug min-w-0">
                    {gen.result.prompt}
                  </p>
                  <Badge variant="secondary" className="shrink-0 capitalize">
                    {styleLabel}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(
                    Number(gen.result.timestamp) / 1_000_000,
                  ).toLocaleString()}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 rounded-xl h-10 text-sm font-semibold"
                    onClick={handleShare}
                    data-ocid="result.share_button"
                  >
                    <Share2 className="w-4 h-4 mr-1.5" /> Share
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 rounded-xl h-10 text-sm font-semibold"
                    onClick={handleDownload}
                    data-ocid="result.download_button"
                  >
                    <Download className="w-4 h-4 mr-1.5" /> Download
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full h-9 text-xs text-muted-foreground rounded-xl border border-dashed border-border"
                  data-ocid="result.hd_ad_button"
                  onClick={() => setShowAdModal(true)}
                >
                  <Play className="w-3 h-3 mr-1.5 text-accent" /> Watch ad for
                  HD version
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── AdSlot (between result and trending) ── */}
      <AdSlot className="mt-5" label="Display Ad" />

      {/* ── Trending Prompts ── */}
      <section className="mt-6" data-ocid="trending.section">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-accent" />
          <h2 className="font-display font-bold text-base text-foreground">
            Trending Prompts
          </h2>
        </div>

        {trendingLoading ? (
          <div className="space-y-2" data-ocid="trending.loading_state">
            {["s1", "s2", "s3", "s4"].map((k) => (
              <Skeleton key={k} className="h-11 w-full rounded-xl" />
            ))}
          </div>
        ) : trendingPrompts && trendingPrompts.length > 0 ? (
          <div className="space-y-2">
            {trendingPrompts.slice(0, 8).map((tp, i) => (
              <button
                key={`${tp.style}-${tp.promptText.slice(0, 40)}`}
                type="button"
                data-ocid={`trending.item.${i + 1}`}
                className="w-full flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 text-left hover:border-primary/40 hover:shadow-subtle transition-smooth group"
                onClick={() => handleTrendingClick(tp)}
              >
                <span
                  className="w-1 h-6 rounded-full flex-shrink-0 gradient-primary opacity-80 group-hover:opacity-100 transition-smooth"
                  aria-hidden
                />
                <span className="flex-1 text-sm text-foreground/80 leading-snug min-w-0 truncate">
                  {tp.promptText}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] shrink-0 capitalize"
                >
                  {tp.style}
                </Badge>
              </button>
            ))}
          </div>
        ) : (
          <div
            className="bg-muted/40 rounded-xl border border-border px-4 py-6 text-center"
            data-ocid="trending.empty_state"
          >
            <p className="text-sm text-muted-foreground">
              Trending prompts will appear here once images are generated.
            </p>
          </div>
        )}
      </section>

      {/* ── Bottom AdSlot ── */}
      <AdSlot className="mt-6" label="Advertisement" />

      {/* ── Rewarded Ad Modal ── */}
      <RewardedAdModal
        open={showAdModal}
        onClose={() => setShowAdModal(false)}
        onUnlocked={() => {
          setGen({ result: null, errorKind: null, errorMessage: null });
          queryClient.invalidateQueries({ queryKey: ["rateLimit"] });
          toast.success(
            "Generation unlocked! You can generate one more image.",
          );
        }}
        deviceId={deviceId}
      />

      {/* suppress unused var */}
    </div>
  );
}
