import { useEffect, useState } from 'react';
import Modal from './Modal';
import { sbClient } from '../lib/supabaseClient';

export default function AccountSettingsModal({ open, onClose, currentUser, onSaved }) {
  const [firstName, setFirstName] = useState('');
  const [lastInitial, setLastInitial] = useState('');
  const [role, setRole] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [removeFlag, setRemoveFlag] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const meta = currentUser?.user_metadata || {};
      setFirstName(meta.first_name || '');
      setLastInitial(meta.last_initial || '');
      setRole(meta.role || '');
      setAvatarUrl(meta.avatar_url || null);
      setPendingFile(null);
      setRemoveFlag(false);
      setError('');
    }
  }, [open, currentUser]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPendingFile(file);
    setRemoveFlag(false);
    setAvatarUrl(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleRemove = () => {
    setPendingFile(null);
    setRemoveFlag(true);
    setAvatarUrl(null);
  };

  const handleSave = async () => {
    setError('');
    let finalAvatarUrl = currentUser?.user_metadata?.avatar_url || null;

    setSaving(true);

    if (pendingFile) {
      const ext = pendingFile.name.split('.').pop();
      // uploadPhotos writes to `${folderId}/<random>.<ext>`; passing a fixed
      // name keeps this an upsert-style overwrite like the original file did.
      const path = `${currentUser.id}/avatar.${ext}`;
      const { error: uploadErr } = await sbClient.storage
        .from('avatars')
        .upload(path, pendingFile, { upsert: true });
      if (uploadErr) {
        setError(uploadErr.message);
        setSaving(false);
        return;
      }
      const { data } = sbClient.storage.from('avatars').getPublicUrl(path);
      finalAvatarUrl = data.publicUrl + '?width=200&height=200&quality=80&t=' + Date.now();
    } else if (removeFlag) {
      finalAvatarUrl = null;
    }

    const { error: updateErr } = await sbClient.auth.updateUser({
      data: {
        first_name: firstName.trim(),
        last_initial: lastInitial.trim(),
        role: role.trim(),
        avatar_url: finalAvatarUrl,
      },
    });

    setSaving(false);

    if (updateErr) {
      setError(updateErr.message);
      return;
    }

    await onSaved?.();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Account Settings" width="clamp(260px, 22vw, 360px)">
      <div className="e-section-label">Profile picture</div>
      <div className="pfp-upload-wrap">
        <div className="pfp-preview">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          ) : (
            <span>{(firstName || '?')[0].toUpperCase()}</span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            style={{ display: 'none' }}
            id="pfpFileInput"
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="e-btn-secondary"
            style={{ fontSize: '0.82rem', padding: '8px 16px' }}
            onClick={() => document.getElementById('pfpFileInput').click()}
          >
            Upload photo
          </button>
          {avatarUrl && (
            <button
              type="button"
              className="e-btn-secondary"
              style={{ fontSize: '0.82rem', padding: '8px 16px', color: 'var(--coral)' }}
              onClick={handleRemove}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="e-section-label">Display name</div>
      <input
        type="text"
        className="e-input"
        placeholder="First name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      />
      <input
        type="text"
        className="e-input"
        placeholder="Last initial"
        maxLength={1}
        value={lastInitial}
        onChange={(e) => setLastInitial(e.target.value)}
      />

      <div className="e-section-label">Role</div>
      <input
        type="text"
        className="e-input"
        placeholder="e.g. President, Treasurer..."
        value={role}
        onChange={(e) => setRole(e.target.value)}
      />

      <div className="e-error">{error}</div>
      <button className="e-btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>
    </Modal>
  );
}
