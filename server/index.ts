import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import notifyRouter from './routes/notify';
import uploadRouter from './routes/upload';
import councilsRouter from './routes/councils';

const app = express();
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/notify', notifyRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/councils', councilsRouter);

// Healthcheck
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use((err: any, _req: any, res: any, _next: any) => {
  const status = err?.status || 500;
  res.status(status).json({ ok: false, error: { code: 'UNHANDLED', message: err?.message || 'Server error' } });
});

const port = Number(process.env.PORT) || 5174;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
