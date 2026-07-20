
-- ==== ENUMS ====
CREATE TYPE public.app_role AS ENUM ('admin', 'subscriber');
CREATE TYPE public.course_type AS ENUM ('language', 'lifestyle');
CREATE TYPE public.tier_level AS ENUM ('free', 'basic', 'premium');
CREATE TYPE public.lesson_type AS ENUM ('written', 'video', 'youtube', 'mixed');
CREATE TYPE public.subscription_tier AS ENUM ('basic', 'premium');
CREATE TYPE public.subscription_status_enum AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid');

-- ==== UPDATED_AT TRIGGER FN ====
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ==== PROFILES ====
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles: users read own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles: users update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles: users insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==== USER ROLES ====
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Roles: user reads own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- ==== SUBSCRIPTIONS ====
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tier public.subscription_tier NOT NULL,
  status public.subscription_status_enum NOT NULL DEFAULT 'incomplete',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subs: user reads own" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_subs_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Helper: does user have an active subscription (>= given tier)?
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id UUID, _min_tier public.subscription_tier DEFAULT 'basic')
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND status IN ('active','trialing')
      AND (current_period_end IS NULL OR current_period_end > now())
      AND (
        _min_tier = 'basic'
        OR (_min_tier = 'premium' AND tier = 'premium')
      )
  );
$$;

-- ==== COUNTRIES ====
CREATE TABLE public.countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  flag_emoji TEXT,
  flag_image_url TEXT,
  intro_text TEXT,
  hero_image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.countries TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.countries TO authenticated;
GRANT ALL ON public.countries TO service_role;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Countries: public reads published" ON public.countries FOR SELECT TO anon, authenticated USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Countries: admin writes" ON public.countries FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_countries_updated BEFORE UPDATE ON public.countries FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ==== COURSES ====
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type public.course_type NOT NULL DEFAULT 'language',
  tier_required public.tier_level NOT NULL DEFAULT 'basic',
  cover_image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Courses: public reads published" ON public.courses FOR SELECT TO anon, authenticated USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Courses: admin writes" ON public.courses FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_courses_updated BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_courses_country ON public.courses(country_id);

-- ==== MODULES ====
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.modules TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.modules TO authenticated;
GRANT ALL ON public.modules TO service_role;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Modules: public reads" ON public.modules FOR SELECT TO anon, authenticated USING (
  EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND (c.is_published = true OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Modules: admin writes" ON public.modules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_modules_course ON public.modules(course_id);

-- ==== LESSONS ====
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type public.lesson_type NOT NULL DEFAULT 'written',
  content TEXT,
  video_url TEXT,
  youtube_video_id TEXT,
  native_audio_url TEXT,
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lessons TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
-- Lesson metadata (title, type) readable by everyone if parent course is published; content gating happens in the server layer, but for row visibility:
CREATE POLICY "Lessons: free-tier and admin"
ON public.lessons FOR SELECT TO anon, authenticated USING (
  EXISTS (
    SELECT 1 FROM public.modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = module_id
      AND (c.is_published = true OR public.has_role(auth.uid(), 'admin'))
      AND (
        c.tier_required = 'free'
        OR public.has_role(auth.uid(), 'admin')
        OR (c.tier_required = 'basic'  AND public.has_active_subscription(auth.uid(), 'basic'))
        OR (c.tier_required = 'premium' AND public.has_active_subscription(auth.uid(), 'premium'))
      )
  )
);
CREATE POLICY "Lessons: admin writes" ON public.lessons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_lessons_updated BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_lessons_module ON public.lessons(module_id);

-- ==== FLASHCARDS ====
CREATE TABLE public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  translation TEXT NOT NULL,
  example_sentence TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.flashcards TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.flashcards TO authenticated;
GRANT ALL ON public.flashcards TO service_role;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Flashcards: follow lesson visibility" ON public.flashcards FOR SELECT TO anon, authenticated USING (
  EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id)
);
CREATE POLICY "Flashcards: admin writes" ON public.flashcards FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Per-user flashcard SRS
CREATE TABLE public.flashcard_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  ease_factor REAL NOT NULL DEFAULT 2.5,
  interval_days INT NOT NULL DEFAULT 0,
  repetitions INT NOT NULL DEFAULT 0,
  due_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_reviewed_at TIMESTAMPTZ,
  UNIQUE (user_id, flashcard_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcard_progress TO authenticated;
GRANT ALL ON public.flashcard_progress TO service_role;
ALTER TABLE public.flashcard_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "FCP: own rows" ON public.flashcard_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==== PROGRESS ====
CREATE TABLE public.progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  streak_count INT NOT NULL DEFAULT 1,
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.progress TO authenticated;
GRANT ALL ON public.progress TO service_role;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Progress: own rows" ON public.progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_progress_user ON public.progress(user_id);

-- ==== QUIZZES ====
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quizzes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quizzes: follow lesson" ON public.quizzes FOR SELECT TO anon, authenticated USING (
  EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id)
);
CREATE POLICY "Quizzes: admin writes" ON public.quizzes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ==== RESOURCES ====
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by_admin_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.resources TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Resources: follow course" ON public.resources FOR SELECT TO anon, authenticated USING (
  EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.is_published = true)
);
CREATE POLICY "Resources: admin writes" ON public.resources FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ==== AI CHAT LOGS ====
CREATE TABLE public.ai_chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  response TEXT,
  used_web_search BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ai_chat_logs TO authenticated;
