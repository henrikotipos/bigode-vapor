/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, not null)
      - `name` (text, not null)
      - `role` (text, default 'user')
      - `establishment_id` (uuid, foreign key to establishments)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `users` table
    - Add policy for users to read their own data
    - Add policy for users to update their own data
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'user',
  establishment_id uuid REFERENCES establishments(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);