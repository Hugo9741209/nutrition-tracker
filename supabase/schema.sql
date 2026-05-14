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
