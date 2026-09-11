import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  addRecipe,
  deleteRecipe,
  getRecipes,
  updateRecipe,
} from '../data/recipes'
import './RecipeBook.css'

const emptyForm = {
  title: '',
  author: '',
  ingredients: '',
  instructions: '',
  image: '',
}

const MAX_IMAGE_BYTES = 1_200_000

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file.'))
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      reject(new Error('Image must be under about 1MB. Try a smaller photo.'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read that image.'))
    reader.readAsDataURL(file)
  })
}

function RecipeBook() {
  const [recipes, setRecipes] = useState(() => getRecipes())
  const [selectedId, setSelectedId] = useState(() => getRecipes()[0]?.id ?? null)
  const [mode, setMode] = useState('view')
  const [form, setForm] = useState(emptyForm)
  const [imageError, setImageError] = useState('')

  const selected = recipes.find((recipe) => recipe.id === selectedId) ?? null

  function refresh(nextSelectedId) {
    const next = getRecipes()
    setRecipes(next)
    setSelectedId(nextSelectedId ?? next[0]?.id ?? null)
  }

  function openAdd() {
    setMode('add')
    setForm(emptyForm)
    setImageError('')
  }

  function openEdit() {
    if (!selected?.owned) return
    setMode('edit')
    setImageError('')
    setForm({
      title: selected.title,
      author: selected.author,
      ingredients: selected.ingredients.join('\n'),
      instructions: selected.instructions,
      image: selected.image || '',
    })
  }

  function cancelForm() {
    setMode('view')
    setForm(emptyForm)
    setImageError('')
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setImageError('')
    try {
      const image = await readImageFile(file)
      setForm((prev) => ({ ...prev, image }))
    } catch (err) {
      setImageError(err.message)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.title.trim()) return

    const payload = {
      title: form.title,
      author: form.author,
      ingredients: form.ingredients.split('\n'),
      instructions: form.instructions,
      image: form.image,
    }

    if (mode === 'add') {
      const created = addRecipe(payload)
      refresh(created.id)
    } else if (mode === 'edit' && selected) {
      updateRecipe(selected.id, payload)
      refresh(selected.id)
    }

    setMode('view')
    setForm(emptyForm)
    setImageError('')
  }

  function handleDelete() {
    if (!selected?.owned) return
    if (!window.confirm(`Delete “${selected.title}”?`)) return
    deleteRecipe(selected.id)
    setMode('view')
    refresh(null)
  }

  return (
    <div className="recipe-book-page">
      <div className="recipe-book-atmosphere" aria-hidden="true" />

      <header className="recipe-book-header">
        <Link to="/" className="recipe-book-back">
          ← Return to the club
        </Link>
        <p className="recipe-book-kicker">Cookbook Club · Hunter College</p>
        <h1 className="recipe-book-title">The Cookbook Recipe Book</h1>
        <p className="recipe-book-subtitle">
          A shared volume of recipes from the table — add your page, leave the rest as written.
        </p>
      </header>

      <div className="book-cover">
        <div className="book">
          <div className="book-spine" aria-hidden="true" />

          <section className="book-page book-page-left">
            <div className="page-heading">
              <h2>Table of Contents</h2>
              <button type="button" className="book-btn" onClick={openAdd}>
                Add a page
              </button>
            </div>

            <ol className="toc">
              {recipes.map((recipe, index) => (
                <li key={recipe.id}>
                  <button
                    type="button"
                    className={`toc-item${selectedId === recipe.id && mode === 'view' ? ' is-active' : ''}`}
                    onClick={() => {
                      setSelectedId(recipe.id)
                      setMode('view')
                    }}
                  >
                    {recipe.image ? (
                      <img
                        src={recipe.image}
                        alt=""
                        className="toc-thumb"
                      />
                    ) : (
                      <span className="toc-thumb toc-thumb-empty" aria-hidden="true" />
                    )}
                    <span className="toc-index">{String(index + 1).padStart(2, '0')}</span>
                    <span className="toc-text">
                      <span className="toc-title">{recipe.title}</span>
                      <span className="toc-author">
                        {recipe.author}
                        {recipe.owned ? ' · your page' : ''}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </section>

          <section className="book-page book-page-right">
            {mode === 'add' || mode === 'edit' ? (
              <form className="recipe-form" onSubmit={handleSubmit}>
                <h2>{mode === 'add' ? 'Inscribe a New Recipe' : 'Amend Your Recipe'}</h2>

                <label>
                  Title
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                    placeholder="e.g. Sunday Roast Chicken"
                  />
                </label>

                <label>
                  Author
                  <input
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                    placeholder="Name as it should appear in the book"
                  />
                </label>

                <label className="image-field">
                  Photograph
                  <input type="file" accept="image/*" onChange={handleImageChange} />
                </label>
                {imageError && <p className="image-error">{imageError}</p>}
                {form.image && (
                  <div className="image-preview-wrap">
                    <img src={form.image} alt="Recipe preview" className="image-preview" />
                    <button
                      type="button"
                      className="book-btn"
                      onClick={() => setForm({ ...form, image: '' })}
                    >
                      Remove photograph
                    </button>
                  </div>
                )}

                <label>
                  Ingredients
                  <textarea
                    value={form.ingredients}
                    onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
                    rows={5}
                    placeholder="One ingredient per line"
                    required
                  />
                </label>

                <label>
                  Method
                  <textarea
                    value={form.instructions}
                    onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                    rows={5}
                    placeholder="How is it prepared?"
                    required
                  />
                </label>

                <div className="form-actions">
                  <button type="submit" className="book-btn book-btn-primary">
                    Save to the book
                  </button>
                  <button type="button" className="book-btn" onClick={cancelForm}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : selected ? (
              <article className="recipe-detail" key={selected.id}>
                <div className="recipe-detail-top">
                  <div>
                    <p className="recipe-kicker">From the collection</p>
                    <h2>{selected.title}</h2>
                    <p className="recipe-byline">Prepared by {selected.author}</p>
                  </div>
                  {selected.owned && (
                    <div className="recipe-actions">
                      <button type="button" className="book-btn" onClick={openEdit}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="book-btn book-btn-danger"
                        onClick={handleDelete}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {selected.image && (
                  <figure className="recipe-photo">
                    <img src={selected.image} alt={selected.title} />
                  </figure>
                )}

                <h3>Ingredients</h3>
                <ul className="ingredient-list">
                  {selected.ingredients.map((item, index) => (
                    <li key={`${index}-${item}`}>{item}</li>
                  ))}
                </ul>

                <h3>Method</h3>
                <p className="instructions">{selected.instructions}</p>

                {!selected.owned && (
                  <p className="ownership-note">
                    A fellow member’s page — for reading only.
                  </p>
                )}
              </article>
            ) : (
              <div className="recipe-empty">
                <p>These pages are blank. Add the first recipe to the volume.</p>
                <button type="button" className="book-btn book-btn-primary" onClick={openAdd}>
                  Add a page
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default RecipeBook
