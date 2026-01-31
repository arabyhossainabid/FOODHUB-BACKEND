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

export const AdminController = {
  getAllUsers,
  updateUserStatus,
  getAllOrders,
  getDashboardStats,
  getAllReviews,
  deleteReview
};
