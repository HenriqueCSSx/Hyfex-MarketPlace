-- Add description column if it doesn't exist
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Remove constraint on 'name' if it exists, to allow flexibility (optional, or we handle conflict)
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_name_key;

-- Insert 'Outros' categories
INSERT INTO public.categories (name, slug, description)
VALUES 
  ('Assinaturas e Premium', 'assinaturas-premium', 'Netflix, Spotify, Youtube Premium, etc.'),
  ('Cursos e Treinamentos', 'cursos-treinamentos', 'Cursos digitais, ebooks, mentorias.'),
  ('Discord', 'discord', 'Nitro, boosts, servidores, bots.'),
  ('Emails', 'emails', 'Contas de email antigas, listas, etc.'),
  ('Gift Cards', 'gift-cards', 'Steam, Play Store, iFood, Uber, etc.'),
  ('Redes Sociais', 'redes-sociais', 'Seguidores, curtidas, contas engajadas.'),
  ('Serviços Digitais', 'servicos-digitais', 'Design, edição, programação, farming.'),
  ('Softwares e Licenças', 'softwares-licencas', 'Windows, Office, Antivírus, Adobe.')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Insert specific 'Jogos' categories
INSERT INTO public.categories (name, slug, description)
VALUES 
  ('League of Legends', 'league-of-legends', 'Contas, RP, Coaching, Elojob.'),
  ('ARC Riders', 'arc-riders', 'Contas e Itens.'),
  ('BrawlStars', 'brawl-stars', 'Gemas, Contas, Pass.'),
  ('Clash of Clans', 'clash-of-clans', 'Contas, Gemas, Vilas.'),
  ('Fortnite', 'fortnite', 'Contas, V-Bucks, Skins, Itens.'),
  ('Genshin Impact', 'genshin-impact', 'Contas, Cristais, Bênção.'),
  ('Roblox', 'roblox', 'Robux, Itens, Contas, Blox Fruits.'),
  ('Valorant', 'valorant', 'Contas, VP, Coaching.'),
  ('Steam', 'steam', 'Contas Steam, Jogos, Saldo.')
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description;
