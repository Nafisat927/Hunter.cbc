import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  addRecipe,
  deleteRecipe,
  getRecipes,
  updateRecipe,
} from '../data/recipes'
import { useAuth } from '../cookbook-guide/hooks/useAuth'
import EboardControls from '../cookbook-guide/components/EboardControls'
import LoginModal from '../cookbook-guide/components/LoginModal'
import AccountSettingsModal from '../cookbook-guide/components/AccountSettingsModal'
import Modal from '../cookbook-guide/components/Modal'
import SingleSelectDropdown from '../cookbook-guide/components/SingleSelectDropdown'
import TagsMultiSelect from '../cookbook-guide/components/TagsMultiSelect'
import { cuisineOptions, recipeTags } from '../cookbook-guide/lib/formOptions'
import '../cookbook-guide/fonts.css'
import '../cookbook-guide/cookbook-guide.css'
import './RecipeBook.css'

const cuisineSelectOptions = cuisineOptions.map((c) => ({ value: c, label: c }))

const emptyForm = {
  title: '',
  cuisine: '',
  tags: [],
  ingredients: '',
  instructions: '',
  image: '', // URL shown in the preview (existing photo or a local preview)
  imageFile: null, // a newly chosen photo, uploaded to Supabase on save
}

const MAX_IMAGE_BYTES = 5_000_000

function authorName(user) {
  const meta = user?.user_metadata || {}
  return (
    `${meta.first_name || ''} ${meta.last_initial || ''}`.trim() ||
    user?.email ||
    'Eboard Member'
  )
}

