import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { ValidationError } from './error.middleware';
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from '../utils/constants';

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Create subdirectories
const subdirs = ['products', 'shops', 'users', 'categories'];
subdirs.forEach(dir => {
  const dirPath = path.join(uploadDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    // Determine subdirectory based on route or file fieldname
    let subdir = 'general';
    
    if (file.fieldname.includes('product') || req.baseUrl.includes('product')) {
      subdir = 'products';
    } else if (file.fieldname.includes('shop') || req.baseUrl.includes('shop')) {
      subdir = 'shops';
    } else if (file.fieldname.includes('avatar') || file.fieldname.includes('user') || req.baseUrl.includes('user')) {
      subdir = 'users';
    } else if (file.fieldname.includes('category') || req.baseUrl.includes('category')) {
      subdir = 'categories';
    }

    const dest = path.join(uploadDir, subdir);
    cb(null, dest);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  },
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(new ValidationError('نوع الملف غير مدعوم. الملفات المسموحة: JPEG, PNG, WebP'));
    return;
  }

  cb(null, true);
};

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5, // Maximum 5 files per request
  },
});

// Single file upload
export const uploadSingle = (fieldName: string) => upload.single(fieldName);

// Multiple files upload
export const uploadMultiple = (fieldName: string, maxCount: number = 5) => {
  return upload.array(fieldName, maxCount);
};

// Mixed files upload
export const uploadMixed = (fields: multer.Field[]) => {
  return upload.fields(fields);
};

// Delete file helper
export const deleteFile = async (filePath: string): Promise<boolean> => {
  try {
    const fullPath = path.join(uploadDir, filePath);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Get file URL helper
export const getFileUrl = (filename: string, folder: string): string => {
  const baseUrl = process.env.API_URL || 'http://localhost:3000';
  return `${baseUrl}/uploads/${folder}/${filename}`;
};

// Image processing helper (using sharp)
import sharp from 'sharp';

export const processImage = async (
  inputPath: string,
  outputPath: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  } = {}
): Promise<string> => {
  const {
    width = 800,
    height,
    quality = 80,
    format = 'jpeg',
  } = options;

  let pipeline = sharp(inputPath);

  // Resize
  pipeline = pipeline.resize(width, height, {
    fit: 'inside',
    withoutEnlargement: true,
  });

  // Convert format
  switch (format) {
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality });
      break;
    case 'png':
      pipeline = pipeline.png({ quality });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality });
      break;
  }

  await pipeline.toFile(outputPath);
  return outputPath;
};

// Create thumbnail
export const createThumbnail = async (
  inputPath: string,
  outputPath: string
): Promise<string> => {
  return processImage(inputPath, outputPath, {
    width: 200,
    height: 200,
    quality: 70,
    format: 'jpeg',
  });
};

// Error handler for multer
export const handleUploadError = (error: any, req: Request, res: Response, next: any) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return next(new ValidationError('حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت'));
      case 'LIMIT_FILE_COUNT':
        return next(new ValidationError('عدد الملفات كبير جداً'));
      case 'LIMIT_UNEXPECTED_FILE':
        return next(new ValidationError('حقل الملف غير متوقع'));
      default:
        return next(new ValidationError('خطأ في رفع الملف'));
    }
  }
  next(error);
};
