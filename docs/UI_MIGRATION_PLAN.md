# UI Refactor Plan: Immersive Fullscreen Game Experience

## Overview

Refactor the current card-based layout into an immersive, fullscreen experience with:
- Fullscreen, zoomable images
- Floating overlay controls
- Bottom sheet/drawer map interface
- Simple helper functions for game state logic
- Presentational (dumb) view components

**Approach:** Iterative development with testing at each phase. Since this is a new project with no production users, we'll refactor in place without feature flags.

**Note:** We initially considered using XState for game state management, but determined that the database-driven architecture already provides clear state management. The `game.status` column is our single source of truth.

---

## Architecture Goals

### 1. Simple State Management
- **Database as source of truth** - `game.status` drives UI state
- **Helper functions** for state checks and guards
- **Server actions** handle all state transitions
- **Realtime subscriptions** keep clients in sync

### 2. Presentational Components (View Layer)
- **Receive props only** - no business logic
- **Emit events** via callbacks
- **Purely visual** - styling, layout, interactions
- **Reusable** across different game modes
- **Testable** via Storybook/visual regression

### 3. Mobile-First Design
- Touch-optimized (44px+ targets)
- Bottom sheets for mobile, overlays for desktop
- Native gestures (pinch, swipe)
- Responsive breakpoints (sm: 640px, md: 768px, lg: 1024px)

---

## Phase 0: Preparation & Setup

**Goal:** Set up infrastructure for iterative development

### Tasks

1. **Add Dependencies**
   ```bash
   pnpm add vaul react-zoom-pan-pinch
   pnpm add -D @storybook/react storybook  # Optional - only if you want component docs
   ```

2. **Create Branch Strategy**
   ```bash
   main
   └── feat/immersive-ui-refactor
       ├── Phase 1: Presentational components
       ├── Phase 2: Fullscreen image
       ├── Phase 3: Map overlay
       └── etc...
   ```

3. **Verify Testing Setup**
   - Unit tests: `pnpm test` (existing Vitest)
   - Lint: `pnpm run check` (existing Biome)
   - Build: `pnpm run build`
   - Type check: Built into build process

### Testing Checklist
- [ ] Dependencies installed successfully
- [ ] All existing tests pass: `pnpm test:run`
- [ ] Linting passes: `pnpm run check`
- [ ] Build succeeds: `pnpm run build`

### Success Criteria
- ✅ Dependencies installed
- ✅ Baseline tests passing
- ✅ Ready to refactor

**Estimated Time:** 30 minutes

---

## Phase 1: Presentational Component Layer

**Goal:** Create dumb components that receive props and emit events

### Tasks

1. **Define Component Interfaces**
   ```typescript
   // components/game-ui/types.ts
   export interface FullscreenImageViewerProps {
     imageUrl: string
     onZoomChange?: (scale: number) => void
   }

   export interface MapOverlayProps {
     isOpen: boolean
     onClose: () => void
     onLocationSelect: (location: Location) => void
     onSubmit: (location: Location) => void
     selectedLocation?: Location
   }

   export interface FloatingHeaderProps {
     round: number
     totalRounds: number
     gameCode: string
     playerCount: number
     onMenuClick?: () => void
   }

   // ... more interfaces
   ```

2. **Build Core Components**
   ```typescript
   // components/game-ui/FullscreenImageViewer.tsx
   export function FullscreenImageViewer({
     imageUrl,
     onZoomChange
   }: FullscreenImageViewerProps) {
     return (
       <TransformWrapper onZoomChange={onZoomChange}>
         <TransformComponent>
           <img
             src={imageUrl}
             className="w-full h-full object-cover"
             alt="Game location"
           />
         </TransformComponent>
       </TransformWrapper>
     )
   }

   // components/game-ui/MapOverlay.tsx
   export function MapOverlay({
     isOpen,
     onClose,
     onLocationSelect,
     onSubmit,
     selectedLocation
   }: MapOverlayProps) {
     return (
       <Drawer open={isOpen} onOpenChange={onClose}>
         <DrawerContent className="h-[90vh] sm:h-[400px]">
           <DrawerHeader>
             <DrawerTitle>Make Your Guess</DrawerTitle>
             <DrawerClose />
           </DrawerHeader>
           <div className="flex-1 p-4">
             <MapPicker
               onLocationSelect={onLocationSelect}
               selectedLocation={selectedLocation}
             />
           </div>
           <DrawerFooter>
             <Button
               onClick={() => selectedLocation && onSubmit(selectedLocation)}
               disabled={!selectedLocation}
               size="lg"
               className="w-full"
             >
               Lock in Guess
             </Button>
           </DrawerFooter>
         </DrawerContent>
       </Drawer>
     )
   }
   ```

