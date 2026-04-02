# Cheffaloo

AI-powered meal planning and grocery list webapp. Plan your week, generate recipes with AI, and automatically create grocery lists.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React, Tailwind CSS, shadcn/ui
- **Backend:** Next.js Server Actions
- **Database:** Supabase (PostgreSQL)
- **AI:** OpenAI API (GPT-4o with structured JSON output)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration file at `supabase/migrations/001_initial_schema.sql`
3. Copy your project URL and anon key from **Settings > API**

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-your-openai-api-key
```

### 4. Seed the demo user

Run this in the Supabase SQL Editor:

```sql
INSERT INTO users (id, email, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'demo@cheffaloo.app', 'Tim & Sarah')
ON CONFLICT (id) DO NOTHING;
```

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

| Route | Description |
|-------|-------------|
| `/` | Weekly Meal Planner - plan meals for each day |
| `/generate` | AI Recipe Generator - describe a meal, get a recipe |
| `/recipes` | Saved Recipes - browse your recipe collection |
| `/recipes/[id]` | Recipe Detail - full recipe with ingredients & instructions |
| `/grocery-list` | Grocery List - auto-generated from your meal plan |
| `/favorites` | Favorites - top-rated recipes |

## Architecture

```
src/
  actions/        Server actions (Supabase queries, OpenAI calls)
  app/            Next.js App Router pages
  components/     React components (sidebar, planner, cards, etc.)
  lib/            Utilities (Supabase client, OpenAI, types, grocery logic)
supabase/
  migrations/     Database schema
```

## Features

- Weekly meal planning with drag-to-add interface
- AI recipe generation with structured JSON output
- Auto-generated grocery lists grouped by category
- Recipe rating and review system
- Mobile-friendly responsive design