GRANT ALL ON public.ai_chat_logs TO service_role;
ALTER TABLE public.ai_chat_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AI logs: own rows" ON public.ai_chat_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "AI logs: insert own" ON public.ai_chat_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ==== EVENTS ====
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  short_description TEXT,
  trailer_url TEXT,
  trailer_is_youtube BOOLEAN NOT NULL DEFAULT false,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_name TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events: public reads published" ON public.events FOR SELECT TO anon, authenticated USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Events: admin writes" ON public.events FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.event_gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  "order" INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.event_gallery_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.event_gallery_images TO authenticated;
GRANT ALL ON public.event_gallery_images TO service_role;
ALTER TABLE public.event_gallery_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Event images: follow event" ON public.event_gallery_images FOR SELECT TO anon, authenticated USING (
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND (e.is_published = true OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Event images: admin writes" ON public.event_gallery_images FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ==== SEED: 6 countries + placeholder free courses ====
INSERT INTO public.countries (name, slug, flag_emoji, intro_text, display_order) VALUES
('Japan', 'japan', '🇯🇵', 'Meticulous, seasonal, and quietly bold — learn the language of everyday life in modern Japan.', 1),
('France', 'france', '🇫🇷', 'From boulangerie mornings to Parisian night markets — French for living, not just tourism.', 2),
('Rwanda', 'rwanda', '🇷🇼', 'The land of a thousand hills. Speak Kinyarwanda and move through Rwandan daily life with ease.', 3),
('Brazil', 'brazil', '🇧🇷', 'Warmth, rhythm, and Portuguese as it is actually spoken from Rio to Salvador.', 4),
('Germany', 'germany', '🇩🇪', 'Precise but playful. Learn everyday German — plus the paperwork culture that comes with it.', 5),
('South Korea', 'south-korea', '🇰🇷', 'Fast-moving, deeply layered. Hangul, café culture, and the etiquette that keeps it all running.', 6);

-- Placeholder intro courses (free, unpublished-friendly starter content)
INSERT INTO public.courses (country_id, title, description, type, tier_required, display_order)
SELECT id, 'First Words — ' || name, 'A short taste of the language: greetings, thank-yous, and a few phrases that open doors. More lessons coming soon.', 'language', 'free', 1
FROM public.countries;

INSERT INTO public.courses (country_id, title, description, type, tier_required, display_order)
SELECT id, 'Living in ' || name || ' — Basics', 'A lifestyle & relocation primer: visas, everyday customs, and what daily life actually feels like. Coming soon.', 'lifestyle', 'basic', 2
FROM public.countries;

-- One placeholder module + lesson per free course so the catalog isn't empty
INSERT INTO public.modules (course_id, title, "order")
SELECT id, 'Getting Started', 1 FROM public.courses WHERE tier_required = 'free';

INSERT INTO public.lessons (module_id, title, type, content, "order")
SELECT m.id,
       'Welcome',
       'written',
       E'# Welcome\n\nThis is a preview lesson. Full course content is on the way — check back soon or subscribe to unlock our growing library of language and lifestyle tracks.',
       1
FROM public.modules m;
