CREATE TABLE dietary_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  preference text NOT NULL,
  type text NOT NULL DEFAULT 'allergy',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, preference)
);

ALTER TABLE dietary_preferences DISABLE ROW LEVEL SECURITY;
