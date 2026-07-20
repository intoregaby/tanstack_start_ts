import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CheckCircle2, Lock, Mic, Play, Square, Bot, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { AiAssistant } from "@/components/ai-assistant";
import { FlashcardsDeck } from "@/components/flashcards-deck";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/lessons/$lessonId")({
  head: () => ({ meta: [{ title: "Lesson — Lingua Terra" }] }),
  component: LessonView,
});

function LessonView() {
  const { lessonId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["lesson", lessonId, user?.id],
    queryFn: async () => {
      // Fetch the lesson (RLS gates content by subscription).
      const { data: lesson, error } = await supabase
        .from("lessons")
        .select("id, title, type, content, video_url, youtube_video_id, native_audio_url, module_id, modules(id, course_id, title, courses(id, title, tier_required, country_id, countries(name, slug, flag_emoji)))")
        .eq("id", lessonId)
        .maybeSingle();
      if (error) throw error;
      if (!lesson) return null;

      const { data: fc } = await supabase.from("flashcards").select("id, term, translation, example_sentence").eq("lesson_id", lessonId);

      // Fetch sibling lessons in the same course for prev/next navigation.
      const courseId = (lesson as any).modules?.courses?.id;
      let ordered: Array<{ id: string; title: string }> = [];
      let completedSet = new Set<string>();
      if (courseId) {
        const { data: mods } = await supabase
          .from("modules")
          .select("id, order, lessons(id, title, order)")
          .eq("course_id", courseId)
          .order("order");
        ordered = (mods ?? []).flatMap((m: any) =>
          [...(m.lessons ?? [])].sort((a: any, b: any) => a.order - b.order).map((l: any) => ({ id: l.id, title: l.title })),
        );
      }
      let done = false;
      if (user) {
        const { data: p } = await supabase.from("progress").select("lesson_id").eq("user_id", user.id);
        completedSet = new Set((p ?? []).map((x: any) => x.lesson_id));
        done = completedSet.has(lessonId);
      }
      return { lesson, flashcards: fc ?? [], done, ordered, completedSet };
    },
  });

  const complete = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to save progress");
      const { error } = await supabase.from("progress").upsert({ user_id: user.id, lesson_id: lessonId }, { onConflict: "user_id,lesson_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lesson complete");
      qc.invalidateQueries({ queryKey: ["lesson"] });
      qc.invalidateQueries({ queryKey: ["course"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="mx-auto max-w-4xl p-10"><Loader2 className="animate-spin" /></div>;

  // If lesson row is null it could mean not found OR subscription gate.
  if (!data || !data.lesson) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <Lock className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 font-display text-3xl font-semibold">Locked</h1>
        <p className="mt-2 text-muted-foreground">
          This lesson is part of a paid course. Subscribe to unlock the full library.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild><Link to="/pricing">See plans</Link></Button>
          <Button variant="outline" onClick={() => navigate({ to: "/countries" })}>Browse free courses</Button>
        </div>
      </div>
    );
  }

  const { lesson, flashcards, done, ordered } = data;
  const idx = ordered.findIndex((l) => l.id === lesson.id);
  const prev = idx > 0 ? ordered[idx - 1] : null;
  const next = idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null;
  const mod = (lesson as any).modules;
  const course = mod?.courses;
  const country = course?.countries;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/courses/$courseId" params={{ courseId: course?.id ?? "" }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> {course?.title}
      </Link>
      <motion.h1 initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="mt-3 font-display text-4xl font-semibold">
        {lesson.title}
      </motion.h1>
      {country && <p className="mt-1 text-sm text-muted-foreground">{country.flag_emoji} {country.name} · {mod?.title}</p>}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          {/* Video (native) */}
          {(lesson.type === "video" || lesson.type === "mixed") && lesson.video_url && (
            <video src={lesson.video_url} controls className="mb-6 w-full rounded-2xl border" />
          )}
          {/* YouTube */}
          {(lesson.type === "youtube" || lesson.type === "mixed") && lesson.youtube_video_id && (
            <div className="mb-6 aspect-video overflow-hidden rounded-2xl border">
              <iframe
                src={`https://www.youtube.com/embed/${lesson.youtube_video_id}`}
                title={lesson.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          {/* Written */}
          {lesson.content && (
            <article className="prose prose-slate max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.content}</ReactMarkdown>
            </article>
          )}

          {/* Pronunciation */}
          {lesson.native_audio_url && <PronunciationPractice nativeUrl={lesson.native_audio_url} />}

          {/* Mark complete */}
          <div className="mt-10 flex items-center justify-between rounded-2xl border bg-card p-6">
            <div>
              <div className="font-display text-lg font-semibold">Finished this lesson?</div>
              <div className="text-sm text-muted-foreground">Mark it complete to keep your streak going.</div>
            </div>
            {done ? (
              <div className="flex items-center gap-2 text-primary"><CheckCircle2 className="h-5 w-5" /> Complete</div>
            ) : user ? (
              <Button onClick={() => complete.mutate()} disabled={complete.isPending}>Mark complete</Button>
            ) : (
              <Button asChild><Link to="/auth">Sign in to save</Link></Button>
            )}
          </div>

          {/* Prev / Next lesson navigation */}
          {(prev || next) && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {prev ? (
                <Link
                  to="/lessons/$lessonId"
                  params={{ lessonId: prev.id }}
                  className="group flex items-center gap-3 rounded-2xl border bg-card p-4 transition hover:border-primary hover:bg-accent"
                >
                  <ArrowLeft className="h-4 w-4 text-muted-foreground transition group-hover:-translate-x-0.5 group-hover:text-foreground" />
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">Previous</div>
                    <div className="truncate font-medium">{prev.title}</div>
                  </div>
                </Link>
              ) : <div />}
              {next ? (
                <Link
                  to="/lessons/$lessonId"
                  params={{ lessonId: next.id }}
                  className="group flex items-center justify-end gap-3 rounded-2xl border bg-card p-4 text-right transition hover:border-primary hover:bg-accent"
                >
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">Next</div>
                    <div className="truncate font-medium">{next.title}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                </Link>
              ) : <div />}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Tabs defaultValue="ai">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ai"><Bot className="mr-1.5 h-4 w-4" />Tutor</TabsTrigger>
              <TabsTrigger value="cards">Flashcards</TabsTrigger>
            </TabsList>
            <TabsContent value="ai" className="mt-4">
              <AiAssistant
                lessonId={lesson.id}
                lessonTitle={lesson.title}
                lessonContent={lesson.content ?? ""}
                countryName={country?.name}
              />
            </TabsContent>
            <TabsContent value="cards" className="mt-4">
              <FlashcardsDeck cards={flashcards} userId={user?.id} />
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}

function PronunciationPractice({ nativeUrl }: { nativeUrl: string }) {
  const [recording, setRecording] = useState(false);
  const [userBlobUrl, setUserBlobUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setUserBlobUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch {
      toast.error("Microphone permission denied");
    }
  };
  const stop = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <Card className="mt-8">
      <CardHeader><CardTitle className="text-lg">Pronunciation practice</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 text-sm font-medium">Listen to a native speaker</div>
          <audio src={nativeUrl} controls className="w-full" />
        </div>
        <div>
          <div className="mb-2 text-sm font-medium">Record yourself</div>
          <div className="flex gap-2">
            {recording ? (
              <Button variant="destructive" onClick={stop}><Square className="mr-1 h-4 w-4" />Stop</Button>
            ) : (
              <Button onClick={start}><Mic className="mr-1 h-4 w-4" />Record</Button>
            )}
          </div>
          {userBlobUrl && <audio src={userBlobUrl} controls className="mt-3 w-full" />}
        </div>
      </CardContent>
    </Card>
  );
}
