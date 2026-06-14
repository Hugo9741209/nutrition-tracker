-- ============================================
-- NUTRITRACK — Schema Supabase
-- Colle ce SQL dans ton éditeur Supabase SQL
-- ============================================

-- Profiles utilisateurs
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  age INTEGER DEFAULT 20,
  gender TEXT DEFAULT 'male',
  height_cm NUMERIC DEFAULT 175,
  current_weight_kg NUMERIC,
  target_weight_kg NUMERIC,
  body_fat_pct NUMERIC,  -- optionnel : si renseigné, active le BMR Katch-McArdle (plus précis pour profils musclés)
  activity_level TEXT DEFAULT 'very_active',
  goal TEXT DEFAULT 'maintain',
  target_calories INTEGER,
  target_protein_g INTEGER,
  target_carbs_g INTEGER,
  target_fat_g INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journaux alimentaires
CREATE TABLE IF NOT EXISTS public.food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  brand TEXT,
  quantity_g NUMERIC NOT NULL DEFAULT 100,
  calories NUMERIC NOT NULL DEFAULT 0,
  protein_g NUMERIC DEFAULT 0,
  carbs_g NUMERIC DEFAULT 0,
  fat_g NUMERIC DEFAULT 0,
  fiber_g NUMERIC DEFAULT 0,
  meal_type TEXT NOT NULL DEFAULT 'lunch',
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journaux de poids
CREATE TABLE IF NOT EXISTS public.weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg NUMERIC NOT NULL,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, logged_date)
);

-- Sécurité RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profile_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own_profile_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own_profile_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "own_food_select" ON public.food_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_food_insert" ON public.food_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_food_update" ON public.food_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_food_delete" ON public.food_logs FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "own_weight_select" ON public.weight_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_weight_insert" ON public.weight_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_weight_update" ON public.weight_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_weight_delete" ON public.weight_logs FOR DELETE USING (auth.uid() = user_id);

