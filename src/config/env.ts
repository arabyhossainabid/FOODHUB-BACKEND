import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  port: process.env.PORT || 5000,
  database_url: process.env.DATABASE_URL,
  jwt_secret: process.env.JWT_SECRET || 'supersecret',
  jwt_expires_in: process.env.JWT_EXPIRES_IN || '1d',
  node_env: process.env.NODE_ENV || 'development',
  frontend_url: process.env.FRONTEND_URL,
  app_url: process.env.APP_URL,
  google_client_id: process.env.GOOGLE_CLIENT_ID,
  google_client_secret: process.env.GOOGLE_CLIENT_SECRET,
  google_callback_url: process.env.GOOGLE_CALLBACK_URL,
};
