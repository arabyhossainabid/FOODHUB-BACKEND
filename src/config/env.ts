import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  port: process.env.PORT || 5050,
  database_url: process.env.DATABASE_URL,
  jwt_secret: process.env.JWT_SECRET || 'supersecret',
  jwt_expires_in: process.env.JWT_EXPIRES_IN || '1d',
  node_env: process.env.NODE_ENV || 'development',
  frontend_url: process.env.FRONTEND_URL || 'http://localhost:3000',
  app_url: process.env.APP_URL || 'http://localhost:5000',
  google_client_id: process.env.GOOGLE_CLIENT_ID,
  google_client_secret: process.env.GOOGLE_CLIENT_SECRET,
  google_callback_url: process.env.GOOGLE_CALLBACK_URL,
  stripe_secret_key: process.env.STRIPE_SECRET_KEY,
  stripe_publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
  stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
  stripe_currency: process.env.STRIPE_CURRENCY || 'usd',
  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
  cloudinary_folder: process.env.CLOUDINARY_FOLDER || 'foodhub',
  openrouter_api_key: process.env.OPENROUTER_API_KEY,
};
