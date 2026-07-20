import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Lingua Terra" },
      { name: "description", content: "Basic and Premium plans. Free courses always free." },
    ],
  }),
  component: PricingPage,
});

const tiers = [
  {
    name: "Free",
    price: "$0",
    per: "forever",
    features: ["Free curated YouTube courses", "Global country library", "No account needed"],
    cta: { label: "Browse free", to: "/countries" },
    variant: "outline" as const,
  },
  {
    name: "Basic",
    price: "$9",
    per: "/month",
    features: ["Everything free", "All written lessons", "Native + YouTube videos", "Flashcards & progress", "Streaks & certificates"],
    cta: { label: "Start Basic", to: "/checkout" as const, search: { plan: "basic" as const, cycle: "monthly" as const } },
    variant: "default" as const,
  },
  {
    name: "Premium",
    price: "$19",
    per: "/month",
    features: ["Everything in Basic", "AI Tutor with web search", "Personalized prep checklists", "Pronunciation practice", "Auto-generated quizzes"],
    cta: { label: "Go Premium", to: "/checkout" as const, search: { plan: "premium" as const, cycle: "monthly" as const } },
    variant: "default" as const,
    highlight: true,
  },
];

function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs">
          <Sparkles className="h-3 w-3 text-primary" /> Simple, transparent plans
        </div>
        <h1 className="mt-4 font-display text-5xl font-semibold md:text-6xl">Pick your path</h1>
        <p className="mt-3 text-lg text-muted-foreground">Free courses are always free. Upgrade anytime.</p>
      </motion.div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {tiers.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={t.highlight ? "border-primary shadow-xl relative" : ""}>
              {t.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Most complete
                </div>
              )}
              <CardHeader>
                <CardTitle className="font-display text-2xl">{t.name}</CardTitle>
                <CardDescription>
                  <span className="font-display text-4xl font-semibold text-foreground">{t.price}</span>
                  <span className="text-muted-foreground"> {t.per}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full" variant={t.variant}>
                  {"search" in t.cta ? (
                    <Link to={t.cta.to} search={t.cta.search}>{t.cta.label}</Link>
                  ) : (
                    <Link to={t.cta.to}>{t.cta.label}</Link>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Billing is powered by Stripe. Cancel anytime.
      </p>
    </div>
  );
}
