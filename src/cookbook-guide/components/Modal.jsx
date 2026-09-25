export default function Modal({ open, onClose, title, width, children }) {
  if (!open) return null;

  return (
    <>
      <div className="e-backdrop visible" onClick={onClose} />
      <div className="e-modal visible" style={width ? { width } : undefined}>
        <div className="e-header">
          <span className="e-title">{title}</span>
          <button className="e-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="e-body">{children}</div>
      </div>
    </>
  );
}
