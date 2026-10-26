import schoolLogo from "@/assets/school/logo.png.asset.json";

export function Crest({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <img src={schoolLogo.url} alt="GIA school crest" className={`${className} object-contain`} />
  );
}

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Crest className="h-14 w-14 shrink-0" />
      <div className="min-w-0 leading-tight">
        <div className={`font-display text-[13px] font-bold leading-relaxed ${light ? "text-primary-foreground" : "text-primary"}`}>
          Gbonkolenken International Academy
        </div>
        <div className="text-[11px] font-semibold text-gold">Seat of Wisdom</div>
      </div>
    </div>
  );
}
