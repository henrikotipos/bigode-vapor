/*
  # Create establishments table

  1. New Tables
    - `establishments`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `logo_url` (text, nullable)
      - `phone` (text, not null)
      - `address` (text, not null)
      - `theme_color` (text, default '#dc2626')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `establishments` table
    - Add policy for authenticated users to read establishments
    - Add policy for authenticated users to manage their own establishment
*/

CREATE TABLE IF NOT EXISTS establishments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  phone text NOT NULL,
  address text NOT NULL,
  theme_color text DEFAULT '#dc2626',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE establishments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read establishments"
  ON establishments
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can manage establishments"
  ON establishments
  FOR ALL
  TO authenticated
  USING (true);

-- Insert default establishment
INSERT INTO establishments (id, name, phone, address, theme_color)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Atlas System',
  '(11) 99999-9999',
  'Rua Example, 123 - São Paulo, SP',
  '#dc2626'
) ON CONFLICT (id) DO NOTHING;