3. **Create Storybook Stories**
   ```typescript
   // components/game-ui/FullscreenImageViewer.stories.tsx
   export default {
     title: 'Game UI/FullscreenImageViewer',
     component: FullscreenImageViewer,
   }

   export const Default = {
     args: {
       imageUrl: 'https://example.com/photo.jpg',
     }
   }

   export const WithZoom = {
     args: {
       imageUrl: 'https://example.com/photo.jpg',
       onZoomChange: (scale) => console.log('Zoom:', scale)
     }
   }
   ```

4. **Build Component Library**
   - `FullscreenImageViewer` - Image with pan/zoom
   - `MapOverlay` - Bottom sheet with map
   - `FloatingHeader` - Top bar with game info
   - `FloatingActionButton` - "Make Guess" button
   - `LeaderboardPanel` - Side drawer with scores
   - `ResultsOverlay` - Reveal phase results
   - `WaitingMessage` - Floating status messages

### Testing Checklist
```bash
# 1. Visual testing
pnpm run storybook
# Check all components in isolation

# 2. Unit tests for components
pnpm test:run components/game-ui

# 3. Accessibility
# Check keyboard navigation
# Check screen reader labels
# Check color contrast

# 4. Responsive testing
# Test on mobile viewport (375px)
# Test on tablet (768px)
# Test on desktop (1280px)

# 5. Lint
pnpm run check
```

### Success Criteria
- ✅ All components in Storybook
- ✅ Components are purely presentational
- ✅ No direct API calls in components
- ✅ Proper TypeScript types
- ✅ Accessible (ARIA labels, keyboard nav)
- ✅ Responsive across breakpoints

**Estimated Time:** 2-3 days

---

## Phase 2: Integrate Fullscreen Image View

**Goal:** Replace image display in RoundPhase with fullscreen viewer

### Tasks

1. **Refactor RoundPhase Layout**
   ```typescript
   // components/game/RoundPhase.tsx (refactor in place)
   export default function RoundPhase({ game, players, ... }) {
     const [showMap, setShowMap] = useState(false)
     const [selectedLocation, setSelectedLocation] = useState<Location>()

     return (
       <div className="relative w-screen h-screen overflow-hidden">
         {/* Fullscreen Image */}
         <FullscreenImageViewer
           imageUrl={currentPhoto.image_url}
         />

         {/* Floating Header */}
         <FloatingHeader
           round={game.current_photo_index + 1}
           totalRounds={submissions.length}
           gameCode={gameCode}
           playerCount={players.length}
         />

         {/* Make Guess Button (if not guessed) */}
         {!hasGuessed && (
           <FloatingActionButton
             onClick={() => setShowMap(true)}
             className="fixed bottom-6 left-1/2 -translate-x-1/2"
           >
             🗺️ Make Guess
           </FloatingActionButton>
         )}

         {/* Waiting Message (if guessed) */}
         {hasGuessed && (
           <WaitingMessage>
             Waiting for other players...
           </WaitingMessage>
         )}

         {/* Map Overlay */}
         <MapOverlay
           isOpen={showMap}
           onClose={() => setShowMap(false)}
           onLocationSelect={setSelectedLocation}
           onSubmit={handleSubmitGuess}
           selectedLocation={selectedLocation}
         />
       </div>
     )
   }
   ```

