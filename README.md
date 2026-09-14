<img src="public/playabl-banner.svg" alt="Playabl" width="100%" />

# Playabl

Playabl is a social listening app connected to Spotify. Every second of music you listen to earns you points — compete on the global leaderboard, maintain daily streaks, and share your stats with friends.

## Key Features

### Points
Every second of verified listening earns you a point — tracked server-side via Spotify's recently-played API so there's no cheating.

![Points](public/points.png)

### Leaderboard
Compete on the global all-time leaderboard, updated every ~3 minutes as listening events roll in.

![Leaderboard](public/leaderboard.png)

### Streaks
Keep your daily listening streak alive. Miss a day and it resets — just like Duolingo.

![Streaks](public/streaks.png)

### Activity Heatmap
A GitHub-style heatmap of your listening history. Deeper colour = more listening that day.

![Activity Heatmap](public/activity-heatmap.png)

### Now Playing
A live widget that shows the track you're currently listening to.

![Now Playing](public/now-playing.png)

## Stack

Next.js · Supabase (Auth, Postgres, Edge Functions, pg_cron) · Spotify API · Tailwind CSS · shadcn/ui
