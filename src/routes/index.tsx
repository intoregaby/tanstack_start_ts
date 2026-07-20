import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, MapPin, Bot, Zap, Globe2, GraduationCap, Play, Lock, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedGlobe } from "@/components/animated-globe";
import { TrustedBy } from "@/components/trusted-by";
import { SuccessStories } from "@/components/success-stories";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lingua Terra — Learn a language and a lifestyle, anywhere" },
      {
        name: "description",
        content: "A global culture and language learning platform. Language, customs, and everyday life for every country.",
      },
    ],
  }),
  component: Home,
});

function useCountries() {
  return useQuery({
    queryKey: ["countries", "home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("countries")
        .select("id, name, slug, flag_emoji, intro_text, hero_image_url")
        .eq("is_published", true)
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

function usePopularCourses() {
  return useQuery({
    queryKey: ["courses", "home-popular"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, description, type, tier_required, cover_image_url, country_id, countries(name, flag_emoji, slug)")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });
}

function Home() {
  const { data: countries = [] } = useCountries();
  const { data: popularCourses = [] } = usePopularCourses();


  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-40 -right-32 h-96 w-96 rounded-full bg-coral/15 blur-3xl" />
        </div>
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-2 lg:gap-8 lg:px-8">
          <div className="flex flex-col justify-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge variant="outline" className="mb-5 gap-1.5 border-primary/30 bg-primary/5 py-1.5 pl-2 pr-3 text-primary">
                <Sparkles className="h-3.5 w-3.5" /> A global learning platform
              </Badge>
              <h1 className="text-balance font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
                Learn a <span className="italic text-primary">language</span> and a{" "}
                <span className="italic text-coral">lifestyle</span> — anywhere.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                Before you move, before you visit, or just because you love the place — Lingua Terra teaches you
                the words, customs, and everyday rhythm of any country.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/countries">Explore countries <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/pricing">See pricing</Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Globe2 className="h-4 w-4" /> Global by design</div>
                <div className="flex items-center gap-2"><Bot className="h-4 w-4" /> Web-aware AI tutor</div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Real-world events</div>
              </div>
            </motion.div>
          </div>

          <div className="relative flex items-center justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="relative w-full max-w-lg"
            >
              {/* Main Cultural Hero Image Card */}
              <div className="relative overflow-hidden rounded-3xl border-2 border-primary/20 bg-card shadow-2xl transition-transform duration-500 hover:scale-[1.02]">
                <img
                  src="/hero-culture.jpg"
                  alt="Global Culture & Traditions"
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-primary-foreground backdrop-blur">
                      🥁 Rhythms & Heritage
                    </span>
                    <span className="inline-flex rounded-full bg-coral/90 px-3 py-1 text-xs font-semibold text-coral-foreground backdrop-blur">
                      🌍 Traditions & Customs
                    </span>
                  </div>
                  <h3 className="mt-2.5 font-display text-2xl font-bold drop-shadow">
                    Immerse in Authentic Global Cultures
                  </h3>
                  <p className="mt-1 text-xs text-white/90">
                    Learn languages through the living traditions, native music, and daily rhythms of communities around the world.
                  </p>
                </div>
              </div>

              {/* Secondary floating cultural card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="absolute -bottom-6 -left-6 hidden w-64 overflow-hidden rounded-2xl border bg-background/95 p-3 shadow-xl backdrop-blur sm:flex items-center gap-3"
              >
                <img
                  src="/hero-culture-2.jpg"
                  alt="Traditional Drummers"
                  className="h-12 w-12 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-foreground">Native Music & Performance</div>
                  <div className="text-[11px] text-muted-foreground">Culture + Language Lessons</div>
                </div>
              </motion.div>

              {/* Floating feature badge top right */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="absolute -top-4 -right-4 hidden rounded-2xl border bg-background/95 px-4 py-2.5 shadow-xl backdrop-blur sm:flex items-center gap-2 text-xs font-semibold text-foreground"
              >
                <span className="text-lg">🗣️</span> Cultural Heritage & Language
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <TrustedBy />

      {/* COUNTRY CAROUSEL */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold md:text-4xl">A world of places to learn</h2>
            <p className="mt-2 text-muted-foreground">Every country is a first-class citizen here — no defaults, no favorites.</p>
          </div>
          <Button asChild variant="ghost" className="hidden md:inline-flex">
            <Link to="/countries">See all <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {countries.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
            >
              <Link
                to="/countries/$slug"
                params={{ slug: c.slug }}
                className="group relative flex h-64 flex-col justify-end overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                {c.hero_image_url && (
                  <img
                    src={c.hero_image_url}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                <div className="relative p-5 text-white">
                  <div className="text-3xl drop-shadow">{c.flag_emoji}</div>
                  <h3 className="mt-2 font-display text-2xl font-semibold">{c.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-white/80">{c.intro_text}</p>
                </div>
              </Link>
            </motion.div>
          ))}
          {/* Coming soon slot */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: countries.length * 0.04 }}
            className="flex h-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center"
          >
            <Globe2 className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-display text-lg">More countries</p>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </motion.div>
        </div>
      </section>

      {/* POPULAR COURSES */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <Badge variant="outline" className="mb-3 border-coral/30 bg-coral/5 text-coral">
                <BookOpen className="mr-1 h-3 w-3" /> Start learning
              </Badge>
              <h2 className="font-display text-3xl font-semibold md:text-4xl">Popular courses right now</h2>
              <p className="mt-2 text-muted-foreground">Hand-picked language and lifestyle tracks from across the world.</p>
            </div>
            <Button asChild variant="ghost" className="hidden md:inline-flex">
              <Link to="/courses">Browse catalog <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {popularCourses.map((c, i) => {
              const co = c.countries as { name: string; flag_emoji: string | null; slug: string } | null;
              const isFree = c.tier_required === "free";
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <Link
                    to="/courses/$courseId"
                    params={{ courseId: c.id }}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      {c.cover_image_url && (
                        <img
                          src={c.cover_image_url}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute left-3 top-3">
                        {isFree ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-coral px-2.5 py-1 text-[10px] font-semibold text-coral-foreground">
                            <Sparkles className="h-2.5 w-2.5" /> Free
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border bg-background/95 px-2.5 py-1 text-[10px] font-semibold capitalize">
                            <Lock className="h-2.5 w-2.5" /> {c.tier_required}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="text-base">{co?.flag_emoji}</span>
                        <span>{co?.name}</span>
                        <span className="text-muted-foreground/40">•</span>
                        <span className="capitalize">{c.type}</span>
                      </div>
                      <h3 className="font-display text-lg font-semibold leading-tight group-hover:text-primary">
                        {c.title}
                      </h3>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                      <div className="mt-auto flex items-center gap-1 pt-2 text-sm font-medium text-primary">
                        <Play className="h-3.5 w-3.5" /> Start course
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
          <div className="mt-8 flex justify-center md:hidden">
            <Button asChild variant="outline">
              <Link to="/courses">Browse full catalog <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* SUCCESS STORIES */}
      <SuccessStories />

      {/* FEATURE STRIP */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">


        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: GraduationCap, title: "Language + lifestyle", body: "Written lessons, native video, and embedded YouTube — plus culture, customs, and paperwork you actually need." },
            { icon: Bot, title: "AI tutor with the live web", body: "Ask about the current visa rules or where to eat late. Your AI can search the web, not just recite lesson text." },
            { icon: Zap, title: "Streaks, flashcards, certificates", body: "Spaced-repetition flashcards, progress bars, streaks, and completion certificates when you finish." },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-2xl border bg-card p-8"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-primary p-12 text-primary-foreground md:p-16"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-coral/40 blur-3xl" />
          <h2 className="max-w-2xl text-balance font-display text-4xl font-semibold md:text-5xl">
            Pick a country. Start today.
          </h2>
          <p className="mt-4 max-w-xl text-primary-foreground/80">
            Free courses to get your first words in your mouth. Subscribe when you're ready for the full library.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-coral text-coral-foreground hover:bg-coral/90">
              <Link to="/countries">Explore free courses</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/pricing">See plans</Link>
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
