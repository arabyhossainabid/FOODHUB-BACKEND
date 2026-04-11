import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';

const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.getAllUsers();
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Users retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      throw { statusCode: 400, message: 'isActive must be a boolean' };
    }

    const result = await AdminService.updateUserStatus(id as string, isActive);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: `User ${isActive ? 'activated' : 'suspended'} successfully`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const admin = req.user;
    if (!admin) {
      throw { statusCode: 401, message: 'Unauthorized' };
    }

    await AdminService.deleteUser(id as string, (admin as { id: string }).id);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'User account deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.getAllOrders();
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Orders retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.getDashboardStats();
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Dashboard statistics retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getAllReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.getAllReviews();
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Reviews retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await AdminService.deleteReview(id as string);
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Review deleted successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

const getAllOffers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.getAllOffers();
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Offers retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const createOffer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.createOffer(req.body);
    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Offer created successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateOffer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await AdminService.updateOffer(id as string, req.body);
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Offer updated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteOffer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await AdminService.deleteOffer(id as string);
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Offer deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const getHomeContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.getHomeContent();
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Home content retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const upsertHomeContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, isActive } = req.body ?? {};
    if (!content || typeof content !== 'object') {
      throw { statusCode: 400, message: 'content object is required' };
    }

    const result = await AdminService.upsertHomeContent(content, isActive ?? true);
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Home content saved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const AdminController = {
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getAllOrders,
  getDashboardStats,
  getAllReviews,
  deleteReview,
  getAllOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  getHomeContent,
  upsertHomeContent,
};
