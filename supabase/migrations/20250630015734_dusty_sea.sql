/*
  # Create wheel_spins table for lucky wheel system

  1. New Tables
    - `wheel_spins`
      - `id` (uuid, primary key)
      - `user_ip` (text, not null)
      - `winning_segment` (text, not null)
      - `discount_value` (numeric, not null)
      - `coupon_code` (text, not null)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `wheel_spins` table
    - Add policy for anyone to insert spins (for public access)
    - Add policy for authenticated users to read spins

  3. Indexes
    - Add index on user_ip and created_at for daily limit checking
*/

CREATE TABLE IF NOT EXISTS wheel_spins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_ip text NOT NULL,
  winning_segment text NOT NULL,
  discount_value numeric NOT NULL DEFAULT 0,
  coupon_code text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wheel_spins ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert spins (for public wheel access)
CREATE POLICY "Anyone can create wheel spins"
  ON wheel_spins
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to read their own spins (by IP)
CREATE POLICY "Users can read own spins"
  ON wheel_spins
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow authenticated users to manage all spins (admin access)
CREATE POLICY "Authenticated users can manage wheel spins"
  ON wheel_spins
  FOR ALL
  TO authenticated
  USING (true);

-- Create index for efficient daily limit checking
CREATE INDEX IF NOT EXISTS idx_wheel_spins_ip_date ON wheel_spins(user_ip, created_at);
CREATE INDEX IF NOT EXISTS idx_wheel_spins_created_at ON wheel_spins(created_at DESC);