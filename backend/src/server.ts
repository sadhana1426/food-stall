import app from './app';
import { config } from './config/env';
import { connectDB } from './config/database';

const startServer = async () => {
  await connectDB();

  const server = app.listen(parseInt(config.PORT, 10), '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${config.PORT} in ${config.NODE_ENV} mode on 0.0.0.0`);
  });

  process.on('unhandledRejection', (err: any) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });
};

startServer();
