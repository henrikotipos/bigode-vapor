/*
  # Insert sample data

  1. Sample Data
    - Default establishment
    - Sample categories
    - Sample products

  This migration adds sample data to help test the application functionality.
*/

-- Insert default establishment if it doesn't exist
INSERT INTO establishments (id, name, phone, address, theme_color)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Atlas System',
  '(11) 99999-9999',
  'Rua Example, 123 - São Paulo, SP',
  '#dc2626'
)
ON CONFLICT (id) DO NOTHING;

-- Insert sample categories
INSERT INTO categories (name, description, establishment_id) VALUES
  ('Pizzas', 'Deliciosas pizzas artesanais', '00000000-0000-0000-0000-000000000000'),
  ('Bebidas', 'Refrigerantes, sucos e águas', '00000000-0000-0000-0000-000000000000'),
  ('Sobremesas', 'Doces e sobremesas especiais', '00000000-0000-0000-0000-000000000000'),
  ('Lanches', 'Sanduíches e lanches rápidos', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- Insert sample products
DO $$
DECLARE
  pizza_category_id uuid;
  bebida_category_id uuid;
  sobremesa_category_id uuid;
  lanche_category_id uuid;
BEGIN
  -- Get category IDs
  SELECT id INTO pizza_category_id FROM categories WHERE name = 'Pizzas' LIMIT 1;
  SELECT id INTO bebida_category_id FROM categories WHERE name = 'Bebidas' LIMIT 1;
  SELECT id INTO sobremesa_category_id FROM categories WHERE name = 'Sobremesas' LIMIT 1;
  SELECT id INTO lanche_category_id FROM categories WHERE name = 'Lanches' LIMIT 1;

  -- Insert sample products
  INSERT INTO products (name, description, price, cost, stock, category_id, establishment_id, active) VALUES
    ('Pizza Margherita', 'Pizza tradicional com molho de tomate, mussarela e manjericão', 35.90, 15.00, 50, pizza_category_id, '00000000-0000-0000-0000-000000000000', true),
    ('Pizza Pepperoni', 'Pizza com molho de tomate, mussarela e pepperoni', 42.90, 18.00, 50, pizza_category_id, '00000000-0000-0000-0000-000000000000', true),
    ('Pizza Portuguesa', 'Pizza com presunto, ovos, cebola, azeitona e mussarela', 45.90, 20.00, 50, pizza_category_id, '00000000-0000-0000-0000-000000000000', true),
    ('Coca-Cola 350ml', 'Refrigerante Coca-Cola lata 350ml', 5.50, 2.50, 100, bebida_category_id, '00000000-0000-0000-0000-000000000000', true),
    ('Água Mineral 500ml', 'Água mineral natural 500ml', 3.50, 1.50, 100, bebida_category_id, '00000000-0000-0000-0000-000000000000', true),
    ('Suco de Laranja 300ml', 'Suco natural de laranja 300ml', 8.90, 4.00, 50, bebida_category_id, '00000000-0000-0000-0000-000000000000', true),
    ('Pudim de Leite', 'Pudim de leite condensado caseiro', 12.90, 5.00, 20, sobremesa_category_id, '00000000-0000-0000-0000-000000000000', true),
    ('Brownie com Sorvete', 'Brownie de chocolate com sorvete de baunilha', 15.90, 7.00, 15, sobremesa_category_id, '00000000-0000-0000-0000-000000000000', true),
    ('X-Burger', 'Hambúrguer com carne, queijo, alface, tomate e batata', 18.90, 8.00, 30, lanche_category_id, '00000000-0000-0000-0000-000000000000', true),
    ('X-Salada', 'Hambúrguer com carne, queijo, alface, tomate, cebola e batata', 22.90, 10.00, 30, lanche_category_id, '00000000-0000-0000-0000-000000000000', true)
  ON CONFLICT DO NOTHING;
END $$;