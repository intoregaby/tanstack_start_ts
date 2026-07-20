
-- Success stories
CREATE TABLE public.success_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text,
  quote text NOT NULL,
  youtube_video_id text NOT NULL,
  avatar_url text,
  display_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.success_stories TO anon, authenticated;
GRANT ALL ON public.success_stories TO service_role;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published stories" ON public.success_stories FOR SELECT USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage stories" ON public.success_stories FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER set_stories_updated_at BEFORE UPDATE ON public.success_stories FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.success_stories (name, role, quote, youtube_video_id, avatar_url, display_order) VALUES
('Rachel L.', 'Moved to Kyoto, Japan', 'Lingua Terra''s culture lessons prepared me for daily life in Japan far better than any textbook could.', 'dQw4w9WgXcQ', 'https://i.pravatar.cc/120?img=47', 1),
('Luc M.', 'Relocated to Lisbon', 'The AI tutor answered every last-minute visa question. I landed knowing the neighborhoods already.', 'dQw4w9WgXcQ', 'https://i.pravatar.cc/120?img=12', 2),
('Daniel A.', 'Studying in Berlin', 'The flashcards and pronunciation practice got me conversational in German before my first semester.', 'dQw4w9WgXcQ', 'https://i.pravatar.cc/120?img=33', 3),
('Lauren K.', 'Traveling in Brazil', 'From workplace culture to street food — I felt at home in São Paulo in under two weeks.', 'dQw4w9WgXcQ', 'https://i.pravatar.cc/120?img=45', 4);

-- Referrals / affiliate program
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_points int NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reward_claimed_at timestamptz;

-- Backfill referral codes for existing profiles
UPDATE public.profiles SET referral_code = upper(substr(encode(gen_random_bytes(4),'hex'),1,8)) WHERE referral_code IS NULL;

CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  code text NOT NULL,
  points_awarded int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);
CREATE POLICY "referred can insert" ON public.referrals FOR INSERT WITH CHECK (auth.uid() = referred_user_id);

-- Trigger to give the referrer a point and issue reward when threshold reached
CREATE OR REPLACE FUNCTION public.on_referral_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_points int;
  already_claimed timestamptz;
BEGIN
  UPDATE public.profiles SET referral_points = referral_points + NEW.points_awarded
    WHERE id = NEW.referrer_id RETURNING referral_points, reward_claimed_at INTO new_points, already_claimed;

  -- Goal: 3 referrals → 30 days of Basic free
  IF new_points >= 3 AND already_claimed IS NULL THEN
    INSERT INTO public.subscriptions (user_id, tier, status, current_period_end)
    VALUES (NEW.referrer_id, 'basic', 'active', now() + interval '30 days')
    ON CONFLICT (user_id) DO UPDATE SET
      tier = CASE WHEN public.subscriptions.tier = 'premium' THEN 'premium' ELSE 'basic' END,
      status = 'active',
      current_period_end = GREATEST(coalesce(public.subscriptions.current_period_end, now()), now()) + interval '30 days';
    UPDATE public.profiles SET reward_claimed_at = now() WHERE id = NEW.referrer_id;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_on_referral_created AFTER INSERT ON public.referrals
FOR EACH ROW EXECUTE FUNCTION public.on_referral_created();

-- Auto-generate referral_code when a profile row is created
CREATE OR REPLACE FUNCTION public.set_referral_code()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := upper(substr(encode(gen_random_bytes(4),'hex'),1,8));
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_set_referral_code BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_referral_code();
