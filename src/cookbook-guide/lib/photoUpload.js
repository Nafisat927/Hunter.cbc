import { sbClient } from './supabaseClient';

// Uploads each file to `${folderId}/<random>.<ext>` in the given bucket and
// returns the public URLs, with a width/quality hint appended for smaller payloads.
export async function uploadPhotos(bucket, folderId, files) {
  const urls = [];
  for (const file of files) {
    const ext = file.name.split('.').pop();
    const path = `${folderId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await sbClient.storage.from(bucket).upload(path, file);
    if (error) {
      console.error('Photo upload error:', error.message);
      continue;
    }
    const { data } = sbClient.storage.from(bucket).getPublicUrl(path);
    urls.push(data.publicUrl + '?width=800&quality=80');
  }
  return urls;
}
