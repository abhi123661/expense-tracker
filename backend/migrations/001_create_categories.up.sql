CREATE TABLE IF NOT EXISTS categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) NOT NULL UNIQUE,
    icon        VARCHAR(50),
    color       VARCHAR(7),
    is_default  BOOLEAN DEFAULT false,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default categories
INSERT INTO categories (name, icon, color, is_default) VALUES
    ('Food', '🍕', '#FF6B6B', true),
    ('Transport', '🚗', '#4ECDC4', true),
    ('Bills', '📄', '#45B7D1', true),
    ('Entertainment', '🎬', '#96CEB4', true),
    ('Health', '💊', '#FFEAA7', true),
    ('Shopping', '🛍️', '#DDA0DD', true),
    ('Education', '📚', '#98D8C8', true),
    ('Other', '📌', '#95A5A6', true)
ON CONFLICT (name) DO NOTHING;
