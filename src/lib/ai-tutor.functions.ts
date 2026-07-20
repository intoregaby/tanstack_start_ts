import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InputSchema = z.object({
  lessonId: z.string(),
  lessonTitle: z.string(),
  lessonContent: z.string().max(20000),
  countryName: z.string().optional(),
  useWebSearch: z.boolean().default(false),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).max(30),
});

async function tavilySearch(query: string, apiKey: string) {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, query, max_results: 5, search_depth: "basic" }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: Array<{ title: string; url: string; content: string }> };
    return data.results ?? [];
  } catch {
    return null;
  }
}

export const askTutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    if (!lovableKey) throw new Error("AI not configured");

    let webContext = "";
    let usedWebSearch = false;
    if (data.useWebSearch) {
      const tavilyKey = process.env.TAVILY_API_KEY;
      if (tavilyKey) {
        const lastUser = [...data.history].reverse().find((m) => m.role === "user");
        const q = lastUser?.content ?? data.lessonTitle;
        const results = await tavilySearch(`${data.countryName ?? ""} ${q}`.trim(), tavilyKey);
        if (results && results.length > 0) {
          usedWebSearch = true;
          webContext =
            "\n\nWeb search results (current, use if relevant):\n" +
            results.map((r, i) => `[${i + 1}] ${r.title} (${r.url})\n${r.content}`).join("\n\n");
        }
      }
    }

    const system = `You are a warm, precise tutor on Lingua Terra, a global language and lifestyle learning platform.
You are helping with the lesson "${data.lessonTitle}"${data.countryName ? ` about ${data.countryName}` : ""}.
Stay scoped to this lesson and the country's language/culture/relocation topics.
Format answers in short, readable Markdown. When asked to quiz, produce 3 numbered questions and wait.
When asked for a prep checklist, produce a grouped Markdown checklist (visas, housing, money, language, culture, day-1 tasks).

Lesson content:
"""
${data.lessonContent.slice(0, 8000)}
"""${webContext}`;

    const messages = [
      { role: "system", content: system },
      ...data.history.slice(-20).map((m) => ({ role: m.role, content: m.content })),
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": lovableKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages,
      }),
    });

    if (res.status === 429) throw new Error("Rate limited — please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Ask the workspace admin to add credits.");
    if (!res.ok) throw new Error(`AI error: ${res.status}`);

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const reply = json.choices?.[0]?.message?.content ?? "…";

    // Log (best-effort, ignore errors).
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const lastUser = [...data.history].reverse().find((m) => m.role === "user");
      await supabaseAdmin.from("ai_chat_logs").insert({
        user_id: context.userId,
        lesson_id: data.lessonId,
        query: lastUser?.content ?? "",
        response: reply,
        used_web_search: usedWebSearch,
      });
    } catch {
      // noop
    }

    return { reply, usedWebSearch };
  });
