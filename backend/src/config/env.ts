import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/callbreak',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  isProduction: process.env.NODE_ENV === 'production',
};
