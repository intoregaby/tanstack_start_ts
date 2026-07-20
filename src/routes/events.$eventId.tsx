import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowLeft, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/events/$eventId")({
  head: () => ({ meta: [{ title: "Event — Lingua Terra" }] }),
  component: EventDetail,
});

function toICSDate(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function buildICS(e: any) {
  const start = e.start_time ? toICSDate(e.start_time) : "";
  const end = e.end_time ? toICSDate(e.end_time) : start;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lingua Terra//EN",
    "BEGIN:VEVENT",
    `UID:${e.id}@linguaterra`,
    `DTSTAMP:${toICSDate(new Date().toISOString())}`,
    start && `DTSTART:${start}`,
    end && `DTEND:${end}`,
    `SUMMARY:${(e.title ?? "").replace(/\n/g, " ")}`,
    e.short_description && `DESCRIPTION:${e.short_description.replace(/\n/g, " ")}`,
    e.location_name && `LOCATION:${e.location_name}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}

function downloadICS(e: any) {
  const blob = new Blob([buildICS(e)], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(e.title ?? "event").replace(/[^a-z0-9]/gi, "-")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function googleCalendarUrl(e: any) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title ?? "",
    details: e.short_description ?? "",
    location: e.location_name ?? "",
  });
  if (e.start_time && e.end_time) {
    const fmt = (s: string) => new Date(s).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    params.set("dates", `${fmt(e.start_time)}/${fmt(e.end_time)}`);
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function EventDetail() {
  const { eventId } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data: e, error } = await supabase
        .from("events")
        .select("id, title, short_description, trailer_url, trailer_is_youtube, latitude, longitude, location_name, start_time, end_time, countries(name, flag_emoji, slug)")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      if (!e) throw notFound();
      const { data: gallery } = await supabase
        .from("event_gallery_images")
        .select("id, image_url")
        .eq("event_id", eventId)
        .order("order");
      return { event: e, gallery: gallery ?? [] };
    },
  });

  if (isLoading || !data) return <div className="mx-auto max-w-4xl p-10"><div className="h-64 animate-pulse rounded bg-muted" /></div>;
  const { event, gallery } = data;
  const country = (event as any).countries;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/events" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />All events
      </Link>
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="mt-4">
        {country && <div className="text-sm text-muted-foreground">{country.flag_emoji} {country.name}</div>}
        <h1 className="mt-1 font-display text-4xl font-semibold md:text-5xl">{event.title}</h1>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
          {event.start_time && <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" />{new Date(event.start_time).toLocaleString()}</span>}
          {event.location_name && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.location_name}</span>}
        </div>
      </motion.div>

      {event.trailer_url && (
        <div className="mt-6 aspect-video overflow-hidden rounded-2xl border">
          {event.trailer_is_youtube ? (
            <iframe
              src={`https://www.youtube.com/embed/${extractYouTubeId(event.trailer_url)}`}
              title="Trailer"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video src={event.trailer_url} controls className="h-full w-full" />
          )}
        </div>
      )}

      <p className="mt-6 text-lg text-muted-foreground">{event.short_description}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={() => downloadICS(event)}><Download className="mr-1.5 h-4 w-4" />Add to calendar (.ics)</Button>
        <Button asChild variant="outline"><a href={googleCalendarUrl(event)} target="_blank" rel="noreferrer">Google Calendar</a></Button>
      </div>

      {gallery.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-2xl font-semibold">Gallery</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {gallery.map((g) => (
              <div key={g.id} className="aspect-square overflow-hidden rounded-xl border">
                <img src={g.image_url} alt="" className="h-full w-full object-cover transition hover:scale-105" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function extractYouTubeId(url: string) {
  const m = url.match(/(?:youtube\.com.*[?&]v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  return m ? m[1] : url;
}
