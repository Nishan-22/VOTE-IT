import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Check, LogOut } from "lucide-react";
import { WalletConnect } from "@/components/WalletConnect";

export function SiteHeader() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const nav = [
    { to: "/", label: "Home" },
    { to: "/candidates", label: "Candidates" },
    { to: "/vote", label: "Vote" },
    { to: "/results", label: "Results" },
  ];

  if (profile?.is_admin) {
    nav.push({ to: "/admin", label: "Admin" });
  }

  return (
    <header className="fixed top-6 left-1/2 z-50 w-[95%] max-w-7xl -translate-x-1/2">
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-6 py-4 shadow-2xl backdrop-blur-xl md:px-8">
        <Link to="/" className="group flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg transition-transform group-hover:scale-110">
            <Check className="h-5 w-5 text-white" strokeWidth={3} />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight text-white">
            VOTE<span className="text-purple-500">·</span>IT
          </h1>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={[
                  "relative text-sm font-semibold transition-all duration-300 hover:text-purple-400",
                  active
                    ? "text-purple-500 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:bg-purple-500 after:content-['']"
                    : "text-white/60",
                ].join(" ")}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <WalletConnect compact />
          {user ? (
            <>
              <div className="hidden text-right leading-tight sm:block">
                <div className="text-sm font-medium text-white">{profile?.full_name ?? user.email}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  {profile ? `Year ${profile.batch_year}` : "Loading…"}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sign out"
                className="text-white/70 hover:bg-white/10 hover:text-white"
                onClick={async () => {
                  await signOut();
                  router.navigate({ to: "/" });
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link
              to="/login"
              className="btn-primary flex items-center gap-2 text-sm text-white no-underline"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
