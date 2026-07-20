import { motion } from "framer-motion";
import { useMemo } from "react";

type Country = { id: string; name: string; slug: string; flag_emoji: string | null };

// A stylized orbiting-globe motif. No heavy WebGL — just SVG + Framer Motion.
// Flags orbit around a rotating meridian sphere; each pin is a real country.
export function AnimatedGlobe({ countries }: { countries: Country[] }) {
  const items = useMemo(() => countries.slice(0, 8), [countries]);

  return (
    <div className="relative aspect-square w-full max-w-[560px]">
      {/* Halo */}
      <div className="absolute inset-8 rounded-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent blur-2xl" />

      {/* Sphere */}
      <motion.div
        className="absolute inset-8 rounded-full border border-primary/20 bg-gradient-to-br from-card via-sand to-primary/10 shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Meridians */}
        <motion.svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          <defs>
            <radialGradient id="sphereShade" cx="30%" cy="30%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.05)" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="49" fill="url(#sphereShade)" />
          {/* Longitudes */}
          {[15, 30, 45, 60, 75].map((r) => (
            <ellipse key={`lon-${r}`} cx="50" cy="50" rx={r} ry="49" fill="none" stroke="currentColor" strokeOpacity="0.12" />
          ))}
          {/* Latitudes */}
          {[15, 30, 45, 60, 75].map((r) => (
            <ellipse key={`lat-${r}`} cx="50" cy="50" rx="49" ry={r} fill="none" stroke="currentColor" strokeOpacity="0.12" />
          ))}
          <circle cx="50" cy="50" r="49" fill="none" stroke="currentColor" strokeOpacity="0.35" />
        </motion.svg>

        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="font-display text-5xl font-semibold text-primary">🌍</div>
            <div className="mt-1 font-display text-sm uppercase tracking-widest text-muted-foreground">
              Anywhere on earth
            </div>
          </div>
        </div>
      </motion.div>

      {/* Orbiting flag pins */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: -360 }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
      >
        {items.map((c, i) => {
          const angle = (i / Math.max(items.length, 1)) * Math.PI * 2;
          const radius = 47; // percentage
          const x = 50 + Math.cos(angle) * radius;
          const y = 50 + Math.sin(angle) * radius;
          return (
            <motion.div
              key={c.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.5 + i * 0.06 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                className="flex flex-col items-center gap-1"
              >
                <div className="rounded-full border bg-background/90 px-3 py-1.5 text-2xl shadow-md backdrop-blur">
                  {c.flag_emoji}
                </div>
                <div className="rounded-full bg-foreground/80 px-2 py-0.5 text-[10px] font-medium text-background">
                  {c.name}
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
