import { useEffect, useState } from 'react';
import { listBooks } from './api/books.js';
import BookFilters from './components/BookFilters.jsx';
import BookList from './components/BookList.jsx';

const PAGE_SIZE = 20;
const initialFilters = { q: '', genre: '', read: '', sort: '', order: 'asc', page: 1 };

export default function App() {
  const [filters, setFilters] = useState(initialFilters);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);
  const loading = result?.filters !== filters || result?.revision !== revision;
  const books = result?.filters === filters ? result.books : [];
  const listError = loading ? '' : result.error;

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function load() {
      try {
        const books = await listBooks({ ...filters, limit: PAGE_SIZE }, signal);
        if (!signal.aborted) setResult({ filters, revision, books, error: '' });
      } catch (error) {
        if (!signal.aborted && error.name !== 'AbortError') {
          setResult({ filters, revision, books: [], error: error.message });
        }
      }
    }

    load();
    return () => controller.abort();
  }, [filters, revision]);

  function refresh() {
    setRevision((current) => current + 1);
  }

  return (
    <>
      <header className="masthead">
        <div className="container"><h1>Reading List</h1></div>
      </header>
      <main className="container main-content">
        <section className="library" aria-labelledby="library-heading">
          <h2 id="library-heading">Your books</h2>
          <BookFilters
            filters={filters}
            onChange={(name, value) => setFilters((current) => ({ ...current, [name]: value, page: 1 }))}
          />
          <BookList
            books={books}
            loading={loading}
            error={listError}
            page={filters.page}
            pageSize={PAGE_SIZE}
            onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
            onRetry={refresh}
          />
        </section>
      </main>
    </>
  );
}
