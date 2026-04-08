-- =====================================================
-- RENDIMETA - SUPABASE SCHEMA
-- =====================================================
-- Este esquema es temporal para demo.
-- Luego se migrará a PostgreSQL + Prisma.
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  station TEXT,
  role TEXT NOT NULL DEFAULT 'dispatcher',
  level INTEGER NOT NULL DEFAULT 1,
  station_ids TEXT[], -- Array of station IDs for access control
  xp INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  total_sales INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- BADGES TABLE
-- =====================================================
CREATE TABLE badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold')),
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- USER_BADGES (Many-to-Many)
-- =====================================================
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  unlocked BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- =====================================================
-- DAILY_MISSIONS TABLE
-- =====================================================
CREATE TABLE daily_missions (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  product_type TEXT CHECK (product_type IN ('aceite', 'snack', 'accesorio', 'aromatizante', 'other')),
  target INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- USER_MISSIONS (Progress tracking)
-- =====================================================
CREATE TABLE user_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL REFERENCES daily_missions(id) ON DELETE CASCADE,
  current INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, mission_id)
);

-- =====================================================
-- SALES TABLE
-- =====================================================
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL CHECK (product_type IN ('aceite', 'snack', 'accesorio', 'aromatizante', 'other')),
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TRAINING_VIDEOS TABLE
-- =====================================================
CREATE TABLE training_videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  duration TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  accent_color TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- USER_TRAINING (Completion tracking)
-- =====================================================
CREATE TABLE user_training (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL REFERENCES training_videos(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- =====================================================
-- ITEMS TABLE (Generic items for CRUD demo)
-- =====================================================
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'archived')),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_missions_user_id ON user_missions(user_id);
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX idx_user_training_user_id ON user_training(user_id);
CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_status ON items(status);

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Public read access to badges, missions, and training videos
CREATE POLICY "Public read badges" ON badges FOR SELECT USING (true);
CREATE POLICY "Public read daily_missions" ON daily_missions FOR SELECT USING (true);
CREATE POLICY "Public read training_videos" ON training_videos FOR SELECT USING (true);

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- User badges policies
CREATE POLICY "Users can read own badges" ON user_badges FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own badges" ON user_badges FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own badges" ON user_badges FOR UPDATE USING (auth.uid()::text = user_id::text);

-- User missions policies
CREATE POLICY "Users can read own missions" ON user_missions FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own missions" ON user_missions FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own missions" ON user_missions FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Sales policies
CREATE POLICY "Users can read own sales" ON sales FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own sales" ON sales FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- User training policies
CREATE POLICY "Users can read own training" ON user_training FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own training" ON user_training FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own training" ON user_training FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Items policies (for demo CRUD)
CREATE POLICY "Users can read all items" ON items FOR SELECT USING (true);
CREATE POLICY "Users can insert items" ON items FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own items" ON items FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own items" ON items FOR DELETE USING (auth.uid()::text = user_id::text);
