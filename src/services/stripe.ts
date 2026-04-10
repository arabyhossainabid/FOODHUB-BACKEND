import Stripe from 'stripe';
import config from '../config/env';

const stripe = config.stripe_secret_key
  ? new Stripe(config.stripe_secret_key, {
      apiVersion: '2026-03-25.dahlia',
    })
  : null;

export const getStripeOrThrow = () => {
  if (!stripe) {
    throw { statusCode: 500, message: 'Stripe is not configured on the server' };
  }
  return stripe;
};

export default stripe;
