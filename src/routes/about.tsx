import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Lingua Terra" },
      { name: "description", content: "Why Lingua Terra exists — a global platform for language and cultural fluency." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <motion.h1 initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="font-display text-5xl font-semibold md:text-6xl">
        The world is not a foreign country.
      </motion.h1>
      <div className="prose prose-slate mt-8 max-w-none text-lg leading-relaxed">
        <p>
          Lingua Terra is a global learning platform for people whose lives cross borders — new hires abroad, long-term travelers,
          returning diaspora, or the simply curious. Every country on Lingua Terra is a first-class citizen. We treat São Paulo and Seoul
          with the same care we treat Paris and Tokyo.
        </p>
        <p>
          Our courses combine language, everyday etiquette, workplace norms, and the paperwork of settling in. We pair native video,
          hand-written lessons, and free YouTube tracks with a lesson-aware AI tutor that can pull the current visa rule from the open web,
          so you're not memorizing something out of date.
        </p>
        <p>
          Whether you're moving in three months or just curious about how the world speaks, Lingua Terra is the place to begin.
        </p>
      </div>
    </div>
  );
}
