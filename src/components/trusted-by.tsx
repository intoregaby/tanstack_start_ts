import { motion } from "framer-motion";

const LOGOS = [
  {
    name: "Microsoft",
    svg: (
      <svg viewBox="0 0 108 24" className="h-6 w-auto">
        <rect x="0" y="0" width="10" height="10" fill="#F35325" />
        <rect x="12" y="0" width="10" height="10" fill="#81BC06" />
        <rect x="0" y="12" width="10" height="10" fill="#05A6F0" />
        <rect x="12" y="12" width="10" height="10" fill="#FFBA08" />
        <text x="28" y="17" fontFamily="Segoe UI, Arial" fontSize="15" fill="currentColor">Microsoft</text>
      </svg>
    ),
  },
  {
    name: "Coursera",
    svg: (
      <svg viewBox="0 0 140 24" className="h-6 w-auto">
        <circle cx="12" cy="12" r="10" fill="none" stroke="#0056D2" strokeWidth="3" />
        <text x="30" y="17" fontFamily="Arial" fontWeight="700" fontSize="15" fill="currentColor">coursera</text>
      </svg>
    ),
  },
  {
    name: "Duolingo",
    svg: (
      <svg viewBox="0 0 140 24" className="h-6 w-auto">
        <ellipse cx="12" cy="12" rx="9" ry="10" fill="#58CC02" />
        <ellipse cx="9" cy="9" rx="2" ry="2.5" fill="#fff" />
        <text x="28" y="17" fontFamily="Nunito, Arial" fontWeight="800" fontSize="15" fill="currentColor">duolingo</text>
      </svg>
    ),
  },
  {
    name: "Udemy",
    svg: (
      <svg viewBox="0 0 100 24" className="h-6 w-auto">
        <text x="0" y="18" fontFamily="Arial" fontWeight="800" fontSize="18" fill="currentColor">udemy</text>
        <circle cx="82" cy="12" r="4" fill="#A435F0" />
      </svg>
    ),
  },
  {
    name: "Babbel",
    svg: (
      <svg viewBox="0 0 100 24" className="h-6 w-auto">
        <text x="0" y="18" fontFamily="Arial" fontWeight="800" fontSize="18" fill="currentColor">Babbel</text>
        <circle cx="82" cy="6" r="3" fill="#FF7B02" />
      </svg>
    ),
  },
];

export function TrustedBy() {
  return (
    <section className="border-y bg-muted/30 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Trusted by learners inspired by the best
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 text-muted-foreground">
          {LOGOS.map((l, i) => (
            <motion.div
              key={l.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0"
              aria-label={l.name}
            >
              {l.svg}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
