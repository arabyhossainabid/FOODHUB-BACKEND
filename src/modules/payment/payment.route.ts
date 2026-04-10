import express, { NextFunction, Request, Response } from 'express';
import Stripe from 'stripe';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import prisma from '../../config/prisma';
import config from '../../config/env';
import { getStripeOrThrow } from '../../services/stripe';
import { createCheckoutSessionSchema, createPaymentIntentSchema, syncPaymentSchema } from './payment.validation';

const router = express.Router();

const getPublicPaymentConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        publishableKey: config.stripe_publishable_key || '',
        currency: config.stripe_currency,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stripe = getStripeOrThrow();
    const user = req.user as { id: string } | undefined;
    if (!user) {
      throw { statusCode: 401, message: 'User not authenticated' };
    }

    const { orderId } = createPaymentIntentSchema.parse(req.body);
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
    });

    if (!order) {
      throw { statusCode: 404, message: 'Order not found' };
    }
    if (order.paymentStatus === 'PAID') {
      throw { statusCode: 400, message: 'Order already paid' };
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100),
      currency: config.stripe_currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId: order.id,
        userId: user.id,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentIntentId: paymentIntent.id },
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Payment intent created successfully',
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: order.totalAmount,
        currency: config.stripe_currency,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createCheckoutSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stripe = getStripeOrThrow();
    const user = req.user as { id: string } | undefined;
    if (!user) {
      throw { statusCode: 401, message: 'User not authenticated' };
    }

    const { orderId } = createCheckoutSessionSchema.parse(req.body);
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
    });

    if (!order) {
      throw { statusCode: 404, message: 'Order not found' };
    }
    if (order.paymentStatus === 'PAID') {
      throw { statusCode: 400, message: 'Order already paid' };
    }

    const frontendBase = config.frontend_url || 'http://localhost:3000';
    const successUrl = `${frontendBase}/orders/success?orderId=${encodeURIComponent(order.id)}`;
    const cancelUrl = `${frontendBase}/checkout?orderId=${encodeURIComponent(order.id)}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_creation: 'if_required',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: config.stripe_currency.toLowerCase(),
            unit_amount: Math.round(order.totalAmount * 100),
            product_data: {
              name: `FoodHub Order #${order.id.slice(-8).toUpperCase()}`,
              description: 'FoodHub checkout payment',
            },
          },
        },
      ],
      metadata: {
        orderId: order.id,
        userId: user.id,
      },
      payment_intent_data: {
        metadata: {
          orderId: order.id,
          userId: user.id,
        },
      },
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Checkout session created successfully',
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    next(error);
  }
};

const syncPaymentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stripe = getStripeOrThrow();
    const user = req.user as { id: string } | undefined;
    if (!user) {
      throw { statusCode: 401, message: 'User not authenticated' };
    }

    const { orderId, paymentIntentId } = syncPaymentSchema.parse(req.body);
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
    });

    if (!order) {
      throw { statusCode: 404, message: 'Order not found' };
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const isPaid = paymentIntent.status === 'succeeded';

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: isPaid ? 'PAID' : 'FAILED',
        transactionId:
          typeof paymentIntent.latest_charge === 'string'
            ? paymentIntent.latest_charge
            : undefined,
        paymentIntentId: paymentIntent.id,
      },
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Payment status synchronized',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const handleStripeWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stripe = getStripeOrThrow();
    const signature = req.headers['stripe-signature'];
    if (!signature || typeof signature !== 'string') {
      throw { statusCode: 400, message: 'Missing Stripe signature' };
    }
    if (!config.stripe_webhook_secret) {
      throw { statusCode: 500, message: 'Stripe webhook secret is not configured' };
    }

    if (!Buffer.isBuffer(req.body)) {
      throw { statusCode: 400, message: 'Invalid webhook payload format' };
    }

    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      config.stripe_webhook_secret,
    );

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as any;
      const orderId = pi.metadata?.orderId;
      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'PAID',
            transactionId:
              typeof pi.latest_charge === 'string' ? pi.latest_charge : undefined,
            paymentIntentId: pi.id,
          },
        });
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object as any;
      const orderId = pi.metadata?.orderId;
      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'FAILED',
            paymentIntentId: pi.id,
          },
        });
      }
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object as any;
      const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : '';
      if (paymentIntentId) {
        const order = await prisma.order.findFirst({ where: { paymentIntentId } });
        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'REFUNDED' },
          });
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};

router.post('/intent', auth(Role.CUSTOMER), createPaymentIntent);
router.post('/checkout-session', auth(Role.CUSTOMER), createCheckoutSession);
router.post('/sync', auth(Role.CUSTOMER), syncPaymentStatus);
router.get('/config', getPublicPaymentConfig);
router.post('/webhook', handleStripeWebhook);

export const PaymentRoutes = router;
