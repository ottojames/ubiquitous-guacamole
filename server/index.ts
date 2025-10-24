import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import uploadRouter from './routes/upload';
import addressRouter from './routes/address';
import noticesRouter from './routes/notices';
import aiSummaryRouter from './routes/ai-summary';
import publishRouter from './routes/publish';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/upload', uploadRouter);
app.use('/api', addressRouter);
app.use('/api', noticesRouter);
app.use('/api/ai-summary', aiSummaryRouter);
app.use('/api', publishRouter);

const PORT = Number(process.env.PORT || 5174);

if (process.env.NODE_ENV !== 'test') {
  const listener = app.listen(PORT, () => {
    console.log(`API listening on ${PORT}`);
  });
  listener.on('error', (err: any) => {
    if (err?.code === 'EADDRINUSE') {
      console.error('Port 5174 in use. Kill old process: kill -9 $(lsof -ti tcp:5174)');
      process.exit(1);
    }
    throw err;
  });
}

export default app;
