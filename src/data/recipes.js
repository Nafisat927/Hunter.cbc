const STORAGE_KEY = 'cbc-recipes-v2'

const SEED_RECIPES = [
  {
    id: 'seed-garlic-noodles',
    title: 'Garlic Butter Noodles',
    author: 'Maya C.',
    image:
      'https://images.unsplash.com/photo-1622973536968-3ead9e2448d5?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      '8 oz spaghetti',
      '4 tbsp butter',
      '4 cloves garlic, minced',
      '1/4 cup grated Parmesan',
      'Salt and black pepper',
      'Chopped parsley',
    ],
    instructions:
      'Boil the noodles until al dente. Melt butter in a pan, add garlic and cook until fragrant. Toss noodles in the garlic butter, finish with Parmesan, salt, pepper, and parsley.',
    owned: false,
    createdAt: '2026-01-10T12:00:00.000Z',
  },
  {
    id: 'seed-overnight-oats',
    title: 'Berry Overnight Oats',
    author: 'Jordan L.',
    image:
      'https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      '1/2 cup rolled oats',
      '1/2 cup milk of choice',
      '1/4 cup yogurt',
      '1 tbsp honey',
      '1/2 cup mixed berries',
      'Pinch of cinnamon',
    ],
    instructions:
      'Stir oats, milk, yogurt, honey, and cinnamon in a jar. Top with berries, cover, and refrigerate overnight. Eat cold or warm gently in the morning.',
    owned: false,
    createdAt: '2026-02-02T12:00:00.000Z',
  },
  {
    id: 'seed-sheet-pan-tofu',
    title: 'Sheet-Pan Honey Soy Tofu',
    author: 'Sam R.',
    image:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      '1 block firm tofu, cubed',
      '2 tbsp soy sauce',
      '1 tbsp honey',
      '1 tbsp oil',
      '1 tsp sesame oil',
      'Broccoli florets',
      'Sesame seeds',
    ],
    instructions:
      'Toss tofu and broccoli with soy sauce, honey, oil, and sesame oil. Spread on a sheet pan and roast at 400°F for 25 minutes, flipping once. Sprinkle with sesame seeds before serving.',
    owned: false,
    createdAt: '2026-03-15T12:00:00.000Z',
  },
]

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_RECIPES))
      return [...SEED_RECIPES]
    }
    return JSON.parse(raw)
  } catch {
    return [...SEED_RECIPES]
  }
}

function writeStore(recipes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes))
}

export function getRecipes() {
  return readStore().sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
}

export function addRecipe({ title, author, ingredients, instructions, image }) {
  const recipes = readStore()
  const recipe = {
    id: crypto.randomUUID(),
    title: title.trim(),
    author: author.trim() || 'Anonymous',
    image: image || '',
    ingredients: ingredients.filter((item) => item.trim()).map((item) => item.trim()),
    instructions: instructions.trim(),
    owned: true,
    createdAt: new Date().toISOString(),
  }
  recipes.push(recipe)
  writeStore(recipes)
  return recipe
}

export function updateRecipe(id, { title, author, ingredients, instructions, image }) {
  const recipes = readStore()
  const index = recipes.findIndex((recipe) => recipe.id === id)
  if (index === -1) {
    throw new Error('Recipe not found')
  }
  if (!recipes[index].owned) {
    throw new Error('You can only edit your own recipes')
  }

  recipes[index] = {
    ...recipes[index],
    title: title.trim(),
    author: author.trim() || 'Anonymous',
    image: image || '',
    ingredients: ingredients.filter((item) => item.trim()).map((item) => item.trim()),
    instructions: instructions.trim(),
  }
  writeStore(recipes)
  return recipes[index]
}

export function deleteRecipe(id) {
  const recipes = readStore()
  const recipe = recipes.find((item) => item.id === id)
  if (!recipe) {
    throw new Error('Recipe not found')
  }
  if (!recipe.owned) {
    throw new Error('You can only delete your own recipes')
  }

  const next = recipes.filter((item) => item.id !== id)
  writeStore(next)
}
