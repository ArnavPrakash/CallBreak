import mongoose from 'mongoose';
import { env } from '../config/env';

export async function connectDB(): Promise<void> {
  const uri = env.mongodbUri;
  if (!uri) {
    console.error('MONGODB_URI is not defined');
    process.exit(1);
  }

  const connectWithRetry = async (retries = 1): Promise<void> => {
    try {
      await mongoose.connect(uri);
      console.log('MongoDB connected');
    } catch (err) {
      console.error('MongoDB connection failed:', err);
      if (retries > 0) {
        console.log('Retrying in 3s...');
        await new Promise((r) => setTimeout(r, 3000));
        return connectWithRetry(retries - 1);
      }
      process.exit(1);
    }
  };

  await connectWithRetry();
}
