import { Sparkles } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-subtle">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-elevated">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-bold text-lg leading-none text-foreground">
                PixelDream
              </span>
              <span className="text-gradient font-display font-bold text-lg leading-none">
                AI
              </span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground font-body">
            Free · No login
          </span>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-muted/40 border-t border-border mt-8">
        <div className="max-w-xl mx-auto px-4 py-5 flex flex-col items-center gap-1">
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors duration-200"
            >
              caffeine.ai
            </a>
          </p>
          <p className="text-xs text-muted-foreground/60">
            AI-generated images are for creative use only.
          </p>
        </div>
      </footer>
    </div>
  );
}
