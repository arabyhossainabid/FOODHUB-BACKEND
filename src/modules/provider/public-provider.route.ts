import express from 'express';
import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';

const router = express.Router();

// Get all providers (Public)
const getAllProviders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const providers = await prisma.providerProfile.findMany({
      include: { user: { select: { name: true, email: true } } }
    });
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Providers retrieved successfully',
      data: providers
    });
  } catch (error) {
    next(error);
  }
};

// Get provider details (Public)
const getProviderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      throw { statusCode: 400, message: 'Invalid provider ID' };
    }
    const provider = await prisma.providerProfile.findUnique({
      where: { id: id as string },
      include: {
        user: { select: { name: true, email: true } },
        meals: true
      }
    });

    if (!provider) {
      throw { statusCode: 404, message: 'Provider not found' };
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Provider retrieved successfully',
      data: provider
    });
  } catch (error) {
    next(error);
  }
};

router.get('/', getAllProviders);
router.get('/:id', getProviderById);

export const PublicProviderRoutes = router;
