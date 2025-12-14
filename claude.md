# Map Me If You Can - Project Context

## Project Overview

**Map Me If You Can** is a multiplayer geolocation guessing game inspired by GeoGuessr. Players submit photos with location data, then take turns guessing where other players' photos were taken on a map. The closer your guess, the more points you score.

**Status:** Active development, no production users yet
**Stage:** Core functionality complete, planning UI refactor

---

## Tech Stack

### Core
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Backend:** Supabase (PostgreSQL + Realtime + Storage)

### Key Libraries
- **UI Components:** Radix UI, shadcn/ui components
- **Maps:** @vis.gl/react-google-maps (Google Maps)
- **Image Processing:** exifr (EXIF data extraction)
- **Testing:** Vitest
- **Linting:** Biome (replaces ESLint + Prettier)

### Planned Additions
- **State Management:** XState (for game state machine)
- **Image Viewer:** react-zoom-pan-pinch (pan/zoom)
- **Bottom Sheets:** vaul (mobile drawer/sheet)

---

## Architecture

### Current Structure

```
app/
  page.tsx                    - Home/landing page
  game/[code]/page.tsx        - Game lobby and gameplay

components/
  game/
    LobbyPhase.tsx           - Waiting room
    SubmissionPhase.tsx      - Players submit photos
    RoundPhase.tsx           - Guessing phase
    RevealPhase.tsx          - Round results
    FinalResults.tsx         - Game over screen
  shared/
    MapPicker.tsx            - Location selection
    PlayerAvatar.tsx         - Avatar display
  ui/                        - shadcn/ui components

lib/
  game-actions.ts            - Server actions for game logic
  scoring.ts                 - Score calculation
  supabase/                  - Database client setup

types/
  game.ts                    - TypeScript types

supabase/
  migrations/                - Database schema
```

### Database Schema

**Tables:**
- `games` - Game sessions (status, code, current_photo_index)
- `players` - Players in games (display_name, total_score, is_host)
- `photo_submissions` - Submitted photos (image_url, true_lat, true_lng)
- `guesses` - Player guesses (guessed_lat, guessed_lng, distance_km, location_score, score_applied)

**Key Pattern:**
- `score_applied` flag on guesses controls when scores appear in leaderboard
- Scores are **calculated on-demand** from guesses table (not stored on players)
- This prevents double-scoring race conditions

### Game Flow

```
Lobby → Submission → Playing → Finished
                        ↓
                  Guessing ⇄ Revealing
                  (per photo)
```

**Phases:**
1. **Lobby:** Players join via game code
2. **Submission:** Each player uploads a photo + location
3. **Playing:** For each photo:
   - **Guessing:** Players guess location on map
   - **Revealing:** Show results, update scores
4. **Finished:** Final leaderboard, option to play again

---

## Key Patterns & Conventions

### Server Actions
All game logic uses Next.js Server Actions in `lib/game-actions.ts`:
- `createGame()`, `joinGame()`, `getGame()`
- `submitPhoto()`, `submitGuess()`
- `revealResults()`, `nextPhoto()`
- `calculateGameScores()` - Computes scores from guesses

**Pattern:** Server actions return `{ success: boolean; error?: string; ...data }`

### Realtime Updates
Components subscribe to Supabase Realtime for live updates:
```typescript
const channel = supabase
  .channel('channel-name')
  .on('postgres_changes', { table: 'guesses', ... }, handler)
  .subscribe()

// Cleanup
return () => supabase.removeChannel(channel)
```

### Scoring System
**Current implementation (as of Dec 2024):**
1. Scores calculated when guess submitted (stored in `guesses` table)
2. `revealResults()` just flips `score_applied` flag (idempotent)
3. Leaderboards calculate scores on-demand: `SUM(total_score) WHERE score_applied = true`

**Why:** Prevents double-scoring race conditions in multiplayer

### Component Patterns
- Use server-side rendering where possible
- Client components (`'use client'`) only when needed (state, events)
- Props passed down, events bubble up
- Loading/error states handled in components

---

## Development Workflow

### Setup
```bash
pnpm install                    # Install dependencies
cp .env.example .env.local      # Configure env vars
pnpm dev                        # Start dev server
```

### Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # Server-side only

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

### Testing
```bash
pnpm test                       # Watch mode
pnpm test:run                   # Run once
pnpm test:ui                    # Vitest UI
```

### Linting & Formatting
```bash
pnpm run check                  # Check all
pnpm run check:fix              # Auto-fix
pnpm run lint                   # Lint only
pnpm run format                 # Format only
```

### Building
```bash
pnpm run build                  # Production build
pnpm start                      # Serve production build
```

