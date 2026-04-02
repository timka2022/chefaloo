-- ============================================================
-- 001_initial_schema.sql
-- Cheffaloo initial database schema
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

-- users
CREATE TABLE IF NOT EXISTS public.users (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    email       text        NOT NULL UNIQUE,
    name        text,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- recipes
CREATE TABLE IF NOT EXISTS public.recipes (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid        NOT NULL REFERENCES public.users(id),
    title               text        NOT NULL,
    description         text,
    image_url           text,
    servings            int         NOT NULL DEFAULT 4,
    prep_time_minutes   int,
    cook_time_minutes   int,
    instructions_json   jsonb       NOT NULL DEFAULT '[]',
    tags                text[]      NOT NULL DEFAULT '{}',
    created_at          timestamptz NOT NULL DEFAULT now()
);

-- recipe_ingredients
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id           uuid        NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    ingredient_name     text        NOT NULL,
    quantity            numeric,
    unit                text,
    grocery_category    text        NOT NULL DEFAULT 'pantry'
);

-- meal_plans
CREATE TABLE IF NOT EXISTS public.meal_plans (
    id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid    NOT NULL REFERENCES public.users(id),
    week_start_date date    NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, week_start_date)
);

-- meal_plan_items
CREATE TABLE IF NOT EXISTS public.meal_plan_items (
    id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_plan_id    uuid    NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
    recipe_id       uuid    NOT NULL REFERENCES public.recipes(id),
    planned_day     text    NOT NULL,   -- 'monday','tuesday','wednesday','thursday','friday','saturday','sunday'
    meal_type       text    NOT NULL DEFAULT 'dinner',  -- 'breakfast','lunch','dinner','snack'
    servings        int     NOT NULL DEFAULT 4
);

-- recipe_reviews
CREATE TABLE IF NOT EXISTS public.recipe_reviews (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id       uuid        NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    user_id         uuid        NOT NULL REFERENCES public.users(id),
    rating          int         NOT NULL CHECK (rating BETWEEN 1 AND 5),
    notes           text,
    would_make_again boolean    NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (recipe_id, user_id)
);

-- pantry_items
CREATE TABLE IF NOT EXISTS public.pantry_items (
    id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid    NOT NULL REFERENCES public.users(id),
    item_name           text    NOT NULL,
    always_available    boolean NOT NULL DEFAULT true
);

-- ============================================================
-- INDEXES
-- ============================================================

-- recipes
CREATE INDEX IF NOT EXISTS idx_recipes_user_id         ON public.recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at      ON public.recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_tags            ON public.recipes USING gin(tags);

-- recipe_ingredients
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id  ON public.recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_category   ON public.recipe_ingredients(grocery_category);

-- meal_plans
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id            ON public.meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_week_start_date    ON public.meal_plans(week_start_date);

-- meal_plan_items
CREATE INDEX IF NOT EXISTS idx_meal_plan_items_meal_plan_id  ON public.meal_plan_items(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_items_recipe_id     ON public.meal_plan_items(recipe_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_items_planned_day   ON public.meal_plan_items(planned_day);

-- recipe_reviews
CREATE INDEX IF NOT EXISTS idx_recipe_reviews_recipe_id      ON public.recipe_reviews(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_reviews_user_id        ON public.recipe_reviews(user_id);

-- pantry_items
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_id          ON public.pantry_items(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_reviews    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pantry_items      ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES — users
-- ============================================================

-- Users can read their own row
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- Users can insert their own row (uid must match their auth id)
CREATE POLICY "users_insert_own" ON public.users
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

-- Users can update their own row
CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Users can delete their own row
CREATE POLICY "users_delete_own" ON public.users
    FOR DELETE TO authenticated
    USING (id = auth.uid());

-- ============================================================
-- RLS POLICIES — recipes
-- ============================================================

CREATE POLICY "recipes_select_own" ON public.recipes
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "recipes_insert_own" ON public.recipes
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "recipes_update_own" ON public.recipes
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "recipes_delete_own" ON public.recipes
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES — recipe_ingredients
-- (access scoped via the parent recipe owner)
-- ============================================================

CREATE POLICY "recipe_ingredients_select_own" ON public.recipe_ingredients
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.recipes r
            WHERE r.id = recipe_id AND r.user_id = auth.uid()
        )
    );

CREATE POLICY "recipe_ingredients_insert_own" ON public.recipe_ingredients
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.recipes r
            WHERE r.id = recipe_id AND r.user_id = auth.uid()
        )
    );

CREATE POLICY "recipe_ingredients_update_own" ON public.recipe_ingredients
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.recipes r
            WHERE r.id = recipe_id AND r.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.recipes r
            WHERE r.id = recipe_id AND r.user_id = auth.uid()
        )
    );

CREATE POLICY "recipe_ingredients_delete_own" ON public.recipe_ingredients
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.recipes r
            WHERE r.id = recipe_id AND r.user_id = auth.uid()
        )
    );

-- ============================================================
-- RLS POLICIES — meal_plans
-- ============================================================

CREATE POLICY "meal_plans_select_own" ON public.meal_plans
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "meal_plans_insert_own" ON public.meal_plans
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "meal_plans_update_own" ON public.meal_plans
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "meal_plans_delete_own" ON public.meal_plans
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES — meal_plan_items
-- (access scoped via the parent meal_plan owner)
-- ============================================================

CREATE POLICY "meal_plan_items_select_own" ON public.meal_plan_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.meal_plans mp
            WHERE mp.id = meal_plan_id AND mp.user_id = auth.uid()
        )
    );

CREATE POLICY "meal_plan_items_insert_own" ON public.meal_plan_items
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.meal_plans mp
            WHERE mp.id = meal_plan_id AND mp.user_id = auth.uid()
        )
    );

CREATE POLICY "meal_plan_items_update_own" ON public.meal_plan_items
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.meal_plans mp
            WHERE mp.id = meal_plan_id AND mp.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.meal_plans mp
            WHERE mp.id = meal_plan_id AND mp.user_id = auth.uid()
        )
    );

CREATE POLICY "meal_plan_items_delete_own" ON public.meal_plan_items
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.meal_plans mp
            WHERE mp.id = meal_plan_id AND mp.user_id = auth.uid()
        )
    );

-- ============================================================
-- RLS POLICIES — recipe_reviews
-- ============================================================

-- Any authenticated user can read reviews (useful for shared recipe browsing)
CREATE POLICY "recipe_reviews_select_authenticated" ON public.recipe_reviews
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "recipe_reviews_insert_own" ON public.recipe_reviews
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "recipe_reviews_update_own" ON public.recipe_reviews
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "recipe_reviews_delete_own" ON public.recipe_reviews
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES — pantry_items
-- ============================================================

CREATE POLICY "pantry_items_select_own" ON public.pantry_items
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "pantry_items_insert_own" ON public.pantry_items
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "pantry_items_update_own" ON public.pantry_items
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "pantry_items_delete_own" ON public.pantry_items
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());
