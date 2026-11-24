import { genres } from '../genres.js';

export default function BookList({ books, loading, error, page, pageSize, onPageChange, onRetry }) {
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
              {book.rating !== null && <p>{book.rating} / 5</p>}
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