2. **Keep Existing Logic**
   - Copy guess submission logic
   - Copy realtime subscription logic
   - Copy auto-reveal logic
   - Keep all functionality identical

### Testing Checklist
```bash
# 1. Manual testing
pnpm dev

# Test cases:
- [ ] Image displays fullscreen
- [ ] Can pan/zoom image (pinch on mobile)
- [ ] "Make Guess" button appears
- [ ] Click button → map drawer opens
- [ ] Select location on map
- [ ] Submit guess → drawer closes
- [ ] "Waiting..." message appears
- [ ] Auto-reveal triggers when all guess
- [ ] Mobile: Bottom sheet behavior works
- [ ] Desktop: Overlay positioned correctly

# 2. Automated tests
pnpm test:run
pnpm run check
pnpm run build

# 4. Performance
# Check image load times
# Check zoom/pan smoothness
# Check animation frame rates
```

### Success Criteria
- ✅ Fullscreen image works on all devices
- ✅ Pan/zoom feels natural
- ✅ Map overlay functions correctly
- ✅ All existing functionality preserved
- ✅ No performance regressions

**Estimated Time:** 2-3 days

---

## Phase 3: Integrate Reveal Phase UI

**Goal:** Update reveal phase with immersive overlay design

### Tasks

1. **Design Reveal Overlay**
   ```typescript
   // components/game-ui/ResultsOverlay.tsx
   export function ResultsOverlay({
     guesses,
     players,
     currentPhoto,
     onNext,
     isHost
   }: ResultsOverlayProps) {
     return (
       <div className="absolute inset-0 pointer-events-none">
         {/* Image still visible in background */}

         {/* Results panel (right side on desktop, bottom on mobile) */}
         <div className="pointer-events-auto absolute right-0 top-0 h-full w-full sm:w-96 bg-white/95 backdrop-blur-sm shadow-xl overflow-y-auto">
           <div className="p-6">
             <h2 className="text-2xl font-bold mb-4">Round Results</h2>

             {/* Sorted guesses */}
             {sortedGuesses.map((guess, i) => (
               <GuessResultCard key={guess.id} guess={guess} rank={i + 1} />
             ))}

             {/* Next button */}
             {isHost && (
               <Button onClick={onNext} className="w-full mt-6">
                 Next Round
               </Button>
             )}
           </div>
         </div>

         {/* Map with markers (bottom-left corner on desktop) */}
         <div className="pointer-events-auto absolute bottom-4 left-4 w-80 h-64 hidden sm:block rounded-lg overflow-hidden shadow-xl">
           <ResultsMap
             actualLocation={currentPhoto}
             guesses={guesses}
             players={players}
           />
         </div>
       </div>
     )
   }
   ```

2. **Refactor RevealPhase**
   ```typescript
   // components/game/RevealPhase.tsx (refactor in place)
   export default function RevealPhase(props) {
     return (
       <div className="relative w-screen h-screen overflow-hidden">
         {/* Fullscreen Image (same as guessing phase) */}
         <FullscreenImageViewer
           imageUrl={currentPhoto.image_url}
         />

         {/* Floating Header */}
         <FloatingHeader {...headerProps} />

         {/* Results Overlay */}
         <ResultsOverlay
           guesses={guesses}
           players={players}
           currentPhoto={currentPhoto}
           onNext={handleNext}
           isHost={isHost}
         />
       </div>
     )
   }
   ```

### Testing Checklist
```bash
# Manual tests
- [ ] Image stays visible during reveal
- [ ] Results panel slides in smoothly
- [ ] Can see guess markers on map
- [ ] Scores display correctly
- [ ] Next button works (host only)
- [ ] Mobile: Results take full width
- [ ] Desktop: Results panel on right, mini map on left
- [ ] Animations are smooth (60fps)

# Automated tests
pnpm test:run
pnpm run check
```

### Success Criteria
- ✅ Reveal keeps image visible
- ✅ Results overlay clear and readable
- ✅ Map shows all guess markers
- ✅ Smooth animations
- ✅ Responsive layout works

**Estimated Time:** 2 days

---

