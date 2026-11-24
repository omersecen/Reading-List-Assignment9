import express from 'express';
import cors from 'cors';
import { createBook, deleteBook, findBook, queryBooks, updateBook } from './booksStore.js';
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

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof RequestError) return res.status(error.status).json({ error: error.message });
  return next(error);
});

app.listen(port, () => {
  console.log(`Reading List API listening on http://localhost:${port}`);
});
