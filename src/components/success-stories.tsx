import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X, Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Story = {
  id: string;
  name: string;
  role: string | null;
  quote: string;
  youtube_video_id: string;
  avatar_url: string | null;
};

export function SuccessStories() {
  const { data: stories = [] } = useQuery({
    queryKey: ["success-stories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("success_stories")
        .select("id, name, role, quote, youtube_video_id, avatar_url")
        .eq("is_published", true)
        .order("display_order");
      if (error) throw error;
      return (data ?? []) as Story[];
    },
  });

  const [playing, setPlaying] = useState<Story | null>(null);
  if (stories.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-sm font-semibold uppercase tracking-widest text-primary">Success stories</div>
          <h2 className="mt-2 font-display text-3xl font-semibold md:text-4xl">Real journeys from learners abroad</h2>
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stories.map((s, i) => (
          <motion.button
            key={s.id}
            onClick={() => setPlaying(s)}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card p-5 text-left transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="relative">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
                <img
                  src={`https://i.ytimg.com/vi/${s.youtube_video_id}/hqdefault.jpg`}
                  alt={`${s.name} success story`}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-primary shadow-lg transition-transform group-hover:scale-110">
                    <Play className="h-6 w-6 translate-x-0.5 fill-current" />
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              {s.avatar_url && (
                <img src={s.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
              )}
              <div className="min-w-0">
                <div className="font-semibold">{s.name}</div>
                {s.role && <div className="truncate text-xs text-muted-foreground">{s.role}</div>}
              </div>
            </div>
            <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
              <Quote className="mr-1 inline h-3.5 w-3.5 text-primary" />
              {s.quote}
            </p>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {playing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setPlaying(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-black shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPlaying(null)}
                className="absolute right-3 top-3 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur transition hover:bg-white/20"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="aspect-video">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${playing.youtube_video_id}?autoplay=1&rel=0`}
                  title={`${playing.name} success story`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="bg-background p-5">
                <div className="font-display text-lg font-semibold">{playing.name}</div>
                {playing.role && <div className="text-sm text-muted-foreground">{playing.role}</div>}
                <p className="mt-2 text-sm text-muted-foreground">{playing.quote}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
