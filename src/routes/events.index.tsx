import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const EventsMap = lazy(() => import("@/components/events-map"));


export const Route = createFileRoute("/events/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Events — Lingua Terra" },
      { name: "description", content: "Language and cultural events on an interactive world map." },
    ],
  }),
  component: EventsIndex,
});

function EventsIndex() {
  const [q, setQ] = useState("");
  const [mapReady, setMapReady] = useState(false);
  useEffect(() => { setMapReady(true); }, []);

  const { data: events = [] } = useQuery({
    queryKey: ["events", "published"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, short_description, latitude, longitude, location_name, start_time, countries(name, flag_emoji, slug)")
        .eq("is_published", true)
        .order("start_time", { ascending: true });
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return events;
    return events.filter((e: any) =>
      e.title.toLowerCase().includes(needle) ||
      (e.location_name ?? "").toLowerCase().includes(needle) ||
      (e.countries?.name ?? "").toLowerCase().includes(needle)
    );
  }, [events, q]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}}>
        <h1 className="font-display text-5xl font-semibold">Events</h1>
        <p className="mt-2 text-muted-foreground">Meetups, festivals, and immersion events around the world.</p>
      </motion.div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        <div>
          <Input placeholder="Search events, countries, cities…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="mt-4 space-y-3">
            {filtered.length === 0 && <p className="text-sm text-muted-foreground">No events match your search yet.</p>}
            {filtered.map((e: any) => (
              <Link key={e.id} to="/events/$eventId" params={{ eventId: e.id }}>
                <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {e.countries?.flag_emoji} {e.countries?.name ?? "Global"}
                    </div>
                    <div className="mt-1 font-display text-lg font-semibold">{e.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {e.start_time && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(e.start_time).toLocaleDateString()}</span>}
                      {e.location_name && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{e.location_name}</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
        <div className="h-[600px] overflow-hidden rounded-2xl border">
          {mapReady && (
            <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading map…</div>}>
              <EventsMap events={filtered} />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}

