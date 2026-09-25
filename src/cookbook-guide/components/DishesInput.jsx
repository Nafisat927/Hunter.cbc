import { useRef, useState } from 'react';

export default function DishesInput({ value, onChange }) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  const addDish = (dish) => {
    const trimmed = dish.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setDraft('');
  };

  const removeDish = (dish) => onChange(value.filter((d) => d !== dish));

  const handleKeyDown = (e) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      addDish(draft);
    } else if (e.key === 'Backspace' && draft === '' && value.length) {
      removeDish(value[value.length - 1]);
    }
  };

  return (
    <div className="dishes-input-area" onClick={() => inputRef.current?.focus()}>
      {value.map((dish) => (
        <span key={dish} className="tags-ms-pill">
          {dish}{' '}
          <span
            onClick={(e) => {
              e.stopPropagation();
              removeDish(dish);
            }}
          >
            ✕
          </span>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        placeholder="Must-try dishes (press comma or Enter to add)"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
