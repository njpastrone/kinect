import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import connectDB from './config/database';
import authRoutes from './api/routes/auth.routes';
import contactsRoutes from './api/routes/contacts.routes';
import listsRoutes from './api/routes/lists.routes';
import notificationsRoutes from './api/routes/notifications.routes';
import devRoutes from './api/routes/dev.routes';
import { errorHandler, notFound } from './api/middleware/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

connectDB();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
});

app.use('/api/', limiter);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/lists', listsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Dev routes only in development
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/dev', devRoutes);
}

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.warn(`Server running on port ${PORT}`);
});
