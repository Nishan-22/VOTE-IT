import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight,
  BarChart3,
  Check,
  Eye,
  Lock,
  Megaphone,
  Shield,
  ShieldCheck,
  Users,
  Wallet,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VOTE·IT — GU IT Club Elections" },
      {
        name: "description",
        content:
          "Digital voting platform for the Gandaki University IT Club. Transparent, secure, and verifiable.",
      },
    ],
  }),
  component: Index,
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
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/15 border border-secondary/30 text-secondary font-mono text-[10px] font-bold uppercase tracking-wider">
      <Clock className="h-3 w-3" />
      Ends in: {timeLeft}
    </div>
  );
}

const TRUST = [
  { label: "Secure", color: "text-purple-400", Icon: ShieldCheck },
  { label: "Verifiable", color: "text-blue-400", Icon: Users },
  { label: "Transparent", color: "text-cyan-400", Icon: Eye },
  { label: "Immutable", color: "text-yellow-400", Icon: Lock },
];

const STATS = [
  {
    val: "9",
    label: "Total seats",
    desc: "President, Secretary & Members",
    color: "bg-purple-500/20",
    Icon: Users,
  },
  {
    val: "7",
    label: "Members",
    desc: "Required on every ballot",
    color: "bg-blue-500/20",
    Icon: BarChart3,
  },
  {
    val: "2",
    label: "Female min.",
    desc: "Among member picks",
    color: "bg-cyan-500/20",
    Icon: Shield,
  },
  {
    val: "1",
    label: "Vote",
    desc: "One ballot per student",
    color: "bg-yellow-500/20",
    Icon: Check,
  },
];

function Index() {
  const { data: electionSettings } = useQuery({
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

  const { data: stats } = useQuery({
    queryKey: ["admin_stats"],
    queryFn: async () => {
      const [{ count: totalVotes }] = await Promise.all([
        supabase.from("votes").select("*", { count: "exact", head: true }),
      ]);
      return { totalVotes };
    },
  });

  const isLive = electionSettings?.is_open;
  const isEnded = !isLive && (stats?.totalVotes > 0);

  return (
    <div className="overflow-x-hidden text-white">
      <main className="relative mx-auto max-w-7xl px-6 pb-20 pt-8 md:px-12">
        <div
          className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]"
          aria-hidden
        />
        <div
          className="absolute bottom-0 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[120px]"
          aria-hidden
        />

        <div className="grid min-h-[70vh] items-center gap-12 lg:grid-cols-2">
          <div className="animate-fade-in space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2">
              <span className={`h-2 w-2 rounded-full ${isLive ? "animate-pulse bg-green-500" : "bg-purple-500"}`} />
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
                IT Club Elections {isLive ? "• LIVE" : isEnded ? "• ENDED" : ""}
              </span>
            </div>

            <h1 className="text-5xl font-black leading-tight tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
              Your Vote. <br />
              Your <span className="text-gradient">Future.</span>
            </h1>

            <p className="max-w-lg text-lg font-medium leading-relaxed text-white/60">
              VOTE·IT is the official election portal for the Gandaki University IT Club.
              Transparent, secure, and wallet-bound digital voting.
            </p>

            <div className="flex flex-wrap gap-4">
              {isEnded ? (
                <Link to="/results" className="btn-primary flex items-center gap-2 text-white no-underline bg-gradient-to-r from-green-600 to-blue-600">
                  <span>View Final Results</span>
                  <BarChart3 className="h-5 w-5" />
                </Link>
              ) : (
                <Link to="/vote" className={`btn-primary flex items-center gap-2 text-white no-underline ${!isLive ? "opacity-50" : ""}`}>
                  <span>{isLive ? "Cast your ballot" : "Voting opens soon"}</span>
                  <Wallet className="h-5 w-5" />
                </Link>
              )}
              <Link to="/candidates" className="btn-secondary flex items-center gap-2 text-white no-underline">
                <span>View candidates</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="flex flex-wrap gap-8 pt-4">
              {TRUST.map(({ label, color, Icon }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${color}`} />
                  <span className="text-xs font-bold uppercase tracking-widest text-white/60">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-float relative flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 blur-[100px]"
              aria-hidden
            />
            <div className="glass-card relative flex h-80 w-80 items-center justify-center border-white/20 p-8 md:h-96 md:w-96">
              <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-white/20">
                <div className="animate-shimmer absolute inset-0" aria-hidden />
                <div className="relative z-10 flex h-48 w-48 flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-purple-600 to-blue-700 p-4 text-center shadow-2xl">
                  <Lock className="mb-2 h-20 w-20 text-white" strokeWidth={1.5} />
                  <span className="text-2xl font-black uppercase tracking-tighter">VOTE</span>
                </div>
                <div className="glass-card absolute top-4 right-4 flex h-12 w-12 animate-bounce items-center justify-center">
                  <Check className="h-6 w-6 text-cyan-400" strokeWidth={2} />
                </div>
                <div className="glass-card absolute bottom-8 left-4 flex h-10 w-16 animate-pulse items-center justify-center">
                  <div className="flex gap-1">
                    <div className="h-4 w-1 bg-purple-500" />
                    <div className="h-6 w-1 bg-blue-500" />
                    <div className="h-3 w-1 bg-cyan-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card group mt-20 flex cursor-pointer flex-col items-center justify-between gap-6 p-6 transition-all hover:border-purple-500/30 md:flex-row md:p-8">
          <div className="flex items-center gap-6">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 ${
              isLive ? "bg-secondary/20 text-secondary" : isEnded ? "bg-green-500/20 text-green-400" : "bg-purple-500/20 text-purple-400"
            }`}>
              <Megaphone className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold">
                  Election {isLive ? "is LIVE" : isEnded ? "has ENDED" : "Announcement"}
                </h3>
                {isLive && <CountdownTimer endsAt={electionSettings?.ends_at} />}
              </div>
              <p className="text-white/50">
                {isLive 
                  ? "Voting is now open. Connect your wallet and cast your ballot for the IT Club committee." 
                  : isEnded
                    ? "The 2026 IT Club election has concluded. You can now view the finalized results."
                    : "IT Club Elections 2026 are approaching. Register, nominate, and stay tuned for the voting window."}
              </p>
            </div>
          </div>
          <Link
            to={isLive ? "/vote" : isEnded ? "/results" : "/login"}
            className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/40 no-underline transition-colors group-hover:text-white"
          >
            <span>{isLive ? "Vote Now" : isEnded ? "View Results" : "Get started"}</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STATS.map(({ val, label, desc, color, Icon }) => (
            <div key={label} className="glass-card glass-card-hover group p-8">
              <div
                className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl ${color} transition-transform group-hover:scale-110`}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-1">
                <h4 className="text-3xl font-black">{val}</h4>
                <p className="text-gradient text-sm font-bold uppercase tracking-widest">{label}</p>
                <p className="pt-2 text-xs font-medium text-white/40">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
