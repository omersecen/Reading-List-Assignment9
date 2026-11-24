import express from 'express';
import cors from 'cors';

const app = express();
const port = Number(process.env.PORT || 3000);
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: [clientOrigin] }));
app.use(express.json());

app.listen(port, () => {
  console.log(`Reading List API listening on http://localhost:${port}`);
});
