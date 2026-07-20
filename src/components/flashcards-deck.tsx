import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Flashcard = { id: string; term: string; translation: string; example_sentence: string | null };

// Simple SM-2-lite: quality good → double interval; bad → 1 day.
function nextReview(good: boolean, currentInterval: number) {
  const next = good ? Math.max(1, currentInterval * 2) : 1;
  const d = new Date();
  d.setDate(d.getDate() + next);
  return { interval: next, dueAt: d.toISOString() };
}

export function FlashcardsDeck({ cards, userId }: { cards: Flashcard[]; userId?: string }) {
  const qc = useQueryClient();
  const { data: progress = {} } = useQuery({
    queryKey: ["flashcard_progress", userId, cards.map((c) => c.id).join(",")],
    enabled: !!userId && cards.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("flashcard_progress")
        .select("flashcard_id, interval_days, due_at")
        .in("flashcard_id", cards.map((c) => c.id));
      const map: Record<string, { interval: number; due: string }> = {};
      (data ?? []).forEach((r) => (map[r.flashcard_id] = { interval: r.interval_days, due: r.due_at }));
      return map;
    },
  });

  const dueCards = useMemo(() => {
    if (cards.length === 0) return [];
    const now = Date.now();
    // Cards due first, then unseen, then not yet due.
    return [...cards].sort((a, b) => {
      const ap = progress[a.id];
      const bp = progress[b.id];
      const ad = ap ? new Date(ap.due).getTime() : 0;
      const bd = bp ? new Date(bp.due).getTime() : 0;
      const aDue = ad <= now ? 0 : ad;
      const bDue = bd <= now ? 0 : bd;
      return aDue - bDue;
    });
  }, [cards, progress]);

  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const current = dueCards[i];

  const review = useMutation({
    mutationFn: async ({ good }: { good: boolean }) => {
      if (!userId || !current) return;
      const cur = progress[current.id]?.interval ?? 0;
      const { interval, dueAt } = nextReview(good, cur);
      await supabase.from("flashcard_progress").upsert(
        {
          user_id: userId,
          flashcard_id: current.id,
          interval_days: interval,
          due_at: dueAt,
          last_reviewed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,flashcard_id" }
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flashcard_progress"] });
      setFlipped(false);
      setI((prev) => (prev + 1) % Math.max(1, dueCards.length));
    },
  });

  if (cards.length === 0) {
    return <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No flashcards for this lesson yet.</CardContent></Card>;
  }

  if (!current) return null;

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">Card {i + 1} of {dueCards.length}</div>
      <div className="relative h-64 w-full" style={{ perspective: 1000 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id + String(flipped)}
            initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: flipped ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 cursor-pointer"
            onClick={() => setFlipped((f) => !f)}
          >
            <Card className="flex h-full items-center justify-center bg-gradient-to-br from-card to-primary/5">
              <CardContent className="p-6 text-center">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{flipped ? "Meaning" : "Term"}</div>
                <div className="mt-3 font-display text-3xl font-semibold">
                  {flipped ? current.translation : current.term}
                </div>
                {flipped && current.example_sentence && (
                  <div className="mt-3 text-sm italic text-muted-foreground">"{current.example_sentence}"</div>
                )}
                <div className="mt-4 flex items-center justify-center gap-1 text-[10px] text-muted-foreground"><RotateCcw className="h-2.5 w-2.5" />Tap to flip</div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
      {!userId ? (
        <p className="text-center text-xs text-muted-foreground">Sign in to save your spaced-repetition progress.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => review.mutate({ good: false })} disabled={review.isPending}>
            <X className="mr-1 h-4 w-4" />Again
          </Button>
          <Button onClick={() => review.mutate({ good: true })} disabled={review.isPending}>
            <Check className="mr-1 h-4 w-4" />Got it
          </Button>
        </div>
      )}
    </div>
  );
}