## Phase 4: Integrate Final Results

**Goal:** Fullscreen final results with photo gallery

### Tasks

1. **Create Photo Gallery View**
   ```typescript
   // components/game-ui/PhotoGallery.tsx
   export function PhotoGallery({
     submissions,
     onPhotoSelect
   }: PhotoGalleryProps) {
     return (
       <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4">
         {submissions.map(photo => (
           <button
             key={photo.id}
             onClick={() => onPhotoSelect(photo)}
             className="relative aspect-square rounded-lg overflow-hidden"
           >
             <img
               src={photo.image_url}
               className="w-full h-full object-cover hover:scale-110 transition"
             />
             <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
               {photo.player.display_name}
             </div>
           </button>
         ))}
       </div>
     )
   }
   ```

2. **Refactor FinalResults**
   ```typescript
   // components/game/FinalResults.tsx (refactor in place)
   export default function FinalResults(props) {
     const [selectedPhoto, setSelectedPhoto] = useState<PhotoSubmission>()

     return (
       <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
         {/* Winner Celebration */}
         <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
           <Trophy className="w-24 h-24 text-yellow-500 mb-4" />
           <h1 className="text-4xl font-bold mb-2">
             {winner.display_name} Wins!
           </h1>
           <p className="text-2xl text-gray-600 mb-8">
             {winner.score} points
           </p>

           {/* Leaderboard */}
           <Card className="w-full max-w-md">
             <CardHeader>
               <CardTitle>Final Standings</CardTitle>
             </CardHeader>
             <CardContent>
               {sortedPlayers.map((player, i) => (
                 <LeaderboardRow key={player.id} player={player} rank={i + 1} />
               ))}
             </CardContent>
           </Card>

           {/* Photo Gallery Button */}
           <Button
             onClick={() => setShowGallery(true)}
             variant="outline"
             className="mt-4"
           >
             View All Photos
           </Button>

           {/* Host Controls */}
           {isHost && (
             <div className="flex gap-4 mt-8">
               <Button onClick={handlePlayAgain}>Play Again</Button>
               <Button onClick={handleNewGame} variant="outline">New Game</Button>
             </div>
           )}
         </div>

         {/* Photo Gallery Drawer */}
         <Drawer open={showGallery} onOpenChange={setShowGallery}>
           <DrawerContent>
             <PhotoGallery
               submissions={submissions}
               onPhotoSelect={setSelectedPhoto}
             />
           </DrawerContent>
         </Drawer>

         {/* Photo Detail Modal */}
         {selectedPhoto && (
           <Dialog open onOpenChange={() => setSelectedPhoto(undefined)}>
             <DialogContent className="max-w-4xl">
               <FullscreenImageViewer imageUrl={selectedPhoto.image_url} />
             </DialogContent>
           </Dialog>
         )}
       </div>
     )
   }
   ```

### Testing Checklist
```bash
# Manual tests
- [ ] Winner displayed prominently
- [ ] Leaderboard shows all players
- [ ] Photo gallery opens
- [ ] Can view individual photos
- [ ] Play again works
- [ ] Mobile: Gallery full screen
- [ ] Desktop: Gallery in drawer

# Automated tests
pnpm test:run
pnpm run check
```

### Success Criteria
- ✅ Celebration animation works
- ✅ Final scores accurate
- ✅ Photo gallery functional
- ✅ Can restart game

**Estimated Time:** 1-2 days

---

## Phase 5: Polish & Performance

**Goal:** Optimize performance, add animations, fix edge cases

### Tasks

1. **Performance Optimization**
   - Lazy load images
   - Optimize map rendering
   - Memoize expensive calculations
   - Code split heavy components

2. **Animation Polish**
   ```typescript
   // Add smooth transitions
   import { AnimatePresence, motion } from 'framer-motion'

   <AnimatePresence>
     {showMap && (
       <motion.div
         initial={{ y: '100%' }}
         animate={{ y: 0 }}
         exit={{ y: '100%' }}
         transition={{ type: 'spring', damping: 30 }}
       >
         <MapOverlay {...props} />
       </motion.div>
     )}
   </AnimatePresence>
   ```

