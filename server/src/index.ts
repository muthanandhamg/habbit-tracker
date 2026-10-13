import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import habitsRoutes from './routes/habits.js';
import tasksRoutes from './routes/tasks.js';
import wellnessRoutes from './routes/wellness.js';
import journalRoutes from './routes/journal.js';
import aiRoutes from './routes/ai.js';
import connectDB, { isDBConnected } from './config/db.js';
import { seedData } from './utils/seed.js';
import { User } from './models/User.js';
import { Logger } from './utils/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Comma-separated list of allowed browser origins. Unset = same-origin only.
const corsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: corsOrigins.length > 0 ? corsOrigins : false }));
app.use(helmet());
app.use(express.json());

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per `window` (here, per minute)
  message: { error: 'Too many requests to the AI Assistant. Please wait a minute and try again.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use('/api/auth', authRoutes);
app.use('/api/habits', habitsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/wellness', wellnessRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);

app.get('/health', (_req, res) => {
  const db = isDBConnected() ? 'up' : 'down';
  res.status(db === 'up' ? 200 : 503).json({
    status: db === 'up' ? 'ok' : 'error',
    db,
    timestamp: new Date().toISOString(),
  });
});

const startServer = async () => {
  await connectDB();

  // Auto-seed only on an empty database, and only when seed credentials are provided
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
      Logger.info('📭 Database is empty. Running auto-seed...');
      await seedData();
    } else {
      Logger.warn('📭 Database is empty. Skipping auto-seed: SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set.');
    }
  }

  app.listen(PORT, () => {
    Logger.info(`🚀 Server running on http://localhost:${PORT}`);
  });
};

startServer();

export default app;
