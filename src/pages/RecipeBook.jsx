import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  addRecipe,
  deleteRecipe,
  getRecipes,
  updateRecipe,
} from '../data/recipes'
import { useAuth } from '../cookbook-guide/hooks/useAuth'
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

  // Same Supabase e-board auth the map uses.
  const { currentUser, login, logout } = useAuth()
  const isEboard = !!currentUser

  const [gearOpen, setGearOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')

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

  function openLogin() {
    setGearOpen(false)
    setLoginEmail('')
    setLoginPassword('')
    setLoginError('')
    setLoginOpen(true)
  }

  function closeLogin() {
    setLoginOpen(false)
  }

  async function handleLoginSubmit(event) {
    event.preventDefault()
    setLoginError('')
    const errMsg = await login(loginEmail.trim(), loginPassword)
    if (errMsg) {
      setLoginError(errMsg)
      return
    }
    setLoginEmail('')
    setLoginPassword('')
    setLoginOpen(false)
  }

  function handleLogout() {
    logout()
    setGearOpen(false)
    if (mode === 'add' || mode === 'edit') cancelForm()
  }

  return (
    <div className="recipe-book-page">
      <div className="recipe-book-atmosphere" aria-hidden="true" />

      <header className="recipe-book-header">
        <Link to="/" className="recipe-book-back">
          ← Return to the club
        </Link>
        <h1 className="recipe-book-title">The Cookbook Recipe Book</h1>
      </header>

      <div className="book-cover">
        <div className="book">
          <div className="book-spine" aria-hidden="true" />

          <section className="book-page book-page-left">
            <div className="page-heading">
              <h2>Table of Contents</h2>
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
                    <p className="recipe-byline">Written by {selected.author}</p>
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
              </article>
            ) : (
              <div className="recipe-empty">
                <p>These pages are blank. Add the first recipe to the volume.</p>
                {isEboard ? (
                  <button type="button" className="book-btn book-btn-primary" onClick={openAdd}>
                    Add a page
                  </button>
                ) : (
                  <p className="recipe-empty-note">E-board members can log in below to add one.</p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ── E-BOARD GEAR TRIGGER / MENU (same Supabase auth as the map) ── */}
      <button
        className="rb-eboard-trigger"
        title="E-board"
        onClick={() => setGearOpen((o) => !o)}
      >
        ⚙️
      </button>

      <div className={`rb-gear-menu${gearOpen ? ' visible' : ''}`}>
        {isEboard ? (
          <button type="button" className="rb-gear-menu-item danger" onClick={handleLogout}>
            Sign out
          </button>
        ) : (
          <button type="button" className="rb-gear-menu-item" onClick={openLogin}>
            E-board log in
          </button>
        )}
      </div>

      {/* ── ADD-A-PAGE BUTTON (only visible once signed in) ── */}
      <button
        type="button"
        className={`rb-add-page-btn${isEboard ? ' visible' : ''}`}
        onClick={openAdd}
      >
        + Add a page
      </button>

      {/* ── LOGIN MODAL ── */}
      <div className={`rb-backdrop${loginOpen ? ' visible' : ''}`} onClick={closeLogin} />
      <div className={`rb-modal${loginOpen ? ' visible' : ''}`}>
        <div className="rb-modal-header">
          <span className="rb-modal-title">E-board log in</span>
          <button type="button" className="rb-modal-close" onClick={closeLogin}>
            ✕
          </button>
        </div>
        <form className="rb-modal-body" onSubmit={handleLoginSubmit}>
          <input
            type="email"
            className="rb-input"
            placeholder="Email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            autoFocus
          />
          <input
            type="password"
            className="rb-input"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
          />
          <p className="rb-error">{loginError}</p>
          <div className="form-actions">
            <button type="submit" className="rb-btn-primary">
              Log in
            </button>
            <button type="button" className="rb-btn-secondary" onClick={closeLogin}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RecipeBook