3. **Edge Cases**
   - Handle slow image loads
   - Handle offline mode
   - Handle orientation changes (mobile)
   - Handle very small screens (<375px)
   - Handle very large screens (>2000px)

4. **Accessibility Audit**
   - Keyboard navigation
   - Screen reader testing
   - Focus management
   - Color contrast
   - Touch target sizes

5. **Performance Testing**
   ```bash
   # Lighthouse audit
   pnpm run build
   pnpm start
   # Run Lighthouse in Chrome DevTools

   # Check bundle size
   pnpm run build
   # Review .next/analyze

   # Performance profiling
   # Use React DevTools Profiler
   # Check for unnecessary re-renders
   ```

### Testing Checklist
```bash
# Performance
- [ ] Lighthouse score >90
- [ ] No layout shifts (CLS)
- [ ] Fast image loads (<1s)
- [ ] Smooth animations (60fps)

# Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly
- [ ] Focus visible
- [ ] Color contrast AAA

# Edge cases
- [ ] Works offline (with cached images)
- [ ] Handles slow network
- [ ] Portrait/landscape switch works
- [ ] Works on 320px screens

# Browser testing
- [ ] Chrome (desktop + mobile)
- [ ] Safari (desktop + iOS)
- [ ] Firefox
- [ ] Edge

pnpm test:run
pnpm run check
pnpm run build
```

### Success Criteria
- ✅ Lighthouse score >90
- ✅ No accessibility violations
- ✅ Smooth 60fps animations
- ✅ Works on all target devices
- ✅ Bundle size acceptable

**Estimated Time:** 2-3 days

---

## Phase 6: Final Polish & Documentation

**Goal:** Clean up and document the new architecture

### Tasks

1. **Code Cleanup**
   ```bash
   # Remove any commented-out old code
   # Remove unused imports
   # Clean up any TODOs
   ```

2. **Update Documentation**
   ```markdown
   # Update README.md
   - New UI features
   - Mobile support details
   - Known limitations

   # Update CONTRIBUTING.md
   - Component patterns
   - State machine usage
   - Testing requirements
   ```

5. **Clean Up Dependencies**
   ```bash
   # Remove unused packages
   pnpm remove <unused-package>

   # Update lockfile
   pnpm install
   ```

### Testing Checklist
```bash
# Final comprehensive test
- [ ] All game phases work
- [ ] Multiplayer functionality intact
- [ ] Mobile and desktop tested
- [ ] No console errors
- [ ] No broken links/images

# Code quality
- [ ] No commented-out code
- [ ] No unused imports
- [ ] No TODOs left
- [ ] Documentation updated

pnpm test:run
pnpm run check
pnpm run build
```

### Success Criteria
- ✅ Code is clean
- ✅ Documentation current
- ✅ All tests passing
- ✅ Ready to ship

**Estimated Time:** 1-2 days

---

## Testing Strategy (Per Phase)

### 1. Start Working
```bash
# Create branch
git checkout -b feat/phase-X-description

# Verify baseline
pnpm test:run
pnpm run check
pnpm run build
```

### 2. During Development
```bash
# Run tests in watch mode
pnpm test

# Run dev server
pnpm dev

# Check Storybook (for components)
pnpm run storybook

# Format and lint
pnpm run format
pnpm run check:fix
```

### 3. Before Committing
```bash
# Full test suite
pnpm test:run

# Lint and format check
pnpm run check

# Type check via build
pnpm run build

# Manual testing
# - Test in Chrome
# - Test in mobile viewport
# - Test with feature flags on/off
```

### 4. Before PR
```bash
# Rebase on main
git fetch origin
git rebase origin/main

# Final checks
pnpm install
pnpm test:run
pnpm run check
pnpm run build

# Test production build
pnpm start
# Manual smoke test
```

### 5. PR Review Checklist
- [ ] All tests passing
- [ ] No linting errors
- [ ] Build succeeds
- [ ] Mobile tested (375px, 768px)
- [ ] Desktop tested (1280px, 1920px)
- [ ] Accessibility checked (keyboard, screen reader)
- [ ] Performance acceptable (Lighthouse)
- [ ] Documentation updated

