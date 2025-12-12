# Database Migrations

## To reset the database (delete all data):

1. Run `00000_drop_all_tables.sql` in the Supabase SQL Editor
2. Then run `00001_initial_schema.sql` in the Supabase SQL Editor

## Changes in this migration:

### 00001_initial_schema.sql
- Added `score_applied` column to `guesses` table (BOOLEAN, default FALSE)
- Added index on `guesses(score_applied)` for query performance
- This prevents duplicate score updates when revealing results

## Notes:

- Scores are now applied when transitioning to the reveal phase
- The `score_applied` flag ensures scores are only added once per guess
- Leaderboard only updates when players see the reveal screen, not during guessing
