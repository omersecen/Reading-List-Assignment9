import { genres } from '../genres.js';

export default function BookList({ books, loading, error, page, pageSize, onPageChange, onRetry, onEdit, onToggle, onRate, onDelete, saving }) {
  return (
    <>
      {loading && <p className="notice" role="status">Loading books…</p>}
      {error && (
        <div className="notice error" role="alert">
          <p>{error}</p>
          <button type="button" className="button" onClick={onRetry}>Retry</button>
        </div>
      )}
      {!loading && !error && books.length === 0 && (
        <p className="notice" role="status">No books match this selection.</p>
      )}
      {books.length > 0 && (
        <ul className="books" aria-label="Books">
          {books.map((book) => (
            <li className="book" key={book.id}>
              <div className="book-details">
                <h3 className="book-title">{book.title}</h3>
                <p className="book-meta">{book.author} · {book.year} · {genres[book.genre]}</p>
              </div>
              <span className={book.read ? 'book-status is-read' : 'book-status'}>
                {book.read ? 'Read' : 'Unread'}
              </span>
              <div className="book-actions">
                <select
                  aria-label={`Rating for ${book.title}`}
                  value={book.rating ?? ''}
                  disabled={saving || !book.read}
                  onChange={(event) => onRate(book, event.target.value === '' ? null : Number(event.target.value))}
                >
                  <option value="">Unrated</option>
                  {[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}
                </select>
                <button type="button" className="button" disabled={saving} onClick={() => onToggle(book)} aria-label={`Mark ${book.title} ${book.read ? 'unread' : 'read'}`}>
                  Mark {book.read ? 'unread' : 'read'}
                </button>
                <button type="button" className="button" disabled={saving} onClick={() => onEdit(book)} aria-label={`Edit ${book.title}`}>Edit</button>
                <button type="button" className="button danger" disabled={saving} onClick={() => onDelete(book)} aria-label={`Delete ${book.title}`}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {(page > 1 || books.length === pageSize) && (
        <nav className="pager" aria-label="Book pages">
          <button type="button" className="button" disabled={page === 1 || loading} onClick={() => onPageChange(page - 1)}>Previous</button>
          <span>Page {page}</span>
          <button type="button" className="button" disabled={books.length < pageSize || loading} onClick={() => onPageChange(page + 1)}>Next</button>
        </nav>
      )}
    </>
  );
}
