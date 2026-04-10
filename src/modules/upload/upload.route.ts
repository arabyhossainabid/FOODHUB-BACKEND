import express, { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import cloudinary from '../../services/cloudinary';
import config from '../../config/env';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!config.cloudinary_cloud_name || !config.cloudinary_api_key || !config.cloudinary_api_secret) {
      throw { statusCode: 500, message: 'Cloudinary is not configured properly' };
    }

    if (!req.file) {
      throw { statusCode: 400, message: 'Image file is required' };
    }

    const folder = req.body.folder || config.cloudinary_folder;
    const base64 = req.file.buffer.toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Image uploaded successfully',
      data: {
        publicId: result.public_id,
        secureUrl: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
      },
    });
  } catch (error) {
    next(error);
  }
};

router.post('/image', auth(Role.PROVIDER, Role.ADMIN), upload.single('image'), uploadImage);

export const UploadRoutes = router;