### Git Workflow
```bash
# Branch naming
feat/feature-name               # New features
fix/bug-description             # Bug fixes
refactor/what-changed           # Refactors

# Commit messages
# Use conventional commits style
# Include Claude attribution for AI-assisted code:

feat: add user authentication

Brief description of changes.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Important Files

### Configuration
- `package.json` - Uses pnpm 10.25.0
- `biome.json` - Biome config (linting + formatting)
- `tailwind.config.ts` - Tailwind configuration
- `tsconfig.json` - TypeScript configuration

### Documentation
- `docs/UI_MIGRATION_PLAN.md` - Comprehensive UI refactor plan (7 phases)
- `docs/QUICK_START.md` - Quick reference for developers
- `README.md` - Project overview (if exists)

### Database
- `supabase/migrations/00001_initial_schema.sql` - Database schema
- `lib/supabase/server.ts` - Server-side Supabase client
- `lib/supabase/client.ts` - Client-side Supabase client

### Core Logic
- `lib/game-actions.ts` - All game server actions
- `lib/scoring.ts` - Score calculation functions
- `types/game.ts` - TypeScript type definitions

---

## Recent Changes

### December 2024 - Scoring System Fix
**Problem:** Scores were being applied twice due to race conditions when multiple clients called `revealResults()` simultaneously.

**Solution:**
- Simplified `revealResults()` to only flip `score_applied` flag (idempotent)
- Added `calculateGameScores()` to compute scores on-demand from guesses
- Updated UI components to use calculated scores
- Removed complex race condition guards

**Files Changed:**
- `lib/game-actions.ts` - Simplified reveal logic, added score helpers
- `components/game/RoundPhase.tsx` - Use calculated scores
- `components/game/FinalResults.tsx` - Use calculated scores

**Branch:** `fix/double-scoring-issue`
**PR:** #2

---

## Planned Refactor: Immersive UI

### Goals
Transform from card-based layout to fullscreen immersive experience:
- Fullscreen, zoomable images
- Floating overlay controls
- Bottom sheet map interface (mobile-first)
- State machine for game logic (XState)
- Presentational (dumb) components

### Approach
**No feature flags needed** - project has no production users, can refactor in place

**7 Phases:**
0. Setup (30min) - Install dependencies
1. State Machine (1-2d) - Extract game logic to XState
2. Components (2-3d) - Build presentational components
3. Fullscreen Image (2-3d) - Image viewer + map overlay
4. Reveal UI (2d) - Results overlay
5. Final Results (1-2d) - Photo gallery
6. Polish (2-3d) - Animations, performance, a11y
7. Cleanup (1-2d) - Documentation

**Timeline:** 2-3 weeks total

**See:** `docs/UI_MIGRATION_PLAN.md` for full details

---

## Common Tasks

### Adding a New Game Phase
1. Add state to database if needed (migration)
2. Update `game-actions.ts` with server actions
3. Create component in `components/game/`
4. Update game page to render new phase
5. Add realtime subscriptions if needed
6. Write tests

### Fixing a Bug
1. Reproduce locally: `pnpm dev`
2. Identify affected files
3. Write failing test (if applicable)
4. Fix the bug
5. Run tests: `pnpm test:run`
6. Lint: `pnpm run check`
7. Commit with descriptive message

### Adding a Feature
1. Check if requires database changes (migration)
2. Implement server actions first (`lib/game-actions.ts`)
3. Update types (`types/game.ts`)
4. Build UI components
5. Test manually (especially multiplayer)
6. Add unit tests for logic
7. Lint and build before committing

### Database Migration
```bash
# Create new migration
supabase migration new migration_name

# Write SQL in supabase/migrations/XXXXX_migration_name.sql

# Test locally
supabase db reset

# Apply to remote (when ready)
supabase db push
```

---

## Testing Guidelines

### What to Test
- **Unit tests:** Pure functions (scoring, calculations)
- **Manual testing:** Multiplayer flows (open multiple tabs/devices)
- **Mobile testing:** Test on real devices when possible
- **Cross-browser:** Chrome, Safari, Firefox

### Testing Multiplayer
1. Open game in multiple browser tabs/windows
2. Join as different players (use incognito for separate sessions)
3. Test realtime updates work
4. Test race conditions (everyone submit/guess at same time)

### Test Checklist (Before Committing)
- [ ] All automated tests pass: `pnpm test:run`
- [ ] No lint errors: `pnpm run check`
- [ ] Build succeeds: `pnpm run build`
- [ ] Manual test: Game is playable end-to-end
- [ ] Mobile view: Test in 375px viewport
- [ ] No console errors or warnings

---

## Known Issues & Limitations

### Current Limitations
- No offline support
- No game persistence (games lost on server restart)
- No authentication (anyone can join any game)
- No photo size limits (could upload huge files)
- No rate limiting
- Google Maps API key exposed (normal for client-side maps)

### Technical Debt
- Player avatars currently not used (always null)
- Owner guessing bonus disabled (code present but not used)
- No error boundaries in UI
- Limited error handling in some components
- No analytics/monitoring

### Future Enhancements
See `docs/UI_MIGRATION_PLAN.md` for planned UI improvements

Possible features:
- User accounts and game history
- Private games with passwords
- Different game modes
- Photo filters/challenges
- Social features (friends, leaderboards)
- Mobile app

---

## Troubleshooting

### Build Fails
```bash
# Clear cache
rm -rf .next
pnpm run build
```

### Tests Fail
```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm test:run
```

### Supabase Issues
```bash
# Check env vars are set
cat .env.local | grep SUPABASE