function RecipeBook() {
  const [recipes, setRecipes] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [mode, setMode] = useState('view')
  const [form, setForm] = useState(emptyForm)
  const [imageError, setImageError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dataError, setDataError] = useState('')
  const [cuisineFilter, setCuisineFilter] = useState([])
  const [tagFilter, setTagFilter] = useState([])

  // Same Supabase e-board auth the map uses.
  const { currentUser, login, logout } = useAuth()
  const isEboard = !!currentUser
  const currentUserId = currentUser?.id ?? null

  const [loginOpen, setLoginOpen] = useState(false)
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false)
  const [myRecipesOpen, setMyRecipesOpen] = useState(false)

  const selected = recipes.find((recipe) => recipe.id === selectedId) ?? null

  // Filter only offers cuisines/tags that some recipe actually uses.
  // Same rules as the map: any picked cuisine AND any picked tag.
  const usedCuisines = [...new Set(recipes.map((r) => r.cuisine).filter(Boolean))].sort()
  const usedTags = [...new Set(recipes.flatMap((r) => r.tags))].sort()
  const filterCount = cuisineFilter.length + tagFilter.length
  const visibleRecipes = recipes.filter(
    (r) =>
      (!cuisineFilter.length || cuisineFilter.includes(r.cuisine)) &&
      (!tagFilter.length || r.tags.some((t) => tagFilter.includes(t))),
  )

  function toggleIn(setList, value) {
    setList((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

  // Reload recipes from Supabase. Pass an id to select that page afterwards.
  const refresh = useCallback(
    async (nextSelectedId) => {
      try {
        const next = await getRecipes(currentUserId)
        setRecipes(next)
        setSelectedId((prev) => {
          const wanted = nextSelectedId ?? prev
          return next.some((r) => r.id === wanted) ? wanted : next[0]?.id ?? null
        })
        setDataError('')
      } catch (err) {
        setDataError(err.message)
      } finally {
        setLoading(false)
      }
    },
    [currentUserId],
  )

  // Load on first visit, and again when someone logs in/out
  // (so "your page" and the Edit/Remove buttons update).
  useEffect(() => {
    refresh()
  }, [refresh])

  function openAdd() {
    setMode('add')
    setForm(emptyForm)
    setImageError('')
  }

  function openEdit(recipe = selected) {
    if (!recipe?.owned) return
    setSelectedId(recipe.id)
    setMode('edit')
    setImageError('')
    setForm({
      title: recipe.title,
      cuisine: recipe.cuisine,
      tags: recipe.tags,
      ingredients: recipe.ingredients.join('\n'),
      instructions: recipe.instructions,
      image: recipe.image || '',
      imageFile: null,
    })
  }

  function cancelForm() {
    setMode('view')
    setForm(emptyForm)
    setImageError('')
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setImageError('')
    if (!file.type.startsWith('image/')) {
      setImageError('Please choose an image file.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('Image must be under 5MB. Try a smaller photo.')
      return
    }
    // Show a local preview now; the real upload happens when the page is saved.
    setForm((prev) => ({ ...prev, image: URL.createObjectURL(file), imageFile: file }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.title.trim() || saving) return
    if (!form.cuisine) {
      setImageError('Please choose a cuisine.')
      return
    }

    const payload = {
      title: form.title,
      // New pages are signed by whoever is logged in (same name format as the map);
      // edits keep the original author.
      author: mode === 'edit' && selected ? selected.author : authorName(currentUser),
      cuisine: form.cuisine,
      tags: form.tags,
      ingredients: form.ingredients.split('\n'),
      instructions: form.instructions,
      // Only keep an existing photo URL; local previews (blob:) aren't real URLs.
      image: form.imageFile ? '' : form.image,
      imageFile: form.imageFile,
    }

    setSaving(true)
    setImageError('')
    try {
      if (mode === 'add') {
        const newId = await addRecipe(payload)
        await refresh(newId)
      } else if (mode === 'edit' && selected) {
        await updateRecipe(selected.id, payload)
        await refresh(selected.id)
      }
      setMode('view')
      setForm(emptyForm)
    } catch (err) {
      setImageError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(recipe = selected) {
    if (!recipe?.owned) return
    if (!window.confirm(`Delete “${recipe.title}”?`)) return
    try {
      await deleteRecipe(recipe.id)
      setMode('view')
      await refresh(null)
    } catch (err) {
      setDataError(err.message)
    }
  }

  function handleLogout() {
    logout()
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
              {(usedCuisines.length > 0 || usedTags.length > 0) && (
                <details className="toc-filter">
                  <summary className="book-btn">
                    Filter{filterCount ? ` (${filterCount})` : ''} ▾
                  </summary>
                  <div className="toc-filter-menu">
                    {[
                      ['Cuisine', usedCuisines, cuisineFilter, setCuisineFilter],
                      ['Tags', usedTags, tagFilter, setTagFilter],
                    ].map(
                      ([heading, options, picked, setPicked]) =>
                        options.length > 0 && (
                          <fieldset key={heading} className="toc-filter-group">
                            <legend>{heading}</legend>
                            {options.map((option) => (
                              <label key={option}>
                                <input
                                  type="checkbox"
                                  checked={picked.includes(option)}
                                  onChange={() => toggleIn(setPicked, option)}
                                />
                                {option}
                              </label>
                            ))}
                          </fieldset>
                        ),
                    )}
                    {filterCount > 0 && (
                      <button
                        type="button"
                        className="toc-filter-clear"
                        onClick={() => {
                          setCuisineFilter([])
                          setTagFilter([])
                        }}
                      >
                        Clear filter
                      </button>
                    )}
                  </div>
                </details>
              )}
            </div>

            {loading && <p className="recipe-empty-note">Opening the book…</p>}
            {dataError && <p className="image-error">Couldn’t load recipes: {dataError}</p>}

            <ol className="toc">
              {visibleRecipes.map((recipe) => (
                <li key={recipe.id}>
                  <button
                    type="button"
                    className={`toc-item${selectedId === recipe.id && mode === 'view' ? ' is-active' : ''}`}
                    onClick={() => {
                      setSelectedId(recipe.id)
                      setMode('view')
                    }}
                  >
                    <span className="toc-text">
                      <span className="toc-title">{recipe.title}</span>
                      <span className="toc-author">
                        {recipe.author}
                        {recipe.cuisine ? ` · ${recipe.cuisine}` : ''}
                        {recipe.owned ? ' · your page' : ''}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            {filterCount > 0 && visibleRecipes.length === 0 && (
              <p className="recipe-empty-note">No recipes match that filter.</p>
            )}
          </section>

          <section className="book-page book-page-right">
            {mode === 'add' || mode === 'edit' ? (
              <form className="recipe-form" onSubmit={handleSubmit}>
                <h2>{mode === 'add' ? 'Write a New Recipe' : 'Amend Your Recipe'}</h2>

                <label>
                  Title
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                    placeholder="e.g. Sunday Roast Chicken"
                  />
                </label>

                <div className="recipe-form-field">
                  Cuisine
                  {/* Map's dropdown; the wrapper only scopes its styles (display: contents). */}
                  <div className="cookbook-guide-app">
                    <SingleSelectDropdown
                      placeholder="Select cuisine..."
                      options={cuisineSelectOptions}
                      value={form.cuisine}
                      onChange={(cuisine) => setForm((prev) => ({ ...prev, cuisine }))}
                    />
                  </div>
                </div>

                <div className="recipe-form-field">
                  Tags
                  <div className="cookbook-guide-app">
                    <TagsMultiSelect
                      options={recipeTags}
                      value={form.tags}
                      onChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
                    />
                  </div>
                </div>

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
                      onClick={() => setForm({ ...form, image: '', imageFile: null })}
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
                  <button type="submit" className="book-btn book-btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Save to the book'}
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
                    <p className="recipe-byline">
                      Written by {selected.author}
                    </p>
                  </div>
                  {isEboard && selected.owned && (
                    <div className="recipe-actions">
                      <button type="button" className="book-btn" onClick={() => openEdit()}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="book-btn book-btn-danger"
                        onClick={() => handleDelete()}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {(selected.cuisine || selected.tags.length > 0) && (
                  <div className="recipe-tags">
                    {selected.cuisine && <span className="recipe-tag">{selected.cuisine}</span>}
                    {selected.tags.map((tag) => (
                      <span key={tag} className="recipe-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

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
            ) : loading ? null : (
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

      {/* Same e-board gear menu + modals as the map. The wrapper only scopes
          cookbook-guide.css; it's display: contents so it adds no box. */}
      <div className="cookbook-guide-app">
        <EboardControls
          currentUser={currentUser}
          onOpenLogin={() => setLoginOpen(true)}
          onOpenAccountSettings={() => setAccountSettingsOpen(true)}
          onOpenMyRecs={() => setMyRecipesOpen(true)}
          myRecsLabel="📖 Your Recipes"
          onLogout={handleLogout}
          onOpenAddPlace={openAdd}
          addLabel="+ Add a page"
        />

        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={login} />

        <AccountSettingsModal
          open={accountSettingsOpen}
          onClose={() => setAccountSettingsOpen(false)}
          currentUser={currentUser}
        />

        {/* Same look as the map's "Your Recommendations" modal, listing your recipes. */}
        <Modal
          open={myRecipesOpen}
          onClose={() => setMyRecipesOpen(false)}
          title="Your Recipes"
          width="clamp(320px, 35vw, 520px)"
        >
          {recipes.filter((r) => r.owned).length === 0 ? (
            <div style={{ color: 'rgba(26,26,46,0.4)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
              No recipes yet.
            </div>
          ) : (
            recipes
              .filter((r) => r.owned)
              .map((recipe) => (
                <div className="my-rec-row" key={recipe.id}>
                  <div className="my-rec-info">
                    <div className="my-rec-name">{recipe.title}</div>
                    <div className="my-rec-meta">{recipe.author}</div>
                  </div>
                  <div className="my-rec-actions">
                    <button
                      className="btn-rec-edit"
                      title="Edit"
                      onClick={() => {
                        setMyRecipesOpen(false)
                        openEdit(recipe)
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-rec-delete"
                      title="Delete"
                      onClick={() => handleDelete(recipe)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
          )}
        </Modal>
      </div>
    </div>
  )
}

export default RecipeBook
