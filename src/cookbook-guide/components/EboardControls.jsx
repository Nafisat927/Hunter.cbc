import { useEffect, useRef, useState } from 'react';

export default function EboardControls({
  currentUser,
  onOpenLogin,
  onOpenAccountSettings,
  onOpenMyRecs,
  onLogout,
  onOpenAddPlace,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnOutsideClick = () => setMenuOpen(false);
    document.addEventListener('click', closeOnOutsideClick);
    return () => document.removeEventListener('click', closeOnOutsideClick);
  }, [menuOpen]);

  const handleTriggerClick = (e) => {
    e.stopPropagation();
    if (currentUser) {
      setMenuOpen((o) => !o);
    } else {
      onOpenLogin();
    }
  };

  return (
    <>
      <button className="eboard-trigger" title="Eboard" onClick={handleTriggerClick}>
        ⚙️
      </button>

      <div
        className={`gear-menu${menuOpen ? ' visible' : ''}`}
        ref={menuRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="gear-menu-item"
          onClick={() => {
            setMenuOpen(false);
            onOpenAccountSettings();
          }}
        >
          👤 Account Settings
        </button>
        <button
          className="gear-menu-item"
          onClick={() => {
            setMenuOpen(false);
            onOpenMyRecs();
          }}
        >
          📍 Your Recommendations
        </button>
        <button
          className="gear-menu-item danger"
          onClick={() => {
            setMenuOpen(false);
            onLogout();
          }}
        >
          ↩ Sign Out
        </button>
      </div>

      <button
        className={`add-place-btn${currentUser ? ' visible' : ''}`}
        onClick={onOpenAddPlace}
      >
        + Add Place
      </button>
    </>
  );
}
