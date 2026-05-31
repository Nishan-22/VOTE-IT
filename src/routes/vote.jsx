import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CandidateCard } from "@/components/CandidateCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ShieldCheck, AlertTriangle, Loader2, Clock } from "lucide-react";
import { useWeb3 } from "@/lib/web3";
import { WalletConnect } from "@/components/WalletConnect";
import { ACTIVE_CHAIN } from "@/lib/ballot-contract";

export const Route = createFileRoute("/vote")({
  head: () => ({ meta: [{ title: "Cast your ballot · GU Vote Spark" }] }),
  component: VotePage,
});

function CountdownTimer({ endsAt }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!endsAt) return;

    const update = () => {
      const now = new Date();
      const end = new Date(endsAt);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Election has ended");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const parts = [];
      if (hours > 0) parts.push(`${hours}h`);
      if (mins > 0 || hours > 0) parts.push(`${mins}m`);
      parts.push(`${secs}s`);
      
      setTimeLeft(parts.join(" "));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (!endsAt) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/15 border border-secondary/30 text-secondary font-mono text-[10px] font-bold uppercase tracking-wider animate-pulse">
      <Clock className="h-3 w-3" />
      Ends in: {timeLeft}
    </div>
  );
}

function VotePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { address, chainId } = useWeb3();
  const [presidentId, setPresidentId] = useState(null);
  const [secretaryId, setSecretaryId] = useState(null);
  const [memberIds, setMemberIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.navigate({ to: "/login" });
  }, [loading, user, router]);

  const { data: candidates, isLoading } = useQuery({
    queryKey: ["candidates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: electionSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["election_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("election_settings")
        .select("*")
        .eq("id", 1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const isLive = useMemo(() => {
    if (!electionSettings || !electionSettings.is_open) return false;
    const now = new Date();
    if (electionSettings.starts_at && now < new Date(electionSettings.starts_at)) return false;
    if (electionSettings.ends_at && now > new Date(electionSettings.ends_at)) return false;
    return true;
  }, [electionSettings]);

  const statusMessage = useMemo(() => {
    if (!electionSettings) return "";
    if (!electionSettings.is_open) return "The administrator has closed the election.";
    const now = new Date();
    if (electionSettings.starts_at && now < new Date(electionSettings.starts_at)) {
      return `Voting has not started yet. It will open at ${new Date(electionSettings.starts_at).toLocaleString()}.`;
    }
    if (electionSettings.ends_at && now > new Date(electionSettings.ends_at)) {
      return `Voting ended automatically at ${new Date(electionSettings.ends_at).toLocaleString()}.`;
    }
    return "";
  }, [electionSettings]);

  if (isLoading || loading || settingsLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        <div className="mt-3 font-mono text-xs uppercase tracking-wider">Loading ballot…</div>
      </div>
    );
  }

  if (!isLive) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <div className="inline-grid h-16 w-16 place-items-center rounded-2xl bg-surface border border-border/60 mb-6">
          <ShieldCheck className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Voting is currently unavailable</h1>
        <p className="mt-3 text-muted-foreground">{statusMessage}</p>
        <Button asChild variant="outline" className="mt-8">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    );
  }

  const { data: existingVote } = useQuery({
    queryKey: ["my-vote", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("votes")
        .select("*")
        .eq("voter_id", user.id)
        .maybeSingle();
      return data;
    },
  });

  const presidents = useMemo(() => candidates?.filter((c) => c.post === "president") ?? [], [candidates]);
  const secretaries = useMemo(() => candidates?.filter((c) => c.post === "secretary") ?? [], [candidates]);
  const members = useMemo(() => candidates?.filter((c) => c.post === "member") ?? [], [candidates]);

  const memberSet = new Set(memberIds);
  const femaleCount = members.filter((m) => memberSet.has(m.id) && m.gender === "female").length;

  const toggleMember = (id) => {
    setMemberIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 7) {
        toast.warning("You've already selected 7 members. Deselect one first.");
        return prev;
      }
      return [...prev, id];
    });
  };

  const presOk = !!presidentId;
  const secOk = !!secretaryId;
  const membersOk = memberIds.length === 7;
  const femaleOk = femaleCount >= 2;
  const walletOk = !!address && chainId === ACTIVE_CHAIN.id;
  const allOk = presOk && secOk && membersOk && femaleOk && walletOk;

  const totalSteps = 5;
  const stepsDone = [presOk, secOk, membersOk, femaleOk, walletOk].filter(Boolean).length;
  const progress = (stepsDone / totalSteps) * 100;

  const submit = async () => {
    if (!allOk || !user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("votes").insert({
        voter_id: user.id,
        president_id: presidentId,
        secretary_id: secretaryId,
        member_ids: memberIds,
      });
      if (error) throw error;

      toast.success("Ballot sealed 🎉", {
        description: `Linked to wallet ${address.slice(0, 6)}…${address.slice(-4)}`,
      });
      router.navigate({ to: "/results" });
    } catch (err) {
      toast.error(err?.message ?? "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (existingVote) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <div className="inline-grid h-16 w-16 place-items-center rounded-2xl bg-gradient-neon neon-ring mb-6">
          <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Your ballot is sealed</h1>
        <p className="mt-3 text-muted-foreground">
          You've already voted in this election. Each account gets exactly one ballot.
        </p>
        <Button asChild className="mt-8 bg-gradient-neon text-primary-foreground neon-ring hover:opacity-90">
          <Link to="/results">View live results →</Link>
        </Button>
      </div>
    );
  }

  const insufficient =
    presidents.length === 0 || secretaries.length === 0 || members.length < 7;

  if (insufficient) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <AlertTriangle className="h-8 w-8 mx-auto text-secondary" />
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">
          Not enough candidates yet
        </h1>
        <p className="mt-3 text-muted-foreground">
          The election needs at least 1 president, 1 secretary, and 7 member nominees to open.
        </p>
        <Button asChild className="mt-8 bg-gradient-neon text-primary-foreground neon-ring hover:opacity-90">
          <Link to="/register">Run for a post →</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="sticky top-[73px] z-30 glass rounded-2xl p-5 mb-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-secondary">
                Ballot compliance
              </div>
              <CountdownTimer endsAt={electionSettings?.ends_at} />
            </div>
            <div className="font-display text-xl font-bold mt-1">
              {stepsDone}/{totalSteps} rules satisfied
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!walletOk && <WalletConnect />}
            <Button
              onClick={submit}
              disabled={!allOk || submitting}
              className="h-11 px-6 bg-gradient-neon text-primary-foreground neon-ring hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ShieldCheck className="h-4 w-4 mr-1" />
              {submitting ? "Submitting…" : "Submit ballot"}
            </Button>
          </div>
        </div>
        <Progress value={progress} className="mt-4 h-2" />
        <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2">
          <Rule ok={presOk} label="President picked" />
          <Rule ok={secOk} label="Secretary picked" />
          <Rule ok={membersOk} label={`${memberIds.length}/7 members`} />
          <Rule ok={femaleOk} label={`${femaleCount}/2 female members`} />
          <Rule ok={walletOk} label={walletOk ? "Wallet ready" : "Wallet not ready"} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Your wallet on <span className="font-mono text-foreground">{ACTIVE_CHAIN.name}</span> binds
          this ballot to your digital identity for secure, verifiable voting.
        </p>
      </div>

      <Section title="President" subtitle="Pick exactly 1 · 4th-year only" count={`${presOk ? 1 : 0}/1`} ok={presOk}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {presidents.map((c) => (
            <CandidateCard
              key={c.id}
              c={c}
              selected={presidentId === c.id}
              onClick={() => setPresidentId(presidentId === c.id ? null : c.id)}
            />
          ))}
        </div>
      </Section>

      <Section title="Secretary" subtitle="Pick exactly 1" count={`${secOk ? 1 : 0}/1`} ok={secOk}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {secretaries.map((c) => (
            <CandidateCard
              key={c.id}
              c={c}
              selected={secretaryId === c.id}
              onClick={() => setSecretaryId(secretaryId === c.id ? null : c.id)}
            />
          ))}
        </div>
      </Section>

      <Section
        title="Members"
        subtitle="Pick exactly 7 · at least 2 female"
        count={`${memberIds.length}/7 · ${femaleCount}♀`}
        ok={membersOk && femaleOk}
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((c) => {
            const isSel = memberSet.has(c.id);
            const full = memberIds.length >= 7 && !isSel;
            return (
              <CandidateCard
                key={c.id}
                c={c}
                selected={isSel}
                disabled={full}
                badge={c.gender === "female" ? "Female" : undefined}
                onClick={() => toggleMember(c.id)}
              />
            );
          })}
        </div>
      </Section>

      <div className="mt-12 flex justify-end">
        <Button
          onClick={submit}
          disabled={!allOk || submitting}
          className="h-12 px-8 bg-gradient-neon text-primary-foreground neon-ring hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ShieldCheck className="h-4 w-4 mr-1" />
          {submitting ? "Submitting…" : "Submit ballot"}
        </Button>
      </div>
    </div>
  );
}

function Rule({ ok, label }) {
  return (
    <div
      className={[
        "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-mono uppercase tracking-wider",
        ok
          ? "bg-secondary/15 text-secondary border border-secondary/30"
          : "bg-surface/60 text-muted-foreground border border-border/60",
      ].join(" ")}
    >
      <span className={["h-2 w-2 rounded-full", ok ? "bg-secondary" : "bg-muted-foreground/40"].join(" ")} />
      {label}
    </div>
  );
}

function Section({ title, subtitle, count, ok, children }) {
  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            {subtitle}
          </p>
        </div>
        <div
          className={[
            "font-mono text-xs px-3 py-1 rounded-full",
            ok ? "bg-secondary/15 text-secondary" : "bg-surface text-muted-foreground",
          ].join(" ")}
        >
          {count}
        </div>
      </div>
      {children}
    </section>
  );
}
