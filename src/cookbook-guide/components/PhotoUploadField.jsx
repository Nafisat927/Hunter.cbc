import { useRef } from 'react';

export default function PhotoUploadField({
  existingUrls,
  pendingFiles,
  onAddFiles,
  onRemoveExisting,
  onRemovePending,
}) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const files = Array.from(e.target.files);
    onAddFiles(files);
    e.target.value = ''; // allow re-selecting the same file name later
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
      <button
        type="button"
        className="photo-upload-btn"
        onClick={() => inputRef.current?.click()}
      >
        📷 Add photos
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleChange}
      />

      {existingUrls.map((url) => (
        <div className="photo-preview-item" key={url}>
          <img src={url} alt="" />
          <button
            type="button"
            className="photo-preview-remove"
            onClick={() => onRemoveExisting(url)}
          >
            ✕
          </button>
        </div>
      ))}

      {pendingFiles.map((file, i) => (
        <div className="photo-preview-item" key={file.name + i}>
          <img src={URL.createObjectURL(file)} alt={file.name} />
          <button
            type="button"
            className="photo-preview-remove"
            onClick={() => onRemovePending(i)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
