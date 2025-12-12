// Core game types

export type GameStatus = 'lobby' | 'submission' | 'playing' | 'finished';

export interface Game {
  id: string;
  code: string;
  status: GameStatus;
  current_photo_index: number;
  host_player_id: string;
  created_at: string;
}

export interface Player {
  id: string;
  game_id: string;
  display_name: string;
  avatar_emoji: string | null;
  total_score: number;
  is_host: boolean;
  created_at: string;
}

export interface PhotoSubmission {
  id: string;
  game_id: string;
  player_id: string;
  image_url: string;
  true_lat: number;
  true_lng: number;
  true_location_text: string | null;
  created_at: string;
  player?: Player; // For joins
}

export interface Guess {
  id: string;
  photo_submission_id: string;
  player_id: string;
  guessed_lat: number;
  guessed_lng: number;
  guessed_owner_id: string;
  distance_km: number;
  location_score: number;
  owner_bonus: number;
  total_score: number;
  created_at: string;
  player?: Player; // For joins
}

export interface Location {
  lat: number;
  lng: number;
}
