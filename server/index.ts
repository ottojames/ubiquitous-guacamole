import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import uploadRouter from './routes/upload';
import addressRouter from './routes/address';

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing env ${key}`);
  }
}
process.env.SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'blue-notices';

export const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/upload', uploadRouter);
app.use('/api/address', addressRouter);

const PORT = Number(process.env.PORT || 5174);
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`API listening on ${PORT}`));
}

export default app;
