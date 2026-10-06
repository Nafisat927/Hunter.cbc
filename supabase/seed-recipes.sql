-- ─────────────────────────────────────────────────────────────
-- Copies the 3 original sample recipes into the recipes table.
-- Run AFTER recipes.sql. Supabase → SQL Editor → paste → Run.
-- Safe to run more than once (skips titles that already exist).
--
-- author_id is left empty because these weren't written by a
-- logged-in member, so nobody can edit/remove them from the site.
-- (You can still edit or delete them in Supabase → Table Editor.)
-- ─────────────────────────────────────────────────────────────

insert into public.recipes (title, author, author_id, image_url, ingredients, instructions, created_at)
select v.title, v.author, null, v.image_url, v.ingredients, v.instructions, v.created_at
from (values
  (
    'Garlic Butter Noodles',
    'Maya C.',
    'https://images.unsplash.com/photo-1622973536968-3ead9e2448d5?auto=format&fit=crop&w=800&q=80',
    array['8 oz spaghetti', '4 tbsp butter', '4 cloves garlic, minced', '1/4 cup grated Parmesan', 'Salt and black pepper', 'Chopped parsley'],
    'Boil the noodles until al dente. Melt butter in a pan, add garlic and cook until fragrant. Toss noodles in the garlic butter, finish with Parmesan, salt, pepper, and parsley.',
    timestamptz '2026-01-10 12:00:00+00'
  ),
  (
    'Berry Overnight Oats',
    'Jordan L.',
    'https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=800&q=80',
    array['1/2 cup rolled oats', '1/2 cup milk of choice', '1/4 cup yogurt', '1 tbsp honey', '1/2 cup mixed berries', 'Pinch of cinnamon'],
    'Stir oats, milk, yogurt, honey, and cinnamon in a jar. Top with berries, cover, and refrigerate overnight. Eat cold or warm gently in the morning.',
    timestamptz '2026-02-02 12:00:00+00'
  ),
  (
    'Sheet-Pan Honey Soy Tofu',
    'Sam R.',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    array['1 block firm tofu, cubed', '2 tbsp soy sauce', '1 tbsp honey', '1 tbsp oil', '1 tsp sesame oil', 'Broccoli florets', 'Sesame seeds'],
    'Toss tofu and broccoli with soy sauce, honey, oil, and sesame oil. Spread on a sheet pan and roast at 400°F for 25 minutes, flipping once. Sprinkle with sesame seeds before serving.',
    timestamptz '2026-03-15 12:00:00+00'
  )
) as v(title, author, image_url, ingredients, instructions, created_at)
where not exists (select 1 from public.recipes r where r.title = v.title);
