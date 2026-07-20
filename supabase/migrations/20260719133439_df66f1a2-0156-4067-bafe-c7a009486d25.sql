
-- Public read tables (visitors can browse)
GRANT SELECT ON public.countries, public.courses, public.modules, public.lessons, public.events, public.event_gallery_images, public.resources, public.flashcards, public.quizzes TO anon, authenticated;

-- Authenticated user data
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles, public.subscriptions, public.progress, public.flashcard_progress, public.ai_chat_logs, public.user_roles TO authenticated;

-- Admin writes on content tables
GRANT INSERT, UPDATE, DELETE ON public.countries, public.courses, public.modules, public.lessons, public.events, public.event_gallery_images, public.resources, public.flashcards, public.quizzes TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
