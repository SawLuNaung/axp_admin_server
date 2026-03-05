import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { errorHandler } from './middleware/error-handler';

// Route imports (handlers will be implemented in the next steps)
import plansRouter from './routes/plans.routes';
import partnersRouter from './routes/partners.routes';
import logosRouter from './routes/logos.routes';
import aboutUsRouter from './routes/about-us.routes';

const app = express();

// ─── Middleware ──────────────────────────────────────────────

// Allow requests from Angular dev server (http://localhost:4200)
app.use(cors({ origin: '*' }));

// Parse JSON request bodies
app.use(express.json());

// Serve uploaded images as static files
// e.g. GET /uploads/abc123.png → serves from uploads/abc123.png
app.use('/uploads', express.static(path.resolve(config.upload.dir)));

// ─── API Routes ─────────────────────────────────────────────

app.use('/api/plans', plansRouter);
app.use('/api/partners', partnersRouter);
app.use('/api/logos', logosRouter);
app.use('/api/about-us', aboutUsRouter);

// ─── Health check ───────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ─── Error handler (must be last) ───────────────────────────

app.use(errorHandler);

export default app;
