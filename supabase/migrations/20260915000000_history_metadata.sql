alter table public.listening_events
  add column album     text,   -- album name; null when Last.fm omits it
  add column image_url text;   -- largest non-placeholder album-art URL; null when none
