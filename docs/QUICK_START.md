# UI Refactor Quick Start

This is a quick reference for implementing the immersive fullscreen UI. See [UI_MIGRATION_PLAN.md](./UI_MIGRATION_PLAN.md) for comprehensive details.

**Note:** Since this is a new project with no production users, we're refactoring components in place (no feature flags needed).

## 🚀 Getting Started (5 minutes)

### 1. Install Dependencies
```bash
pnpm add xstate @xstate/react vaul react-zoom-pan-pinch
```

### 2. Run Baseline Tests
```bash
pnpm test:run
pnpm run check
pnpm run build
```

## 📋 Development Workflow

### Starting a New Phase
```bash
# 1. Create branch
git checkout -b feat/phase-X-description

# 2. Start dev server
pnpm dev
```

### Before Every Commit
```bash
pnpm test:run      # Unit tests
pnpm run check     # Lint & format
pnpm run build     # Type check
```

### Testing Checklist
- [ ] Mobile viewport (375px)
- [ ] Desktop viewport (1280px)
- [ ] All tests pass
- [ ] No lint errors
- [ ] Game still playable

## 🎯 Phase Overview

| Phase | Goal | Time | Key Deliverable |
|-------|------|------|-----------------|
| 0 | Setup | 30m | Dependencies installed |
| 1 | State Machine | 1-2d | Game logic in XState |
| 2 | Components | 2-3d | Presentational components in Storybook |
| 3 | Fullscreen Image | 2-3d | Working image viewer + map overlay |
| 4 | Reveal UI | 2d | Results overlay implemented |
| 5 | Final Results | 1-2d | Final screen with photo gallery |
| 6 | Polish | 2-3d | Animations, performance, accessibility |
| 7 | Cleanup | 1-2d | Remove old code, feature flags |

## 🧪 Testing Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm test                   # Run tests in watch mode
pnpm run storybook          # View component library (if using)

# Pre-commit
pnpm test:run               # Run all tests once
pnpm run check              # Lint and format check
pnpm run check:fix          # Auto-fix lint issues
pnpm run build              # Build for production
```

## 🎨 Component Architecture

```
Presentational Components (Dumb)
├── FullscreenImageViewer    - Pan/zoom image
├── MapOverlay               - Bottom sheet with map
├── FloatingHeader           - Top bar with game info
├── FloatingActionButton     - "Make Guess" button
├── LeaderboardPanel         - Side drawer with scores
└── ResultsOverlay           - Reveal phase results

Smart Containers (Refactored in place)
├── RoundPhase               - Orchestrates guessing phase
├── RevealPhase              - Orchestrates reveal phase
└── FinalResults             - Orchestrates final screen

State Management
└── useGameMachine           - XState hook for game logic
```

## 🔥 Quick Fixes

### Tests failing?
```bash
pnpm install           # Ensure deps installed
pnpm test:run          # See what's failing
```

### Lint errors?
```bash
pnpm run check:fix     # Auto-fix issues
```

### Build fails?
```bash
pnpm run build         # See type errors
```

## 📱 Mobile Testing

### In Browser DevTools
1. Open Chrome DevTools (F12)
2. Click device toolbar (Ctrl+Shift+M)
3. Test these sizes:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1280px)

### On Real Device
1. Find your local IP: `ifconfig | grep inet`
2. Start dev: `pnpm dev`
3. Visit: `http://[your-ip]:3000` on phone

## 🆘 Common Issues

### Issue: Image not fullscreen
**Solution:** Check parent div has `w-screen h-screen overflow-hidden`

### Issue: Map overlay not showing
**Solution:** Check `isOpen` prop and z-index

### Issue: State machine not working
**Solution:** Verify feature flag is true in .env.local

### Issue: Can't pan/zoom image
**Solution:** Check `react-zoom-pan-pinch` is installed

### Issue: Bottom sheet not sliding
**Solution:** Check `vaul` is installed and `open` prop is set

## 📚 Key Resources

- [Full Migration Plan](./UI_MIGRATION_PLAN.md) - Comprehensive guide
- [XState Docs](https://xstate.js.org/docs/) - State machine
- [Vaul Docs](https://github.com/emilkowalski/vaul) - Bottom sheet
- [React Zoom Pan Pinch](https://github.com/BetterTyped/react-zoom-pan-pinch) - Image viewer

## 🎯 Current Status

**Phase:** Not started
**Next Action:** Install dependencies and run Phase 0 setup

Update this section as you progress!
