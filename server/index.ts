import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import uploadRouter from './routes/upload';
import addressRouter from './routes/address';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/upload', uploadRouter);
app.use('/api/address', addressRouter);

const PORT = Number(process.env.PORT || 5174);

/**
 * Only enforce env + start the HTTP listener when not under test.
 * Vitest imports `app` for SuperTest; we shouldn’t throw on import.
 */
if (process.env.NODE_ENV !== 'test') {
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const;
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing env ${key}`);
    }
  }
  process.env.SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'blue-notices';

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on ${PORT}`);
  });
}

export default app;
