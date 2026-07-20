
-- Add hero images to existing countries (using picsum seeded landscapes)
UPDATE public.countries SET hero_image_url = 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&q=80&auto=format&fit=crop' WHERE slug = 'japan';
UPDATE public.countries SET hero_image_url = 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80&auto=format&fit=crop' WHERE slug = 'france';
UPDATE public.countries SET hero_image_url = 'https://images.unsplash.com/photo-1544989164-31dc3c645987?w=1600&q=80&auto=format&fit=crop' WHERE slug = 'rwanda';
UPDATE public.countries SET hero_image_url = 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1600&q=80&auto=format&fit=crop' WHERE slug = 'brazil';
UPDATE public.countries SET hero_image_url = 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1600&q=80&auto=format&fit=crop' WHERE slug = 'germany';
UPDATE public.countries SET hero_image_url = 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=1600&q=80&auto=format&fit=crop' WHERE slug = 'south-korea';

-- Add cover images to existing courses (unique per course id via picsum seed)
UPDATE public.courses SET cover_image_url = 'https://picsum.photos/seed/' || id::text || '/800/500' WHERE cover_image_url IS NULL;

-- Insert 6 new countries
INSERT INTO public.countries (name, slug, flag_emoji, intro_text, hero_image_url, is_published, display_order) VALUES
  ('Italy', 'italy', '🇮🇹', 'La dolce vita — art, coastlines, and long lunches. Learn Italian and the rhythm of daily life from Milan to Palermo.', 'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=1600&q=80&auto=format&fit=crop', true, 7),
  ('Spain', 'spain', '🇪🇸', 'Sun-drenched plazas, late dinners, and a language spoken across three continents. Start with Spanish and Spanish customs.', 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=1600&q=80&auto=format&fit=crop', true, 8),
  ('China', 'china', '🇨🇳', 'Ancient capitals, megacities, and a language of tones. Learn Mandarin plus the etiquette that opens doors.', 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1600&q=80&auto=format&fit=crop', true, 9),
  ('Mexico', 'mexico', '🇲🇽', 'Warm hospitality, deep food culture, and a language that connects half a hemisphere. Start with Mexican Spanish.', 'https://images.unsplash.com/photo-1512813195386-6cf811ad3542?w=1600&q=80&auto=format&fit=crop', true, 10),
  ('Portugal', 'portugal', '🇵🇹', 'Atlantic light, tiled walls, and a soft, musical language. Perfect for digital nomads and long-stay travelers.', 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1600&q=80&auto=format&fit=crop', true, 11),
  ('India', 'india', '🇮🇳', 'A subcontinent of languages, cuisines, and traditions. Start with Hindi and the customs that carry you through daily life.', 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1600&q=80&auto=format&fit=crop', true, 12);

-- Free intro + basic living course for each new country
INSERT INTO public.courses (country_id, title, description, type, tier_required, cover_image_url, is_published, display_order)
SELECT c.id, 'Hello ' || c.name || ' — Free intro', 'A free YouTube-based intro to ' || c.name || ': greetings, first phrases, and what daily life feels like.', 'language', 'free', 'https://picsum.photos/seed/hello-' || c.slug || '/800/500', true, 1
FROM public.countries c WHERE c.slug IN ('italy','spain','china','mexico','portugal','india');

INSERT INTO public.courses (country_id, title, description, type, tier_required, cover_image_url, is_published, display_order)
SELECT c.id, 'First Words — ' || c.name, 'The essential 100 words and phrases you actually use in ' || c.name || '. Free and self-paced.', 'language', 'free', 'https://picsum.photos/seed/firstwords-' || c.slug || '/800/500', true, 2
FROM public.countries c WHERE c.slug IN ('italy','spain','china','mexico','portugal','india');

INSERT INTO public.courses (country_id, title, description, type, tier_required, cover_image_url, is_published, display_order)
SELECT c.id, 'Living in ' || c.name || ' — Basics', 'Visas, paperwork, banks, transport, and social customs. Everything a newcomer to ' || c.name || ' needs first.', 'lifestyle', 'basic', 'https://picsum.photos/seed/living-' || c.slug || '/800/500', true, 3
FROM public.countries c WHERE c.slug IN ('italy','spain','china','mexico','portugal','india');
