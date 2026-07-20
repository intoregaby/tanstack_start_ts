import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Award, BookOpen, Copy, Users, Gift, Share2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const days = new Set(dates.map((d) => new Date(d).toISOString().slice(0, 10)));
  let n = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  const today = cursor.toISOString().slice(0, 10);
  if (!days.has(today)) cursor.setDate(cursor.getDate() - 1);
  while (days.has(cursor.toISOString().slice(0, 10))) {
    n += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return n;
}

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Lingua Terra" }] }),
  component: DashboardPage,
});

const REFERRAL_GOAL = 3;

function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const { data } = useQuery({
    queryKey: ["dashboard", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [progressRes, subRes, profileRes, referralsRes] = await Promise.all([
        supabase
          .from("progress")
          .select("id, lesson_id, completed_at, lessons(id, title, module_id, modules(course_id, courses(id, title, country_id, countries(name, flag_emoji))))")
          .eq("user_id", user!.id)
          .order("completed_at", { ascending: false }),
        supabase.from("subscriptions").select("tier, status, current_period_end").eq("user_id", user!.id).maybeSingle(),
        supabase.from("profiles").select("name, referral_code, referral_points, reward_claimed_at").eq("id", user!.id).maybeSingle(),
        supabase.from("referrals").select("id, created_at").eq("referrer_id", user!.id),
      ]);
      return {
        progress: progressRes.data ?? [],
        subscription: subRes.data,
        profile: profileRes.data,
        referrals: referralsRes.data ?? [],
      };
    },
  });

  const name = data?.profile?.name || user?.email?.split("@")[0] || "there";
  const streak = computeStreak((data?.progress ?? []).map((p) => p.completed_at as string).filter(Boolean));

  const enrolledCourses = new Map<string, { id: string; title: string; country?: { name: string; flag_emoji: string | null } | null; count: number }>();
  (data?.progress ?? []).forEach((p) => {
    const c = (p.lessons as { modules?: { courses?: { id: string; title: string; countries?: { name: string; flag_emoji: string | null } | null } | null } | null } | null)?.modules?.courses;
    if (!c) return;
    const existing = enrolledCourses.get(c.id) ?? { id: c.id, title: c.title, country: c.countries, count: 0 };
    existing.count += 1;
    enrolledCourses.set(c.id, existing);
  });

  const points = data?.profile?.referral_points ?? 0;
  const referralCode = data?.profile?.referral_code ?? "";
  const rewardClaimed = !!data?.profile?.reward_claimed_at;
  const referralUrl = typeof window !== "undefined" && referralCode ? `${window.location.origin}/?ref=${referralCode}` : "";
  const sub = data?.subscription;
  const subActive = sub?.status === "active" || sub?.status === "trialing";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-4xl font-semibold">Welcome back, {name}.</h1>
        <p className="mt-1 text-muted-foreground">Keep the momentum going.</p>
      </motion.div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Flame className="h-5 w-5 text-coral" />} label="Current streak" value={`${streak} day${streak === 1 ? "" : "s"}`} />
        <StatCard icon={<BookOpen className="h-5 w-5 text-primary" />} label="Lessons completed" value={String(data?.progress.length ?? 0)} />
        <StatCard
          icon={<Award className="h-5 w-5 text-primary" />}
          label="Subscription"
          value={sub?.tier ? `${sub.tier} · ${sub.status}` : "Free"}
          hint={subActive && sub?.current_period_end ? `Renews ${new Date(sub.current_period_end).toLocaleDateString()}` : undefined}
        />
      </div>

      {!subActive && (
        <div className="mt-4 rounded-2xl border border-primary/40 bg-primary/5 p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-semibold">Unlock the full library</div>
              <div className="text-muted-foreground">Upgrade to Basic or Premium to access every paid course.</div>
            </div>
            <Button asChild size="sm"><Link to="/pricing">See plans</Link></Button>
          </div>
        </div>
      )}

      {/* REFERRAL / AFFILIATE PANEL */}
      <section className="mt-10">
        <Card className="overflow-hidden">
          <div className="grid gap-0 md:grid-cols-[1fr_260px]">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Gift className="h-4 w-4" /> Affiliate program
              </div>
              <h2 className="mt-2 font-display text-2xl font-semibold">Invite friends, unlock free Basic</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Share your link. When {REFERRAL_GOAL} friends sign up with it, you get <b>30 days of Basic free</b>.
              </p>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <div className="flex flex-1 items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                  <Share2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{referralUrl || "Loading…"}</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(referralUrl);
                    toast.success("Referral link copied");
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" /> Copy
                </Button>
              </div>

              <div className="mt-5">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>{Math.min(points, REFERRAL_GOAL)} / {REFERRAL_GOAL} friends signed up</span>
                  <span>{rewardClaimed ? "🎉 Reward claimed" : `${Math.max(REFERRAL_GOAL - points, 0)} to go`}</span>
                </div>
                <Progress value={Math.min(100, (points / REFERRAL_GOAL) * 100)} />
              </div>
            </CardContent>

            <div className="flex flex-col items-center justify-center gap-1 bg-primary/10 p-6 text-center">
              <Users className="h-6 w-6 text-primary" />
              <div className="font-display text-4xl font-semibold text-primary">{points}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Points earned</div>
              <div className="mt-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-mono">{referralCode || "…"}</div>
            </div>
          </div>
        </Card>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Your courses</h2>
        {enrolledCourses.size === 0 ? (
          <div className="mt-4 rounded-2xl border-2 border-dashed p-8 text-center">
            <p className="text-muted-foreground">You haven't started a course yet.</p>
            <Link to="/countries" className="mt-3 inline-block text-primary underline">Browse countries →</Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {Array.from(enrolledCourses.values()).map((c) => (
              <Link key={c.id} to="/courses/$courseId" params={{ courseId: c.id }}>
                <Card className="transition hover:-translate-y-0.5 hover:shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 font-display text-lg">
                      {c.country?.flag_emoji} {c.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground">{c.count} lesson{c.count === 1 ? "" : "s"} completed</div>
                    <Progress value={Math.min(100, c.count * 20)} className="mt-2" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="rounded-xl bg-muted p-3">{icon}</div>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="mt-0.5 truncate font-display text-2xl font-semibold capitalize">{value}</div>
          {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
