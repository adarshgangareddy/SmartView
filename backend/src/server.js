import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { standardLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { mqttService } from './mqtt/mqttClient.js';
import { mockDeviceSimulator } from './services/mockDeviceService.js';

// Import Route Handlers
import authRoutes from './routes/authRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import commandRoutes from './routes/commandRoutes.js';
import logRoutes from './routes/logRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// 1. Security Headers via Helmet
app.use(helmet());

// 2. CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in development, can restrict in production
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Request Parsing & Rate Limiting
app.use(express.json({ limit: '1mb' }));
app.use('/api/', standardLimiter);

// 4. Request Logging (in development)
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.url}`);
  next();
});

// 5. Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: NODE_ENV,
  });
});

// 6. Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/devices', scheduleRoutes);
app.use('/api/devices', commandRoutes);
app.use('/api/devices', logRoutes);

// 7. Error & 404 Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// 8. Start Background Services
mqttService.connect();

if (process.env.MOCK_DEVICE === 'true' || !process.env.MQTT_BROKER_URL) {
  mockDeviceSimulator.start();
}

// 9. Start HTTP Server
const server = app.listen(PORT, () => {
  logger.info(`===================================================`);
  logger.info(` Gate Control Backend running on port: ${PORT}`);
  logger.info(` Environment: ${NODE_ENV}`);
  logger.info(` Mode: ${process.env.MOCK_DEVICE === 'true' ? 'MOCK_DEVICE (Virtual ESP32 Simulator)' : 'PRODUCTION'}`);
  logger.info(` Health Check: http://localhost:${PORT}/health`);
  logger.info(`===================================================`);
});

// Graceful Shutdown
const shutdown = () => {
  logger.info('Shutting down server gracefully...');
  mockDeviceSimulator.stop();
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
