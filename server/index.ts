import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { initSentry, sentryErrorHandler } from './lib/sentry';
import { startAllEmailJobs } from './jobs/emailJobs';

import uploadRouter from './routes/upload';
import addressRouter from './routes/address';
import noticesRouter from './routes/notices';
import aiSummaryRouter from './routes/ai-summary';
import publishRouter from './routes/publish';
import representationsRouter from './routes/representations';
import teamRouter from './routes/team';
import settingsRouter from './routes/settings';
import templatesRouter from './routes/templates';
import firmRouter from './routes/firm';
import draftsRouter from './routes/drafts';
import councilsRouter from './routes/councils';
import councilRouter from './routes/council';
import analyticsRouter from './routes/analytics';
import stripeRouter from './routes/stripe';
import subscriptionsRouter from './routes/subscriptions';
import representationUploadsRouter from './routes/representationUploads';
import certificatesRouter from './routes/certificates';
import evidencePacksRouter from './routes/evidencePacks';
import versionsRouter from './routes/versions';
import firmSubscriptionsRouter from './routes/firmSubscriptions';
import testCertificateRouter from './routes/test-certificate';
import testEmailRouter from './routes/test-email';
import applyMigrationRouter from './routes/apply-migration';
import blueNoticesRouter from './routes/blueNotices';
import registrationRouter from './routes/registration';
import workflowRouter from './routes/workflow';
import firmDepartmentsRouter from './routes/firm-departments';
import adminAuthRouter from './routes/admin/auth';
import adminAccountsRouter from './routes/admin/accounts';
import adminAuditRouter from './routes/admin/audit';
import { requireAdmin, enforceIPAllowlist } from './middleware/adminAuth';

export const app = express();

// Initialize Sentry BEFORE other middleware
initSentry(app);

// Start email cron jobs in production
if (process.env.NODE_ENV === 'production') {
  startAllEmailJobs();
}

app.use(cors());
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/upload', uploadRouter);
app.use('/api', addressRouter);
app.use('/api', noticesRouter);
app.use('/api/ai-summary', aiSummaryRouter);
app.use('/api', publishRouter);
app.use('/api', representationsRouter);
app.use('/api', teamRouter);
app.use('/api', settingsRouter);
app.use('/api', templatesRouter);
app.use('/api/firm', firmRouter);
app.use('/api/drafts', draftsRouter);
app.use('/api/councils', councilsRouter);
app.use('/api/council', councilRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/stripe', stripeRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/representation-uploads', representationUploadsRouter);
app.use('/api/certificates', certificatesRouter);
app.use('/api/evidence-packs', evidencePacksRouter);
app.use('/api/notices', versionsRouter);
app.use('/api/firm-subscriptions', firmSubscriptionsRouter);
app.use('/api/blue-notices', blueNoticesRouter);
app.use('/api/registration', registrationRouter);
app.use('/api/workflow', workflowRouter);
app.use('/api/firm/departments', firmDepartmentsRouter);
app.use('/api', testCertificateRouter);
app.use('/api', testEmailRouter);
app.use('/api/migration', applyMigrationRouter);

// TEMPORARY: Comment out conflicting admin auth routes during migration
// TODO: Re-enable after Phase 5 Authentication Unification is complete
// app.use('/api/admin/auth', adminAuthRouter);

// Protected admin routes - also commented during migration
// app.use('/api/admin/accounts', requireAdmin, enforceIPAllowlist, adminAccountsRouter);
// app.use('/api/admin/audit', requireAdmin, enforceIPAllowlist, adminAuditRouter);

// Sentry error handler MUST be after routes but BEFORE other error handlers
app.use(sentryErrorHandler());

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
