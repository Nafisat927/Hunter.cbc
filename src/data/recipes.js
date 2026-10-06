// Recipe Book data layer — reads/writes the `recipes` table in the same
// Supabase project the CookBook Guide map uses (see supabase/recipes.sql).
import { sbClient } from '../cookbook-guide/lib/supabaseClient'
import { uploadPhotos } from '../cookbook-guide/lib/photoUpload'

const PHOTO_BUCKET = 'recipe-photos'

// Turn a database row into the shape RecipeBook.jsx uses.
// `owned` is true when the logged-in user wrote this page.
function mapRow(row, currentUserId) {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    cuisine: row.cuisine || '',
    image: row.image_url || '',
    ingredients: row.ingredients || [],
    instructions: row.instructions || '',
    owned: !!currentUserId && row.author_id === currentUserId,
    createdAt: row.created_at,
  }
}

function cleanIngredients(ingredients) {
  return ingredients.map((item) => item.trim()).filter(Boolean)
}

// Uploads one photo into recipe-photos/<recipeId>/ and returns its public URL.
async function uploadRecipePhoto(recipeId, file) {
  const [url] = await uploadPhotos(PHOTO_BUCKET, recipeId, [file])
  if (!url) throw new Error('Photo upload failed.')
  return url
}

export async function getRecipes(currentUserId) {
  const { data, error } = await sbClient
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data.map((row) => mapRow(row, currentUserId))
}

export async function addRecipe({ title, author, cuisine, ingredients, instructions, imageFile }) {
  const { data: inserted, error } = await sbClient
    .from('recipes')
    .insert({
      title: title.trim(),
      author: author.trim() || 'Eboard Member',
      cuisine,
      ingredients: cleanIngredients(ingredients),
      instructions: instructions.trim(),
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Photo goes in after the row exists, so it can live in a folder named
  // after the recipe id (same approach as the map's place photos).
  if (imageFile) {
    const imageUrl = await uploadRecipePhoto(inserted.id, imageFile)
    const { error: photoError } = await sbClient
      .from('recipes')
      .update({ image_url: imageUrl })
      .eq('id', inserted.id)
    if (photoError) throw new Error(photoError.message)
  }

  return inserted.id
}

export async function updateRecipe(id, { title, author, cuisine, ingredients, instructions, image, imageFile }) {
  let imageUrl = image || null
  if (imageFile) imageUrl = await uploadRecipePhoto(id, imageFile)

  const { error } = await sbClient
    .from('recipes')
    .update({
      title: title.trim(),
      author: author.trim() || 'Eboard Member',
      cuisine,
      ingredients: cleanIngredients(ingredients),
      instructions: instructions.trim(),
      image_url: imageUrl,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function deleteRecipe(id) {
  const { error } = await sbClient.from('recipes').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
