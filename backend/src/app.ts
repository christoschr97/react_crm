import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import postsRouter from './routes/posts';
import categoriesRouter from './routes/categories';
import newslettersRouter from './routes/newsletters';
import subscribersRouter from './routes/subscribers';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/newsletters', newslettersRouter);
app.use('/api/subscribers', subscribersRouter);

export default app;
