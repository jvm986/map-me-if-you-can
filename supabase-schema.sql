-- Map Me If You Can Database Schema
-- Run this in your Supabase SQL editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'submission', 'playing', 'finished')),
  current_photo_index INTEGER NOT NULL DEFAULT 0,
  host_player_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_emoji TEXT,
  total_score INTEGER NOT NULL DEFAULT 0,
  is_host BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photo submissions table
CREATE TABLE photo_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  true_lat DOUBLE PRECISION NOT NULL,
  true_lng DOUBLE PRECISION NOT NULL,
  true_location_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guesses table
CREATE TABLE guesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_submission_id UUID NOT NULL REFERENCES photo_submissions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  guessed_lat DOUBLE PRECISION NOT NULL,
  guessed_lng DOUBLE PRECISION NOT NULL,
  guessed_owner_id UUID NOT NULL REFERENCES players(id),
  distance_km DOUBLE PRECISION NOT NULL,
  location_score INTEGER NOT NULL,
  owner_bonus INTEGER NOT NULL,
  total_score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(photo_submission_id, player_id)
);

-- Add foreign key for host_player_id after players table is created
ALTER TABLE games ADD CONSTRAINT games_host_player_id_fkey
  FOREIGN KEY (host_player_id) REFERENCES players(id) ON DELETE SET NULL;

-- Create indexes for common queries
CREATE INDEX idx_players_game_id ON players(game_id);
CREATE INDEX idx_photo_submissions_game_id ON photo_submissions(game_id);
CREATE INDEX idx_guesses_photo_submission_id ON guesses(photo_submission_id);
CREATE INDEX idx_guesses_player_id ON guesses(player_id);
CREATE INDEX idx_games_code ON games(code);

-- Enable Row Level Security (RLS)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guesses ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow public access for this party game)
-- In production, you might want more restrictive policies
CREATE POLICY "Allow public read access on games" ON games FOR SELECT USING (true);
CREATE POLICY "Allow public insert on games" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on games" ON games FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on players" ON players FOR SELECT USING (true);
CREATE POLICY "Allow public insert on players" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on players" ON players FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on photo_submissions" ON photo_submissions FOR SELECT USING (true);
CREATE POLICY "Allow public insert on photo_submissions" ON photo_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on photo_submissions" ON photo_submissions FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on guesses" ON guesses FOR SELECT USING (true);
CREATE POLICY "Allow public insert on guesses" ON guesses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on guesses" ON guesses FOR UPDATE USING (true);

-- Create storage bucket for photo uploads
-- Run this separately in the Supabase Storage UI or via SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('game-photos', 'game-photos', true);

-- Storage policies (allow public upload and read)
-- CREATE POLICY "Allow public uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'game-photos');
-- CREATE POLICY "Allow public reads" ON storage.objects FOR SELECT USING (bucket_id = 'game-photos');
