import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { Crown, Trophy, Users } from "lucide-react";

export const Route = createFileRoute("/results")({
  head: () => ({ meta: [{ title: "Live results · GU Vote Spark" }] }),
  component: ResultsPage,
});

async function fetchTally() {
  const [{ data: candidates }, { data: votes, count }] = await Promise.all([
    supabase.from("candidates").select("*"),
    supabase.from("votes").select("*", { count: "exact" }),
  ]);
  const counts = new Map();
  (votes ?? []).forEach((v) => {
    counts.set(v.president_id, (counts.get(v.president_id) ?? 0) + 1);
    counts.set(v.secretary_id, (counts.get(v.secretary_id) ?? 0) + 1);
    (v.member_ids ?? []).forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  });
  const tally = (candidates ?? []).map((c) => ({
    candidate_id: c.id,
    full_name: c.full_name,
    batch_year: c.batch_year,
    gender: c.gender,
    post: c.post,
    votes: counts.get(c.id) ?? 0,
  }));
  return { tally, totalBallots: count ?? 0 };
}

function ResultsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["tally"], queryFn: fetchTally });

  useEffect(() => {
    const ch = supabase
      .channel("results")
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, () => {
        qc.invalidateQueries({ queryKey: ["tally"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "candidates" }, () => {
        qc.invalidateQueries({ queryKey: ["tally"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const tally = data?.tally ?? [];
  const totalBallots = data?.totalBallots ?? 0;
  const max = Math.max(1, ...tally.map((t) => t.votes));

  const byPost = (p) => tally.filter((t) => t.post === p).sort((a, b) => b.votes - a.votes);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-10">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-secondary flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary pulse-glow" />
            Live · auto-refreshing
          </div>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl font-bold tracking-tight">
            Live <span className="text-gradient-neon">tally</span>
          </h1>
        </div>
        <div className="glass rounded-2xl px-5 py-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Total ballots
          </div>
          <div className="font-display text-3xl font-bold text-gradient-neon">{totalBallots}</div>
        </div>
      </div>

      <ResultBlock title="President" icon={Crown} winners={1} list={byPost("president")} max={max} />
      <ResultBlock title="Secretary" icon={Trophy} winners={1} list={byPost("secretary")} max={max} />
      <ResultBlock title="Members" icon={Users} winners={7} list={byPost("member")} max={max} />
    </div>
  );
}

function ResultBlock({ title, icon: Icon, winners, list, max }) {
  return (
    <section className="mt-12">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4 text-secondary" />
        <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
        <span className="font-mono text-xs text-muted-foreground">
          · top {winners} {winners === 1 ? "wins" : "win"}
        </span>
      </div>
      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
          No candidates.
        </div>
      ) : (
        <div className="glass rounded-2xl divide-y divide-border/60 overflow-hidden">
          {list.map((t, i) => {
            const win = i < winners && t.votes > 0;
            const pct = (t.votes / max) * 100;
            return (
              <div key={t.candidate_id} className="relative p-4 sm:p-5">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-neon opacity-15"
                  style={{ width: `${pct}%` }}
                  aria-hidden
                />
                <div className="relative flex items-center gap-4">
                  <div className="font-mono text-xs w-6 text-muted-foreground">#{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-semibold truncate">{t.full_name}</span>
                      {win && (
                        <span className="font-mono text-[10px] uppercase tracking-wider rounded-full bg-gradient-neon text-primary-foreground px-2 py-0.5">
                          Winner
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Year {t.batch_year} · {t.gender}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl font-bold">{t.votes}</div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      votes
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
