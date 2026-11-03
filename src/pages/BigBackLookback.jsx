import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { addPhotos, deletePhoto, getPhotos, syncUploader, updatePhoto } from '../data/lookback'
import { useAuth } from '../cookbook-guide/hooks/useAuth'
import { sbClient } from '../cookbook-guide/lib/supabaseClient'
import EboardControls from '../cookbook-guide/components/EboardControls'
import LoginModal from '../cookbook-guide/components/LoginModal'
import AccountSettingsModal from '../cookbook-guide/components/AccountSettingsModal'
import '../cookbook-guide/fonts.css'
import '../cookbook-guide/cookbook-guide.css'
import './BigBackLookback.css'

const stars = (n) => (n ? '★'.repeat(n) + '☆'.repeat(5 - n) : 'Not rated')

function Uploader({ uploader }) {
  return (
    <div className="lookback-uploader">
      <span className="lookback-pfp">
        {uploader.avatarUrl ? (
          <img src={uploader.avatarUrl} alt="" onError={(e) => (e.currentTarget.hidden = true)} />
        ) : (
          uploader.name[0]?.toUpperCase()
        )}
      </span>
      <span>{uploader.name}</span>
    </div>
  )
}

function PhotoCard({ photo, onSave, onDelete }) {
  // Text boxes save when you leave them, only if something changed.
  const saveText = (key) => (e) => {
    const value = e.target.value.trim()
    if (value !== photo[key]) onSave(photo.id, { [key]: value })
  }

  return (
    <article className="lookback-card">
      <a href={photo.url} target="_blank" rel="noopener noreferrer" className="lookback-photo">
        <img
          src={photo.url}
          alt={photo.what || 'Photo'}
          loading="lazy"
          // HEIC and other formats some browsers can't show: keep the card, hide the broken icon.
          onError={(e) => e.currentTarget.parentElement.classList.add('no-preview')}
        />
      </a>

      {photo.owned ? (
        <>
          <label>
            What
            <input defaultValue={photo.what} maxLength={80} onBlur={saveText('what')} />
          </label>
          <label>
            Where
            <input defaultValue={photo.where} maxLength={80} onBlur={saveText('where')} />
          </label>
          <label>
            Rating out of 5
            <select value={photo.rating} onChange={(e) => onSave(photo.id, { rating: +e.target.value })}>
              <option value={0}>Not rated</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {stars(n)} {n}/5
                </option>
              ))}
            </select>
          </label>
        </>
      ) : (
        <dl>
          <dt>What</dt>
          <dd>{photo.what || '—'}</dd>
          <dt>Where</dt>
          <dd>{photo.where || '—'}</dd>
          <dt>Rating out of 5</dt>
          <dd>
            <span className="lookback-stars">{stars(photo.rating)}</span>
            {photo.rating ? ` ${photo.rating}/5` : ''}
          </dd>
        </dl>
      )}

      <Uploader uploader={photo.uploader} />

      <div className="lookback-actions">
        <a href={photo.downloadUrl} className="lookback-btn">
          Download
        </a>
        {photo.owned && (
          <button type="button" className="lookback-btn lookback-btn-danger" onClick={() => onDelete(photo)}>
            Delete
          </button>
        )}
      </div>
    </article>
  )
}

function BigBackLookback() {
  const fileRef = useRef(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')

  // Same Supabase e-board auth the map and recipe book use.
  const { currentUser, login, logout } = useAuth()
  const currentUserId = currentUser?.id ?? null
  const [loginOpen, setLoginOpen] = useState(false)
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false)

  const refresh = useCallback(async () => {
    try {
      setPhotos(await getPhotos(currentUserId))
      setStatus('')
    } catch (err) {
      setStatus(`Couldn’t load photos: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [currentUserId])

  // Load on first visit, and again when someone logs in/out (so Edit/Delete update).
  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleFiles(event) {
    const files = [...event.target.files]
    event.target.value = ''
    if (!files.length) return
    const added = await addPhotos(files, currentUser, (i) => setStatus(`Uploading ${i} of ${files.length}…`))
    await refresh()
    const failed = files.length - added
    setStatus(
      failed
        ? `Added ${added}. ${failed} couldn’t upload (over 50 MB, or storage is full).`
        : `Added ${added} photo${added === 1 ? '' : 's'}.`,
    )
  }

  async function handleSave(id, fields) {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, ...fields } : p)))
    try {
      await updatePhoto(id, fields)
    } catch (err) {
      setStatus(`Couldn’t save that change: ${err.message}`)
    }
  }

  async function handleDelete(photo) {
    if (!window.confirm('Delete this photo?')) return
    try {
      await deletePhoto(photo)
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
    } catch (err) {
      setStatus(`Couldn’t delete: ${err.message}`)
    }
  }

  // New name or profile picture: update it on photos already posted.
  async function handleAccountSaved() {
    const { data } = await sbClient.auth.getUser()
    if (data.user) await syncUploader(data.user).catch(() => {})
    await refresh()
  }

  return (
    <div className="lookback-page">
      <header className="lookback-header">
        <Link to="/" className="lookback-back">
          ← Back to Cookbook Club
        </Link>
        <h1 className="lookback-title">The Big Back Lookback</h1>
      </header>

      <p className="lookback-status" aria-live="polite">
        {loading ? 'Hanging up the photos…' : status}
      </p>

      {!loading && photos.length === 0 ? (
        <p className="lookback-empty">
          The board is empty.{' '}
          {currentUser ? 'Tap “+ Add photos” to hang the first ones.' : 'E-board members can log in with the ⚙️ button to add photos.'}
        </p>
      ) : (
        <div className="lookback-grid">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} onSave={handleSave} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleFiles} />

      {/* Same e-board gear menu + modals as the map. The wrapper only scopes
          cookbook-guide.css; it's display: contents so it adds no box. */}
      <div className="cookbook-guide-app">
        <EboardControls
          currentUser={currentUser}
          onOpenLogin={() => setLoginOpen(true)}
          onOpenAccountSettings={() => setAccountSettingsOpen(true)}
          onLogout={logout}
          onOpenAddPlace={() => fileRef.current?.click()}
          addLabel="+ Add photos"
        />
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={login} />
        <AccountSettingsModal
          open={accountSettingsOpen}
          onClose={() => setAccountSettingsOpen(false)}
          currentUser={currentUser}
          onSaved={handleAccountSaved}
        />
      </div>
    </div>
  )
}

export default BigBackLookback
