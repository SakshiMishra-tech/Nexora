
-- Create Marketplace Schema if it doesn't exist
CREATE TABLE IF NOT EXISTS public.marketplace_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.marketplace_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_name text,
  seller_course text,
  seller_avatar text,
  seller_rating numeric DEFAULT 4.5,
  title text NOT NULL,
  description text NOT NULL,
  category_id uuid REFERENCES public.marketplace_categories(id),
  category text,
  condition text,
  price numeric DEFAULT 0,
  pickup_area text,
  status text DEFAULT 'active',
  tags text[],
  is_negotiable boolean DEFAULT false,
  views numeric DEFAULT 0,
  saves numeric DEFAULT 0,
  offer_count numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  cover_image text
);

CREATE TABLE IF NOT EXISTS public.marketplace_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  storage_path text,
  position integer DEFAULT 0
);

-- First, ensure a dummy user exists for these listings
DO $$
DECLARE
  dummy_user_id uuid := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- We won't insert into auth.users directly if it's restricted, but assuming local dev environment we might.
  -- Better approach: assign to an existing user or leave seller_id null if it allows null.
  -- The schema shows seller_id references auth.users(id). 
  -- Let's just create a dummy auth user and profile.
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = dummy_user_id) THEN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES (dummy_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'demo.seller@nexora.com', 'dummy_hash', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Demo Seller"}', now(), now(), '', '', '', '');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = dummy_user_id) THEN
    INSERT INTO public.profiles (id, full_name, email, college_name)
    VALUES (dummy_user_id, 'Demo Seller', 'demo.seller@nexora.com', 'Nexora Institute');
  END IF;
END $$;

-- Populate Categories
INSERT INTO public.marketplace_categories (name) VALUES
  ('Books'),
  ('Electronics'),
  ('Hostel Essentials'),
  ('Furniture'),
  ('Fashion'),
  ('Sports'),
  ('Cycles'),
  ('Gaming'),
  ('Lab Equipment'),
  ('Others')
ON CONFLICT (name) DO NOTHING;

-- Populate Items and Images
DO $$
DECLARE
  dummy_user_id uuid := '00000000-0000-0000-0000-000000000000';
  cat_id uuid;
  new_item_id uuid;
  random_days int;
  random_views int;
  random_likes int;
  random_neg bool;
BEGIN

  -- Item: DBMS Book
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Books';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'DBMS Book', 'Database Management Systems by Raghu Ramakrishnan. Good condition.',
    cat_id, 'Books', 'Good', 400, 'Hostel 1',
    '{"demo","books"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/0a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/0a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/0b/600/400', 1);

  -- Item: Operating Systems
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Books';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Operating Systems', 'Operating System Concepts by Galvin. No markings.',
    cat_id, 'Books', 'Like new', 450, 'Hostel 2',
    '{"demo","books"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/1a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/1a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/1b/600/400', 1);

  -- Item: Computer Networks
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Books';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Computer Networks', 'Computer Networking by Kurose. Fifth edition.',
    cat_id, 'Books', 'Used', 350, 'Hostel 3',
    '{"demo","books"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/2a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/2a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/2b/600/400', 1);

  -- Item: DSA Made Easy
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Books';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'DSA Made Easy', 'Data Structures and Algorithms Made Easy by Narasimha Karumanchi. Very useful for placements.',
    cat_id, 'Books', 'Good', 300, 'Hostel 4',
    '{"demo","books"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/3a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/3a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/3b/600/400', 1);

  -- Item: Java Programming
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Books';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Java Programming', 'Head First Java. Fun way to learn Java.',
    cat_id, 'Books', 'Used', 250, 'Library',
    '{"demo","books"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/4a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/4a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/4b/600/400', 1);

  -- Item: HP Laptop
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Electronics';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'HP Laptop', 'HP Pavilion 15.6 inch, i5 10th Gen, 8GB RAM, 512GB SSD. Perfect for coding.',
    cat_id, 'Electronics', 'Good', 35000, 'CSE Block',
    '{"demo","electronics"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/5a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/5a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/5b/600/400', 1);

  -- Item: Dell Monitor
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Electronics';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Dell Monitor', 'Dell 24 inch IPS Monitor (S2421HN). Used for 1 year.',
    cat_id, 'Electronics', 'Like new', 8000, 'Main Canteen',
    '{"demo","electronics"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/6a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/6a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/6b/600/400', 1);

  -- Item: Logitech Mouse
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Electronics';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Logitech Mouse', 'Logitech G102 gaming mouse. Working perfectly.',
    cat_id, 'Electronics', 'Good', 900, 'Hostel 1',
    '{"demo","electronics"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/7a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/7a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/7b/600/400', 1);

  -- Item: Mechanical Keyboard
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Electronics';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Mechanical Keyboard', 'Redgear Shadow Blade mechanical keyboard with Blue switches.',
    cat_id, 'Electronics', 'Fair', 1500, 'Hostel 2',
    '{"demo","electronics"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/8a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/8a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/8b/600/400', 1);

  -- Item: Scientific Calculator
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Electronics';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Scientific Calculator', 'Casio fx-991EX ClassWiz. Allowed in exams.',
    cat_id, 'Electronics', 'Good', 850, 'Hostel 3',
    '{"demo","electronics"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/9a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/9a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/9b/600/400', 1);

  -- Item: Sony Headphones
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Electronics';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Sony Headphones', 'Sony WH-CH510 wireless headphones. Battery lasts 30 hours.',
    cat_id, 'Electronics', 'Used', 2000, 'Hostel 4',
    '{"demo","electronics"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/10a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/10a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/10b/600/400', 1);

  -- Item: Study Table
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Hostel Essentials';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Study Table', 'Foldable wooden study table for bed.',
    cat_id, 'Hostel Essentials', 'Used', 400, 'Library',
    '{"demo","hostel essentials"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/11a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/11a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/11b/600/400', 1);

  -- Item: Mattress
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Hostel Essentials';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Mattress', 'Single bed cotton mattress. Clean and comfortable.',
    cat_id, 'Hostel Essentials', 'Fair', 800, 'CSE Block',
    '{"demo","hostel essentials"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/12a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/12a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/12b/600/400', 1);

  -- Item: Electric Kettle
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Hostel Essentials';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Electric Kettle', 'Pigeon 1.5L electric kettle. Essential for maggi.',
    cat_id, 'Hostel Essentials', 'Good', 450, 'Main Canteen',
    '{"demo","hostel essentials"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/13a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/13a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/13b/600/400', 1);

  -- Item: Cooler
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Hostel Essentials';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Cooler', 'Symphony Diet 12T personal cooler. Perfect for summers.',
    cat_id, 'Hostel Essentials', 'Good', 3500, 'Hostel 1',
    '{"demo","hostel essentials"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/14a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/14a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/14b/600/400', 1);

  -- Item: Induction
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Hostel Essentials';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Induction', 'Prestige Induction Cooktop 1200 Watt.',
    cat_id, 'Hostel Essentials', 'Like new', 1200, 'Hostel 2',
    '{"demo","hostel essentials"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/15a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/15a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/15b/600/400', 1);

  -- Item: Bucket
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Hostel Essentials';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Bucket', 'Large plastic bucket with mug.',
    cat_id, 'Hostel Essentials', 'Used', 150, 'Hostel 3',
    '{"demo","hostel essentials"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/16a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/16a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/16b/600/400', 1);

  -- Item: Chair
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Furniture';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Chair', 'Ergonomic study chair with lumbar support.',
    cat_id, 'Furniture', 'Good', 1500, 'Hostel 4',
    '{"demo","furniture"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/17a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/17a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/17b/600/400', 1);

  -- Item: Bookshelf
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Furniture';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Bookshelf', '3-tier wooden bookshelf. Easy to assemble.',
    cat_id, 'Furniture', 'Fair', 600, 'Library',
    '{"demo","furniture"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/18a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/18a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/18b/600/400', 1);

  -- Item: Study Lamp
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Furniture';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Study Lamp', 'Wipro LED desk lamp with adjustable brightness.',
    cat_id, 'Furniture', 'Like new', 500, 'CSE Block',
    '{"demo","furniture"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/19a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/19a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/19b/600/400', 1);

  -- Item: Hoodie
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Fashion';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Hoodie', 'College Fest 2023 Hoodie, Size L. Worn twice.',
    cat_id, 'Fashion', 'Like new', 400, 'Main Canteen',
    '{"demo","fashion"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/20a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/20a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/20b/600/400', 1);

  -- Item: Shoes
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Fashion';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Shoes', 'Puma Sneakers, UK Size 9. Black.',
    cat_id, 'Fashion', 'Good', 1200, 'Hostel 1',
    '{"demo","fashion"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/21a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/21a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/21b/600/400', 1);

  -- Item: Jacket
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Fashion';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Jacket', 'Denim jacket, Size M. Great for winters.',
    cat_id, 'Fashion', 'Good', 800, 'Hostel 2',
    '{"demo","fashion"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/22a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/22a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/22b/600/400', 1);

  -- Item: Backpack
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Fashion';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Backpack', 'American Tourister laptop backpack.',
    cat_id, 'Fashion', 'Fair', 900, 'Hostel 3',
    '{"demo","fashion"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/23a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/23a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/23b/600/400', 1);

  -- Item: Cricket Bat
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Sports';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Cricket Bat', 'Kashmir Willow cricket bat. Pre-knocked.',
    cat_id, 'Sports', 'Good', 1200, 'Hostel 4',
    '{"demo","sports"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/24a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/24a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/24b/600/400', 1);

  -- Item: Football
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Sports';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Football', 'Nivia football, size 5. Needs a bit of air.',
    cat_id, 'Sports', 'Used', 300, 'Library',
    '{"demo","sports"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/25a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/25a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/25b/600/400', 1);

  -- Item: Dumbbells
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Sports';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Dumbbells', '5kg pair of PVC dumbbells.',
    cat_id, 'Sports', 'Good', 400, 'CSE Block',
    '{"demo","sports"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/26a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/26a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/26b/600/400', 1);

  -- Item: Hero Cycle
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Cycles';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Hero Cycle', 'Hero Sprint 26T. Serviced last month.',
    cat_id, 'Cycles', 'Good', 2500, 'Main Canteen',
    '{"demo","cycles"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/27a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/27a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/27b/600/400', 1);

  -- Item: Btwin Cycle
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Cycles';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Btwin Cycle', 'Btwin MyBike from Decathlon. Smooth ride.',
    cat_id, 'Cycles', 'Good', 3500, 'Hostel 1',
    '{"demo","cycles"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/28a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/28a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/28b/600/400', 1);

  -- Item: Firefox Cycle
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Cycles';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Firefox Cycle', 'Firefox Rapide 21 speed gear cycle.',
    cat_id, 'Cycles', 'Like new', 7000, 'Hostel 2',
    '{"demo","cycles"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/29a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/29a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/29b/600/400', 1);

  -- Item: PS5 Controller
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Gaming';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'PS5 Controller', 'DualSense wireless controller. White.',
    cat_id, 'Gaming', 'Like new', 4500, 'Hostel 3',
    '{"demo","gaming"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/30a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/30a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/30b/600/400', 1);

  -- Item: Xbox Controller
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Gaming';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Xbox Controller', 'Xbox Series X/S controller with Bluetooth.',
    cat_id, 'Gaming', 'Good', 3800, 'Hostel 4',
    '{"demo","gaming"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/31a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/31a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/31b/600/400', 1);

  -- Item: Gaming Mouse
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Gaming';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Gaming Mouse', 'Razer DeathAdder Essential.',
    cat_id, 'Gaming', 'Good', 1100, 'Library',
    '{"demo","gaming"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/32a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/32a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/32b/600/400', 1);

  -- Item: Whiteboard
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Others';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Whiteboard', '2x3 feet whiteboard with markers.',
    cat_id, 'Others', 'Good', 500, 'CSE Block',
    '{"demo","others"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/33a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/33a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/33b/600/400', 1);

  -- Item: Mini Fridge
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Others';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Mini Fridge', 'Haier 53L mini refrigerator. Keeps drinks cold.',
    cat_id, 'Others', 'Good', 6000, 'Main Canteen',
    '{"demo","others"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/34a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/34a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/34b/600/400', 1);

  -- Item: Printer
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Others';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Printer', 'HP DeskJet 2331 color printer.',
    cat_id, 'Others', 'Fair', 2000, 'Hostel 1',
    '{"demo","others"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/35a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/35a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/35b/600/400', 1);

  -- Item: Engineering Mathematics
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Books';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Engineering Mathematics', 'BS Grewal 44th Edition.',
    cat_id, 'Books', 'Good', 450, 'Hostel 2',
    '{"demo","books"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/36a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/36a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/36b/600/400', 1);

  -- Item: Microprocessor 8085
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Books';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Microprocessor 8085', 'Ramesh Gaonkar Book.',
    cat_id, 'Books', 'Used', 300, 'Hostel 3',
    '{"demo","books"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/37a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/37a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/37b/600/400', 1);

  -- Item: iPad Air 4
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Electronics';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'iPad Air 4', '64GB WiFi only. With Apple Pencil 2.',
    cat_id, 'Electronics', 'Like new', 42000, 'Hostel 4',
    '{"demo","electronics"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/38a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/38a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/38b/600/400', 1);

  -- Item: Kindle Paperwhite
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Electronics';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Kindle Paperwhite', '10th Gen, 8GB.',
    cat_id, 'Electronics', 'Good', 6500, 'Library',
    '{"demo","electronics"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/39a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/39a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/39b/600/400', 1);

  -- Item: Water Bottle
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Hostel Essentials';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Water Bottle', 'Milton 1L stainless steel bottle.',
    cat_id, 'Hostel Essentials', 'Used', 200, 'CSE Block',
    '{"demo","hostel essentials"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/40a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/40a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/40b/600/400', 1);

  -- Item: Cloth Drying Stand
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Hostel Essentials';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Cloth Drying Stand', 'Stainless steel foldable stand.',
    cat_id, 'Hostel Essentials', 'Good', 700, 'Main Canteen',
    '{"demo","hostel essentials"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/41a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/41a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/41b/600/400', 1);

  -- Item: Bean Bag
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Furniture';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Bean Bag', 'XXL size bean bag with beans.',
    cat_id, 'Furniture', 'Good', 1200, 'Hostel 1',
    '{"demo","furniture"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/42a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/42a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/42b/600/400', 1);

  -- Item: Laptop Table
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Furniture';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Laptop Table', 'Wooden folding table.',
    cat_id, 'Furniture', 'Good', 450, 'Hostel 2',
    '{"demo","furniture"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/43a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/43a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/43b/600/400', 1);

  -- Item: Formal Shirt
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Fashion';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Formal Shirt', 'White Van Heusen shirt, Size 40.',
    cat_id, 'Fashion', 'Like new', 600, 'Hostel 3',
    '{"demo","fashion"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/44a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/44a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/44b/600/400', 1);

  -- Item: Track Pants
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Fashion';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Track Pants', 'Adidas track pants, Size L.',
    cat_id, 'Fashion', 'Good', 750, 'Hostel 4',
    '{"demo","fashion"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/45a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/45a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/45b/600/400', 1);

  -- Item: Tennis Racket
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Sports';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Tennis Racket', 'Yonex ZR 100 Light.',
    cat_id, 'Sports', 'Good', 600, 'Library',
    '{"demo","sports"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/46a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/46a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/46b/600/400', 1);

  -- Item: Basketball
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Sports';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Basketball', 'Spalding NBA basketball.',
    cat_id, 'Sports', 'Good', 800, 'CSE Block',
    '{"demo","sports"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/47a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/47a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/47b/600/400', 1);

  -- Item: Hercules Roadeo
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Cycles';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Hercules Roadeo', 'Roadeo A50 21 speed.',
    cat_id, 'Cycles', 'Good', 5000, 'Main Canteen',
    '{"demo","cycles"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/48a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/48a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/48b/600/400', 1);

  -- Item: Gear Cycle
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Cycles';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Gear Cycle', 'Mach City 21 speed.',
    cat_id, 'Cycles', 'Fair', 4500, 'Hostel 1',
    '{"demo","cycles"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/49a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/49a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/49b/600/400', 1);

  -- Item: PS4 Games Bundle
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Gaming';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'PS4 Games Bundle', 'GOW, Uncharted 4, Horizon Zero Dawn.',
    cat_id, 'Gaming', 'Good', 1500, 'Hostel 2',
    '{"demo","gaming"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/50a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/50a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/50b/600/400', 1);

  -- Item: Gaming Headset
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Gaming';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Gaming Headset', 'HyperX Cloud Stinger.',
    cat_id, 'Gaming', 'Good', 2500, 'Hostel 3',
    '{"demo","gaming"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/51a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/51a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/51b/600/400', 1);

  -- Item: Scientific Poster
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Others';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Scientific Poster', 'A0 size presentation poster.',
    cat_id, 'Others', 'Used', 100, 'Hostel 4',
    '{"demo","others"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/52a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/52a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/52b/600/400', 1);

  -- Item: Extension Board
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Others';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Extension Board', 'Belkin 4-socket surge protector.',
    cat_id, 'Others', 'Good', 400, 'Library',
    '{"demo","others"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/53a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/53a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/53b/600/400', 1);

  -- Item: Iron
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Hostel Essentials';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Iron', 'Philips dry iron.',
    cat_id, 'Hostel Essentials', 'Good', 350, 'CSE Block',
    '{"demo","hostel essentials"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/54a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/54a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/54b/600/400', 1);

  -- Item: Heater
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = 'Hostel Essentials';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', 'Heater', 'Usha room heater.',
    cat_id, 'Hostel Essentials', 'Good', 900, 'Main Canteen',
    '{"demo","hostel essentials"}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, 'https://picsum.photos/seed/55a/600/400'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, 'https://picsum.photos/seed/55a/600/400', 0),
  (new_item_id, 'https://picsum.photos/seed/55b/600/400', 1);

END $$;
