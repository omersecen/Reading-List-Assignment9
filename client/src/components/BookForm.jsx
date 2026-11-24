import { useEffect, useRef, useState } from 'react';
import { genres } from '../genres.js';

const blankBook = { title: '', author: '', year: '', genre: '', read: false, rating: '' };

export default function BookForm({ book, saving, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => book ? { ...book, rating: book.rating ?? '' } : blankBook);
  const [error, setError] = useState('');
  const titleInput = useRef(null);

  useEffect(() => {
    if (book) titleInput.current.focus();
  }, [book]);

  function change(name, value) {
    setDraft((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    const { title, author, year, genre, read, rating } = draft;
    try {
      await onSave({ title, author, year: Number(year), genre, read, rating: rating === '' ? null : Number(rating) });
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <section id="book-form" className="form-panel" aria-labelledby="form-heading">
      <h2 id="form-heading">{book ? 'Edit book' : 'Add a book'}</h2>
      <form onSubmit={submit}>
        <fieldset disabled={saving}>
          <label>
            Title
            <input ref={titleInput} value={draft.title} onChange={(event) => change('title', event.target.value)} required maxLength={100} />
          </label>
          <label>
            Author
            <input value={draft.author} onChange={(event) => change('author', event.target.value)} required maxLength={100} />
          </label>
          <div className="form-grid">
            <label>
              Year
              <input type="number" value={draft.year} onChange={(event) => change('year', event.target.value)} min={1000} max={new Date().getFullYear()} step={1} required />
            </label>
            <label>
              Genre
              <select value={draft.genre} onChange={(event) => change('genre', event.target.value)} required>
                <option value="" disabled>Choose genre</option>
                {Object.entries(genres).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>
          <label className="check-field">
            <input
              type="checkbox"
              checked={draft.read}
              onChange={(event) => {
                const read = event.target.checked;
                setDraft((current) => ({ ...current, read, rating: read ? current.rating : '' }));
              }}
            />
            Already read
          </label>
          <label>
            Rating
            <select value={draft.rating} onChange={(event) => change('rating', event.target.value)} disabled={!draft.read}>
              <option value="">No rating</option>
              {[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}
            </select>
          </label>
          {error && <p className="error form-error" role="alert">{error}</p>}
          <div className="form-actions">
            <button type="submit" className="button primary">{saving ? 'Saving…' : book ? 'Save changes' : 'Add book'}</button>
            {book && <button type="button" className="button" onClick={onCancel}>Cancel</button>}
          </div>
        </fieldset>
      </form>
    </section>
  );
}
