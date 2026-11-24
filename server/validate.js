export const GENRES = ['fiction', 'non-fiction', 'science', 'history', 'fantasy', 'other'];

export class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function positiveInteger(value) {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

export function parseBookId(value) {
  const id = positiveInteger(value);
  if (id === null) throw new RequestError(400, 'Book id must be a positive integer');
  return id;
}

export function validateBodyObject(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new RequestError(400, 'Send a JSON object with Content-Type: application/json');
  }
  return body;
}

function requiredText(value, field) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (trimmed.length < 1 || trimmed.length > 100) {
    throw new RequestError(400, `${field} must contain 1 to 100 characters after trimming`);
  }
  return trimmed;
}

export function validateBook(body) {
  const { title, author, year, genre, read = false, rating = null } = validateBodyObject(body);
  const trimmedTitle = requiredText(title, 'title');
  const trimmedAuthor = requiredText(author, 'author');
  const currentYear = new Date().getFullYear();

  if (!Number.isInteger(year) || year < 1000 || year > currentYear) {
    throw new RequestError(400, `year must be an integer from 1000 to ${currentYear}`);
  }
  if (!GENRES.includes(genre)) {
    throw new RequestError(400, `genre must be one of: ${GENRES.join(', ')}`);
  }
  if (typeof read !== 'boolean') throw new RequestError(400, 'read must be true or false');
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    throw new RequestError(400, 'rating must be null or an integer from 1 to 5');
  }
  if (rating !== null && !read) {
    throw new RequestError(400, 'Set read to true before assigning a rating');
  }

  return { title: trimmedTitle, author: trimmedAuthor, year, genre, read, rating };
}

const SORT_FIELDS = ['title', 'author', 'year', 'rating'];
const QUERY_FIELDS = ['genre', 'read', 'q', 'sort', 'order', 'limit', 'page'];

function queryInteger(query, name, fallback, maximum) {
  if (query[name] === undefined) return fallback;
  const value = positiveInteger(query[name]);
  if (value === null || value > maximum) {
    const range = name === 'limit' ? 'an integer from 1 to 50' : 'a positive integer';
    throw new RequestError(400, `${name} must be ${range}`);
  }
  return value;
}

export function validateBookQuery(query) {
  for (const [name, value] of Object.entries(query)) {
    if (typeof value !== 'string') {
      throw new RequestError(400, `Send ${name} only once`);
    }
    if (!QUERY_FIELDS.includes(name)) {
      throw new RequestError(400, `Unknown query parameter: ${name}`);
    }
  }

  const { genre, read, q = '', sort, order = 'asc' } = query;
  if (genre !== undefined && !GENRES.includes(genre)) {
    throw new RequestError(400, `genre must be one of: ${GENRES.join(', ')}`);
  }
  if (read !== undefined && read !== 'true' && read !== 'false') {
    throw new RequestError(400, 'read must be true or false');
  }
  if (sort !== undefined && !SORT_FIELDS.includes(sort)) {
    throw new RequestError(400, `sort must be one of: ${SORT_FIELDS.join(', ')}`);
  }
  if (order !== 'asc' && order !== 'desc') {
    throw new RequestError(400, 'order must be asc or desc');
  }

  return {
    genre,
    read: read === undefined ? undefined : read === 'true',
    q: q.toLowerCase(),
    sort: sort ?? 'id',
    order,
    limit: queryInteger(query, 'limit', 50, 50),
    page: queryInteger(query, 'page', 1, Number.MAX_SAFE_INTEGER),
  };
}
