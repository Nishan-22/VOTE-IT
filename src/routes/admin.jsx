import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  LayoutDashboard,
  Loader2,
  Search
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard · GU Vote Spark" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [newVoter, setNewVoter] = useState({ full_name: "", email: "", student_id: "" });
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [startTime, setStartsAt] = useState("");
  const [endTime, setEndsAt] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || !profile?.is_admin)) {
      toast.error("Unauthorized access");
      router.navigate({ to: "/" });
    }
  }, [authLoading, user, profile, router]);

  const { data: voters, isLoading: votersLoading } = useQuery({
    queryKey: ["eligible_voters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eligible_voters")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.is_admin,
  });

  const { data: stats } = useQuery({
    queryKey: ["admin_stats"],
    queryFn: async () => {
      const [{ count: totalEligible }, { count: totalVotes }] = await Promise.all([
        supabase.from("eligible_voters").select("*", { count: "exact", head: true }),
        supabase.from("votes").select("*", { count: "exact", head: true }),
      ]);
      return { totalEligible, totalVotes };
    },
    enabled: !!profile?.is_admin,
  });

  const handleAddVoter = async (e) => {
    e.preventDefault();
    if (!newVoter.full_name || !newVoter.email || !newVoter.student_id) {
      return toast.error("Please fill all fields");
    }
    setSubmitting(true);
    const { error } = await supabase.from("eligible_voters").insert([newVoter]);
    setSubmitting(false);
    
    if (error) return toast.error(error.message);
    
    toast.success("Voter added to whitelist");
    setNewVoter({ full_name: "", email: "", student_id: "" });
    qc.invalidateQueries({ queryKey: ["eligible_voters"] });
    qc.invalidateQueries({ queryKey: ["admin_stats"] });
  };

  const handleDeleteVoter = async (email) => {
    if (!confirm("Are you sure you want to remove this voter?")) return;
    
    const { error } = await supabase
      .from("eligible_voters")
      .delete()
      .eq("email", email);
      
    if (error) return toast.error(error.message);
    
    toast.success("Voter removed from whitelist");
    qc.invalidateQueries({ queryKey: ["eligible_voters"] });
    qc.invalidateQueries({ queryKey: ["admin_stats"] });
  };

  const { data: electionSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["election_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("election_settings")
        .select("*")
        .eq("id", 1)
        .single();
      if (error) throw error;
      
      if (data.starts_at) setStartsAt(new Date(data.starts_at).toISOString().slice(0, 16));
      if (data.ends_at) setEndsAt(new Date(data.ends_at).toISOString().slice(0, 16));
      
      return data;
    },
    enabled: !!profile?.is_admin,
  });

  const saveSettings = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase
      .from("election_settings")
      .update({ 
        starts_at: startTime ? new Date(startTime).toISOString() : null,
        ends_at: endTime ? new Date(endTime).toISOString() : null 
      })
      .eq("id", 1);
    
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Election schedule updated");
    qc.invalidateQueries({ queryKey: ["election_settings"] });
  };

  const toggleElection = async () => {
    const newStatus = !electionSettings?.is_open;
    
    if (newStatus) {
      const confirmNew = confirm(
        "Opening the election will CLEAR ALL EXISTING VOTES and start a new election cycle. Are you sure?"
      );
      if (!confirmNew) return;

      setSubmitting(true);
      const { error: clearError } = await supabase
        .from("votes")
        .delete()
        .filter("id", "not.eq", "00000000-0000-0000-0000-000000000000");
      
      if (clearError) {
        setSubmitting(false);
        return toast.error("Failed to reset votes: " + clearError.message);
      }
      
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin_stats"] }),
        qc.invalidateQueries({ queryKey: ["eligible_voters"] }),
        qc.invalidateQueries({ queryKey: ["candidates"] })
      ]);
    } else {
      setSubmitting(true);
    }

    const { error } = await supabase
      .from("election_settings")
      .update({ is_open: newStatus })
      .eq("id", 1);
    
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success(newStatus ? "New election cycle started" : "Election closed");
    qc.invalidateQueries({ queryKey: ["election_settings"] });
    qc.invalidateQueries({ queryKey: ["admin_stats"] });
  };

  if (authLoading || votersLoading || settingsLoading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24 text-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4" />
        <div className="font-mono text-xs uppercase tracking-wider">Loading dashboard…</div>
      </div>
    );
  }

  const filteredVoters = voters?.filter(v => 
    v.full_name.toLowerCase().includes(search.toLowerCase()) ||
    v.email.toLowerCase().includes(search.toLowerCase()) ||
    v.student_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-secondary mb-2">
          <ShieldCheck className="h-3.5 w-3.5" /> Admin Control
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight">
          Election <span className="text-gradient-neon">Management</span>
        </h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-10">
        <div className="p-6 glass rounded-2xl border-l-4 border-secondary flex flex-col justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl font-bold">Election Control</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {electionSettings?.is_open 
                ? "The election is currently LIVE. Whitelisted students can cast their ballots." 
                : stats?.totalVotes > 0 
                  ? "The election has ENDED. Results are finalized and voting is disabled."
                  : "The election has NOT STARTED. Click below to begin the voting process."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {electionSettings?.is_open ? (
              <Button 
                onClick={toggleElection}
                disabled={submitting}
                className="h-12 px-8 font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all w-full"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "End Election Now"}
              </Button>
            ) : (
              <Button 
                onClick={toggleElection}
                disabled={submitting}
                className="h-12 px-8 font-bold bg-gradient-neon text-primary-foreground neon-ring transition-all w-full"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : stats?.totalVotes > 0 ? (
                  "Start New Election Cycle"
                ) : (
                  "Open Election Now"
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="p-6 glass rounded-2xl border-l-4 border-primary">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-display text-2xl font-bold">Automatic Schedule</h2>
          </div>
          <form onSubmit={saveSettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="start" className="flex items-center gap-2 text-muted-foreground">
                  <UserPlus className="h-4 w-4 text-primary" /> Start Date & Time
                </Label>
                <div className="relative group">
                  <Input 
                    id="start" 
                    type="datetime-local" 
                    className="h-12 bg-surface/50 border-primary/20 hover:border-primary/40 focus:border-primary transition-all cursor-pointer"
                    value={startTime}
                    onChange={e => setStartsAt(e.target.value)}
                    onClick={(e) => e.target.showPicker?.()}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="end" className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-secondary" /> End Date & Time
                </Label>
                <div className="relative group">
                  <Input 
                    id="end" 
                    type="datetime-local" 
                    className="h-12 bg-surface/50 border-secondary/20 hover:border-secondary/40 focus:border-secondary transition-all cursor-pointer"
                    value={endTime}
                    onChange={e => setEndsAt(e.target.value)}
                    onClick={(e) => e.target.showPicker?.()}
                  />
                </div>
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={submitting}
              className="w-full h-12 bg-primary/10 hover:bg-primary/20 border border-primary/40 text-primary font-bold transition-all"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Election Schedule"}
            </Button>
          </form>
          <p className="mt-4 text-[10px] text-muted-foreground uppercase tracking-widest text-center flex items-center justify-center gap-2">
            <Search className="h-3 w-3" /> System will auto-close voting at end time
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="glass rounded-2xl p-6 border-l-4 border-secondary">
          <div className="flex items-center gap-3 text-muted-foreground mb-3">
            <Users className="h-5 w-5" />
            <span className="font-mono text-xs uppercase tracking-wider">Total Eligible</span>
          </div>
          <div className="font-display text-4xl font-bold">{stats?.totalEligible ?? 0}</div>
        </div>
        <div className="glass rounded-2xl p-6 border-l-4 border-primary">
          <div className="flex items-center gap-3 text-muted-foreground mb-3">
            <LayoutDashboard className="h-5 w-5" />
            <span className="font-mono text-xs uppercase tracking-wider">Votes Cast</span>
          </div>
          <div className="font-display text-4xl font-bold">{stats?.totalVotes ?? 0}</div>
        </div>
        <div className="glass rounded-2xl p-6 border-l-4 border-green-500">
          <div className="flex items-center gap-3 text-muted-foreground mb-3">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            <span className="font-mono text-xs uppercase tracking-wider">Turnout Rate</span>
          </div>
          <div className="font-display text-4xl font-bold">
            {stats?.totalEligible > 0 
              ? Math.round((stats.totalVotes / stats.totalEligible) * 100) 
              : 0}%
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1">
          <div className="glass rounded-2xl p-6 sticky top-24">
            <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-secondary" /> Add New Voter
            </h2>
            <form onSubmit={handleAddVoter} className="space-y-4">
              <div>
                <Label htmlFor="vname">Full Name</Label>
                <Input 
                  id="vname" 
                  placeholder="e.g. John Doe"
                  value={newVoter.full_name}
                  onChange={e => setNewVoter({...newVoter, full_name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="vemail">University Email</Label>
                <Input 
                  id="vemail" 
                  type="email" 
                  placeholder="student@gandakiuniversity.edu.np"
                  value={newVoter.email}
                  onChange={e => setNewVoter({...newVoter, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="vsid">Student ID</Label>
                <Input 
                  id="vsid" 
                  placeholder="GU2023-XXX"
                  value={newVoter.student_id}
                  onChange={e => setNewVoter({...newVoter, student_id: e.target.value})}
                />
              </div>
              <Button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-gradient-neon text-primary-foreground neon-ring mt-2"
              >
                {submitting ? "Processing…" : "Add to Whitelist"}
              </Button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border/40 flex items-center justify-between gap-4 flex-wrap">
              <h2 className="font-display text-xl font-bold">Voter Whitelist</h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search name, ID or email…" 
                  className="pl-10 h-9 text-xs"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface/60 font-mono text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/40">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Student ID</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredVoters?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground text-sm italic">
                        No voters found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredVoters?.map(v => (
                      <tr key={v.email} className="hover:bg-surface/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-sm">{v.full_name}</td>
                        <td className="px-6 py-4 font-mono text-xs">{v.student_id}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{v.email}</td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            onClick={() => handleDeleteVoter(v.email)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
