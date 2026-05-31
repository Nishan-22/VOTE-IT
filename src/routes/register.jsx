import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, AlertTriangle, ImagePlus, Loader2 } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Register as candidate · GU Vote Spark" }] }),
  component: RegisterPage,
});

const schema = z.object({
  post: z.enum(["president", "secretary", "member"]),
  manifesto: z.string().trim().min(20).max(500),
  wallet: z.string().trim().max(64).optional(),
});

function RegisterPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState("member");
  const [manifesto, setManifesto] = useState("");
  const [wallet, setWallet] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.navigate({ to: "/login" });
  }, [loading, user, router]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        return toast.error("Image size must be less than 2MB");
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  if (!user || !profile) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center text-muted-foreground">
        Loading your voter profile…
      </div>
    );
  }

  const isFourthYear = profile.batch_year === 4;

  const submit = async (e) => {
    e.preventDefault();
    if (!imageFile) return toast.error("Please upload a profile photo");
    
    const parsed = schema.safeParse({ post, manifesto, wallet: wallet || undefined });
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
    
    if (post === "president" && !isFourthYear) {
      return toast.error("Only 4th-year students may run for President");
    }

    setSubmitting(true);

    try {
      // 1. Upload image to Supabase Storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('candidate-photos')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('candidate-photos')
        .getPublicUrl(fileName);

      // 2. Insert candidate record
      const { error } = await supabase.from("candidates").insert({
        user_id: user.id,
        full_name: profile.full_name,
        batch_year: profile.batch_year,
        gender: profile.gender,
        post: parsed.data.post,
        manifesto: parsed.data.manifesto,
        image_url: publicUrl,
        wallet_address: parsed.data.wallet ?? null,
      });

      if (error) throw error;

      toast.success("Nomination registered");
      router.navigate({ to: "/candidates" });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="mb-8">
        <Link to="/candidates" className="font-mono text-xs uppercase tracking-[0.2em] text-secondary">
          ← Candidates
        </Link>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">
          Run for the <span className="text-gradient-neon">Committee</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every candidate is required to upload a professional profile photo.
        </p>
      </div>

      <form onSubmit={submit} className="glass rounded-2xl p-6 space-y-5">
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="relative group">
            <div className="h-32 w-32 rounded-2xl overflow-hidden border-2 border-dashed border-border/60 bg-surface/40 flex items-center justify-center">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus className="h-8 w-8 text-muted-foreground opacity-40" />
              )}
            </div>
            <label 
              htmlFor="image-upload" 
              className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl text-[10px] font-bold uppercase tracking-widest text-white"
            >
              Upload Photo
            </label>
            <input 
              id="image-upload" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageChange} 
            />
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Max size: 2MB (JPG/PNG)
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/60 bg-surface/40 p-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Name</div>
            <div className="font-medium truncate">{profile.full_name}</div>
          </div>
          <div className="rounded-xl border border-border/60 bg-surface/40 p-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Batch</div>
            <div className="font-medium">Year {profile.batch_year} · {profile.gender}</div>
          </div>
        </div>

        <div>
          <Label>Post</Label>
          <Select value={post} onValueChange={setPost}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="president" disabled={!isFourthYear}>
                President {isFourthYear ? "" : "· 4th year only"}
              </SelectItem>
              <SelectItem value="secretary">Secretary</SelectItem>
              <SelectItem value="member">Member</SelectItem>
            </SelectContent>
          </Select>
          {post === "president" && !isFourthYear && (
            <div className="mt-2 flex items-start gap-2 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5" />
              <span>Only 4th-year students are eligible.</span>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="m">Manifesto</Label>
          <Textarea
            id="m"
            value={manifesto}
            onChange={(e) => setManifesto(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="What will you do for the IT Club?"
          />
          <div className="mt-1 text-right font-mono text-[10px] text-muted-foreground">
            {manifesto.length}/500
          </div>
        </div>

        <div>
          <Label htmlFor="w">Wallet address (optional)</Label>
          <Input
            id="w"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="0x…"
            className="font-mono"
          />
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-12 bg-gradient-neon text-primary-foreground neon-ring hover:opacity-90"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Sparkles className="h-4 w-4 mr-1" />
          )}
          {submitting ? "Processing…" : "Submit nomination"}
        </Button>
      </form>
    </div>
  );
}
