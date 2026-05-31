import { Check, User } from "lucide-react";

const hueFor = (id) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
};

export function CandidateCard({ c, selected, onClick, disabled, badge }) {
  const hue = hueFor(c.id);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "group relative w-full text-left rounded-2xl overflow-hidden transition-all",
        "border bg-surface/40 backdrop-blur-md p-0",
        selected
          ? "border-primary neon-ring -translate-y-0.5"
          : "border-border/60 hover:border-secondary/60 hover:-translate-y-0.5",
        disabled && !selected ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      <div className="aspect-[4/3] w-full bg-surface/60 relative overflow-hidden">
        {c.image_url ? (
          <img 
            src={c.image_url} 
            alt={c.full_name} 
            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center text-primary-foreground/30"
            style={{
              background: `linear-gradient(135deg, oklch(0.3 0.1 ${hue}), oklch(0.4 0.1 ${(hue + 80) % 360}))`,
            }}
          >
            <User className="h-16 w-16" strokeWidth={1} />
          </div>
        )}

        {selected && (
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center backdrop-blur-[1px]">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-neon shadow-lg shadow-primary/20">
              <Check className="h-7 w-7 text-primary-foreground" strokeWidth={3} />
            </div>
          </div>
        )}

        {badge && (
          <div className="absolute top-3 left-3 rounded-full bg-surface/80 backdrop-blur-md border border-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-secondary shadow-xl">
            {badge}
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Year {c.batch_year} · {c.gender}
          </div>
        </div>
        <div className="font-display text-lg font-bold truncate">{c.full_name}</div>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed italic opacity-80">
          "{c.manifesto}"
        </p>
      </div>
    </button>
  );
}