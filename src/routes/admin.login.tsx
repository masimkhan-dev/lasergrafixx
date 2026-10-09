import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useAuth";
import logo from "@/assets/laser-grafix-logo-transparent.png";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Staff Login — Laser Grafix POS" },
      { name: "description", content: "Sign in to the Laser Grafix clinic point-of-sale system." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Staff Login — Laser Grafix POS" },
      { property: "og:description", content: "Clinic staff access to the Laser Grafix POS." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/admin", replace: true });
  }, [session, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/admin`,
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Account created — check your email to confirm, then sign in.");
          setMode("signin");
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-pos-bg lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.72fr)]">
      <div className="relative hidden overflow-hidden bg-pos-sidebar lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="h-1 w-20 bg-primary" />
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase text-lotus-sage">Laser Grafix · Peshawar</p>
          <h1 className="mt-5 text-5xl leading-tight font-semibold text-pos-sidebar-active">
            Fast, focused clinic operations.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-pos-sidebar-text">
            Sales, customers, payments and receipts in one secure workspace.
          </p>
        </div>
        <p className="text-xs text-pos-sidebar-text">Skin &amp; Hair · Advanced Care</p>
      </div>
      <div className="flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm rounded-lg border border-pos-border bg-pos-card p-8 shadow-card">
        <img
          src={logo}
          alt="Laser Grafix"
          width={56}
          height={56}
          className="h-14 w-auto object-contain"
        />
        <p className="mt-4 font-display text-xl font-semibold">Laser Grafix</p>
        <p className="mt-1 text-sm text-pos-text-muted">Clinic POS · Staff access</p>

        <form className="mt-8 space-y-4" onSubmit={submit}>
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary-hover"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <Button
          type="button"
          variant="link"
          className="mt-6 w-full text-xs text-pos-text-muted"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin"
            ? "First time setup — create the clinic account"
            : "Back to sign in"}
        </Button>
        <p className="mt-4 text-center text-[11px] leading-relaxed text-pos-text-muted">
          The first account created becomes the admin. Additional staff accounts should be created
          by the admin only.
        </p>
      </div>
      </div>
    </div>
  );
}
