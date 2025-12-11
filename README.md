# 🗺️ Map Me If You Can

A fun browser-based party game for remote teams! Players upload travel photos with locations, then guess where each photo was taken and who took it. Perfect for 10-15 minute team energizers.

## Features

- 🎮 Real-time multiplayer gameplay (3-10 players recommended)
- 📸 Photo submission with location marking
- 🗺️ Interactive Google Maps integration for guessing
- 🏆 Scoring based on location accuracy and correct owner identification
- 📱 Responsive design for desktop and mobile
- 🎨 Clean, modern UI with shadcn/ui and Tailwind CSS

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Database**: Supabase (Postgres + Storage)
- **UI**: shadcn/ui + Tailwind CSS
- **Maps**: Google Maps JavaScript API via @vis.gl/react-google-maps
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- A Supabase account and project
- A Google Cloud account with Maps JavaScript API enabled

### 1. Clone and Install

\`\`\`bash
pnpm install
\`\`\`

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema in the Supabase SQL Editor:

\`\`\`bash
# Copy the contents of supabase-schema.sql
# and run it in your Supabase SQL Editor
\`\`\`

3. Create a storage bucket:
   - Go to Storage in Supabase dashboard
   - Create a new bucket called `game-photos`
   - Make it public
   - Set up the storage policies (see comments in `supabase-schema.sql`)

4. Get your Supabase credentials:
   - Go to Settings > API in your Supabase project
   - Copy the project URL and anon/public key

### 3. Set Up Google Maps

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the **Maps JavaScript API**
4. Create an API key:
   - Go to Credentials
   - Create credentials > API key
   - (Optional but recommended) Restrict the key to Maps JavaScript API and your domain

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

\`\`\`bash
cp .env.local.example .env.local
\`\`\`

Edit `.env.local` with your credentials:

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
SUPABASE_SECRET_KEY=sb_secret_your_key_here

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
\`\`\`

**Note:** The Publishable key (starts with `sb_publishable_`) is safe for client-side use. The Secret key (starts with `sb_secret_`) is used for server-side operations and should be kept secure.

### 5. Run Development Server

\`\`\`bash
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Play

1. **Create Game**: One player creates a game and gets a unique game code
2. **Join**: Other players join using the game code and choose display names/avatars
3. **Submit Photos**: Each player uploads a travel photo and marks its location on a map
4. **Guess**: For each photo, players guess:
   - Where the photo was taken (click on map)
   - Who took the photo (select from player list)
5. **Score**: Points awarded for:
   - Location accuracy (up to 5000 points, decreases with distance)
   - Correct owner guess (+2000 bonus points)
6. **Winner**: Player with highest total score wins!

## Project Structure

\`\`\`
map-me-if-you-can/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── game/[code]/page.tsx     # Main game page
│   └── layout.tsx
├── components/
│   ├── game/                    # Game phase components
│   │   ├── GameClient.tsx       # Main game state manager
│   │   ├── Lobby.tsx
│   │   ├── SubmissionPhase.tsx
│   │   ├── RoundPhase.tsx
│   │   ├── RevealPhase.tsx
│   │   └── FinalResults.tsx
│   ├── landing/                 # Landing page components
│   ├── shared/                  # Shared components
│   │   └── MapPicker.tsx
│   └── ui/                      # shadcn/ui components
├── lib/
│   ├── supabase/               # Supabase client setup
│   ├── game-actions.ts         # Server actions
│   └── scoring.ts              # Scoring logic
├── types/
│   └── game.ts                 # TypeScript types
└── supabase-schema.sql         # Database schema
\`\`\`

## Deployment to Vercel

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
4. Deploy!

## Database Schema

The game uses four main tables:

- `games`: Game sessions with status tracking
- `players`: Players in each game with scores
- `photo_submissions`: Uploaded photos with true locations
- `guesses`: Player guesses with calculated scores

See `supabase-schema.sql` for full schema with indexes and policies.

## Scoring Formula

- **Location Score**: `max(0, 5000 - distance_km)`
  - Maximum 5000 points for exact location
  - Decreases linearly with distance
  - Zero points after 5000km

- **Owner Bonus**: 2000 points for correctly guessing who took the photo

- **Total Round Score**: Location Score + Owner Bonus

## Customization

### Adjusting Scoring

Edit `lib/scoring.ts` to change:
- Maximum distance for points
- Score decay rate
- Owner bonus amount

### Game Rules

Edit `lib/game-actions.ts` to change:
- Minimum players required
- Minimum submissions to start

### UI Theme

Modify Tailwind configuration and shadcn/ui theme in:
- `app/globals.css`
- `components.json`

## Troubleshooting

### Maps not loading
- Check Google Maps API key is correct
- Verify Maps JavaScript API is enabled in Google Cloud Console
- Check browser console for API errors

### Photos not uploading
- Verify Supabase storage bucket `game-photos` exists
- Check bucket is set to public
- Verify storage policies are configured

### Database errors
- Ensure `supabase-schema.sql` was run completely
- Check RLS policies are enabled
- Verify Supabase credentials in `.env.local`

## License

MIT

## Credits

Built with Next.js, Supabase, Google Maps, and shadcn/ui.