# Test connection
# Visit Supabase dashboard, check project is running
```

### Image Upload Fails
- Check Supabase Storage bucket exists: `game-photos`
- Check bucket is public
- Check storage policies allow uploads

### Realtime Not Working
- Check Supabase Realtime is enabled
- Check tables have realtime enabled (see migrations)
- Check channel subscription in component
- Check cleanup (removeChannel) in useEffect

### Map Not Loading
- Check `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set
- Check API key has Maps JavaScript API enabled
- Check no CORS issues in console
- Check API quota not exceeded

---

## Code Style

### TypeScript
- Strict mode enabled
- Prefer explicit types over `any`
- Use interfaces for objects, types for unions/primitives
- Export types from `types/` directory

### React
- Functional components only (no classes)
- Hooks for state and effects
- Prefer server components unless client features needed
- Use `'use client'` directive sparingly

### Naming
- Components: PascalCase (`RoundPhase.tsx`)
- Functions: camelCase (`calculateScore()`)
- Constants: SCREAMING_SNAKE_CASE (`MAX_SCORE`)
- Files: kebab-case for utilities, PascalCase for components
- Types/Interfaces: PascalCase (`GameState`, `PlayerProps`)

### File Organization
- One component per file
- Co-locate tests with components (`.test.ts` suffix)
- Barrel exports from directories when appropriate
- Keep files focused and small (<500 lines)

---

## Performance Considerations

### Current Optimizations
- Server-side rendering for static content
- Lazy loading for heavy components
- Memoization where appropriate
- Efficient database queries (joins, indexes)

### Watch For
- Image sizes (consider compression/CDN)
- Map re-renders (expensive)
- Realtime subscription overhead
- Database query N+1 problems

### Future Optimizations
See Phase 6 in `docs/UI_MIGRATION_PLAN.md`:
- Code splitting
- Image optimization
- Bundle size reduction
- Animation performance

---

## Security Notes

### Current Security
- Row Level Security (RLS) enabled on Supabase
- Public read/write policies (acceptable for party game)
- No sensitive data stored
- Server-side validation where needed

### Future Security
If adding authentication:
- Implement proper RLS policies
- Add user-owned resources
- Rate limiting for API calls
- Input validation and sanitization
- CSRF protection for forms

---

## Deployment

### Not Yet Configured
Deployment strategy TBD. Likely options:
- Vercel (Next.js hosting)
- Netlify
- Custom server

### Requirements for Production
- [ ] Environment variables configured
- [ ] Supabase project in production mode
- [ ] Google Maps API key secured
- [ ] Error tracking (Sentry/similar)
- [ ] Analytics
- [ ] Domain/DNS setup
- [ ] SSL certificate
- [ ] Monitoring

---

## Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/)
- [Google Maps JS API](https://developers.google.com/maps/documentation/javascript)

### Project Docs
- `docs/UI_MIGRATION_PLAN.md` - Full refactor plan
- `docs/QUICK_START.md` - Developer quick reference

### Inspiration
- [GeoGuessr](https://www.geoguessr.com/) - UI/UX reference

---

## Working with Claude

### Best Practices
- **Be specific:** Provide file paths, line numbers, error messages
- **Show context:** Include relevant code snippets
- **State goals:** Explain what you're trying to achieve
- **Mention constraints:** File size, performance, compatibility needs

### When Working on This Project
- Check this file first for context
- Review recent changes section
- Reference the UI migration plan if refactoring
- Follow established patterns in codebase
- Run tests before and after changes
- Test multiplayer flows when changing game logic

### Quick Context Commands
```bash
# Show project structure
tree -L 2 -I 'node_modules|.next'

# Show recent commits
git log --oneline -10

# Show current branch
git branch --show-current

# Check what's changed
git status
```

---

## Questions?

If you're Claude Code working on this project:
1. Read this file first
2. Check `docs/UI_MIGRATION_PLAN.md` if doing UI work
3. Look at similar existing code for patterns
4. Ask user for clarification if anything is unclear
5. Run tests after making changes
6. Keep this file updated with new patterns/decisions

If you're a human developer:
- This file is maintained by Claude (AI assistant)
- Feel free to edit and expand it
- Keep it updated as project evolves
- Use it to onboard new developers
