import { useEffect, useState } from 'react';
import { createBook, deleteBook, getStats, listBooks, replaceBook, updateBook } from './api/books.js';
import BookFilters from './components/BookFilters.jsx';
import BookForm from './components/BookForm.jsx';
import BookList from './components/BookList.jsx';
import ReadingStats from './components/ReadingStats.jsx';

const PAGE_SIZE = 20;
const initialFilters = { q: '', genre: '', read: '', sort: '', order: 'asc', page: 1 };

export default function App() {
  const [filters, setFilters] = useState(initialFilters);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);
  const [statsResult, setStatsResult] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formVersion, setFormVersion] = useState(0);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
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

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function load() {
      try {
        const stats = await getStats(signal);
        if (!signal.aborted) setStatsResult({ revision, stats, error: '' });
      } catch (error) {
        if (!signal.aborted && error.name !== 'AbortError') {
          setStatsResult({ revision, stats: null, error: error.message });
        }
      }
    }

    load();
    return () => controller.abort();
  }, [revision]);

  function refresh() {
    setRevision((current) => current + 1);
  }

  async function saveChange(action) {
    setSaving(true);
    try {
      await action();
      refresh();
    } finally {
      setSaving(false);
    }
  }

  async function saveForm(fields) {
    await saveChange(() => editing ? replaceBook(editing.id, fields) : createBook(fields));
    setEditing(null);
    setFormVersion((version) => version + 1);
  }

  async function changeBook(action) {
    setActionError('');
    try {
      await saveChange(action);
    } catch (error) {
      setActionError(error.message);
    }
  }

  function toggleRead(book) {
    const fields = book.read ? { read: false, rating: null } : { read: true };
    return changeBook(() => updateBook(book.id, fields));
  }

  async function removeBook(book) {
    if (!window.confirm(`Delete “${book.title}” from your reading list?`)) return;
    await changeBook(async () => {
      await deleteBook(book.id);
      if (editing?.id === book.id) setEditing(null);
      if (filters.page > 1 && books.length === 1) {
        setFilters((current) => ({ ...current, page: current.page - 1 }));
      }
    });
  }

  return (
    <>
      <header className="masthead">
        <div className="container"><h1>Reading List</h1></div>
      </header>
      <main className="container main-content">
        <ReadingStats
          stats={statsResult?.stats}
          error={statsResult?.revision === revision ? statsResult.error : ''}
          loading={statsResult?.revision !== revision}
        />
        <div className="workspace">
          <section className="library" aria-labelledby="library-heading">
            <h2 id="library-heading">Your books</h2>
            <BookFilters
              filters={filters}
              onChange={(name, value) => setFilters((current) => ({ ...current, [name]: value, page: 1 }))}
            />
            {actionError && <p className="notice error" role="alert">{actionError}</p>}
            <BookList
              books={books}
              loading={loading}
              error={listError}
              page={filters.page}
              pageSize={PAGE_SIZE}
              onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
              onRetry={refresh}
              onEdit={setEditing}
              onToggle={toggleRead}
              onRate={(book, rating) => changeBook(() => updateBook(book.id, { rating }))}
              onDelete={removeBook}
              saving={saving || loading}
            />
          </section>
          <BookForm
            key={`${editing?.id ?? 'new'}-${formVersion}`}
            book={editing}
            saving={saving}
            onSave={saveForm}
            onCancel={() => setEditing(null)}
          />
        </div>
      </main>
    </>
  );
}
