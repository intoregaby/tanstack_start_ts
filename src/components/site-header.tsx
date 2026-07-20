import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Globe2, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Session } from "@supabase/supabase-js";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/countries", label: "Countries" },
  { to: "/courses", label: "Courses" },
  { to: "/events", label: "Events" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
];

export function SiteHeader() {
  const [session, setSession] = useState<Session | null>(null);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hide the site chrome on the admin dashboard for a focused workspace look.
  if (pathname.startsWith("/admin")) return null;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "sticky top-0 z-40 w-full border-b transition-all",
        scrolled ? "border-border/60 bg-background/80 backdrop-blur-lg" : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src="/logo/logo-removebg-preview.png"
            alt="Lingua Terra"
            className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
          />
          <span className="font-display text-xl font-semibold tracking-tight">Lingua Terra</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "bg-accent text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="bg-coral text-coral-foreground hover:bg-coral/90">
                <Link to="/pricing">Start learning</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-md md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t bg-background/95 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              {session ? (
                <>
                  <Button asChild size="sm" className="flex-1"><Link to="/dashboard">Dashboard</Link></Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}>Sign out</Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" size="sm" className="flex-1"><Link to="/auth">Sign in</Link></Button>
                  <Button asChild size="sm" className="flex-1 bg-coral text-coral-foreground"><Link to="/pricing">Start</Link></Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.header>
  );
}
