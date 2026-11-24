import { RequestError } from './validate.js';

const seedBooks = [
  { id: 1, title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', year: 1969, genre: 'fiction', read: true, rating: 5 },
  { id: 2, title: 'The Hobbit', author: 'J.R.R. Tolkien', year: 1937, genre: 'fantasy', read: true, rating: 4 },
  { id: 3, title: 'A Brief History of Time', author: 'Stephen Hawking', year: 1988, genre: 'science', read: false, rating: null },
  { id: 4, title: 'The Diary of a Young Girl', author: 'Anne Frank', year: 1947, genre: 'history', read: true, rating: 5 },
  { id: 5, title: 'The Creative Act', author: 'Rick Rubin', year: 2023, genre: 'non-fiction', read: false, rating: null },
  { id: 6, title: 'A Wizard of Earthsea', author: 'Ursula K. Le Guin', year: 1968, genre: 'fantasy', read: true, rating: null },
];

let books = [...seedBooks];
let nextId = seedBooks.length + 1;

function waitForStore() {
  return new Promise((resolve) => setTimeout(resolve, 30));
}

export async function listBooks() {
  await waitForStore();
  return books;
}

export async function findBook(id) {
  await waitForStore();
  return books.find((book) => book.id === id);
}

function compareBooks(first, second, sort, order) {
  const a = first[sort];
  const b = second[sort];
  if (a === b) return first.id - second.id;
  if (a === null) return 1;
  if (b === null) return -1;
  const difference = typeof a === 'string'
    ? a.localeCompare(b, 'en', { sensitivity: 'base' })
    : a - b;
  if (difference === 0) return first.id - second.id;
  return order === 'desc' ? -difference : difference;
}

export async function queryBooks({ genre, read, q, sort, order, limit, page }) {
  const all = await listBooks();
  const matches = all.filter((book) => (
    (genre === undefined || book.genre === genre)
    && (read === undefined || book.read === read)
    && (book.title.toLowerCase().includes(q) || book.author.toLowerCase().includes(q))
  ));
  matches.sort((first, second) => compareBooks(first, second, sort, order));
  const offset = (page - 1) * limit;
  return matches.slice(offset, offset + limit);
}

function checkDuplicate(candidate, currentId) {
  const title = candidate.title.toLowerCase();
  const author = candidate.author.toLowerCase();
  const duplicate = books.some((book) => (
    book.id !== currentId
    && book.title.toLowerCase() === title
    && book.author.toLowerCase() === author
  ));
  if (duplicate) throw new RequestError(409, 'A book with this title and author already exists');
}

export async function createBook(fields) {
  await waitForStore();
  checkDuplicate(fields);
  const book = { id: nextId, ...fields };
  nextId += 1;
  books = [...books, book];
  return book;
}

export async function updateBook(id, buildFields) {
  await waitForStore();
  const existing = books.find((book) => book.id === id);
  if (!existing) return undefined;
  const fields = buildFields(existing);
  checkDuplicate(fields, id);
  const book = { id, ...fields };
  books = books.map((item) => (item.id === id ? book : item));
  return book;
}

export async function deleteBook(id) {
  await waitForStore();
  const remaining = books.filter((book) => book.id !== id);
  if (remaining.length === books.length) return false;
  books = remaining;
  return true;
}

export async function getStats() {
  const all = await listBooks();
  const read = all.filter((book) => book.read).length;
  const ratings = all.filter((book) => book.rating !== null).map((book) => book.rating);
  const byGenre = {};
  for (const book of all) {
    byGenre[book.genre] = (byGenre[book.genre] ?? 0) + 1;
  }
  const averageRating = ratings.length === 0
    ? null
    : Number((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1));

  return { total: all.length, read, unread: all.length - read, averageRating, byGenre };
}
