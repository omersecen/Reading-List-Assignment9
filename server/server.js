import express from 'express';
import cors from 'cors';
import { createBook, deleteBook, findBook, getStats, queryBooks, updateBook } from './booksStore.js';
import { parseBookId, RequestError, validateBook, validateBookQuery, validateBodyObject } from './validate.js';

const app = express();
const port = Number(process.env.PORT || 3000);
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: [clientOrigin] }));
app.use(express.json());

app.get('/api/books', async (req, res) => {
  const query = validateBookQuery(req.query);
  return res.json(await queryBooks(query));
});

app.get('/api/books/:id', async (req, res) => {
  const id = parseBookId(req.params.id);
  const book = await findBook(id);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  return res.json(book);
});

app.post('/api/books', async (req, res) => {
  const book = await createBook(validateBook(req.body));
  return res.location(`/api/books/${book.id}`).status(201).json(book);
});

app.put('/api/books/:id', async (req, res) => {
  const id = parseBookId(req.params.id);
  const book = await updateBook(id, () => validateBook(req.body));
  if (!book) return res.status(404).json({ error: 'Book not found' });
  return res.json(book);
});

app.patch('/api/books/:id', async (req, res) => {
  const id = parseBookId(req.params.id);
  const book = await updateBook(id, (existing) => (
    validateBook({ ...existing, ...validateBodyObject(req.body) })
  ));
  if (!book) return res.status(404).json({ error: 'Book not found' });
  return res.json(book);
});

app.delete('/api/books/:id', async (req, res) => {
  const id = parseBookId(req.params.id);
  if (!await deleteBook(id)) return res.status(404).json({ error: 'Book not found' });
  return res.status(204).end();
});

app.get('/api/stats', async (req, res) => res.json(await getStats()));

app.get('/api/crash', async () => {
  throw new Error('Intentional async error for the README experiment');
});

app.use('/api', async (req, res) => res.status(404).json({ error: 'Not found' }));

app.use((error, req, res, next) => {
  if (error instanceof RequestError) {
    return res.status(error.status).json({ error: error.message });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON: check the request body' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large' });
  }
  if (error.type === 'charset.unsupported' || error.type === 'encoding.unsupported') {
    return res.status(415).json({ error: 'Unsupported request body encoding' });
  }
  if (error instanceof URIError && error.status === 400) {
    return res.status(400).json({ error: 'Malformed URL encoding' });
  }
  console.error(error);
  if (res.headersSent) return next(error);
  return res.status(500).json({ error: 'Something went wrong' });
});

app.listen(port, () => {
  console.log(`Reading List API listening on http://localhost:${port}`);
});
