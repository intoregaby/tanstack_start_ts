import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Lingua Terra" }] }),
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });
    const { data: role } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!role) throw redirect({ to: "/dashboard" });
  },
  component: AdminPage,
});

function AdminPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-semibold">Admin</h1>
      <p className="mt-1 text-muted-foreground">Manage countries, courses, events, and analytics.</p>

      <Tabs defaultValue="countries" className="mt-8">
        <TabsList>
          <TabsTrigger value="countries">Countries</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="stories">Success stories</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="countries" className="mt-6"><CountriesAdmin /></TabsContent>
        <TabsContent value="courses" className="mt-6"><CoursesAdmin /></TabsContent>
        <TabsContent value="events" className="mt-6"><EventsAdmin /></TabsContent>
        <TabsContent value="stories" className="mt-6"><StoriesAdmin /></TabsContent>
        <TabsContent value="analytics" className="mt-6"><AnalyticsAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}

function CountriesAdmin() {
  const qc = useQueryClient();
  const { data: countries = [] } = useQuery({
    queryKey: ["admin", "countries"],
    queryFn: async () => (await supabase.from("countries").select("*").order("display_order")).data ?? [],
  });
  const [form, setForm] = useState({ name: "", slug: "", flag_emoji: "", intro_text: "" });
  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("countries").insert({ ...form, is_published: true });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Country added"); setForm({ name: "", slug: "", flag_emoji: "", intro_text: "" }); qc.invalidateQueries({ queryKey: ["admin", "countries"] }); qc.invalidateQueries({ queryKey: ["countries"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("countries").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "countries"] }); },
  });

  return (
    <div className="grid gap-6 md:grid-cols-[380px_1fr]">
      <Card>
        <CardHeader><CardTitle>Add country</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Name</Label><Input value={form.name} onChange={e=>setForm({...form, name: e.target.value})} /></div>
          <div><Label>Slug</Label><Input value={form.slug} onChange={e=>setForm({...form, slug: e.target.value.toLowerCase().replace(/\s+/g,"-")})} placeholder="e.g. italy" /></div>
          <div><Label>Flag emoji</Label><Input value={form.flag_emoji} onChange={e=>setForm({...form, flag_emoji: e.target.value})} placeholder="🇮🇹" /></div>
          <div><Label>Intro</Label><Textarea value={form.intro_text} onChange={e=>setForm({...form, intro_text: e.target.value})} rows={3} /></div>
          <Button onClick={() => create.mutate()} disabled={create.isPending || !form.name || !form.slug} className="w-full">Add country</Button>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {countries.map((c: any) => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{c.flag_emoji}</span>
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">/{c.slug}</div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => del.mutate(c.id)}><Trash2 className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CoursesAdmin() {
  const qc = useQueryClient();
  const { data: countries = [] } = useQuery({
    queryKey: ["admin", "countries"],
    queryFn: async () => (await supabase.from("countries").select("id, name, flag_emoji")).data ?? [],
  });
  const { data: courses = [] } = useQuery({
    queryKey: ["admin", "courses"],
    queryFn: async () => (await supabase.from("courses").select("*, countries(name, flag_emoji)").order("created_at", { ascending: false })).data ?? [],
  });
  const [form, setForm] = useState({ country_id: "", title: "", description: "", type: "language" as "language" | "lifestyle", tier_required: "basic" as "free" | "basic" | "premium" });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("courses").insert({ ...form, is_published: true });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Course added"); qc.invalidateQueries({ queryKey: ["admin", "courses"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-6 md:grid-cols-[380px_1fr]">
      <Card>
        <CardHeader><CardTitle>Add course</CardTitle><CardDescription>Mark as Free to make it public.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Country</Label>
            <Select value={form.country_id} onValueChange={(v) => setForm({...form, country_id: v})}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>{countries.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.flag_emoji} {c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Title</Label><Input value={form.title} onChange={e=>setForm({...form, title: e.target.value})} /></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e=>setForm({...form, description: e.target.value})} rows={2} /></div>
          <div>
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v: any) => setForm({...form, type: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="language">Language</SelectItem><SelectItem value="lifestyle">Lifestyle / relocation</SelectItem></SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tier</Label>
            <Select value={form.tier_required} onValueChange={(v: any) => setForm({...form, tier_required: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="free">Free</SelectItem><SelectItem value="basic">Basic</SelectItem><SelectItem value="premium">Premium</SelectItem></SelectContent>
            </Select>
          </div>
          <Button onClick={() => create.mutate()} disabled={!form.country_id || !form.title} className="w-full">Add course</Button>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {courses.map((c: any) => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between p-3">
              <div>
                <div className="text-xs text-muted-foreground">{c.countries?.flag_emoji} {c.countries?.name} · {c.type} · {c.tier_required}</div>
                <div className="font-medium">{c.title}</div>
              </div>
              <Link to="/courses/$courseId" params={{ courseId: c.id }} className="text-xs text-primary underline">View →</Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EventsAdmin() {
  const qc = useQueryClient();
  const { data: countries = [] } = useQuery({
    queryKey: ["admin", "countries"],
    queryFn: async () => (await supabase.from("countries").select("id, name, flag_emoji")).data ?? [],
  });
  const { data: events = [] } = useQuery({
    queryKey: ["admin", "events"],
    queryFn: async () => (await supabase.from("events").select("*").order("start_time", { ascending: true })).data ?? [],
  });
  const [form, setForm] = useState({ country_id: "", title: "", short_description: "", trailer_url: "", trailer_is_youtube: true, latitude: "", longitude: "", location_name: "", start_time: "", end_time: "" });

  const create = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: form.title,
        short_description: form.short_description,
        trailer_url: form.trailer_url || null,
        trailer_is_youtube: form.trailer_is_youtube,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        location_name: form.location_name || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        country_id: form.country_id || null,
        is_published: true,
      };
      const { error } = await supabase.from("events").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Event added"); qc.invalidateQueries({ queryKey: ["admin", "events"] }); qc.invalidateQueries({ queryKey: ["events"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-6 md:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader><CardTitle>Add event</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Title</Label><Input value={form.title} onChange={e=>setForm({...form, title: e.target.value})} /></div>
          <div><Label>Short description</Label><Textarea value={form.short_description} onChange={e=>setForm({...form, short_description: e.target.value})} rows={2} /></div>
          <div>
            <Label>Country (optional)</Label>
            <Select value={form.country_id} onValueChange={(v) => setForm({...form, country_id: v})}>
              <SelectTrigger><SelectValue placeholder="Global / none" /></SelectTrigger>
              <SelectContent>{countries.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.flag_emoji} {c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Latitude</Label><Input value={form.latitude} onChange={e=>setForm({...form, latitude: e.target.value})} placeholder="35.68" /></div>
            <div><Label>Longitude</Label><Input value={form.longitude} onChange={e=>setForm({...form, longitude: e.target.value})} placeholder="139.69" /></div>
          </div>
          <div><Label>Location name</Label><Input value={form.location_name} onChange={e=>setForm({...form, location_name: e.target.value})} placeholder="Tokyo, Japan" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Start</Label><Input type="datetime-local" value={form.start_time} onChange={e=>setForm({...form, start_time: e.target.value})} /></div>
            <div><Label>End</Label><Input type="datetime-local" value={form.end_time} onChange={e=>setForm({...form, end_time: e.target.value})} /></div>
          </div>
          <div><Label>Trailer URL</Label><Input value={form.trailer_url} onChange={e=>setForm({...form, trailer_url: e.target.value})} placeholder="YouTube URL or video" /></div>
          <Button onClick={() => create.mutate()} disabled={!form.title} className="w-full">Add event</Button>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {events.map((e: any) => (
          <Card key={e.id}>
            <CardContent className="flex items-center justify-between p-3">
              <div>
                <div className="font-medium">{e.title}</div>
                <div className="text-xs text-muted-foreground">{e.location_name} · {e.start_time ? new Date(e.start_time).toLocaleDateString() : "TBD"}</div>
              </div>
              <Link to="/events/$eventId" params={{ eventId: e.id }} className="text-xs text-primary underline">View →</Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AnalyticsAdmin() {
  const { data } = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: async () => {
      const [subs, users, progress, courses] = await Promise.all([
        supabase.from("subscriptions").select("tier, status", { count: "exact", head: false }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("progress").select("id", { count: "exact", head: true }),
        supabase.from("courses").select("id", { count: "exact", head: true }),
      ]);
      const activeSubs = (subs.data ?? []).filter((s: any) => s.status === "active");
      return {
        users: users.count ?? 0,
        lessons_completed: progress.count ?? 0,
        courses: courses.count ?? 0,
        subscribers: activeSubs.length,
        basic: activeSubs.filter((s: any) => s.tier === "basic").length,
        premium: activeSubs.filter((s: any) => s.tier === "premium").length,
      };
    },
  });
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      <StatCard label="Users" value={data?.users ?? 0} />
      <StatCard label="Active subscribers" value={data?.subscribers ?? 0} />
      <StatCard label="Courses" value={data?.courses ?? 0} />
      <StatCard label="Basic" value={data?.basic ?? 0} />
      <StatCard label="Premium" value={data?.premium ?? 0} />
      <StatCard label="Lessons completed" value={data?.lessons_completed ?? 0} />
    </div>
  );
}
function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card><CardContent className="p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-3xl font-semibold">{value}</div>
    </CardContent></Card>
  );
}

function StoriesAdmin() {
  const qc = useQueryClient();
  const { data: stories = [] } = useQuery({
    queryKey: ["admin", "stories"],
    queryFn: async () => (await supabase.from("success_stories").select("*").order("display_order")).data ?? [],
  });
  const [form, setForm] = useState({ name: "", role: "", quote: "", youtube_video_id: "", avatar_url: "" });

  const parseYt = (v: string) => {
    const m = v.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/);
    return m ? m[1] : v.trim();
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("success_stories").insert({
        name: form.name,
        role: form.role || null,
        quote: form.quote,
        youtube_video_id: parseYt(form.youtube_video_id),
        avatar_url: form.avatar_url || null,
        is_published: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Story added");
      setForm({ name: "", role: "", quote: "", youtube_video_id: "", avatar_url: "" });
      qc.invalidateQueries({ queryKey: ["admin", "stories"] });
      qc.invalidateQueries({ queryKey: ["success-stories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("success_stories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "stories"] });
      qc.invalidateQueries({ queryKey: ["success-stories"] });
    },
  });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Add success story</CardTitle><CardDescription>Learner testimonial with a YouTube video.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Role / country</Label><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Moved to Tokyo" /></div>
          <div><Label>Quote</Label><Textarea value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} /></div>
          <div><Label>YouTube URL or video ID</Label><Input value={form.youtube_video_id} onChange={(e) => setForm({ ...form, youtube_video_id: e.target.value })} placeholder="https://youtu.be/..." /></div>
          <div><Label>Avatar URL (optional)</Label><Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} /></div>
          <Button onClick={() => create.mutate()} disabled={!form.name || !form.quote || !form.youtube_video_id}>Add story</Button>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {stories.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex items-start gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.role}</div>
                <div className="mt-1 line-clamp-2 text-sm">{s.quote}</div>
                <div className="mt-1 text-xs font-mono text-muted-foreground">yt: {s.youtube_video_id}</div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
        {stories.length === 0 && <p className="text-sm text-muted-foreground">No stories yet.</p>}
      </div>
    </div>
  );
}
