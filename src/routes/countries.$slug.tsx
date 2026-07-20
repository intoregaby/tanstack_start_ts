import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BookOpen, Play, Lock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/countries/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Lingua Terra` },
      { name: "description", content: `Language and lifestyle courses for ${params.slug.replace(/-/g, " ")}.` },
    ],
  }),
  component: CountryDetail,
  errorComponent: ({ error }) => <div className="p-10">Error: {error.message}</div>,
  notFoundComponent: () => (
    <div className="p-10 text-center">
      <h1 className="font-display text-3xl">Country not found</h1>
      <p className="mt-2 text-muted-foreground">This country isn't on Lingua Terra yet.</p>
      <Link to="/countries" className="mt-4 inline-block underline">← Back to all countries</Link>
    </div>
  ),
});

function CountryDetail() {
  const { slug } = Route.useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["country", slug],
    queryFn: async () => {
      const { data: country, error } = await supabase
        .from("countries")
        .select("id, name, slug, flag_emoji, intro_text, hero_image_url")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!country) throw notFound();
      const { data: courses, error: cerr } = await supabase
        .from("courses")
        .select("id, title, description, type, tier_required, cover_image_url, display_order")
        .eq("country_id", country.id)
        .eq("is_published", true)
        .order("display_order");
      if (cerr) throw cerr;
      return { country, courses: courses ?? [] };
    },
  });

  if (isLoading) return <div className="mx-auto max-w-6xl px-4 py-16"><div className="h-64 animate-pulse rounded-3xl bg-muted" /></div>;
  if (error || !data) return <div className="p-10">Not found</div>;
  const { country, courses } = data;

  return (
    <div>
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-background to-coral/5">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="flex items-start gap-6">
            <div className="text-8xl">{country.flag_emoji}</div>
            <div>
              <div className="text-sm uppercase tracking-widest text-muted-foreground">Country</div>
              <h1 className="mt-1 font-display text-5xl font-semibold md:text-6xl">{country.name}</h1>
              <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{country.intro_text}</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-3xl font-semibold">Courses</h2>
          <p className="text-sm text-muted-foreground">{courses.length} course{courses.length !== 1 && "s"}</p>
        </div>
        {courses.length === 0 ? (
          <div className="mt-8 rounded-2xl border-2 border-dashed p-10 text-center">
            <p className="text-muted-foreground">Courses for {country.name} are coming soon.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {courses.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to="/courses/$courseId"
                  params={{ courseId: course.id }}
                  className="group flex flex-col gap-3 rounded-2xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={course.type === "language" ? "default" : "secondary"} className="gap-1">
                      {course.type === "language" ? <BookOpen className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                      {course.type === "language" ? "Language" : "Lifestyle"}
                    </Badge>
                    <TierBadge tier={course.tier_required} />
                  </div>
                  <h3 className="font-display text-2xl font-semibold group-hover:text-primary">{course.title}</h3>
                  <p className="text-sm text-muted-foreground">{course.description}</p>
                  <div className="mt-auto flex items-center gap-1 text-sm font-medium text-primary">
                    <Play className="h-3.5 w-3.5" /> Start
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function TierBadge({ tier }: { tier: "free" | "basic" | "premium" }) {
  if (tier === "free") return <Badge className="bg-coral text-coral-foreground gap-1"><Sparkles className="h-3 w-3" />Free</Badge>;
  if (tier === "premium") return <Badge variant="outline" className="gap-1"><Lock className="h-3 w-3" />Premium</Badge>;
  return <Badge variant="outline" className="gap-1"><Lock className="h-3 w-3" />Basic</Badge>;
}
