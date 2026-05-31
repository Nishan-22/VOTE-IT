import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CandidateCard } from "@/components/CandidateCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/candidates")({
  head: () => ({ meta: [{ title: "Candidates · GU Vote Spark" }] }),
  component: CandidatesPage,
});

function CandidatesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["candidates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const groups = [
    { key: "president", title: "President", subtitle: "4th-year students only · 1 seat" },
    { key: "secretary", title: "Secretary", subtitle: "Any batch · 1 seat" },
    { key: "member", title: "Members", subtitle: "7 seats · ≥ 2 female mandatory" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-10">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-secondary">Roster</div>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl font-bold tracking-tight">
            Meet the <span className="text-gradient-neon">candidates</span>
          </h1>
        </div>
        <Button asChild className="bg-gradient-neon text-primary-foreground neon-ring hover:opacity-90">
          <Link to="/register"><Plus className="h-4 w-4 mr-1" /> Run for a post</Link>
        </Button>
      </div>

      {isLoading && (
        <div className="grid md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-surface/40 border border-border/60 shimmer" />
          ))}
        </div>
      )}

      {!isLoading && data && (
        <div className="space-y-12">
          {groups.map((g) => {
            const list = data.filter((c) => c.post === g.key);
            return (
              <section key={g.key}>
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold tracking-tight">{g.title}</h2>
                    <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      {g.subtitle}
                    </p>
                  </div>
                  <div className="font-mono text-xs text-secondary">
                    {list.length} {list.length === 1 ? "nominee" : "nominees"}
                  </div>
                </div>
                {list.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
                    No nominees yet for this post.
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {list.map((c) => (
                      <CandidateCard key={c.id} c={c} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
