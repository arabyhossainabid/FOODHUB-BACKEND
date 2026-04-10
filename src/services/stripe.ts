import Stripe from 'stripe';
import config from '../config/env';

if (!config.stripe_secret_key) {
  throw new Error('STRIPE_SECRET_KEY is required to initialize Stripe');
}

const stripe = new Stripe(config.stripe_secret_key, {
  apiVersion: '2025-03-31.basil',
});

export default stripe;
