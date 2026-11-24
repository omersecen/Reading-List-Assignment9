import { genres } from '../genres.js';

export default function ReadingStats({ stats, loading, error }) {
  return (
    <section className="statistics" aria-labelledby="statistics-heading" aria-busy={loading}>
      <h2 id="statistics-heading">Reading progress</h2>
      {loading && !stats && <p className="notice" role="status">Loading statistics…</p>}
      {error && <p className="notice error" role="alert">Statistics could not be loaded. {error}</p>}
      {stats && (
        <>
          <dl className="stats-grid">
            <div><dt>Books</dt><dd>{stats.total}</dd></div>
            <div><dt>Read</dt><dd>{stats.read}</dd></div>
            <div><dt>Unread</dt><dd>{stats.unread}</dd></div>
            <div><dt>Average rating</dt><dd>{stats.averageRating === null ? '—' : `${stats.averageRating.toFixed(1)} / 5`}</dd></div>
          </dl>
          {Object.keys(stats.byGenre).length > 0 && (
            <ul className="genre-counts" aria-label="Books by genre">
              {Object.entries(stats.byGenre).map(([genre, count]) => (
                <li key={genre}>{genres[genre]} <strong>{count}</strong></li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
