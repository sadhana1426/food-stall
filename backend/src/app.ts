import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(compression());
app.use(express.json());

const allowedOrigins = config.CORS_ORIGINS.split(',').map(o => o.trim());
app.use(cors({
  origin: config.CORS_ORIGINS === '*' ? '*' : allowedOrigins,
}));

// Basic request logger
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode}`);
  });
  next();
});

// Health endpoint
app.get(`/api/${config.API_VERSION}/health`, (req, res) => {
  res.json({
    success: true,
    data: { status: 'ok', time: new Date().toISOString() }
  });
});

import routes from './routes';

// Setup routers here
app.use(`/api/${config.API_VERSION}`, routes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' }});
});

app.use(errorHandler);

export default app;
