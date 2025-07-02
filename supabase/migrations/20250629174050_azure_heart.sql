/*
  # Create products table

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text, nullable)
      - `price` (numeric, not null)
      - `cost` (numeric, nullable)
      - `stock` (integer, default 0)
      - `image_url` (text, nullable)
      - `category_id` (uuid, foreign key to categories)
      - `establishment_id` (uuid, foreign key to establishments)
      - `active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `products` table
    - Add policy for anyone to read active products
    - Add policy for authenticated users to manage products

  3. Indexes
    - Add index on category_id for better query performance
    - Add index on establishment_id for better query performance
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  cost numeric CHECK (cost >= 0),
  stock integer DEFAULT 0 CHECK (stock >= 0),
  image_url text,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active products"
  ON products
  FOR SELECT
  TO authenticated, anon
  USING (active = true);

CREATE POLICY "Authenticated users can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_establishment_id ON products(establishment_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

-- Insert some sample products
DO $$
DECLARE
  pizza_category_id uuid;
  bebidas_category_id uuid;
  sobremesas_category_id uuid;
  lanches_category_id uuid;
BEGIN
  -- Get category IDs
  SELECT id INTO pizza_category_id FROM categories WHERE name = 'Pizzas' LIMIT 1;
  SELECT id INTO bebidas_category_id FROM categories WHERE name = 'Bebidas' LIMIT 1;
  SELECT id INTO sobremesas_category_id FROM categories WHERE name = 'Sobremesas' LIMIT 1;
  SELECT id INTO lanches_category_id FROM categories WHERE name = 'Lanches' LIMIT 1;

  -- Insert sample products
  INSERT INTO products (name, description, price, cost, stock, category_id, establishment_id, image_url) VALUES
    ('Pizza Margherita', 'Pizza clássica com molho de tomate, mussarela e manjericão', 35.90, 18.00, 50, pizza_category_id, '00000000-0000-0000-0000-000000000000', 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg'),
    ('Pizza Pepperoni', 'Pizza com molho de tomate, mussarela e pepperoni', 42.90, 22.00, 45, pizza_category_id, '00000000-0000-0000-0000-000000000000', 'https://images.pexels.com/photos/708587/pexels-photo-708587.jpeg'),
    ('Coca-Cola 350ml', 'Refrigerante Coca-Cola lata 350ml', 5.50, 2.50, 100, bebidas_category_id, '00000000-0000-0000-0000-000000000000', 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg'),
    ('Água Mineral 500ml', 'Água mineral natural 500ml', 3.00, 1.20, 80, bebidas_category_id, '00000000-0000-0000-0000-000000000000', 'https://images.pexels.com/photos/416528/pexels-photo-416528.jpeg'),
    ('Pudim de Leite', 'Pudim de leite condensado caseiro', 12.90, 6.00, 20, sobremesas_category_id, '00000000-0000-0000-0000-000000000000', 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg'),
    ('X-Burger', 'Hambúrguer com carne, queijo, alface e tomate', 18.90, 9.50, 30, lanches_category_id, '00000000-0000-0000-0000-000000000000', 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg')
  ON CONFLICT DO NOTHING;
END $$;