import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/countries/")({
  head: () => ({
    meta: [
      { title: "Countries — Lingua Terra" },
      { name: "description", content: "Browse every country on Lingua Terra. Language and lifestyle courses for the world." },
    ],
  }),
  component: CountriesIndex,
});

function CountriesIndex() {
  const { data: countries = [], isLoading } = useQuery({
    queryKey: ["countries", "all"],
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}}>
        <h1 className="font-display text-5xl font-semibold">Explore countries</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">Every place on Lingua Terra is a first-class citizen — pick where you're going next.</p>
      </motion.div>

      {isLoading ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {countries.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Link
                to="/countries/$slug"
                params={{ slug: c.slug }}
                className="group relative flex h-72 flex-col justify-end overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                {c.hero_image_url && (
                  <img
                    src={c.hero_image_url}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
                <div className="relative p-6 text-white">
                  <div className="text-4xl drop-shadow">{c.flag_emoji}</div>
                  <h2 className="mt-2 font-display text-3xl font-semibold">{c.name}</h2>
                  <p className="mt-2 line-clamp-2 text-sm text-white/80">{c.intro_text}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