-- Création auto du profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (new.id, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- CIQUAL — table de référence aliments (ANSES, valeurs /100g)
-- Source : CIQUAL 2020 (ciqual.anses.fr). Base FR officielle, fiabilité élevée.
-- Données statiques → lecture publique (RLS select true), écriture réservée au SQL editor.
-- L'import complet (3484 aliments) se fait via le CSV officiel (data.gouv.fr) ;
-- ci-dessous une amorce d'aliments courants pour rendre la recherche utile tout de suite.
-- ============================================
CREATE TABLE IF NOT EXISTS public.ciqual_foods (
  code TEXT PRIMARY KEY,         -- code CIQUAL (ou slug en attendant l'import officiel)
  food_name TEXT NOT NULL,
  calories NUMERIC NOT NULL DEFAULT 0,   -- kcal /100g
  protein_g NUMERIC DEFAULT 0,
  carbs_g NUMERIC DEFAULT 0,
  fat_g NUMERIC DEFAULT 0,
  fiber_g NUMERIC DEFAULT 0,
  food_group TEXT
);

-- Index recherche par nom (trigram, pour les LIKE/ILIKE %terme%)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_ciqual_name ON public.ciqual_foods USING gin (food_name gin_trgm_ops);

ALTER TABLE public.ciqual_foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ciqual_read_all" ON public.ciqual_foods FOR SELECT USING (true);

-- Amorce d'aliments courants (valeurs indicatives CIQUAL 2020 /100g)
INSERT INTO public.ciqual_foods (code, food_name, calories, protein_g, carbs_g, fat_g, fiber_g, food_group) VALUES
  ('cq_riz_blanc_cuit',    'Riz blanc cuit',                130, 2.7, 28.0, 0.3, 0.6, 'Féculents'),
  ('cq_riz_complet_cuit',  'Riz complet cuit',              112, 2.6, 23.0, 0.9, 1.8, 'Féculents'),
  ('cq_pates_cuites',      'Pâtes cuites',                  131, 5.0, 25.0, 1.1, 1.8, 'Féculents'),
  ('cq_quinoa_cuit',       'Quinoa cuit',                   120, 4.4, 21.0, 1.9, 2.8, 'Féculents'),
  ('cq_pomme_terre_cuite', 'Pomme de terre cuite',           87, 2.0, 20.0, 0.1, 1.8, 'Féculents'),
  ('cq_pain_complet',      'Pain complet',                  247, 13.0, 41.0, 3.4, 7.0, 'Féculents'),
  ('cq_baguette',          'Pain (baguette)',               271, 9.0, 55.0, 1.3, 3.0, 'Féculents'),
  ('cq_flocons_avoine',    'Flocons d''avoine',             389, 17.0, 66.0, 7.0, 10.0, 'Féculents'),
  ('cq_lentilles_cuites',  'Lentilles cuites',              116, 9.0, 20.0, 0.4, 8.0, 'Légumineuses'),
  ('cq_poulet_blanc_cuit', 'Blanc de poulet cuit',          165, 31.0, 0.0, 3.6, 0.0, 'Viandes'),
  ('cq_steak_hache_5',     'Steak haché 5% MG cuit',        137, 21.0, 0.0, 5.0, 0.0, 'Viandes'),
  ('cq_oeuf',              'Œuf entier',                    143, 12.6, 0.7, 9.5, 0.0, 'Œufs'),
  ('cq_saumon',            'Saumon cuit',                   208, 20.0, 0.0, 13.0, 0.0, 'Poissons'),
  ('cq_thon_naturel',      'Thon au naturel',               116, 26.0, 0.0, 1.0, 0.0, 'Poissons'),
  ('cq_yaourt_nature',     'Yaourt nature',                  61, 3.5, 4.7, 3.3, 0.0, 'Produits laitiers'),
  ('cq_fromage_blanc_0',   'Fromage blanc 0%',               47, 8.0, 4.0, 0.2, 0.0, 'Produits laitiers'),
  ('cq_lait_demi',         'Lait demi-écrémé',               47, 3.3, 4.8, 1.6, 0.0, 'Produits laitiers'),
  ('cq_beurre',            'Beurre',                        717, 0.9, 0.1, 81.0, 0.0, 'Matières grasses'),
  ('cq_huile_olive',       'Huile d''olive',                884, 0.0, 0.0, 100.0, 0.0, 'Matières grasses'),
  ('cq_amandes',           'Amandes',                       579, 21.0, 22.0, 50.0, 12.0, 'Fruits à coque'),
  ('cq_banane',            'Banane',                         89, 1.1, 23.0, 0.3, 2.6, 'Fruits'),
  ('cq_pomme',             'Pomme',                          52, 0.3, 14.0, 0.2, 2.4, 'Fruits'),
  ('cq_avocat',            'Avocat',                        160, 2.0, 9.0, 15.0, 7.0, 'Fruits'),
  ('cq_tomate',            'Tomate',                         18, 0.9, 3.9, 0.2, 1.2, 'Légumes'),
  ('cq_brocoli_cuit',      'Brocoli cuit',                   35, 2.4, 7.0, 0.4, 3.3, 'Légumes')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- Repas favoris / templates (1 par user, contient une liste d'aliments)
-- items = JSONB : [{ food_name, brand, quantity_g, calories, protein_g, carbs_g, fat_g, fiber_g, source }]
-- ============================================
CREATE TABLE IF NOT EXISTS public.meal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  meal_type TEXT DEFAULT 'lunch',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_meal_templates_user ON public.meal_templates (user_id);

ALTER TABLE public.meal_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_tpl_select" ON public.meal_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_tpl_insert" ON public.meal_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_tpl_update" ON public.meal_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_tpl_delete" ON public.meal_templates FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Liste de courses (items cochables, persistés par user)
-- ============================================
CREATE TABLE IF NOT EXISTS public.shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  qty TEXT,                       -- libre : "500 g", "2", etc.
  checked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shopping_user ON public.shopping_items (user_id);
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_shop_select" ON public.shopping_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_shop_insert" ON public.shopping_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_shop_update" ON public.shopping_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_shop_delete" ON public.shopping_items FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Hydratation (1 ligne par user + jour)
-- ============================================
CREATE TABLE IF NOT EXISTS public.water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  glasses INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, logged_date)
);
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_water_select" ON public.water_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_water_insert" ON public.water_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_water_update" ON public.water_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_water_delete" ON public.water_logs FOR DELETE USING (auth.uid() = user_id);
