import express from 'express';
import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';

const router = express.Router();

// GET /organizer/stats (Organizer dashboard)
const getOrganizerStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [activeOffers, newsletterSubscribers, publishedBlogs, homeContentActive] = await Promise.all([
      prisma.offer.count({
        where: { isActive: true, code: { not: null } },
      }),
      prisma.newsletterSubscriber.count(),
      prisma.blogPost.count({ where: { isPublished: true } }),
      prisma.homeContent.count({ where: { isActive: true } }),
    ]);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Organizer stats retrieved successfully',
      data: {
        activeOffers,
        newsletterSubscribers,
        publishedBlogs,
        homeContentActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

router.get('/stats', auth(Role.ORGANIZER), getOrganizerStats);

export const OrganizerRoutes = router;

