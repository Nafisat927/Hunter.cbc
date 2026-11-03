// Big Back Lookback data layer — reads/writes the `lookback_photos` table and
// the `lookback-photos` bucket in the site's Supabase project (see supabase/lookback.sql).
import { sbClient } from '../cookbook-guide/lib/supabaseClient'

const BUCKET = 'lookback-photos'

function uploaderName(user) {
  const meta = user?.user_metadata || {}
  return `${meta.first_name || ''} ${meta.last_initial || ''}`.trim() || 'Eboard Member'
}

// Turn a database row into the shape BigBackLookback.jsx uses.
// `owned` is true when the logged-in user uploaded this photo.
function mapRow(row, currentUserId) {
  const bucket = sbClient.storage.from(BUCKET)
  return {
    id: row.id,
    path: row.path,
    what: row.what,
    where: row.place,
    rating: row.rating,
    uploader: { name: row.uploader_name, avatarUrl: row.uploader_avatar_url || null },
    // Full-size original; no ?width= transform so nothing is compressed.
    url: bucket.getPublicUrl(row.path).data.publicUrl,
    downloadUrl: bucket.getPublicUrl(row.path, { download: row.file_name }).data.publicUrl,
    owned: !!currentUserId && row.owner === currentUserId,
  }
}

export async function getPhotos(currentUserId) {
  const { data, error } = await sbClient
    .from('lookback_photos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data.map((row) => mapRow(row, currentUserId))
}

// Uploads each original file untouched into lookback-photos/<userId>/ and adds its row.
// Returns how many made it; keeps going past a failed file.
export async function addPhotos(files, user, onProgress) {
  let added = 0
  for (const [i, file] of files.entries()) {
    onProgress?.(i + 1)
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await sbClient.storage.from(BUCKET).upload(path, file)
    if (uploadError) {
      console.error('Lookback upload error:', uploadError.message)
      continue
    }
    const { error } = await sbClient.from('lookback_photos').insert({
      path,
      file_name: file.name || `photo.${ext}`,
      uploader_name: uploaderName(user),
      uploader_avatar_url: user.user_metadata?.avatar_url || null,
    })
    if (error) {
      console.error('Lookback save error:', error.message)
      await sbClient.storage.from(BUCKET).remove([path])
      continue
    }
    added++
  }
  return added
}

export async function updatePhoto(id, { what, where, rating }) {
  const fields = { what, place: where, rating }
  Object.keys(fields).forEach((k) => fields[k] === undefined && delete fields[k])
  const { error } = await sbClient.from('lookback_photos').update(fields).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deletePhoto(photo) {
  const { error } = await sbClient.from('lookback_photos').delete().eq('id', photo.id)
  if (error) throw new Error(error.message)
  await sbClient.storage.from(BUCKET).remove([photo.path])
}

// After someone changes their name or profile picture, show it on photos they already posted.
export async function syncUploader(user) {
  const { error } = await sbClient
    .from('lookback_photos')
    .update({ uploader_name: uploaderName(user), uploader_avatar_url: user.user_metadata?.avatar_url || null })
    .eq('owner', user.id)
  if (error) throw new Error(error.message)
}
