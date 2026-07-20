import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Lock, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { z } from "zod";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const searchSchema = z.object({
  plan: z.enum(["basic", "premium"]).default("basic"),
  cycle: z.enum(["monthly", "yearly"]).default("monthly"),
});

export const Route = createFileRoute("/checkout/")({
  head: () => ({
    meta: [
      { title: "Checkout — Lingua Terra" },
      { name: "description", content: "Complete your subscription to unlock the full Lingua Terra library." },
    ],
  }),
  validateSearch: (s) => searchSchema.parse(s),
  component: CheckoutPage,
});

const PLANS = {
  basic: {
    name: "Basic",
    tag: "All written lessons, videos & flashcards",
    monthly: 9,
    yearly: 86,
    features: [
      "All written lessons and native videos",
      "Flashcards, streaks & certificates",
      "Progress tracking across every country",
    ],
  },
  premium: {
    name: "Premium",
    tag: "Everything in Basic + AI tutor",
    monthly: 19,
    yearly: 182,
    features: [
      "Everything in Basic",
      "AI Tutor with live web search",
      "Personalized prep checklists & quizzes",
      "Pronunciation practice",
    ],
  },
} as const;

function CheckoutPage() {
  const { plan, cycle } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    card: "",
    exp: "",
    cvc: "",
    country: "",
    zip: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) setForm((f) => ({ ...f, email: data.user!.email ?? "", fullName: (data.user!.user_metadata?.full_name as string) ?? "" }));
    });
  }, []);

  const p = PLANS[plan as "basic" | "premium"];
  const price = cycle === "yearly" ? p.yearly : p.monthly;
  const priceLabel = cycle === "yearly" ? "/year" : "/month";
  const savings = cycle === "yearly" ? Math.round((1 - p.yearly / (p.monthly * 12)) * 100) : 0;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in first");
      navigate({ to: "/auth", search: { redirect: `/checkout?plan=${plan}&cycle=${cycle}` } as never });
      return;
    }
    if (!form.card.replace(/\s/g, "").match(/^\d{12,19}$/)) return toast.error("Enter a valid card number");
    if (!form.exp.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) return toast.error("Expiry must be MM/YY");
    if (!form.cvc.match(/^\d{3,4}$/)) return toast.error("Invalid CVC");

    setSubmitting(true);
    try {
      const periodEnd = new Date();
      if (cycle === "yearly") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      else periodEnd.setMonth(periodEnd.getMonth() + 1);

      const { error } = await supabase.from("subscriptions").upsert(
        {
          user_id: user.id,
          tier: plan,
          status: "active",
          current_period_end: periodEnd.toISOString(),
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      await qc.invalidateQueries({ queryKey: ["subscription"] });
      toast.success("Subscription activated");
      navigate({ to: "/checkout/success", search: { plan, cycle } as never });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground">← Back to plans</Link>
        <h1 className="mt-3 font-display text-4xl font-semibold md:text-5xl">Complete your checkout</h1>
        <p className="mt-2 text-muted-foreground">Secure payment · Cancel anytime · 7-day money-back guarantee.</p>
      </motion.div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px]">
        {/* Payment form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="rounded-2xl border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">1</span>
              <h2 className="font-display text-xl font-semibold">Contact</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Full name</Label>
                <Input required value={form.fullName} onChange={set("fullName")} placeholder="Jane Doe" />
              </div>
              <div>
                <Label>Email</Label>
                <Input required type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">2</span>
              <h2 className="font-display text-xl font-semibold">Billing cycle</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["monthly", "yearly"] as const).map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => navigate({ to: "/checkout", search: { plan, cycle: c } as never })}
                  className={`rounded-xl border p-4 text-left transition ${cycle === c ? "border-primary bg-primary/5" : "hover:border-foreground/30"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium capitalize">{c}</div>
                    {c === "yearly" && <span className="rounded-full bg-coral/10 px-2 py-0.5 text-xs font-medium text-coral">Save 20%</span>}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    ${c === "yearly" ? p.yearly : p.monthly} {c === "yearly" ? "billed yearly" : "per month"}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">3</span>
              <h2 className="font-display text-xl font-semibold">Payment</h2>
              <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" /> Encrypted</span>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Card number</Label>
                <div className="relative">
                  <Input
                    required
                    inputMode="numeric"
                    value={form.card}
                    onChange={(e) => setForm((f) => ({ ...f, card: e.target.value.replace(/[^\d ]/g, "").slice(0, 23) }))}
                    placeholder="1234 5678 9012 3456"
                    className="pl-10"
                  />
                  <CreditCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Expiry (MM/YY)</Label>
                  <Input required value={form.exp} onChange={set("exp")} placeholder="12/28" maxLength={5} />
                </div>
                <div>
                  <Label>CVC</Label>
                  <Input required value={form.cvc} onChange={set("cvc")} placeholder="123" maxLength={4} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Country</Label>
                  <Input required value={form.country} onChange={set("country")} placeholder="United States" />
                </div>
                <div>
                  <Label>ZIP / Postal</Label>
                  <Input required value={form.zip} onChange={set("zip")} placeholder="94103" />
                </div>
              </div>
            </div>
          </section>

          <Button type="submit" size="lg" disabled={submitting} className="w-full bg-coral text-coral-foreground hover:bg-coral/90">
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</> : <>Pay ${price} {priceLabel}</>}
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> This is a demo checkout — no real charge is made until Stripe is connected.
          </p>
        </form>

        {/* Order summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="font-display text-2xl">{p.name} plan</CardTitle>
              <CardDescription>{p.tag}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-baseline justify-between border-b pb-4">
                <div>
                  <div className="font-display text-4xl font-semibold">${price}</div>
                  <div className="text-sm text-muted-foreground">{priceLabel} · billed {cycle}</div>
                </div>
                {savings > 0 && (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Save {savings}%</span>
                )}
              </div>
              <ul className="space-y-2 text-sm">
                {p.features.map((f: string) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                Switch between Basic and Premium anytime from your Dashboard.
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
