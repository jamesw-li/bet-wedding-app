/*
  # Wedding Betting App Database Schema

  1. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `date` (date)
      - `creator_id` (uuid, foreign key to auth.users)
      - `access_code` (text, unique)
      - `status` (text, enum: active, completed, cancelled)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      
    - `bet_categories`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to events)
      - `title` (text)
      - `description` (text)
      - `options` (jsonb array of betting options)
      - `points` (integer, points awarded for correct bet)
      - `status` (text, enum: open, closed, settled)
      - `correct_answer` (text, for settlement)
      - `created_at` (timestamp)
      
    - `bets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `event_id` (uuid, foreign key to events)
      - `category_id` (uuid, foreign key to bet_categories)
      - `selected_option` (text)
      - `points_earned` (integer, default 0)
      - `is_correct` (boolean, nullable)
      - `created_at` (timestamp)
      
    - `event_participants`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to events)
      - `user_id` (uuid, foreign key to auth.users)
      - `total_points` (integer, default 0)
      - `joined_at` (timestamp)
      
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Event creators have full access to their events
    - Participants can view event details and place bets
    
  3. Indexes
    - Add indexes for frequently queried columns
    - Optimize for leaderboard queries
*/

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  date date NOT NULL,
  creator_id uuid REFERENCES auth.users(id) NOT NULL,
  access_code text UNIQUE NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bet categories table
CREATE TABLE IF NOT EXISTS bet_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  options jsonb NOT NULL DEFAULT '[]',
  points integer DEFAULT 10,
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed', 'settled')),
  correct_answer text,
  created_at timestamptz DEFAULT now()
);

-- Bets table
CREATE TABLE IF NOT EXISTS bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES bet_categories(id) ON DELETE CASCADE NOT NULL,
  selected_option text NOT NULL,
  points_earned integer DEFAULT 0,
  is_correct boolean,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category_id)
);

-- Event participants table
CREATE TABLE IF NOT EXISTS event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  total_points integer DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bet_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Users can view events they participate in"
  ON events
  FOR SELECT
  TO authenticated
  USING (
    creator_id = auth.uid() OR
    id IN (SELECT event_id FROM event_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Event creators can update their events"
  ON events
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Bet categories policies
CREATE POLICY "Users can view bet categories for their events"
  ON bet_categories
  FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE 
      creator_id = auth.uid() OR 
      id IN (SELECT event_id FROM event_participants WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Event creators can manage bet categories"
  ON bet_categories
  FOR ALL
  TO authenticated
  USING (
    event_id IN (SELECT id FROM events WHERE creator_id = auth.uid())
  )
  WITH CHECK (
    event_id IN (SELECT id FROM events WHERE creator_id = auth.uid())
  );

-- Bets policies
CREATE POLICY "Users can view and manage their own bets"
  ON bets
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Event creators can view all bets for their events"
  ON bets
  FOR SELECT
  TO authenticated
  USING (
    event_id IN (SELECT id FROM events WHERE creator_id = auth.uid())
  );

-- Event participants policies
CREATE POLICY "Users can view participants for events they're in"
  ON event_participants
  FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE 
      creator_id = auth.uid() OR 
      id IN (SELECT event_id FROM event_participants WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can join events"
  ON event_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Event creators can manage participants"
  ON event_participants
  FOR ALL
  TO authenticated
  USING (
    event_id IN (SELECT id FROM events WHERE creator_id = auth.uid())
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS events_creator_id_idx ON events(creator_id);
CREATE INDEX IF NOT EXISTS events_access_code_idx ON events(access_code);
CREATE INDEX IF NOT EXISTS bet_categories_event_id_idx ON bet_categories(event_id);
CREATE INDEX IF NOT EXISTS bets_user_id_idx ON bets(user_id);
CREATE INDEX IF NOT EXISTS bets_event_id_idx ON bets(event_id);
CREATE INDEX IF NOT EXISTS event_participants_event_id_idx ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS event_participants_user_id_idx ON event_participants(user_id);

-- Function to update participant total points
CREATE OR REPLACE FUNCTION update_participant_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE event_participants 
  SET total_points = (
    SELECT COALESCE(SUM(points_earned), 0) 
    FROM bets 
    WHERE user_id = NEW.user_id AND event_id = NEW.event_id
  )
  WHERE user_id = NEW.user_id AND event_id = NEW.event_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update points when bets are settled
CREATE TRIGGER update_points_trigger
  AFTER UPDATE OF points_earned ON bets
  FOR EACH ROW
  EXECUTE FUNCTION update_participant_points();