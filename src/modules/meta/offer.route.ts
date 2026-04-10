import express from 'express';
import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
const router = express.Router();

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

// Get All Active Offers (Public)
const getAllOffers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const offers = await prisma.offer.findMany({
      orderBy: { createdAt: 'desc' }
    });
    const activeOffers = offers.filter(isOfferCurrentlyValid);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Offers retrieved successfully',
      data: activeOffers
    });
  } catch (error) {
    next(error);
  }
};

router.get('/', getAllOffers);

export const OfferRoutes = router;
