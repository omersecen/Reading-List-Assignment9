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