---

## Rollback Plan

### If Issues Found

Since we're refactoring in place, rollback is simple:

```bash
# Revert specific commits
git revert <commit-hash>

# Or revert entire phase
git revert <first-commit>..<last-commit>

# Or just reset branch
git reset --hard origin/main
```

**Best practice:** Make small, atomic commits so you can easily revert specific changes.

---

## Success Metrics

### Technical Metrics
- **Test Coverage:** >80%
- **Lighthouse Score:** >90
- **Bundle Size:** <500KB increase
- **Build Time:** <5 minutes
- **Type Safety:** 100% (no `any`)

### User Experience Metrics
- **Page Load Time:** <2s
- **Time to Interactive:** <3s
- **Animation Frame Rate:** 60fps
- **Mobile Usability:** Pass all tests

### Business Metrics
- **Game Completion Rate:** Maintain or improve
- **User Engagement:** Maintain or improve
- **Error Rate:** <1%
- **Crash Rate:** <0.1%

---

## Estimated Timeline

| Phase | Description | Time | Dependencies |
|-------|-------------|------|--------------|
| 0 | Preparation | 30min | None |
| 1 | Components | 2-3d | Phase 0 |
| 2 | Fullscreen Image | 2-3d | Phase 1 |
| 3 | Reveal UI | 2d | Phase 2 |
| 4 | Final Results | 1-2d | Phase 2, 3 |
| 5 | Polish | 2-3d | Phase 2, 3, 4 |
| 6 | Migration Complete | 1-2d | All phases |
| **Total** | **End-to-End** | **2-3 weeks** | |

**Note:** Timeline assumes single developer working part-time. Adjust based on team size and availability.

---

## Risk Mitigation

### Risk: Breaking Existing Functionality
**Mitigation:**
- Small, incremental commits
- Comprehensive test suite
- Manual testing after each phase
- Quick rollback via git revert

### Risk: Performance Regression
**Mitigation:**
- Performance testing in each phase
- Lazy loading
- Code splitting
- Bundle size monitoring

### Risk: Mobile Compatibility Issues
**Mitigation:**
- Mobile-first development
- Test on real devices
- Use progressive enhancement
- Fallback UI patterns

### Risk: Component Complexity
**Mitigation:**
- Keep components simple and focused
- Extract reusable patterns
- Thorough testing
- Good documentation

### Risk: Scope Creep
**Mitigation:**
- Strict phase boundaries
- Regular check-ins
- Clear acceptance criteria
- Defer non-critical features

---

## Communication Plan

### Daily
- Update team on progress
- Share blockers/questions
- Demo working features

### Per Phase
- Share phase completion
- Request code review
- Demo working features

### Major Milestones
- Phase 2 complete: Playable with new UI
- Phase 5 complete: Polish complete
- Phase 6 complete: Refactor done

---

## Resources

### Documentation
- [Vaul (Drawer) Docs](https://github.com/emilkowalski/vaul)
- [React Zoom Pan Pinch](https://github.com/BetterTyped/react-zoom-pan-pinch)
- [GeoGuessr UI Reference](https://www.geoguessr.com/)

### Tools
- React DevTools (profiling)
- Chrome DevTools (Lighthouse)
- Storybook

---

## Notes

- **This is an iterative process** - adjust as needed
- **Test continuously** - don't skip testing steps
- **Small commits** - easier to review and revert
- **Mobile-first** - always test mobile viewport first
- **Incremental is better than perfect** - ship working features
- **Document decisions** - future you will thank you
- **No production users yet** - we can refactor freely!

---

## Questions to Answer Before Starting

1. Do we want to support offline mode?
2. What's the minimum supported browser version?
3. Do we need to support tablets in landscape?
4. Should we add animations with framer-motion?
5. What's our target bundle size increase?
6. Do we need Storybook for this project size?

**Action:** Answer these questions, then start Phase 0.
