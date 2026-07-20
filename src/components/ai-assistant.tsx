import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import { Loader2, Send, Globe, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { askTutor } from "@/lib/ai-tutor.functions";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string; usedWeb?: boolean };

export function AiAssistant({
  lessonId,
  lessonTitle,
  lessonContent,
  countryName,
}: {
  lessonId: string;
  lessonTitle: string;
  lessonContent: string;
  countryName?: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: `Hi! I'm your tutor for **${lessonTitle}**. Ask me anything about this lesson${countryName ? ` or life in ${countryName}` : ""}. I can also search the web for current info like visa rules.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const ask = useServerFn(askTutor);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (prompt?: string) => {
    const text = (prompt ?? input).trim();
    if (!text || loading) return;
    setInput("");
    const nextMsgs: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(nextMsgs);
    setLoading(true);
    try {
      const res = await ask({
        data: {
          lessonId,
          lessonTitle,
          lessonContent,
          countryName,
          useWebSearch: webSearch,
          history: nextMsgs.map((m) => ({ role: m.role, content: m.content })),
        },
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply, usedWeb: res.usedWebSearch }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Tutor unavailable";
      toast.error(msg);
      setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex h-[560px] flex-col">
      <CardContent ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
              {m.usedWeb && <div className="mt-1 flex items-center gap-1 text-[10px] opacity-70"><Globe className="h-2.5 w-2.5" />Web search</div>}
            </div>
          </div>
        ))}
        {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…</div>}
      </CardContent>
      <div className="border-t p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          <Badge
            variant={webSearch ? "default" : "outline"}
            className="cursor-pointer gap-1"
            onClick={() => setWebSearch(!webSearch)}
          >
            <Globe className="h-3 w-3" /> Web search {webSearch ? "on" : "off"}
          </Badge>
          <Badge
            variant="secondary"
            className="cursor-pointer gap-1"
            onClick={() => send(`Generate a personalized prep checklist for someone moving${countryName ? ` to ${countryName}` : ""} in 3 months.`)}
          >
            <ListChecks className="h-3 w-3" /> Prep checklist
          </Badge>
          <Badge
            variant="secondary"
            className="cursor-pointer"
            onClick={() => send("Quiz me on this lesson with 3 questions.")}
          >
            Quiz me
          </Badge>
        </div>
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this lesson…"
            rows={2}
            className="resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button size="icon" onClick={() => send()} disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
