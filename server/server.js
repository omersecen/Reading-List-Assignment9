import express from 'express';
import cors from 'cors';
import { findBook } from './booksStore.js';
import { parseBookId, RequestError } from './validate.js';

const app = express();
const port = Number(process.env.PORT || 3000);
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: [clientOrigin] }));
app.use(express.json());

app.get('/api/books/:id', async (req, res) => {
  const id = parseBookId(req.params.id);
  const book = await findBook(id);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  return res.json(book);
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof RequestError) return res.status(error.status).json({ error: error.message });
  return next(error);
});

app.listen(port, () => {
  console.log(`Reading List API listening on http://localhost:${port}`);
});
