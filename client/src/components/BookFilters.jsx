import { genres } from '../genres.js';

export default function BookFilters({ filters, onChange }) {
  return (
    <div className="filter-panel" aria-label="Book filters">
      <label className="search-control">
        Search
        <input
          type="search"
          placeholder="Title or author"
          value={filters.q}
          onChange={(event) => onChange('q', event.target.value)}
        />
      </label>
      <label>
        Genre
        <select value={filters.genre} onChange={(event) => onChange('genre', event.target.value)}>
          <option value="">All genres</option>
          {Object.entries(genres).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label>
        Status
        <select value={filters.read} onChange={(event) => onChange('read', event.target.value)}>
          <option value="">All books</option>
          <option value="true">Read</option>
          <option value="false">Unread</option>
        </select>
      </label>
      <label>
        Sort by
        <select value={filters.sort} onChange={(event) => onChange('sort', event.target.value)}>
          <option value="">Date added</option>
          <option value="title">Title</option>
          <option value="author">Author</option>
          <option value="year">Year</option>
          <option value="rating">Rating</option>
        </select>
      </label>
      <label>
        Order
        <select value={filters.order} onChange={(event) => onChange('order', event.target.value)}>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </label>
    </div>
  );
}
