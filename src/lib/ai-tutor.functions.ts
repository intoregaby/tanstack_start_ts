import { createServerFn } from "@tanstack/react-start";
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
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

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

    let reply = "";

    // 1. Try Lovable AI Gateway
    if (lovableKey) {
      try {
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
        if (res.ok) {
          const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
          reply = json.choices?.[0]?.message?.content ?? "";
        }
      } catch {
        // fallback
      }
    }

    // 2. Try OpenAI API
    if (!reply && openaiKey) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages,
          }),
        });
        if (res.ok) {
          const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
          reply = json.choices?.[0]?.message?.content ?? "";
        }
      } catch {
        // fallback
      }
    }

    // 3. Fallback response for instant Q&A / Quiz / Prep Checklist
    if (!reply) {
      const lastUser = [...data.history].reverse().find((m) => m.role === "user")?.content.toLowerCase() || "";
      if (lastUser.includes("quiz")) {
        reply = `### 📝 Lesson Quiz: ${data.lessonTitle}\n\n1. What is the main greeting or essential phrase introduced in **${data.lessonTitle}**?\n2. What is a key cultural custom or social etiquette practice in **${data.countryName || "this country"}**?\n3. How would you apply what you learned in this lesson during your first day visiting?\n\n*Reply with your answers to test your knowledge!*`;
      } else if (lastUser.includes("checklist") || lastUser.includes("prep")) {
        reply = `### 📋 Relocation & Travel Prep Checklist for ${data.countryName || "your journey"}\n\n#### 📑 Documents & Visas\n- [ ] Valid passport (min 6 months validity)\n- [ ] Entry visa or tourist permit documentation\n\n#### 💳 Money & Banking\n- [ ] Local currency / international travel card\n- [ ] Proof of accommodation reservation\n\n#### 🗣️ Culture & Language\n- [ ] Master core vocabulary in **${data.lessonTitle}**\n- [ ] Review tipping, dining, and greeting etiquette`;
      } else {
        reply = `In **${data.lessonTitle}**${data.countryName ? ` (${data.countryName})` : ""}, learning key language phrases alongside local lifestyle and cultural norms ensures you travel or relocate with confidence.\n\n*Tip: Click **Quiz me** or **Prep checklist** below for interactive practice!*`;
      }
    }

    return { reply, usedWebSearch };
  });
