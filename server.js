import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import templateRoutes from './routes/templateRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { UPLOADS_DIR } from './middleware/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 5001;
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bookmockup';

const defaultOrigins = [
  'https://bookmockup-seven.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
];

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : defaultOrigins;

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads/templates', express.static(UPLOADS_DIR));
app.use('/api/auth', authRoutes);
app.use('/api/templates', templateRoutes);

app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Book Mockup API',
    health: '/api/health',
    templates: '/api/templates',
  });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Book Mockup API is running',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Book Mockup API listening on http://localhost:${PORT}`);
  console.log(`CORS origins: ${allowedOrigins.join(', ')}`);
  console.log(`Uploads folder: ${UPLOADS_DIR}`);

  mongoose
    .connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    })
    .then(() => console.log('MongoDB connected'))
    .catch((error) => {
      console.error('MongoDB ulanmadi:', error.message);
    });
});
