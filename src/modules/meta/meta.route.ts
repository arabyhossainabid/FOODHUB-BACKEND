import express from 'express';
import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { Role } from '@prisma/client';
import { z } from 'zod';

const router = express.Router();
const newsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
});
const validateOfferSchema = z.object({
  code: z.string().min(1, 'Offer code is required'),
  subtotal: z.number().int().min(0, 'Subtotal must be a positive amount'),
});

const isOfferCurrentlyValid = (offer: {
  isActive: boolean;
  startsAt: Date | null;
  expiresAt: Date | null;
  usageLimit: number | null;
  usedCount: number;
}) => {
  const now = new Date();
  if (!offer.isActive) return false;
  if (offer.startsAt && offer.startsAt > now) return false;
  if (offer.expiresAt && offer.expiresAt < now) return false;
  if (offer.usageLimit !== null && offer.usedCount >= offer.usageLimit) return false;
  return true;
};

const calculateOfferDiscount = (
  offer: {
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    minOrderAmount: number;
    maxDiscountAmount: number | null;
  },
  subtotal: number,
) => {
  if (subtotal < offer.minOrderAmount) return 0;
  const rawDiscount =
    offer.discountType === 'PERCENTAGE'
      ? Math.round((subtotal * offer.discountValue) / 100)
      : Math.round(offer.discountValue);
  const cappedDiscount =
    offer.maxDiscountAmount !== null
      ? Math.min(rawDiscount, offer.maxDiscountAmount)
      : rawDiscount;
  return Math.max(0, Math.min(cappedDiscount, subtotal));
};


// Get Public Global Stats (for homepage)
const getPublicStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const statsResult = await Promise.all([
      prisma.user.count({ where: { role: Role.CUSTOMER } }),
      prisma.meal.count(),
      prisma.user.count({ where: { role: Role.PROVIDER } }),
      prisma.providerProfile.findMany({ select: { address: true } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.review.aggregate({
        _avg: { rating: true }
      })
    ]);

    const [totalUsers, totalMeals, totalProviders, providerAddresses, deliveredOrders, reviewStats] = statsResult;
    const cityCount = new Set(
      providerAddresses
        .map((item) => item.address?.split(',').pop()?.trim().toLowerCase())
        .filter((city): city is string => Boolean(city)),
    ).size;

    res.status(200).json({
      success: true,
      data: {
        customers: totalUsers || 0,
        chefs: totalProviders || 0,
        meals: totalMeals || 0,
        radius: cityCount,
        deliveredOrders: deliveredOrders || 0,
        rating: reviewStats?._avg?.rating || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get All Active Offers (Public)
const getAllOffers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const offers = await prisma.offer.findMany({
      where: {
        code: { not: null },
      },
      orderBy: { createdAt: 'desc' }
    });
    const activeOffers = offers.filter(isOfferCurrentlyValid);
    res.status(200).json({ success: true, data: activeOffers });
  } catch (error) {
    next(error);
  }
};

const validateOfferCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, subtotal } = validateOfferSchema.parse(req.body);
    const normalizedCode = code.trim().toUpperCase();
    const offer = await prisma.offer.findUnique({
      where: { code: normalizedCode },
    });

    if (!offer || !offer.code || !isOfferCurrentlyValid(offer)) {
      throw { statusCode: 404, message: 'Invalid or inactive offer code' };
    }

    const discountAmount = calculateOfferDiscount(offer, subtotal);
    if (discountAmount <= 0) {
      throw { statusCode: 400, message: `Order must be at least ${offer.minOrderAmount} for this offer` };
    }

    res.status(200).json({
      success: true,
      data: {
        code: offer.code,
        title: offer.title,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        discountAmount,
        subtotal,
        finalTotal: subtotal - discountAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get Published Blog Posts (Public)
const getAllBlogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    next(error);
  }
};

// Get Single Blog Post (Public)
const getBlogById = async (req: Request, res: Response, next: NextFunction) => {
  const blogId = String(req.params.id);
  try {
    const post = await prisma.blogPost.findFirst({
      where: { id: blogId, isPublished: true }
    });

    if (!post) {
      throw { statusCode: 404, message: 'Blog post not found' };
    }

    res.status(200).json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};

const getHomeContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const homeContent = await prisma.homeContent.findFirst({
      where: { key: 'HOME_PAGE', isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (!homeContent) {
      return res.status(200).json({
        success: true,
        data: {
          hero: {},
          processSteps: [],
          story: {},
          mobileApp: { features: [] },
        },
      });
    }

    res.status(200).json({
      success: true,
      data: homeContent.content,
    });
  } catch (error) {
    next(error);
  }
};

const subscribeNewsletter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = newsletterSchema.parse(req.body);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id BIGSERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await prisma.$executeRaw`
      INSERT INTO newsletter_subscribers (email)
      VALUES (${email})
      ON CONFLICT (email) DO NOTHING
    `;

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Subscribed successfully',
      data: { email },
    });
  } catch (error) {
    next(error);
  }
};

router.get('/stats', getPublicStats);
router.get('/offers', getAllOffers);
router.post('/offers/validate', validateOfferCode);
router.get('/blogs', getAllBlogs);
router.get('/blogs/:id', getBlogById);
router.get('/home-content', getHomeContent);
router.post('/newsletter', subscribeNewsletter);

export const MetaRoutes = router;
