interface AdSlotProps {
  label?: string;
  className?: string;
}

export function AdSlot({
  label = "Advertisement",
  className = "",
}: AdSlotProps) {
  return (
    <div
      className={`w-full rounded-xl border border-dashed border-border bg-muted/30 flex items-center justify-center py-4 px-6 min-h-[60px] ${className}`}
      aria-label="Ad placement"
    >
      <span className="text-xs text-muted-foreground/60 font-body tracking-wide uppercase">
        {label}
      </span>
    </div>
  );
}
