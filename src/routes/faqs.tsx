import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export const Route = createFileRoute("/faqs")({
  head: () => ({
    meta: [
      { title: "FAQs — Lingua Terra" },
      { name: "description", content: "Answers to the most common questions about Lingua Terra courses, subscriptions, and features." },
      { property: "og:title", content: "FAQs — Lingua Terra" },
      { property: "og:description", content: "Everything you need to know about learning with Lingua Terra." },
    ],
  }),
  component: FaqsPage,
});

const FAQS = [
  {
    q: "What does a Lingua Terra subscription include?",
    a: "Basic gives you every written lesson, native video, flashcard deck, streaks, and completion certificates across every country in the catalog. Premium adds the AI Tutor with live web search, pronunciation practice, and personalized prep checklists.",
  },
  {
    q: "Do I need a subscription to try Lingua Terra?",
    a: "No. Every country has free courses that require no account and no payment. Free courses are clearly marked with a Free badge in the catalog.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your Dashboard and you keep access until the end of your current billing cycle.",
  },
  {
    q: "How does the AI Tutor work?",
    a: "The tutor is scoped to whichever lesson you're on, and it can search the live web for up-to-date answers — great for visa rules, current events, and things that change often. It's a Premium feature.",
  },
  {
    q: "How does the referral program work?",
    a: "Every account gets a personal referral code. Share it — when 3 friends sign up with your code, you automatically get 30 days of Basic for free. Your code and progress live on your Dashboard.",
  },
  {
    q: "Are the courses language or lifestyle focused?",
    a: "Both. Each country has language courses (beginner to conversational) plus lifestyle & relocation tracks covering visas, workplace culture, food, and daily life.",
  },
  {
    q: "Can I switch between Basic and Premium?",
    a: "Yes — upgrade or downgrade anytime from your Dashboard. Changes take effect at your next billing cycle.",
  },
  {
    q: "Do you support Google sign-in?",
    a: "Yes. You can sign in or create an account with Google in one click from the sign-in page or the popup on the homepage.",
  },
  {
    q: "How do certificates work?",
    a: "When you complete every lesson in a course, a certificate is generated automatically and lives in your Dashboard.",
  },
  {
    q: "Can I request a country that isn't listed yet?",
    a: "Absolutely — head to the Contact page and let us know. Our catalog is continuously expanding.",
  },
];

function FaqsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <HelpCircle className="h-3.5 w-3.5" /> Help center
        </div>
        <h1 className="mt-4 font-display text-4xl font-semibold md:text-5xl">Frequently asked questions</h1>
        <p className="mt-3 text-muted-foreground">
          Can't find an answer? <Link to="/about" className="text-primary underline">Reach out</Link> and we'll help.
        </p>
      </motion.div>

      <Accordion type="single" collapsible className="mt-10">
        {FAQS.map((f, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left font-medium">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
