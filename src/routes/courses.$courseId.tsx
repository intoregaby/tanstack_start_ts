import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Play, Clock, BookOpen, Globe2, Award, Users, Star, Sparkles, Lock, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { TierBadge } from "./countries.$slug";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/courses/$courseId")({
  head: () => ({ meta: [{ title: "Course — Lingua Terra" }] }),
  component: CourseView,
});

function CourseView() {
  const { courseId } = Route.useParams();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const { data } = useQuery({
    queryKey: ["course", courseId, user?.id],
    queryFn: async () => {
      const { data: course, error } = await supabase
        .from("courses")
        .select("id, title, description, type, tier_required, cover_image_url, country_id, countries(name, slug, flag_emoji, hero_image_url)")
        .eq("id", courseId)
        .maybeSingle();
      if (error) throw error;
      if (!course) throw notFound();

      const { data: modules } = await supabase
        .from("modules")
        .select("id, title, order, lessons(id, title, type, order)")
        .eq("course_id", courseId)
        .order("order");

      let completed: Set<string> = new Set();
      if (user) {
        const { data: progress } = await supabase.from("progress").select("lesson_id").eq("user_id", user.id);
        completed = new Set((progress ?? []).map((p) => p.lesson_id));
      }

      return { course, modules: modules ?? [], completed };
    },
  });

  if (!data) return <div className="mx-auto max-w-6xl p-10"><div className="h-64 animate-pulse rounded bg-muted" /></div>;
  const { course, modules, completed } = data;
  const allLessons = modules.flatMap((m) => (m.lessons ?? []) as { id: string; title: string; type: string; order: number }[]);
  const totalLessons = allLessons.length;
  const doneLessons = allLessons.filter((l) => completed.has(l.id)).length;
  const progressPct = totalLessons === 0 ? 0 : Math.round((doneLessons / totalLessons) * 100);
  const country = (course as { countries: { name: string; slug: string; flag_emoji: string | null; hero_image_url: string | null } | null }).countries;
  const firstLessonId = allLessons[0]?.id;
  const nextLessonId = allLessons.find((l) => !completed.has(l.id))?.id ?? firstLessonId;
  const estMinutes = Math.max(30, totalLessons * 12);
  const isFree = course.tier_required === "free";

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/10 via-background to-coral/10">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link to="/countries" className="hover:text-foreground">Countries</Link>
              <ChevronRight className="h-3 w-3" />
              {country && (
                <>
                  <Link to="/countries/$slug" params={{ slug: country.slug }} className="hover:text-foreground">
                    {country.flag_emoji} {country.name}
                  </Link>
                  <ChevronRight className="h-3 w-3" />
                </>
              )}
              <span className="text-foreground/60">Courses</span>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
              <div className="flex flex-wrap items-center gap-2">
                <TierBadge tier={course.tier_required} />
                <span className="rounded-full border bg-background/60 px-2.5 py-0.5 text-[11px] font-medium capitalize backdrop-blur">
                  {course.type} course
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-amber-500">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span className="ml-1 text-muted-foreground">4.8 (2.1k learners)</span>
                </span>
              </div>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-tight md:text-5xl">{course.title}</h1>
              <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{course.description}</p>

              <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {totalLessons} lesson{totalLessons === 1 ? "" : "s"}</span>
                <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> ~{estMinutes} min</span>
                <span className="inline-flex items-center gap-1.5"><Globe2 className="h-4 w-4" /> {country?.name}</span>
                <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" /> All levels</span>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {firstLessonId ? (
                  <Button asChild size="lg" className="bg-primary text-primary-foreground">
                    <Link to="/lessons/$lessonId" params={{ lessonId: nextLessonId! }}>
                      {doneLessons > 0 ? "Continue learning" : isFree ? "Start free course" : "Start course"}
                      <Play className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button size="lg" disabled>Coming soon</Button>
                )}
                {!isFree && !user && (
                  <Button asChild variant="outline" size="lg">
                    <Link to="/pricing">See plans</Link>
                  </Button>
                )}
              </div>
            </motion.div>
          </div>

          {/* Cover card */}
          <motion.aside initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="lg:sticky lg:top-20 lg:self-start">
            <div className="overflow-hidden rounded-2xl border bg-card shadow-lg">
              <div className="relative aspect-video overflow-hidden bg-muted">
                {(course.cover_image_url || country?.hero_image_url) && (
                  <img src={course.cover_image_url ?? country?.hero_image_url ?? ""} alt="" className="h-full w-full object-cover" />
                )}
                {firstLessonId && (
                  <Link
                    to="/lessons/$lessonId"
                    params={{ lessonId: nextLessonId! }}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 transition hover:bg-black/40"
                  >
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-primary shadow-lg">
                      <Play className="h-7 w-7 translate-x-0.5 fill-current" />
                    </span>
                  </Link>
                )}
              </div>
              <div className="space-y-3 p-5">
                {isFree ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Sparkles className="h-4 w-4 text-coral" />
                    <span className="font-medium">Free — no account needed</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <Lock className="h-4 w-4 text-primary" />
                    <span className="font-medium capitalize">{course.tier_required} plan required</span>
                  </div>
                )}
                {user && totalLessons > 0 && (
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>Your progress</span>
                      <span>{progressPct}%</span>
                    </div>
                    <Progress value={progressPct} />
                    <div className="mt-1 text-xs text-muted-foreground">{doneLessons} of {totalLessons} lessons completed</div>
                  </div>
                )}
                <ul className="space-y-2 border-t pt-3 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Certificate on completion</li>
                  <li className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Native audio & video</li>
                  <li className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Flashcards & streaks</li>
                </ul>
              </div>
            </div>
          </motion.aside>
        </div>
      </section>

      {/* TABS */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="modules">Curriculum</TabsTrigger>
            <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <h2 className="font-display text-2xl font-semibold">What you'll learn</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  `Core vocabulary & everyday phrases used in ${country?.name ?? "the country"}.`,
                  `Cultural norms — from greetings to workplace etiquette.`,
                  `Practical daily-life scenarios: transit, food, shopping, and more.`,
                  `Confidence to navigate real conversations from day one.`,
                ].map((line, i) => (
                  <div key={i} className="flex gap-2 rounded-xl border bg-card p-4 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>

              <h3 className="mt-10 font-display text-xl font-semibold">Skills you'll gain</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Conversation", "Listening", "Culture", "Reading", "Etiquette", "Daily life"].map((s) => (
                  <span key={s} className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium">{s}</span>
                ))}
              </div>

              <h3 className="mt-10 font-display text-xl font-semibold">About this course</h3>
              <p className="mt-2 text-muted-foreground">
                {course.description} This course blends written lessons, native video, and — for Premium learners — a web-aware AI tutor
                that answers questions with up-to-date information. Progress is tracked automatically, and flashcards adapt to how well you're doing.
              </p>
            </div>

            <aside className="rounded-2xl border bg-card p-6">
              <h3 className="font-display text-lg font-semibold">Instructor</h3>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl">
                  {country?.flag_emoji ?? "🌍"}
                </div>
                <div>
                  <div className="font-semibold">Lingua Terra Team</div>
                  <div className="text-xs text-muted-foreground">Native speakers & culture experts</div>
                </div>
              </div>
              <div className="mt-6 space-y-3 border-t pt-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Level</span><span>All levels</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Language</span><span>English + native</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Lessons</span><span>{totalLessons}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Est. time</span><span>~{estMinutes} min</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Certificate</span><span>Yes</span></div>
              </div>
            </aside>
          </TabsContent>

          <TabsContent value="modules" className="mt-8">
            <h2 className="font-display text-2xl font-semibold">Curriculum</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {modules.length} module{modules.length === 1 ? "" : "s"} · {totalLessons} lesson{totalLessons === 1 ? "" : "s"}
            </p>
            {modules.length === 0 ? (
              <p className="mt-4 text-muted-foreground">Content coming soon.</p>
            ) : (
              <Accordion type="multiple" defaultValue={modules.map((m) => m.id)} className="mt-4">
                {modules.map((m, mi) => {
                  const lessons = ((m.lessons ?? []) as { id: string; title: string; type: string; order: number }[])
                    .sort((a, b) => a.order - b.order);
                  return (
                    <AccordionItem key={m.id} value={m.id}>
                      <AccordionTrigger className="font-display text-lg">
                        <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {mi + 1}
                        </span>
                        {m.title}
                        <span className="ml-auto mr-3 text-xs font-normal text-muted-foreground">{lessons.length} lesson{lessons.length === 1 ? "" : "s"}</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-1">
                          {lessons.map((l) => (
                            <li key={l.id}>
                              <Link
                                to="/lessons/$lessonId"
                                params={{ lessonId: l.id }}
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-accent"
                              >
                                {completed.has(l.id) ? (
                                  <CheckCircle2 className="h-4 w-4 text-primary" />
                                ) : (
                                  <Circle className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="flex-1">{l.title}</span>
                                <span className="text-xs capitalize text-muted-foreground">{l.type}</span>
                                <Play className="h-3.5 w-3.5 text-muted-foreground" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </TabsContent>

          <TabsContent value="outcomes" className="mt-8">
            <h2 className="font-display text-2xl font-semibold">Career & travel outcomes</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                { title: "Relocate confidently", body: "Move to a new country knowing how life actually works there." },
                { title: "Travel deeper", body: "Skip the tourist script — talk to locals, eat like a local." },
                { title: "Work globally", body: "Handle workplace culture, greetings, and etiquette wherever you land." },
              ].map((o) => (
                <div key={o.title} className="rounded-2xl border bg-card p-6">
                  <div className="font-display text-lg font-semibold">{o.title}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{o.body}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="faq" className="mt-8">
            <div className="max-w-3xl">
              <Accordion type="single" collapsible>
                {[
                  { q: "Do I need a subscription?", a: isFree ? "No — this course is free and requires no account." : "Yes — this course is included with the Basic or Premium plan." },
                  { q: "Can I learn at my own pace?", a: "Absolutely. All lessons are self-paced, and your progress is saved automatically." },
                  { q: "Will I get a certificate?", a: "Yes — a completion certificate lands in your Dashboard when you finish every lesson." },
                  { q: "Is native audio included?", a: "Yes, along with pronunciation practice on Premium." },
                ].map((f, i) => (
                  <AccordionItem key={i} value={`f${i}`}>
                    <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <p className="mt-6 text-sm text-muted-foreground">
                More questions? See <Link to="/faqs" className="text-primary underline">all FAQs</Link>.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
