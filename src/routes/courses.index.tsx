import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen, Sparkles, Lock, Play, SlidersHorizontal, X, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/courses/")({
  head: () => ({
    meta: [
      { title: "Courses catalog — Lingua Terra" },
      { name: "description", content: "Browse every language and lifestyle course on Lingua Terra. Filter by country, tier, and type." },
    ],
  }),
  component: CoursesCatalog,
});

type Tier = "free" | "basic" | "premium";
type Type = "language" | "lifestyle";
type SortKey = "recommended" | "newest" | "az" | "free";

function CoursesCatalog() {
  const { data, isLoading } = useQuery({
    queryKey: ["courses", "catalog"],
    queryFn: async () => {
      const [{ data: courses, error: e1 }, { data: countries, error: e2 }] = await Promise.all([
        supabase
          .from("courses")
          .select("id, title, description, type, tier_required, cover_image_url, created_at, country_id")
          .eq("is_published", true)
          .order("created_at", { ascending: false }),
        supabase
          .from("countries")
          .select("id, name, slug, flag_emoji")
          .eq("is_published", true)
          .order("name"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return { courses: courses ?? [], countries: countries ?? [] };
    },
  });

  const [q, setQ] = useState("");
  const [tiers, setTiers] = useState<Set<Tier>>(new Set());
  const [types, setTypes] = useState<Set<Type>>(new Set());
  const [countryIds, setCountryIds] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortKey>("recommended");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const countryById = useMemo(() => {
    const m = new Map<string, { name: string; slug: string; flag_emoji: string | null }>();
    (data?.countries ?? []).forEach((c) => m.set(c.id, c));
    return m;
  }, [data]);

  const filtered = useMemo(() => {
    let list = data?.courses ?? [];
    const query = q.trim().toLowerCase();
    if (query) {
      list = list.filter((c) => {
        const co = countryById.get(c.country_id);
        return (
          c.title.toLowerCase().includes(query) ||
          (c.description ?? "").toLowerCase().includes(query) ||
          (co?.name.toLowerCase().includes(query) ?? false)
        );
      });
    }
    if (tiers.size) list = list.filter((c) => tiers.has(c.tier_required as Tier));
    if (types.size) list = list.filter((c) => types.has(c.type as Type));
    if (countryIds.size) list = list.filter((c) => countryIds.has(c.country_id));

    const sorted = [...list];
    if (sort === "az") sorted.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "newest") sorted.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    else if (sort === "free") sorted.sort((a, b) => Number(b.tier_required === "free") - Number(a.tier_required === "free"));
    // "recommended" keeps DB order (created_at desc)
    return sorted;
  }, [data, q, tiers, types, countryIds, sort, countryById]);

  const featured = useMemo(() => (data?.courses ?? []).slice(0, 3), [data]);

  const activeFilters = tiers.size + types.size + countryIds.size;

  function toggle<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  function clearAll() {
    setTiers(new Set());
    setTypes(new Set());
    setCountryIds(new Set());
    setQ("");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header banner */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/10 via-background to-coral/10">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-sm uppercase tracking-widest text-muted-foreground">Course catalog</div>
            <h1 className="mt-1 font-display text-4xl font-semibold md:text-5xl">
              Learn a language. Live the culture.
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              {isLoading ? "Loading courses…" : `${data?.courses.length ?? 0} courses across ${data?.countries.length ?? 0} countries`}
            </p>

            <div className="mt-6 flex max-w-2xl items-center gap-2 rounded-full border bg-background px-4 py-2 shadow-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search courses, countries, or topics…"
                className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              />
              {q && (
                <button onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured strip */}
      {!isLoading && featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-2">
            <Star className="h-4 w-4 text-coral" />
            <h2 className="font-display text-xl font-semibold">Featured this week</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {featured.map((c, i) => {
              const co = countryById.get(c.country_id);
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link
                    to="/courses/$courseId"
                    params={{ courseId: c.id }}
                    className="group relative flex h-40 items-end overflow-hidden rounded-2xl border bg-card"
                  >
                    {c.cover_image_url && (
                      <img
                        src={c.cover_image_url}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="relative w-full p-4 text-white">
                      <div className="flex items-center gap-2 text-xs">
                        <span>{co?.flag_emoji}</span>
                        <span className="opacity-90">{co?.name}</span>
                        <TierPill tier={c.tier_required as Tier} tone="dark" />
                      </div>
                      <div className="mt-1 line-clamp-2 font-display text-lg font-semibold">{c.title}</div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Toolbar + grid */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* Sidebar filters (desktop) — sticky */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
              <FilterPanel
                countries={data?.countries ?? []}
                tiers={tiers}
                types={types}
                countryIds={countryIds}
                onToggleTier={(t) => toggle(tiers, t, setTiers)}
                onToggleType={(t) => toggle(types, t, setTypes)}
                onToggleCountry={(id) => toggle(countryIds, id, setCountryIds)}
                onClear={clearAll}
                activeCount={activeFilters}
              />
            </div>
          </aside>

          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  <SlidersHorizontal className="mr-1.5 h-4 w-4" /> Filters
                  {activeFilters > 0 && (
                    <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{activeFilters}</span>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{filtered.length}</span> course{filtered.length !== 1 && "s"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Sort by</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="rounded-md border bg-background px-3 py-1.5 text-sm"
                >
                  <option value="recommended">Recommended</option>
                  <option value="newest">Newest</option>
                  <option value="az">A – Z</option>
                  <option value="free">Free first</option>
                </select>
              </div>
            </div>

            {activeFilters > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {[...tiers].map((t) => (
                  <Chip key={t} onRemove={() => toggle(tiers, t, setTiers)}>{tierLabel(t)}</Chip>
                ))}
                {[...types].map((t) => (
                  <Chip key={t} onRemove={() => toggle(types, t, setTypes)}>{t === "language" ? "Language" : "Lifestyle"}</Chip>
                ))}
                {[...countryIds].map((id) => (
                  <Chip key={id} onRemove={() => toggle(countryIds, id, setCountryIds)}>
                    {countryById.get(id)?.flag_emoji} {countryById.get(id)?.name}
                  </Chip>
                ))}
                <button onClick={clearAll} className="text-xs font-medium text-primary underline underline-offset-4">Clear all</button>
              </div>
            )}

            {isLoading ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed p-12 text-center">
                <p className="font-display text-lg">No courses match those filters</p>
                <p className="mt-1 text-sm text-muted-foreground">Try removing a filter or clearing your search.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={clearAll}>Clear filters</Button>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((c, i) => {
                  const co = countryById.get(c.country_id);
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    >
                      <Link
                        to="/courses/$courseId"
                        params={{ courseId: c.id }}
                        className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                          {c.cover_image_url && (
                            <img
                              src={c.cover_image_url}
                              alt=""
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                          )}
                          <div className="absolute left-3 top-3 flex items-center gap-2">
                            <TierPill tier={c.tier_required as Tier} />
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col gap-3 p-5">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="text-base">{co?.flag_emoji}</span>
                            <span>{co?.name}</span>
                            <span className="text-muted-foreground/40">•</span>
                            <Badge variant="secondary" className="gap-1 py-0 text-[10px]">
                              {c.type === "language" ? <BookOpen className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                              {c.type === "language" ? "Language" : "Lifestyle"}
                            </Badge>
                          </div>
                          <h3 className="font-display text-lg font-semibold leading-tight group-hover:text-primary">
                            {c.title}
                          </h3>
                          <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                          <div className="mt-auto flex items-center gap-1 pt-2 text-sm font-medium text-primary">
                            <Play className="h-3.5 w-3.5" /> Start course
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute inset-y-0 left-0 w-[85%] max-w-sm overflow-y-auto bg-background p-5 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Filters</h3>
              <button onClick={() => setMobileFiltersOpen(false)} className="rounded-md p-1 hover:bg-accent">
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterPanel
              countries={data?.countries ?? []}
              tiers={tiers}
              types={types}
              countryIds={countryIds}
              onToggleTier={(t) => toggle(tiers, t, setTiers)}
              onToggleType={(t) => toggle(types, t, setTypes)}
              onToggleCountry={(id) => toggle(countryIds, id, setCountryIds)}
              onClear={clearAll}
              activeCount={activeFilters}
            />
            <Button className="mt-6 w-full" onClick={() => setMobileFiltersOpen(false)}>
              Show {filtered.length} result{filtered.length !== 1 && "s"}
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function tierLabel(t: Tier) {
  return t === "free" ? "Free" : t === "basic" ? "Basic" : "Premium";
}

function TierPill({ tier, tone = "light" }: { tier: Tier; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  if (tier === "free")
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", "bg-coral text-coral-foreground")}>
        <Sparkles className="h-2.5 w-2.5" /> Free
      </span>
    );
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
        dark ? "bg-white/90 text-foreground" : "bg-background text-foreground border",
      )}
    >
      <Lock className="h-2.5 w-2.5" /> {tierLabel(tier)}
    </span>
  );
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border bg-accent/50 px-3 py-1 text-xs font-medium">
      {children}
      <button onClick={onRemove} className="ml-0.5 rounded-full hover:bg-accent">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function FilterPanel({
  countries,
  tiers,
  types,
  countryIds,
  onToggleTier,
  onToggleType,
  onToggleCountry,
  onClear,
  activeCount,
}: {
  countries: Array<{ id: string; name: string; flag_emoji: string | null }>;
  tiers: Set<Tier>;
  types: Set<Type>;
  countryIds: Set<string>;
  onToggleTier: (t: Tier) => void;
  onToggleType: (t: Type) => void;
  onToggleCountry: (id: string) => void;
  onClear: () => void;
  activeCount: number;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          <h2 className="font-display text-base font-semibold">Filters</h2>
        </div>
        {activeCount > 0 && (
          <button onClick={onClear} className="text-xs font-medium text-primary underline underline-offset-4">
            Clear
          </button>
        )}
      </div>

      <FilterGroup title="Access">
        {(["free", "basic", "premium"] as Tier[]).map((t) => (
          <FilterCheckbox key={t} checked={tiers.has(t)} onChange={() => onToggleTier(t)}>
            {tierLabel(t)}
          </FilterCheckbox>
        ))}
      </FilterGroup>

      <FilterGroup title="Course type">
        {(["language", "lifestyle"] as Type[]).map((t) => (
          <FilterCheckbox key={t} checked={types.has(t)} onChange={() => onToggleType(t)}>
            {t === "language" ? "Language" : "Lifestyle & relocation"}
          </FilterCheckbox>
        ))}
      </FilterGroup>

      <FilterGroup title="Country">
        <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
          {countries.map((c) => (
            <FilterCheckbox key={c.id} checked={countryIds.has(c.id)} onChange={() => onToggleCountry(c.id)}>
              <span className="mr-1">{c.flag_emoji}</span> {c.name}
            </FilterCheckbox>
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function FilterCheckbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span>{children}</span>
    </label>
  );
}
