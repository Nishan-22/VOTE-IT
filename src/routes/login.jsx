import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Vote } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · GU Vote Spark" }] }),
  component: LoginPage,
});

const signUpSchema = z.object({
  full_name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  batch_year: z.number().int().min(1).max(4),
  gender: z.enum(["male", "female", "other"]),
});

function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [lEmail, setLEmail] = useState("");
  const [lPw, setLPw] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [year, setYear] = useState("1");
  const [gender, setGender] = useState("male");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: lEmail.trim(),
      password: lPw,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    router.navigate({ to: "/vote" });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const parsed = signUpSchema.safeParse({
      full_name: name,
      email,
      password: pw,
      batch_year: Number(year),
      gender,
    });
    if (!parsed.success) {
      return toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
    }
    setLoading(true);

    // Eligibility check
    const { data: eligible, error: checkError } = await supabase
      .from("eligible_voters")
      .select("email")
      .eq("email", parsed.data.email.trim())
      .maybeSingle();

    if (checkError) {
      setLoading(false);
      return toast.error("Error verifying eligibility");
    }

    if (!eligible) {
      setLoading(false);
      return toast.error("You are not on the eligible voters list", {
        description: "Please contact the IT Club admin if this is a mistake.",
      });
    }

    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/vote`,
        data: {
          full_name: parsed.data.full_name,
          batch_year: parsed.data.batch_year,
          gender: parsed.data.gender,
        },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — you're in.");
    router.navigate({ to: "/vote" });
  };

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="text-center mb-8">
        <div className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-gradient-neon neon-ring mb-4">
          <Vote className="h-7 w-7 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Access the chain</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use your Gandaki University email to register or sign in.
        </p>
      </div>

      <div className="glass rounded-2xl p-6">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid grid-cols-2 w-full bg-surface">
            <TabsTrigger value="login">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="lemail">Email</Label>
                <Input id="lemail" type="email" value={lEmail} onChange={(e) => setLEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="lpw">Password</Label>
                <Input id="lpw" type="password" value={lPw} onChange={(e) => setLPw(e.target.value)} required />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-neon text-primary-foreground neon-ring hover:opacity-90">
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-6">
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="pw">Password</Label>
                <Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={8} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Batch year</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((y) => (
                        <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-neon text-primary-foreground neon-ring hover:opacity-90">
                {loading ? "Creating…" : "Create account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        By continuing you agree to the IT Club electoral code. <Link to="/" className="underline">Back home</Link>
      </p>
    </div>
  );
}
