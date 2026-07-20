import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({
  plan: z.enum(["basic", "premium"]).default("basic"),
  cycle: z.enum(["monthly", "yearly"]).default("monthly"),
});

export const Route = createFileRoute("/checkout/success")({
  head: () => ({ meta: [{ title: "Welcome — Lingua Terra" }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: SuccessPage,
});

function SuccessPage() {
  const { plan, cycle } = Route.useSearch();
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
      >
        <CheckCircle2 className="h-10 w-10 text-primary" />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-6 font-display text-4xl font-semibold md:text-5xl"
      >
        You're in — welcome aboard!
      </motion.h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Your <span className="font-medium capitalize text-foreground">{plan}</span> subscription is now active
        ({cycle}). The full library — every country, course, and lesson — is unlocked.
      </p>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild size="lg" className="bg-coral text-coral-foreground hover:bg-coral/90">
          <Link to="/dashboard">Go to your Dashboard <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/countries">Browse countries</Link>
        </Button>
      </div>

      <div className="mt-12 rounded-2xl border bg-card p-6 text-left">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" /> Next steps
        </div>
        <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>1. Pick a country you're curious about or moving to.</li>
          <li>2. Start with a beginner course — most learners finish the first lesson in 10 minutes.</li>
          <li>3. Use the AI Tutor inside each lesson for live cultural &amp; visa answers.</li>
        </ol>
      </div>
    </div>
  );
}
